import { create } from 'zustand';
import type { FileData } from '../components/files/FileList';
import { supabase } from '../lib/supabase';

interface FileStore {
    files: FileData[];
    isUnlocked: boolean;
    isProcessing: boolean;
    globalProgress: number;
    accessKey: string;
    jobId: string | null;

    addFiles: (newFiles: File[]) => Promise<void>;
    removeFile: (id: string) => void;
    unlock: (key: string) => void;
    startProcessing: () => Promise<void>;
    setFileStatus: (id: string, status: FileData['status']) => void;
    downloadFile: (id: string) => Promise<void>;
    downloadZip: () => Promise<void>;
}

export const useFileStore = create<FileStore>((set, get) => ({
    files: [],
    isUnlocked: false,
    isProcessing: false,
    globalProgress: 0,
    accessKey: '',
    jobId: null,

    unlock: (key: string) => set({ isUnlocked: true, accessKey: key }),

    addFiles: async (newFiles: File[]) => {
        const { accessKey, jobId } = get();
        console.log('[Store] Adding files...', { count: newFiles.length, hasJob: !!jobId });

        // 1. Pre-add files to UI for immediate feedback
        const pendingFiles = newFiles.map(file => {
            const id = Math.random().toString(36).substring(7);
            const isMp4 = file.name.toLowerCase().endsWith('.mp4');
            const isJpg = file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');
            const fileType = isMp4 ? 'mp4' : (isJpg ? 'jpg' : 'other');

            return {
                id,
                name: file.name,
                size: file.size,
                type: fileType as any,
                status: 'uploaded' as const,
                fileRaw: file // Temporary store for the raw file
            };
        });

        set(state => ({ files: [...state.files, ...pendingFiles] }));

        try {
            // 2. Create Job if it doesn't exist
            let currentJobId = jobId;
            if (!currentJobId) {
                console.log('[Store] Creating new job...');
                const { data, error } = await supabase
                    .from('jobs')
                    .insert([{ access_key: accessKey }])
                    .select()
                    .single();

                if (error) {
                    console.error('[Store] Error creating job:', error);
                    pendingFiles.forEach(f => get().setFileStatus(f.id, 'error'));
                    return;
                }
                currentJobId = data.id;
                set({ jobId: currentJobId });
                console.log('[Store] Job created:', currentJobId);
            }

            // 3. Upload files to Storage and DB
            for (const f of pendingFiles) {
                const storagePath = `${currentJobId}/${f.id}_${f.name}`;
                console.log(`[Store] Uploading ${f.name}...`);

                const { error: uploadError } = await supabase.storage
                    .from('originals')
                    .upload(storagePath, f.fileRaw);

                if (uploadError) {
                    console.error(`[Store] Upload error for ${f.name}:`, uploadError);
                    get().setFileStatus(f.id, 'error');
                    continue;
                }

                const { error: dbError } = await supabase
                    .from('files')
                    .insert([{
                        id: f.id, // Use the same ID for consistency
                        job_id: currentJobId,
                        original_name: f.name,
                        file_type: f.type,
                        size_bytes: f.size,
                        storage_path_original: storagePath,
                        repair_status: 'pending'
                    }]);

                if (dbError) {
                    console.error(`[Store] DB error for ${f.name}:`, dbError);
                    get().setFileStatus(f.id, 'error');
                } else {
                    console.log(`[Store] ${f.name} successfully uploaded and recorded.`);
                }
            }
        } catch (err) {
            console.error('[Store] Critical failure in addFiles:', err);
            pendingFiles.forEach(f => get().setFileStatus(f.id, 'error'));
        }
    },

    removeFile: (id: string) => set((state) => ({
        files: state.files.filter(f => f.id !== id)
    })),

    startProcessing: async () => {
        const { jobId, files } = get();
        if (!jobId) return;

        set({ isProcessing: true, globalProgress: 10 });

        try {
            await supabase
                .from('jobs')
                .update({ status: 'processing' })
                .eq('id', jobId);

            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
            const response = await fetch(`${BACKEND_URL}/process/${jobId}`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Backend error');

            const pollInterval = setInterval(async () => {
                const { data: updatedFiles, error } = await supabase
                    .from('files')
                    .select('id, repair_status')
                    .eq('job_id', jobId);

                if (error) return;

                let completedCount = 0;
                updatedFiles.forEach(uf => {
                    if (uf.repair_status !== 'pending') {
                        completedCount++;
                        get().setFileStatus(uf.id, uf.repair_status as any);
                    }
                });

                const progress = Math.max(10, (completedCount / files.length) * 100);
                set({ globalProgress: progress });

                if (completedCount === files.length) {
                    clearInterval(pollInterval);
                    set({ isProcessing: false, globalProgress: 100 });
                }
            }, 2000);

        } catch (err) {
            console.error('Processing error:', err);
            set({ isProcessing: false });
        }
    },

    downloadFile: async (id: string) => {
        const { data: fileData, error } = await supabase
            .from('files')
            .select('storage_path_repaired')
            .eq('id', id)
            .single();

        if (error || !fileData?.storage_path_repaired) return;

        const { data, error: dlError } = await supabase.storage
            .from('repaired')
            .createSignedUrl(fileData.storage_path_repaired, 60);

        if (dlError || !data?.signedUrl) return;
        window.open(data.signedUrl, '_blank');
    },

    downloadZip: async () => {
        const { jobId } = get();
        if (!jobId) return;
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        window.open(`${BACKEND_URL}/download-zip/${jobId}`, '_blank');
    },

    setFileStatus: (id: string, status: FileData['status']) => set((state) => ({
        files: state.files.map(f => f.id === id ? { ...f, status } : f)
    })),
}));

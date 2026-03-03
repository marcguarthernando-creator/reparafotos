import React from 'react';
import { FileItem } from './FileItem';
import { AnimatePresence } from 'framer-motion';

export type FileStatus = 'uploaded' | 'processing' | 'repaired' | 'irrecoverable' | 'error';

export interface FileData {
    id: string;
    name: string;
    size: number;
    type: 'jpg' | 'mp4' | 'other';
    status: FileStatus;
    progress?: number;
    errorMsg?: string;
}

interface FileListProps {
    files: FileData[];
    onRemove: (id: string) => void;
    onDownload: (id: string) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, onRemove, onDownload }) => {
    if (files.length === 0) return null;

    return (
        <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Archivos ({files.length})</span>
                <span>Estado</span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {files.map((file) => (
                        <FileItem
                            key={file.id}
                            file={file}
                            onRemove={() => onRemove(file.id)}
                            onDownload={() => onDownload(file.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

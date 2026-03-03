import React, { useState, useCallback } from 'react';
import { Upload, FileVideo, FileImage } from 'lucide-react';
import { motion } from 'framer-motion';

interface DragDropZoneProps {
    onFilesSelected: (files: File[]) => void;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({ onFilesSelected }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            onFilesSelected(files);
        }
    }, [onFilesSelected]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-premium p-12 transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${isDragging
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
            onClick={() => document.getElementById('file-upload')?.click()}
        >
            <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
                accept=".jpg,.jpeg,.mp4"
            />

            <motion.div
                animate={{ y: isDragging ? -10 : 0 }}
                className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isDragging ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'
                    }`}
            >
                <Upload size={36} />
            </motion.div>

            <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 leading-tight">Suelta tus archivos aquí</h3>
                <p className="text-slate-500 max-w-xs mx-auto">
                    Arrastra múltiples <span className="text-slate-900 font-medium">JPG</span> o <span className="text-slate-900 font-medium">MP4</span> para comenzar la reparación.
                </p>
            </div>

            <div className="mt-8 flex gap-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                    <FileImage size={14} /> JPG
                </div>
                <div className="flex items-center gap-1.5">
                    <FileVideo size={14} /> MP4
                </div>
                <span>•</span>
                <span>Hasta 2GB por archivo</span>
            </div>
        </div>
    );
};

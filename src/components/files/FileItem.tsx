import React from 'react';
import { FileVideo, FileImage, X, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FileData } from './FileList';

interface FileItemProps {
    file: FileData;
    onRemove: () => void;
    onDownload: () => void;
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusStyles = (status: FileData['status']) => {
    switch (status) {
        case 'repaired': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'irrecoverable': return 'bg-rose-50 text-rose-600 border-rose-100';
        case 'error': return 'bg-amber-50 text-amber-600 border-amber-100';
        default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
};

const getStatusLabel = (status: FileData['status']) => {
    switch (status) {
        case 'repaired': return 'Reparado';
        case 'processing': return 'Reparando...';
        case 'irrecoverable': return 'Irrecuperable';
        case 'error': return 'Error';
        default: return 'Subido';
    }
};

export const FileItem: React.FC<FileItemProps> = ({ file, onRemove, onDownload }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors group"
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${file.type === 'mp4' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'
                }`}>
                {file.type === 'mp4' ? <FileVideo size={24} /> : <FileImage size={24} />}
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{file.name}</h4>
                <p className="text-xs text-slate-400 font-medium">{formatSize(file.size)}</p>
            </div>

            <div className="flex items-center gap-4">
                <div className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 ${getStatusStyles(file.status)}`}>
                    {file.status === 'processing' && <Loader2 size={14} className="animate-spin" />}
                    {file.status === 'repaired' && <CheckCircle2 size={14} />}
                    {file.status === 'irrecoverable' && <AlertCircle size={14} />}
                    {getStatusLabel(file.status)}
                </div>

                <div className="flex items-center gap-1">
                    {file.status === 'repaired' && (
                        <button
                            onClick={onDownload}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Descargar"
                        >
                            <Download size={18} />
                        </button>
                    )}
                    <button
                        onClick={onRemove}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

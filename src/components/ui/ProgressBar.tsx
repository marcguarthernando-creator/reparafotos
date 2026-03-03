import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number;
    label: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label }) => {
    return (
        <div className="w-full space-y-2 py-6">
            <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                <span className="text-sm font-bold text-slate-900">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-slate-900 rounded-full"
                />
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccessKeyGuardProps {
    onUnlock: (key: string) => void;
}

export const AccessKeyGuard: React.FC<AccessKeyGuardProps> = ({ onUnlock }) => {
    const [key, setKey] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim().length > 3) {
            onUnlock(key);
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    return (
        <div className="max-w-md mx-auto py-12 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
            >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-2">
                    <ShieldCheck size={32} />
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Privado y Seguro</h2>
                    <p className="text-slate-500 mt-1">Introduce tu Access Key para comenzar</p>
                </div>

                <form onSubmit={handleSubmit} className="relative mt-8">
                    <div className="relative group">
                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${error ? 'text-danger' : 'text-slate-400 group-focus-within:text-blue-500'}`}>
                            <KeyRound size={20} />
                        </div>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="••••••••••••"
                            className={`w-full bg-slate-50 border-2 pl-11 pr-14 py-4 rounded-2xl text-lg font-medium outline-none transition-all ${error ? 'border-danger shake' : 'border-slate-100 focus:border-blue-500 focus:bg-white'}`}
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center justify-center"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-danger text-sm font-medium mt-3"
                            >
                                La clave es demasiado corta o no válida
                            </motion.p>
                        )}
                    </AnimatePresence>
                </form>

                <p className="text-xs text-slate-400 pt-4">
                    Si no tienes una clave, contacta con el administrador
                </p>
            </motion.div>
        </div>
    );
};

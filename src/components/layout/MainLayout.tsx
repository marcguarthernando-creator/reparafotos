import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="min-height-screen w-full flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-4xl bg-white rounded-premium shadow-premium overflow-hidden">
                <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">REPARAFOTOS</h1>
                        <p className="text-sm text-slate-500">Reparación profesional de archivos JPG y MP4</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sistema Activo</span>
                    </div>
                </header>
                <main className="p-8">
                    {children}
                </main>
                <footer className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-xs text-slate-400">© 2026 Reparafotos • Uso Privado</p>
                    <p className="text-xs text-slate-400">Los archivos se eliminan tras 24h</p>
                </footer>
            </div>
        </div>
    );
};

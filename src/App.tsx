import { MainLayout } from './components/layout/MainLayout';
import { AccessKeyGuard } from './components/auth/AccessKeyGuard';
import { DragDropZone } from './components/upload/DragDropZone';
import { FileList } from './components/files/FileList';
import { ProgressBar } from './components/ui/ProgressBar';
import { useFileStore } from './store/useFileStore';
import { Play, Download, Trash2 } from 'lucide-react';
import type { FileData } from './components/files/FileList';

function App() {
  const {
    files,
    isUnlocked,
    isProcessing,
    globalProgress,
    addFiles,
    removeFile,
    unlock,
    startProcessing
  } = useFileStore();

  if (!isUnlocked) {
    return (
      <MainLayout>
        <AccessKeyGuard onUnlock={unlock} />
      </MainLayout>
    );
  }

  const hasFiles = files.length > 0;
  const allRepaired = hasFiles && files.every((f: FileData) => f.status === 'repaired' || f.status === 'irrecoverable');

  return (
    <MainLayout>
      <div className="space-y-8">
        <DragDropZone onFilesSelected={addFiles} />

        {isProcessing && (
          <ProgressBar progress={globalProgress} label="Procesando lote de archivos..." />
        )}

        <FileList
          files={files}
          onRemove={removeFile}
          onDownload={(id) => useFileStore.getState().downloadFile(id)}
        />

        {hasFiles && !isProcessing && !allRepaired && (
          <div className="pt-8 flex justify-center">
            <button
              onClick={startProcessing}
              className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <Play size={20} fill="currentColor" />
              Reparar todo el lote
            </button>
          </div>
        )}

        {allRepaired && (
          <div className="pt-8 flex flex-col items-center gap-4">
            <button
              onClick={() => useFileStore.getState().downloadZip()}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
            >
              <Download size={20} />
              Descargar todos en ZIP
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-medium transition-colors"
            >
              <Trash2 size={16} />
              Limpiar y empezar nuevo trabajo
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default App;

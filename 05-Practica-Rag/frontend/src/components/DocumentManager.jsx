import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, File, Loader2, CheckCircle2, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import api from '../api/axios';

export default function DocumentManager({ assistantId, documentCount, onUploadSuccess, onDeleteSuccess, activeDocuments = [], onActiveDocumentsChange }) {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  const fetchDocuments = useCallback(async () => {
    if (!isExpanded) return;
    setLoadingDocs(true);
    try {
      const res = await api.get(`/assistants/${assistantId}/documents`);
      setDocuments(res.data.documents);
      if (onActiveDocumentsChange) {
        onActiveDocumentsChange(res.data.documents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  }, [assistantId, isExpanded]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Si cambia de asistente, se cierra el panel
  useEffect(() => {
    setIsExpanded(false);
  }, [assistantId]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setUploading(true);
    setSuccess(false);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/assistants/${assistantId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess(true);
      if (onUploadSuccess) onUploadSuccess();
      if (isExpanded) fetchDocuments();
      toast.success('Documento subido e ingesta iniciada');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al subir el documento');
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  }, [assistantId, onUploadSuccess, isExpanded, fetchDocuments]);

  const handleDeleteClick = (blobName) => {
    setDocumentToDelete(blobName);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    const blobName = documentToDelete;
    setDocumentToDelete(null); // Cerrar modal inmediatamente
    
    try {
      await api.delete(`/assistants/${assistantId}/documents/${encodeURIComponent(blobName)}`);
      if (onDeleteSuccess) onDeleteSuccess();
      fetchDocuments();
      toast.success('Documento eliminado correctamente');
    } catch (err) {
      toast.error('Error eliminando documento: ' + err.message);
    }
  };

  const toggleDocument = (blobName) => {
    if (!onActiveDocumentsChange) return;
    if (activeDocuments.includes(blobName)) {
      onActiveDocumentsChange(activeDocuments.filter(b => b !== blobName));
    } else {
      onActiveDocumentsChange([...activeDocuments, blobName]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm z-10 flex flex-col">
      <div className="px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="w-1/3 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center justify-between">
            Conocimiento
          </h2>
          <p className="text-sm text-slate-500">
            {documentCount} documento{documentCount !== 1 ? 's' : ''} cargado{documentCount !== 1 ? 's' : ''}
          </p>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 w-fit"
          >
            {isExpanded ? 'Ocultar Documentos' : 'Gestionar Documentos'}
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        
        <div className="flex-1">
          <div 
            {...getRootProps()} 
            className={clsx(
              "border-2 border-dashed rounded-xl p-3 transition-all cursor-pointer flex flex-col items-center justify-center gap-1",
              isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50",
              uploading && "opacity-50 pointer-events-none"
            )}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                <Loader2 size={18} className="animate-spin" />
                <span>Ingestando vectores...</span>
              </div>
            ) : success ? (
              <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                <CheckCircle2 size={18} />
                <span>¡Documento indexado!</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileUp size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Arrastra tu PDF aquí o haz clic</p>
                </div>
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-500 mt-2 text-center font-medium">{error}</p>
          )}
        </div>
      </div>
      
      {/* Panel Expandible de Documentos */}
      {isExpanded && (
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 max-h-60 overflow-y-auto custom-scrollbar">
          {loadingDocs ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-4">No hay documentos en este asistente.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map((blobName) => {
                // Quitar prefijo "assistants/id/uuid-"
                const filePart = blobName.split('/').pop();
                const fileName = filePart.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-/, '') || blobName;
                return (
                  <div key={blobName} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-start group shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-3 overflow-hidden">
                      <div className="text-blue-500 mt-0.5"><FileText size={16} /></div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-slate-700 truncate" title={fileName}>
                          {fileName}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate mt-0.5" title={blobName}>
                          Azure Blob Storage
                        </span>
                        <label className="flex items-center gap-1.5 mt-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={activeDocuments.includes(blobName)}
                            onChange={() => toggleDocument(blobName)}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs text-slate-500 font-medium">Activo para chat</span>
                        </label>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteClick(blobName)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                      title="Eliminar documento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar documento?</h3>
              <p className="text-sm text-slate-500 mb-6">
                El documento y todo su conocimiento asociado serán eliminados permanentemente. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setDocumentToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-600/20"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Trash2, Loader2, UploadCloud, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

export default function DocPanel({ assistantId, activeDocuments, onActiveDocumentsChange }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadOk, setUploadOk] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/assistants/${assistantId}/documents`);
      setDocuments(res.data.documents || []);
      if (onActiveDocumentsChange) onActiveDocumentsChange(res.data.documents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [assistantId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setUploading(true); setUploadOk(false);
    const fd = new FormData();
    fd.append('file', files[0]);
    try {
      await api.post(`/assistants/${assistantId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadOk(true);
      toast.success('PDF subido e indexado');
      fetchDocs();
      setTimeout(() => setUploadOk(false), 4000);
    } catch (e) {
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  }, [assistantId, fetchDocs]);

  const confirmDelete = async () => {
    if (!docToDelete) return;
    const name = docToDelete;
    setDocToDelete(null);
    try {
      await api.delete(`/assistants/${assistantId}/documents/${encodeURIComponent(name)}`);
      toast.success('Documento eliminado');
      fetchDocs();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const toggleDoc = (name) => {
    if (!onActiveDocumentsChange) return;
    const next = activeDocuments.includes(name)
      ? activeDocuments.filter(d => d !== name)
      : [...activeDocuments, name];
    onActiveDocumentsChange(next);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  });

  const cleanName = (blob) => {
    const part = blob.split('/').pop();
    return part.replace(/^[0-9a-fA-F-]{36}-/, '') || blob;
  };

  return (
    <div className="left-panel">
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">Documentos</span>
        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{documents.length}</span>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
        style={{ opacity: uploading ? 0.5 : 1 }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="uploading-bar" style={{ justifyContent: 'center' }}>
            <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Indexando...
          </div>
        ) : uploadOk ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '12px', justifyContent: 'center' }}>
            <CheckCircle2 size={14} /> Indexado
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <UploadCloud size={18} />
            <span style={{ fontSize: '11px' }}>
              {isDragActive ? 'Suelta aquí' : 'Arrastra un PDF o haz clic'}
            </span>
          </div>
        )}
      </div>

      {/* Lista de docs */}
      <div className="scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={16} color="var(--text-3)" style={{ animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '16px 14px', fontSize: '12px', color: 'var(--text-3)' }}>
            Sin documentos. Sube un PDF.
          </div>
        ) : (
          documents.map(blob => {
            const name = cleanName(blob);
            const isActive = activeDocuments.includes(blob);
            return (
              <div
                key={blob}
                className={`doc-item ${isActive ? 'selected' : ''}`}
                onClick={() => toggleDoc(blob)}
                title={name}
              >
                <FileText size={12} style={{ flexShrink: 0 }} />
                <span className="doc-name">{name}</span>
                <button
                  className="doc-del"
                  onClick={e => { e.stopPropagation(); setDocToDelete(blob); }}
                  title="Eliminar"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Leyenda */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: '10px', color: 'var(--text-3)', lineHeight: 1.5 }}>
        Haz clic en un doc para activarlo en el chat
      </div>

      {/* Modal eliminar doc */}
      {docToDelete && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-body">
              <p className="modal-title">Eliminar documento</p>
              <p className="modal-desc">
                ¿Eliminar <strong style={{ color: 'var(--text-1)' }}>{cleanName(docToDelete)}</strong>?
                Sus vectores se borrarán del índice.
              </p>
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setDocToDelete(null)}>Cancelar</button>
                <button className="btn-danger" onClick={confirmDelete}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

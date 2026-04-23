import { useState, useEffect } from 'react';
import { X, Loader2, Wand2 } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';

export default function CreateAssistantModal({ isOpen, onClose, onCreated, onEdited, assistantToEdit }) {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (assistantToEdit) {
      setName(assistantToEdit.name);
      setSystemPrompt(assistantToEdit.system_prompt);
    } else {
      setName('');
      setSystemPrompt('');
    }
    setError(null);
  }, [assistantToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (assistantToEdit) {
        const res = await api.put(`/assistants/${assistantToEdit.id}`, { name, system_prompt: systemPrompt });
        if (onEdited) onEdited(res.data);
      } else {
        const res = await api.post('/assistants', { name, system_prompt: systemPrompt });
        if (onCreated) onCreated(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar el asistente');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!name.trim()) { toast.error('Escribe primero un nombre para generar el prompt.'); return; }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await api.post('/assistants/generate-prompt', { description: name });
      setSystemPrompt(res.data.prompt);
      toast.success('Prompt generado con IA');
    } catch {
      toast.error('Error al generar el prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '460px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="modal-title" style={{ margin: 0 }}>
            {assistantToEdit ? 'Editar asistente' : 'Nuevo asistente'}
          </p>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Nombre</label>
              <input
                required type="text" className="input-field"
                placeholder="Ej. Analista Financiero"
                value={name} onChange={e => setName(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>System Prompt</label>
                <button
                  type="button" onClick={handleGeneratePrompt}
                  disabled={isGenerating || loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius)', fontSize: '11px', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', opacity: (isGenerating || loading) ? 0.5 : 1 }}
                >
                  {isGenerating ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Wand2 size={11} />}
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  Generar con IA
                </button>
              </div>
              <textarea
                required rows={5} className="input-field"
                style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                placeholder="Eres un experto en..."
                value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
              />
            </div>
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {loading && <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />}
              {assistantToEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

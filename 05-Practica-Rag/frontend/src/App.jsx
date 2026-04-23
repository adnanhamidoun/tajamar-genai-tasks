import { useState, useEffect } from 'react';
import { Plus, BookOpen, Zap, Settings } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import api from './api/axios';
import { TECH_ASSISTANT_ID } from './constants';
import WorkspaceLayout from './components/WorkspaceLayout';
import CreateAssistantModal from './components/CreateAssistantModal';

function App() {
  const [assistants, setAssistants] = useState([]);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('selectedAssistantId') || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assistantToEdit, setAssistantToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assistantToDelete, setAssistantToDelete] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/assistants');
        setAssistants(res.data);
        const saved = localStorage.getItem('selectedAssistantId');
        if (!saved) {
          setSelectedId(TECH_ASSISTANT_ID);
          localStorage.setItem('selectedAssistantId', TECH_ASSISTANT_ID);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const selectTab = (id) => {
    setSelectedId(id);
    localStorage.setItem('selectedAssistantId', id);
  };

  const handleCreated = (a) => {
    setAssistants(prev => [...prev, a]);
    selectTab(a.id);
    toast.success(`Asistente "${a.name}" creado`);
  };

  const handleEdited = (a) => {
    setAssistants(prev => prev.map(x => x.id === a.id ? a : x));
    toast.success('Asistente actualizado');
  };

  const confirmDelete = async () => {
    if (!assistantToDelete) return;
    const id = assistantToDelete;
    setAssistantToDelete(null);
    if (id === TECH_ASSISTANT_ID) { toast.error('El asistente del sistema no se puede eliminar.'); return; }
    try {
      await api.delete(`/assistants/${id}`);
      setAssistants(prev => prev.filter(a => a.id !== id));
      if (selectedId === id) selectTab(TECH_ASSISTANT_ID);
      toast.success('Asistente eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  const selectedAssistant = assistants.find(a => a.id === selectedId);
  const techAssistant = assistants.find(a => a.id === TECH_ASSISTANT_ID);
  const userAssistants = assistants.filter(a => a.id !== TECH_ASSISTANT_ID);

  if (loading) return (
    <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid var(--border-2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize: '12px', color: 'var(--text-3)', letterSpacing: '0.08em' }}>INICIANDO</span>
    </div>
  );

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── TOPBAR ─────────────────────────────────────── */}
      <div className="topbar">
        <div className="topbar-logo">
          <BookOpen size={14} color="var(--accent)" />
          Aisla<span>-RAG</span>
        </div>

        {/* Tabs de asistentes */}
        <div className="tab-scroll">
          {/* Asistente sistema */}
          {techAssistant && (
            <button
              className={`tab system ${selectedId === TECH_ASSISTANT_ID ? 'active' : ''}`}
              onClick={() => selectTab(TECH_ASSISTANT_ID)}
            >
              <Zap size={11} />
              {techAssistant.name}
              <span className="badge">sys</span>
            </button>
          )}

          {/* Separador */}
          {userAssistants.length > 0 && (
            <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />
          )}

          {/* Tabs de usuario */}
          {userAssistants.map(a => (
            <button
              key={a.id}
              className={`tab ${selectedId === a.id ? 'active' : ''}`}
              onClick={() => selectTab(a.id)}
              onContextMenu={e => { e.preventDefault(); setAssistantToDelete(a.id); }}
              title="Click derecho para eliminar"
            >
              <span className="tab-dot" />
              {a.name}
            </button>
          ))}

          <button className="tab-new" onClick={() => { setAssistantToEdit(null); setIsModalOpen(true); }}>
            <Plus size={11} /> Nuevo
          </button>
        </div>

        {/* Estado */}
        <div className="topbar-status">
          <span className="status-dot" />
          Online
        </div>
      </div>

      {/* ── WORKSPACE ──────────────────────────────────── */}
      <div className="workspace">
        {selectedAssistant ? (
          <WorkspaceLayout
            assistant={selectedAssistant}
            isTech={selectedId === TECH_ASSISTANT_ID}
            onEdit={() => { setAssistantToEdit(selectedAssistant); setIsModalOpen(true); }}
            onDelete={() => setAssistantToDelete(selectedId)}
          />
        ) : (
          <div className="empty-state" style={{ width: '100%' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>⌘</div>
            <p className="empty-label">Selecciona un asistente</p>
            <p className="empty-sub">Elige uno de los tabs de arriba o crea uno nuevo.</p>
          </div>
        )}
      </div>

      {/* ── MODALES ─────────────────────────────────────── */}
      <CreateAssistantModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setAssistantToEdit(null); }}
        onCreated={handleCreated}
        onEdited={handleEdited}
        assistantToEdit={assistantToEdit}
      />

      {assistantToDelete && assistantToDelete !== TECH_ASSISTANT_ID && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-body">
              <p className="modal-title">Eliminar asistente</p>
              <p className="modal-desc">
                ¿Eliminar "{assistants.find(a => a.id === assistantToDelete)?.name}"? Esta acción no se puede deshacer.
              </p>
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setAssistantToDelete(null)}>Cancelar</button>
                <button className="btn-danger" onClick={confirmDelete}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" richColors closeButton theme="dark" />
    </>
  );
}

export default App;

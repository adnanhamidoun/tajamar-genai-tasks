import { Bot, Plus, Trash2, Pencil, LifeBuoy, BookOpen, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { TECH_ASSISTANT_ID } from '../constants';

export default function Sidebar({ assistants, selectedId, onSelect, onOpenModal, onEdit, onDelete }) {
  const techAssistant = assistants.find(a => a.id === TECH_ASSISTANT_ID);
  const userAssistants = assistants.filter(a => a.id !== TECH_ASSISTANT_ID);

  return (
    <div style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-dark)' }}
      className="w-64 text-slate-300 flex flex-col h-full shrink-0">

      {/* Header */}
      <div style={{ backgroundColor: 'var(--sidebar-2)', borderBottom: '1px solid var(--border-dark)' }}
        className="px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div style={{ backgroundColor: 'var(--accent)', borderRadius: '6px' }}
            className="w-7 h-7 flex items-center justify-center shrink-0">
            <BookOpen size={14} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ color: '#fafaf9', fontWeight: 600, fontSize: '14px', letterSpacing: '0.01em' }}>
              Aisla-RAG
            </h1>
            <p style={{ color: '#a8a29e', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Document Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Contenido desplazable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 flex flex-col gap-4">

        {/* Sección Sistema */}
        {techAssistant && (
          <div>
            <p style={{ color: '#57534e', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px', paddingLeft: '6px' }}>
              Sistema
            </p>
            <button
              onClick={() => onSelect(techAssistant.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '7px',
                border: '1px solid',
                borderColor: selectedId === techAssistant.id ? 'rgba(194,65,12,0.4)' : 'transparent',
                backgroundColor: selectedId === techAssistant.id ? 'rgba(194,65,12,0.12)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (selectedId !== techAssistant.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (selectedId !== techAssistant.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <LifeBuoy size={15} color={selectedId === techAssistant.id ? '#fb923c' : '#78716c'} />
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: selectedId === techAssistant.id ? '#fed7aa' : '#d6d3d1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {techAssistant.name}
              </span>
              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 5px', borderRadius: '4px', backgroundColor: 'rgba(194,65,12,0.15)', color: '#fb923c', border: '1px solid rgba(194,65,12,0.25)', whiteSpace: 'nowrap' }}>
                Sistema
              </span>
            </button>
          </div>
        )}

        {/* Separador */}
        <div style={{ height: '1px', backgroundColor: 'var(--border-dark)', margin: '0 2px' }} />

        {/* Mis asistentes */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2" style={{ paddingLeft: '6px' }}>
            <p style={{ color: '#57534e', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Mis Asistentes
            </p>
            <button
              onClick={onOpenModal}
              title="Crear nuevo asistente"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-dark)', borderRadius: '5px', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#a8a29e', fontSize: '11px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e7e5e4'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#a8a29e'; }}
            >
              <Plus size={12} /> Nuevo
            </button>
          </div>

          {userAssistants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 10px', color: '#57534e', fontSize: '12px' }}>
              <Bot size={24} style={{ margin: '0 auto 8px', color: '#44403c' }} />
              Crea tu primer asistente
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {userAssistants.map((assistant) => (
                <div key={assistant.id} style={{ position: 'relative' }} className="group">
                  <button
                    onClick={() => onSelect(assistant.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '8px 10px',
                      paddingRight: '60px',
                      borderRadius: '7px',
                      border: '1px solid',
                      borderColor: selectedId === assistant.id ? 'rgba(194,65,12,0.35)' : 'transparent',
                      backgroundColor: selectedId === assistant.id ? 'rgba(194,65,12,0.1)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { if (selectedId !== assistant.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (selectedId !== assistant.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: selectedId === assistant.id ? 'var(--accent)' : '#44403c', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: selectedId === assistant.id ? 500 : 400, color: selectedId === assistant.id ? '#fafaf9' : '#a8a29e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {assistant.name}
                    </span>
                  </button>

                  {/* Controles editar/borrar */}
                  <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '2px', opacity: 0, transition: 'opacity 0.15s' }}
                    className="group-hover:opacity-100">
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(assistant.id); }}
                      title="Editar"
                      style={{ padding: '4px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#78716c', transition: 'all 0.1s' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e7e5e4'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#78716c'; }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(assistant.id); }}
                      title="Eliminar"
                      style={{ padding: '4px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#78716c', transition: 'all 0.1s' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#78716c'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#44403c' }}>Aisla-RAG Pro</span>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--success)', boxShadow: '0 0 6px rgba(22,163,74,0.6)', display: 'block' }} />
      </div>
    </div>
  );
}

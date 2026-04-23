import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Download, RotateCcw, Settings, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import api from '../api/axios';

function formatTime(date) {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function ThreadChat({ assistant, isTech, activeDocuments = [], onEdit, onDelete }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isSubmitting = useRef(false);
  const threadIdRef = useRef(null);
  const streamBufferRef = useRef('');
  const streamIntervalRef = useRef(null);
  const bottomRef = useRef(null);

  // Inicializar thread e historial al cambiar de asistente
  useEffect(() => {
    let tid = localStorage.getItem(`thread_${assistant.id}`);
    if (!tid) {
      tid = `thread-${Date.now()}`;
      localStorage.setItem(`thread_${assistant.id}`, tid);
    }
    threadIdRef.current = tid;
    setMessages([]);
    setStreaming(false);
    isSubmitting.current = false;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/assistants/${assistant.id}/threads/${tid}/messages`);
        // Añadir timestamps si no los tienen
        setMessages((res.data || []).map(m => ({ ...m, ts: m.ts || new Date() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [assistant.id]);

  const scrollDown = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollDown(); }, [messages, loading, streaming]);

  const clearThread = () => {
    const tid = `thread-${Date.now()}`;
    localStorage.setItem(`thread_${assistant.id}`, tid);
    threadIdRef.current = tid;
    setMessages([]);
    toast.success('Conversación reiniciada');
  };

  const exportChat = () => {
    if (!messages.length) return;
    let out = `=== Aisla-RAG · ${assistant.name} ===\n\n`;
    messages.forEach(m => {
      out += `[${m.role === 'user' ? 'Tú' : 'Asistente'}]\n${m.content}\n\n`;
    });
    const url = URL.createObjectURL(new Blob([out], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = `thread_${Date.now()}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success('Thread exportado');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isSubmitting.current) return;

    isSubmitting.current = true;
    const userMsg = { role: 'user', content: input.trim(), ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${baseUrl}/assistants/${assistant.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          thread_id: threadIdRef.current,
          active_documents: activeDocuments,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      streamBufferRef.current = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [], ts: new Date() }]);
      setLoading(false);
      setStreaming(true);

      streamIntervalRef.current = setInterval(() => {
        const chunk = streamBufferRef.current;
        if (chunk) {
          setMessages(prev => {
            const upd = [...prev];
            const last = { ...upd[upd.length - 1] };
            last.content += chunk;
            upd[upd.length - 1] = last;
            return upd;
          });
          streamBufferRef.current = '';
          scrollDown();
        }
      }, 40);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const d = JSON.parse(raw);
            if (d.type === 'token' && d.token) streamBufferRef.current += d.token;
            if (d.type === 'meta' && d.sources) {
              setMessages(prev => {
                const upd = [...prev];
                const last = { ...upd[upd.length - 1], sources: d.sources };
                upd[upd.length - 1] = last;
                return upd;
              });
            }
            if (d.type === 'error') toast.error(d.error);
          } catch { /* ignorar */ }
        }
      }

      clearInterval(streamIntervalRef.current);
      if (streamBufferRef.current) {
        const final = streamBufferRef.current;
        streamBufferRef.current = '';
        setMessages(prev => {
          const upd = [...prev];
          const last = { ...upd[upd.length - 1] };
          last.content += final;
          upd[upd.length - 1] = last;
          return upd;
        });
      }

    } catch (err) {
      console.error(err);
      clearInterval(streamIntervalRef.current);
      setMessages(prev => [
        ...prev.filter(m => !(m.role === 'assistant' && !m.content)),
        { role: 'assistant', content: 'Error al conectar con el servidor.', error: true, sources: [], ts: new Date() }
      ]);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
      setStreaming(false);
      isSubmitting.current = false;
    }
  };

  const cleanSource = (src) => {
    const part = src.split('/').pop();
    return part.replace(/^[0-9a-fA-F-]{36}-/, '') || src;
  };

  const preprocessContent = (c) => c?.replace(/\[(\d+)\]/g, ' `[$1]` ') || '';

  return (
    <div className="chat-area">
      {/* Thread header */}
      <div className="thread-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0,
            background: isTech ? 'var(--accent-dim)' : 'var(--bg-4)',
            border: `1px solid ${isTech ? 'var(--accent-border)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700,
            color: isTech ? 'var(--accent)' : 'var(--text-2)',
          }}>
            {assistant.name[0].toUpperCase()}
          </div>
          <div>
            <p className="thread-title">{assistant.name}</p>
            <p className="thread-sub">
              {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
              {activeDocuments.length > 0 && ` · ${activeDocuments.length} doc activo`}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {messages.length > 0 && (
            <>
              <button className="ghost-btn" onClick={exportChat} title="Exportar thread">
                <Download size={12} /> Export
              </button>
              <button className="ghost-btn" onClick={clearThread} title="Nueva conversación">
                <RotateCcw size={12} /> Limpiar
              </button>
            </>
          )}
          {!isTech && (
            <>
              <button className="ghost-btn" onClick={onEdit} title="Editar asistente">
                <Settings size={12} />
              </button>
              <button className="ghost-btn danger" onClick={() => setShowDeleteModal(true)} title="Eliminar asistente">
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Thread de mensajes */}
      <div className="messages scrollbar">
        {messages.length === 0 && !loading && (
          <div className="empty-state">
            <p style={{ fontSize: '32px', marginBottom: '4px' }}>_</p>
            <p className="empty-label">Thread vacío</p>
            <p className="empty-sub">
              {isTech
                ? 'Pregúntame sobre la arquitectura de Aisla-RAG.'
                : 'Activa documentos en el panel izquierdo y comienza.'}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="msg-block">
            {/* Avatar */}
            <div className={`msg-avatar ${msg.role}`}>
              {msg.role === 'user' ? 'TÚ' : 'AI'}
            </div>

            {/* Cuerpo */}
            <div className="msg-body">
              <div className="msg-meta">
                <span className="msg-name">
                  {msg.role === 'user' ? 'Tú' : assistant.name}
                </span>
                <span className="msg-time">
                  {msg.ts ? formatTime(new Date(msg.ts)) : ''}
                </span>
                {msg.error && (
                  <span style={{ fontSize: '10px', color: 'var(--danger)', letterSpacing: '0.06em' }}>ERROR</span>
                )}
              </div>

              <div className={`msg-content ${msg.role}`}>
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : msg.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {preprocessContent(msg.content)}
                  </ReactMarkdown>
                ) : (
                  <div className="typing">
                    <span /><span /><span />
                  </div>
                )}
              </div>

              {/* Fuentes */}
              {msg.sources?.length > 0 && (
                <div className="sources">
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', alignSelf: 'center' }}>
                    refs
                  </span>
                  {msg.sources.map((s, j) => (
                    <div key={j} className="source-chip">
                      <span className="source-num">{j + 1}</span>
                      {cleanSource(s)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Indicador carga inicial */}
        {loading && messages.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', color: 'var(--text-3)', fontSize: '12px' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid var(--border-2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Cargando historial...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="input-bar">
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flex: 1 }}>
          <input
            className="input-field"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading || streaming}
            placeholder={`Mensaje para ${assistant.name}...`}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            autoFocus
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!input.trim() || loading || streaming}
          >
            <Send size={13} />
            Enviar
          </button>
        </form>
      </div>

      {/* Modal eliminar asistente */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-body">
              <p className="modal-title">Eliminar asistente</p>
              <p className="modal-desc">
                ¿Eliminar <strong style={{ color: 'var(--text-1)' }}>{assistant.name}</strong>? 
                Se perderán todos sus documentos y conversaciones.
              </p>
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                <button className="btn-danger" onClick={() => { setShowDeleteModal(false); onDelete(); }}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

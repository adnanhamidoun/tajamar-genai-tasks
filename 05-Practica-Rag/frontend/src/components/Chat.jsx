import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Link, FileText, Trash2, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import api from '../api/axios';

export default function Chat({ assistantId, activeDocuments = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const isSubmitting = useRef(false);
  const threadIdRef = useRef(`thread-${Date.now()}`);
  const messagesEndRef = useRef(null);
  const streamBufferRef = useRef('');
  const streamIntervalRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    let storedThreadId = localStorage.getItem(`thread_${assistantId}`);
    if (!storedThreadId) {
      storedThreadId = `thread-${Date.now()}`;
      localStorage.setItem(`thread_${assistantId}`, storedThreadId);
    }
    threadIdRef.current = storedThreadId;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/assistants/${assistantId}/threads/${storedThreadId}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error("Error loading history:", err);
      } finally {
        setLoading(false);
      }
    };

    setMessages([]);
    setStreaming(false);
    isSubmitting.current = false;
    fetchHistory();
  }, [assistantId]);

  const handleClearChat = async () => {
    setMessages([]);
    const newThreadId = `thread-${Date.now()}`;
    localStorage.setItem(`thread_${assistantId}`, newThreadId);
    threadIdRef.current = newThreadId;
    setShowClearConfirm(false);
    toast.success("Conversación reiniciada");
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, streaming, scrollToBottom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting.current) return;

    isSubmitting.current = true;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
      const response = await fetch(`${baseUrl}/assistants/${assistantId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          thread_id: threadIdRef.current,
          active_documents: activeDocuments
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let sourcesReceived = [];
      streamBufferRef.current = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '', sources: [] }]);
      setLoading(false);
      setStreaming(true);

      streamIntervalRef.current = setInterval(() => {
        const buffered = streamBufferRef.current;
        if (buffered) {
          setMessages(prev => {
            const updated = [...prev];
            const last = { ...updated[updated.length - 1] };
            last.content += buffered;
            updated[updated.length - 1] = last;
            return updated;
          });
          streamBufferRef.current = '';
          scrollToBottom();
        }
      }, 50);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'meta' && data.sources) {
              sourcesReceived = data.sources;
              setMessages(prev => {
                const updated = [...prev];
                const last = { ...updated[updated.length - 1] };
                last.sources = data.sources;
                updated[updated.length - 1] = last;
                return updated;
              });
            }
            if (data.type === 'token' && data.token) {
              streamBufferRef.current += data.token;
            }
            if (data.type === 'error') {
              toast.error('Error del servidor: ' + data.error);
            }
          } catch (parseErr) {
            // ignorar
          }
        }
      }

      clearInterval(streamIntervalRef.current);
      if (streamBufferRef.current) {
        const finalBuffer = streamBufferRef.current;
        streamBufferRef.current = '';
        setMessages(prev => {
          const updated = [...prev];
          const last = { ...updated[updated.length - 1] };
          last.content += finalBuffer;
          updated[updated.length - 1] = last;
          return updated;
        });
      }

    } catch (error) {
      console.error(error);
      clearInterval(streamIntervalRef.current);
      setMessages(prev => [
        ...prev.filter(m => !(m.role === 'assistant' && m.content === '')),
        { role: 'assistant', content: 'Hubo un error al conectar con el servidor.', error: true, sources: [] }
      ]);
      toast.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
      setStreaming(false);
      isSubmitting.current = false;
    }
  };

  const preprocessContent = (content) => {
    if (!content) return '';
    return content.replace(/\[(\d+)\]/g, ' `[$1]` ');
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    let content = "--- Historial de Chat: Aisla-RAG ---\n\n";
    messages.forEach(m => {
      content += `[${m.role === 'user' ? 'Usuario' : 'Asistente'}]:\n`;
      content += `${m.content}\n`;
      if (m.sources && m.sources.length > 0) content += `Fuentes: ${m.sources.join(', ')}\n`;
      content += "\n----------------------------------------\n\n";
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Chat exportado correctamente");
  };

  /* ─── RENDER ─────────────────────────────────────────────────────── */
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--paper)', position: 'relative', height: '100%', minHeight: 0 }}>

      {/* Barra de acciones */}
      {messages.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 24px', backgroundColor: 'var(--paper)', borderBottom: '1px solid var(--border)', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={handleExportChat}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <Download size={13} /> Exportar
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <Trash2 size={13} /> Limpiar
          </button>
        </div>
      )}

      {/* Mensajes */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {messages.length === 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--ink-3)', textAlign: 'center', paddingTop: '80px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: 'var(--paper-dark)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={26} color="var(--ink-3)" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink-2)', marginTop: '4px' }}>¿Qué quieres consultar?</p>
            <p style={{ fontSize: '13px', maxWidth: '340px', lineHeight: '1.6', color: 'var(--ink-3)' }}>
              Sube un documento arriba y escribe tu pregunta aquí abajo.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '760px', margin: '0 auto', width: '100%' }}>
            {/* Etiqueta rol */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '5px', backgroundColor: msg.role === 'user' ? 'var(--msg-user)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {msg.role === 'user' ? <User size={12} color="white" /> : <Bot size={12} color="white" />}
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                {msg.role === 'user' ? 'Tú' : 'Asistente'}
              </span>
            </div>

            {/* Burbuja */}
            <div style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              backgroundColor: msg.role === 'user' ? 'var(--msg-user)' : msg.error ? '#fef2f2' : 'white',
              border: `1px solid ${msg.role === 'user' ? 'transparent' : msg.error ? '#fecaca' : 'var(--border)'}`,
              color: msg.role === 'user' ? 'white' : msg.error ? '#dc2626' : 'var(--ink)',
              fontSize: '14px',
              lineHeight: '1.65',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              {msg.role === 'user' ? (
                msg.content
              ) : msg.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {preprocessContent(msg.content)}
                </ReactMarkdown>
              ) : (
                <span style={{ color: 'var(--ink-3)', fontStyle: 'italic', fontSize: '13px' }}>Generando respuesta...</span>
              )}
            </div>

            {/* Fuentes */}
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Link size={10} /> Fuentes
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {msg.sources.map((source, i) => {
                    const filePart = source.split('/').pop();
                    const fileName = filePart.replace(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-/, '') || source;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: 'var(--ink-2)' }}>
                        <span style={{ backgroundColor: 'var(--accent)', color: 'white', borderRadius: '3px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, flexShrink: 0 }}>
                          {i + 1}
                        </span>
                        <FileText size={11} color="var(--ink-3)" />
                        <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={source}>{fileName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Indicador carga */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '760px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '5px', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={12} color="white" />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Asistente</span>
            </div>
            <div style={{ alignSelf: 'flex-start', padding: '12px 18px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 4px', display: 'flex', gap: '5px', alignItems: 'center' }}>
              {[0, 150, 300].map(d => (
                <div key={d} className="animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border)', animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ backgroundColor: 'white', borderTop: '1px solid var(--border)', padding: '16px 24px' }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading || streaming}
            placeholder="Escribe tu pregunta..."
            style={{ flex: 1, padding: '11px 16px', backgroundColor: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', color: 'var(--ink)', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s' }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(194,65,12,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || streaming}
            style={{ padding: '11px 18px', backgroundColor: (!input.trim() || loading || streaming) ? '#e7e5e4' : 'var(--accent)', color: (!input.trim() || loading || streaming) ? '#a8a29e' : 'white', border: 'none', borderRadius: '8px', cursor: (!input.trim() || loading || streaming) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0 }}
            onMouseEnter={e => { if (input.trim() && !loading && !streaming) e.currentTarget.style.backgroundColor = 'var(--accent-2)'; }}
            onMouseLeave={e => { if (input.trim() && !loading && !streaming) e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
          >
            <Send size={15} /> Enviar
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: 'var(--ink-3)' }}>
          Las respuestas se basan exclusivamente en los documentos cargados.
        </p>
      </div>

      {/* Modal limpiar */}
      {showClearConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(28,25,23,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="animate-in" style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: '380px', border: '1px solid var(--border)' }}>
            <div style={{ padding: '24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--paper-dark)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Trash2 size={20} color="var(--ink-2)" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>¿Empezar nueva conversación?</h3>
              <p style={{ fontSize: '13px', color: 'var(--ink-3)', marginBottom: '24px', lineHeight: '1.6' }}>
                La vista se limpiará. El historial queda guardado en la base de datos.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowClearConfirm(false)} style={{ padding: '8px 16px', borderRadius: '7px', border: '1px solid var(--border)', backgroundColor: 'white', fontSize: '13px', fontWeight: 500, color: 'var(--ink-2)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancelar
                </button>
                <button onClick={handleClearChat} style={{ padding: '8px 16px', borderRadius: '7px', border: 'none', backgroundColor: 'var(--accent)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Sí, limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

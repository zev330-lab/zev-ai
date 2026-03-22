'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    // Headers
    if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-[var(--color-foreground-strong)] mt-2 mb-1">{line.slice(4)}</h4>;
    if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-[var(--color-foreground-strong)] mt-2 mb-1">{line.slice(3)}</h3>;
    // List items
    if (/^[-*]\s/.test(line)) return <div key={i} className="flex gap-1.5 ml-1"><span className="text-[var(--color-accent)] shrink-0">-</span><span>{boldify(line.slice(2))}</span></div>;
    if (/^\d+\.\s/.test(line)) return <div key={i} className="flex gap-1.5 ml-1"><span className="text-[var(--color-accent)] shrink-0">{line.match(/^\d+/)?.[0]}.</span><span>{boldify(line.replace(/^\d+\.\s*/, ''))}</span></div>;
    // Horizontal rule
    if (/^---+$/.test(line.trim())) return <hr key={i} className="border-[var(--color-admin-border)] my-2" />;
    // Empty line
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    // Normal text with bold
    return <p key={i}>{boldify(line)}</p>;
  });
}

function boldify(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-[var(--color-foreground-strong)]">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function AdminChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });

      if (res.status === 401) {
        setMessages([...updated, { role: 'assistant', content: 'Session expired. Please log in again.' }]);
        return;
      }

      const data = await res.json();
      setMessages([...updated, { role: 'assistant', content: data.response || data.error || 'No response.' }]);
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-4 right-4 z-50 w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
          open
            ? 'bg-[var(--color-accent)] text-white'
            : 'bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] text-[var(--color-muted-light)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/30'
        }`}
        title="TOLA Assistant"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-18 right-4 z-50 w-[420px] max-w-[calc(100vw-32px)] bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden" style={{ height: '560px', maxHeight: 'calc(100vh - 100px)' }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--color-admin-border)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
              <span className="text-xs font-semibold text-[var(--color-foreground-strong)]">TOLA Assistant</span>
              <span className="text-[9px] text-[var(--color-muted)]">Claude Sonnet</span>
            </div>
            <button onClick={() => setMessages([])} className="text-[10px] text-[var(--color-muted)] hover:text-[var(--color-muted-light)] cursor-pointer">Clear</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="py-6 text-center">
                <p className="text-xs text-[var(--color-muted-light)] mb-3">Ask me about the site, agents, content, or data</p>
                <div className="space-y-1.5">
                  {[
                    'Draft a blog post about AI ROI',
                    'How does the assessment pipeline work?',
                    'What should I prioritize this week?',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="block w-full text-left px-3 py-2 text-[11px] text-[var(--color-muted-light)] bg-[var(--color-admin-bg)] rounded-lg hover:bg-[var(--color-admin-border)] transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[var(--color-accent)] text-white rounded-br-sm'
                      : 'bg-[var(--color-admin-bg)] text-[var(--color-foreground)] rounded-bl-sm border border-[var(--color-admin-border)]'
                  }`}
                >
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-xl rounded-bl-sm px-4 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-[var(--color-admin-border)] shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask TOLA anything..."
                rows={1}
                className="flex-1 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-foreground-strong)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
                disabled={loading}
                style={{ maxHeight: '80px' }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-lg bg-[var(--color-accent)] text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30 cursor-pointer shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

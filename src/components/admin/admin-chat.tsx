'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  result: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: ToolCall[];
  usage?: { total_tokens: number; cost: string };
}

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-[var(--color-foreground-strong)] mt-2 mb-1">{line.slice(4)}</h4>;
    if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-[var(--color-foreground-strong)] mt-2 mb-1">{line.slice(3)}</h3>;
    if (/^[-*]\s/.test(line)) return <div key={i} className="flex gap-1.5 ml-1"><span className="text-[var(--color-accent)] shrink-0">-</span><span>{boldify(line.slice(2))}</span></div>;
    if (/^\d+\.\s/.test(line)) return <div key={i} className="flex gap-1.5 ml-1"><span className="text-[var(--color-accent)] shrink-0">{line.match(/^\d+/)?.[0]}.</span><span>{boldify(line.replace(/^\d+\.\s*/, ''))}</span></div>;
    if (/^---+$/.test(line.trim())) return <hr key={i} className="border-[var(--color-admin-border)] my-2" />;
    if (!line.trim()) return <div key={i} className="h-1.5" />;
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

const TOOL_LABELS: Record<string, string> = {
  search_contacts: 'Searching contacts',
  search_discoveries: 'Searching discoveries',
  get_projects: 'Loading projects',
  get_invoices: 'Checking invoices',
  get_family_data: 'Loading family data',
  get_agents: 'Checking agent health',
  get_blog_posts: 'Loading blog posts',
  get_social_queue: 'Loading social queue',
  search_knowledge: 'Searching knowledge base',
  get_dashboard_stats: 'Loading dashboard stats',
  create_family_task: 'Creating task',
  log_project_time: 'Logging time',
  create_knowledge_entry: 'Saving to knowledge base',
  update_contact_status: 'Updating contact',
  trigger_agent: 'Triggering agent',
};

const STARTERS = [
  'What should I prioritize this week?',
  'Prep me for my next meeting',
  'Show me all active projects',
  'Log 2h to Zev.AI — dashboard improvements',
  'Create a task: follow up with Lisa about proposal',
];

export function AdminChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTools]);

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
    setActiveTools([]);

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.status === 401) {
        setMessages([...updated, { role: 'assistant', content: 'Session expired. Please log in again.' }]);
        return;
      }

      const data = await res.json();

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response || data.error || 'No response.',
        tool_calls: data.tool_calls || [],
        usage: data.usage,
      };

      setMessages([...updated, assistantMsg]);
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
      setActiveTools([]);
    }
  }, [input, loading, messages]);

  const handleStarter = (text: string) => {
    setInput(text);
    // Auto-send after brief delay so user sees it
    setTimeout(() => {
      const textarea = inputRef.current;
      if (textarea) {
        textarea.focus();
      }
    }, 50);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-20 md:bottom-4 right-4 z-50 w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
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
        <div className="fixed bottom-34 md:bottom-18 right-4 z-50 w-[440px] max-w-[calc(100vw-32px)] bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden" style={{ height: '600px', maxHeight: 'calc(100vh - 100px)' }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--color-admin-border)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
              <span className="text-xs font-semibold text-[var(--color-foreground-strong)]">TOLA</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)]">Agentic</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button onClick={() => setMessages([])} className="text-[10px] text-[var(--color-muted)] hover:text-[var(--color-muted-light)] cursor-pointer">Clear</button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="py-4 text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <p className="text-xs text-[var(--color-foreground-strong)] font-medium mb-1">Your AI Chief of Staff</p>
                <p className="text-[11px] text-[var(--color-muted)] mb-4">I can search, create, update, and trigger actions across all your systems.</p>
                <div className="space-y-1.5">
                  {STARTERS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleStarter(q)}
                      className="block w-full text-left px-3 py-2 text-[11px] text-[var(--color-muted-light)] bg-[var(--color-admin-bg)] rounded-lg hover:bg-[var(--color-admin-border)] transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[var(--color-accent)] text-white rounded-br-sm'
                        : 'bg-[var(--color-admin-bg)] text-[var(--color-foreground)] rounded-bl-sm border border-[var(--color-admin-border)]'
                    }`}
                  >
                    {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                  </div>
                </div>

                {/* Tool calls transparency */}
                {msg.tool_calls && msg.tool_calls.length > 0 && (
                  <ToolCallDisplay calls={msg.tool_calls} />
                )}

                {/* Usage info */}
                {msg.usage && (
                  <div className="flex justify-start mt-1 ml-1">
                    <span className="text-[9px] text-[var(--color-muted)]">
                      {msg.usage.total_tokens.toLocaleString()} tokens &middot; {msg.usage.cost}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex flex-col gap-1.5">
                {activeTools.length > 0 ? (
                  activeTools.map((tool, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                      <span className="text-[10px] text-[var(--color-muted-light)]">{TOOL_LABELS[tool] || tool}...</span>
                    </div>
                  ))
                ) : (
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
                placeholder="Ask TOLA anything... I can search, create, and act."
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

function ToolCallDisplay({ calls }: { calls: ToolCall[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ml-1 mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] text-[var(--color-muted)] hover:text-[var(--color-muted-light)] cursor-pointer"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {calls.length} tool{calls.length > 1 ? 's' : ''} used
        <span className="text-[var(--color-accent)]">
          {calls.map(c => TOOL_LABELS[c.tool]?.split(' ').pop() || c.tool).join(', ')}
        </span>
      </button>
      {expanded && (
        <div className="mt-1.5 space-y-1.5 ml-3">
          {calls.map((call, i) => (
            <div key={i} className="p-2 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[10px] font-medium text-[var(--color-foreground-strong)]">
                  {TOOL_LABELS[call.tool] || call.tool}
                </span>
              </div>
              {Object.keys(call.input).length > 0 && (
                <p className="text-[9px] text-[var(--color-muted)] font-mono mb-1">
                  {Object.entries(call.input).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')}
                </p>
              )}
              <p className="text-[9px] text-[var(--color-muted-light)] font-mono max-h-20 overflow-y-auto whitespace-pre-wrap">
                {call.result.slice(0, 300)}{call.result.length > 300 ? '...' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

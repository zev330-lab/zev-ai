'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'page' | 'discovery' | 'contact' | 'post' | 'action';
  label: string;
  sublabel?: string;
  href?: string;
  action?: () => void;
}

const PAGES: SearchResult[] = [
  { type: 'page', label: 'TOLA Operating System', href: '/admin/tola' },
  { type: 'page', label: 'Dashboard', href: '/admin' },
  { type: 'page', label: 'Discoveries', href: '/admin/discoveries' },
  { type: 'page', label: 'Content Engine', href: '/admin/content' },
  { type: 'page', label: 'Projects', href: '/admin/projects' },
  { type: 'page', label: 'Finance', href: '/admin/finance' },
  { type: 'page', label: 'Family Hub', href: '/admin/family' },
  { type: 'page', label: 'Knowledge Base', href: '/admin/knowledge' },
  { type: 'page', label: 'Agents', href: '/admin/agents' },
  { type: 'page', label: 'Contacts', href: '/admin/contacts' },
  { type: 'page', label: 'Back to public site', href: '/' },
];

const TYPE_ICONS: Record<string, string> = {
  page: '\u2192',
  discovery: '\u26A1',
  contact: '\u2709',
  post: '\u270E',
  action: '\u25B6',
};

const TYPE_LABELS: Record<string, string> = {
  page: 'Navigate',
  discovery: 'Discovery',
  contact: 'Contact',
  post: 'Blog Post',
  action: 'Action',
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(PAGES);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search
  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(PAGES);
      return;
    }

    const lower = q.toLowerCase();

    // Filter pages
    const pageResults = PAGES.filter(p => p.label.toLowerCase().includes(lower));

    // Quick actions
    const actions: SearchResult[] = [];
    if ('create task'.includes(lower) || 'add task'.includes(lower)) {
      actions.push({ type: 'action', label: 'Create Task', sublabel: 'Open Family Hub', href: '/admin/family' });
    }
    if ('create event'.includes(lower) || 'add event'.includes(lower)) {
      actions.push({ type: 'action', label: 'Create Event', sublabel: 'Open Family Hub', href: '/admin/family' });
    }
    if ('create post'.includes(lower) || 'new post'.includes(lower) || 'write post'.includes(lower)) {
      actions.push({ type: 'action', label: 'Create Blog Post', sublabel: 'Open Content Engine', href: '/admin/content' });
    }

    setResults([...actions, ...pageResults]);

    // Search API for discoveries, contacts, posts
    if (q.trim().length >= 2) {
      setLoading(true);
      try {
        const [discRes, contRes, blogRes] = await Promise.all([
          fetch(`/api/admin/discoveries?search=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : []),
          fetch(`/api/admin/contacts?search=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : []),
          fetch(`/api/admin/content?search=${encodeURIComponent(q)}`).then(r => r.ok ? r.json() : []),
        ]);

        const discoveries: SearchResult[] = (Array.isArray(discRes) ? discRes : []).slice(0, 5).map((d: { name: string; company: string; pipeline_status: string }) => ({
          type: 'discovery' as const,
          label: d.name,
          sublabel: `${d.company || 'No company'} — ${d.pipeline_status}`,
          href: '/admin/discoveries',
        }));

        const contacts: SearchResult[] = (Array.isArray(contRes) ? contRes : []).slice(0, 5).map((c: { name: string; email: string; status: string }) => ({
          type: 'contact' as const,
          label: c.name,
          sublabel: `${c.email} — ${c.status}`,
          href: '/admin/contacts',
        }));

        const posts: SearchResult[] = (Array.isArray(blogRes) ? blogRes : []).slice(0, 5).map((p: { title: string; status: string; category: string }) => ({
          type: 'post' as const,
          label: p.title,
          sublabel: `${p.category} — ${p.status}`,
          href: '/admin/content',
        }));

        setResults(prev => [...prev, ...discoveries, ...contacts, ...posts]);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const execute = (result: SearchResult) => {
    setOpen(false);
    if (result.action) result.action();
    else if (result.href) router.push(result.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && results[selected]) {
      e.preventDefault();
      execute(results[selected]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-admin-border)]">
          <svg className="w-4 h-4 text-[var(--color-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search or type a command..."
            className="flex-1 bg-transparent text-sm text-[var(--color-foreground-strong)] placeholder:text-[var(--color-muted)] outline-none"
          />
          {loading && <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />}
          <kbd className="text-[10px] text-[var(--color-muted)] bg-[var(--color-admin-bg)] px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] text-center py-8">No results found</p>
          ) : (
            results.map((result, i) => (
              <button
                key={`${result.type}-${result.label}-${i}`}
                onClick={() => execute(result)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                  i === selected ? 'bg-[var(--color-accent)]/10' : 'hover:bg-[var(--color-admin-bg)]'
                }`}
              >
                <span className="text-xs w-4 text-center shrink-0">{TYPE_ICONS[result.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${i === selected ? 'text-[var(--color-accent)]' : 'text-[var(--color-foreground-strong)]'}`}>
                    {result.label}
                  </p>
                  {result.sublabel && (
                    <p className="text-[11px] text-[var(--color-muted)] truncate">{result.sublabel}</p>
                  )}
                </div>
                <span className="text-[10px] text-[var(--color-muted)] shrink-0">{TYPE_LABELS[result.type]}</span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--color-admin-border)] flex items-center gap-4 text-[10px] text-[var(--color-muted)]">
          <span><kbd className="bg-[var(--color-admin-bg)] px-1 py-0.5 rounded mr-1">&uarr;&darr;</kbd> navigate</span>
          <span><kbd className="bg-[var(--color-admin-bg)] px-1 py-0.5 rounded mr-1">Enter</kbd> select</span>
          <span><kbd className="bg-[var(--color-admin-bg)] px-1 py-0.5 rounded mr-1">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

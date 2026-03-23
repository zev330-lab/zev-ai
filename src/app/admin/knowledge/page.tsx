'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KnowledgeEntry {
  id: string; title: string; content: string; source: string;
  source_ref: string | null; tags: string[]; created_at: string; updated_at: string;
  similarity?: number;
}

const SOURCE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  meeting: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: 'Meeting' },
  voice_memo: { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa', label: 'Voice Memo' },
  article: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80', label: 'Article' },
  insight: { bg: 'rgba(250,204,21,0.15)', text: '#facc15', label: 'Insight' },
  lesson: { bg: 'rgba(251,146,60,0.15)', text: '#fb923c', label: 'Lesson' },
  discovery: { bg: 'rgba(124,155,245,0.15)', text: '#7c9bf5', label: 'Discovery' },
};

const SOURCES = ['all', 'meeting', 'voice_memo', 'article', 'insight', 'lesson', 'discovery'] as const;

export default function AdminKnowledgePage() {
  const router = useRouter();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selected, setSelected] = useState<KnowledgeEntry | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [quickMode, setQuickMode] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', source: 'insight', tags: '' });
  const [syncing, setSyncing] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '', tags: '' });
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    const params = new URLSearchParams();
    if (sourceFilter !== 'all') params.set('source', sourceFilter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/knowledge?${params}`);
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    if (Array.isArray(data)) setEntries(data);
    setLoading(false);
  }, [sourceFilter, search, router]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const addEntry = async () => {
    if (!form.content) return;
    const title = form.title || form.content.slice(0, 60) + (form.content.length > 60 ? '...' : '');
    await fetch('/api/admin/knowledge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content: form.content, source: form.source, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) }),
    });
    setShowAdd(false);
    setQuickMode(false);
    setForm({ title: '', content: '', source: 'insight', tags: '' });
    fetchEntries();
  };

  const updateEntry = async () => {
    if (!selected) return;
    await fetch('/api/admin/knowledge', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, title: editForm.title, content: editForm.content, tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean) }),
    });
    setEditMode(false);
    setSelected(null);
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await fetch('/api/admin/knowledge', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setSelected(null);
    fetchEntries();
  };

  const syncFrom = async (source: string) => {
    setSyncing(source);
    try {
      const res = await fetch('/api/admin/knowledge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _action: source === 'discoveries' ? 'sync_discoveries' : 'sync_blog' }) });
      const data = await res.json();
      alert(`Synced ${data.synced || 0} entries from ${source}`);
      fetchEntries();
    } finally { setSyncing(null); }
  };

  // Derive project tags from entries (tags starting with "project:")
  const projectTags = Array.from(new Set(
    entries.flatMap(e => e.tags?.filter(t => t.startsWith('project:')) || [])
  )).sort();

  const PROJECT_LABELS: Record<string, string> = {
    'project:steinmetz-re': 'Steinmetz RE',
    'project:zev-ai': 'Zev.AI',
    'project:lisa-rosen': 'Lisa Rosen',
    'project:blank-industries': 'Blank Ind.',
    'project:kabbalahq': 'KabbalahQ',
  };

  const displayedEntries = projectFilter
    ? entries.filter(e => e.tags?.includes(projectFilter))
    : entries;

  const totalCount = displayedEntries.length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header with prominent search */}
      <div className="px-6 py-6 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">Knowledge Base</h1>
            <p className="text-xs text-[var(--color-muted)] mt-1">{totalCount} entries</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setQuickMode(true)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-400 cursor-pointer">Quick Capture</button>
            <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white cursor-pointer">Add Entry</button>
          </div>
        </div>

        {/* Search bar — prominent, centered */}
        <div className="relative max-w-2xl mx-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your knowledge base..."
            className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-xl px-5 py-3.5 text-base text-[var(--color-foreground-strong)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-shadow"
          />
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
      </div>

      {/* Sources + project filters + sync buttons */}
      <div className="px-6 py-3 border-b border-[var(--color-admin-border)] flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {SOURCES.map((s) => (
              <button key={s} onClick={() => setSourceFilter(s)} className={`px-2.5 py-1 text-[10px] rounded-full capitalize cursor-pointer ${sourceFilter === s ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-muted-light)]'}`}>{s === 'voice_memo' ? 'Voice Memos' : s}</button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => syncFrom('discoveries')} disabled={syncing !== null} className="text-[10px] text-[var(--color-accent)] hover:underline cursor-pointer disabled:opacity-50">{syncing === 'discoveries' ? 'Syncing...' : 'Sync Discoveries'}</button>
            <button onClick={() => syncFrom('blog')} disabled={syncing !== null} className="text-[10px] text-[var(--color-accent)] hover:underline cursor-pointer disabled:opacity-50">{syncing === 'blog' ? 'Syncing...' : 'Sync Blog'}</button>
          </div>
        </div>
        {/* Project filter chips */}
        {projectTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] text-[var(--color-muted)] uppercase tracking-wider">Project:</span>
            <button onClick={() => setProjectFilter(null)} className={`px-2 py-0.5 text-[10px] rounded-full cursor-pointer ${!projectFilter ? 'bg-purple-500/20 text-purple-400' : 'text-[var(--color-muted)] hover:text-[var(--color-muted-light)]'}`}>All</button>
            {projectTags.map((tag) => (
              <button key={tag} onClick={() => setProjectFilter(projectFilter === tag ? null : tag)} className={`px-2 py-0.5 text-[10px] rounded-full cursor-pointer ${projectFilter === tag ? 'bg-purple-500/20 text-purple-400' : 'text-[var(--color-muted)] hover:text-[var(--color-muted-light)]'}`}>
                {PROJECT_LABELS[tag] || tag.replace('project:', '')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? <p className="text-sm text-[var(--color-muted)] py-12 text-center">Loading...</p> :
          displayedEntries.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 mx-auto text-[var(--color-muted)]/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              <p className="text-sm text-[var(--color-muted-light)]">{search ? `No results for "${search}"` : projectFilter ? `No entries tagged for this project yet.` : 'Your knowledge base is empty.'}</p>
              <p className="text-xs text-[var(--color-muted)] mt-1">{search ? 'Try a different search term or broaden your query.' : 'Add entries manually, or use "Sync Discoveries" / "Sync Blog" to auto-import.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedEntries.map((e) => {
                const badge = SOURCE_BADGE[e.source] || SOURCE_BADGE.insight;
                return (
                  <div key={e.id} onClick={() => { setSelected(e); setEditMode(false); setEditForm({ title: e.title, content: e.content, tags: e.tags.join(', ') }); }} className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-4 cursor-pointer hover:border-[var(--color-accent)]/30 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full" style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                      {e.similarity !== undefined && <span className="text-[10px] text-[var(--color-accent)]">{Math.round(e.similarity * 100)}% match</span>}
                      <span className="text-[10px] text-[var(--color-muted)] ml-auto">{new Date(e.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-sm font-medium text-[var(--color-foreground-strong)] mb-1">{e.title}</h3>
                    <p className="text-xs text-[var(--color-muted-light)] line-clamp-2">
                      {search && e.content.toLowerCase().includes(search.toLowerCase())
                        ? (() => {
                            const idx = e.content.toLowerCase().indexOf(search.toLowerCase());
                            const start = Math.max(0, idx - 40);
                            const end = Math.min(e.content.length, idx + search.length + 80);
                            const snippet = (start > 0 ? '...' : '') + e.content.slice(start, end) + (end < e.content.length ? '...' : '');
                            return snippet;
                          })()
                        : e.content.slice(0, 200)}
                    </p>
                    {e.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {e.tags.slice(0, 5).map((tag) => <span key={tag} className="text-[9px] bg-[var(--color-admin-bg)] rounded px-1.5 py-0.5 text-[var(--color-muted)]">{tag}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        }
      </div>

      {/* Entry Detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-2xl bg-[var(--color-admin-surface)] border-l border-[var(--color-admin-border)] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[var(--color-admin-border)]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-[var(--color-foreground-strong)]">{selected.title}</h2>
                <button onClick={() => setSelected(null)} className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] text-xl cursor-pointer">&times;</button>
              </div>
              <div className="flex items-center gap-2">
                {(() => { const b = SOURCE_BADGE[selected.source] || SOURCE_BADGE.insight; return <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full" style={{ backgroundColor: b.bg, color: b.text }}>{b.label}</span>; })()}
                <span className="text-xs text-[var(--color-muted)]">{new Date(selected.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditMode(!editMode)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)]/20 text-[var(--color-accent)] cursor-pointer">{editMode ? 'Cancel Edit' : 'Edit'}</button>
                <button onClick={() => deleteEntry(selected.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 cursor-pointer">Delete</button>
              </div>
            </div>
            <div className="px-6 py-5">
              {editMode ? (
                <div className="space-y-4">
                  <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Title</label><input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
                  <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Content</label><textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} rows={12} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-muted-light)] resize-y" /></div>
                  <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Tags (comma-separated)</label><input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
                  <button onClick={updateEntry} className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white cursor-pointer">Save</button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-[var(--color-muted-light)] whitespace-pre-wrap leading-relaxed">{selected.content}</p>
                  {selected.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-[var(--color-admin-border)]">
                      {selected.tags.map((tag) => <span key={tag} className="text-[10px] bg-[var(--color-admin-bg)] rounded-full px-2.5 py-1 text-[var(--color-muted)]">{tag}</span>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {(showAdd || quickMode) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-4">{quickMode ? 'Quick Capture' : 'Add Knowledge Entry'}</h3>
            <div className="space-y-3">
              {!quickMode && <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" placeholder="Auto-generated if blank" /></div>}
              <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Content</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={quickMode ? 4 : 8} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-muted-light)] resize-y" placeholder={quickMode ? 'Paste or type anything...' : ''} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Source</label>
                  <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]">
                    {['meeting', 'voice_memo', 'article', 'insight', 'lesson'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Tags</label><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="comma,separated" className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={addEntry} className="flex-1 px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white cursor-pointer">Save</button>
              <button onClick={() => { setShowAdd(false); setQuickMode(false); }} className="px-4 py-2 text-xs text-[var(--color-muted)] cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

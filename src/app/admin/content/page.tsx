'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MarkdownContent } from '@/components/admin/markdown-content';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: string;
  author: string;
  reading_time_min: number;
  seo_title: string;
  seo_description: string;
  social_posts: { platform: string; content: string }[] | null;
  generation_data: Record<string, unknown> | null;
  generation_error: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface SocialItem {
  id: string;
  blog_post_id: string | null;
  platform: string;
  content: string;
  content_pillar: string;
  image_prompt: string | null;
  review_notes: string;
  status: string;
  scheduled_for: string | null;
  posted_at: string | null;
  published_at: string | null;
  published_url: string | null;
  platform_post_id: string | null;
  publish_error: string | null;
  image_url: string | null;
  created_at: string;
  blog_posts?: { title: string; slug: string } | null;
}

interface SocialAccount {
  id: string;
  platform: string;
  handle: string;
  profile_url: string;
  is_active: boolean;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', label: 'Draft' },
  topic_research: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: 'Researching' },
  outlining: { bg: 'rgba(147,130,220,0.15)', text: '#9382dc', label: 'Outlining' },
  drafting: { bg: 'rgba(251,146,60,0.15)', text: '#fb923c', label: 'Drafting' },
  reviewing: { bg: 'rgba(244,114,182,0.15)', text: '#f472b6', label: 'Reviewing' },
  social_gen: { bg: 'rgba(192,132,252,0.15)', text: '#c084fc', label: 'Social Gen' },
  review: { bg: 'rgba(250,204,21,0.15)', text: '#facc15', label: 'Needs Review' },
  published: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80', label: 'Published' },
  archived: { bg: 'rgba(107,114,128,0.15)', text: '#6b7280', label: 'Archived' },
};

const SOCIAL_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', label: 'Draft' },
  approved: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: 'Approved' },
  scheduled: { bg: 'rgba(250,204,21,0.15)', text: '#facc15', label: 'Scheduled' },
  publishing: { bg: 'rgba(147,130,220,0.15)', text: '#9382dc', label: 'Publishing...' },
  posted: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80', label: 'Posted' },
  failed: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', label: 'Failed' },
};

const PLATFORM_LABEL: Record<string, { icon: string; name: string; color: string }> = {
  linkedin: { icon: 'in', name: 'LinkedIn', color: '#0a66c2' },
  twitter: { icon: 'X', name: 'Twitter/X', color: '#1d9bf0' },
  instagram: { icon: 'IG', name: 'Instagram', color: '#e4405f' },
  tiktok: { icon: 'TT', name: 'TikTok', color: '#ff0050' },
  threads: { icon: 'TH', name: 'Threads', color: '#000000' },
  youtube: { icon: 'YT', name: 'YouTube', color: '#ff0000' },
};

const ALL_PLATFORMS = ['all', 'linkedin', 'twitter', 'instagram', 'tiktok', 'threads'] as const;

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AdminContentPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [social, setSocial] = useState<SocialItem[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'posts' | 'social'>('posts');
  const [socialView, setSocialView] = useState<'list' | 'calendar'>('list');
  const [selected, setSelected] = useState<BlogPost | null>(null);
  const [selectedSocial, setSelectedSocial] = useState<SocialItem | null>(null);
  const [detailTab, setDetailTab] = useState<'preview' | 'edit' | 'social' | 'review'>('preview');
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatingSocial, setGeneratingSocial] = useState(false);
  const [socialFilter, setSocialFilter] = useState('all');
  const [editSocialContent, setEditSocialContent] = useState('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [costLevel, setCostLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const [publishing, setPublishing] = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    const res = await fetch('/api/admin/content');
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    if (Array.isArray(data)) setPosts(data);
    setLoading(false);
  }, [router]);

  const fetchSocial = useCallback(async () => {
    const params = socialFilter !== 'all' ? `?platform=${socialFilter}` : '';
    const res = await fetch(`/api/admin/social${params}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) setSocial(data);
    }
  }, [socialFilter]);

  const fetchAccounts = useCallback(async () => {
    const res = await fetch('/api/admin/social-accounts');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) setAccounts(data);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/admin/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.cost_level) {
        const level = typeof data.cost_level === 'string' ? data.cost_level.replace(/"/g, '') : data.cost_level;
        if (['high', 'medium', 'low'].includes(level)) setCostLevel(level as 'high' | 'medium' | 'low');
      }
    }
  }, []);

  useEffect(() => { fetchPosts(); fetchSocial(); fetchAccounts(); fetchSettings(); }, [fetchPosts, fetchSocial, fetchAccounts, fetchSettings]);

  useEffect(() => {
    const hasActive = posts.some((p) =>
      ['topic_research', 'outlining', 'drafting', 'reviewing', 'social_gen'].includes(p.status)
    );
    if (!hasActive) return;
    const interval = setInterval(fetchPosts, 10000);
    return () => clearInterval(interval);
  }, [posts, fetchPosts]);

  const updatePost = async (id: string, updates: Partial<BlogPost>) => {
    await fetch('/api/admin/content', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
    fetchPosts();
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...updates } : prev);
  };

  const updateSocial = async (id: string, updates: Partial<SocialItem>) => {
    await fetch('/api/admin/social', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
    fetchSocial();
  };

  const bulkApprove = async () => {
    if (checkedIds.size === 0) return;
    await fetch('/api/admin/social', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(checkedIds), status: 'approved' }),
    });
    setCheckedIds(new Set());
    fetchSocial();
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return;
    await fetch('/api/admin/content', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setSelected(null);
    fetchPosts();
  };

  const generateNewPost = async () => {
    setGenerating(true);
    try {
      await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: `auto-${Date.now()}`, status: 'topic_research' }) });
      fetchPosts();
    } finally { setGenerating(false); }
  };

  const generateSocialNow = async () => {
    setGeneratingSocial(true);
    try {
      await fetch('/api/admin/agents/trigger', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent: 'pipeline-social-agent' }) });
      setTimeout(fetchSocial, 3000);
    } finally { setGeneratingSocial(false); }
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const changeCostLevel = async (level: 'high' | 'medium' | 'low') => {
    setCostLevel(level);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cost_level: level }),
    });
  };

  const publishPost = async (id: string) => {
    setPublishing((prev) => new Set(prev).add(id));
    try {
      await fetch('/api/admin/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchSocial();
    } finally {
      setPublishing((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const publishAllApproved = async () => {
    const approvedIds = social.filter((s) => s.status === 'approved').map((s) => s.id);
    if (approvedIds.length === 0) return;
    for (const id of approvedIds) setPublishing((prev) => new Set(prev).add(id));
    try {
      await fetch('/api/admin/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: approvedIds }),
      });
      fetchSocial();
    } finally {
      setPublishing(new Set());
    }
  };

  // Stats
  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const reviewCount = posts.filter((p) => p.status === 'review').length;
  const pipelineCount = posts.filter((p) => ['topic_research', 'outlining', 'drafting', 'reviewing', 'social_gen'].includes(p.status)).length;
  const socialPending = social.filter((s) => s.status === 'draft').length;
  const socialThisWeek = social.filter((s) => {
    const d = new Date(s.created_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return d >= weekAgo;
  }).length;
  const byPlatform = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of social) m[s.platform] = (m[s.platform] || 0) + 1;
    return m;
  }, [social]);

  // Calendar view: group by day for next 7 days
  const calendarDays = useMemo(() => {
    const days: { date: string; label: string; items: SocialItem[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const items = social.filter((s) => {
        if (!s.scheduled_for) return i === 0 && s.status === 'approved';
        return s.scheduled_for.slice(0, 10) === dateStr;
      });
      days.push({ date: dateStr, label, items });
    }
    return days;
  }, [social]);

  const activeAccounts = accounts.filter((a) => a.is_active);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">Content</h1>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {publishedCount} published &middot; {reviewCount} pending review &middot; {pipelineCount} in pipeline &middot; {socialPending} social drafts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateSocialNow}
              disabled={generatingSocial}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {generatingSocial ? 'Generating...' : 'Generate Posts Now'}
            </button>
            <button
              onClick={generateNewPost}
              disabled={generating}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {generating ? 'Creating...' : 'Generate Blog Post'}
            </button>
            <div className="flex items-center gap-1 ml-2 border-l border-[var(--color-admin-border)] pl-3">
              <span className="text-[9px] text-[var(--color-muted)] uppercase tracking-wider mr-1">Cost</span>
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => changeCostLevel(level)}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                    costLevel === level
                      ? level === 'low' ? 'bg-green-500/20 text-green-400'
                        : level === 'medium' ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-muted-light)]'
                  }`}
                >
                  {level === 'low' ? '$' : level === 'medium' ? '$$' : '$$$'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accounts bar */}
        {accounts.length > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-admin-border)]/50">
            <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">Accounts</span>
            {accounts.map((a) => {
              const pl = PLATFORM_LABEL[a.platform];
              return (
                <div key={a.id} className="flex items-center gap-1.5" title={a.handle || `${a.platform} — not connected`}>
                  <span
                    className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                      a.is_active ? 'text-white' : 'text-[var(--color-muted)] bg-[var(--color-admin-border)]'
                    }`}
                    style={a.is_active ? { backgroundColor: pl?.color || '#666' } : {}}
                  >
                    {pl?.icon || '?'}
                  </span>
                  {a.handle && <span className="text-[10px] text-[var(--color-muted-light)]">{a.handle}</span>}
                </div>
              );
            })}
            <span className="text-[10px] text-[var(--color-muted)] ml-auto">
              {activeAccounts.length}/{accounts.length} connected
            </span>
          </div>
        )}
      </div>

      {/* View toggle + stats */}
      <div className="px-6 py-3 border-b border-[var(--color-admin-border)] flex items-center gap-4 shrink-0 flex-wrap">
        <div className="flex rounded-lg border border-[var(--color-admin-border)] overflow-hidden">
          {(['posts', 'social'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 text-[11px] font-medium transition-colors capitalize cursor-pointer ${view === v ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-admin-surface)] text-[var(--color-muted-light)] hover:bg-[var(--color-admin-border)]'}`}
            >{v === 'posts' ? 'Blog Posts' : 'Social Queue'}</button>
          ))}
        </div>

        {view === 'social' && (
          <>
            <div className="flex gap-1">
              {ALL_PLATFORMS.map((p) => (
                <button key={p} onClick={() => setSocialFilter(p)}
                  className={`px-2.5 py-1 text-[10px] rounded-full transition-colors capitalize cursor-pointer ${socialFilter === p ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-muted-light)]'}`}
                >{p}{byPlatform[p] ? ` (${byPlatform[p]})` : ''}</button>
              ))}
            </div>
            <div className="flex rounded-lg border border-[var(--color-admin-border)] overflow-hidden ml-auto">
              {(['list', 'calendar'] as const).map((v) => (
                <button key={v} onClick={() => setSocialView(v)}
                  className={`px-3 py-1 text-[10px] font-medium transition-colors capitalize cursor-pointer ${socialView === v ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'bg-[var(--color-admin-surface)] text-[var(--color-muted)]'}`}
                >{v}</button>
              ))}
            </div>
          </>
        )}

        {view === 'social' && (
          <div className="w-full flex items-center gap-4 mt-1 text-[10px] text-[var(--color-muted)]">
            <span>{socialThisWeek} this week</span>
            <span>&middot;</span>
            <span>{socialPending} pending</span>
            {Object.entries(byPlatform).map(([p, c]) => (
              <span key={p}>&middot; {PLATFORM_LABEL[p]?.name || p}: {c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Bulk actions bar */}
      {view === 'social' && checkedIds.size > 0 && (
        <div className="px-6 py-2 border-b border-[var(--color-admin-border)] bg-[var(--color-accent)]/5 flex items-center gap-3 shrink-0">
          <span className="text-xs text-[var(--color-accent)]">{checkedIds.size} selected</span>
          <button onClick={bulkApprove} className="px-3 py-1 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 cursor-pointer">Approve Selected</button>
          <button onClick={() => setCheckedIds(new Set())} className="px-3 py-1 text-xs text-[var(--color-muted)] cursor-pointer">Clear</button>
        </div>
      )}

      {view === 'social' && social.some((s) => s.status === 'approved') && (
        <div className="px-6 py-2 border-b border-[var(--color-admin-border)] bg-blue-500/5 flex items-center gap-3 shrink-0">
          <span className="text-xs text-blue-400">{social.filter((s) => s.status === 'approved').length} approved</span>
          <button onClick={publishAllApproved} disabled={publishing.size > 0} className="px-3 py-1 text-xs font-medium rounded-lg bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 disabled:opacity-50 cursor-pointer">
            {publishing.size > 0 ? 'Publishing...' : 'Publish All to Platforms'}
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <p className="text-sm text-[var(--color-muted)] py-12 text-center">Loading...</p>
        ) : view === 'posts' ? (
          posts.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] py-12 text-center">No blog posts yet. Click &ldquo;Generate Blog Post&rdquo; to start.</p>
          ) : (
            <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-admin-border)]">
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Title</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Category</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => {
                    const badge = STATUS_BADGE[p.status] || STATUS_BADGE.draft;
                    return (
                      <tr key={p.id} onClick={() => { setSelected(p); setDetailTab('preview'); setEditContent(p.content); setEditTitle(p.title); }}
                        className="border-b border-[var(--color-admin-border)]/50 cursor-pointer transition-colors hover:bg-[var(--color-admin-border)]/30">
                        <td className="px-4 py-3 text-[var(--color-foreground-strong)]">{p.title || <span className="text-[var(--color-muted)] italic">Untitled (generating...)</span>}</td>
                        <td className="px-4 py-3 text-[var(--color-muted-light)] text-xs">{p.category || '--'}</td>
                        <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full" style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span></td>
                        <td className="px-4 py-3 text-[var(--color-muted)] text-xs whitespace-nowrap">{relativeDate(p.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : socialView === 'list' ? (
          /* Social List View */
          social.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] py-12 text-center">No social posts. Click &ldquo;Generate Posts Now&rdquo; or publish a blog post.</p>
          ) : (
            <div className="space-y-2">
              {social.map((s) => {
                const badge = SOCIAL_BADGE[s.status] || SOCIAL_BADGE.draft;
                const pl = PLATFORM_LABEL[s.platform];
                return (
                  <div key={s.id} className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-4 flex items-start gap-3 hover:border-[var(--color-accent)]/30 transition-colors">
                    {/* Checkbox */}
                    {s.status === 'draft' && (
                      <input
                        type="checkbox"
                        checked={checkedIds.has(s.id)}
                        onChange={() => toggleCheck(s.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 shrink-0 accent-[var(--color-accent)] cursor-pointer"
                      />
                    )}
                    <div className="flex-1 cursor-pointer" onClick={() => { setSelectedSocial(s); setEditSocialContent(s.content); }}>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-bold rounded px-1.5 py-0.5 text-white" style={{ backgroundColor: pl?.color || '#666' }}>{pl?.icon}</span>
                        <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full" style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                        {s.content_pillar && <span className="text-[10px] text-[var(--color-muted)]">{s.content_pillar}</span>}
                        {s.scheduled_for && <span className="text-[10px] text-yellow-400">{formatShortDate(s.scheduled_for)}</span>}
                        {s.blog_posts && <span className="text-[10px] text-[var(--color-muted)]">from: {(s.blog_posts as { title: string }).title}</span>}
                        <span className="text-[10px] text-[var(--color-muted)] ml-auto">{relativeDate(s.created_at)}</span>
                      </div>
                      <p className="text-sm text-[var(--color-muted-light)] line-clamp-2">{s.content.slice(0, 120)}{s.content.length > 120 ? '...' : ''}</p>
                      {s.review_notes && <p className="text-[10px] text-[var(--color-muted)] mt-1 italic">{s.review_notes}</p>}
                      {s.publish_error && <p className="text-[10px] text-red-400 mt-1">{s.publish_error}</p>}
                      {s.published_url && <a href={s.published_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[var(--color-accent)] mt-1 hover:underline inline-block" onClick={(e) => e.stopPropagation()}>View on {PLATFORM_LABEL[s.platform]?.name}</a>}
                    </div>
                    {s.status === 'approved' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); publishPost(s.id); }}
                        disabled={publishing.has(s.id)}
                        className="shrink-0 px-3 py-1.5 text-[10px] font-medium rounded-lg bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 disabled:opacity-50 cursor-pointer"
                      >
                        {publishing.has(s.id) ? 'Publishing...' : 'Publish'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Calendar View */
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => (
              <div key={day.date} className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-3 min-h-[120px]">
                <p className="text-[10px] font-medium text-[var(--color-foreground-strong)] mb-2">{day.label}</p>
                {day.items.length === 0 ? (
                  <p className="text-[10px] text-[var(--color-muted)] italic">No posts</p>
                ) : (
                  <div className="space-y-1.5">
                    {day.items.map((item) => {
                      const pl = PLATFORM_LABEL[item.platform];
                      return (
                        <div
                          key={item.id}
                          onClick={() => { setSelectedSocial(item); setEditSocialContent(item.content); }}
                          className="p-1.5 rounded-lg bg-[var(--color-admin-bg)] cursor-pointer hover:ring-1 hover:ring-[var(--color-accent)]/30 transition-all"
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[8px] font-bold rounded px-1 py-px text-white" style={{ backgroundColor: pl?.color || '#666' }}>{pl?.icon}</span>
                            <span className="text-[9px] text-[var(--color-muted)]">{SOCIAL_BADGE[item.status]?.label}</span>
                          </div>
                          <p className="text-[10px] text-[var(--color-muted-light)] line-clamp-2">{item.content.slice(0, 60)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blog Post Detail Slide-out */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-2xl bg-[var(--color-admin-surface)] border-l border-[var(--color-admin-border)] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[var(--color-admin-border)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-[var(--color-foreground-strong)] line-clamp-1">{selected.title || 'Generating...'}</h2>
                <button onClick={() => setSelected(null)} className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] text-xl cursor-pointer">&times;</button>
              </div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {(() => { const b = STATUS_BADGE[selected.status] || STATUS_BADGE.draft; return <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full" style={{ backgroundColor: b.bg, color: b.text }}>{b.label}</span>; })()}
                {selected.category && <span className="text-xs text-[var(--color-muted)]">{selected.category}</span>}
                {selected.reading_time_min > 0 && <span className="text-xs text-[var(--color-muted)]">{selected.reading_time_min} min</span>}
                {selected.generation_error && <span className="text-xs text-red-400">Error: {selected.generation_error}</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selected.status === 'review' && (<>
                  <button onClick={() => updatePost(selected.id, { status: 'published' })} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 cursor-pointer">Approve & Publish</button>
                  <button onClick={() => updatePost(selected.id, { status: 'draft' })} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 cursor-pointer">Reject to Draft</button>
                </>)}
                {selected.status === 'published' && <button onClick={() => updatePost(selected.id, { status: 'archived' })} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-admin-border)] text-[var(--color-muted-light)] cursor-pointer">Archive</button>}
                <button onClick={() => deletePost(selected.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer ml-auto">Delete</button>
              </div>
            </div>
            <div className="flex border-b border-[var(--color-admin-border)]">
              {(['preview', 'edit', 'social', 'review'] as const).map((tab) => (
                <button key={tab} onClick={() => setDetailTab(tab)} className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors cursor-pointer ${detailTab === tab ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-muted-light)]'}`}>{tab}</button>
              ))}
            </div>
            <div className="px-6 py-5">
              {detailTab === 'preview' && (selected.content ? <MarkdownContent content={selected.content} /> : <EmptyPipeline status={selected.status} />)}
              {detailTab === 'edit' && (
                <div className="space-y-4">
                  <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Title</label><input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]" /></div>
                  <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Content (Markdown)</label><textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={20} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-muted-light)] resize-y focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-mono" /></div>
                  <button onClick={() => updatePost(selected.id, { title: editTitle, content: editContent })} className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 cursor-pointer">Save Changes</button>
                </div>
              )}
              {detailTab === 'social' && (selected.social_posts && selected.social_posts.length > 0 ? (
                <div className="space-y-4">{selected.social_posts.map((sp, i) => (<div key={i} className="bg-[var(--color-admin-bg)] rounded-lg p-4"><p className="text-xs font-bold text-[var(--color-accent)] mb-2 uppercase">{sp.platform}</p><p className="text-sm text-[var(--color-muted-light)] whitespace-pre-wrap">{sp.content}</p></div>))}</div>
              ) : <p className="text-sm text-[var(--color-muted)] py-12 text-center">Social variants generated during pipeline.</p>)}
              {detailTab === 'review' && <ReviewPanel data={selected.generation_data} />}
            </div>
          </div>
        </div>
      )}

      {/* Social Detail Slide-out */}
      {selectedSocial && !selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelectedSocial(null)} />
          <div className="w-full max-w-lg bg-[var(--color-admin-surface)] border-l border-[var(--color-admin-border)] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[var(--color-admin-border)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold rounded px-2 py-0.5 text-white" style={{ backgroundColor: PLATFORM_LABEL[selectedSocial.platform]?.color || '#666' }}>{PLATFORM_LABEL[selectedSocial.platform]?.icon}</span>
                  <span className="text-sm font-medium text-[var(--color-foreground-strong)] capitalize">{PLATFORM_LABEL[selectedSocial.platform]?.name || selectedSocial.platform}</span>
                </div>
                <button onClick={() => setSelectedSocial(null)} className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] text-xl cursor-pointer">&times;</button>
              </div>
              {selectedSocial.content_pillar && <p className="text-[10px] text-[var(--color-muted)] mb-2">Pillar: {selectedSocial.content_pillar}</p>}
              {selectedSocial.review_notes && <p className="text-[10px] text-[var(--color-muted)] italic mb-3">{selectedSocial.review_notes}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedSocial.status === 'draft' && (
                  <button onClick={() => { updateSocial(selectedSocial.id, { status: 'approved' }); setSelectedSocial(null); }} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 cursor-pointer">Approve</button>
                )}
                {selectedSocial.status === 'approved' && (
                  <button onClick={() => { publishPost(selectedSocial.id); setSelectedSocial(null); }} disabled={publishing.has(selectedSocial.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 disabled:opacity-50 cursor-pointer">
                    {publishing.has(selectedSocial.id) ? 'Publishing...' : 'Publish to Platform'}
                  </button>
                )}
                {selectedSocial.published_url && (
                  <a href={selectedSocial.published_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 cursor-pointer">View Live Post</a>
                )}
                {(selectedSocial.status === 'draft' || selectedSocial.status === 'approved') && (
                  <input
                    type="date"
                    onChange={(e) => { if (e.target.value) updateSocial(selectedSocial.id, { scheduled_for: new Date(e.target.value).toISOString(), status: 'scheduled' }); }}
                    className="px-2 py-1 text-[10px] bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg text-[var(--color-muted-light)] cursor-pointer"
                    title="Schedule for date"
                  />
                )}
                <button onClick={async () => { await fetch('/api/admin/social', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedSocial.id }) }); setSelectedSocial(null); fetchSocial(); }} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer">Delete</button>
              </div>
            </div>

            {/* Platform preview mockup */}
            <div className="px-6 py-4 border-b border-[var(--color-admin-border)]">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-3">Preview</p>
              <PlatformPreview platform={selectedSocial.platform} content={selectedSocial.content} />
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Branded image preview */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-2 block">Branded Image</label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/og/social?text=${encodeURIComponent(selectedSocial.content.slice(0, 100))}&pillar=${encodeURIComponent(selectedSocial.content_pillar || '')}&format=${selectedSocial.platform === 'instagram' ? 'square' : 'landscape'}`}
                  alt="Branded preview"
                  className="w-full rounded-lg border border-[var(--color-admin-border)]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Content</label>
                <textarea value={editSocialContent} onChange={(e) => setEditSocialContent(e.target.value)} rows={8} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-muted-light)] resize-y focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]" />
              </div>
              {selectedSocial.image_prompt && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Image Prompt</label>
                  <p className="text-xs text-[var(--color-muted-light)] bg-[var(--color-admin-bg)] rounded-lg p-3 italic">{selectedSocial.image_prompt}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button onClick={() => { updateSocial(selectedSocial.id, { content: editSocialContent }); setSelectedSocial(null); }} className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 cursor-pointer">Save</button>
                <p className="text-[10px] text-[var(--color-muted)]">
                  {editSocialContent.length} chars
                  {selectedSocial.platform === 'twitter' && editSocialContent.length > 280 && <span className="text-red-400 ml-1">Over 280 limit!</span>}
                  {selectedSocial.platform === 'threads' && editSocialContent.length > 500 && <span className="text-red-400 ml-1">Over 500 limit!</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function EmptyPipeline({ status }: { status: string }) {
  const isActive = ['topic_research', 'outlining', 'drafting', 'reviewing', 'social_gen'].includes(status);
  return (
    <div className="py-12 text-center">
      {isActive && <div className="flex justify-center mb-3"><div className="w-5 h-5 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" /></div>}
      <p className="text-sm text-[var(--color-muted)]">{isActive ? `Generating (${STATUS_BADGE[status]?.label || status})...` : 'No content yet.'}</p>
    </div>
  );
}

function ReviewPanel({ data }: { data: Record<string, unknown> | null }) {
  if (!data || !(data as Record<string, unknown>).review) {
    return <p className="text-sm text-[var(--color-muted)] py-12 text-center">Review data available after Guardian review.</p>;
  }
  const review = (data as Record<string, unknown>).review as Record<string, unknown>;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center"><p className="text-2xl font-light text-[var(--color-accent)]">{String(review.overall_score)}/10</p><p className="text-[10px] text-[var(--color-muted)]">Quality</p></div>
        <div className="text-center"><p className="text-2xl font-light text-[var(--color-accent)]">{String(review.seo_score)}/10</p><p className="text-[10px] text-[var(--color-muted)]">SEO</p></div>
        <p className={`text-sm font-medium ${review.brand_consistent ? 'text-green-400' : 'text-red-400'}`}>{review.brand_consistent ? 'On Brand' : 'Off Brand'}</p>
        {review.needs_human_review === true && <span className="px-2 py-1 text-[10px] rounded-full bg-yellow-500/15 text-yellow-400 font-medium">Needs Human Review</span>}
      </div>
      <div className="bg-[var(--color-admin-bg)] rounded-lg p-4"><p className="text-sm text-[var(--color-muted-light)]">{String(review.quality_notes)}</p></div>
      {Array.isArray(review.issues) && review.issues.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--color-foreground-strong)] mb-2">Issues</p>
          {(review.issues as { severity: string; description: string; suggestion: string }[]).map((issue, i) => (
            <div key={i} className={`mb-2 p-3 rounded-lg text-xs ${issue.severity === 'critical' ? 'bg-red-500/10 border border-red-500/20' : issue.severity === 'major' ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-[var(--color-admin-bg)]'}`}>
              <p className="font-medium text-[var(--color-foreground-strong)]">[{issue.severity}] {issue.description}</p>
              <p className="text-[var(--color-muted-light)] mt-1">{issue.suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlatformPreview({ platform, content }: { platform: string; content: string }) {
  const containerClass = "rounded-xl p-4 text-sm";

  switch (platform) {
    case 'linkedin':
      return (
        <div className={`${containerClass} bg-white text-gray-900 border border-gray-200`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#0a66c2] flex items-center justify-center text-white text-xs font-bold">ZS</div>
            <div><p className="text-xs font-semibold">Zev Steinmetz</p><p className="text-[10px] text-gray-500">AI Implementation Consultant</p></div>
          </div>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      );
    case 'twitter':
      return (
        <div className={`${containerClass} bg-black text-white border border-gray-800`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-[10px] font-bold">ZS</div>
            <div><span className="text-xs font-bold">Zev Steinmetz</span> <span className="text-xs text-gray-500">@zev_ai</span></div>
          </div>
          <p className="text-[13px] leading-relaxed">{content}</p>
          <p className="text-[10px] text-gray-500 mt-2">{content.length}/280</p>
        </div>
      );
    case 'instagram':
      return (
        <div className={`${containerClass} bg-white text-gray-900 border border-gray-200`}>
          <div className="w-full h-32 bg-gradient-to-br from-purple-400 via-pink-500 to-orange-400 rounded-lg mb-3 flex items-center justify-center text-white text-xs font-medium">Image placeholder</div>
          <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" /><span className="text-xs font-semibold">zev.ai</span></div>
          <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      );
    case 'tiktok':
      return (
        <div className={`${containerClass} bg-black text-white border border-gray-800`}>
          <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider">TikTok Script</p>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap font-mono">{content}</p>
        </div>
      );
    case 'threads':
      return (
        <div className={`${containerClass} bg-white text-gray-900 border border-gray-200`}>
          <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-bold">ZS</div><span className="text-xs font-semibold">zev.ai</span></div>
          <p className="text-[13px] leading-relaxed">{content}</p>
          <p className="text-[10px] text-gray-400 mt-2">{content.length}/500</p>
        </div>
      );
    default:
      return <p className="text-sm text-[var(--color-muted-light)] whitespace-pre-wrap">{content}</p>;
  }
}

'use client';

import { useState, useEffect, useCallback } from 'react';
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
  image_prompt: string | null;
  status: string;
  scheduled_for: string | null;
  posted_at: string | null;
  created_at: string;
  blog_posts?: { title: string; slug: string } | null;
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
  posted: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80', label: 'Posted' },
};

const PLATFORM_ICON: Record<string, string> = {
  linkedin: 'in', twitter: 'X', instagram: 'IG', tiktok: 'TT', threads: 'TH',
};

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

export default function AdminContentPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [social, setSocial] = useState<SocialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'posts' | 'social'>('posts');
  const [selected, setSelected] = useState<BlogPost | null>(null);
  const [selectedSocial, setSelectedSocial] = useState<SocialItem | null>(null);
  const [detailTab, setDetailTab] = useState<'preview' | 'edit' | 'social' | 'review'>('preview');
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [socialFilter, setSocialFilter] = useState('all');
  const [editSocialContent, setEditSocialContent] = useState('');

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

  useEffect(() => { fetchPosts(); fetchSocial(); }, [fetchPosts, fetchSocial]);

  // Auto-refresh during active pipelines
  useEffect(() => {
    const hasActive = posts.some((p) =>
      ['topic_research', 'outlining', 'drafting', 'reviewing', 'social_gen'].includes(p.status)
    );
    if (!hasActive) return;
    const interval = setInterval(() => { fetchPosts(); }, 10000);
    return () => clearInterval(interval);
  }, [posts, fetchPosts]);

  const updatePost = async (id: string, updates: Partial<BlogPost>) => {
    await fetch('/api/admin/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    fetchPosts();
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...updates } : prev);
  };

  const updateSocial = async (id: string, updates: Partial<SocialItem>) => {
    await fetch('/api/admin/social', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    fetchSocial();
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return;
    await fetch('/api/admin/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setSelected(null);
    fetchPosts();
  };

  const generateNewPost = async () => {
    setGenerating(true);
    try {
      // Create a new post with topic_research status to kick off the pipeline
      await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: `auto-${Date.now()}`, status: 'topic_research' }),
      });
      fetchPosts();
    } finally {
      setGenerating(false);
    }
  };

  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const reviewCount = posts.filter((p) => p.status === 'review').length;
  const pipelineCount = posts.filter((p) =>
    ['topic_research', 'outlining', 'drafting', 'reviewing', 'social_gen'].includes(p.status)
  ).length;
  const socialPending = social.filter((s) => s.status === 'draft').length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">Content</h1>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {publishedCount} published &middot; {reviewCount} pending review &middot; {pipelineCount} in pipeline &middot; {socialPending} social drafts
            </p>
          </div>
          <button
            onClick={generateNewPost}
            disabled={generating}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {generating ? 'Creating...' : 'Generate New Post'}
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div className="px-6 py-3 border-b border-[var(--color-admin-border)] flex items-center gap-4 shrink-0">
        <div className="flex rounded-lg border border-[var(--color-admin-border)] overflow-hidden">
          {(['posts', 'social'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-[11px] font-medium transition-colors capitalize cursor-pointer ${
                view === v
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-admin-surface)] text-[var(--color-muted-light)] hover:bg-[var(--color-admin-border)]'
              }`}
            >
              {v === 'posts' ? 'Blog Posts' : 'Social Queue'}
            </button>
          ))}
        </div>

        {view === 'social' && (
          <div className="flex gap-1">
            {['all', 'linkedin', 'twitter', 'instagram', 'threads'].map((p) => (
              <button
                key={p}
                onClick={() => setSocialFilter(p)}
                className={`px-2.5 py-1 text-[10px] rounded-full transition-colors capitalize cursor-pointer ${
                  socialFilter === p
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-muted-light)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <p className="text-sm text-[var(--color-muted)] py-12 text-center">Loading...</p>
        ) : view === 'posts' ? (
          /* Blog Posts List */
          posts.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] py-12 text-center">No blog posts yet. Click &ldquo;Generate New Post&rdquo; to start.</p>
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
                      <tr
                        key={p.id}
                        onClick={() => { setSelected(p); setDetailTab('preview'); setEditContent(p.content); setEditTitle(p.title); }}
                        className="border-b border-[var(--color-admin-border)]/50 cursor-pointer transition-colors hover:bg-[var(--color-admin-border)]/30"
                      >
                        <td className="px-4 py-3 text-[var(--color-foreground-strong)]">
                          {p.title || <span className="text-[var(--color-muted)] italic">Untitled (generating...)</span>}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-muted-light)] text-xs">{p.category || '--'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full" style={{ backgroundColor: badge.bg, color: badge.text }}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-muted)] text-xs whitespace-nowrap">
                          {relativeDate(p.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Social Queue */
          social.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] py-12 text-center">No social posts yet. Publish a blog post to generate social variants.</p>
          ) : (
            <div className="space-y-3">
              {social.map((s) => {
                const badge = SOCIAL_BADGE[s.status] || SOCIAL_BADGE.draft;
                return (
                  <div
                    key={s.id}
                    onClick={() => { setSelectedSocial(s); setEditSocialContent(s.content); }}
                    className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-4 cursor-pointer hover:border-[var(--color-accent)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-[var(--color-accent)] w-6">{PLATFORM_ICON[s.platform] || s.platform}</span>
                      <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full" style={{ backgroundColor: badge.bg, color: badge.text }}>
                        {badge.label}
                      </span>
                      {s.blog_posts && (
                        <span className="text-[10px] text-[var(--color-muted)]">from: {(s.blog_posts as { title: string }).title}</span>
                      )}
                      <span className="text-[10px] text-[var(--color-muted)] ml-auto">{relativeDate(s.created_at)}</span>
                    </div>
                    <p className="text-sm text-[var(--color-muted-light)] line-clamp-2">{s.content}</p>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Blog Post Detail Slide-out */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-2xl bg-[var(--color-admin-surface)] border-l border-[var(--color-admin-border)] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[var(--color-admin-border)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-[var(--color-foreground-strong)] line-clamp-1">
                  {selected.title || 'Generating...'}
                </h2>
                <button onClick={() => setSelected(null)} className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] text-xl cursor-pointer">&times;</button>
              </div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {(() => { const b = STATUS_BADGE[selected.status] || STATUS_BADGE.draft; return (
                  <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full" style={{ backgroundColor: b.bg, color: b.text }}>{b.label}</span>
                ); })()}
                {selected.category && <span className="text-xs text-[var(--color-muted)]">{selected.category}</span>}
                {selected.reading_time_min > 0 && <span className="text-xs text-[var(--color-muted)]">{selected.reading_time_min} min</span>}
                {selected.generation_error && <span className="text-xs text-red-400">Error: {selected.generation_error}</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selected.status === 'review' && (
                  <>
                    <button
                      onClick={() => updatePost(selected.id, { status: 'published' })}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors cursor-pointer"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => updatePost(selected.id, { status: 'draft' })}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors cursor-pointer"
                    >
                      Reject to Draft
                    </button>
                  </>
                )}
                {selected.status === 'published' && (
                  <button
                    onClick={() => updatePost(selected.id, { status: 'archived' })}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-admin-border)] text-[var(--color-muted-light)] hover:bg-[var(--color-admin-border)]/80 transition-colors cursor-pointer"
                  >
                    Archive
                  </button>
                )}
                <button
                  onClick={() => deletePost(selected.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-admin-border)]">
              {(['preview', 'edit', 'social', 'review'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
                    detailTab === tab
                      ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-muted-light)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="px-6 py-5">
              {detailTab === 'preview' && (
                <div>
                  {selected.content ? (
                    <MarkdownContent content={selected.content} />
                  ) : (
                    <div className="py-12 text-center">
                      {['topic_research', 'outlining', 'drafting', 'reviewing', 'social_gen'].includes(selected.status) ? (
                        <>
                          <div className="flex justify-center mb-3">
                            <div className="w-5 h-5 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
                          </div>
                          <p className="text-sm text-[var(--color-muted)]">
                            Content is being generated ({STATUS_BADGE[selected.status]?.label || selected.status})...
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-[var(--color-muted)]">No content yet.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'edit' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Title</label>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Content (Markdown)</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={20}
                      className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-muted-light)] resize-y focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] font-mono"
                    />
                  </div>
                  <button
                    onClick={() => { updatePost(selected.id, { title: editTitle, content: editContent }); }}
                    className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              )}

              {detailTab === 'social' && (
                <div>
                  {selected.social_posts && selected.social_posts.length > 0 ? (
                    <div className="space-y-4">
                      {selected.social_posts.map((sp, i) => (
                        <div key={i} className="bg-[var(--color-admin-bg)] rounded-lg p-4">
                          <p className="text-xs font-bold text-[var(--color-accent)] mb-2 uppercase">{sp.platform}</p>
                          <p className="text-sm text-[var(--color-muted-light)] whitespace-pre-wrap">{sp.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-muted)] py-12 text-center">
                      Social variants will be generated during the pipeline.
                    </p>
                  )}
                </div>
              )}

              {detailTab === 'review' && (
                <div>
                  {selected.generation_data && (selected.generation_data as Record<string, unknown>).review ? (
                    <div className="space-y-4">
                      {(() => {
                        const review = (selected.generation_data as Record<string, unknown>).review as Record<string, unknown>;
                        return (
                          <>
                            <div className="flex items-center gap-4 mb-4">
                              <div className="text-center">
                                <p className="text-2xl font-light text-[var(--color-accent)]">{String(review.overall_score)}/10</p>
                                <p className="text-[10px] text-[var(--color-muted)]">Quality</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-light text-[var(--color-accent)]">{String(review.seo_score)}/10</p>
                                <p className="text-[10px] text-[var(--color-muted)]">SEO</p>
                              </div>
                              <div className="text-center">
                                <p className={`text-sm font-medium ${review.brand_consistent ? 'text-green-400' : 'text-red-400'}`}>
                                  {review.brand_consistent ? 'On Brand' : 'Off Brand'}
                                </p>
                              </div>
                              {review.needs_human_review === true && (
                                <span className="px-2 py-1 text-[10px] rounded-full bg-yellow-500/15 text-yellow-400 font-medium">
                                  Needs Human Review
                                </span>
                              )}
                            </div>
                            <div className="bg-[var(--color-admin-bg)] rounded-lg p-4">
                              <p className="text-sm text-[var(--color-muted-light)]">{String(review.quality_notes)}</p>
                            </div>
                            {Array.isArray(review.issues) && review.issues.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-[var(--color-foreground-strong)] mb-2">Issues</p>
                                {(review.issues as { severity: string; description: string; suggestion: string }[]).map((issue, i) => (
                                  <div key={i} className={`mb-2 p-3 rounded-lg text-xs ${
                                    issue.severity === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                                    issue.severity === 'major' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                                    'bg-[var(--color-admin-bg)]'
                                  }`}>
                                    <p className="font-medium text-[var(--color-foreground-strong)]">[{issue.severity}] {issue.description}</p>
                                    <p className="text-[var(--color-muted-light)] mt-1">{issue.suggestion}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-muted)] py-12 text-center">
                      Review data will be available after the Guardian reviews the post.
                    </p>
                  )}
                </div>
              )}
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
                  <span className="text-sm font-bold text-[var(--color-accent)]">{PLATFORM_ICON[selectedSocial.platform]}</span>
                  <span className="text-sm font-medium text-[var(--color-foreground-strong)] capitalize">{selectedSocial.platform}</span>
                </div>
                <button onClick={() => setSelectedSocial(null)} className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] text-xl cursor-pointer">&times;</button>
              </div>
              <div className="flex items-center gap-2">
                {selectedSocial.status === 'draft' && (
                  <button
                    onClick={() => { updateSocial(selectedSocial.id, { status: 'approved' }); setSelectedSocial(null); }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={async () => {
                    await fetch('/api/admin/social', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedSocial.id }) });
                    setSelectedSocial(null);
                    fetchSocial();
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Content</label>
                <textarea
                  value={editSocialContent}
                  onChange={(e) => setEditSocialContent(e.target.value)}
                  rows={8}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-muted-light)] resize-y focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
              <button
                onClick={() => { updateSocial(selectedSocial.id, { content: editSocialContent }); setSelectedSocial(null); }}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                Save
              </button>
              <p className="text-[10px] text-[var(--color-muted)]">
                {editSocialContent.length} characters
                {selectedSocial.platform === 'twitter' && editSocialContent.length > 280 && (
                  <span className="text-red-400 ml-2">Over 280 char limit!</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

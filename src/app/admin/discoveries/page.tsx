'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Discovery {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  company: string | null;
  role: string | null;
  business_overview: string | null;
  team_size: string | null;
  pain_points: string | null;
  repetitive_work: string | null;
  ai_experience: string | null;
  ai_tools_detail: string | null;
  magic_wand: string | null;
  success_vision: string | null;
  anything_else: string | null;
  status: string;
  notes: string | null;
  research_brief: Record<string, unknown> | null;
  assessment_doc: string | null;
  meeting_prep_doc: string | null;
  pipeline_status: string | null;
  pipeline_error: string | null;
  pipeline_completed_at: string | null;
}

const STATUSES = ['all', 'new', 'reviewed', 'meeting_scheduled', 'proposal_sent', 'engaged', 'archived'] as const;

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-amber-100 text-amber-800',
  reviewed: 'bg-blue-100 text-blue-800',
  meeting_scheduled: 'bg-purple-100 text-purple-800',
  proposal_sent: 'bg-indigo-100 text-indigo-800',
  engaged: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'new',
  reviewed: 'reviewed',
  meeting_scheduled: 'meeting scheduled',
  proposal_sent: 'proposal sent',
  engaged: 'engaged',
  archived: 'archived',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export default function AdminDiscoveriesPage() {
  const router = useRouter();
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Discovery | null>(null);
  const [notes, setNotes] = useState('');
  const [detailTab, setDetailTab] = useState<'overview' | 'research' | 'assessment' | 'meeting'>('overview');

  const fetchDiscoveries = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/discoveries?${params}`);
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    if (Array.isArray(data)) setDiscoveries(data);
    setLoading(false);
  }, [filter, search, router]);

  useEffect(() => { fetchDiscoveries(); }, [fetchDiscoveries]);

  const updateDiscovery = async (id: string, updates: Partial<Discovery>) => {
    await fetch('/api/admin/discoveries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    fetchDiscoveries();
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, ...updates } : prev);
    }
  };

  const openDetail = (d: Discovery) => {
    setSelected(d);
    setNotes(d.notes || '');
    setDetailTab('overview');
    if (d.status === 'new') {
      updateDiscovery(d.id, { status: 'reviewed' });
    }
  };

  const total = discoveries.length;
  const newCount = discoveries.filter((d) => d.status === 'new').length;
  const thisWeek = discoveries.filter((d) => Date.now() - new Date(d.created_at).getTime() < 7 * 86400000).length;
  const thisMonth = discoveries.filter((d) => {
    const dt = new Date(d.created_at);
    const now = new Date();
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  }).length;

  const detailFields: { label: string; key: keyof Discovery }[] = [
    { label: 'Email', key: 'email' },
    { label: 'Company', key: 'company' },
    { label: 'Role', key: 'role' },
    { label: 'Business Overview', key: 'business_overview' },
    { label: 'Team Size', key: 'team_size' },
    { label: 'Pain Points', key: 'pain_points' },
    { label: 'Repetitive Work', key: 'repetitive_work' },
    { label: 'AI Experience', key: 'ai_experience' },
    { label: 'AI Tools Detail', key: 'ai_tools_detail' },
    { label: 'Magic Wand', key: 'magic_wand' },
    { label: 'Success Vision', key: 'success_vision' },
    { label: 'Anything Else', key: 'anything_else' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-200">
          <Link href="/admin" className="text-base font-semibold text-gray-900">zev.ai admin</Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link href="/admin/tola" className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <TreeIcon />
            TOLA Agents
          </Link>
          <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <InboxIcon />
            Contacts
          </Link>
          <Link href="/admin/discoveries" className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-900">
            <ClipboardIcon />
            Discoveries
          </Link>
        </nav>
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={() => {
              document.cookie = 'admin_auth=; path=/; max-age=0';
              router.push('/admin/login');
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors w-full"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-900">Discovery Submissions</h1>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total" value={total} />
            <StatCard label="New" value={newCount} accent />
            <StatCard label="This week" value={thisWeek} />
            <StatCard label="This month" value={thisMonth} />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    filter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {STATUS_LABELS[s] || s}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search name, company, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-sm text-gray-500 py-12 text-center">Loading...</p>
          ) : discoveries.length === 0 ? (
            <p className="text-sm text-gray-500 py-12 text-center">No submissions yet.</p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Team</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Pipeline</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {discoveries.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => openDetail(d)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors hover:bg-blue-50/50 ${
                        d.status === 'new' ? 'font-medium' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{relativeDate(d.created_at)}</td>
                      <td className="px-4 py-3 text-gray-900">{d.name}</td>
                      <td className="px-4 py-3 text-gray-600">{d.company || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{d.role || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{d.team_size || '—'}</td>
                      <td className="px-4 py-3">
                        <PipelineBadge status={d.pipeline_status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${STATUS_COLORS[d.status] || STATUS_COLORS.new}`}>
                          {STATUS_LABELS[d.status] || d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tabbed detail slide-out */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setSelected(null)} />
          <div className="w-full max-w-2xl bg-white shadow-xl border-l border-gray-200 overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">{selected.name}</h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>
              <div className="flex items-center gap-3">
                <PipelineBadge status={selected.pipeline_status} />
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[selected.status] || STATUS_COLORS.new}`}>
                  {STATUS_LABELS[selected.status] || selected.status}
                </span>
                {selected.pipeline_error && (
                  <span className="text-xs text-red-600">Error: {selected.pipeline_error}</span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {(['overview', 'research', 'assessment', 'meeting'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors ${
                    detailTab === tab
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'meeting' ? 'Meeting Prep' : tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="px-6 py-5">
              {detailTab === 'overview' && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Submitted</p>
                    <p className="text-sm text-gray-800">{formatDate(selected.created_at)}</p>
                  </div>
                  {detailFields.map(({ label, key }) => {
                    const val = selected[key];
                    if (!val) return null;
                    const strVal = String(val);
                    return (
                      <div key={key}>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {strVal}
                          {key === 'email' && (
                            <a href={`mailto:${strVal}`} className="text-blue-600 hover:underline text-sm ml-2">Reply</a>
                          )}
                        </p>
                      </div>
                    );
                  })}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
                    <select
                      value={selected.status}
                      onChange={(e) => updateDiscovery(selected.id, { status: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {STATUSES.filter((s) => s !== 'all').map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onBlur={() => updateDiscovery(selected.id, { notes })}
                      placeholder="Add internal notes..."
                      rows={4}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {detailTab === 'research' && (
                <div>
                  {selected.research_brief ? (
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 overflow-x-auto">
                      {JSON.stringify(selected.research_brief, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-500 py-8 text-center">
                      {selected.pipeline_status === 'researching'
                        ? 'Visionary is researching...'
                        : selected.pipeline_status === 'pending'
                          ? 'Pipeline not started yet.'
                          : 'No research brief available.'}
                    </p>
                  )}
                </div>
              )}

              {detailTab === 'assessment' && (
                <div>
                  {selected.assessment_doc ? (
                    <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selected.assessment_doc}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-8 text-center">
                      {selected.pipeline_status === 'scoping'
                        ? 'Architect is scoping...'
                        : 'No assessment available.'}
                    </p>
                  )}
                </div>
              )}

              {detailTab === 'meeting' && (
                <div>
                  {selected.meeting_prep_doc ? (
                    <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selected.meeting_prep_doc}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-8 text-center">
                      {selected.pipeline_status === 'synthesizing'
                        ? 'Oracle is synthesizing...'
                        : 'No meeting prep available.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PIPELINE_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  researching: 'bg-blue-100 text-blue-800',
  scoping: 'bg-purple-100 text-purple-800',
  synthesizing: 'bg-indigo-100 text-indigo-800',
  complete: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

function PipelineBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${PIPELINE_COLORS[status] || PIPELINE_COLORS.pending}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accent ? 'text-amber-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function TreeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-4 4m4-4l4 4m-8 4h8m-10 4h12" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  );
}

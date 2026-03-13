'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Contact {
  id: string;
  created_at: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  status: string;
  notes: string | null;
}

const STATUSES = ['all', 'new', 'read', 'replied', 'archived'] as const;

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-amber-100 text-amber-800',
  read: 'bg-blue-100 text-blue-800',
  replied: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

export default function AdminContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [notes, setNotes] = useState('');

  const fetchContacts = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/contacts?${params}`);
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    if (Array.isArray(data)) setContacts(data);
    setLoading(false);
  }, [filter, search, router]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    await fetch('/api/admin/contacts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    fetchContacts();
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, ...updates } : prev);
    }
  };

  const openDetail = (contact: Contact) => {
    setSelected(contact);
    setNotes(contact.notes || '');
    if (contact.status === 'new') {
      updateContact(contact.id, { status: 'read' });
    }
  };

  // Stats
  const total = contacts.length;
  const newCount = contacts.filter((c) => c.status === 'new').length;
  const thisWeek = contacts.filter((c) => Date.now() - new Date(c.created_at).getTime() < 7 * 86400000).length;
  const thisMonth = contacts.filter((c) => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-200">
          <Link href="/admin" className="text-base font-semibold text-gray-900">zev.ai admin</Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-900">
            <InboxIcon />
            Contacts
          </Link>
          <Link href="/admin/discoveries" className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
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
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-900">Contact Submissions</h1>
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
                  className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    filter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search name, email, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-sm text-gray-500 py-12 text-center">Loading...</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-gray-500 py-12 text-center">No submissions yet.</p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Message</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => openDetail(c)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors hover:bg-blue-50/50 ${
                        c.status === 'new' ? 'font-medium' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{relativeDate(c.created_at)}</td>
                      <td className="px-4 py-3 text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.email}</td>
                      <td className="px-4 py-3 text-gray-600">{c.company || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.message}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[c.status] || STATUS_COLORS.new}`}>
                          {c.status}
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

      {/* Detail slide-out */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setSelected(null)} />
          <div className="w-full max-w-lg bg-white shadow-xl border-l border-gray-200 overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <Field label="Email" value={selected.email}>
                <a href={`mailto:${selected.email}`} className="text-blue-600 hover:underline text-sm ml-2">Reply</a>
              </Field>
              <Field label="Company" value={selected.company || '—'} />
              <Field label="Submitted" value={formatDate(selected.created_at)} />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Message</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <select
                  value={selected.status}
                  onChange={(e) => updateContact(selected.id, { status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.filter((s) => s !== 'all').map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => updateContact(selected.id, { notes })}
                  placeholder="Add internal notes..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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

function Field({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-800">{value}{children}</p>
    </div>
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

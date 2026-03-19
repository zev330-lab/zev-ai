'use client';

import { useState, useEffect, useCallback } from 'react';
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

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', label: 'New' },
  read: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa', label: 'Read' },
  replied: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80', label: 'Replied' },
  archived: { bg: 'rgba(107,114,128,0.15)', text: '#6b7280', label: 'Archived' },
};

const STATUSES = ['all', 'new', 'read', 'replied', 'archived'] as const;

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
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

  const total = contacts.length;
  const newCount = contacts.filter((c) => c.status === 'new').length;
  const thisWeek = contacts.filter(
    (c) => Date.now() - new Date(c.created_at).getTime() < 7 * 86400000
  ).length;
  const thisMonth = contacts.filter((c) => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--color-admin-border)] shrink-0">
        <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">Contacts</h1>
        <p className="text-xs text-[var(--color-muted)] mt-1">
          {total} total &middot; {newCount} new
        </p>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="Total" value={total} />
          <MiniStat label="New" value={newCount} accent />
          <MiniStat label="This Week" value={thisWeek} />
          <MiniStat label="This Month" value={thisMonth} />
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-[var(--color-admin-border)] flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex rounded-lg border border-[var(--color-admin-border)] overflow-hidden">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-[11px] font-medium capitalize transition-colors whitespace-nowrap cursor-pointer ${
                filter === s
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-admin-surface)] text-[var(--color-muted-light)] hover:bg-[var(--color-admin-border)]'
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
          className="px-3 py-1.5 text-sm bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg text-[var(--color-foreground-strong)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] w-64"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <p className="text-sm text-[var(--color-muted)] py-12 text-center">Loading...</p>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] py-12 text-center">No contacts yet.</p>
        ) : (
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-admin-border)]">
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Date</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Email</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Company</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Message</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => {
                  const badge = STATUS_BADGE[c.status] || STATUS_BADGE.new;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => openDetail(c)}
                      className={`border-b border-[var(--color-admin-border)]/50 cursor-pointer transition-colors hover:bg-[var(--color-admin-border)]/30 ${
                        c.status === 'new' ? 'font-medium' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-[var(--color-muted)] whitespace-nowrap text-xs">
                        {relativeDate(c.created_at)}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-foreground-strong)]">{c.name}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-light)]">{c.email}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-light)]">{c.company || '--'}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-light)] max-w-xs truncate">{c.message}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full whitespace-nowrap"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail slide-out */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-lg bg-[var(--color-admin-surface)] border-l border-[var(--color-admin-border)] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[var(--color-admin-border)] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--color-foreground-strong)]">{selected.name}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] text-xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <DetailField label="Email" value={selected.email}>
                <a href={`mailto:${selected.email}`} className="text-[var(--color-accent)] hover:underline text-sm ml-2">
                  Reply
                </a>
              </DetailField>
              <DetailField label="Company" value={selected.company || '--'} />
              <DetailField label="Submitted" value={formatDate(selected.created_at)} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">Message</p>
                <p className="text-sm text-[var(--color-muted-light)] whitespace-pre-wrap leading-relaxed">
                  {selected.message}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">Status</p>
                <select
                  value={selected.status}
                  onChange={(e) => updateContact(selected.id, { status: e.target.value })}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                >
                  {STATUSES.filter((s) => s !== 'all').map((s) => (
                    <option key={s} value={s}>{STATUS_BADGE[s]?.label || s}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">Notes</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => updateContact(selected.id, { notes })}
                  placeholder="Add internal notes..."
                  rows={4}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-muted-light)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-muted)]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">{label}</p>
      <p className="text-sm text-[var(--color-muted-light)]">{value}{children}</p>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${accent ? 'text-amber-400' : 'text-[var(--color-foreground-strong)]'}`}>
        {value}
      </p>
    </div>
  );
}

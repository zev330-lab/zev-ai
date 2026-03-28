'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface NurtureSequence {
  id: string;
  discovery_id: string | null;
  prospect_email: string;
  prospect_name: string;
  sequence_type: string;
  current_step: number;
  status: string;
  next_send_at: string | null;
  last_sent_at: string | null;
  metadata: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface NurtureEmail {
  id: string;
  sequence_id: string;
  step_number: number;
  subject: string | null;
  body_html: string | null;
  body_text: string | null;
  status: string;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
}

const SEQ_TYPE_LABEL: Record<string, string> = {
  post_form: 'Post-Form',
  post_discovery: 'Post-Discovery',
  re_engagement: 'Re-Engagement',
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  active:    { bg: 'rgba(74,222,128,0.15)', text: '#4ade80' },
  paused:    { bg: 'rgba(250,204,21,0.15)', text: '#facc15' },
  completed: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
  cancelled: { bg: 'rgba(107,114,128,0.15)', text: '#6b7280' },
};

const EMAIL_STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending_approval: { bg: 'rgba(250,204,21,0.15)', text: '#facc15', label: 'Pending' },
  approved:         { bg: 'rgba(124,155,245,0.15)', text: '#7c9bf5', label: 'Approved' },
  sent:             { bg: 'rgba(74,222,128,0.15)', text: '#4ade80', label: 'Sent' },
  rejected:         { bg: 'rgba(248,113,113,0.15)', text: '#f87171', label: 'Rejected' },
};

const STEP_LABELS: Record<string, string[]> = {
  post_discovery: ['Report Ready', 'Check-In (48h)', 'Value Add (5d)', 'Final (10d)'],
  post_form: ['Thank You', 'Started Looking (24h)'],
  re_engagement: ['Re-Engage'],
};

function relativeDate(iso: string | null) {
  if (!iso) return '--';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 0) {
    const future = -mins;
    if (future < 60) return `in ${future}m`;
    const hrs = Math.floor(future / 60);
    if (hrs < 24) return `in ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `in ${days}d`;
  }
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(iso: string | null) {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function AdminNurturePage() {
  const router = useRouter();
  const [sequences, setSequences] = useState<NurtureSequence[]>([]);
  const [emails, setEmails] = useState<NurtureEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<NurtureSequence | null>(null);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [bulkIds, setBulkIds] = useState<Set<string>>(new Set());

  const fetchSequences = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    const res = await fetch(`/api/admin/nurture?${params}`);
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    if (Array.isArray(data)) setSequences(data);
    setLoading(false);
  }, [filter, router]);

  const fetchEmails = useCallback(async (sequenceId: string) => {
    setEmailsLoading(true);
    const res = await fetch(`/api/admin/nurture?view=emails&sequence_id=${sequenceId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) setEmails(data);
    }
    setEmailsLoading(false);
  }, []);

  useEffect(() => { fetchSequences(); }, [fetchSequences]);

  useEffect(() => {
    if (selected) {
      fetchEmails(selected.id);
      setBulkIds(new Set());
    } else {
      setEmails([]);
    }
  }, [selected, fetchEmails]);

  const updateEmail = async (id: string, status: 'approved' | 'rejected') => {
    await fetch('/api/admin/nurture', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'email', id, status }),
    });
    if (selected) fetchEmails(selected.id);
  };

  const bulkApprove = async () => {
    const ids = Array.from(bulkIds);
    if (ids.length === 0) return;
    await fetch('/api/admin/nurture', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'email', ids, status: 'approved' }),
    });
    setBulkIds(new Set());
    if (selected) fetchEmails(selected.id);
  };

  const updateSequence = async (id: string, status: string) => {
    await fetch('/api/admin/nurture', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'sequence', id, status }),
    });
    fetchSequences();
    if (selected?.id === id) {
      setSelected(prev => prev ? { ...prev, status } : prev);
    }
  };

  const toggleBulk = (id: string) => {
    setBulkIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Stats
  const activeCount = sequences.filter(s => s.status === 'active').length;
  const pendingEmails = emails.filter(e => e.status === 'pending_approval').length;
  const sentEmails = emails.filter(e => e.status === 'sent').length;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-foreground-strong)]">Nurture Sequences</h1>
          <p className="text-xs text-[var(--color-muted)] mt-1">Catalyst agent — progressive engagement follow-ups</p>
        </div>
        <div className="flex items-center gap-3">
          <MiniStat label="Active" value={activeCount} color="#4ade80" />
          <MiniStat label="Total" value={sequences.length} color="#7c9bf5" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {['all', 'active', 'paused', 'completed', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setSelected(null); }}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
              filter === s
                ? 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/10'
                : 'border-[var(--color-admin-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)]'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Sequence list */}
        <div className={`${selected ? 'w-1/2' : 'w-full'} space-y-2 transition-all`}>
          {loading ? (
            <div className="text-center text-[var(--color-muted)] py-12 text-sm">Loading sequences...</div>
          ) : sequences.length === 0 ? (
            <div className="text-center text-[var(--color-muted)] py-12 text-sm">No sequences found</div>
          ) : (
            sequences.map(seq => (
              <div
                key={seq.id}
                onClick={() => setSelected(seq.id === selected?.id ? null : seq)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selected?.id === seq.id
                    ? 'border-[var(--color-accent)]/50 bg-[var(--color-admin-surface)]'
                    : 'border-[var(--color-admin-border)] bg-[var(--color-admin-surface)] hover:border-[var(--color-accent)]/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--color-foreground-strong)] truncate">
                        {seq.prospect_name || seq.prospect_email}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: STATUS_BADGE[seq.status]?.bg || 'rgba(107,114,128,0.15)',
                          color: STATUS_BADGE[seq.status]?.text || '#6b7280',
                        }}
                      >
                        {seq.status}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--color-muted)] mt-1">{seq.prospect_email}</div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-muted)]">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--color-admin-bg)]">
                        {SEQ_TYPE_LABEL[seq.sequence_type] || seq.sequence_type}
                      </span>
                      <span>Step {seq.current_step + 1}/{(STEP_LABELS[seq.sequence_type] || []).length || '?'}</span>
                      {seq.next_send_at && <span>Next: {relativeDate(seq.next_send_at)}</span>}
                      <span>{relativeDate(seq.created_at)}</span>
                    </div>
                    {/* Step progress bar */}
                    <div className="mt-2 flex gap-1">
                      {(STEP_LABELS[seq.sequence_type] || []).map((label, i) => (
                        <div key={i} className="flex-1" title={label}>
                          <div
                            className="h-1.5 rounded-full transition-colors"
                            style={{
                              background: i < seq.current_step ? '#4ade80'
                                : i === seq.current_step ? '#7c9bf5'
                                : 'rgba(255,255,255,0.08)',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Quick actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {seq.status === 'active' && (
                      <button
                        onClick={e => { e.stopPropagation(); updateSequence(seq.id, 'paused'); }}
                        className="text-[10px] px-2 py-1 rounded-lg border border-[var(--color-admin-border)] text-[var(--color-muted)] hover:text-yellow-400 hover:border-yellow-400/30 transition-colors cursor-pointer"
                        title="Pause"
                      >
                        Pause
                      </button>
                    )}
                    {seq.status === 'paused' && (
                      <button
                        onClick={e => { e.stopPropagation(); updateSequence(seq.id, 'active'); }}
                        className="text-[10px] px-2 py-1 rounded-lg border border-[var(--color-admin-border)] text-[var(--color-muted)] hover:text-green-400 hover:border-green-400/30 transition-colors cursor-pointer"
                        title="Resume"
                      >
                        Resume
                      </button>
                    )}
                    {(seq.status === 'active' || seq.status === 'paused') && (
                      <button
                        onClick={e => { e.stopPropagation(); updateSequence(seq.id, 'cancelled'); }}
                        className="text-[10px] px-2 py-1 rounded-lg border border-[var(--color-admin-border)] text-[var(--color-muted)] hover:text-red-400 hover:border-red-400/30 transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Email detail panel */}
        {selected && (
          <div className="w-1/2 space-y-4">
            <div className="p-4 rounded-xl border border-[var(--color-admin-border)] bg-[var(--color-admin-surface)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[var(--color-foreground-strong)]">
                  Emails — {selected.prospect_name || selected.prospect_email}
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] cursor-pointer text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              {/* Sequence metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <DetailField label="Type" value={SEQ_TYPE_LABEL[selected.sequence_type] || selected.sequence_type} />
                <DetailField label="Status" value={selected.status} />
                <DetailField label="Created" value={formatDate(selected.created_at)} />
                <DetailField label="Next Send" value={selected.next_send_at ? formatDate(selected.next_send_at) : 'None scheduled'} />
                <DetailField label="Last Sent" value={selected.last_sent_at ? formatDate(selected.last_sent_at) : 'Never'} />
                {selected.metadata?.company && <DetailField label="Company" value={String(selected.metadata.company)} />}
                {selected.discovery_id && (
                  <DetailField label="Discovery" value={
                    <a
                      href={`/admin/discoveries?id=${selected.discovery_id}`}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      View
                    </a>
                  } />
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mb-4">
                <MiniStat label="Pending" value={pendingEmails} color="#facc15" />
                <MiniStat label="Sent" value={sentEmails} color="#4ade80" />
                <MiniStat label="Total" value={emails.length} color="#7c9bf5" />
              </div>

              {/* Bulk approve bar */}
              {bulkIds.size > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 mb-3">
                  <span className="text-xs text-[var(--color-accent)]">{bulkIds.size} selected</span>
                  <button
                    onClick={bulkApprove}
                    className="text-xs px-3 py-1 rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Approve All
                  </button>
                  <button
                    onClick={() => setBulkIds(new Set())}
                    className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Email list */}
              {emailsLoading ? (
                <div className="text-center text-[var(--color-muted)] py-8 text-xs">Loading emails...</div>
              ) : emails.length === 0 ? (
                <div className="text-center text-[var(--color-muted)] py-8 text-xs">No emails generated yet. The Catalyst agent generates drafts every 30 minutes.</div>
              ) : (
                <div className="space-y-3">
                  {emails.map(email => {
                    const stepLabel = (STEP_LABELS[selected.sequence_type] || [])[email.step_number] || `Step ${email.step_number}`;
                    const badge = EMAIL_STATUS_BADGE[email.status] || EMAIL_STATUS_BADGE.pending_approval;
                    return (
                      <div
                        key={email.id}
                        className="p-3 rounded-lg border border-[var(--color-admin-border)] bg-[var(--color-admin-bg)]"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {email.status === 'pending_approval' && (
                            <input
                              type="checkbox"
                              checked={bulkIds.has(email.id)}
                              onChange={() => toggleBulk(email.id)}
                              className="rounded border-[var(--color-admin-border)] cursor-pointer"
                              onClick={e => e.stopPropagation()}
                            />
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-admin-surface)] text-[var(--color-muted)]">
                            {stepLabel}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: badge.bg, color: badge.text }}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] text-[var(--color-muted)] ml-auto">
                            {email.sent_at ? `Sent ${relativeDate(email.sent_at)}` : relativeDate(email.created_at)}
                          </span>
                        </div>

                        {email.subject && (
                          <div className="text-xs font-medium text-[var(--color-foreground-strong)] mb-1">
                            {email.subject}
                          </div>
                        )}

                        {email.body_text && (
                          <div className="text-xs text-[var(--color-muted-light)] whitespace-pre-wrap line-clamp-4 mb-2">
                            {email.body_text}
                          </div>
                        )}

                        {email.body_html && !email.body_text && (
                          <div
                            className="text-xs text-[var(--color-muted-light)] mb-2 [&_a]:text-[var(--color-accent)] [&_a]:underline line-clamp-4"
                            dangerouslySetInnerHTML={{ __html: email.body_html }}
                          />
                        )}

                        {/* Actions */}
                        {email.status === 'pending_approval' && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => updateEmail(email.id, 'approved')}
                              className="text-[10px] px-3 py-1 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateEmail(email.id, 'rejected')}
                              className="text-[10px] px-3 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="font-semibold" style={{ color }}>{value}</span>
      <span className="text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-[var(--color-muted)] mb-0.5">{label}</div>
      <div className="text-xs text-[var(--color-foreground-strong)]">{value}</div>
    </div>
  );
}

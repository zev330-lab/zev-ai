'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface OpusMessage {
  id: string;
  from_agent: string;
  to_agent: string;
  message: string;
  message_type: string;
  status: string;
  in_reply_to: string | null;
  created_at: string;
  read_at: string | null;
}

interface DisplayMessage extends OpusMessage {
  /** If this is a collapsed broadcast group, contains all grouped message IDs */
  _groupIds?: string[];
  /** Display label for the recipient */
  _toLabel?: string;
}

/** Group broadcast messages: same sender, same text, within 60s → single row */
function groupBroadcasts(msgs: OpusMessage[]): DisplayMessage[] {
  const result: DisplayMessage[] = [];
  const consumed = new Set<string>();

  for (let i = 0; i < msgs.length; i++) {
    if (consumed.has(msgs[i].id)) continue;
    const msg = msgs[i];
    const group: OpusMessage[] = [msg];

    // Look for siblings with same sender + same message text within 60s
    for (let j = i + 1; j < msgs.length; j++) {
      if (consumed.has(msgs[j].id)) continue;
      const other = msgs[j];
      if (
        other.from_agent === msg.from_agent &&
        other.message === msg.message &&
        other.message_type === msg.message_type &&
        Math.abs(new Date(other.created_at).getTime() - new Date(msg.created_at).getTime()) < 60000
      ) {
        group.push(other);
        consumed.add(other.id);
      }
    }

    if (group.length >= 2) {
      // Collapsed broadcast — use the worst status (unread > read > actioned)
      const statusPriority: Record<string, number> = { unread: 0, read: 1, actioned: 2 };
      const worstStatus = group.reduce((worst, m) =>
        (statusPriority[m.status] ?? 0) < (statusPriority[worst.status] ?? 0) ? m : worst
      , group[0]);
      result.push({
        ...worstStatus,
        _groupIds: group.map(m => m.id),
        _toLabel: 'Everyone',
      });
    } else {
      result.push(msg);
    }
  }

  return result;
}

interface CompletedTask {
  id: string;
  title: string;
  assigned_to: string;
  completed_at: string;
}

const TYPE_BADGE: Record<string, { bg: string; text: string }> = {
  directive:     { bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
  question:      { bg: 'rgba(250,204,21,0.15)', text: '#facc15' },
  status_update: { bg: 'rgba(124,155,245,0.15)', text: '#7c9bf5' },
  response:      { bg: 'rgba(74,222,128,0.15)', text: '#4ade80' },
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  unread:   { bg: 'rgba(250,204,21,0.15)', text: '#facc15' },
  read:     { bg: 'rgba(124,155,245,0.15)', text: '#7c9bf5' },
  actioned: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80' },
};

function relativeDate(iso: string | null) {
  if (!iso) return '--';
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

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - msgDay.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

const AGENT_COLORS: Record<string, string> = {
  cain: '#7c9bf5',
  abel: '#4ade80',
  opus: '#c4b5e0',
  zev: '#f59e0b',
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<OpusMessage[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendText, setSendText] = useState('');
  const [sendType, setSendType] = useState('directive');
  const [sendTo, setSendTo] = useState('everyone');
  const [sending, setSending] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const topRef = useRef<HTMLDivElement>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const hasActiveFilters = filterType !== null || filterStatus !== null || searchQuery !== '';

  const filteredMessages = groupBroadcasts(messages.filter(msg => {
    if (filterType && msg.message_type !== filterType) return false;
    if (filterStatus && msg.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!msg.message.toLowerCase().includes(q) &&
          !msg.from_agent.toLowerCase().includes(q) &&
          !msg.to_agent.toLowerCase().includes(q)) return false;
    }
    return true;
  }));

  const fetchMessages = useCallback(async () => {
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [msgRes, tasksRes] = await Promise.all([
        fetch(`/api/opus/messages?since=${since}`),
        fetch('/api/admin/cain?status=done'),
      ]);
      if (msgRes.ok) {
        const data = await msgRes.json();
        setMessages(data);
      }
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const done = (Array.isArray(tasksData) ? tasksData : [])
          .filter((t: CompletedTask) => t.completed_at && new Date(t.completed_at).getTime() > cutoff)
          .sort((a: CompletedTask, b: CompletedTask) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
        setCompletedTasks(done);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  async function handleReply(messageId: string) {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/opus/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply_message: replyText.trim(),
          reply_type: 'response',
          from_agent: 'zev',
        }),
      });
      if (res.ok) {
        setReplyTo(null);
        setReplyText('');
        fetchMessages();
      }
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    if (!sendText.trim()) return;
    setSending(true);
    try {
      const recipients = sendTo === 'everyone' ? ['opus', 'cain', 'abel'] : [sendTo];
      await Promise.all(
        recipients.map(agent =>
          fetch('/api/opus/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: sendText.trim(),
              message_type: sendType,
              to_agent: agent,
              from_agent: 'zev',
            }),
          })
        )
      );
      setSendText('');
      fetchMessages();
    } finally {
      setSending(false);
    }
  }

  async function markStatus(id: string, status: string, groupIds?: string[]) {
    const ids = groupIds || [id];
    await Promise.all(
      ids.map(mid =>
        fetch(`/api/opus/messages/${mid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      )
    );
    fetchMessages();
  }

  return (
    <div ref={topRef} style={{ padding: '2rem', maxWidth: '64rem', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '1.5rem' }}>
        Messages
      </h1>

      {/* Compose */}
      <div style={{
        background: 'rgba(124,155,245,0.06)',
        border: '1px solid rgba(124,155,245,0.15)',
        borderRadius: '0.75rem',
        padding: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <select
            value={sendTo}
            onChange={e => setSendTo(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.375rem',
              color: '#d0d0da',
              padding: '0.375rem 0.5rem',
              fontSize: '0.8rem',
            }}
          >
            <option value="everyone">To: Everyone</option>
            <option value="cain">To: Cain</option>
            <option value="opus">To: Opus</option>
            <option value="abel">To: Abel</option>
          </select>
          <select
            value={sendType}
            onChange={e => setSendType(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.375rem',
              color: '#d0d0da',
              padding: '0.375rem 0.5rem',
              fontSize: '0.8rem',
            }}
          >
            <option value="directive">Directive</option>
            <option value="question">Question</option>
            <option value="status_update">Status Update</option>
            <option value="response">Response</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={sendText}
            onChange={e => setSendText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Send a message as Zev..."
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.375rem',
              color: '#f0f0f5',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !sendText.trim()}
            style={{
              background: '#7c9bf5',
              color: '#0a0e1a',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: sending ? 'wait' : 'pointer',
              opacity: !sendText.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.375rem',
            color: '#f0f0f5',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            marginBottom: '0.75rem',
          }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#6b7280', fontSize: '0.75rem', marginRight: '0.25rem' }}>Type:</span>
          {Object.keys(TYPE_BADGE).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? null : type)}
              style={{
                background: filterType === type ? TYPE_BADGE[type].bg : 'rgba(255,255,255,0.03)',
                color: filterType === type ? TYPE_BADGE[type].text : '#6b7280',
                border: `1px solid ${filterType === type ? TYPE_BADGE[type].text + '40' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '9999px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: filterType === type ? 600 : 400,
              }}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
          <span style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '0.75rem', marginRight: '0.25rem' }}>Status:</span>
          {Object.keys(STATUS_BADGE).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? null : status)}
              style={{
                background: filterStatus === status ? STATUS_BADGE[status].bg : 'rgba(255,255,255,0.03)',
                color: filterStatus === status ? STATUS_BADGE[status].text : '#6b7280',
                border: `1px solid ${filterStatus === status ? STATUS_BADGE[status].text + '40' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '9999px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: filterStatus === status ? 600 : 400,
              }}
            >
              {status}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterType(null); setFilterStatus(null); setSearchQuery(''); }}
              style={{
                background: 'rgba(248,113,113,0.1)',
                color: '#f87171',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: '9999px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.7rem',
                cursor: 'pointer',
                marginLeft: '0.5rem',
              }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      {loading ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>Loading...</p>
      ) : filteredMessages.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
          {messages.length === 0 ? 'No messages yet.' : 'No messages match your filters.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredMessages.map((msg, idx) => {
            const typeBadge = TYPE_BADGE[msg.message_type] || TYPE_BADGE.status_update;
            const statusBadge = STATUS_BADGE[msg.status] || STATUS_BADGE.unread;
            const currentDay = dayLabel(msg.created_at);
            const prevDay = idx > 0 ? dayLabel(filteredMessages[idx - 1].created_at) : null;
            const showDateSeparator = currentDay !== prevDay;

            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {showDateSeparator && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: idx === 0 ? '0 0 0.25rem' : '0.5rem 0 0.25rem',
                }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {currentDay}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                </div>
              )}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${msg.status === 'unread' ? 'rgba(250,204,21,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '0.75rem',
                  padding: '1rem',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: '#f0f0f5', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                    {msg.from_agent}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>→</span>
                  <span style={{ fontWeight: 600, color: msg._toLabel ? '#c4b5e0' : '#d0d0da', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                    {msg._toLabel || msg.to_agent}
                  </span>
                  <span
                    style={{
                      background: typeBadge.bg,
                      color: typeBadge.text,
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                    }}
                  >
                    {msg.message_type.replace('_', ' ')}
                  </span>
                  <span
                    style={{
                      background: statusBadge.bg,
                      color: statusBadge.text,
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                    }}
                  >
                    {msg.status}
                  </span>
                  {msg.in_reply_to && (
                    <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>↩ reply</span>
                  )}
                  <span style={{ color: '#6b7280', fontSize: '0.7rem', marginLeft: 'auto' }}>
                    {relativeDate(msg.created_at)}
                  </span>
                </div>

                {/* Body */}
                <p style={{ color: '#d0d0da', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {msg.message}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {msg.status === 'unread' && (
                    <button
                      onClick={() => markStatus(msg.id, 'read', msg._groupIds)}
                      style={{
                        background: 'rgba(124,155,245,0.1)',
                        color: '#7c9bf5',
                        border: '1px solid rgba(124,155,245,0.2)',
                        borderRadius: '0.375rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Mark Read
                    </button>
                  )}
                  {msg.status !== 'actioned' && (
                    <button
                      onClick={() => markStatus(msg.id, 'actioned', msg._groupIds)}
                      style={{
                        background: 'rgba(74,222,128,0.1)',
                        color: '#4ade80',
                        border: '1px solid rgba(74,222,128,0.2)',
                        borderRadius: '0.375rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Mark Actioned
                    </button>
                  )}
                  <button
                    onClick={() => setReplyTo(replyTo === msg.id ? null : msg.id)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: '#d0d0da',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.375rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Reply
                  </button>
                </div>

                {/* Reply box */}
                {replyTo === msg.id && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleReply(msg.id)}
                      placeholder="Reply as Zev..."
                      autoFocus
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.375rem',
                        color: '#f0f0f5',
                        padding: '0.375rem 0.5rem',
                        fontSize: '0.8rem',
                      }}
                    />
                    <button
                      onClick={() => handleReply(msg.id)}
                      disabled={sending || !replyText.trim()}
                      style={{
                        background: '#7c9bf5',
                        color: '#0a0e1a',
                        border: 'none',
                        borderRadius: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        opacity: !replyText.trim() ? 0.5 : 1,
                      }}
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Tasks — last 7 days */}
      {completedTasks.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '1rem',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Completed Tasks (7d)
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {completedTasks.map((task) => {
              const agentColor = AGENT_COLORS[task.assigned_to] || '#6b7280';
              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <span style={{ color: '#4ade80', fontSize: '0.75rem' }}>✓</span>
                  <span style={{ flex: 1, color: '#d0d0da', fontSize: '0.8rem' }}>{task.title}</span>
                  <span
                    style={{
                      background: `${agentColor}20`,
                      color: agentColor,
                      padding: '0.125rem 0.4rem',
                      borderRadius: '9999px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {task.assigned_to}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: '0.7rem', flexShrink: 0 }}>
                    {relativeDate(task.completed_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

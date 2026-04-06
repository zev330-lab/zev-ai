'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ComingSoonOverlay } from '@/components/admin/coming-soon-overlay';

interface FamilyMember { id: string; name: string; role: string; avatar_color: string; }
interface Task {
  id: string; title: string; description: string; assigned_to: string | null;
  created_by_context: string; status: string; priority: string; due_date: string | null;
  recurring: boolean; completed_at: string | null; created_at: string;
  family_members?: { name: string; avatar_color: string } | null;
}
interface FamilyEvent {
  id: string; title: string; description: string; date: string; time_start: string | null;
  time_end: string | null; family_member_ids: string[]; location: string | null; created_at: string;
}
interface Note { id: string; content: string; context: string; tags: string[]; created_at: string; }

const PRIORITY_COLOR: Record<string, string> = {
  low: '#6b7280',
  medium: '#60a5fa',
  high: '#f59e0b',
  urgent: '#ef4444',
};

// Hard-coded member config with names/colors for the week strip and avatars
// These are seeded and stable — used for display before API data loads
const MEMBER_CONFIG: Record<string, { color: string; initial: string }> = {
  Zev:    { color: '#7c9bf5', initial: 'Z' },
  Irit:   { color: '#e879f9', initial: 'I' },
  Havi:   { color: '#4ade80', initial: 'H' },
  Parker: { color: '#f59e0b', initial: 'P' },
  Allan:  { color: '#60a5fa', initial: 'A' },
  Sarina: { color: '#f472b6', initial: 'S' },
};

const STATUS_COLS = ['pending', 'in_progress', 'done'] as const;
const STATUS_LABEL: Record<string, string> = { pending: 'To Do', in_progress: 'In Progress', done: 'Done' };
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function getWeekDays(): Date[] {
  const now = new Date();
  // getDay(): 0=Sun, 1=Mon ... 6=Sat. We want Mon as first day.
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dueDateColor(due: string | null): string {
  if (!due) return 'var(--color-muted)';
  const today = toLocalDateStr(new Date());
  if (due < today) return '#ef4444';
  if (due === today) return '#f59e0b';
  const week = new Date();
  week.setDate(week.getDate() + 7);
  if (due <= toLocalDateStr(week)) return 'var(--color-muted-light)';
  return 'var(--color-muted)';
}

function relDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function eventBorderColor(date: string): string {
  const today = toLocalDateStr(new Date());
  if (date === today) return 'var(--color-accent)';
  const week = new Date();
  week.setDate(week.getDate() + 7);
  if (date > today && date <= toLocalDateStr(week)) return 'var(--color-muted)';
  if (date < today) return '#ef4444';
  return 'var(--color-admin-border)';
}

export default function AdminFamilyPage() {
  return (
    <ComingSoonOverlay>
      <AdminFamilyPageInner />
    </ComingSoonOverlay>
  );
}

function AdminFamilyPageInner() {
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'tasks' | 'events' | 'notes'>('tasks');
  const [memberFilter, setMemberFilter] = useState('all');
  const [quickText, setQuickText] = useState('');
  const [quickToast, setQuickToast] = useState('');
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', assigned_to: '', priority: 'medium', due_date: '', context: '' });
  const [eventForm, setEventForm] = useState({ title: '', date: '', time_start: '', time_end: '', location: '' });

  const fetchAll = useCallback(async () => {
    const [mRes, tRes, eRes, nRes] = await Promise.all([
      fetch('/api/admin/family?view=members'),
      fetch(`/api/admin/family${memberFilter !== 'all' ? `?member=${memberFilter}` : ''}`),
      fetch('/api/admin/family?view=events'),
      fetch('/api/admin/family?view=notes'),
    ]);
    if (mRes.status === 401) { router.push('/admin/login'); return; }
    const [m, t, e, n] = await Promise.all([mRes.json(), tRes.json(), eRes.json(), nRes.json()]);
    if (Array.isArray(m)) setMembers(m);
    if (Array.isArray(t)) setTasks(t);
    if (Array.isArray(e)) setEvents(e);
    if (Array.isArray(n)) setNotes(n);
    setLoading(false);
  }, [memberFilter, router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateTask = async (id: string, updates: Partial<Task>) => {
    await fetch('/api/admin/family', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
    fetchAll();
  };

  const deleteTask = async (id: string) => {
    await fetch('/api/admin/family', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, _type: 'task' }) });
    fetchAll();
  };

  const showToast = (msg: string) => {
    setQuickToast(msg);
    setTimeout(() => setQuickToast(''), 2000);
  };

  const quickCapture = async () => {
    if (!quickText.trim()) return;
    const isTask = /^(todo|task|remind|need to|should|must|don't forget)/i.test(quickText);
    if (isTask) {
      await fetch('/api/admin/family', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'task', title: quickText, created_by_context: 'quick capture' }) });
      showToast('Task added');
    } else {
      await fetch('/api/admin/family', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'note', content: quickText, context: 'quick capture' }) });
      showToast('Note saved');
    }
    setQuickText('');
    fetchAll();
  };

  const addTask = async () => {
    if (!taskForm.title) return;
    await fetch('/api/admin/family', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'task', title: taskForm.title, assigned_to: taskForm.assigned_to || null, priority: taskForm.priority, due_date: taskForm.due_date || null, created_by_context: taskForm.context }) });
    setShowAddTask(false);
    setTaskForm({ title: '', assigned_to: '', priority: 'medium', due_date: '', context: '' });
    fetchAll();
  };

  const addEvent = async () => {
    if (!eventForm.title || !eventForm.date) return;
    await fetch('/api/admin/family', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'event', title: eventForm.title, date: eventForm.date, time_start: eventForm.time_start || null, time_end: eventForm.time_end || null, location: eventForm.location || null }) });
    setShowAddEvent(false);
    setEventForm({ title: '', date: '', time_start: '', time_end: '', location: '' });
    fetchAll();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await fetch('/api/admin/family', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, _type: 'event' }) });
    fetchAll();
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await fetch('/api/admin/family', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, _type: 'note' }) });
    fetchAll();
  };

  const gcalUrl = (e: FamilyEvent) => {
    const d = e.date.replace(/-/g, '');
    const start = e.time_start ? `${d}T${e.time_start.replace(/:/g, '')}00` : d;
    const end = e.time_end ? `${d}T${e.time_end.replace(/:/g, '')}00` : d;
    const params = new URLSearchParams({ text: e.title, dates: `${start}/${end}` });
    if (e.location) params.set('location', e.location);
    if (e.description) params.set('details', e.description);
    return `https://calendar.google.com/calendar/r/eventnew?${params.toString()}`;
  };

  // Derived briefing stats
  const today = toLocalDateStr(new Date());
  const todayEvents = events.filter((e) => e.date === today);
  const todayTasksDue = tasks.filter((t) => t.status !== 'done' && t.due_date === today);
  const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.due_date && t.due_date < today);

  // Week strip
  const weekDays = getWeekDays();
  const eventsByDate: Record<string, number> = {};
  events.forEach((e) => { eventsByDate[e.date] = (eventsByDate[e.date] || 0) + 1; });

  // Member lookup by id
  const memberById: Record<string, FamilyMember> = {};
  members.forEach((m) => { memberById[m.id] = m; });

  // Build briefing line
  const briefingParts: string[] = [];
  if (todayEvents.length > 0) briefingParts.push(`${todayEvents.length} event${todayEvents.length !== 1 ? 's' : ''} today`);
  if (todayTasksDue.length > 0) briefingParts.push(`${todayTasksDue.length} task${todayTasksDue.length !== 1 ? 's' : ''} due`);
  if (overdueTasks.length > 0) briefingParts.push(`${overdueTasks.length} overdue`);

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* Morning Briefing Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-foreground-strong)] tracking-tight">
              {greeting()}, Zev
            </h1>
            {briefingParts.length > 0 ? (
              <p className="text-xs text-[var(--color-muted)] mt-1 flex items-center gap-1.5">
                {briefingParts.map((part, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="opacity-30">&middot;</span>}
                    <span style={{ color: part.includes('overdue') ? '#ef4444' : part.includes('today') ? 'var(--color-accent)' : 'var(--color-muted-light)' }}>
                      {part}
                    </span>
                  </span>
                ))}
              </p>
            ) : (
              <p className="text-xs text-[var(--color-muted)] mt-1">No events or tasks due today</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowAddEvent(true)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-colors cursor-pointer">Add Event</button>
            <button onClick={() => setShowAddTask(true)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity cursor-pointer">Add Task</button>
          </div>
        </div>

        {/* Family member row */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setMemberFilter('all')}
            className="h-9 px-3 rounded-full text-[10px] font-semibold cursor-pointer flex items-center justify-center transition-all"
            style={{
              backgroundColor: memberFilter === 'all' ? 'var(--color-accent)' : 'var(--color-admin-surface)',
              color: memberFilter === 'all' ? '#fff' : 'var(--color-muted-light)',
              border: memberFilter === 'all' ? '2px solid var(--color-accent)' : '2px solid var(--color-admin-border)',
            }}
          >
            All
          </button>
          {members.map((m) => {
            const taskCount = tasks.filter((t) => t.assigned_to === m.id && t.status !== 'done').length;
            const isActive = memberFilter === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMemberFilter(isActive ? 'all' : m.id)}
                title={m.name}
                className="relative cursor-pointer flex-shrink-0 transition-transform hover:scale-105"
                style={{ outline: 'none' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all"
                  style={{
                    backgroundColor: m.avatar_color,
                    boxShadow: isActive ? `0 0 0 2px var(--color-admin-bg), 0 0 0 4px ${m.avatar_color}` : 'none',
                    opacity: memberFilter !== 'all' && !isActive ? 0.4 : 1,
                  }}
                >
                  {m.name[0]}
                </div>
                {taskCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    {taskCount > 9 ? '9+' : taskCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick capture */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && quickCapture()}
              placeholder="Quick capture — start with 'todo' for tasks, or just type a note..."
              className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-foreground-strong)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
          <button
            onClick={quickCapture}
            className="px-4 py-2.5 text-xs font-medium rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] text-[var(--color-muted-light)] hover:text-[var(--color-foreground-strong)] transition-colors cursor-pointer"
          >
            Capture
          </button>
          {quickToast && (
            <span
              className="text-xs font-medium px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
            >
              {quickToast}
            </span>
          )}
        </div>
      </div>

      {/* Week-at-a-glance strip */}
      <div className="px-6 py-3 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex gap-1.5">
          {weekDays.map((day, i) => {
            const dateStr = toLocalDateStr(day);
            const isToday = dateStr === today;
            const count = eventsByDate[dateStr] || 0;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-colors"
                style={{
                  backgroundColor: isToday ? 'var(--color-accent)' : 'transparent',
                  border: isToday ? 'none' : '1px solid transparent',
                }}
              >
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider"
                  style={{ color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--color-muted)' }}
                >
                  {DAY_LABELS[i]}
                </span>
                <span
                  className="text-sm font-semibold leading-none"
                  style={{ color: isToday ? '#fff' : 'var(--color-muted-light)' }}
                >
                  {day.getDate()}
                </span>
                <div className="flex gap-0.5 h-2 items-center">
                  {count === 1 && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isToday ? 'rgba(255,255,255,0.7)' : 'var(--color-accent)' }} />
                  )}
                  {count === 2 && (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isToday ? 'rgba(255,255,255,0.7)' : 'var(--color-accent)' }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isToday ? 'rgba(255,255,255,0.7)' : 'var(--color-accent)' }} />
                    </>
                  )}
                  {count >= 3 && (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isToday ? '#fff' : '#7c9bf5' }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isToday ? '#fff' : '#7c9bf5' }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isToday ? '#fff' : '#7c9bf5' }} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-6 py-3 border-b border-[var(--color-admin-border)] flex items-center gap-4 shrink-0">
        <div className="flex rounded-lg border border-[var(--color-admin-border)] overflow-hidden">
          {(['tasks', 'events', 'notes'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-[11px] font-medium capitalize cursor-pointer transition-colors ${tab === t ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-admin-surface)] text-[var(--color-muted-light)] hover:text-[var(--color-foreground-strong)]'}`}
            >
              {t}
              {t === 'tasks' && tasks.length > 0 && (
                <span className={`ml-1.5 text-[9px] rounded-full px-1.5 py-0.5 ${tab === 'tasks' ? 'bg-white/20' : 'bg-[var(--color-admin-bg)]'}`}>
                  {tasks.filter((tk) => tk.status !== 'done').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[var(--color-muted)]">Loading...</p>
          </div>
        ) : tab === 'tasks' ? (

          /* Kanban */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {STATUS_COLS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col);
              return (
                <div key={col} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-semibold text-[var(--color-foreground-strong)] uppercase tracking-wider">{STATUS_LABEL[col]}</p>
                    <span className="text-[10px] text-[var(--color-muted)] bg-[var(--color-admin-surface)] rounded-full px-2 py-0.5 border border-[var(--color-admin-border)]">{colTasks.length}</span>
                  </div>
                  <div className="space-y-2 flex-1">
                    {colTasks.length === 0 && (
                      <div className="rounded-lg border border-dashed border-[var(--color-admin-border)] p-4 text-center">
                        <p className="text-[11px] text-[var(--color-muted)]">
                          {col === 'pending' ? 'All clear' : col === 'in_progress' ? 'Nothing in progress' : 'Nothing done yet'}
                        </p>
                      </div>
                    )}
                    {colTasks.map((t) => {
                      const isHovered = hoveredTask === t.id;
                      const assignee = t.assigned_to ? memberById[t.assigned_to] : null;
                      const dateColor = dueDateColor(t.due_date);
                      return (
                        <div
                          key={t.id}
                          className="relative rounded-lg border border-[var(--color-admin-border)] p-3 transition-all"
                          style={{
                            backgroundColor: 'var(--color-admin-surface)',
                            borderLeft: `3px solid ${PRIORITY_COLOR[t.priority] || '#6b7280'}`,
                          }}
                          onMouseEnter={() => setHoveredTask(t.id)}
                          onMouseLeave={() => setHoveredTask(null)}
                        >
                          {/* Hover action overlay */}
                          {isHovered && (
                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                              {col !== 'pending' && (
                                <button
                                  onClick={() => updateTask(t.id, { status: 'pending' })}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-admin-bg)] text-[var(--color-muted)] hover:text-[var(--color-muted-light)] border border-[var(--color-admin-border)] cursor-pointer"
                                >
                                  To Do
                                </button>
                              )}
                              {col !== 'in_progress' && col !== 'done' && (
                                <button
                                  onClick={() => updateTask(t.id, { status: 'in_progress' })}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/20 cursor-pointer"
                                >
                                  Start
                                </button>
                              )}
                              {col !== 'done' && (
                                <button
                                  onClick={() => updateTask(t.id, { status: 'done', completed_at: new Date().toISOString() })}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 cursor-pointer"
                                >
                                  Done
                                </button>
                              )}
                              <button
                                onClick={() => deleteTask(t.id)}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 cursor-pointer"
                              >
                                &times;
                              </button>
                            </div>
                          )}

                          {/* Card content */}
                          <div className="pr-6">
                            <p
                              className="text-sm leading-snug"
                              style={{
                                color: t.status === 'done' ? 'var(--color-muted)' : 'var(--color-foreground-strong)',
                                textDecoration: t.status === 'done' ? 'line-through' : 'none',
                              }}
                            >
                              {t.title}
                            </p>
                          </div>

                          {/* Footer row: due date + priority label + assignee */}
                          <div className="flex items-center justify-between mt-2.5 gap-2">
                            <div className="flex items-center gap-2">
                              {t.due_date && (
                                <span className="text-[10px] font-medium" style={{ color: dateColor }}>
                                  {relDate(t.due_date)}
                                </span>
                              )}
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded-full capitalize font-medium"
                                style={{
                                  backgroundColor: `${PRIORITY_COLOR[t.priority]}18`,
                                  color: PRIORITY_COLOR[t.priority],
                                }}
                              >
                                {t.priority}
                              </span>
                            </div>
                            {assignee && (
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                style={{ backgroundColor: assignee.avatar_color }}
                                title={assignee.name}
                              >
                                {assignee.name[0]}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        ) : tab === 'events' ? (

          /* Events */
          events.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-2xl mb-3" aria-hidden>📅</p>
              <p className="text-sm font-medium text-[var(--color-muted-light)] mb-1">No upcoming events</p>
              <p className="text-xs text-[var(--color-muted)]">Add an event to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((e) => {
                const borderColor = eventBorderColor(e.date);
                const eventDate = new Date(e.date + 'T00:00:00');
                const attendees = (e.family_member_ids || [])
                  .map((id) => memberById[id])
                  .filter(Boolean);
                return (
                  <div
                    key={e.id}
                    className="rounded-lg border border-[var(--color-admin-border)] p-4 flex items-center gap-4 transition-all hover:border-[var(--color-admin-border)] hover:bg-[var(--color-admin-surface)]/80"
                    style={{
                      backgroundColor: 'var(--color-admin-surface)',
                      borderLeft: `3px solid ${borderColor}`,
                    }}
                  >
                    {/* Date block */}
                    <div className="text-center shrink-0 w-12">
                      <p
                        className="text-xl font-bold leading-none"
                        style={{ color: e.date === today ? 'var(--color-accent)' : 'var(--color-foreground-strong)' }}
                      >
                        {eventDate.getDate()}
                      </p>
                      <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider mt-0.5">
                        {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                    </div>

                    {/* Event details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-foreground-strong)] truncate">{e.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {(e.time_start || e.time_end) && (
                          <span className="text-[11px] text-[var(--color-muted)]">
                            {e.time_start && e.time_start.slice(0, 5)}{e.time_end && ` – ${e.time_end.slice(0, 5)}`}
                          </span>
                        )}
                        {e.location && (
                          <span className="text-[11px] text-[var(--color-muted)] truncate max-w-[160px]">
                            &middot; {e.location}
                          </span>
                        )}
                        {/* Attendee avatars */}
                        {attendees.length > 0 && (
                          <div className="flex -space-x-1">
                            {attendees.slice(0, 5).map((member) => (
                              <div
                                key={member.id}
                                className="w-4 h-4 rounded-full border border-[var(--color-admin-surface)] flex items-center justify-center text-[8px] font-bold text-white"
                                style={{ backgroundColor: member.avatar_color }}
                                title={member.name}
                              >
                                {member.name[0]}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={gcalUrl(e)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-[10px] font-medium rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors cursor-pointer"
                        title="Add to Google Calendar"
                      >
                        GCal
                      </a>
                      <button
                        onClick={() => deleteEvent(e.id)}
                        className="px-2 py-1 text-[10px] rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                        title="Delete event"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )

        ) : (

          /* Notes */
          notes.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-2xl mb-3" aria-hidden>📝</p>
              <p className="text-sm font-medium text-[var(--color-muted-light)] mb-1">No notes yet</p>
              <p className="text-xs text-[var(--color-muted)]">Use quick capture above to save a thought</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map((n) => (
                <div key={n.id} className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-[var(--color-muted-light)] whitespace-pre-wrap flex-1 leading-relaxed">{n.content}</p>
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="shrink-0 px-2 py-1 text-[10px] rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                      title="Delete note"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5 text-[10px] text-[var(--color-muted)]">
                    {n.context && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--color-accent)', color: '#fff', opacity: 0.8 }}
                      >
                        {n.context}
                      </span>
                    )}
                    {n.tags.map((tag) => (
                      <span key={tag} className="bg-[var(--color-admin-bg)] rounded px-1.5 py-0.5 border border-[var(--color-admin-border)]">
                        {tag}
                      </span>
                    ))}
                    <span className="ml-auto">{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-4">Add Task</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1.5 block">Task title</label>
                <input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  autoFocus
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1.5 block">Assign to</label>
                <select
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1.5 block">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]"
                  >
                    {['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1.5 block">Due date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1.5 block">Context</label>
                <input
                  value={taskForm.context}
                  onChange={(e) => setTaskForm({ ...taskForm, context: e.target.value })}
                  placeholder="e.g. meeting with Seth"
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)] placeholder:text-[var(--color-muted)]"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={addTask} className="flex-1 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity cursor-pointer">Add Task</button>
              <button onClick={() => setShowAddTask(false)} className="px-4 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-muted-light)] cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-4">Add Event</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1.5 block">Title</label>
                <input
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  autoFocus
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1.5 block">Start</label>
                  <input
                    type="time"
                    value={eventForm.time_start}
                    onChange={(e) => setEventForm({ ...eventForm, time_start: e.target.value })}
                    className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1.5 block">End</label>
                  <input
                    type="time"
                    value={eventForm.time_end}
                    onChange={(e) => setEventForm({ ...eventForm, time_end: e.target.value })}
                    className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1.5 block">Location</label>
                <input
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={addEvent} className="flex-1 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity cursor-pointer">Add Event</button>
              <button onClick={() => setShowAddEvent(false)} className="px-4 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-muted-light)] cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

const PRIORITY_COLOR: Record<string, string> = { low: '#6b7280', medium: '#60a5fa', high: '#f59e0b', urgent: '#ef4444' };
const STATUS_COLS = ['pending', 'in_progress', 'done'] as const;
const STATUS_LABEL: Record<string, string> = { pending: 'To Do', in_progress: 'In Progress', done: 'Done' };

function relDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const tmr = new Date(today); tmr.setDate(tmr.getDate() + 1);
  if (d.toDateString() === tmr.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AdminFamilyPage() {
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'tasks' | 'events' | 'notes'>('tasks');
  const [memberFilter, setMemberFilter] = useState('all');
  const [quickText, setQuickText] = useState('');
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

  const quickCapture = async () => {
    if (!quickText.trim()) return;
    const isTask = /^(todo|task|remind|need to|should|must|don't forget)/i.test(quickText);
    if (isTask) {
      await fetch('/api/admin/family', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'task', title: quickText, created_by_context: 'quick capture' }) });
    } else {
      await fetch('/api/admin/family', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'note', content: quickText, context: 'quick capture' }) });
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

  // Today view data
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((e) => e.date === today);
  const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.due_date && t.due_date <= today);
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">Family Hub</h1>
            <p className="text-xs text-[var(--color-muted)] mt-1">{pendingCount} tasks pending &middot; {todayEvents.length} events today</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAddEvent(true)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-400 cursor-pointer">Add Event</button>
            <button onClick={() => setShowAddTask(true)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white cursor-pointer">Add Task</button>
          </div>
        </div>

        {/* Quick capture */}
        <div className="flex gap-2">
          <input value={quickText} onChange={(e) => setQuickText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && quickCapture()} placeholder="Quick capture — type a task, note, or reminder..." className="flex-1 bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-foreground-strong)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]" />
          <button onClick={quickCapture} className="px-4 py-2.5 text-xs font-medium rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] text-[var(--color-muted-light)] cursor-pointer">Capture</button>
        </div>
      </div>

      {/* Today Banner */}
      {(todayEvents.length > 0 || overdueTasks.length > 0) && (
        <div className="px-6 py-3 border-b border-[var(--color-admin-border)] bg-[var(--color-accent)]/5 shrink-0">
          <p className="text-xs font-medium text-[var(--color-accent)] mb-2">Today</p>
          <div className="flex flex-wrap gap-3">
            {todayEvents.map((e) => (
              <span key={e.id} className="text-xs bg-[var(--color-admin-surface)] rounded-lg px-3 py-1.5 text-[var(--color-muted-light)]">
                {e.time_start && <span className="text-[var(--color-accent)] mr-1">{e.time_start.slice(0, 5)}</span>}{e.title}
              </span>
            ))}
            {overdueTasks.map((t) => (
              <span key={t.id} className="text-xs bg-red-500/10 rounded-lg px-3 py-1.5 text-red-400">
                Overdue: {t.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar + member filter */}
      <div className="px-6 py-3 border-b border-[var(--color-admin-border)] flex items-center gap-4 flex-wrap shrink-0">
        <div className="flex rounded-lg border border-[var(--color-admin-border)] overflow-hidden">
          {(['tasks', 'events', 'notes'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 text-[11px] font-medium capitalize cursor-pointer ${tab === t ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-admin-surface)] text-[var(--color-muted-light)]'}`}>{t}</button>
          ))}
        </div>
        {tab === 'tasks' && (
          <div className="flex gap-1.5">
            <button onClick={() => setMemberFilter('all')} className={`w-7 h-7 rounded-full text-[10px] font-bold cursor-pointer flex items-center justify-center ${memberFilter === 'all' ? 'ring-2 ring-[var(--color-accent)]' : ''}`} style={{ backgroundColor: '#333' }}>All</button>
            {members.map((m) => (
              <button key={m.id} onClick={() => setMemberFilter(m.id)} className={`w-7 h-7 rounded-full text-[10px] font-bold text-white cursor-pointer flex items-center justify-center ${memberFilter === m.id ? 'ring-2 ring-[var(--color-accent)]' : ''}`} style={{ backgroundColor: m.avatar_color }} title={m.name}>{m.name[0]}</button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? <p className="text-sm text-[var(--color-muted)] py-12 text-center">Loading...</p> :
          tab === 'tasks' ? (
            /* Kanban columns */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {STATUS_COLS.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col);
                return (
                  <div key={col} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xs font-medium text-[var(--color-foreground-strong)]">{STATUS_LABEL[col]}</p>
                      <span className="text-[10px] text-[var(--color-muted)] bg-[var(--color-admin-surface)] rounded-full px-2 py-0.5">{colTasks.length}</span>
                    </div>
                    <div className="space-y-2 flex-1">
                      {colTasks.map((t) => (
                        <div key={t.id} className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: PRIORITY_COLOR[t.priority] }} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${t.status === 'done' ? 'text-[var(--color-muted)] line-through' : 'text-[var(--color-foreground-strong)]'}`}>{t.title}</p>
                              {t.due_date && <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{relDate(t.due_date)}</p>}
                              {t.family_members && <p className="text-[10px] mt-1"><span className="inline-block w-3 h-3 rounded-full mr-1 align-middle" style={{ backgroundColor: (t.family_members as { avatar_color: string }).avatar_color }} />{(t.family_members as { name: string }).name}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1 mt-2">
                            {col !== 'pending' && <button onClick={() => updateTask(t.id, { status: 'pending' })} className="text-[9px] text-[var(--color-muted)] hover:text-[var(--color-muted-light)] cursor-pointer">To Do</button>}
                            {col !== 'in_progress' && col !== 'done' && <button onClick={() => updateTask(t.id, { status: 'in_progress' })} className="text-[9px] text-[var(--color-accent)] cursor-pointer">Start</button>}
                            {col !== 'done' && <button onClick={() => updateTask(t.id, { status: 'done', completed_at: new Date().toISOString() })} className="text-[9px] text-green-400 cursor-pointer">Done</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : tab === 'events' ? (
            /* Events */
            events.length === 0 ? <p className="text-sm text-[var(--color-muted)] py-12 text-center">No upcoming events.</p> : (
              <div className="space-y-2">
                {events.map((e) => (
                  <div key={e.id} className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg p-4 flex items-center gap-4">
                    <div className="text-center shrink-0 w-14">
                      <p className="text-lg font-semibold text-[var(--color-foreground-strong)]">{new Date(e.date).getDate()}</p>
                      <p className="text-[10px] text-[var(--color-muted)] uppercase">{new Date(e.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--color-foreground-strong)]">{e.title}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {e.time_start && e.time_start.slice(0, 5)}{e.time_end && ` - ${e.time_end.slice(0, 5)}`}
                        {e.location && ` · ${e.location}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a href={gcalUrl(e)} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-[10px] rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 cursor-pointer" title="Add to Google Calendar">GCal</a>
                      <button onClick={() => deleteEvent(e.id)} className="px-2 py-1 text-[10px] rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer">&times;</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Notes */
            notes.length === 0 ? <p className="text-sm text-[var(--color-muted)] py-12 text-center">No notes yet. Use quick capture above.</p> : (
              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-[var(--color-muted-light)] whitespace-pre-wrap flex-1">{n.content}</p>
                      <button onClick={() => deleteNote(n.id)} className="shrink-0 px-2 py-1 text-[10px] rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer">&times;</button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--color-muted)]">
                      {n.context && <span className="text-[var(--color-accent)]">{n.context}</span>}
                      {n.tags.map((tag) => <span key={tag} className="bg-[var(--color-admin-bg)] rounded px-1.5 py-0.5">{tag}</span>)}
                      <span className="ml-auto">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )
        }
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-4">Add Task</h3>
            <div className="space-y-3">
              <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Task</label><input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Assign To</label>
                <select value={taskForm.assigned_to} onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]">
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]">
                    {['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Due Date</label><input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
              </div>
              <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Context</label><input value={taskForm.context} onChange={(e) => setTaskForm({ ...taskForm, context: e.target.value })} placeholder="e.g. meeting with Seth" className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={addTask} className="flex-1 px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white cursor-pointer">Add</button>
              <button onClick={() => setShowAddTask(false)} className="px-4 py-2 text-xs text-[var(--color-muted)] cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-4">Add Event</h3>
            <div className="space-y-3">
              <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Title</label><input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Date</label><input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Start</label><input type="time" value={eventForm.time_start} onChange={(e) => setEventForm({ ...eventForm, time_start: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
                <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">End</label><input type="time" value={eventForm.time_end} onChange={(e) => setEventForm({ ...eventForm, time_end: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
              </div>
              <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Location</label><input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={addEvent} className="flex-1 px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white cursor-pointer">Add</button>
              <button onClick={() => setShowAddEvent(false)} className="px-4 py-2 text-xs text-[var(--color-muted)] cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

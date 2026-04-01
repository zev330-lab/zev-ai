'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Lead {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  path: string | null;
  audience: string | null;
  pain_text: string | null;
  hope_text: string | null;
  acknowledgment_text: string | null;
  details_json: Record<string, unknown> | null;
  audio_url: string | null;
  deal_stage: string;
  research_json: Record<string, unknown> | null;
  email_sent_at: string | null;
  roadmap_purchased_at: string | null;
  roadmap_url: string | null;
  stripe_payment_id: string | null;
  processing_error: string | null;
  retry_count: number;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STAGES = [
  { key: 'new_lead', label: 'New Lead', color: '#7c9bf5', revenue: 0 },
  { key: 'research_complete', label: 'Researched', color: '#a78bfa', revenue: 0 },
  { key: 'email_delivered', label: 'Email Sent', color: '#c4b5e0', revenue: 0 },
  { key: 'roadmap_purchased', label: 'Roadmap ($499)', color: '#60a5fa', revenue: 499 },
  { key: 'roadmap_delivered', label: 'Roadmap Delivered', color: '#60a5fa', revenue: 499 },
  { key: 'consultation_booked', label: 'Consultation ($2.5K)', color: '#34d399', revenue: 2500 },
  { key: 'proposal_sent', label: 'Proposal Sent', color: '#fbbf24', revenue: 5000 },
  { key: 'building', label: 'Building', color: '#f59e0b', revenue: 10000 },
  { key: 'delivered', label: 'Delivered', color: '#10b981', revenue: 10000 },
  { key: 'lost', label: 'Lost', color: '#6b7280', revenue: 0 },
] as const;

const STAGE_KEYS: string[] = STAGES.map(s => s.key);

const REVENUE_COLORS: Record<string, string> = {
  none: '#4a4e5e',
  roadmap: '#60a5fa',
  consultation: '#34d399',
  big: '#f59e0b',
};

function getRevenueColor(stage: string): string {
  const s = STAGES.find(st => st.key === stage);
  if (!s || s.revenue === 0) return REVENUE_COLORS.none;
  if (s.revenue <= 499) return REVENUE_COLORS.roadmap;
  if (s.revenue <= 2500) return REVENUE_COLORS.consultation;
  return REVENUE_COLORS.big;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const MONEY_STAGES = ['roadmap_purchased', 'roadmap_delivered', 'consultation_booked', 'proposal_sent', 'building', 'delivered'];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [confirmMove, setConfirmMove] = useState<{ lead: Lead; toStage: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [noteEdit, setNoteEdit] = useState<{ leadId: string; text: string } | null>(null);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pipeline');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Supabase Realtime subscription
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const supabase = createClient(url, key);
    const channel = supabase
      .channel('pipeline-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'funnel_leads' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [payload.new as Lead, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev =>
              prev.map(l => l.id === (payload.new as Lead).id ? { ...l, ...(payload.new as Partial<Lead>) } : l)
            );
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(l => l.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Stage update
  const updateStage = useCallback(async (leadId: string, newStage: string) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, deal_stage: newStage } : l));

    try {
      const res = await fetch('/api/admin/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, deal_stage: newStage }),
      });
      if (!res.ok) {
        // Revert on failure
        fetchLeads();
      }
    } catch {
      fetchLeads();
    }
  }, [fetchLeads]);

  // Save note
  const saveNote = useCallback(async (leadId: string, notes: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l));
    try {
      await fetch('/api/admin/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, notes }),
      });
    } catch {
      // silent
    }
    setNoteEdit(null);
  }, []);

  // Drag handlers
  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    setDropTarget(stageKey);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (stageKey: string) => {
    setDropTarget(null);
    if (!draggedLead) return;

    const lead = leads.find(l => l.id === draggedLead);
    if (!lead || lead.deal_stage === stageKey) {
      setDraggedLead(null);
      return;
    }

    // Confirm for money stages
    if (MONEY_STAGES.includes(stageKey) && !MONEY_STAGES.includes(lead.deal_stage)) {
      setConfirmMove({ lead, toStage: stageKey });
    } else {
      updateStage(lead.id, stageKey);
    }
    setDraggedLead(null);
  };

  // Group leads by stage
  const grouped = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of STAGES) map[s.key] = [];
    for (const l of leads) {
      const key = STAGE_KEYS.includes(l.deal_stage) ? l.deal_stage : 'new_lead';
      map[key].push(l);
    }
    return map;
  }, [leads]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = leads.filter(l => new Date(l.created_at) >= weekAgo).length;
    const thisMonth = leads.filter(l => new Date(l.created_at) >= monthAgo).length;

    let pipelineRevenue = 0;
    for (const l of leads) {
      const s = STAGES.find(st => st.key === l.deal_stage);
      if (s) pipelineRevenue += s.revenue;
    }

    const total = leads.length || 1;
    const emailDelivered = leads.filter(l => l.email_sent_at).length;
    const roadmapPurchased = leads.filter(l =>
      ['roadmap_purchased', 'roadmap_delivered', 'consultation_booked', 'proposal_sent', 'building', 'delivered'].includes(l.deal_stage)
    ).length;
    const consultBooked = leads.filter(l =>
      ['consultation_booked', 'proposal_sent', 'building', 'delivered'].includes(l.deal_stage)
    ).length;

    return {
      thisWeek,
      thisMonth,
      pipelineRevenue,
      convEmail: Math.round((emailDelivered / total) * 100),
      convRoadmap: Math.round((roadmapPurchased / total) * 100),
      convConsult: Math.round((consultBooked / total) * 100),
    };
  }, [leads]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-accent) transparent var(--color-accent) var(--color-accent)' }} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header Stats */}
      <div className="shrink-0 px-6 py-4 border-b border-[var(--color-admin-border)]">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">Pipeline</h1>
          <span className="text-xs text-[var(--color-muted)]">{leads.length} total leads</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <StatCard label="This Week" value={String(stats.thisWeek)} />
          <StatCard label="This Month" value={String(stats.thisMonth)} />
          <StatCard label="Pipeline Revenue" value={`$${stats.pipelineRevenue.toLocaleString()}`} accent />
          <StatCard label="Form → Email" value={`${stats.convEmail}%`} />
          <StatCard label="Email → Roadmap" value={`${stats.convRoadmap}%`} />
          <StatCard label="Roadmap → Consult" value={`${stats.convConsult}%`} />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-4">
        <div className="flex gap-3 h-full min-w-max">
          {STAGES.map(stage => (
            <div
              key={stage.key}
              className="w-[260px] flex flex-col shrink-0 rounded-xl transition-colors duration-200"
              style={{
                background: dropTarget === stage.key ? 'var(--color-admin-surface)' : 'transparent',
              }}
              onDragOver={e => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(stage.key)}
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                <span className="text-xs font-semibold text-[var(--color-foreground-strong)]">{stage.label}</span>
                <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-admin-surface)] text-[var(--color-muted-light)]">
                  {grouped[stage.key]?.length || 0}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto px-1.5 pb-2 space-y-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[var(--color-admin-border)] [&::-webkit-scrollbar-thumb]:rounded">
                <AnimatePresence mode="popLayout">
                  {grouped[stage.key]?.map(lead => (
                    <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      onClick={() => setSelectedLead(lead)}
                      className="relative p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-150 hover:ring-1 hover:ring-[var(--color-accent)]/30 group"
                      style={{
                        background: 'var(--color-admin-surface)',
                        border: '1px solid var(--color-admin-border)',
                        opacity: draggedLead === lead.id ? 0.5 : 1,
                      }}
                    >
                      {/* Revenue indicator */}
                      <div
                        className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
                        style={{ background: getRevenueColor(lead.deal_stage) }}
                      />

                      {/* Three-dot menu */}
                      <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === lead.id ? null : lead.id); }}
                        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] hover:bg-[var(--color-admin-bg)] cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>

                      {/* Dropdown menu */}
                      {menuOpen === lead.id && (
                        <div
                          className="absolute top-8 right-2 z-20 w-40 py-1 rounded-lg shadow-xl"
                          style={{ background: 'var(--color-admin-bg)', border: '1px solid var(--color-admin-border)' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-muted-light)] hover:bg-[var(--color-admin-surface)] cursor-pointer"
                            onClick={() => { updateStage(lead.id, 'lost'); setMenuOpen(null); }}
                          >
                            Mark as Lost
                          </button>
                          <button
                            className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-muted-light)] hover:bg-[var(--color-admin-surface)] cursor-pointer"
                            onClick={() => { setNoteEdit({ leadId: lead.id, text: lead.notes || '' }); setMenuOpen(null); }}
                          >
                            Add Note
                          </button>
                          <button
                            className="w-full text-left px-3 py-1.5 text-xs text-[var(--color-muted-light)] hover:bg-[var(--color-admin-surface)] cursor-pointer"
                            onClick={() => { setSelectedLead(lead); setMenuOpen(null); }}
                          >
                            View Details
                          </button>
                        </div>
                      )}

                      {/* Card content */}
                      <div className="pl-2">
                        <p className="text-sm font-medium text-[var(--color-foreground-strong)] truncate pr-6">
                          {lead.name}
                        </p>
                        {lead.company && (
                          <p className="text-[11px] text-[var(--color-muted-light)] truncate">{lead.company}</p>
                        )}

                        {/* Badges */}
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {lead.path && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-admin-bg)] text-[var(--color-muted-light)]">
                              {lead.path === 'app' ? 'Build' : lead.path === 'solution' ? 'Optimize' : 'Unsure'}
                            </span>
                          )}
                          {lead.audience && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-admin-bg)] text-[var(--color-muted-light)]">
                              {lead.audience}
                            </span>
                          )}
                        </div>

                        {/* Pain preview */}
                        {lead.pain_text && (
                          <p className="text-[11px] text-[var(--color-muted)] mt-2 line-clamp-2 leading-relaxed">
                            {lead.pain_text.slice(0, 80)}{lead.pain_text.length > 80 ? '...' : ''}
                          </p>
                        )}

                        {/* Time ago */}
                        <p className="text-[10px] text-[var(--color-muted)] mt-2">
                          {timeAgo(lead.created_at)}
                        </p>

                        {/* Error indicator */}
                        {lead.processing_error && (
                          <div className="mt-2 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-[10px] text-red-400 truncate">{lead.processing_error.slice(0, 40)}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {(grouped[stage.key]?.length || 0) === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-[11px] text-[var(--color-muted)]">No leads</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Close menu on click outside */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}

      {/* Confirm Move Dialog */}
      <AnimatePresence>
        {confirmMove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setConfirmMove(null); setDraggedLead(null); }} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-sm p-6 rounded-xl"
              style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
            >
              <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-2">
                Move to {STAGES.find(s => s.key === confirmMove.toStage)?.label}?
              </h3>
              <p className="text-xs text-[var(--color-muted-light)] mb-4">
                Moving <strong>{confirmMove.lead.name}</strong> to a revenue stage. This indicates a payment or commitment has been made.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setConfirmMove(null); setDraggedLead(null); }}
                  className="px-3 py-1.5 text-xs rounded-lg text-[var(--color-muted-light)] hover:bg-[var(--color-admin-bg)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateStage(confirmMove.lead.id, confirmMove.toStage);
                    setConfirmMove(null);
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}
                >
                  Confirm Move
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Edit Dialog */}
      <AnimatePresence>
        {noteEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNoteEdit(null)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-md p-6 rounded-xl"
              style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
            >
              <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-3">
                Notes
              </h3>
              <textarea
                value={noteEdit.text}
                onChange={e => setNoteEdit({ ...noteEdit, text: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-lg resize-none focus:outline-none focus:ring-1"
                style={{
                  background: 'var(--color-admin-bg)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-admin-border)',
                }}
                placeholder="Add notes about this lead..."
                autoFocus
              />
              <div className="flex gap-2 justify-end mt-3">
                <button
                  onClick={() => setNoteEdit(null)}
                  className="px-3 py-1.5 text-xs rounded-lg text-[var(--color-muted-light)] hover:bg-[var(--color-admin-bg)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveNote(noteEdit.leadId, noteEdit.text)}
                  className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Slide-out Panel */}
      <AnimatePresence>
        {selectedLead && (
          <DetailPanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onStageChange={(stage) => { updateStage(selectedLead.id, stage); setSelectedLead({ ...selectedLead, deal_stage: stage }); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}>
      <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-foreground-strong)]'}`}>
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Panel (slide-out)
// ---------------------------------------------------------------------------
function DetailPanel({
  lead,
  onClose,
  onStageChange,
}: {
  lead: Lead;
  onClose: () => void;
  onStageChange: (stage: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const research = (lead.research_json || {}) as Record<string, string>;
  const details = (lead.details_json || {}) as Record<string, string | string[]>;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 z-50 h-full w-full max-w-lg overflow-y-auto"
        style={{
          background: 'var(--color-admin-bg)',
          borderLeft: '1px solid var(--color-admin-border)',
        }}
      >
        {/* Panel Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--color-admin-border)]" style={{ background: 'var(--color-admin-bg)' }}>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-foreground-strong)]">{lead.name}</h2>
            {lead.company && <p className="text-xs text-[var(--color-muted-light)]">{lead.company}</p>}
          </div>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-foreground-strong)] transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Stage Selector */}
          <div>
            <p className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">Deal Stage</p>
            <select
              value={lead.deal_stage}
              onChange={e => onStageChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none cursor-pointer"
              style={{
                background: 'var(--color-admin-surface)',
                color: 'var(--color-foreground-strong)',
                border: '1px solid var(--color-admin-border)',
              }}
            >
              {STAGES.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Contact Info */}
          <DetailSection title="Contact">
            <DetailRow label="Email" value={lead.email} link={`mailto:${lead.email}`} />
            <DetailRow label="Phone" value={lead.phone || '—'} />
            <DetailRow label="Path" value={lead.path === 'app' ? 'Build Something' : lead.path === 'solution' ? 'AI Optimization' : lead.path || '—'} />
            <DetailRow label="Audience" value={lead.audience || '—'} />
            <DetailRow label="Referral" value={details.referralSource ? String(details.referralSource) : '—'} />
          </DetailSection>

          {/* Pain & Hope */}
          <DetailSection title="Pain & Hope">
            <DetailText label="Pain Point" text={lead.pain_text || '—'} />
            {lead.acknowledgment_text && <DetailText label="Acknowledgment" text={lead.acknowledgment_text} />}
            <DetailText label="6-Month Vision" text={lead.hope_text || '—'} />
          </DetailSection>

          {/* Form Details */}
          {Object.keys(details).length > 0 && (
            <DetailSection title="Form Details">
              {Object.entries(details).map(([k, v]) => (
                <DetailRow
                  key={k}
                  label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  value={Array.isArray(v) ? v.join(', ') : String(v || '—')}
                />
              ))}
            </DetailSection>
          )}

          {/* Audio */}
          {lead.audio_url && (
            <DetailSection title="Audio Recording">
              <audio
                controls
                src={lead.audio_url}
                className="w-full rounded-lg"
                style={{ filter: 'invert(0.85) hue-rotate(180deg)' }}
              />
            </DetailSection>
          )}

          {/* Research */}
          {Object.keys(research).length > 0 && (
            <DetailSection title="Research Summary">
              {research.person_summary && <DetailText label="Person" text={String(research.person_summary)} />}
              {research.company_analysis && <DetailText label="Company" text={String(research.company_analysis)} />}
              {research.industry && <DetailRow label="Industry" value={String(research.industry)} />}
              {research.pain_analysis && <DetailText label="Pain Analysis" text={String(research.pain_analysis)} />}
              {research.ai_opportunities && (
                <DetailText label="AI Opportunities" text={typeof research.ai_opportunities === 'string' ? research.ai_opportunities : JSON.stringify(research.ai_opportunities)} />
              )}
              {research.specific_insight && <DetailText label="Key Insight" text={String(research.specific_insight)} />}
              {research.research_confidence && <DetailRow label="Confidence" value={String(research.research_confidence)} />}
            </DetailSection>
          )}

          {/* Roadmap */}
          {lead.roadmap_url && (
            <DetailSection title="Roadmap">
              <a
                href={lead.roadmap_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-accent)] hover:underline break-all"
              >
                {lead.roadmap_url}
              </a>
            </DetailSection>
          )}

          {/* Notes */}
          {lead.notes && (
            <DetailSection title="Notes">
              <p className="text-sm text-[var(--color-foreground)] whitespace-pre-wrap">{lead.notes}</p>
            </DetailSection>
          )}

          {/* Timestamps */}
          <DetailSection title="Timeline">
            <DetailRow label="Created" value={new Date(lead.created_at).toLocaleString()} />
            {lead.email_sent_at && <DetailRow label="Email Sent" value={new Date(lead.email_sent_at).toLocaleString()} />}
            {lead.roadmap_purchased_at && <DetailRow label="Roadmap Purchased" value={new Date(lead.roadmap_purchased_at).toLocaleString()} />}
            {lead.stripe_payment_id && <DetailRow label="Stripe Payment" value={lead.stripe_payment_id} />}
          </DetailSection>

          {/* Errors */}
          {lead.processing_error && (
            <DetailSection title="Processing Error">
              <p className="text-xs text-red-400 font-mono">{lead.processing_error}</p>
              <p className="text-[10px] text-[var(--color-muted)] mt-1">Retry count: {lead.retry_count}</p>
            </DetailSection>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Detail Helpers
// ---------------------------------------------------------------------------
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">{title}</p>
      <div
        className="rounded-lg p-3 space-y-2"
        style={{ background: 'var(--color-admin-surface)', border: '1px solid var(--color-admin-border)' }}
      >
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-[var(--color-muted)] shrink-0">{label}</span>
      {link ? (
        <a href={link} className="text-xs text-[var(--color-accent)] hover:underline text-right truncate">{value}</a>
      ) : (
        <span className="text-xs text-[var(--color-foreground)] text-right truncate">{value}</span>
      )}
    </div>
  );
}

function DetailText({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[10px] text-[var(--color-muted)] mb-1">{label}</p>
      <p className="text-xs text-[var(--color-foreground)] leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

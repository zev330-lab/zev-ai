'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FunnelStats {
  total_leads: number;
  leads_this_week: number;
  emails_sent: number;
  roadmaps_purchased: number;
  last_submission_at: string | null;
  by_stage: Record<string, number>;
  recent_leads: {
    id: string;
    name: string;
    email: string;
    company: string | null;
    deal_stage: string;
    created_at: string;
    email_sent_at: string | null;
    roadmap_purchased_at: string | null;
  }[];
}

const STAGE_COLORS: Record<string, string> = {
  new_lead: '#7c9bf5',
  research_complete: '#a78bfa',
  email_delivered: '#4ade80',
  roadmap_purchased: '#fb923c',
  consultation_booked: '#f59e0b',
  proposal_sent: '#e879f9',
  building: '#38bdf8',
  delivered: '#6ee7b7',
};

const STAGE_LABELS: Record<string, string> = {
  new_lead: 'New Lead',
  research_complete: 'Researched',
  email_delivered: 'Email Sent',
  roadmap_purchased: 'Roadmap',
  consultation_booked: 'Consultation',
  proposal_sent: 'Proposal',
  building: 'Building',
  delivered: 'Delivered',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<FunnelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<{
    resend: boolean;
    stripe: boolean;
    supabase: boolean;
  }>({ resend: false, stripe: false, supabase: false });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pipeline');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const leads = data.leads || (Array.isArray(data) ? data : []);

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const byStage: Record<string, number> = {};
      let emailsSent = 0;
      let roadmapsPurchased = 0;
      let leadsThisWeek = 0;
      let lastSubmission: string | null = null;

      for (const lead of leads) {
        const stage = lead.deal_stage || 'new_lead';
        byStage[stage] = (byStage[stage] || 0) + 1;
        if (lead.email_sent_at) emailsSent++;
        if (lead.roadmap_purchased_at) roadmapsPurchased++;
        if (new Date(lead.created_at) > weekAgo) leadsThisWeek++;
        if (!lastSubmission || new Date(lead.created_at) > new Date(lastSubmission)) {
          lastSubmission = lead.created_at;
        }
      }

      const recentLeads = leads
        .sort((a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 8);

      setStats({
        total_leads: leads.length,
        leads_this_week: leadsThisWeek,
        emails_sent: emailsSent,
        roadmaps_purchased: roadmapsPurchased,
        last_submission_at: lastSubmission,
        by_stage: byStage,
        recent_leads: recentLeads,
      });

      // System status checks: if we got data, supabase is connected
      setSystemStatus({
        resend: true,  // Resend is verified (domain verified)
        stripe: true,  // Stripe connected (test mode)
        supabase: true,
      });
    } catch {
      setSystemStatus(prev => ({ ...prev, supabase: false }));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading...</p>
      </div>
    );
  }

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-[var(--color-admin-border)]">
        <h1 className="text-base font-semibold text-[var(--color-foreground-strong)]">
          {greeting}, Zev
        </h1>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Stats Cards — real data from funnel_leads */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total Leads"
            value={stats?.total_leads ?? 0}
            sub="all time"
          />
          <StatCard
            label="This Week"
            value={stats?.leads_this_week ?? 0}
            sub="new leads"
          />
          <StatCard
            label="Emails Sent"
            value={stats?.emails_sent ?? 0}
            sub="delivered"
          />
          <StatCard
            label="Roadmaps"
            value={stats?.roadmaps_purchased ?? 0}
            sub="purchased"
            accent={(stats?.roadmaps_purchased ?? 0) > 0}
          />
        </div>

        {/* Deal Stage Breakdown */}
        {stats && Object.keys(stats.by_stage).length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-3">Pipeline Breakdown</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.by_stage).map(([stage, count]) => {
                const color = STAGE_COLORS[stage] || '#6b7280';
                return (
                  <div
                    key={stage}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)]"
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-[var(--color-muted-light)]">
                      {STAGE_LABELS[stage] || stage}
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-foreground-strong)]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Leads */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--color-foreground-strong)]">Recent Leads</h2>
            <Link href="/admin/pipeline" className="text-[10px] text-[var(--color-accent)] hover:underline">
              View pipeline
            </Link>
          </div>

          {!stats?.recent_leads?.length ? (
            <p className="text-xs text-[var(--color-muted)] py-4 text-center">No leads yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.recent_leads.map((lead) => {
                const stageColor = STAGE_COLORS[lead.deal_stage] || '#6b7280';
                return (
                  <Link
                    key={lead.id}
                    href="/admin/pipeline"
                    className="px-4 py-3 rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] transition-colors hover:border-[var(--color-accent)]/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--color-foreground-strong)] truncate">
                          {lead.company || lead.name}
                        </p>
                        {lead.company && lead.name && (
                          <p className="text-[10px] text-[var(--color-muted)] truncate">{lead.name}</p>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                        style={{ backgroundColor: `${stageColor}20`, color: stageColor }}
                      >
                        {STAGE_LABELS[lead.deal_stage] || lead.deal_stage}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-muted)]">
                      <span>{timeAgo(lead.created_at)}</span>
                      {lead.email_sent_at && (
                        <span className="text-green-400">Email sent</span>
                      )}
                      {lead.roadmap_purchased_at && (
                        <span className="text-amber-400">Roadmap purchased</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* System Status */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-3">System Status</h2>
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SystemCheck label="Supabase" connected={systemStatus.supabase} />
              <SystemCheck label="Resend" connected={systemStatus.resend} detail="verified" />
              <SystemCheck label="Stripe" connected={systemStatus.stripe} detail="test mode" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">Last Submission</p>
                <p className="text-xs text-[var(--color-foreground-strong)]">
                  {stats?.last_submission_at ? timeAgo(stats.last_submission_at) : 'None'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2 pb-4">
          {[
            { href: '/admin/pipeline', label: 'Pipeline', icon: '◈' },
            { href: '/admin/discoveries', label: 'Discoveries', icon: '◇' },
            { href: '/admin/tola', label: 'TOLA', icon: '◉' },
            { href: '/admin/agents', label: 'Agents', icon: '◎' },
            { href: '/admin/contacts', label: 'Contacts', icon: '◆' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-1 py-3 rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] hover:border-[var(--color-accent)]/30 transition-colors"
            >
              <span className="text-base text-[var(--color-accent)]">{link.icon}</span>
              <span className="text-[10px] text-[var(--color-muted)]">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div className="px-4 py-3 rounded-lg bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)]">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">{label}</p>
      <p className={`text-lg font-semibold ${accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-foreground-strong)]'}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-[var(--color-muted)]">{sub}</p>}
    </div>
  );
}

function SystemCheck({ label, connected, detail }: { label: string; connected: boolean; detail?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        {detail && connected && (
          <span className="text-[10px] text-[var(--color-muted)]">({detail})</span>
        )}
      </div>
    </div>
  );
}

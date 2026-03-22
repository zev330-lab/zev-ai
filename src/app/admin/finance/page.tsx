'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface FinanceMetrics {
  revenueThisMonth: number;
  outstandingTotal: number;
  hoursBilledThisMonth: number;
  effectiveRate: number;
  pipelineValue: number;
}

interface Invoice {
  id: string; project_id: string | null; client_name: string; amount: number;
  status: string; issued_date: string; due_date: string | null; paid_date: string | null;
  description: string; created_at: string;
  projects?: { name: string } | null;
}

interface MonthlyMetric {
  month: string; revenue: number; costs: number; hours_billed: number;
}

const INV_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', label: 'Draft' },
  sent: { bg: 'rgba(250,204,21,0.15)', text: '#facc15', label: 'Sent' },
  paid: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80', label: 'Paid' },
  overdue: { bg: 'rgba(248,113,113,0.15)', text: '#f87171', label: 'Overdue' },
};

const INV_FILTERS = ['all', 'draft', 'sent', 'paid', 'overdue'] as const;

export default function AdminFinancePage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [monthly, setMonthly] = useState<MonthlyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ client_name: '', amount: '', description: '', due_date: '' });

  const fetchAll = useCallback(async () => {
    const [mRes, iRes, moRes] = await Promise.all([
      fetch('/api/admin/finance'),
      fetch(`/api/admin/finance?view=invoices${filter !== 'all' ? `&status=${filter}` : ''}`),
      fetch('/api/admin/finance?view=monthly'),
    ]);
    if (mRes.status === 401) { router.push('/admin/login'); return; }
    const [m, i, mo] = await Promise.all([mRes.json(), iRes.json(), moRes.json()]);
    if (m && !m.error) setMetrics(m);
    if (Array.isArray(i)) setInvoices(i);
    if (Array.isArray(mo)) setMonthly(mo.reverse());
    setLoading(false);
  }, [filter, router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    await fetch('/api/admin/finance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
    fetchAll();
  };

  const createInvoice = async () => {
    if (!form.client_name || !form.amount) return;
    await fetch('/api/admin/finance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: form.client_name, amount: parseFloat(form.amount), description: form.description, due_date: form.due_date || null, status: 'draft' }),
    });
    setShowCreate(false);
    setForm({ client_name: '', amount: '', description: '', due_date: '' });
    fetchAll();
  };

  const chartData = monthly.map((m) => ({
    month: new Date(m.month).toLocaleDateString('en-US', { month: 'short' }),
    revenue: Number(m.revenue),
    hours: Number(m.hours_billed),
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--color-admin-border)] shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-foreground-strong)]">Finance</h1>
            <p className="text-xs text-[var(--color-muted)] mt-1">Revenue, invoicing, and cost tracking</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:opacity-90 cursor-pointer">Create Invoice</button>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-6 py-4 border-b border-[var(--color-admin-border)] shrink-0">
        {loading ? <p className="text-xs text-[var(--color-muted)]">Loading...</p> : metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard label="Revenue (this month)" value={`$${metrics.revenueThisMonth.toLocaleString()}`} accent />
            <MetricCard label="Outstanding" value={`$${metrics.outstandingTotal.toLocaleString()}`} warn={metrics.outstandingTotal > 0} />
            <MetricCard label="Pipeline Value" value={metrics.pipelineValue > 0 ? `$${metrics.pipelineValue.toLocaleString()}` : '--'} />
            <MetricCard label="Hours Billed" value={metrics.hoursBilledThisMonth.toFixed(1)} />
            <MetricCard label="Effective Rate" value={metrics.effectiveRate > 0 ? `$${metrics.effectiveRate}/hr` : '--'} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
        {/* Monthly Trend Chart */}
        {chartData.length > 0 && (
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-5">
            <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] mb-4">Monthly Revenue & Costs</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#161a2e" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#4a4e5e' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#4a4e5e' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0d1020', border: '1px solid #161a2e', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#7c9bf5" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="costs" fill="#f8717140" radius={[4, 4, 0, 0]} name="Costs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Invoice List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)]">Invoices</p>
            <div className="flex rounded-lg border border-[var(--color-admin-border)] overflow-hidden">
              {INV_FILTERS.map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 text-[10px] font-medium capitalize cursor-pointer ${filter === s ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-admin-surface)] text-[var(--color-muted-light)]'}`}>{s}</button>
              ))}
            </div>
          </div>

          {invoices.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] py-8 text-center">No invoices. Create one to get started.</p>
          ) : (
            <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-admin-border)]">
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Client</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Amount</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Date</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const badge = INV_BADGE[inv.status] || INV_BADGE.draft;
                    return (
                      <tr key={inv.id} className="border-b border-[var(--color-admin-border)]/50">
                        <td className="px-4 py-3 text-[var(--color-foreground-strong)]">{inv.client_name}</td>
                        <td className="px-4 py-3 text-[var(--color-foreground-strong)] font-medium">${Number(inv.amount).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full" style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span></td>
                        <td className="px-4 py-3 text-[var(--color-muted)] text-xs">{new Date(inv.issued_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {inv.status === 'sent' && <button onClick={() => updateInvoice(inv.id, { status: 'paid', paid_date: new Date().toISOString().slice(0, 10) })} className="text-[10px] text-green-400 hover:underline cursor-pointer">Mark Paid</button>}
                            {inv.status === 'draft' && <button onClick={() => updateInvoice(inv.id, { status: 'sent' })} className="text-[10px] text-[var(--color-accent)] hover:underline cursor-pointer">Send</button>}
                            {inv.status === 'overdue' && <button onClick={() => updateInvoice(inv.id, { status: 'paid', paid_date: new Date().toISOString().slice(0, 10) })} className="text-[10px] text-green-400 hover:underline cursor-pointer">Mark Paid</button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-[var(--color-foreground-strong)] mb-4">Create Invoice</h3>
            <div className="space-y-3">
              <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Client</label><input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Amount ($)</label><input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
              <div><label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">Due Date</label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full bg-[var(--color-admin-bg)] border border-[var(--color-admin-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground-strong)]" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={createInvoice} className="flex-1 px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white cursor-pointer">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs text-[var(--color-muted)] cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="bg-[var(--color-admin-surface)] border border-[var(--color-admin-border)] rounded-lg px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${accent ? 'text-[var(--color-accent)]' : warn ? 'text-amber-400' : 'text-[var(--color-foreground-strong)]'}`}>{value}</p>
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isValidSession } from '@/lib/auth';

async function isAuthed() {
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get('admin_auth')?.value);
}

// GET: dashboard metrics + invoice list
export async function GET(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const view = searchParams.get('view');

  const supabase = getSupabaseAdmin();

  if (view === 'invoices') {
    const status = searchParams.get('status');
    let query = supabase.from('invoices').select('*, projects(name)').order('created_at', { ascending: false });
    if (status && status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (view === 'monthly') {
    const { data } = await supabase.from('monthly_metrics').select('*').order('month', { ascending: false }).limit(6);
    return NextResponse.json(data || []);
  }

  // Dashboard metrics
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: paidThisMonth }, { data: outstanding }, { data: timeThisMonth }, { data: allInvoices }] = await Promise.all([
    supabase.from('invoices').select('amount').eq('status', 'paid').gte('paid_date', monthStart.slice(0, 10)),
    supabase.from('invoices').select('amount, status').in('status', ['sent', 'overdue']),
    supabase.from('project_time_entries').select('hours, billable, hourly_rate').eq('billable', true).gte('date', monthStart.slice(0, 10)),
    supabase.from('invoices').select('amount, status, paid_date, created_at').order('created_at', { ascending: false }).limit(100),
  ]);

  const revenueThisMonth = (paidThisMonth || []).reduce((s, i) => s + Number(i.amount), 0);
  const outstandingTotal = (outstanding || []).reduce((s, i) => s + Number(i.amount), 0);
  const hoursBilledThisMonth = (timeThisMonth || []).reduce((s, e) => s + Number(e.hours), 0);
  const effectiveRate = hoursBilledThisMonth > 0 ? Math.round(revenueThisMonth / hoursBilledThisMonth) : 0;

  return NextResponse.json({
    revenueThisMonth,
    outstandingTotal,
    hoursBilledThisMonth,
    effectiveRate,
    invoiceCount: (allInvoices || []).length,
  });
}

// POST: create invoice or monthly metric
export async function POST(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  if (body._type && body._type !== 'monthly_metric') {
    return NextResponse.json({ error: 'Invalid _type' }, { status: 400 });
  }

  const table = body._type === 'monthly_metric' ? 'monthly_metrics' : 'invoices';
  delete body._type;

  const { data, error } = await supabase.from(table).insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: update invoice
export async function PATCH(request: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('invoices').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

-- SEO audit results — stores results from manual admin SEO health checks
create table if not exists seo_audit_results (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  pages_checked int not null default 0,
  pages_passed int not null default 0,
  pages_failed int not null default 0,
  score int not null default 0,
  results jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Only service role can write; admins read via service role key
alter table seo_audit_results enable row level security;
create policy "service_role_all" on seo_audit_results
  for all using (auth.role() = 'service_role');

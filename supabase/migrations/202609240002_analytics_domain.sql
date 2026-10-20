create table public.analytics_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null unique,
  name text not null,
  description text not null default '',
  unit text not null check (unit in ('count', 'percent', 'percentage_points', 'duration_seconds')),
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.analytics_measurements (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null references public.analytics_metrics(metric_key),
  period_start date not null,
  period_end date not null,
  period_type text not null check (period_type in ('month', 'ytd', 'year')),
  site_id uuid references public.sites,
  client_id uuid references public.clients,
  device text check (device in ('desktop', 'mobile')),
  value numeric not null,
  source_report text not null,
  source_system text not null,
  definition_version text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create unique index analytics_measurements_natural_key
  on public.analytics_measurements (
    metric_key, period_start, period_end, period_type,
    coalesce(site_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(client_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(device, '')
  );
create index analytics_measurements_period_idx on public.analytics_measurements(metric_key, period_start, period_end);
create index analytics_measurements_site_idx on public.analytics_measurements(site_id, metric_key, period_start) where site_id is not null;

alter table public.analytics_metrics enable row level security;
alter table public.analytics_measurements enable row level security;
create policy "prototype demo access" on public.analytics_metrics for all to anon, authenticated using (true) with check (true);
create policy "prototype demo access" on public.analytics_measurements for all to anon, authenticated using (true) with check (true);

comment on table public.analytics_metrics is 'Versioned definitions for business measurements; runtime portal behavior remains source-controlled.';
comment on table public.analytics_measurements is 'Normalized portfolio, client, site, and device measurements with source and definition lineage.';

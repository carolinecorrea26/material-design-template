-- Planning records are independent of publication readiness and Site activation.
create table public.migration_schedules (
  id text primary key,
  client_key text not null unique,
  migrating boolean not null default false,
  milestones jsonb not null check (jsonb_typeof(milestones) = 'object'),
  expected_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.migration_schedules enable row level security;
grant select, insert, update on public.migration_schedules to authenticated;
create policy "Verified admin migration planning" on public.migration_schedules
  for all to authenticated
  using (public.portal_admin_identity() is not null and coalesce(auth.jwt()->>'aal', '') = 'aal2')
  with check (public.portal_admin_identity() is not null and coalesce(auth.jwt()->>'aal', '') = 'aal2');

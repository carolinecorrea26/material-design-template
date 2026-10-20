-- Library tracking specification; instrumentation remains separately verified.
create table if not exists public.analytics_tags (
  id text primary key, page_id text not null, element_key text not null,
  label text not null, kind text not null, events jsonb not null default '[]',
  trigger text not null, sites jsonb not null default '[]', status text not null,
  permitted_properties jsonb not null default '[]', description text not null,
  source text not null, source_file text not null, condition text not null,
  adobe jsonb not null, contentsquare jsonb not null
);
alter table public.analytics_tags enable row level security;
grant select, insert, update, delete on public.analytics_tags to authenticated;
create policy "Verified admin tracking configuration" on public.analytics_tags
  for all to authenticated
  using (public.portal_admin_identity() is not null and coalesce(auth.jwt()->>'aal', '') = 'aal2')
  with check (public.portal_admin_identity() is not null and coalesce(auth.jwt()->>'aal', '') = 'aal2');

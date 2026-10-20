-- Additive Site environment links; consumer runtime remains on source configuration.
create table public.site_environment_links (
  "id" text primary key,
  "key" text not null unique,
  "site_key" text not null references public.sites(key),
  "environment" text not null check (environment in ('prototype','test','pre-production','production','automation')),
  "link_type" text not null check (link_type in ('launch','campaign','apply','returning','reference')),
  "label" text not null,
  "url" text not null check (url ~ '^https?://'),
  "active" boolean not null,
  "position" integer not null default 0
);
alter table public.site_environment_links enable row level security;
-- Public URL metadata for the existing Admin Center prototype.
create policy "prototype environment read" on public.site_environment_links for select to anon, authenticated using (true);

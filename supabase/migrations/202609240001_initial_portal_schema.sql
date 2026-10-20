create extension if not exists pgcrypto;

create type public.record_status as enum ('active', 'inactive', 'archived');
create type public.application_status as enum ('In Progress', 'Pending TPA Review', 'Underwriting', 'Waiting for Advisor', 'Completed', 'Rejected');
create type public.action_owner_type as enum ('Applicant', 'Advisor', 'TPA', 'NYL', 'None');
create type public.change_type as enum ('create', 'update', 'remove');
create type public.audit_action as enum ('create', 'update', 'archive', 'restore', 'status_change');

create table public.organizations (
  id uuid primary key default gen_random_uuid(), key text not null unique, name text not null,
  type text not null, status record_status not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.clients (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations,
  key text not null unique, name text not null, acronym text not null, status record_status not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.sites (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients, key text not null unique,
  name text not null, display_name text not null, status record_status not null default 'active', environment text not null default 'demo',
  template_type text not null check (template_type in ('single','multi')), legacy_client_id text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.site_coverages (id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites, coverage_key text not null, enabled boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(site_id, coverage_key));
create table public.site_products (id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites, product_key text not null, enabled boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(site_id, product_key));
create table public.site_riders (id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites, rider_key text not null, enabled boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(site_id, rider_key));
create table public.site_configurations (
  id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites, configuration_key text not null,
  value_json jsonb not null default 'null', source text not null default 'site_override', effective_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique(site_id, configuration_key, effective_date)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(), application_number text not null unique, site_id uuid not null references public.sites,
  product_key text not null, status application_status not null, current_action_owner_type action_owner_type not null,
  current_action_owner_id uuid, submitted_at timestamptz, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.users (id uuid primary key default gen_random_uuid(), email text not null unique, display_name text not null, status record_status not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.application_participants (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications, participant_type text not null,
  user_id uuid references public.users, name text not null, email text not null, relationship text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.application_events (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications, event_type text not null,
  from_status application_status, to_status application_status, from_owner_type action_owner_type, to_owner_type action_owner_type,
  performed_by text not null, notes text, created_at timestamptz not null default now()
);

create table public.releases (
  id uuid primary key default gen_random_uuid(), release_key text not null unique, name text not null, release_date date not null,
  status text not null, notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.change_requests (
  id uuid primary key default gen_random_uuid(), change_number text not null unique, title text not null, description text not null default '',
  status text not null, requested_by text not null, owner_id text, target_release_id uuid references public.releases,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.change_items (
  id uuid primary key default gen_random_uuid(), change_request_id uuid not null references public.change_requests on delete cascade,
  site_id uuid references public.sites, entity_type text not null, entity_id text, field_key text not null,
  current_value_json jsonb not null default 'null', proposed_value_json jsonb not null default 'null', change_type change_type not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.release_changes (
  id uuid primary key default gen_random_uuid(), release_id uuid not null references public.releases on delete cascade,
  change_request_id uuid not null references public.change_requests on delete cascade, created_at timestamptz not null default now(), unique(release_id, change_request_id)
);
create table public.site_builder_drafts (
  id uuid primary key default gen_random_uuid(), client_id uuid references public.clients, site_key text not null, site_name text not null,
  status text not null, current_step text not null, draft_data_json jsonb not null default '{}', owner_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table public.roles (id uuid primary key default gen_random_uuid(), key text not null unique, name text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users on delete cascade, role_id uuid not null references public.roles on delete cascade, created_at timestamptz not null default now(), unique(user_id, role_id));
create table public.user_scopes (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users on delete cascade, scope_type text not null check (scope_type in ('global','organization','client','site','advisor')), scope_id uuid, created_at timestamptz not null default now());
create table public.audit_events (
  id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id uuid not null, action audit_action not null,
  field_key text, old_value_json jsonb not null default 'null', new_value_json jsonb not null default 'null',
  performed_by text not null, change_request_id uuid references public.change_requests, created_at timestamptz not null default now()
);

create index sites_client_id_idx on public.sites(client_id) where deleted_at is null;
create index applications_site_id_idx on public.applications(site_id) where deleted_at is null;
create index application_events_application_id_idx on public.application_events(application_id, created_at desc);
create index change_items_change_request_id_idx on public.change_items(change_request_id);
create index audit_events_entity_idx on public.audit_events(entity_type, entity_id, created_at desc);

alter table public.organizations enable row level security; alter table public.clients enable row level security;
alter table public.sites enable row level security; alter table public.site_coverages enable row level security;
alter table public.site_products enable row level security; alter table public.site_riders enable row level security;
alter table public.site_configurations enable row level security; alter table public.applications enable row level security;
alter table public.application_participants enable row level security; alter table public.application_events enable row level security;
alter table public.change_requests enable row level security; alter table public.change_items enable row level security;
alter table public.releases enable row level security; alter table public.release_changes enable row level security;
alter table public.site_builder_drafts enable row level security; alter table public.users enable row level security;
alter table public.roles enable row level security; alter table public.user_roles enable row level security;
alter table public.user_scopes enable row level security; alter table public.audit_events enable row level security;

-- Demo-only policy: anon/authenticated clients may access operational data so this prototype works
-- without an authentication build-out. Replace with user_scopes-based policies before production.
do $$ declare table_name text; begin
  foreach table_name in array array['organizations','clients','sites','site_coverages','site_products','site_riders','site_configurations','applications','application_participants','application_events','change_requests','change_items','releases','release_changes','site_builder_drafts','users','roles','user_roles','user_scopes','audit_events']
  loop execute format('create policy "prototype demo access" on public.%I for all to anon, authenticated using (true) with check (true)', table_name); end loop;
end $$;

-- Operational people are independent of sign-in accounts and applicant-type metadata.
-- This migration creates relationships only; customer account workflows remain TBD.
begin;

alter table public.sites add constraint sites_id_client_id_unique unique (id, client_id);
alter table public.sites add constraint sites_id_key_unique unique (id, key);
alter table public.applications add constraint applications_id_site_id_unique unique (id, site_id);

create table public.applicants (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  display_name text not null check (length(btrim(display_name)) > 0),
  email text,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, client_id)
);

create table public.application_applicants (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  site_id uuid not null,
  client_id uuid not null,
  applicant_id uuid not null,
  applicant_type_key text not null references public.applicant_types(key),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (application_id, site_id) references public.applications(id, site_id),
  foreign key (site_id, client_id) references public.sites(id, client_id),
  foreign key (applicant_id, client_id) references public.applicants(id, client_id),
  unique (application_id, applicant_id)
);

-- Capture the selected Association independently of the application's people.
-- Composite references ensure it belongs to the application's actual Site.
create table public.application_associations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique,
  site_id uuid not null,
  site_key text not null,
  association_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (application_id, site_id) references public.applications(id, site_id),
  foreign key (site_id, site_key) references public.sites(id, key),
  foreign key (site_key, association_key) references public.site_associations(site_key, association_key)
);

create index applicants_client_id_idx on public.applicants(client_id) where deleted_at is null;
create index application_applicants_applicant_id_idx on public.application_applicants(applicant_id);
create index application_applicants_site_client_idx on public.application_applicants(site_id, client_id);
create index application_associations_site_association_idx on public.application_associations(site_key, association_key);

-- No inherited demo policy: account authorization will be implemented separately.
alter table public.applicants enable row level security;
alter table public.application_applicants enable row level security;
alter table public.application_associations enable row level security;

commit;

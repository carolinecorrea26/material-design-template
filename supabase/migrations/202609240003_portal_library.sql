-- Phase 2: additive library schema. Existing tables and policies are unchanged.
-- Keys are stable semantic identities; scope constraints prohibit ambiguous ownership.
-- New tables have RLS enabled and no browser access policy until a later phase.

create table public.organization_profiles (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "organization_key" text not null references public.organizations(key),
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object'),
  unique(organization_key)
);
alter table public.organization_profiles enable row level security;

create table public.associations (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "client_key" text not null references public.clients(key),
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.associations enable row level security;

create table public.pages (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.pages enable row level security;

create table public.page_sections (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "page_key" text not null references public.pages(key),
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.page_sections enable row level security;

create table public.fields (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.fields enable row level security;

create table public.page_fields (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "page_key" text not null references public.pages(key),
  "field_key" text not null references public.fields(key),
  unique(page_key, field_key),
  unique(page_key, position)
);
alter table public.page_fields enable row level security;

create table public.coverage_categories (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.coverage_categories enable row level security;

create table public.products (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "category_key" text not null references public.coverage_categories(key),
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.products enable row level security;

create table public.riders (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.riders enable row level security;

create table public.product_riders (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "product_key" text not null references public.products(key),
  "rider_key" text not null references public.riders(key),
  "scope" text not null check (scope in ('global','client','site')),
  "client_key" text references public.clients(key),
  "site_key" text references public.sites(key),
  unique nulls not distinct(product_key, rider_key, scope, client_key, site_key),
  check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
);
alter table public.product_riders enable row level security;

create table public.product_identifiers (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "product_key" text not null references public.products(key),
  "kind" text not null check (kind in ('gNumber','planCode')),
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object'),
  "scope" text not null check (scope in ('global','client','site')),
  "client_key" text references public.clients(key),
  "site_key" text references public.sites(key),
  unique nulls not distinct(product_key, kind, scope, client_key, site_key),
  check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
);
alter table public.product_identifiers enable row level security;

create table public.applicant_types (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.applicant_types enable row level security;

create table public.conditions (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.conditions enable row level security;

create table public.rules (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.rules enable row level security;

create table public.rule_conditions (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "rule_key" text not null references public.rules(key),
  "condition_key" text not null references public.conditions(key),
  unique(rule_key, condition_key)
);
alter table public.rule_conditions enable row level security;

create table public.rule_actions (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "rule_key" text not null references public.rules(key),
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.rule_actions enable row level security;

create table public.flows (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.flows enable row level security;

create table public.flow_steps (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "flow_key" text not null references public.flows(key),
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object'),
  unique(flow_key, key)
);
alter table public.flow_steps enable row level security;

create table public.flow_transitions (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "flow_key" text not null references public.flows(key),
  "source_step_key" text not null references public.flow_steps(key),
  "target_step_key" text not null references public.flow_steps(key),
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object'),
  foreign key (flow_key, source_step_key) references public.flow_steps(flow_key, key),
  foreign key (flow_key, target_step_key) references public.flow_steps(flow_key, key)
);
alter table public.flow_transitions enable row level security;

create table public.features (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.features enable row level security;

create table public.configuration_definitions (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.configuration_definitions enable row level security;

create table public.content_entries (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.content_entries enable row level security;

create table public.email_templates (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.email_templates enable row level security;

create table public.document_definitions (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.document_definitions enable row level security;

create table public.validation_rules (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "field_key" text not null references public.fields(key),
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object')
);
alter table public.validation_rules enable row level security;

create table public.site_associations (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "site_key" text not null references public.sites(key),
  "association_key" text not null references public.associations(key),
  "enabled" boolean not null,
  unique(site_key, association_key)
);
alter table public.site_associations enable row level security;

create table public.site_pages (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "site_key" text not null references public.sites(key),
  "page_key" text not null references public.pages(key),
  "requirement" text not null check (requirement in ('required','optional','none')),
  unique(site_key, page_key)
);
alter table public.site_pages enable row level security;

create table public.site_field_configurations (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "page_key" text not null references public.pages(key),
  "field_key" text not null references public.fields(key),
  "include" boolean,
  "hidden" boolean,
  "values" jsonb not null check (jsonb_typeof("values") = 'object'),
  "scope" text not null check (scope in ('global','client','site')),
  "client_key" text references public.clients(key),
  "site_key" text references public.sites(key),
  check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
);
alter table public.site_field_configurations enable row level security;

create table public.site_product_applicants (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "site_key" text not null references public.sites(key),
  "product_key" text not null references public.products(key),
  "applicant_key" text not null references public.applicant_types(key),
  unique(site_key, product_key, applicant_key)
);
alter table public.site_product_applicants enable row level security;

create table public.site_features (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "site_key" text not null references public.sites(key),
  "feature_key" text not null references public.features(key),
  "enabled" boolean not null,
  unique(site_key, feature_key)
);
alter table public.site_features enable row level security;

create table public.site_flows (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "flow_key" text not null references public.flows(key),
  "flow_id" text not null,
  "scope" text not null check (scope in ('global','client','site')),
  "client_key" text references public.clients(key),
  "site_key" text references public.sites(key),
  unique nulls not distinct(flow_id, scope, client_key, site_key),
  check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
);
alter table public.site_flows enable row level security;

create table public.rule_assignments (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "rule_key" text not null references public.rules(key),
  "scope" text not null check (scope in ('global','client','site')),
  "client_key" text references public.clients(key),
  "site_key" text references public.sites(key),
  unique nulls not distinct(rule_key, scope, client_key, site_key),
  check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
);
alter table public.rule_assignments enable row level security;

create table public.configuration_values (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "configuration_key" text not null references public.configuration_definitions(key),
  "value" jsonb not null,
  "scope" text not null check (scope in ('global','client','site')),
  "client_key" text references public.clients(key),
  "site_key" text references public.sites(key),
  unique nulls not distinct(configuration_key, scope, client_key, site_key),
  check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
);
alter table public.configuration_values enable row level security;

create table public.content_values (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "content_key" text not null references public.content_entries(key),
  "value" jsonb not null,
  "scope" text not null check (scope in ('global','client','site')),
  "client_key" text references public.clients(key),
  "site_key" text references public.sites(key),
  unique nulls not distinct(content_key, scope, client_key, site_key),
  check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
);
alter table public.content_values enable row level security;

create table public.branding_profiles (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object'),
  "scope" text not null check (scope in ('global','client','site')),
  "client_key" text references public.clients(key),
  "site_key" text references public.sites(key),
  unique nulls not distinct(scope, client_key, site_key),
  check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
);
alter table public.branding_profiles enable row level security;

create table public.support_profiles (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object'),
  "scope" text not null check (scope in ('global','client','site')),
  "client_key" text references public.clients(key),
  "site_key" text references public.sites(key),
  unique nulls not distinct(scope, client_key, site_key),
  check ((scope = 'global' and client_key is null and site_key is null) or (scope = 'client' and client_key is not null and site_key is null) or (scope = 'site' and site_key is not null and client_key is null))
);
alter table public.support_profiles enable row level security;

create table public.site_email_templates (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "site_key" text not null references public.sites(key),
  "email_template_key" text not null references public.email_templates(key),
  "enabled" boolean not null,
  unique(site_key, email_template_key)
);
alter table public.site_email_templates enable row level security;

create table public.site_documents (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "site_key" text not null references public.sites(key),
  "document_key" text not null references public.document_definitions(key),
  unique(site_key, document_key)
);
alter table public.site_documents enable row level security;

create table public.site_policies (
  "id" text primary key,
  "key" text not null unique,
  "position" integer not null default 0,
  "site_key" text not null references public.sites(key),
  "definition" jsonb not null check (jsonb_typeof(definition) = 'object'),
  unique(site_key)
);
alter table public.site_policies enable row level security;

-- A Site may only enable Associations belonging to its own Client.
create function public.check_site_association_client() returns trigger
language plpgsql as $$
declare site_client_key text;
begin
  select c.key into site_client_key from public.sites s join public.clients c on c.id = s.client_id where s.key = new.site_key;
  if site_client_key is distinct from (select client_key from public.associations where key = new.association_key) then
    raise exception 'Site Association crosses Client boundaries' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger site_association_client_guard before insert or update on public.site_associations
for each row execute function public.check_site_association_client();

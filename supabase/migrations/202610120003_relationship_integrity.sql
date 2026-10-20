-- Additive integrity upgrade. Existing invalid records are retained in an explicit
-- reconciliation ledger; NOT VALID constraints reject new invalid writes.
begin;

create table public.schema_reconciliation_issues (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id text not null,
  reference_name text not null,
  original_value jsonb not null,
  reason text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique(table_name, record_id, reference_name)
);
alter table public.schema_reconciliation_issues enable row level security;

-- A legacy coverage key is a product selection identity, not a category key.
alter table public.site_coverages add constraint site_coverages_product_reference
  foreign key (coverage_key) references public.products(key) deferrable initially deferred not valid;
alter table public.site_products add constraint site_products_product_reference
  foreign key (product_key) references public.products(key) deferrable initially deferred not valid;
alter table public.site_riders add constraint site_riders_rider_reference
  foreign key (rider_key) references public.riders(key) deferrable initially deferred not valid;
alter table public.migration_schedules add constraint migration_schedules_association_context
  foreign key (client_key) references public.clients(key) not valid;

-- Preserve bad catalog identities without guessing their replacement.
insert into public.schema_reconciliation_issues(table_name,record_id,reference_name,original_value,reason)
select 'site_coverages',s.id::text,'coverage_key',to_jsonb(s.coverage_key),'Legacy product selection key has no catalog product'
from public.site_coverages s where not exists(select from public.products p where p.key=s.coverage_key)
union all
select 'site_products',s.id::text,'product_key',to_jsonb(s.product_key),'Product key has no catalog product'
from public.site_products s where not exists(select from public.products p where p.key=s.product_key)
union all
select 'site_riders',s.id::text,'rider_key',to_jsonb(s.rider_key),'Rider key has no catalog rider'
from public.site_riders s where not exists(select from public.riders p where p.key=s.rider_key)
union all
select 'migration_schedules',s.id,'client_key',to_jsonb(s.client_key),'Legacy hosting Association key has no owner'
from public.migration_schedules s where not exists(select from public.clients c where c.key=s.client_key);

-- Constraint validation is conditional on reconciled data, never fabricated keys.
do $$ declare item record; begin
  for item in select * from (values
    ('site_coverages','site_coverages_product_reference','coverage_key'),
    ('site_products','site_products_product_reference','product_key'),
    ('site_riders','site_riders_rider_reference','rider_key'),
    ('migration_schedules','migration_schedules_association_context','client_key')
  ) x(table_name,constraint_name,reference_name) loop
    if not exists(select from public.schema_reconciliation_issues i where i.table_name=item.table_name and i.reference_name=item.reference_name and i.resolved_at is null) then
      execute format('alter table public.%I validate constraint %I',item.table_name,item.constraint_name);
    end if;
  end loop;
end $$;

-- Protect the Site/Association boundary on parent changes as well as link writes.
create function public.guard_association_parent_change() returns trigger language plpgsql as $$
begin
  if TG_TABLE_NAME='sites' then
    if new.client_id is distinct from old.client_id and exists(select from public.site_associations sa join public.associations a on a.key=sa.association_key
      join public.clients c on c.key=a.client_key where sa.site_key=old.key and c.id<>new.client_id) then
      raise exception 'Site reassignment would invalidate Association relationships' using errcode='23514';
    end if;
  elsif TG_TABLE_NAME='associations' then
    if new.client_key is distinct from old.client_key and exists(select from public.site_associations sa join public.sites s on s.key=sa.site_key
      join public.clients c on c.id=s.client_id where sa.association_key=old.key and c.key<>new.client_key) then
      raise exception 'Association reassignment would invalidate Site relationships' using errcode='23514';
    end if;
  end if;
  return new;
end $$;
create trigger sites_association_parent_guard before update of client_id on public.sites
  for each row execute function public.guard_association_parent_change();
create trigger associations_site_parent_guard before update of client_key on public.associations
  for each row execute function public.guard_association_parent_change();

-- Simultaneously specified Site and hosting Association contexts must agree.
create function public.check_site_owner_pair() returns trigger language plpgsql as $$
declare row_data jsonb := to_jsonb(new); actual text; expected text;
begin
  if row_data->>'site_key' is not null and row_data->>'client_key' is not null then
    select c.key into actual from public.sites s join public.clients c on c.id=s.client_id where s.key=row_data->>'site_key';
    expected := row_data->>'client_key';
  elsif row_data->>'site_id' is not null and row_data->>'client_id' is not null then
    select s.client_id::text into actual from public.sites s where s.id=(row_data->>'site_id')::uuid;
    expected := row_data->>'client_id';
  else return new;
  end if;
  if actual is distinct from expected then raise exception 'Site and hosting Association ownership disagree' using errcode='23514'; end if;
  return new;
end $$;
create trigger pattern_assignments_owner_guard before insert or update on public.pattern_assignments for each row execute function public.check_site_owner_pair();
create trigger product_amount_rules_owner_guard before insert or update on public.product_amount_rules for each row execute function public.check_site_owner_pair();
create trigger analytics_measurements_owner_guard before insert or update on public.analytics_measurements for each row execute function public.check_site_owner_pair();

-- Parent ownership updates must not leave existing paired contexts inconsistent.
create function public.guard_site_paired_contexts() returns trigger language plpgsql as $$
declare owner_key text;
begin
  if new.client_id is not distinct from old.client_id then return new; end if;
  select key into owner_key from public.clients where id=new.client_id;
  if exists(select from public.pattern_assignments where site_key=old.key and client_key is not null and client_key<>owner_key)
    or exists(select from public.product_amount_rules where site_key=old.key and client_key is not null and client_key<>owner_key)
    or exists(select from public.analytics_measurements where site_id=old.id and client_id is not null and client_id<>new.client_id) then
    raise exception 'Site reassignment would invalidate paired ownership contexts' using errcode='23514';
  end if;
  return new;
end $$;
create trigger sites_paired_context_guard before update of client_id on public.sites for each row execute function public.guard_site_paired_contexts();

-- Site product role assignments refer to the offered Site/product relationship.
create function public.check_site_offered_product() returns trigger language plpgsql as $$
begin
  perform 1 from public.site_products p join public.sites s on s.id=p.site_id where s.key=new.site_key and p.product_key=new.product_key for key share of p,s;
  if not found then
    raise exception 'Product is not assigned to this Site' using errcode='23514';
  end if;
  return new;
end $$;
create trigger site_product_applicants_offering_guard before insert or update on public.site_product_applicants for each row execute function public.check_site_offered_product();
create function public.guard_site_product_roles() returns trigger language plpgsql as $$
declare site_key_value text;
begin
  if TG_OP='UPDATE' and new.site_id=old.site_id and new.product_key=old.product_key then return new; end if;
  select key into site_key_value from public.sites where id=old.site_id;
  if exists(select from public.site_product_applicants where site_key=site_key_value and product_key=old.product_key) then
    raise exception 'Site product is referenced by applicant-role assignments; archive instead' using errcode='23503';
  end if;
  if TG_OP='UPDATE' then return new; end if;
  return old;
end $$;
create trigger site_products_role_delete_guard before delete or update of site_id,product_key on public.site_products for each row execute function public.guard_site_product_roles();

-- Publication pointers must retain the same Site independently of the RPC caller.
alter table public.portal_library_drafts add constraint portal_library_drafts_site_identity unique(id,site_key);
alter table public.portal_library_releases add constraint portal_library_releases_site_identity unique(id,site_key);
alter table public.portal_library_releases add constraint portal_release_draft_site
  foreign key(draft_id,site_key) references public.portal_library_drafts(id,site_key);
alter table public.portal_library_drafts add constraint portal_draft_base_site
  foreign key(base_release_id,site_key) references public.portal_library_releases(id,site_key);
alter table public.portal_library_heads add constraint portal_head_release_site
  foreign key(release_id,site_key) references public.portal_library_releases(id,site_key);
alter table public.portal_library_publication_audit add constraint portal_audit_draft_site
  foreign key(draft_id,site_key) references public.portal_library_drafts(id,site_key);
alter table public.portal_library_publication_audit add constraint portal_audit_previous_site
  foreign key(previous_release_id,site_key) references public.portal_library_releases(id,site_key);
alter table public.portal_library_publication_audit add constraint portal_audit_release_site
  foreign key(release_id,site_key) references public.portal_library_releases(id,site_key);

create function public.guard_published_configuration_history() returns trigger language plpgsql as $$
begin raise exception 'Published configuration history is immutable; publish a new version' using errcode='23514'; end $$;
create trigger portal_library_releases_immutable before update or delete on public.portal_library_releases
  for each row execute function public.guard_published_configuration_history();

-- Configuration snapshots cannot contain operational tables or operational flags.
create function public.check_publication_data_boundary() returns trigger language plpgsql as $$
declare item record; row_value jsonb;
begin
  if jsonb_typeof(new.payload) is distinct from 'object' or new.payload->>'siteKey' is distinct from new.site_key
    or jsonb_typeof(new.payload->'data') is distinct from 'object' then
    raise exception 'Invalid publication payload envelope' using errcode='23514';
  end if;
  for item in select * from jsonb_each(new.payload->'data') loop
    if item.key in ('applications','applicants','applicationApplicants','applicationAssociations','applicationParticipants','applicationEvents','applicationCoverages','applicationRiders','applicationAnswers','applicationSnapshots','applicationFlags','auditEvents','users','userRoles','userScopes','portalActors') then
      raise exception 'Operational data cannot enter a configuration release: %',item.key using errcode='23514';
    end if;
    if item.key='flagAssignments' then
      for row_value in select value from jsonb_array_elements(item.value) loop
        if row_value->>'applicationId' is not null then raise exception 'Application flags cannot enter a configuration release' using errcode='23514'; end if;
      end loop;
    end if;
  end loop;
  return new;
end $$;
create trigger portal_library_drafts_data_boundary before insert or update of payload on public.portal_library_drafts
  for each row execute function public.check_publication_data_boundary();
create trigger portal_library_releases_data_boundary before insert on public.portal_library_releases
  for each row execute function public.check_publication_data_boundary();

create index site_coverages_product_idx on public.site_coverages(coverage_key);
create index site_products_product_idx on public.site_products(product_key);
create index site_riders_rider_idx on public.site_riders(rider_key);
create index site_associations_association_idx on public.site_associations(association_key);
create index site_product_applicants_product_idx on public.site_product_applicants(product_key);
comment on table public.clients is 'Legacy storage name for the hosting Association in TPA > Association > Site. Not an additional business Client entity.';
comment on table public.site_associations is 'Fixed automatic Association context or associations offered by a multi-association Site. Presence of a row does not imply a membership selector.';
commit;

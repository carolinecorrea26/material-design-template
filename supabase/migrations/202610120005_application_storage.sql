-- Operational data is separate from configuration publication payloads.
begin;
create table public.portal_actors (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  kind text not null check(kind in ('human','service','system','unresolved')),
  display_name text not null,
  user_id uuid unique references public.users(id),
  auth_user_id uuid unique references auth.users(id),
  applicant_id uuid unique references public.applicants(id),
  original_identity jsonb not null default '{}',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  check(kind='human' or num_nonnulls(user_id,auth_user_id,applicant_id)=0),
  check(kind<>'human' or num_nonnulls(user_id,auth_user_id,applicant_id)>0)
);
create function public.portal_actor_for_label(label text) returns uuid language plpgsql as $$
declare result uuid; known_user uuid;
begin
  if label is null or length(btrim(label))=0 then raise exception 'Actor identity cannot be empty' using errcode='23514'; end if;
  select id into result from public.portal_actors where key=label;
  if found then return result; end if;
  select id into known_user from public.users where id::text=label;
  insert into public.portal_actors(key,kind,display_name,user_id,original_identity)
    values('legacy-label.'||encode(sha256(convert_to(label,'UTF8')),'hex'),case when known_user is null then 'unresolved' else 'human' end,label,known_user,jsonb_build_object('label',label))
    on conflict(key) do update set key=excluded.key returning id into result;
  return result;
end $$;
alter table public.application_events add column actor_id uuid references public.portal_actors(id);
alter table public.audit_events add column actor_id uuid references public.portal_actors(id);
alter table public.change_requests add column requested_by_actor_id uuid references public.portal_actors(id),
  add column owner_actor_id uuid references public.portal_actors(id);
alter table public.site_builder_drafts add column owner_actor_id uuid references public.portal_actors(id);
update public.application_events set actor_id=public.portal_actor_for_label(performed_by);
update public.audit_events set actor_id=public.portal_actor_for_label(performed_by);
update public.change_requests set requested_by_actor_id=public.portal_actor_for_label(requested_by),
  owner_actor_id=case when owner_id is null then null else public.portal_actor_for_label(owner_id) end;
update public.site_builder_drafts set owner_actor_id=case when owner_id is null then null else public.portal_actor_for_label(owner_id) end;
alter table public.application_events alter column actor_id set not null;
alter table public.audit_events alter column actor_id set not null;
alter table public.change_requests alter column requested_by_actor_id set not null;

create function public.fill_operational_actor_references() returns trigger language plpgsql as $$
begin
  if TG_TABLE_NAME in ('application_events','audit_events') then
    if new.actor_id is null or (TG_OP='UPDATE' and new.performed_by is distinct from old.performed_by and new.actor_id=old.actor_id) then new.actor_id:=public.portal_actor_for_label(new.performed_by); end if;
  elsif TG_TABLE_NAME='change_requests' then
    if new.requested_by_actor_id is null or (TG_OP='UPDATE' and new.requested_by is distinct from old.requested_by and new.requested_by_actor_id=old.requested_by_actor_id) then new.requested_by_actor_id:=public.portal_actor_for_label(new.requested_by); end if;
    if new.owner_id is null then new.owner_actor_id:=null;
    elsif new.owner_actor_id is null or (TG_OP='UPDATE' and new.owner_id is distinct from old.owner_id) then new.owner_actor_id:=public.portal_actor_for_label(new.owner_id); end if;
  else
    if new.owner_id is null then new.owner_actor_id:=null;
    elsif new.owner_actor_id is null or (TG_OP='UPDATE' and new.owner_id is distinct from old.owner_id) then new.owner_actor_id:=public.portal_actor_for_label(new.owner_id); end if;
  end if;
  return new;
end $$;
create trigger application_events_actor before insert or update on public.application_events for each row execute function public.fill_operational_actor_references();
create trigger audit_events_actor before insert or update on public.audit_events for each row execute function public.fill_operational_actor_references();
create trigger change_requests_actors before insert or update on public.change_requests for each row execute function public.fill_operational_actor_references();
create trigger site_builder_drafts_actor before insert or update on public.site_builder_drafts for each row execute function public.fill_operational_actor_references();

-- Preserve legacy owner IDs as evidence; the live owner ID references an actor.
alter table public.applications add column legacy_action_owner_id uuid;
update public.applications set legacy_action_owner_id=current_action_owner_id;
update public.applications set current_action_owner_id=case when current_action_owner_type='None' then null
  when current_action_owner_id is null then null else public.portal_actor_for_label(current_action_owner_id::text) end;
alter table public.applications add constraint applications_owner_actor foreign key(current_action_owner_id) references public.portal_actors(id);
alter table public.applications add constraint applications_none_owner check(current_action_owner_type<>'None' or current_action_owner_id is null);

-- The old label is retained; this new column is the actual catalog relationship.
alter table public.applications add column product_catalog_key text references public.products(key);
update public.applications a set product_catalog_key=a.product_key where exists(select from public.products p where p.key=a.product_key);
insert into public.schema_reconciliation_issues(table_name,record_id,reference_name,original_value,reason)
  select 'applications',id::text,'product_key',to_jsonb(product_key),'Historical display label retained; no canonical product was inferred'
  from public.applications where product_catalog_key is null;
comment on column public.applications.product_key is 'Legacy presentation/input identity; product_catalog_key and application_coverages are enforced catalog references. Historical labels are retained as evidence.';
create function public.resolve_application_product_reference() returns trigger language plpgsql as $$
begin
  if TG_OP='INSERT' or new.product_key is distinct from old.product_key then
    if exists(select from public.products where key=new.product_key) then new.product_catalog_key:=new.product_key;
    elsif new.product_catalog_key is null then
      raise exception 'New applications require a catalog product key' using errcode='23514';
    end if;
  end if;
  if new.product_catalog_key is not null and not exists(select from public.site_products where site_id=new.site_id and product_key=new.product_catalog_key) then
    raise exception 'Application product is not assigned to its Site' using errcode='23514';
  end if;
  return new;
end $$;
create trigger applications_product_catalog before insert or update of product_key,product_catalog_key,site_id on public.applications
  for each row execute function public.resolve_application_product_reference();

alter table public.application_associations add column association_entity_id uuid references public.association_entities(id);
update public.application_associations a set association_entity_id=x.association_id from public.association_aliases x
  where x.source_table='associations' and x.source_key=a.association_key;
alter table public.application_associations add constraint application_association_entity_unique unique(application_id,association_entity_id);
alter table public.application_associations add constraint application_association_canonical_site
  foreign key(site_id,association_entity_id) references public.site_association_contexts(site_id,association_id);
create function public.resolve_application_association_reference() returns trigger language plpgsql as $$
declare actual uuid;
begin
  select association_id into actual from public.association_aliases where source_table='associations' and source_key=new.association_key;
  if actual is null then raise exception 'Association context has not been reconciled' using errcode='23514'; end if;
  if new.association_entity_id is null then new.association_entity_id:=actual; end if;
  if new.association_entity_id<>actual or not exists(select from public.site_association_contexts where site_id=new.site_id and association_id=actual and enabled) then
    raise exception 'Association is not enabled for this Application Site' using errcode='23514';
  end if;
  return new;
end $$;
create trigger application_associations_canonical before insert or update on public.application_associations
  for each row execute function public.resolve_application_association_reference();

alter table public.application_applicants add constraint application_applicants_identity unique(id,application_id);
alter table public.application_participants add column actor_id uuid references public.portal_actors(id), add column application_applicant_id uuid;
alter table public.application_participants add constraint participant_application_person foreign key(application_applicant_id,application_id) references public.application_applicants(id,application_id);
create unique index application_participant_actor_role on public.application_participants(application_id,actor_id,participant_type) where actor_id is not null;
create table public.application_coverages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  site_id uuid not null,
  application_applicant_id uuid,
  applicant_type_key text not null references public.applicant_types(key),
  product_key text not null,
  association_entity_id uuid,
  selection_key text not null default '',
  amount numeric check(amount is null or amount>=0),
  selections jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(application_id,site_id) references public.applications(id,site_id),
  foreign key(site_id,product_key) references public.site_products(site_id,product_key),
  foreign key(application_applicant_id,application_id) references public.application_applicants(id,application_id),
  foreign key(application_id,association_entity_id) references public.application_associations(application_id,association_entity_id),
  unique nulls not distinct(application_id,application_applicant_id,applicant_type_key,product_key,selection_key),
  unique(id,application_id,product_key)
);
alter table public.product_riders add constraint product_rider_identity unique(id,product_key,rider_key);
create table public.application_riders (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  application_coverage_id uuid not null,
  product_key text not null,
  product_rider_id text not null,
  rider_key text not null,
  amount numeric check(amount is null or amount>=0),
  selections jsonb not null default '{}',
  created_at timestamptz not null default now(),
  foreign key(application_coverage_id,application_id,product_key) references public.application_coverages(id,application_id,product_key),
  foreign key(product_rider_id,product_key,rider_key) references public.product_riders(id,product_key,rider_key),
  unique(application_coverage_id,rider_key)
);
create table public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id),
  application_applicant_id uuid,
  field_key text not null references public.fields(key),
  occurrence_key text not null default '',
  value_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(application_applicant_id,application_id) references public.application_applicants(id,application_id),
  unique nulls not distinct(application_id,application_applicant_id,field_key,occurrence_key)
);
create table public.application_snapshots (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  site_id uuid not null,
  site_key text not null,
  association_entity_id uuid references public.association_entities(id),
  configuration_release_id uuid not null,
  version integer not null check(version>0),
  configuration_snapshot jsonb not null check(jsonb_typeof(configuration_snapshot)='object'),
  answers_snapshot jsonb not null check(jsonb_typeof(answers_snapshot)='array'),
  coverages_snapshot jsonb not null check(jsonb_typeof(coverages_snapshot)='array'),
  participants_snapshot jsonb not null check(jsonb_typeof(participants_snapshot)='array'),
  association_snapshot jsonb not null check(jsonb_typeof(association_snapshot)='object'),
  payload_hash text not null,
  captured_by uuid not null references public.portal_actors(id),
  captured_at timestamptz not null default now(),
  foreign key(application_id,site_id) references public.applications(id,site_id),
  foreign key(site_id,site_key) references public.sites(id,key),
  foreign key(application_id,association_entity_id) references public.application_associations(application_id,association_entity_id),
  foreign key(configuration_release_id) references public.portal_library_releases(id),
  foreign key(configuration_release_id,site_key) references public.portal_library_releases(id,site_key),
  unique(application_id,version)
);
create function public.guard_operational_selection_write() returns trigger language plpgsql as $$
declare parent_id uuid; submitted timestamptz;
begin
  if TG_OP='DELETE' then parent_id:=old.application_id; else parent_id:=new.application_id; end if;
  select submitted_at into submitted from public.applications where id=parent_id for update;
  if submitted is not null then raise exception 'Submitted selections and answers retain their original values' using errcode='23514'; end if;
  if TG_OP='DELETE' then return old; end if;
  return new;
end $$;
create trigger application_coverages_history before insert or update or delete on public.application_coverages for each row execute function public.guard_operational_selection_write();
create trigger application_riders_history before insert or update or delete on public.application_riders for each row execute function public.guard_operational_selection_write();
create trigger application_answers_history before insert or update or delete on public.application_answers for each row execute function public.guard_operational_selection_write();
create trigger application_snapshots_immutable before update or delete on public.application_snapshots for each row execute function public.guard_published_configuration_history();

create function public.portal_capture_application_snapshot(p_application_id uuid,p_release_id uuid,p_actor_id uuid) returns uuid language plpgsql as $$
declare app public.applications; release public.portal_library_releases; selected public.application_associations;
  result uuid; answer_rows jsonb; coverage_rows jsonb; participant_rows jsonb; association_row jsonb;
begin
  select * into strict app from public.applications where id=p_application_id for update;
  select * into strict release from public.portal_library_releases where id=p_release_id;
  if release.site_key<>(select key from public.sites where id=app.site_id) then raise exception 'Configuration release belongs to another Site' using errcode='23514'; end if;
  select * into selected from public.application_associations where application_id=app.id;
  if selected.association_entity_id is null then raise exception 'Application Association context must be resolved before capturing submission' using errcode='23514'; end if;
  select coalesce(jsonb_agg(to_jsonb(a) order by a.id),'[]') into answer_rows from public.application_answers a where a.application_id=app.id;
  select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('riders',(select coalesce(jsonb_agg(to_jsonb(r) order by r.id),'[]') from public.application_riders r where r.application_coverage_id=c.id)) order by c.id),'[]') into coverage_rows from public.application_coverages c where c.application_id=app.id;
  select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]') into participant_rows from public.application_participants p where p.application_id=app.id;
  select to_jsonb(e) into association_row from public.association_entities e where e.id=selected.association_entity_id;
  insert into public.application_snapshots(application_id,site_id,site_key,association_entity_id,configuration_release_id,version,configuration_snapshot,answers_snapshot,coverages_snapshot,participants_snapshot,association_snapshot,payload_hash,captured_by)
    values(app.id,app.site_id,release.site_key,selected.association_entity_id,release.id,
      (select coalesce(max(version),0)+1 from public.application_snapshots where application_id=app.id),release.payload,answer_rows,coverage_rows,participant_rows,association_row,
      encode(sha256(convert_to(jsonb_build_array(release.payload,answer_rows,coverage_rows,participant_rows,association_row)::text,'UTF8')),'hex'),p_actor_id) returning id into result;
  return result;
end $$;
revoke all on function public.portal_capture_application_snapshot(uuid,uuid,uuid) from public,anon,authenticated;

alter table public.portal_actors enable row level security;
alter table public.application_coverages enable row level security;
alter table public.application_riders enable row level security;
alter table public.application_answers enable row level security;
alter table public.application_snapshots enable row level security;
create index application_coverages_application_idx on public.application_coverages(application_id);
create index application_coverages_applicant_idx on public.application_coverages(application_applicant_id);
create index application_riders_coverage_idx on public.application_riders(application_coverage_id);
create index application_answers_field_idx on public.application_answers(field_key);
create index application_snapshots_release_idx on public.application_snapshots(configuration_release_id);
create index audit_events_actor_idx on public.audit_events(actor_id);
create index application_events_actor_idx on public.application_events(actor_id);
commit;

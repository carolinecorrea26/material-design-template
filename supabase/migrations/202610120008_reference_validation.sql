begin;
-- Polymorphic targets use a declared type and a validated primary-key object.
-- Historical external identities remain explicit, rather than fabricated rows.
create table public.portal_reference_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  table_name text unique,
  validation_kind text not null check(validation_kind in ('table','historical-external')),
  check((validation_kind='table')=(table_name is not null))
);
create table public.portal_entity_references (
  id uuid primary key default gen_random_uuid(),
  reference_type_id uuid not null references public.portal_reference_types(id),
  identity jsonb not null check(jsonb_typeof(identity)='object' and identity<>'{}'),
  resolution_state text not null check(resolution_state in ('current','historical')),
  record_snapshot jsonb not null check(jsonb_typeof(record_snapshot)='object'),
  created_at timestamptz not null default now(),
  unique(reference_type_id,identity)
);
alter table public.portal_reference_types enable row level security;
alter table public.portal_entity_references enable row level security;
insert into public.portal_reference_types(key,table_name,validation_kind)
  select c.relname,c.relname,'table' from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r' and c.relname not in ('portal_reference_types','portal_entity_references');
create function public.check_registered_entity_reference() returns trigger language plpgsql as $$
declare target public.portal_reference_types; keys text[]; supplied text[]; matches bigint; snapshot jsonb;
begin
  select * into strict target from public.portal_reference_types where id=new.reference_type_id;
  if target.validation_kind='historical-external' then
    if new.resolution_state<>'historical' or new.record_snapshot='{}' then raise exception 'External history requires an original snapshot' using errcode='23514'; end if;
    return new;
  end if;
  select array_agg(a.attname::text order by a.attname) into keys from pg_index i
    join pg_attribute a on a.attrelid=i.indrelid and a.attnum=any(i.indkey)
    where i.indrelid=to_regclass('public.'||quote_ident(target.table_name)) and i.indisprimary;
  select array_agg(k order by k) into supplied from jsonb_object_keys(new.identity) k;
  if keys is null or supplied is distinct from keys then raise exception 'Reference must contain exactly the target primary-key columns' using errcode='23514'; end if;
  execute format('select count(*),min(to_jsonb(t)::text)::jsonb from public.%I t where to_jsonb(t) @> $1',target.table_name) into matches,snapshot using new.identity;
  if new.resolution_state='current' then
    if matches<>1 then raise exception 'Registered entity target does not exist' using errcode='23503'; end if;
    new.record_snapshot:=snapshot;
  elsif new.record_snapshot='{}' then raise exception 'Historical target requires its original snapshot' using errcode='23514';
  end if;
  return new;
end $$;
create trigger portal_entity_reference_guard before insert on public.portal_entity_references for each row execute function public.check_registered_entity_reference();
create trigger portal_entity_reference_immutable before update or delete on public.portal_entity_references for each row execute function public.guard_published_configuration_history();
create function public.guard_registered_identity() returns trigger language plpgsql as $$
declare type_id uuid; identity_value jsonb; new_identity jsonb;
begin
  select id into type_id from public.portal_reference_types where table_name=TG_TABLE_NAME;
  if not exists(select from public.portal_entity_references where reference_type_id=type_id and resolution_state='current') then
    if TG_OP='DELETE' then return old; else return new; end if;
  end if;
  select jsonb_object_agg(a.attname,to_jsonb(old)->a.attname),
    jsonb_object_agg(a.attname,case when TG_OP='UPDATE' then to_jsonb(new)->a.attname else null end)
    into identity_value,new_identity from pg_index i join pg_attribute a on a.attrelid=i.indrelid and a.attnum=any(i.indkey)
    where i.indrelid=TG_RELID and i.indisprimary;
  if TG_OP='UPDATE' and new_identity=identity_value and (to_jsonb(new)->>'key') is not distinct from (to_jsonb(old)->>'key') then return new; end if;
  if exists(select from public.portal_entity_references where reference_type_id=type_id and identity=identity_value and resolution_state='current') then
    raise exception 'Referenced entity identity must be retained; archive it instead' using errcode='23503';
  end if;
  if TG_OP='DELETE' then return old; else return new; end if;
end $$;
do $$ declare item record; begin
  for item in select table_name from public.portal_reference_types where validation_kind='table' loop
    execute format('create trigger portal_registered_identity before update or delete on public.%I for each row execute function public.guard_registered_identity()',item.table_name);
  end loop;
end $$;

alter table public.audit_events add column entity_reference_id uuid references public.portal_entity_references(id);
alter table public.change_items add column entity_reference_id uuid references public.portal_entity_references(id);
create function public.portal_history_reference(entity_type text,entity_id text,snapshot jsonb) returns uuid language plpgsql as $$
declare target_key text; type_id uuid; target_id uuid; identity_value jsonb; record_value jsonb; count_value bigint;
begin
  target_key:=case entity_type when 'application' then 'applications' when 'site' then 'sites'
    when 'change_request' then 'change_requests' when 'release' then 'releases' when 'site_builder_draft' then 'site_builder_drafts' else entity_type end;
  select id into type_id from public.portal_reference_types where key=target_key and table_name is not null;
  identity_value:=jsonb_build_object('id',entity_id);
  if type_id is not null then
    execute format('select count(*),min(to_jsonb(t)::text)::jsonb from public.%I t where to_jsonb(t) @> $1',target_key) into count_value,record_value using identity_value;
  end if;
  if type_id is null or count_value<>1 then
    insert into public.portal_reference_types(key,validation_kind) values('legacy.'||entity_type,'historical-external')
      on conflict(key) do update set key=excluded.key returning id into type_id;
    record_value:=jsonb_build_object('entityType',entity_type,'entityId',entity_id,'original',snapshot);
    count_value:=0;
  end if;
  select id into target_id from public.portal_entity_references where reference_type_id=type_id and identity=identity_value;
  if found then return target_id; end if;
  insert into public.portal_entity_references(reference_type_id,identity,resolution_state,record_snapshot)
    values(type_id,identity_value,case when count_value=1 then 'current' else 'historical' end,record_value)
    returning id into target_id;
  return target_id;
end $$;
update public.audit_events set entity_reference_id=public.portal_history_reference(entity_type,entity_id::text,jsonb_build_object('old',old_value_json,'new',new_value_json));
update public.change_items set entity_reference_id=public.portal_history_reference(entity_type,coalesce(entity_id,id::text),jsonb_build_object('old',current_value_json,'new',proposed_value_json));
alter table public.audit_events alter column entity_reference_id set not null;
alter table public.change_items alter column entity_reference_id set not null;
create function public.fill_history_entity_reference() returns trigger language plpgsql as $$
begin
  if new.entity_reference_id is null then
    if TG_TABLE_NAME='audit_events' then new.entity_reference_id:=public.portal_history_reference(new.entity_type,new.entity_id::text,jsonb_build_object('old',new.old_value_json,'new',new.new_value_json));
    else new.entity_reference_id:=public.portal_history_reference(new.entity_type,coalesce(new.entity_id,new.id::text),jsonb_build_object('old',new.current_value_json,'new',new.proposed_value_json)); end if;
  end if;
  return new;
end $$;
create trigger audit_entity_reference before insert on public.audit_events for each row execute function public.fill_history_entity_reference();
create trigger change_item_entity_reference before insert on public.change_items for each row execute function public.fill_history_entity_reference();

-- Scope targets are constrained by type; legacy unresolved values are preserved.
alter table public.user_scopes add column reference_state text not null default 'legacy' check(reference_state in ('legacy','resolved'));
alter table public.user_scopes add column target_reference_id uuid references public.portal_entity_references(id);
create function public.validate_user_scope_target() returns trigger language plpgsql as $$
declare valid boolean;
begin
  valid:=case new.scope_type
    when 'global' then new.scope_id is null
    when 'organization' then exists(select from public.organizations where id=new.scope_id)
    when 'client' then exists(select from public.association_entities where id=new.scope_id and kind='hosting')
    when 'site' then exists(select from public.sites where id=new.scope_id)
    when 'advisor' then exists(select from public.users where id=new.scope_id)
    else false end;
  if not valid then raise exception 'Scope target does not match its declared type' using errcode='23514'; end if;
  new.reference_state:='resolved';
  if new.scope_type='global' then new.target_reference_id:=null;
  else new.target_reference_id:=public.portal_history_reference(case new.scope_type when 'client' then 'association_entities' when 'organization' then 'organizations' when 'advisor' then 'users' else 'sites' end,new.scope_id::text,'{}'); end if;
  return new;
end $$;
update public.user_scopes u set reference_state='resolved' where
  (scope_type='global' and scope_id is null) or (scope_type='organization' and exists(select from public.organizations where id=u.scope_id))
  or (scope_type='client' and exists(select from public.association_entities where id=u.scope_id and kind='hosting'))
  or (scope_type='site' and exists(select from public.sites where id=u.scope_id))
  or (scope_type='advisor' and exists(select from public.users where id=u.scope_id));
with duplicate as (select id,row_number() over(partition by user_id,scope_type,scope_id order by id) as position from public.user_scopes where reference_state='resolved')
  update public.user_scopes u set reference_state='legacy' from duplicate d where u.id=d.id and d.position>1;
update public.user_scopes set target_reference_id=public.portal_history_reference(case scope_type when 'client' then 'association_entities' when 'organization' then 'organizations' when 'advisor' then 'users' else 'sites' end,scope_id::text,'{}') where reference_state='resolved' and scope_type<>'global';
create unique index user_scopes_resolved_identity on public.user_scopes(user_id,scope_type,scope_id) nulls not distinct where reference_state='resolved';
create trigger user_scope_target before insert or update on public.user_scopes for each row execute function public.validate_user_scope_target();
comment on column public.user_scopes.scope_type is 'client is a retained wire alias for hosting Association scope; it is not a business Client entity.';

-- Explicit JSON key relationships are validated; expressions and archived source
-- evidence remain distinct contracts, not fabricated foreign keys.
create function public.portal_validate_catalog_json(value jsonb) returns void language plpgsql as $$
declare item record; target text; found_key boolean;
begin
  if jsonb_typeof(value)='array' then
    for item in select v from jsonb_array_elements(value) v loop perform public.portal_validate_catalog_json(item.v); end loop;
  elsif jsonb_typeof(value)='object' then
    for item in select * from jsonb_each(value) loop
      target:=case item.key when 'productKey' then 'products' when 'fieldKey' then 'fields' when 'pageKey' then 'pages'
        when 'riderKey' then 'riders' when 'associationKey' then 'associations' when 'fixedAssociationId' then 'associations'
        when 'clientKey' then 'clients' when 'siteKey' then 'sites' when 'ruleKey' then 'rules' when 'conditionKey' then 'conditions' when 'flowKey' then 'flows' end;
      if target is not null and jsonb_typeof(item.value)='string' then
        execute format('select exists(select from public.%I where key=$1)',target) into found_key using item.value#>>'{}';
        if not found_key then raise exception 'JSON reference %.% does not exist',target,item.value using errcode='23503'; end if;
        execute format('select public.portal_history_reference(%L,id::text,jsonb_build_object(''referenceKey'',key)) from public.%I where key=$1',target,target) using item.value#>>'{}';
      end if;
      perform public.portal_validate_catalog_json(item.value);
    end loop;
  end if;
end $$;
create function public.validate_catalog_json_row() returns trigger language plpgsql as $$
begin
  perform public.portal_validate_catalog_json(to_jsonb(new)->TG_ARGV[0]);
  return new;
end $$;
do $$ declare item record; begin
  for item in select * from (values
    ('configuration_definitions','definition'),('configuration_values','value'),('fields','definition'),('site_policies','definition'),
    ('pages','definition'),('flows','definition'),('flow_steps','definition'),('flow_transitions','definition')
  ) v(table_name,column_name) loop
    execute format('create constraint trigger portal_json_reference after insert or update on public.%I deferrable initially deferred for each row execute function public.validate_catalog_json_row(%L)',item.table_name,item.column_name);
  end loop;
end $$;
do $$ declare item record; value jsonb; begin
  for item in select * from (values
    ('configuration_definitions','definition'),('configuration_values','value'),('fields','definition'),('site_policies','definition'),
    ('pages','definition'),('flows','definition'),('flow_steps','definition'),('flow_transitions','definition')
  ) v(table_name,column_name) loop
    for value in execute format('select %I from public.%I',item.column_name,item.table_name) loop
      perform public.portal_validate_catalog_json(value);
    end loop;
  end loop;
end $$;
create function public.check_flag_value_contract() returns trigger language plpgsql as $$
declare definition public.flag_definitions; expected_type text;
begin
  select * into strict definition from public.flag_definitions where key=new.flag_key;
  expected_type:=case definition.value_type when 'enum' then 'string' else definition.value_type end;
  if jsonb_typeof(new.value) is distinct from expected_type then raise exception 'Flag value does not match its declared type' using errcode='23514'; end if;
  if definition.value_type='enum' and not exists(select from public.flag_values where flag_key=new.flag_key and value=new.value#>>'{}')
    and not coalesce(definition.allowed_values ? (new.value#>>'{}'),false) then
    raise exception 'Flag enum value is outside its vocabulary' using errcode='23514';
  end if;
  if new.application_id is not null and definition.persistence<>'application-record' then
    raise exception 'Application value requires an application-record flag' using errcode='23514';
  end if;
  return new;
end $$;
create trigger flag_value_contract before insert or update on public.flag_assignments for each row execute function public.check_flag_value_contract();
create unique index flag_assignment_target_identity on public.flag_assignments(flag_key,client_key,site_key,product_key,coverage_key,rider_key,applicant_key,application_id) nulls not distinct;
create unique index product_coverage_plan_identity on public.product_coverage_plans(product_key,plan_key,applicant_type_key);

-- A snapshot must exist before a new submission timestamp is recorded.
create function public.check_application_submission_history() returns trigger language plpgsql as $$
begin
  if new.submitted_at is not null and (TG_OP='INSERT' or old.submitted_at is null) and not exists(select from public.application_snapshots where application_id=new.id) then
    raise exception 'Capture the original configuration and answers before submission' using errcode='23514';
  end if;
  return new;
end $$;
create trigger application_submission_snapshot before insert or update of submitted_at on public.applications for each row execute function public.check_application_submission_history();
create index portal_entity_reference_type_idx on public.portal_entity_references(reference_type_id);
create index audit_events_reference_idx on public.audit_events(entity_reference_id);
create index change_items_reference_idx on public.change_items(entity_reference_id);
commit;

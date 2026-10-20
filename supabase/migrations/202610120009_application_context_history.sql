begin;
alter table public.application_associations alter column association_key drop not null;
alter table public.application_associations add constraint application_association_identity_required
  check(association_key is not null or association_entity_id is not null);
create or replace function public.resolve_application_association_reference() returns trigger language plpgsql as $$
declare actual uuid;
begin
  if new.association_key is null then actual:=new.association_entity_id;
  else select association_id into actual from public.association_aliases where source_table='associations' and source_key=new.association_key; end if;
  if actual is null then raise exception 'Association context has not been reconciled' using errcode='23514'; end if;
  if new.association_entity_id is null then new.association_entity_id:=actual; end if;
  if new.association_entity_id<>actual or not exists(select from public.site_association_contexts where site_id=new.site_id and association_id=actual and enabled) then
    raise exception 'Association is not enabled for this Application Site' using errcode='23514';
  end if;
  return new;
end $$;
create function public.set_automatic_application_context() returns trigger language plpgsql as $$
declare context record;
begin
  if new.record_origin='legacy-import' then return new; end if;
  select c.*,s.key as site_key,l.association_key into context from public.site_association_contexts c
    join public.sites s on s.id=c.site_id left join public.site_associations l on l.id=c.source_link_id
    where c.site_id=new.site_id and c.context_mode='automatic' and c.enabled;
  if found then
    insert into public.application_associations(application_id,site_id,site_key,association_key,association_entity_id)
      values(new.id,new.site_id,context.site_key,context.association_key,context.association_id);
  end if;
  return new;
end $$;
alter table public.applications add column record_origin text not null default 'native' check(record_origin in ('native','legacy-import')),
  add column import_reference text;
update public.applications set record_origin='legacy-import',import_reference='preserved-existing-application:'||id::text;
alter table public.applications add constraint applications_import_evidence check(record_origin<>'legacy-import' or coalesce(length(btrim(import_reference)),0)>0);
create or replace function public.resolve_application_product_reference() returns trigger language plpgsql as $$
begin
  if TG_OP='INSERT' or new.product_key is distinct from old.product_key then
    if exists(select from public.products where key=new.product_key) then new.product_catalog_key:=new.product_key;
    elsif new.product_catalog_key is null and new.record_origin<>'legacy-import' then
      raise exception 'New applications require a catalog product key' using errcode='23514';
    end if;
  end if;
  if new.product_catalog_key is not null and not exists(select from public.site_products where site_id=new.site_id and product_key=new.product_catalog_key) then
    raise exception 'Application product is not assigned to its Site' using errcode='23514';
  end if;
  return new;
end $$;
alter table public.applications add constraint application_site_product_reference foreign key(site_id,product_catalog_key) references public.site_products(site_id,product_key);
create trigger application_automatic_context after insert on public.applications for each row execute function public.set_automatic_application_context();
create unique index site_automatic_context on public.site_association_contexts(site_id) where context_mode='automatic' and enabled;
create or replace function public.check_application_submission_history() returns trigger language plpgsql as $$
begin
  if new.submitted_at is not null and (TG_OP='INSERT' or old.submitted_at is null) and new.record_origin<>'legacy-import'
    and not exists(select from public.application_snapshots where application_id=new.id) then
    raise exception 'Capture the original configuration and answers before submission' using errcode='23514';
  end if;
  return new;
end $$;
alter table public.application_events add column from_owner_actor_id uuid references public.portal_actors(id),
  add column to_owner_actor_id uuid references public.portal_actors(id);

create function public.validate_rider_application_scope() returns trigger language plpgsql as $$
declare assignment public.product_riders; site public.sites; owner_key text;
begin
  select * into strict assignment from public.product_riders where id=new.product_rider_id;
  select s.* into strict site from public.application_coverages c join public.sites s on s.id=c.site_id where c.id=new.application_coverage_id;
  select key into owner_key from public.clients where id=site.client_id;
  if (assignment.scope='site' and assignment.site_key<>site.key) or (assignment.scope='client' and assignment.client_key<>owner_key) then
    raise exception 'Rider assignment belongs to another Association or Site' using errcode='23514';
  end if;
  return new;
end $$;
create trigger application_rider_scope before insert or update on public.application_riders for each row execute function public.validate_rider_application_scope();

create function public.populate_application_snapshot() returns trigger language plpgsql as $$
declare app public.applications; release public.portal_library_releases; selected public.application_associations;
begin
  select * into strict app from public.applications where id=new.application_id for update;
  select * into strict release from public.portal_library_releases where id=new.configuration_release_id;
  if release.site_key<>(select key from public.sites where id=app.site_id) then raise exception 'Snapshot release belongs to another Site' using errcode='23514'; end if;
  select * into strict selected from public.application_associations where application_id=app.id;
  if selected.association_entity_id is null then raise exception 'Snapshot Association context is unresolved' using errcode='23514'; end if;
  new.site_id:=app.site_id; new.site_key:=release.site_key; new.association_entity_id:=selected.association_entity_id;
  new.configuration_snapshot:=release.payload;
  select coalesce(jsonb_agg(to_jsonb(a) order by a.id),'[]') into new.answers_snapshot from public.application_answers a where a.application_id=app.id;
  select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('riders',(select coalesce(jsonb_agg(to_jsonb(r) order by r.id),'[]') from public.application_riders r where r.application_coverage_id=c.id)) order by c.id),'[]') into new.coverages_snapshot from public.application_coverages c where c.application_id=app.id;
  select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]') into new.participants_snapshot from public.application_participants p where p.application_id=app.id;
  select to_jsonb(e) into new.association_snapshot from public.association_entities e where e.id=selected.association_entity_id;
  new.payload_hash:=encode(sha256(convert_to(jsonb_build_array(new.configuration_snapshot,new.answers_snapshot,new.coverages_snapshot,new.participants_snapshot,new.association_snapshot)::text,'UTF8')),'hex');
  return new;
end $$;
create trigger application_snapshot_truth before insert on public.application_snapshots for each row execute function public.populate_application_snapshot();
create trigger audit_history_immutable before update or delete on public.audit_events for each row execute function public.guard_published_configuration_history();
create trigger application_events_history_immutable before update or delete on public.application_events for each row execute function public.guard_published_configuration_history();
alter table public.user_scopes drop constraint user_scopes_scope_type_check;
alter table public.user_scopes add constraint user_scopes_scope_type_check check(scope_type in ('global','organization','client','association','site','advisor'));
create or replace function public.validate_user_scope_target() returns trigger language plpgsql as $$
declare valid boolean; target text;
begin
  valid:=case new.scope_type when 'global' then new.scope_id is null
    when 'organization' then exists(select from public.organizations where id=new.scope_id)
    when 'client' then exists(select from public.clients where id=new.scope_id)
    when 'association' then exists(select from public.association_entities where id=new.scope_id)
    when 'site' then exists(select from public.sites where id=new.scope_id)
    when 'advisor' then exists(select from public.users where id=new.scope_id) else false end;
  if not valid then raise exception 'Scope target does not match its declared type' using errcode='23514'; end if;
  new.reference_state:='resolved';
  if new.scope_type='global' then new.target_reference_id:=null;
  else
    target:=case new.scope_type when 'client' then 'association_entities' when 'association' then 'association_entities' when 'organization' then 'organizations' when 'advisor' then 'users' else 'sites' end;
    new.target_reference_id:=public.portal_history_reference(target,new.scope_id::text,'{}');
  end if;
  return new;
end $$;
create function public.guard_site_operational_tenancy() returns trigger language plpgsql as $$
begin
  if new.client_id is distinct from old.client_id and exists(select from public.applications where site_id=old.id) then
    raise exception 'Site operational history retains its Association ownership' using errcode='23514';
  end if;
  return new;
end $$;
create trigger sites_operational_tenant before update of client_id on public.sites for each row execute function public.guard_site_operational_tenancy();
comment on column public.applicants.client_id is 'Hosting Association tenancy retained under a legacy wire name; selected membership Association belongs to the Application context.';
commit;

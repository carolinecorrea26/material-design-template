-- Canonical TPA > Association > Site identities. Legacy tables remain explicit
-- compatibility records; single-Association profiles do not become user choices.
begin;
create table public.association_entities (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  organization_id uuid not null references public.organizations(id),
  name text not null,
  kind text not null check(kind in ('hosting','member')),
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(id,organization_id)
);
create table public.association_aliases (
  id uuid primary key default gen_random_uuid(),
  source_table text not null check(source_table in ('clients','associations')),
  source_id text not null,
  source_key text not null,
  association_id uuid references public.association_entities(id),
  state text not null check(state in ('resolved','source-only')),
  original_record jsonb not null check(jsonb_typeof(original_record)='object'),
  created_at timestamptz not null default now(),
  unique(source_table,source_id),
  unique(source_table,source_key),
  check((state='resolved')=(association_id is not null))
);
create table public.association_affiliations (
  id uuid primary key default gen_random_uuid(),
  hosting_association_id uuid not null,
  member_association_id uuid not null,
  organization_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key(hosting_association_id,organization_id) references public.association_entities(id,organization_id),
  foreign key(member_association_id,organization_id) references public.association_entities(id,organization_id),
  unique(hosting_association_id,member_association_id),
  check(hosting_association_id<>member_association_id)
);
create table public.site_association_contexts (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  association_id uuid not null references public.association_entities(id),
  source_link_id text unique references public.site_associations(id),
  context_mode text not null check(context_mode in ('automatic','membership','url')),
  enabled boolean not null,
  created_at timestamptz not null default now(),
  unique(site_id,association_id)
);
alter table public.association_entities enable row level security;
alter table public.association_aliases enable row level security;
alter table public.association_affiliations enable row level security;
alter table public.site_association_contexts enable row level security;

create function public.portal_refresh_association_identities() returns void language plpgsql as $$
declare legacy record; selected_id uuid; fixed_key text; multiple_context boolean; member_id uuid; mode text;
begin
  perform pg_advisory_xact_lock(20261012,4);
  -- Hosting identities preserve the existing deployed UUID and ownership.
  insert into public.association_entities(id,key,organization_id,name,kind,status,created_at,updated_at)
    select id,key,organization_id,name,'hosting',status,created_at,updated_at from public.clients
    on conflict(id) do update set organization_id=excluded.organization_id,name=excluded.name,status=excluded.status,updated_at=excluded.updated_at;
  insert into public.association_aliases(source_table,source_id,source_key,association_id,state,original_record)
    select 'clients',id::text,key,id,'resolved',to_jsonb(c) from public.clients c
    on conflict(source_table,source_id) do nothing;
  update public.site_association_contexts ctx set enabled=false
    from public.sites s join public.site_policies p on p.site_key=s.key
    where ctx.site_id=s.id and ctx.context_mode='automatic' and
      (p.definition->'associationSelection'->>'mode' in ('select','url-parameter') or
       (ctx.source_link_id is null and p.definition->'associationSelection'->>'mode' is not null));
  -- Lower rows are not promoted just because imported names resemble an owner.
  for legacy in select a.*,c.id as hosting_id,c.organization_id,c.key as hosting_key
    from public.associations a join public.clients c on c.key=a.client_key loop
    selected_id:=null;
    select count(distinct p.definition->'associationSelection'->>'fixedAssociationId')=1,
      min(p.definition->'associationSelection'->>'fixedAssociationId')
      into multiple_context,fixed_key
      from public.sites s join public.site_policies p on p.site_key=s.key
      where s.client_id=legacy.hosting_id and p.definition->'associationSelection'->>'mode'='fixed';
    if multiple_context and fixed_key=legacy.key and not exists(
      select from public.sites s join public.site_policies p on p.site_key=s.key
      where s.client_id=legacy.hosting_id and p.definition->'associationSelection'->>'mode' in ('select','url-parameter')) then
      selected_id:=legacy.hosting_id;
    elsif exists(select from public.site_associations link join public.site_policies p on p.site_key=link.site_key
      where link.association_key=legacy.key and p.definition->'associationSelection'->>'mode' in ('fixed','select','url-parameter')) then
      member_id:=md5('portal-association-member:'||legacy.key)::uuid;
      insert into public.association_entities(id,key,organization_id,name,kind,status)
        values(member_id,'member.'||legacy.key,legacy.organization_id,coalesce(legacy.definition->>'name',legacy.key),'member','active')
        on conflict(id) do nothing;
      insert into public.association_affiliations(hosting_association_id,member_association_id,organization_id)
        values(legacy.hosting_id,member_id,legacy.organization_id) on conflict(hosting_association_id,member_association_id) do nothing;
      selected_id:=member_id;
    end if;
    insert into public.association_aliases(source_table,source_id,source_key,association_id,state,original_record)
      values('associations',legacy.id,legacy.key,selected_id,case when selected_id is null then 'source-only' else 'resolved' end,
        (to_jsonb(legacy)-'hosting_id'-'organization_id'-'hosting_key'))
      on conflict(source_table,source_id) do update set association_id=excluded.association_id,state=excluded.state;
  end loop;
  for legacy in select l.*,s.id as site_id,s.client_id,p.definition->'associationSelection' as policy
    from public.site_associations l join public.sites s on s.key=l.site_key
    join public.site_policies p on p.site_key=l.site_key loop
    mode:=case legacy.policy->>'mode' when 'fixed' then 'automatic' when 'select' then 'membership' when 'url-parameter' then 'url' end;
    select association_id into selected_id from public.association_aliases where source_table='associations' and source_key=legacy.association_key;
    if mode is not null and selected_id is not null then
      insert into public.site_association_contexts(site_id,association_id,source_link_id,context_mode,enabled)
        values(legacy.site_id,selected_id,legacy.id,mode,legacy.enabled)
        on conflict(site_id,association_id) do update set source_link_id=coalesce(public.site_association_contexts.source_link_id,excluded.source_link_id),enabled=excluded.enabled,context_mode=excluded.context_mode;
    end if;
  end loop;
  insert into public.site_association_contexts(site_id,association_id,context_mode,enabled)
    select s.id,s.client_id,'automatic',true from public.sites s left join public.site_policies p on p.site_key=s.key
    where p.definition->'associationSelection'->>'mode' is null
    on conflict(site_id,association_id) do nothing;
end $$;
select public.portal_refresh_association_identities();

alter table public.sites add column hosting_association_id uuid references public.association_entities(id);
update public.sites set hosting_association_id=client_id;
alter table public.sites alter column hosting_association_id set not null;
alter table public.sites add constraint sites_hosting_compatibility check(hosting_association_id=client_id);
alter table public.clients add constraint clients_canonical_identity
  foreign key(id,organization_id) references public.association_entities(id,organization_id) deferrable initially deferred;

create function public.sync_hosting_association_identity() returns trigger language plpgsql as $$
begin
  insert into public.association_entities(id,key,organization_id,name,kind,status,created_at,updated_at)
    values(new.id,new.key,new.organization_id,new.name,'hosting',new.status,new.created_at,new.updated_at)
    on conflict(id) do update set organization_id=excluded.organization_id,name=excluded.name,status=excluded.status,updated_at=excluded.updated_at;
  return new;
end $$;
create trigger clients_hosting_identity before insert or update on public.clients for each row execute function public.sync_hosting_association_identity();
create function public.fill_site_hosting_identity() returns trigger language plpgsql as $$
begin
  if TG_OP='INSERT' and new.hosting_association_id is null then new.hosting_association_id:=new.client_id; end if;
  if TG_OP='UPDATE' and new.client_id is distinct from old.client_id and new.hosting_association_id=old.hosting_association_id then new.hosting_association_id:=new.client_id; end if;
  return new;
end $$;
create trigger sites_hosting_identity before insert or update on public.sites for each row execute function public.fill_site_hosting_identity();

create function public.check_canonical_site_context() returns trigger language plpgsql as $$
declare hosting_id uuid; canonical_owner uuid; site_owner uuid;
begin
  select s.hosting_association_id,e.organization_id into hosting_id,site_owner from public.sites s join public.association_entities e on e.id=s.hosting_association_id where s.id=new.site_id for key share of s,e;
  select organization_id into canonical_owner from public.association_entities where id=new.association_id for key share;
  if site_owner is distinct from canonical_owner then raise exception 'Association context crosses TPA ownership' using errcode='23514'; end if;
  if new.association_id<>hosting_id and not exists(select from public.association_affiliations where hosting_association_id=hosting_id and member_association_id=new.association_id) then
    raise exception 'Association is not affiliated with this Site owner' using errcode='23514';
  end if;
  if new.context_mode<>'automatic' and new.association_id=hosting_id then
    raise exception 'Single Association context does not create a membership choice' using errcode='23514';
  end if;
  return new;
end $$;
create trigger site_association_context_guard before insert or update on public.site_association_contexts for each row execute function public.check_canonical_site_context();
create function public.refresh_association_contexts_after_write() returns trigger language plpgsql as $$
begin perform public.portal_refresh_association_identities(); return new; end $$;
create trigger sites_refresh_identity after insert on public.sites for each statement execute function public.refresh_association_contexts_after_write();
create trigger associations_refresh_identity after insert on public.associations for each statement execute function public.refresh_association_contexts_after_write();
create trigger site_associations_refresh_identity after insert or update on public.site_associations for each statement execute function public.refresh_association_contexts_after_write();
create trigger site_policies_refresh_identity after insert or update on public.site_policies for each statement execute function public.refresh_association_contexts_after_write();
comment on table public.association_aliases is 'Source identities and original records retained without name-based merges. Source-only records are not selectable.';
comment on table public.site_association_contexts is 'Automatic singleton context or enabled multi-Association offerings. Automatic context has no membership selector.';
create index association_entities_organization_idx on public.association_entities(organization_id);
create index association_aliases_entity_idx on public.association_aliases(association_id);
create index association_affiliations_member_idx on public.association_affiliations(member_association_id);
create index site_association_contexts_association_idx on public.site_association_contexts(association_id);
commit;

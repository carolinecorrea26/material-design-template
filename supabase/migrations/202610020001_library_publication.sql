-- Publication is a server boundary: no browser-supplied readiness flags or actor IDs.
create extension if not exists pgcrypto;
create table public.portal_admin_accounts (
  user_id uuid primary key references auth.users(id),
  username text not null unique check (username = 'caroline'),
  active boolean not null default true
);
create table public.portal_library_drafts (
  id uuid primary key default gen_random_uuid(),
  site_key text not null references public.sites(key),
  owner_id uuid not null references auth.users(id),
  edit_version integer not null default 1,
  base_release_id uuid,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  payload_hash text not null,
  updated_at timestamptz not null default now()
);
create table public.portal_library_releases (
  id uuid primary key default gen_random_uuid(),
  site_key text not null references public.sites(key),
  version integer not null,
  draft_id uuid not null references public.portal_library_drafts(id),
  payload jsonb not null,
  payload_hash text not null,
  published_by uuid not null references auth.users(id),
  published_at timestamptz not null default now(),
  unique(site_key, version)
);
create table public.portal_library_heads (
  site_key text primary key references public.sites(key),
  release_id uuid references public.portal_library_releases(id),
  generation integer not null default 0
);
alter table public.portal_library_drafts add constraint portal_draft_base_release foreign key (base_release_id) references public.portal_library_releases(id);
create table public.portal_library_readiness (
  site_key text not null references public.sites(key),
  payload_hash text not null,
  domain text not null check (domain in ('migration','parity','rates','payments','analytics','submission','admin-recovery')),
  result text not null check (result in ('passed','approved-unavailable')),
  evidence_reference text not null check (length(trim(evidence_reference)) > 0),
  verified_at timestamptz not null default now(),
  valid_until timestamptz not null,
  primary key(site_key, payload_hash, domain),
  check (valid_until > verified_at),
  check (result = 'passed' or domain = 'rates')
);
create table public.portal_library_publication_audit (
  id uuid primary key default gen_random_uuid(),
  site_key text not null references public.sites(key),
  action text not null check (action in ('save-draft','publish','rollback')),
  actor_id uuid not null references auth.users(id),
  draft_id uuid references public.portal_library_drafts(id),
  previous_release_id uuid references public.portal_library_releases(id),
  release_id uuid references public.portal_library_releases(id),
  occurred_at timestamptz not null default now()
);

alter table public.portal_admin_accounts enable row level security;
alter table public.portal_library_drafts enable row level security;
alter table public.portal_library_releases enable row level security;
alter table public.portal_library_heads enable row level security;
alter table public.portal_library_readiness enable row level security;
alter table public.portal_library_publication_audit enable row level security;
revoke all on public.portal_admin_accounts, public.portal_library_drafts, public.portal_library_releases, public.portal_library_heads, public.portal_library_readiness, public.portal_library_publication_audit from anon, authenticated;
-- Authenticated users cannot create readiness evidence. Only the trusted validation service may write it.
grant all on public.portal_admin_accounts, public.portal_library_readiness to service_role;

create function public.portal_require_admin() returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or coalesce(auth.jwt()->>'aal','') <> 'aal2' or not exists(select 1 from public.portal_admin_accounts a where a.user_id = actor and a.active) then
    raise exception 'Active admin with TOTP verification required' using errcode = '42501';
  end if;
  return actor;
end $$;
revoke all on function public.portal_require_admin() from public, anon, authenticated;

create function public.portal_admin_identity() returns text
language sql stable security definer set search_path = '' as $$
  select username from public.portal_admin_accounts where user_id = auth.uid() and active;
$$;
revoke all on function public.portal_admin_identity() from public, anon;
grant execute on function public.portal_admin_identity() to authenticated;

create function public.portal_save_library_draft(p_site_key text, p_payload jsonb, p_draft_id uuid default null, p_expected_version integer default 0) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.portal_require_admin(); d public.portal_library_drafts; base uuid; hash text;
begin
  if jsonb_typeof(p_payload) <> 'object' or p_payload->>'siteKey' is distinct from p_site_key or p_payload->>'formatVersion' is distinct from '1' or jsonb_typeof(p_payload->'data') is distinct from 'object' then raise exception 'Invalid Library draft'; end if;
  hash := encode(public.digest(p_payload::text, 'sha256'), 'hex');
  insert into public.portal_library_heads(site_key) values(p_site_key) on conflict do nothing;
  select release_id into base from public.portal_library_heads where site_key = p_site_key for update;
  if p_draft_id is null then
    if p_expected_version <> 0 then raise exception 'Draft version conflict'; end if;
    insert into public.portal_library_drafts(site_key, owner_id, base_release_id, payload, payload_hash) values(p_site_key, actor, base, p_payload, hash) returning * into d;
  else
    select * into d from public.portal_library_drafts where id = p_draft_id for update;
    if not found or d.owner_id <> actor or d.site_key <> p_site_key then raise exception 'Unavailable draft'; end if;
    if d.edit_version <> p_expected_version then raise exception 'Draft version conflict'; end if;
    update public.portal_library_drafts set payload = p_payload, payload_hash = hash, edit_version = edit_version + 1, updated_at = now() where id = d.id returning * into d;
  end if;
  insert into public.portal_library_publication_audit(site_key,action,actor_id,draft_id) values(p_site_key,'save-draft',actor,d.id);
  return to_jsonb(d);
end $$;

create function public.portal_check_readiness(p_site_key text, p_hash text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(distinct domain) from public.portal_library_readiness where site_key = p_site_key and payload_hash = p_hash and valid_until > now() and (result = 'passed' or domain = 'rates' and result = 'approved-unavailable')) <> 7 then raise exception 'Publication readiness evidence is incomplete, expired or for another revision'; end if;
end $$;
revoke all on function public.portal_check_readiness(text,text) from public, anon, authenticated;

create function public.portal_publish_library_draft(p_draft_id uuid, p_expected_version integer, p_expected_release_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.portal_require_admin(); d public.portal_library_drafts; h public.portal_library_heads; r public.portal_library_releases;
begin
  -- Lock Site head before draft, matching save-draft lock order.
  select * into d from public.portal_library_drafts where id = p_draft_id;
  if not found or d.owner_id <> actor then raise exception 'Unavailable draft'; end if;
  select * into h from public.portal_library_heads where site_key = d.site_key for update;
  select * into d from public.portal_library_drafts where id = p_draft_id for update;
  if d.edit_version <> p_expected_version or h.release_id is distinct from p_expected_release_id or d.base_release_id is distinct from h.release_id then raise exception 'Publication revision conflict'; end if;
  perform public.portal_check_readiness(d.site_key,d.payload_hash);
  insert into public.portal_library_releases(site_key,version,draft_id,payload,payload_hash,published_by) values(d.site_key,h.generation+1,d.id,d.payload,d.payload_hash,actor) returning * into r;
  update public.portal_library_heads set release_id = r.id, generation = h.generation+1 where site_key = d.site_key;
  insert into public.portal_library_publication_audit(site_key,action,actor_id,draft_id,previous_release_id,release_id) values(d.site_key,'publish',actor,d.id,h.release_id,r.id);
  return to_jsonb(r);
end $$;

create function public.portal_rollback_library(p_site_key text, p_release_id uuid, p_expected_release_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.portal_require_admin(); h public.portal_library_heads; r public.portal_library_releases;
begin
  select * into h from public.portal_library_heads where site_key = p_site_key for update;
  if not found or h.release_id is distinct from p_expected_release_id then raise exception 'Rollback revision conflict'; end if;
  select * into r from public.portal_library_releases where id = p_release_id and site_key = p_site_key;
  if not found then raise exception 'Unavailable release'; end if;
  perform public.portal_check_readiness(p_site_key,r.payload_hash);
  update public.portal_library_heads set release_id = r.id where site_key = p_site_key;
  insert into public.portal_library_publication_audit(site_key,action,actor_id,previous_release_id,release_id) values(p_site_key,'rollback',actor,h.release_id,r.id);
  return to_jsonb(r);
end $$;

create function public.portal_read_published_library(p_site_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('releaseId',r.id,'version',r.version,'payloadHash',r.payload_hash,'payload',r.payload) from public.portal_library_heads h join public.portal_library_releases r on r.id = h.release_id where h.site_key = p_site_key;
$$;
revoke all on function public.portal_save_library_draft(text,jsonb,uuid,integer), public.portal_publish_library_draft(uuid,integer,uuid), public.portal_rollback_library(text,uuid,uuid), public.portal_read_published_library(text) from public;
grant execute on function public.portal_save_library_draft(text,jsonb,uuid,integer), public.portal_publish_library_draft(uuid,integer,uuid), public.portal_rollback_library(text,uuid,uuid) to authenticated;
grant execute on function public.portal_read_published_library(text) to anon, authenticated;

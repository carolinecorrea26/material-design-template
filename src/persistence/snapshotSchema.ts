import { normalizedSnapshotTables } from "./snapshot";
import { tableNames } from "./tableNames";

/** Additive read function. No grants on tables, new RLS policies or publication writes. */
export function snapshotSchemaSql() {
  const names = [...new Set(normalizedSnapshotTables.map(table => tableNames[table]))].sort();
  return `-- Step 2: a single MVCC snapshot for normalized Library/Site reads.
-- STABLE uses the calling statement's snapshot for every SELECT.
-- SECURITY INVOKER preserves the caller's table privileges and RLS.
create function public.portal_read_snapshot(requested_tables text[])
returns jsonb language plpgsql stable security invoker
set search_path = pg_catalog
set row_security = on
as $$
declare
  allowed_tables constant text[] := array[${names.map(name => `'${name}'`).join(", ")}];
  table_name text;
  table_rows jsonb;
  payload jsonb := '{}'::jsonb;
begin
  if requested_tables is null or cardinality(requested_tables) = 0
    or array_position(requested_tables, null) is not null
    or cardinality(requested_tables) <> (select count(distinct name) from unnest(requested_tables) name)
    or not requested_tables <@ allowed_tables then
    raise exception 'Invalid normalized snapshot table request' using errcode = '22023';
  end if;
  for table_name in select name from unnest(requested_tables) name order by name collate "C" loop
    if table_name = 'flag_assignments' then
      execute 'select coalesce(jsonb_agg(to_jsonb(t) order by t.id::text collate "C"), ''[]''::jsonb) from public.flag_assignments t where application_id is null' into table_rows;
    else
      execute format('select coalesce(jsonb_agg(to_jsonb(t) order by t.id::text collate "C"), ''[]''::jsonb) from public.%I t', table_name) into table_rows;
    end if;
    payload := payload || jsonb_build_object(table_name, table_rows);
  end loop;
  return jsonb_build_object(
    'formatVersion', 1,
    'consistency', 'single-read',
    'revision', 'postgres:v1:sha256:' || encode(sha256(convert_to(payload::text, 'UTF8')), 'hex'),
    'data', payload
  );
end;
$$;
revoke all on function public.portal_read_snapshot(text[]) from public, anon;
grant execute on function public.portal_read_snapshot(text[]) to authenticated;
-- Hosted Supabase has service_role; the isolated PostgreSQL review database may not.
do $$ begin
  if exists (select from pg_roles where rolname = 'service_role') then
    grant execute on function public.portal_read_snapshot(text[]) to service_role;
  end if;
end $$;
`;
}

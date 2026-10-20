/** Keep the latest SQL read boundary identical to the TypeScript contract. */
import { createServer } from 'vite';
import { writeFileSync } from 'node:fs';
const server = await createServer({ configFile:false, server:{middlewareMode:true,hmr:false,ws:false}, optimizeDeps:{noDiscovery:true,include:[]}, appType:'custom' });
try {
  const { snapshotSchemaSql } = await server.ssrLoadModule('/src/persistence/snapshotSchema.ts');
  const { normalizedSnapshotTables } = await server.ssrLoadModule('/src/persistence/snapshot.ts');
  const allowed = [...new Set(normalizedSnapshotTables)].map(name => `'${name}'`).sort().join(',');
  const boundary = `
create or replace function public.check_publication_data_boundary() returns trigger language plpgsql as $$
declare item record; row_value jsonb;
begin
  if jsonb_typeof(new.payload) is distinct from 'object' or new.payload->>'siteKey' is distinct from new.site_key
    or new.payload->>'formatVersion' is distinct from '1' or jsonb_typeof(new.payload->'data') is distinct from 'object' then
    raise exception 'Invalid publication payload envelope' using errcode='23514';
  end if;
  for item in select * from jsonb_each(new.payload->'data') loop
    if not item.key=any(array[${allowed}]) or jsonb_typeof(item.value) is distinct from 'array' then
      raise exception 'Operational or unknown data cannot enter a configuration release: %',item.key using errcode='23514';
    end if;
    for row_value in select value from jsonb_array_elements(item.value) loop
      if jsonb_typeof(row_value) is distinct from 'object' or coalesce(row_value->>'id','')='' then
        raise exception 'Invalid configuration row in %',item.key using errcode='23514';
      end if;
      if item.key='flagAssignments' and row_value->>'applicationId' is not null then
        raise exception 'Application flags cannot enter a configuration release' using errcode='23514';
      end if;
    end loop;
  end loop;
  return new;
end $$;
`;
  writeFileSync('supabase/migrations/202610120006_configuration_boundary.sql','-- Generated from the configuration snapshot contract.\n'+snapshotSchemaSql().replace('create function public.portal_read_snapshot','create or replace function public.portal_read_snapshot')+boundary);
} finally { await server.close(); }

import { readFileSync } from 'node:fs';

/** Exercise the upgrade against old persisted rows, with every scenario rolled back. */
export function verifyPageCatalogUpgrade(sql) {
  const migration = readFileSync('supabase/migrations/202610090001_page_catalog_contract.sql', 'utf8');
  const entries = [...migration.matchAll(/\('([^']+)', (\d+), (\d+)\)/g)];
  if (entries.length !== 30) throw new Error('Legacy page fixture is incomplete');
  const oldOrder = `case page_key ${entries.map(([, key, old]) => `when '${key}' then ${old}`).join(' ')} else position end`;
  const reset = `update public.pages set definition = definition - 'flow';
    update public.pages set position = ${oldOrder.replace('page_key', 'key')};
    update public.site_pages set position = ${oldOrder};`;
  const assert = (condition, label) => `do $$ begin if not (${condition}) then raise exception '${label}'; end if; end $$;`;
  const run = (setup, checks) => sql(`begin; ${reset} ${setup} ${migration} ${checks} rollback;`);
  run("update public.pages set definition = jsonb_set(definition, '{path}', '\"/custom-review\"') where key = 'review'; update public.site_pages set requirement = 'none' where site_key = 'asce' and page_key = 'contact';", [
    assert("(select position = 6 and definition->>'flow' = 'application' from public.pages where key = 'profile')", 'Global legacy order was not converted'),
    assert("(select position = 14 from public.site_pages where site_key = 'asce' and page_key = 'docusign')", 'Site legacy order was not converted'),
    assert("(select definition->>'path' = '/custom-review' from public.pages where key = 'review')", 'Custom route changed'),
    assert("(select requirement = 'none' from public.site_pages where site_key = 'asce' and page_key = 'contact')", 'Availability changed'),
    assert("not exists(select from public.pages where definition->>'flow' is distinct from case when definition->>'type' = 'internal' then 'internal' when definition->>'type' = 'resume' then 'resume' when key in ('advisor-login','advisor-send-confirmation','application-edit-confirmation') then 'advisor' else 'application' end)", 'Incorrect flow assignment'),
  ].join('\n'));
  run("update public.site_pages set position = 100 where site_key = 'asce' and page_key = 'membership'; update public.pages set position = 100 where key = 'membership';", [
    assert("(select position = 100 from public.pages where key = 'membership') and (select position = 29 from public.pages where key = 'profile')", 'Custom global order changed'),
    assert("(select position = 100 from public.site_pages where site_key = 'asce' and page_key = 'membership') and (select position = 29 from public.site_pages where site_key = 'asce' and page_key = 'profile')", 'Custom Site order changed'),
    assert("(select position = 6 from public.site_pages where site_key = 'ama' and page_key = 'profile')", 'Untouched Site order was not converted'),
  ].join('\n'));
  // Already-authored flow/order must survive even when its numeric order is legacy-like.
  run("update public.pages set definition = definition || '{\"flow\":\"application\"}' where key = 'profile';", assert("(select position = 29 from public.pages where key = 'profile') and (select position = 29 from public.site_pages where site_key = 'asce' and page_key = 'profile')", 'Authored metadata was reordered'));
  return { legacyOrder: true, customRoutes: true, customOrder: true, availability: true, flowLabels: true, authoredMetadata: true };
}

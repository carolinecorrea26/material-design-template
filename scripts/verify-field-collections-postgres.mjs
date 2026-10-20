import { readFileSync } from 'node:fs';

export function verifyFieldCollectionUpgrade(sql) {
  const migration = readFileSync('supabase/migrations/202610090002_field_collections.sql', 'utf8');
  const assert = (condition, label) => `do $$ begin if not (${condition}) then raise exception '${label}'; end if; end $$;`;
  sql(`begin;
    delete from public.configuration_values where configuration_key = 'field-collections';
    delete from public.configuration_definitions where key = 'field-collections';
    delete from public.fields where key like 'di-company-%';
    ${migration}
    ${assert("(select count(*) = 4 from public.fields where key like 'di-company-%')", 'Missing saved collection fields')}
    ${assert("(select value->'children'->>'storageName' = 'children' and value->'selfDisabilityCompanies'->>'storageName' = 'selfDisabilityCompanies' from public.configuration_values where key = 'global.field-collections')", 'Missing saved bindings')}
    update public.fields set definition = jsonb_set(definition, '{label}', '"Saved carrier"') where key = 'di-company-name';
    update public.configuration_values set value = jsonb_set(value, '{children,label}', '"Saved dependent"') where key = 'global.field-collections';
    ${migration}
    ${assert("(select definition->>'label' = 'Saved carrier' from public.fields where key = 'di-company-name')", 'Existing field edit was replaced')}
    ${assert("(select value->'children'->>'label' = 'Saved dependent' from public.configuration_values where key = 'global.field-collections')", 'Existing collection edit was replaced')}
    rollback;`);
  return { legacyUpgrade: true, savedDefinitions: true, bindings: true, preservesAuthoredValues: true };
}

import { readFileSync } from 'node:fs';

export function verifyFieldSurfaceUpgrade(sql) {
  const migration = readFileSync('supabase/migrations/202610090003_field_surfaces.sql', 'utf8');
  const assert = (condition, label) => `do $$ begin if not (${condition}) then raise exception '${label}'; end if; end $$;`;
  sql(`begin;
    delete from public.configuration_values where configuration_key = 'field-surfaces';
    delete from public.configuration_definitions where key = 'field-surfaces';
    delete from public.fields where key like 'health-%-detail-%' or key = 'beneficiary-firstName';
    ${migration}
    ${assert("(select value->'healthSiDetails'->>'maxItems' = '10' and value->'beneficiaryIndividual'->'fields'->0->>'valueKey' = 'firstName' from public.configuration_values where key = 'global.field-surfaces')", 'Missing saved surface bindings and limits')}
    update public.fields set definition = jsonb_set(definition, '{label}', '"Authored name"') where key = 'beneficiary-firstName';
    update public.configuration_values set value = jsonb_set(value, '{healthSiDetails,maxItems}', '2') where key = 'global.field-surfaces';
    ${migration}
    ${assert("(select definition->>'label' = 'Authored name' from public.fields where key = 'beneficiary-firstName')", 'Authored surface field was replaced')}
    ${assert("(select value->'healthSiDetails'->>'maxItems' = '2' from public.configuration_values where key = 'global.field-surfaces')", 'Authored surface policy was replaced')}
    rollback;`);
  return { legacyUpgrade: true, savedDefinitions: true, bindingsAndLimits: true, preservesAuthoredValues: true };
}

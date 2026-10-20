/** Bootstrap only source-defined fields referenced by additive SQL defaults. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const directory=process.env.SCHEMA_EXPORT_DIR ?? '/tmp/portal-schema-final';
const database=JSON.parse(readFileSync(`${directory}/database.json`,'utf8'));
const fields=new Map(database.fields.map(row=>[row.key,row]));
const keys=new Set();
const pageKeys=new Set();
for(const file of readdirSync('supabase/migrations').filter(file=>file.endsWith('.sql') && file<'202610120007')) {
  for(const match of readFileSync(`supabase/migrations/${file}`,'utf8').matchAll(/"fieldKey"\s*:\s*"([^"]+)"/g)) keys.add(match[1]);
  for(const match of readFileSync(`supabase/migrations/${file}`,'utf8').matchAll(/"pageKey"\s*:\s*"([^"]+)"/g)) pageKeys.add(match[1]);
}
const quote=value=>`'${String(value).replaceAll("'","''")}'`;
const statements=['-- Existing authored fields are retained. Definitions come from the current registered field catalog.','begin;'];
for(const key of [...pageKeys].sort()) {
  const page=database.pages.find(page=>page.key===key); if(!page) throw Error(`SQL default references an undefined page: ${key}`);
  statements.push(`insert into public.pages(id,key,position,definition,display_id,provided_by,source_reference) values (${quote(page.id)},${quote(page.key)},${page.position},${quote(JSON.stringify(page.definition))}::jsonb,${page.displayId},${page.providedBy == null ? 'null' : quote(page.providedBy)},${quote(page.sourceReference ?? 'Registered page dependency')}) on conflict(key) do nothing;`);
}
for(const key of [...keys].sort()) {
  const field=fields.get(key); if(!field) throw Error(`SQL default references an undefined field: ${key}`);
  statements.push(`insert into public.fields(id,key,position,definition,display_id,provided_by,source_reference) values (${quote(field.id)},${quote(field.key)},${field.position},${quote(JSON.stringify(field.definition))}::jsonb,${field.displayId},${field.providedBy == null ? 'null' : quote(field.providedBy)},${quote(field.sourceReference ?? 'Registered field dependency')}) on conflict(key) do nothing;`);
}
statements.push('commit;');
writeFileSync('supabase/migrations/202610120007_field_reference_bootstrap.sql',statements.join('\n')+'\n');
console.log(`Bootstrapped ${keys.size} registered field and ${pageKeys.size} page dependencies.`);

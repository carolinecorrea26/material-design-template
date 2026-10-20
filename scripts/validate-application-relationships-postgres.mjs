import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { verifyApplicationRelationships } from './verify-application-relationships-postgres.mjs';

const docker = process.env.PORTAL_REVIEW_DOCKER ?? 'docker';
const database = `portal_relationship_review_${process.pid}`;
function sql(input, target = database) {
  const result = spawnSync(docker, ['exec', '-i', 'portal-migration-review', 'psql', '-U', 'postgres', '-d', target, '-v', 'ON_ERROR_STOP=1', '-qAt'], { input, encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr);
  return result.stdout;
}
sql(`create database ${database};`, 'postgres');
try {
  for (const file of ['202609240001_initial_portal_schema.sql', '202609240003_portal_library.sql']) {
    sql(readFileSync(`supabase/migrations/${file}`, 'utf8'));
  }
  // An existing operational row must survive this additive upgrade.
  sql(`insert into public.organizations(key,name,type) values ('upgrade-tpa','TPA','tpa');
    insert into public.clients(organization_id,key,name,acronym) select id,'upgrade-client','Client','C' from public.organizations where key='upgrade-tpa';
    insert into public.sites(client_id,key,name,display_name,template_type,legacy_client_id) select id,'upgrade-site','Site','Site','multi','test' from public.clients where key='upgrade-client';
    insert into public.applications(application_number,site_id,product_key,status,current_action_owner_type)
      select 'UPGRADE-EXISTING',id,'test','In Progress','Applicant' from public.sites where key='upgrade-site';`);
  sql(readFileSync('supabase/migrations/202610120002_application_relationships.sql', 'utf8'));
  if (sql("select count(*) from public.applications where application_number='UPGRADE-EXISTING';").trim() !== '1') throw new Error('Existing application was changed by the upgrade');
  console.log(JSON.stringify({ existingApplicationPreserved: true, ...verifyApplicationRelationships(sql) }, null, 2));
} finally {
  sql(`drop database ${database};`, 'postgres');
}

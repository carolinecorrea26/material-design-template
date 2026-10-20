/** Full migration-chain schema checks in named disposable databases only. */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { verifyAsceStorage } from './verify-asce-storage-postgres.mjs';
const container = 'portal-migration-review';
const directory = resolve(process.env.SCHEMA_EXPORT_DIR ?? mkdtempSync(join(tmpdir(),'portal-schema-review-')));
const resultDirectory = 'docs/schema-validation';
const files = readdirSync('supabase/migrations').filter(file => file.endsWith('.sql')).sort();
const boundary = '202610120003_relationship_integrity.sql';
const reports = [];
let dictionary;
function sql(database, input) {
  const result = spawnSync('docker', ['exec','-i',container,'psql','-U','postgres','-d',database,'-v','ON_ERROR_STOP=1','-qAt'], { input, encoding:'utf8', maxBuffer:64*1024*1024 });
  if (result.error || result.status !== 0) throw Error([result.stderr,result.error?.message].filter(Boolean).join('\n'));
  return result.stdout.trim();
}
function bootstrap(database) {
  sql('postgres',`create database ${database};`);
  sql(database,`do $$ begin
    if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
    if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
    if not exists(select from pg_roles where rolname='service_role') then create role service_role; end if;
    end $$;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true)) $$;`);
}
function verify(database) {
  const checks = [];
  sql(database,`insert into public.analytics_metrics(metric_key,name,unit,source) values('ownership-test','Ownership test','count','schema test');`);
  const reject = (name, statement) => {
    try { sql(database,`begin; ${statement}; set constraints all immediate; rollback;`); }
    catch(error) { if (/violates|not assigned|invalidat|disagree|immutable|cannot enter|Invalid publication/i.test(error.message)) { checks.push(name); return; } throw error; }
    throw Error(`Invalid write accepted: ${name}`);
  };
  reject('unknown Site product',`insert into public.site_products(site_id,product_key) select id,'schema-missing-product' from public.sites where key='ama'`);
  reject('unknown coverage product',`insert into public.site_coverages(site_id,coverage_key) select id,'schema-missing-product' from public.sites where key='ama'`);
  reject('unknown rider',`insert into public.site_riders(site_id,rider_key) select id,'schema-missing-rider' from public.sites where key='ama'`);
  reject('unknown migration Association',`insert into public.migration_schedules(id,client_key,milestones) values('bad','missing-association','{}')`);
  reject('Site reassignment with linked Associations',`update public.sites set client_id=(select id from public.clients where key='waepa') where key='ama'`);
  reject('Association reassignment with linked Sites',`update public.associations set client_key='waepa' where key='american-medical-association'`);
  reject('cross-owner analytics',`insert into public.analytics_measurements(metric_key,period_start,period_end,period_type,site_id,client_id,value,source_report,source_system,definition_version)
    select 'ownership-test','2026-01-01','2026-01-31','month',s.id,c.id,1,'test','test','1' from public.sites s,public.clients c where s.key='ama' and c.key='waepa'`);
  reject('cross-owner pattern context',`insert into public.pattern_assignments(id,key,pattern_key,site_key,client_key,configuration,display_id) select 'schema-bad','schema-bad',key,'ama','waepa','{}',900000000000001 from public.patterns limit 1`);
  const actor='90000000-0000-4000-8000-000000000001';
  sql(database,`insert into auth.users(id) values('${actor}');`);
  // Existing tests use auth stubs; these checks validate schema, not real authentication.
  sql(database,`insert into public.portal_library_drafts(site_key,owner_id,payload,payload_hash) values('ama','${actor}','{"formatVersion":1,"siteKey":"ama","data":{}}','schema-test');`);
  reject('cross-Site publication draft',`insert into public.portal_library_releases(site_key,version,draft_id,payload,payload_hash,published_by)
    select 'waepa',1,id,'{"formatVersion":1,"siteKey":"waepa","data":{}}','schema-test','${actor}' from public.portal_library_drafts where payload_hash='schema-test'`);
  reject('operational data in configuration payload',`insert into public.portal_library_drafts(site_key,owner_id,payload,payload_hash) values('ama','${actor}','{"formatVersion":1,"siteKey":"ama","data":{"applicants":[]}}','bad')`);
  return checks;
}
try {
  // Always generate the current reviewed seed. An old /tmp export is not evidence
  // that today's contracts and migrations work together.
  const exported=spawnSync('npx',['vitest','run','src/migration/reviewedExport.test.ts'],{
    env:{...process.env,MIGRATION_EXPORT_DIR:directory},encoding:'utf8',maxBuffer:64*1024*1024,
  });
  if (exported.error || exported.status!==0) throw Error(exported.error?.message ?? `${exported.stdout}\n${exported.stderr}`);
  for (const mode of ['fresh','upgrade']) {
    const database=`portal_schema_${mode}_${process.pid}`;
    bootstrap(database);
    try {
      const applied = [];
      for (const file of files.filter(file => mode==='fresh' || file<boundary)) { sql(database,readFileSync(`supabase/migrations/${file}`,'utf8')); applied.push(file); }
      sql(database,readFileSync(`${directory}/${mode==='upgrade' ? 'seed-legacy.sql' : 'seed.sql'}`,'utf8'));
      if (mode==='upgrade') {
        sql(database,`insert into public.applications(application_number,site_id,product_key,status,current_action_owner_type) select 'LEGACY-PRESERVED',id,'Unknown historical product','In Progress','Applicant' from public.sites where key='ama';`);
        for (const file of files.filter(file => file>=boundary)) { sql(database,readFileSync(`supabase/migrations/${file}`,'utf8')); applied.push(file); }
        if (sql(database,"select count(*) from public.applications where application_number='LEGACY-PRESERVED'")!=='1') throw Error('Upgrade removed existing application');
      }
      const snapshot="select public.portal_read_snapshot(array['sites','association_entities','association_aliases','site_association_contexts','site_products','products','fields','configuration_values'])";
      const before=sql(database,snapshot);
      sql(database,readFileSync(`${directory}/seed.sql`,'utf8'));
      if (before!==sql(database,snapshot)) throw Error('Repeat seed changed the persisted configuration snapshot');
      const checks=verify(database);
      const asce=verifyAsceStorage(input => sql(database,input));
      const constraintCount=Number(sql(database,"select count(*) from pg_constraint where connamespace='public'::regnamespace"));
      const tableCount=Number(sql(database,"select count(*) from pg_class where relnamespace='public'::regnamespace and relkind='r'"));
      const invalid=JSON.parse(sql(database,"select coalesce(jsonb_agg(jsonb_build_object('table',conrelid::regclass::text,'constraint',conname)),'[]') from pg_constraint where connamespace='public'::regnamespace and not convalidated"));
      if (invalid.length) throw Error('Unvalidated schema constraints remain');
      if (mode==='fresh') dictionary=JSON.parse(sql(database,`select jsonb_agg(jsonb_build_object(
        'table',c.relname,'rls',c.relrowsecurity,
        'columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),
          'nullable',not a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) order by a.attnum)
          from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
          where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
        'constraints',(select coalesce(jsonb_agg(jsonb_build_object('name',x.conname,'type',x.contype,
          'definition',pg_get_constraintdef(x.oid),'validated',x.convalidated) order by x.conname),'[]')
          from pg_constraint x where x.conrelid=c.oid)) order by c.relname)
        from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='r'`));
      reports.push({mode,migrations:applied,checks,asce,tableCount,constraintCount,repeatSeedStable:true,unvalidatedConstraints:invalid,existingApplicationPreserved:mode==='upgrade',auth:'local stubs; hosted authentication untested'});
      console.log(JSON.stringify(reports.at(-1),null,2));
    } finally { sql('postgres',`drop database ${database};`); }
  }
  mkdirSync(resultDirectory,{recursive:true});
  writeFileSync(`${resultDirectory}/postgres.json`,JSON.stringify({validatedAt:new Date().toISOString(),seedDirectory:directory,reports},null,2)+'\n');
  writeFileSync(`${resultDirectory}/table-dictionary.json`,JSON.stringify(dictionary,null,2)+'\n');
} catch(error) { console.error(error); process.exitCode=1; }

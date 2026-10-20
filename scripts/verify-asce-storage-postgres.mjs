/** Exercises real ASCE relationships in the caller's disposable PostgreSQL database. */
export function verifyAsceStorage(sql) {
  const checks = [];
  const expect = (name, statement, expected = 't') => {
    if (sql(statement).trim() !== expected) throw Error(`ASCE storage check failed: ${name}`);
    checks.push(name);
  };
  const reject = (name, statement) => {
    try { sql(`begin; ${statement}; set constraints all immediate; rollback;`); }
    catch (error) {
      if (/violates|not assigned|retain|immutable|before submission|another|does not match|unavailable|disabled/i.test(error.message)) {
        checks.push(name); return;
      }
      throw error;
    }
    throw Error(`ASCE storage accepted invalid write: ${name}`);
  };
  sql(`
    insert into public.portal_actors(key,kind,display_name) values('asce-storage-test','system','ASCE storage test');
    insert into public.applications(application_number,site_id,product_key,status,current_action_owner_type)
      select 'ASCE-STORAGE-1',id,'li-term','In Progress','Applicant' from public.sites where key='asce';
    insert into public.applications(application_number,site_id,product_key,status,current_action_owner_type)
      select 'ASCE-STORAGE-2',id,'li-term','In Progress','Applicant' from public.sites where key='asce';
    insert into public.applicants(client_id,display_name) select id,'Synthetic ASCE member' from public.clients where key='asce';
    insert into public.application_applicants(application_id,site_id,client_id,applicant_id,applicant_type_key)
      select a.id,a.site_id,s.client_id,p.id,'member' from public.applications a join public.sites s on s.id=a.site_id
      join public.applicants p on p.client_id=s.client_id where a.application_number='ASCE-STORAGE-1' and p.display_name='Synthetic ASCE member';
    insert into public.application_coverages(application_id,site_id,application_applicant_id,applicant_type_key,product_key,association_entity_id,amount)
      select a.id,a.site_id,p.id,'member','li-term',c.association_entity_id,100000 from public.applications a
      join public.application_applicants p on p.application_id=a.id join public.application_associations c on c.application_id=a.id
      where a.application_number='ASCE-STORAGE-1';
    insert into public.application_riders(application_id,application_coverage_id,product_key,product_rider_id,rider_key,amount)
      select c.application_id,c.id,c.product_key,r.id,r.rider_key,50000 from public.application_coverages c
      join public.product_riders r on r.product_key=c.product_key and r.client_key='asce'
      join public.applications a on a.id=c.application_id where a.application_number='ASCE-STORAGE-1';
    insert into public.application_answers(application_id,application_applicant_id,field_key,value_json)
      select application_id,id,'membership','"synthetic-member"' from public.application_applicants
      where application_id=(select id from public.applications where application_number='ASCE-STORAGE-1');
    insert into public.portal_library_drafts(site_key,owner_id,payload,payload_hash)
      values('asce','90000000-0000-4000-8000-000000000001','{"formatVersion":1,"siteKey":"asce","data":{}}','asce-storage-test');
    insert into public.portal_library_releases(site_key,version,draft_id,payload,payload_hash,published_by)
      select site_key,1,id,payload,payload_hash,owner_id from public.portal_library_drafts where payload_hash='asce-storage-test';
  `);
  expect('ASCE automatic Association context', `select count(*)=1 and bool_and(c.association_entity_id=s.hosting_association_id)
    from public.application_associations c join public.applications a on a.id=c.application_id join public.sites s on s.id=a.site_id
    where a.application_number='ASCE-STORAGE-1'`);
  expect('ASCE product catalog reference', `select product_catalog_key='li-term' from public.applications where application_number='ASCE-STORAGE-1'`);
  expect('ASCE person, coverage and rider persisted', `select (select count(*) from public.application_coverages)=1 and (select count(*) from public.application_riders)=1`);
  reject('disabled ASCE product rejected', `insert into public.application_coverages(application_id,site_id,applicant_type_key,product_key)
    select id,site_id,'member','li-15yr' from public.applications where application_number='ASCE-STORAGE-2'`);
  reject('person role mismatch rejected', `update public.application_coverages set applicant_type_key='spouse'`);
  reject('other Association rider rejected', `update public.application_riders set product_rider_id=(select id from public.product_riders where client_key='abe' and product_key='li-term' limit 1),
    rider_key=(select rider_key from public.product_riders where client_key='abe' and product_key='li-term' limit 1)`);
  reject('cross-application person rejected', `update public.application_answers set application_id=(select id from public.applications where application_number='ASCE-STORAGE-2')`);
  reject('unknown field rejected', `update public.application_answers set field_key='asce-storage-missing-field'`);
  reject('submission without captured history rejected', `update public.applications set submitted_at=now() where application_number='ASCE-STORAGE-2'`);
  sql(`select public.portal_capture_application_snapshot(
    (select id from public.applications where application_number='ASCE-STORAGE-1'),
    (select id from public.portal_library_releases where payload_hash='asce-storage-test'),
    (select id from public.portal_actors where key='asce-storage-test'));`);
  expect('snapshot contains exact answers and rider', `select jsonb_array_length(answers_snapshot)=1 and jsonb_array_length(coverages_snapshot)=1
    and jsonb_array_length(coverages_snapshot->0->'riders')=1 and length(payload_hash)=64 from public.application_snapshots`);
  sql(`update public.application_answers set value_json='"updated-before-submission"';`);
  reject('stale answer snapshot rejected', `update public.applications set submitted_at=now() where application_number='ASCE-STORAGE-1'`);
  sql(`select public.portal_capture_application_snapshot(
    (select id from public.applications where application_number='ASCE-STORAGE-1'),
    (select id from public.portal_library_releases where payload_hash='asce-storage-test'),
    (select id from public.portal_actors where key='asce-storage-test'));`);
  expect('recapture preserves original and current versions', `select count(*)=2 and count(distinct payload_hash)=2 from public.application_snapshots`);
  sql(`update public.applications set submitted_at=now(),status='Pending TPA Review' where application_number='ASCE-STORAGE-1';`);
  reject('submitted answers immutable', `update public.application_answers set value_json='"changed"'`);
  reject('submitted coverage immutable', `delete from public.application_coverages`);
  reject('submitted riders immutable', `update public.application_riders set amount=100000`);
  reject('submitted answer cannot move to draft', `update public.application_answers set application_id=(select id from public.applications where application_number='ASCE-STORAGE-2'),application_applicant_id=null`);
  reject('submitted timestamp cannot be cleared', `update public.applications set submitted_at=null where application_number='ASCE-STORAGE-1'`);
  reject('submitted import origin immutable', `update public.applications set record_origin='legacy-import',import_reference='bypass' where application_number='ASCE-STORAGE-1'`);
  reject('submitted person role immutable', `update public.application_applicants set applicant_type_key='spouse'`);
  reject('submitted Association context immutable', `delete from public.application_associations where application_id=(select id from public.applications where application_number='ASCE-STORAGE-1')`);
  reject('submission snapshot immutable', `update public.application_snapshots set payload_hash='changed'`);
  for (const table of ['applicants','application_applicants','application_associations','application_answers','application_coverages','application_riders','application_snapshots','portal_actors']) {
    expect(`${table} anonymous rows hidden`, `begin; grant select on public.${table} to anon; set local role anon; select count(*)=0 from public.${table}; rollback;`);
  }
  return { site: 'asce', checks, scope: 'disposable PostgreSQL; synthetic application and configuration release' };
}

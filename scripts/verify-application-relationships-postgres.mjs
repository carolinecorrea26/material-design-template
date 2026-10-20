/** Run only against a disposable PostgreSQL review database. */
export function verifyApplicationRelationships(sql) {
  const id = n => `'00000000-0000-4000-8000-${String(n).padStart(12, '0')}'`;
  const fixture = `
    insert into public.organizations(id,key,name,type) values (${id(1)},'relationship-tpa','TPA','tpa');
    insert into public.clients(id,organization_id,key,name,acronym) values
      (${id(2)},${id(1)},'relationship-client','Client','C'),
      (${id(3)},${id(1)},'relationship-other','Other','O');
    insert into public.sites(id,client_id,key,name,display_name,template_type,legacy_client_id) values
      (${id(4)},${id(2)},'relationship-site','Site','Site','multi','test'),
      (${id(5)},${id(3)},'relationship-other-site','Other','Other','multi','test');
    insert into public.applications(id,application_number,site_id,product_key,status,current_action_owner_type) values
      (${id(6)},'REL-TEST-1',${id(4)},'test','In Progress','Applicant'),
      (${id(7)},'REL-TEST-2',${id(4)},'test','In Progress','Applicant');
    insert into public.applicant_types(id,key,definition) values ('relationship-member','relationship-member','{}');
    insert into public.associations(id,key,client_key,definition) values
      ('relationship-association','relationship-association','relationship-client','{}');
    insert into public.site_associations(id,key,site_key,association_key,enabled) values
      ('relationship-site-association','relationship-site-association','relationship-site','relationship-association',true);
    insert into public.applicants(id,client_id,display_name) values
      (${id(8)},${id(2)},'Applicant'), (${id(9)},${id(3)},'Other Applicant');
  `;
  const link = (application = 6, site = 4, client = 2, applicant = 8, type = 'relationship-member', row = 10) =>
    `insert into public.application_applicants(id,application_id,site_id,client_id,applicant_id,applicant_type_key)
     values (${id(row)},${id(application)},${id(site)},${id(client)},${id(applicant)},'${type}');`;
  const association = (site = 4, siteKey = 'relationship-site', associationKey = 'relationship-association', row = 12) =>
    `insert into public.application_associations(id,application_id,site_id,site_key,association_key)
     values (${id(row)},${id(6)},${id(site)},'${siteKey}','${associationKey}');`;
  const accept = statement => sql(`begin; ${fixture} ${statement} rollback;`);
  const reject = statement => {
    try { accept(statement); } catch (error) {
      if (/violates (foreign key|unique|check|row-level security)|row-level security policy/i.test(String(error))) return;
      throw error;
    }
    throw new Error(`PostgreSQL accepted an invalid application relationship: ${statement}`);
  };
  accept(`${link()} ${link(7, 4, 2, 8, 'relationship-member', 11)} ${association()}`);
  reject(link(6, 4, 2, 9)); // Person belongs to another Client.
  reject(link(6, 5, 3, 9)); // Supplied Site differs from the Application's Site.
  reject(link(6, 4, 3, 9)); // Supplied Client differs from the Site's Client.
  reject(link(6, 4, 2, 8, 'missing-type'));
  reject(`${link()} ${link(6, 4, 2, 8, 'relationship-member', 11)}`);
  reject(association(5, 'relationship-site'));
  reject(association(4, 'relationship-other-site'));
  reject(association(4, 'relationship-site', 'missing-association'));
  reject(`${association()} ${association(4, 'relationship-site', 'relationship-association', 13)}`);
  reject(`insert into public.applicants(client_id,display_name) values (${id(2)},' ');`);
  reject(`${link()} delete from public.applicants where id=${id(8)};`);
  reject(`${link()} update public.sites set client_id=${id(3)} where id=${id(4)};`);
  reject(`${association()} delete from public.site_associations where id='relationship-site-association';`);
  const visible = accept(`grant select on public.applicants, public.application_applicants, public.application_associations to anon;
    set local role anon;
    select (select count(*) from public.applicants) + (select count(*) from public.application_applicants)
      + (select count(*) from public.application_associations);`).trim();
  if (visible !== '0') throw new Error(`Anonymous access exposed applicant data: ${visible}`);
  reject(`grant insert on public.applicants to anon; set local role anon;
    insert into public.applicants(client_id,display_name) values (${id(2)},'Anonymous');`);
  return { validRelationships: true, rejectedInvalidRelationships: 13, anonymousReadBlocked: true, anonymousWriteBlocked: true };
}

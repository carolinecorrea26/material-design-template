/** File-only hierarchy crosswalk. Does not merge records or connect to a database. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const directory = path.resolve(process.argv[2] ?? '/tmp/portal-hierarchy-mapping');
const destination = 'docs/schema-step1';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const reviewed = read(path.join(directory, 'database.json'));
const local = read(path.join(directory, 'operations-data.json'));
const inventory = read(`${destination}/inventory.json`);
const client = new Map(reviewed.clients.map(row => [row.key, row]));
const localClients = new Map(local.clients.map(row => [row.key, row]));
const organizations = new Map(reviewed.organizations.map(row => [row.id, row]));
const rootForSite = site => reviewed.clients.find(row => row.id === site.clientId);
const policyForSite = site => reviewed.sitePolicies.find(row => row.siteKey === site.key)?.definition;
const sites = reviewed.sites.map(site => {
  const owner = rootForSite(site); if (!owner) throw Error(`Unresolved owner for ${site.key}`);
  const policy = policyForSite(site);
  const selection = policy?.associationSelection;
  const available = reviewed.siteAssociations.filter(row => row.siteKey === site.key);
  return {
    sourceId: site.id, siteKey: site.key, sourceOwnerKey: owner.key,
    proposedHostingAssociationKey: owner.key,
    pageTemplateType: site.templateType,
    existingAssociationSelection: selection ?? null,
    associationContext: selection?.mode === 'fixed' ? 'fixed-context-no-selector' : ['select', 'url-parameter'].includes(selection?.mode) ? 'multi-association-context' : 'not-configured-do-not-infer',
    evidenceStatus: owner.key === 'ama' ? 'single-association-business-confirmed' : 'repository-observation-only',
    assignedAssociations: available.map(row => ({ sourceId: row.id, assignmentKey: row.key, associationKey: row.associationKey, enabled: row.enabled })),
    applicationSelectionLimit: 1,
  };
});
const roots = reviewed.clients.map(row => {
  const ownedSites = sites.filter(site => site.sourceOwnerKey === row.key);
  const lowerRows = reviewed.associations.filter(association => association.clientKey === row.key);
  const organization = organizations.get(row.organizationId);
  if (!organization) throw Error(`Missing organization for ${row.key}`);
  const activeChoiceKeys = new Set(ownedSites.filter(site => site.associationContext === 'multi-association-context').flatMap(site => site.assignedAssociations.filter(a => a.enabled).map(a => a.associationKey)));
  return {
    sourceTable: 'clients', sourceId: row.id, sourceKey: row.key, name: row.name,
    sourceOrganizationId: row.organizationId, sourceOrganizationKey: organization.key, sourceOrganizationName: organization.name,
    localOrganizationId: localClients.get(row.key)?.organizationId ?? null,
    ownershipDiffersBetweenExports: localClients.has(row.key) && localClients.get(row.key).organizationId !== row.organizationId,
    proposedRole: 'hosting-association',
    classification: row.key === 'ama' ? 'business-confirmed-single-association' : !ownedSites.length ? 'source-only-no-site-do-not-activate' : activeChoiceKeys.size ? 'observed-multi-association-site-setup' : ownedSites.some(site => site.associationContext === 'fixed-context-no-selector') ? 'observed-fixed-context-setup' : 'unresolved-site-association-context',
    siteKeys: ownedSites.map(site => site.siteKey),
    existingAssociationRows: lowerRows.map(a => ({ id: a.id, key: a.key, name: a.definition.name, sourceReference: a.sourceReference ?? null })),
    mappedIdentityStatus: 'candidate-key-only-no-deployed-uuid-or-merge-established',
  };
});
const associations = reviewed.associations.map(row => {
  const owner = client.get(row.clientKey); if (!owner) throw Error(`Missing owner ${row.key}`);
  const assignments = sites.flatMap(site => site.assignedAssociations.filter(a => a.associationKey === row.key).map(a => ({ siteKey: site.siteKey, context: site.associationContext, enabled: a.enabled })));
  const selectable = assignments.some(a => a.enabled && a.context === 'multi-association-context');
  const fixed = assignments.some(a => a.context === 'fixed-context-no-selector');
  return {
    sourceTable: 'associations', sourceId: row.id, sourceKey: row.key, sourceHostingKey: owner.key, name: row.definition.name,
    sourceReference: row.sourceReference ?? null,
    observedRole: selectable ? 'association-offered-on-multi-association-site' : fixed ? 'fixed-association-context-profile' : 'unassigned-evidence-or-definition',
    proposedAction: selectable ? 'candidate-separate-association-with-explicit-membership-link' : fixed ? 'candidate-alias-or-profile-of-hosting-association-preserve-source-id' : 'preserve-unresolved-do-not-promote-to-membership-choice',
    mergeAuthorized: false, assignments,
  };
});
const scalarImpact = inventory.tables.flatMap(table => Object.values(table.columns).filter(column => ['client_id','client_key','organization_id'].includes(column.name)).map(column => ({ table: table.name, column: column.name, source: column.source, proposedMeaning: column.name === 'organization_id' ? 'TPA ownership on the hosting Association' : ['applicants','application_applicants'].includes(table.name) ? 'Applicant tenant context: hosting versus actual Association ownership still requires an application-model decision' : 'Hosting Association context; preserve original ownership until crosswalk is resolved' })));
const indirectImpact = [
  { table: 'user_scopes', field: 'scope_type/scope_id', issue: 'Client discriminator becomes Association scope; each existing polymorphic target requires a typed crosswalk' },
  { table: 'site_associations', field: 'site_key/association_key', issue: 'Separate multi-association offerings from fixed singleton aliases; do not infer selector from row count' },
  { table: 'application_associations', field: 'association_key and site context', issue: 'Resolve historical selected or fixed context to one canonical Association, retaining original source identity' },
  { table: 'site_policies', field: 'definition.associationSelection', issue: 'Fixed mode is automatic context; select and url-parameter modes offer multi-association context' },
  { table: 'organization_profiles', field: 'definition.administrationContacts[].clientKey', issue: 'Contact target refers to hosting Association after reconciliation' },
  { table: 'requirement_targets', field: 'target_table/target_key/target_column', issue: 'Evidence links to old tables/keys remain identifiable after canonical mapping' },
  { table: 'semantic_requirements', field: 'subject_table/subject_key/value', issue: 'Preserve and translate typed Association/Site subjects and embedded targets explicitly' },
  { table: 'audit_events', field: 'entity_type/entity_id and value JSON', issue: 'Retain historical old identities; no global replacement inside log JSON' },
  { table: 'change_items', field: 'entity_type/entity_id and value JSON', issue: 'Preserve historical targets through entity crosswalk' },
];
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report = {
  scope: 'Proposed hierarchy mapping only; not an applied schema or authorized identity merge',
  businessRules: { hierarchy: ['TPA','Association','Site'], clientIsBusinessEntity: false, amaHasAssociationSelector: false, applicationAssociationSelectionMaximum: 1 },
  sourceIdsAreExportIdsNotVerifiedDeployedUuids: true,
  sources: ['database.json','operations-data.json'].map(file => ({ file: path.join(directory,file), sha256: sha256(path.join(directory,file)) })),
  counts: { hostingAssociationCandidates: roots.length, lowerAssociationRows: associations.length, sites: sites.length, siteAssociationAssignments: reviewed.siteAssociations.length, sourceOnlyHostingCandidates: roots.filter(r => !r.siteKeys.length).length, selectableAssociationCandidates: associations.filter(r => r.observedRole === 'association-offered-on-multi-association-site').length, directColumnsImpacted: scalarImpact.length, ownershipDifferencesBetweenExports: roots.filter(r => r.ownershipDiffersBetweenExports).length },
  hostingAssociationCandidates: roots, existingAssociationRows: associations, sites, scalarImpact, indirectImpact,
};
if (roots.length !== reviewed.clients.length || associations.length !== reviewed.associations.length || sites.length !== reviewed.sites.length) throw Error('Incomplete crosswalk');
if (new Set(roots.map(r => r.sourceKey)).size !== roots.length || new Set(associations.map(r => r.sourceKey)).size !== associations.length) throw Error('Ambiguous source keys');
const amaSites = sites.filter(site => site.sourceOwnerKey === 'ama');
if (!amaSites.length || amaSites.some(site => site.associationContext !== 'fixed-context-no-selector')) throw Error('Current AMA configuration conflicts with confirmed no-selector behavior');
if (sites.reduce((total, site) => total + site.assignedAssociations.length, 0) !== reviewed.siteAssociations.length) throw Error('Incomplete Site/Association relationship crosswalk');
for (const site of sites) {
  for (const assignment of site.assignedAssociations) {
    const association = reviewed.associations.find(row => row.key === assignment.associationKey);
    if (!association || association.clientKey !== site.sourceOwnerKey) throw Error(`Invalid source Association ownership for ${site.siteKey}/${assignment.associationKey}`);
  }
  if (site.existingAssociationSelection?.mode === 'fixed' && !site.assignedAssociations.some(row => row.enabled && row.associationKey === site.existingAssociationSelection.fixedAssociationId)) throw Error(`Unresolved fixed Association context for ${site.siteKey}`);
}
fs.writeFileSync(`${destination}/hierarchy-crosswalk.json`, JSON.stringify(report,null,2)+'\n');
const esc = value => String(value ?? '—').replaceAll('|','\\|').replaceAll('\n',' ');
let markdown = '# Existing Association and Site identity crosswalk\n\nThis is a complete mapping of current reviewed export rows, not a merge or live database UUID inventory. Source-only definitions and unknown contexts remain unresolved. More than one lower association row does not prove a membership selector. AMA is the business-confirmed singleton example; other classifications are repository observations.\n\n';
markdown += '## Sites\n\n| Site | Hosting Association candidate | Association context | Existing fixed key | Assigned rows | Page template |\n| --- | --- | --- | --- | --- | --- |\n';
for (const site of sites) markdown += `| ${site.siteKey} | ${site.proposedHostingAssociationKey} | ${site.associationContext} | ${site.existingAssociationSelection?.fixedAssociationId ?? '—'} | ${site.assignedAssociations.length} | ${site.pageTemplateType} |\n`;
markdown += '\nPage template single/multi describes the form layout and does not establish single/multi-association behavior. The current export contains one AMA Site; the confirmed model supports several, and no additional AMA Site is fabricated.\n\n## Hosting Association candidates\n\n| Existing clients key | Name | Reviewed TPA key | Sites | Classification | Ownership differs from local seed |\n| --- | --- | --- | --- | --- | --- |\n';
for (const row of roots) markdown += `| ${row.sourceKey} | ${esc(row.name)} | ${row.sourceOrganizationKey} | ${row.siteKeys.join(', ') || '—'} | ${row.classification} | ${row.ownershipDiffersBetweenExports ? 'yes' : 'no'} |\n`;
markdown += '\n## Existing lower Association rows\n\n| Existing associations key | Hosting candidate | Observed role | Proposed treatment |\n| --- | --- | --- | --- |\n';
for (const row of associations) markdown += `| ${row.sourceKey} | ${row.sourceHostingKey} | ${row.observedRole} | ${row.proposedAction} |\n`;
markdown += '\n## Direct scalar ownership impact\n\n| Table | Column | Proposed meaning |\n| --- | --- | --- |\n';
for (const row of scalarImpact) markdown += `| ${row.table} | ${row.column} | ${row.proposedMeaning} |\n`;
markdown += '\nThe JSON crosswalk retains every source ID, source reference, site assignment and export ownership difference. No proposed treatment authorizes deleting a duplicate or changing historical records.\n';
fs.writeFileSync(`${destination}/hierarchy-crosswalk.md`, markdown);
console.log(JSON.stringify(report.counts,null,2));

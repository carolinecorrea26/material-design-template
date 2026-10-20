/** Read-only comparison of captured database copies using the actual resolvers.
 * Writes review evidence only; does not approve values or change saved records.
 * Run: node scripts/compare-product-ownership.mjs
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { build } from 'vite';

const source = 'migration-artifacts/mock/database.json';
const destination = 'docs/project-review/product-ownership-comparison';
const sourceText = fs.readFileSync(source, 'utf8');
const db = JSON.parse(sourceText);
async function moduleFor(entry) {
  const result = await build({ configFile: false, logLevel: 'silent', build: {
    ssr: entry, write: false, minify: false, rollupOptions: { output: { format: 'es' } },
  } });
  const chunk = result.output.find(item => item.type === 'chunk' && item.isEntry);
  if (!chunk || chunk.imports.length) throw new Error(`Comparison requires a self-contained resolver: ${entry}`);
  return import(`data:text/javascript;base64,${Buffer.from(chunk.code).toString('base64')}`);
}
const { resolveEffectiveSite } = await moduleFor('src/domain/effectiveSite.ts');
const { buildPrototypeAmounts, buildPrototypeRiders } = await moduleFor('src/domain/prototypeProductProjection.ts');
const { activeSiteMigrationScope } = await moduleFor('src/migration/activeSiteScope.ts');
const businessSiteKeys = new Set(activeSiteMigrationScope.sites.filter(site => site.mcrRequired).map(site => site.key));
const activeRows = db.sites.filter(site => site.status === 'active' && !site.deletedAt);
const excluded = activeRows.filter(site => !businessSiteKeys.has(site.key)).map(site => ({
  key: site.key,
  reason: site.key === 'demo' ? 'Synthetic demonstration, not an MCR business Site; excluded from business reconciliation.' : 'Outside the approved MCR business review scope; retained in the source export.',
}));
for (const key of businessSiteKeys) if (!activeRows.some(site => site.key === key)) throw new Error(`Missing scoped business Site: ${key}`);
const scopeKey = assignment => JSON.stringify(Object.entries(assignment.scope).sort(([a], [b]) => a.localeCompare(b)));
function choices(assignment) {
  if (assignment.derivedFrom) return { derivedFrom: assignment.derivedFrom };
  const result = [];
  for (const selection of assignment.selections ?? []) {
    if (selection.type === 'amountList') result.push(...selection.values);
    else if (selection.type === 'range' && selection.increment > 0 && (selection.max - selection.min) / selection.increment < 50000) {
      for (let value = selection.min; value <= selection.max; value += selection.increment) result.push(value);
    } else return assignment;
  }
  return [...new Set(result)].sort((a, b) => a - b);
}
function compareAmounts(left, right) {
  const a = new Map(left.map(row => [scopeKey(row), row]));
  const b = new Map(right.map(row => [scopeKey(row), row]));
  if (a.size !== left.length || b.size !== right.length) throw new Error('Duplicate amount scopes need explicit comparison before reporting parity');
  return {
    differentSharedScopes: [...a.keys()].filter(key => b.has(key) && JSON.stringify(choices(a.get(key))) !== JSON.stringify(choices(b.get(key)))),
    leftOnlyScopes: [...a.keys()].filter(key => !b.has(key)),
    rightOnlyScopes: [...b.keys()].filter(key => !a.has(key)),
    serializedEqual: JSON.stringify(left) === JSON.stringify(right),
  };
}
const rows = [];
const routing = [];
const pageParticipation = [];
const fieldDefinitionOwnership = [];
for (const siteRow of activeRows.filter(site => businessSiteKeys.has(site.key))) {
  const site = resolveEffectiveSite(db, siteRow.key);
  fieldDefinitionOwnership.push({ site: siteRow.key, source: site.configuration.fieldDefinitionOwnership });
  routing.push({ site: siteRow.key, ...site.configuration.routing });
  pageParticipation.push({ site: siteRow.key, ...site.configuration.pageParticipation,
    assignments: db.sitePages.filter(row => row.siteKey === siteRow.key),
    configurationCopies: site.configuration.configurations.filter(configuration => {
      const path = db.configurationDefinitions.find(definition => definition.key === configuration.key)?.definition.path;
      return path?.[0] === 'pages' && (path.length === 1 || ['requirements', 'excluded', 'optional', 'participationSource'].includes(path[1]));
    }),
  });
  for (const product of site.configuration.products) {
    const normalized = buildPrototypeAmounts({ ...product, benefitPolicies: [] });
    const effective = buildPrototypeAmounts(product);
    const legacy = site.configuration.configurations.find(row => row.key === `coverages.coverageAmounts.${product.productKey}`) ?? null;
    if (legacy && !Array.isArray(legacy.value)) throw new Error(`Unparsed compatibility amount copy: ${siteRow.key}/${product.productKey}`);
    const markers = site.configuration.configurations.filter(row => {
      const target = db.configurationDefinitions.find(definition => definition.key === row.key)?.definition.target;
      return target?.kind === 'product-rider-set' && target.productKey === product.productKey;
    });
    rows.push({
      site: siteRow.key, product: product.productKey,
      name: db.products.find(row => row.key === product.productKey).definition.name,
      amounts: { normalized, effective, legacy, benefitPolicies: product.benefitPolicies,
        amountCapPolicies: product.amountCapPolicies,
        amountCapSources: product.amountCapPolicies.length ? product.limits : [],
        normalizedSources: product.amounts,
        normalizedVsEffective: compareAmounts(normalized, effective),
        legacyVsEffective: legacy ? compareAmounts(legacy.value, effective) : null },
      riders: { ownership: product.riderOwnership, effective: buildPrototypeRiders(product),
        selectionPolicies: product.selectionPolicies.map(policy => ({ ...policy, storedValues: db.configurationValues.filter(value => policy.provenance.some(source => source.table === 'configurationValues' && source.key === value.key)) })),
        markerCopies: markers.filter(marker => Array.isArray(marker.value)),
        relationalMarkers: markers.filter(marker => marker.value?.version === 2 && marker.value?.source === 'productRiders'),
        propertyOverrides: site.configuration.configurations.filter(row => {
          const target = db.configurationDefinitions.find(definition => definition.key === row.key)?.definition.target;
          return target?.kind === 'product-rider-override' && target.productKey === product.productKey;
        }),
        presentationOverrides: product.presentation.filter(row => row.key === 'riders'),
        normalizedSources: product.riders },
    });
  }
}
const differs = result => result.differentSharedScopes.length || result.leftOnlyScopes.length || result.rightOnlyScopes.length;
const summary = {
  sharedFieldDefinitionSites: fieldDefinitionOwnership.filter(row => row.source === 'fields').length,
  validationControlCopies: db.validationRules.filter(row => Object.hasOwn(row.definition, 'inputType')).length,
  validationFormatCopies: db.validationRules.filter(row => Object.hasOwn(row.definition, 'format')).length,
  retainedRequiredConstraints: db.validationRules.filter(row => Object.hasOwn(row.definition, 'required')).length,
  sitePageParticipationContracts: pageParticipation.filter(row => row.source === 'sitePages').length,
  sitePageAssignments: pageParticipation.flatMap(row => row.assignments).length,
  pageParticipationCopies: pageParticipation.flatMap(row => row.configurationCopies).length,
  ruleOwnedRoutingSites: routing.filter(row => row.source === "rules").length,
  sharedRoutingRuleIdentities: new Set(routing.flatMap(row => row.ruleKeys ?? [])).size,
  routedPages: new Set(routing.flatMap(row => (row.definitions ?? []).map(gate => gate.pageId))).size,
  sites: new Set(rows.map(row => row.site)).size, siteProductPairs: rows.length,
  savedAmountCopies: rows.filter(row => row.amounts.legacy).length,
  savedAmountCopiesWithDifferentSharedChoices: rows.filter(row => row.amounts.legacyVsEffective?.differentSharedScopes.length).length,
  savedAmountCopiesWithScopeDifferences: rows.filter(row => row.amounts.legacyVsEffective && (row.amounts.legacyVsEffective.leftOnlyScopes.length || row.amounts.legacyVsEffective.rightOnlyScopes.length)).length,
  benefitPolicyCopies: rows.filter(row => row.amounts.benefitPolicies.some(policy => policy.value?.amountSource !== 'product-amount-rules')).length,
  linkedBenefitPolicies: rows.filter(row => row.amounts.benefitPolicies.some(policy => policy.value?.amountSource === 'product-amount-rules')).length,
  ageCapAssignments: rows.filter(row => row.amounts.amountCapPolicies.length).length,
  ageCapRows: rows.flatMap(row => row.amounts.amountCapSources.flatMap(limit => limit.caps)).length,
  benefitPolicyChoiceOrScopeDifferences: rows.filter(row => differs(row.amounts.normalizedVsEffective)).length,
  riderSetCopies: rows.filter(row => row.riders.markerCopies.length).length,
  relationalRiderSets: rows.filter(row => row.riders.ownership === 'relational').length,
  activeRiderIdentities: new Set(rows.flatMap(row => row.riders.normalizedSources.map(rider => rider.key))).size,
  riderAssignments: rows.flatMap(row => row.riders.normalizedSources).length,
  scopedRiderPropertyOverrides: rows.flatMap(row => row.riders.propertyOverrides).length,
  linkedRiderSelectionPolicies: rows.flatMap(row => row.riders.selectionPolicies).filter(policy => policy.value?.amountSource === 'rider-amount-rules').length,
  riderChoiceReferences: rows.flatMap(row => row.riders.selectionPolicies.flatMap(policy => policy.storedValues.flatMap(value => (value.value?.riders ?? []).flatMap(rider => [rider.amount, ...Object.values(rider.amountByApplicant ?? {})].filter(amount => amount.kind === 'rule'))))).length,
  riderPresentationOverrides: rows.filter(row => row.riders.presentationOverrides.length).length,
};
const report = { source, sourceSha256: crypto.createHash('sha256').update(sourceText).digest('hex'),
  boundary: 'Detached reviewed seed export, not a connected or data-bearing database. Only the approved MCR business Site scope is compared; Demo is a synthetic demonstration and is excluded. Current resolution is observed behavior, not business approval. Missing scopes in a partial compatibility copy are not automatically conflicting values. Choice-set comparison does not certify income, age, aggregate, dependency, rate or other policy behavior.',
  scope: { source: 'src/migration/activeSiteScope.ts', included: [...businessSiteKeys], excluded, confirmation: 'User clarification October 19, 2026: Demo is a demonstration, not an MCR Site.' },
  summary, fieldDefinitionOwnership, routing, pageParticipation, rows };
fs.writeFileSync(`${destination}.json`, `${JSON.stringify(report, null, 2)}\n`);
const compact = assignments => assignments.map(row => `${row.scope.applicantType ?? 'all'}${row.scope.applicantClassId ? `/${row.scope.applicantClassId}` : ''}: ${row.derivedFrom ? JSON.stringify(row.derivedFrom) : (row.selections ?? []).map(selection => selection.type === 'range' ? `${selection.min}–${selection.max} step ${selection.increment}` : selection.values.join(', ')).join('; ')}`).join(' / ');
const lines = ['# Product ownership comparison', '', report.boundary, '',
  `Source: \`${source}\`; SHA-256: \`${report.sourceSha256}\`.`, '',
  `Business review scope: ${[...businessSiteKeys].join(', ')}. Excluded: ${excluded.map(site => `${site.key} (${site.reason})`).join('; ') || '(none)'}. Synthetic data stays in the source export and runtime; it is not counted as business evidence.`, '',
  `Reviewed ${summary.siteProductPairs} enabled Site/product pairs across ${summary.sites} business Sites. ${summary.savedAmountCopies} have compatibility amount copies; ${summary.savedAmountCopiesWithDifferentSharedChoices} differ in a shared scope's choices. ${summary.savedAmountCopiesWithScopeDifferences} differ in represented scopes (counts overlap).`, '',
  `${summary.linkedBenefitPolicies} benefit policies derive their base choices from explicit structured amount references. ${summary.benefitPolicyCopies} retain independent base-choice copies. ${summary.benefitPolicyChoiceOrScopeDifferences} products differ in choices or scope between structured and effective amount projections. This does not certify source accuracy or the other policy dimensions.`, '',
  `${summary.ageCapAssignments} product has an explicit age-cap assignment over ${summary.ageCapRows} stored cap rows. Age caps filter base choices at runtime; the base-choice comparison above does not apply applicant ages.`, '',
  `${summary.relationalRiderSets} Site/product pairs use relational rider sets, including explicit empty sets. ${summary.riderAssignments} assignments reference ${summary.activeRiderIdentities} distinct global rider identities; ${summary.scopedRiderPropertyOverrides} effective scoped property values record differences. ${summary.riderSetCopies} pairs retain legacy array markers and ${summary.riderPresentationOverrides} retain whole-array presentation overrides. Unconfirmed rider premium factors remain unavailable even where the compatibility projection falls back to zero.`, '',
  `${summary.linkedRiderSelectionPolicies} selection policies derive rider choices from ${summary.riderChoiceReferences} exact rider amount references. Selection policies own caps, dependencies, election defaults and applicability. Existing presentation amount metadata is retained as evidence and projected from structured choices for amount controls; provisional source dispositions remain open.`, '',
  '## Saved amount copies versus current applicant amounts', '',
  '| Site | Product | Saved compatibility copy | Current applicant projection | Difference |',
  '| --- | --- | --- | --- | --- |'];
for (const row of rows) {
  const comparison = row.amounts.legacyVsEffective;
  if (!comparison || !differs(comparison)) continue;
  lines.push(`| ${row.site} | ${row.product} | ${compact(row.amounts.legacy.value)} | ${compact(row.amounts.effective)} | ${comparison.differentSharedScopes.length ? 'Different shared choices; ' : ''}${comparison.leftOnlyScopes.length || comparison.rightOnlyScopes.length ? 'Different scopes; applicability requires review' : ''} |`);
}
lines.push('', '## Structured amounts versus benefit-policy copies', '', '| Site | Product | Structured amounts | Benefit-policy projection |', '| --- | --- | --- | --- |');
for (const row of rows) if (differs(row.amounts.normalizedVsEffective)) lines.push(`| ${row.site} | ${row.product} | ${compact(row.amounts.normalized)} | ${compact(row.amounts.effective)} |`);
lines.push('', '## Explicit age caps', '', '| Site | Product | Applicant | Age | Maximum | Source |', '| --- | --- | --- | --- | --- | --- |');
for (const row of rows) for (const limit of row.amounts.amountCapSources) for (const cap of limit.caps) {
  const age = cap.value.maximumAgeYears === null ? `${cap.value.minimumAgeYears ?? 0}+` : `${cap.value.minimumAgeYears ?? 0}–${cap.value.maximumAgeYears}`;
  lines.push(`| ${row.site} | ${row.product} | ${limit.value.applicantTypeKey ?? 'all'} | ${age} | $${cap.value.maximum.toLocaleString('en-US')} | ${cap.provenance.map(source => source.sourceReference).filter(Boolean).join('; ')} |`);
}
lines.push('', '## Rider ownership and assignments', '', '| Site | Product | Contract | Global rider keys | Scoped properties |', '| --- | --- | --- | --- | --- |');
for (const row of rows) lines.push(`| ${row.site} | ${row.product} | ${row.riders.ownership} | ${row.riders.normalizedSources.map(rider => rider.key).join(', ') || '(explicit empty set)'} | ${row.riders.propertyOverrides.map(override => db.configurationDefinitions.find(definition => definition.key === override.key).definition.target.property).join(', ') || '(inherited)'} |`);
lines.push('', '## Shared routing rules', '', `${summary.ruleOwnedRoutingSites} business Sites resolve ${summary.routedPages} template page gates from ${summary.sharedRoutingRuleIdentities} shared rule identities. Configuration stores exact references; rule assignments own applicability. This preserves the current template and does not adopt obsolete MCR page placement or activate planned rules.`, '', '| Site | Contract | Rule identities |', '| --- | --- | --- |');
for (const row of routing) lines.push(`| ${row.site} | ${row.source ?? 'Unconfigured'} | ${(row.ruleKeys ?? []).join(', ')} |`);
lines.push('', '## Page participation ownership', '', `${summary.sitePageParticipationContracts} business Sites derive page participation from ${summary.sitePageAssignments} Site/page assignments, with ${summary.pageParticipationCopies} effective configuration copies. Shared routing rules filter participation independently. Current health assignments remain required; explicit stored exclusions are honored in applicant navigation and summaries.`, '', '| Site | Contract | Optional pages | Disabled pages |', '| --- | --- | --- | --- |');
for (const row of pageParticipation) lines.push(`| ${row.site} | ${row.source} | ${row.assignments.filter(page => page.requirement === 'optional').map(page => page.pageKey).join(', ') || '(none)'} | ${row.assignments.filter(page => page.requirement === 'none').map(page => page.pageKey).join(', ') || '(none)'} |`);
lines.push('', '## Shared field control and format ownership', '', `${summary.sharedFieldDefinitionSites} business Sites use the global fields contract for control type and format across pages, quote surfaces and repeated collections. Validation rules retain ${summary.validationControlCopies} control-type copies and ${summary.validationFormatCopies} format copies. ${summary.retainedRequiredConstraints} required constraints keep their existing validation precedence pending separate per-property reconciliation. Scoped field overrides remain scoped; original validation rows remain ownership evidence in the reviewed export.`, '', '| Site | Contract |', '| --- | --- |');
for (const row of fieldDefinitionOwnership) lines.push(`| ${row.site} | ${row.source} |`);
lines.push('', 'Full source rows, provenance, scopes and values are retained in [the JSON evidence](product-ownership-comparison.json). This comparison writes evidence only. Previous amount copies and rider assignments are retained as non-executable ownership evidence in the reviewed export. Remaining rider/source mapping, reusable rules/conditions, fields/pages/settings/content reconciliation and legacy readers stay open in the ownership plan.', '');
fs.writeFileSync(`${destination}.md`, lines.join('\n'));
console.log(JSON.stringify(summary, null, 2));

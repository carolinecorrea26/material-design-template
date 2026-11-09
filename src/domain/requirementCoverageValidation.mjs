const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = value => Number.isInteger(value) && value >= 0;

/** Shared authoring/runtime boundary. No expressions, executable rules or implicit scopes. */
export function parseCoverageAssignments(document, definitions, siteKey, products) {
  const fail = message => { throw new Error(`Invalid Coverage requirements for ${siteKey}: ${message}`); };
  if (!object(document) || document.site !== siteKey || !Array.isArray(document.assignments)
    || Object.keys(document).some(key => !['site', 'assignments'].includes(key))) fail('invalid site document');
  const result = [];
  for (const row of document.assignments) {
    if (!object(row) || Object.keys(row).some(key => !['configuration', 'product', 'applicants', 'value', 'source', 'minimumAgeYears', 'maximumAgeYears'].includes(key))) fail('unexpected assignment property');
    const definition = definitions.find(definition => definition.id === row.configuration);
    if (!definition || definition.status !== 'confirmed') fail(`unknown configuration ${row.configuration}`);
    if (typeof row.product !== 'string' || !row.product || products && !products[row.product]) fail(`unknown product ${row.product}`);
    if (!Array.isArray(row.applicants) || !row.applicants.length || new Set(row.applicants).size !== row.applicants.length
      || row.applicants.some(applicant => !['member', 'spouse', 'child'].includes(applicant) || products && !products[row.product].includes(applicant))) fail('invalid applicants');
    if (typeof row.source !== 'string' || !row.source.trim()) fail('missing source');
    const valid = definition.type === 'number' ? integer(row.value) && row.value > 0
      : definition.type === 'boolean' ? typeof row.value === 'boolean'
      : definition.type === 'enum' ? definition.options?.includes(row.value)
      : definition.type === 'string-list' && Array.isArray(row.value) && new Set(row.value).size === row.value.length && row.value.every(value => typeof value === 'string' && /^[A-Z]{2}$/.test(value));
    if (!valid) fail(`invalid value for ${row.configuration}`);
    const banded = row.configuration === 'coverage-age-maximum-amount';
    if (banded ? !integer(row.minimumAgeYears) || !integer(row.maximumAgeYears) || row.minimumAgeYears > row.maximumAgeYears
      : row.minimumAgeYears !== undefined || row.maximumAgeYears !== undefined) fail('invalid age band');
    if (result.some(other => other.configuration === row.configuration && other.product === row.product
      && other.applicants.some(applicant => row.applicants.includes(applicant))
      && (!banded || other.minimumAgeYears <= row.maximumAgeYears && row.minimumAgeYears <= other.maximumAgeYears))) fail(`overlapping assignment for ${row.configuration}`);
    result.push(row);
  }
  for (const row of result.filter(row => row.configuration === 'coverage-minimum-age-years')) {
    const maximum = result.find(other => other.configuration === 'coverage-maximum-age-years' && other.product === row.product && other.applicants.some(applicant => row.applicants.includes(applicant)));
    if (maximum && row.value > maximum.value) fail('minimum age exceeds maximum age');
  }
  return result;
}

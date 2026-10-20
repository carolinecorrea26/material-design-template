import aliases from './siteAliases.json' with { type: 'json' };

export function canonicalSiteKey(key) { return aliases[key] ?? key; }

const evidenceFields = new Set(['sourceReference', 'source', 'rawValue', 'rawText', 'formulaText', 'workbookHash', 'checklistHash', 'hash', 'baseRevision', 'revision']);
const identityField = field => /(?:Key|Id|Keys|Ids|_key|_id)$/.test(field) || ['id', 'key', 'sites', 'site'].includes(field);
const siteDictionaries = new Set(['heads', 'releaseHeads', 'sitesByKey', 'siteDefaults', 'siteOverrides', 'bySite', 'bySiteKey']);
const replacements = Object.entries(aliases).map(([oldKey, newKey]) => [new RegExp(`(^|[.:])${oldKey}(?=[.:]|--|$)`, 'g'), newKey]);
function identity(value) {
  if (aliases[value]) return aliases[value];
  for (const [pattern, newKey] of replacements) value = value.replace(pattern, (_, prefix) => prefix + newKey);
  return value;
}

/** Detached compatibility read. Keep evidence and revision labels verbatim; no storage is reset. */
export function normalizeSiteReferences(value, field = '') {
  if (evidenceFields.has(field)) return value;
  if (typeof value === 'string') return identityField(field) ? identity(value) : value;
  if (Array.isArray(value)) return value.map(item => normalizeSiteReferences(item, field));
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, item]) => [siteDictionaries.has(field) ? identity(key) : key, normalizeSiteReferences(item, key)]);
    if (new Set(entries.map(([key]) => key)).size !== entries.length) throw new Error('Conflicting old and current Site identities. Saved references require review.');
    return Object.fromEntries(entries);
  }
  return value;
}

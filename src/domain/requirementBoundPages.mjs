import { resolveMappedFields } from './requirementFieldDefinitions.mjs';

/** Transfer page bindings as a batch while preserving existing runtime IDs,
 * section conditions, collections and effective-Site participation. */
export function compileBoundPage(output, source, page, sites, { row, text }) {
  const pageKey = page.consumerKey ?? page.page;
  const reference = `requirements/parked/${page.page}.json`;
  const bindings = source.fields.fieldDetails.bindings;
  const globalFields = new Map();
  for (const person of ['self', 'spouse', 'child', 'beneficiary']) {
    const ids = new Set(page.fieldBindings.flatMap(id => bindings[id]?.person === person ? [bindings[id].field] : []));
    if (!ids.size) continue;
    const mappings = source.fields.mappings.filter(mapping => mapping.page === page.page);
    if (mappings.length !== 1) throw new Error(`Missing fresh-start bound page mapping: ${page.page}`);
    const fields = resolveMappedFields({ page: page.page }, { person, page: page.page, source: { ...source.fields, mappings: [{ ...mappings[0], fields: mappings[0].fields.filter(field => ids.has(field.field)) }] } });
    for (const field of fields) globalFields.set(`${person}:${field.id}`, field);
  }
  for (const id of page.fieldBindings) {
    const binding = bindings[id], base = binding && globalFields.get(`${binding.person}:${binding.field}`);
    if (!base) throw new Error(`Missing fresh-start field binding: ${page.page}/${id}`);
    const definition = { ...base, ...structuredClone(binding.values ?? {}), id };
    for (const property of binding.omit ?? []) delete definition[property];
    output.fields = output.fields.filter(field => field.key !== id);
    output.fields.push(row('fields', id, 'requirements/parked/field-details.json', { definition, position: output.fields.length }));
    output.validationRules = output.validationRules.filter(rule => rule.fieldKey !== id);
  }
  for (const [position, id] of page.looseFields.entries()) {
    if (!page.fieldBindings.includes(id)) throw new Error(`Unbound fresh-start page field: ${page.page}/${id}`);
    output.pageFields.push(row('pageFields', `${pageKey}.${id}`, reference, { pageKey, fieldKey: id, position }));
  }
  for (const [position, group] of Object.values(page.layout.sections).entries()) {
    const { fields, description, title, ...properties } = group;
    const key = `${pageKey}.${group.id}`;
    const definition = { ...properties, pageId: pageKey, fieldIds: fields,
      ...(description === undefined ? {} : { description: text(description) }), ...(title === undefined ? {} : { title: text(title) }) };
    output.pageSections.push(row('pageSections', key, reference, { pageKey, definition, position }));
    for (const [position, id] of fields.entries()) {
      if (!page.fieldBindings.includes(id)) throw new Error(`Unbound fresh-start section field: ${page.page}/${id}`);
      output.pageSectionFields.push(row('pageSectionFields', `${key}.${id}`, reference, { sectionKey: key, fieldKey: id, position }));
    }
  }
  for (const site of sites) {
    const settings = source.fields.sitePages[site.key]?.[page.page];
    if (!settings || !settings.requirement) throw new Error(`Missing fresh-start page assignment: ${site.key}/${page.page}`);
    output.sitePages = output.sitePages.filter(row => row.siteKey !== site.key || row.pageKey !== pageKey);
    output.sitePages.push(row('sitePages', `${site.key}.${pageKey}`, reference, { siteKey: site.key, pageKey, requirement: settings.requirement, position: settings.position ?? page.position }));
    const clientKey = output.clients.find(client => client.id === site.clientId)?.key;
    output.siteFieldConfigurations = output.siteFieldConfigurations.filter(row => row.pageKey !== pageKey || !(row.scope === 'global' || row.siteKey === site.key || row.scope === 'client' && row.clientKey === clientKey));
    for (const field of settings.fieldOverrides ?? []) output.siteFieldConfigurations.push(row('siteFieldConfigurations', `requirements.${site.key}.${pageKey}.${field.field}`, `requirements/parked/sites/${site.key}/pages/${page.page}.json`, { scope: 'site', siteKey: site.key, clientKey: null, pageKey, fieldKey: field.field, values: field.values, include: field.include, hidden: field.hidden, position: field.position }));
  }
}

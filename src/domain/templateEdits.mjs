export const templateProperties = [
  { id: 'continue', label: 'Continue label', area: 'Shared template', source: 'requirements/global/content/common.json', key: 'action.continue', projection: 'home.landing-notice.continue', siteOverride: false, pages: ['home', 'eligibility', 'coverage'], usage: 'Home entry notice, Eligibility verification and Coverage dependent dialog' },
  { id: 'contact-title', label: 'Contact page title', area: 'Pages & flows', source: 'requirements/global/content/contact.json', key: 'contact.title', projection: 'pages.contact.title', siteOverride: true, pages: ['contact'], usage: 'Contact page header' },
  { id: 'beneficiary-dialog', label: 'Add Beneficiary dialog title', area: 'Pages & flows', source: 'requirements/global/content/beneficiary.json', key: 'beneficiary.dialog.add-title', projection: 'dialogs.beneficiary.addTitle', siteOverride: false, pages: ['beneficiary'], usage: 'Beneficiary add dialog' },
];

export const templateAssignmentPath = site => `requirements/parked/sites/${site}/pages/contact.json`;
export const templateTarget = ({ property, site }) => `${property}/${site ?? 'global'}`;

export function templateProperty(id) {
  return templateProperties.find(property => property.id === id);
}

export function validateTemplateChanges(input, sites) {
  if (!Array.isArray(input) || !input.length || input.length > 30) throw new Error('Choose at least one supported edit.');
  const seen = new Set();
  return input.map(change => {
    const definition = templateProperty(change?.property);
    if (!definition || (change.site !== null && (!definition.siteOverride || !sites.includes(change.site)))) throw new Error('This property or scope is unavailable.');
    let value = change.value;
    if (typeof value === 'string') value = value.trim();
    if (value === null ? change.site === null : typeof value !== 'string' || !value || value.length > 200 || /[\p{Cc}{}]/u.test(value)) throw new Error('Enter plain text of 1–200 characters or restore the Site default.');
    const edit = { property: definition.id, site: change.site, value };
    const target = templateTarget(edit);
    if (seen.has(target)) throw new Error('Each property and scope can appear once in a draft.');
    seen.add(target);
    return edit;
  });
}

export function templateValue(data, edit) {
  const definition = templateProperty(edit.property);
  const values = data.contentValues.filter(row => row.contentKey === definition.projection);
  const fallback = values.find(row => row.scope === 'global');
  if (typeof fallback?.value !== 'string') throw new Error('Published template value is unavailable.');
  if (edit.site === null) return { assigned: fallback.value, effective: fallback.value };
  const override = values.find(row => row.siteKey === edit.site && row.sourceReference === templateAssignmentPath(edit.site));
  return { assigned: override?.value ?? null, effective: override?.value ?? fallback.value };
}

export function templateImpact(data, changes, sites) {
  return templateProperties.filter(definition => changes.some(change => change.property === definition.id)).flatMap(definition => {
    const property = definition.id;
    const global = changes.find(edit => edit.property === property && edit.site === null);
    const fallback = global?.value ?? templateValue(data, { property, site: null }).effective;
    return sites.flatMap(site => {
      const edit = changes.find(change => change.property === property && change.site === site);
      if (!edit && !global) return [];
      const before = templateValue(data, { property, site });
      const assigned = edit ? edit.value : before.assigned;
      return [{ property, site, before: before.effective, after: assigned ?? fallback, inherited: assigned === null }];
    });
  });
}

export function applyTemplateEdits(source, changes) {
  const content = { ...source.content };
  const sitePages = { ...source.fields.sitePages };
  for (const edit of changes) {
    const { key } = templateProperty(edit.property);
    if (edit.site === null) {
      content[key] = edit.value;
      continue;
    }
    const pages = { ...sitePages[edit.site] };
    const page = { page: 'contact', ...pages.contact };
    const assigned = { ...page.content };
    if (edit.value === null) delete assigned[key];
    else assigned[key] = edit.value;
    sitePages[edit.site] = { ...pages, contact: { ...page, content: assigned } };
  }
  return { ...source, content, fields: { ...source.fields, sitePages } };
}

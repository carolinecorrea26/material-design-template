import { validateRequirementComponentParts } from './requirementComponents.mjs';

/** Semantic section composition shared by the compiler and standalone previews.
 * React owns styling; requirements own order, component membership and participation. */
export function requirementPageSections(page, sectionOrders = {}) {
  validateRequirementComponentParts(page.components);
  const policy = page.businessPolicy;
  if (policy && (!Array.isArray(policy.employerCoverageCategories) || !policy.employerCoverageCategories.length || policy.employerCoverageCategories.some(category => typeof category !== 'string' || !/^[A-Z]{2}$/.test(category)) || new Set(policy.employerCoverageCategories).size !== policy.employerCoverageCategories.length || typeof policy.businessCorrespondenceValue !== 'string' || !policy.businessCorrespondenceValue.trim())) throw new Error(`Invalid fresh-start business policy: ${page.page}`);
  const sections = page.layout.sections;
  for (const section of Object.values(sections)) if (section.applicantParticipation !== undefined && !['applying', 'always'].includes(section.applicantParticipation)) throw new Error(`Invalid fresh-start section participation: ${page.page}`);
  const order = page.layout.sectionOrder ? sectionOrders[page.layout.sectionOrder] : Object.keys(sections);
  if (!Array.isArray(order) || order.length !== Object.keys(sections).length || new Set(order).size !== order.length || order.some(key => !sections[key])) throw new Error(`Invalid fresh-start section order: ${page.page}`);
  const placements = new Map();
  const visit = (nodes, nested = false) => {
    for (const component of nodes ?? []) {
      if (component.dialog && !page.layout.dialogs?.[component.dialog]) throw new Error(`Invalid fresh-start component dialog: ${page.page}/${component.type}`);
      if (component.section) {
        if (!sections[component.section]) throw new Error(`Invalid fresh-start component section: ${page.page}/${component.type}`);
        const project = node => ({ type: node.type, ...(node.fields ? { fieldIds: [...node.fields] } : {}), ...(node.components ? { components: node.components.filter(child => !child.section).map(project) } : {}) });
        const owned = placements.get(component.section) ?? [];
        owned.push(project(component));
        placements.set(component.section, owned);
      } else if (page.layout.sectionOrder && !nested && !component.dialog && !component.components?.length) throw new Error(`Invalid fresh-start component section: ${page.page}/${component.type}`);
      visit(component.components, true);
    }
  };
  visit(page.components);
  return order.map(name => {
    const group = sections[name];
    if (group.role !== undefined && !['questions', 'categories', 'portfolio', 'reveal', 'products', 'summary'].includes(group.role)) throw new Error(`Invalid fresh-start section role: ${page.page}/${name}`);
    if (group.display) {
      const { label, templates, excludeVariants = [] } = group.display;
      if (typeof label !== 'string' || !label.trim() || !Array.isArray(templates) || !templates.length || new Set(templates).size !== templates.length || templates.some(value => !['single', 'multi'].includes(value)) || !Array.isArray(excludeVariants) || excludeVariants.some(value => typeof value !== 'string' || !value.trim())) throw new Error(`Invalid fresh-start section display: ${page.page}/${name}`);
    }
    const composition = placements.get(name) ?? [];
    const components = composition.map(component => component.type);
    const fieldsOf = nodes => nodes.flatMap(node => [...(node.fieldIds ?? []), ...fieldsOf(node.components ?? [])]);
    const componentFields = fieldsOf(composition);
    if (componentFields.some(field => typeof field !== 'string' || !field.trim()) || new Set(componentFields).size !== componentFields.length) throw new Error(`Invalid fresh-start component fields: ${page.page}/${name}`);
    if (group.fields && componentFields.some(field => !group.fields.includes(field))) throw new Error(`Unplaced fresh-start component field: ${page.page}/${name}`);
    if (group.display && !components.length) throw new Error(`Missing fresh-start section components: ${page.page}/${name}`);
    return [name, { ...group, ...(!group.fields && componentFields.length ? { fields: componentFields } : {}), ...(components.length ? { components, composition } : {}) }];
  });
}

/** An explicit field plus semantic outcomes is an executable participation rule. */
export function validateRequirementOutcomeCondition(condition) {
  if (!condition || typeof condition.field !== 'string' || !condition.field.trim() || Object.keys(condition).some(key => !['field', 'of', 'outcome'].includes(key)) || condition.of !== undefined && !['self', 'spouse', 'child', 'beneficiary'].includes(condition.of) || !Array.isArray(condition.outcome) || !condition.outcome.length || condition.outcome.some(value => typeof value !== 'string' || !value.trim()) || new Set(condition.outcome).size !== condition.outcome.length) throw new Error('Invalid fresh-start outcome condition');
}
/** Page definitions and order are global; only declared participation options accept Site values. */
export function validateRequirementPageAssignments(pages, defaults, assignments = {}) {
  const byId = new Map(pages.map(page => [page.page, page]));
  const positions = new Set();
  for (const page of pages) {
    const settings = defaults.pages[page.page];
    const options = settings?.siteRequirementOptions;
    if (!settings || !['none', 'optional', 'required'].includes(settings.requirement) || !Number.isSafeInteger(page.position) || page.position < 0 || positions.has(page.position) ||
        options !== undefined && (!Array.isArray(options) || !options.length || !options.includes(settings.requirement) || new Set(options).size !== options.length || options.some(value => !['none', 'optional', 'required'].includes(value))))
      throw new Error(`Invalid global page configuration: ${page.page}`);
    positions.add(page.position);
  }
  for (const [site, sitePages] of Object.entries(assignments)) for (const [id, assignment] of Object.entries(sitePages)) {
    const page = byId.get(id);
    if (!page || !assignment || typeof assignment !== 'object' || Array.isArray(assignment) || assignment.page !== undefined && assignment.page !== id)
      throw new Error(`Unknown or invalid Site page assignment: ${site}/${id}`);
    if (assignment.position !== undefined && assignment.position !== page.position)
      throw new Error(`Page order is global: ${site}/${id}`);
    const settings = defaults.pages[id];
    if (assignment.requirement !== undefined && !(settings.siteRequirementOptions ?? [settings.requirement]).includes(assignment.requirement))
      throw new Error(`Page participation is not configurable with this value: ${site}/${id}`);
  }
}

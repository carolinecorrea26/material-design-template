import inventory from '../../requirements/global/forms.json';
import componentDefinitions from '../../requirements/global/components.json';
import sharedComponents from '../../requirements/global/shared-components.json';
import { freshStartSource } from './freshStartCatalog';

export const applicationFormHostingDefinition = inventory.hostingDefinition;
type FormDefinition = typeof inventory.forms[number];
type Target = { page?: string; component?: string };
type Relationship = { component?: string; page?: string; calculators?: string[]; menus?: string[]; drawers?: string[] };
export type FormInventorySource = {
  forms: readonly FormDefinition[];
  pages: Record<string, { page: string; consumerKey?: string; definition: Record<string, unknown>; fieldMapping?: Target }>;
  components: Array<{ name: string; displayName: string; description: string }>;
  sharedComponents: Array<{ id: string; implementation: string }>;
  relationships: Relationship[];
  content: Record<string, unknown>;
};

export function applicationFormSource(): FormInventorySource {
  const { pages, content, fields } = freshStartSource();
  return { forms: inventory.forms, pages, content, components: Object.values(componentDefinitions).flat(), sharedComponents: sharedComponents.components, relationships: fields.mappings as Relationship[] };
}

/** Shared component names, contextual form names and containing relationships are authored once. */
export function applicationFormRows(source: FormInventorySource = applicationFormSource()) {
  const text = (key: string) => {
    const value = source.content[key];
    if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing fresh-start form content: ${key}`);
    return value;
  };
  const page = (key: string) => {
    const definition = source.pages[key];
    if (!definition || typeof definition.definition.displayName !== 'string' || !definition.definition.displayName.trim()) throw new Error(`Missing fresh-start form page: ${key}`);
    return { kind: 'page' as const, key: definition.consumerKey ?? definition.page, name: definition.definition.displayName };
  };
  const component = (name: string) => {
    const matches = source.components.filter(component => component.name === name);
    if (matches.length !== 1 || !matches[0].displayName.trim()) throw new Error(`Missing or ambiguous fresh-start form component: ${name}`);
    return matches[0];
  };
  const target = (reference: Target) => {
    if (Boolean(reference.page) === Boolean(reference.component)) throw new Error('A form must reference exactly one page or component');
    return reference.page ? page(reference.page) : { kind: 'component' as const, key: reference.component!, name: component(reference.component!).displayName };
  };
  const containers = (id: string) => {
    if (!source.sharedComponents.some(component => component.id === id)) throw new Error(`Unknown shared form component: ${id}`);
    const parents = source.relationships.filter(mapping => ['calculators', 'menus', 'drawers'].some(kind => mapping[kind as 'calculators']?.includes(id)));
    if (!parents.length) throw new Error(`Missing containing component for form: ${id}`);
    return parents.map(mapping => {
      const shared = source.sharedComponents.find(component => component.id === mapping.component);
      if (shared) return target({ component: shared.implementation });
      const owner = Object.values(source.pages).find(page => page.fieldMapping?.component === mapping.component || page.page === mapping.page);
      if (!owner) throw new Error(`Unresolved containing component for form: ${id}`);
      return page(owner.page);
    });
  };
  const ids = new Set<string>();
  return source.forms.map(form => {
    if (ids.has(form.id) || !['Internal', 'External'].includes(form.hosting)) throw new Error(`Invalid fresh-start form: ${form.id}`);
    ids.add(form.id);
    const definition = target(form.target);
    const description = form.description.content ? text(form.description.content) : component(form.description.component!).description;
    if (!description.trim()) throw new Error(`Missing fresh-start form description: ${form.id}`);
    const placements = form.usedIn.flatMap(reference => 'parentsOf' in reference ? containers(reference.parentsOf) : [target(reference)]);
    if (!placements.length) throw new Error(`Missing containing relationship for form: ${form.id}`);
    return { ...form, name: form.name ? text(form.name.content) : definition.name, description,
      placements: [...new Map(placements.map(placement => [`${placement.kind}:${placement.key}`, placement])).values()] };
  });
}

import { requirementText } from './requirementContent';

type Definition = { id: string; name: string; level?: string; message?: string; statement: string };
type Mapping = { component: string; pages?: string[]; validations?: Array<{ validation: string; scope?: string }> };
type Component = { type: string; mapping?: string; components?: Component[] };
const unwrap = <T,>(module: unknown) => ((module as { default?: T }).default ?? module) as T;
const definitions = Object.values(import.meta.glob('../../requirements/global/validations/*.json', { eager: true })).flatMap(module => unwrap<{ validations: Definition[] }>(module).validations);
const mappings = Object.values(import.meta.glob('../../requirements/mappings/requirements/*.json', { eager: true })).map(module => unwrap<Mapping>(module));
const pages = Object.values(import.meta.glob('../../requirements/parked/*.json', { eager: true })).map(module => unwrap<{ page: string; components?: Component[] }>(module));

/** Checks reference copy by key; the rendered wording has one content owner. */
export function requirementValidationMessage(id: string, variables: Record<string, string> = {}) {
  const matches = definitions.filter(definition => definition.id === id);
  if (matches.length !== 1 || !matches[0].message) throw new Error(`Missing validation message reference: ${id}`);
  return requirementText(matches[0].message, variables);
}

/** The Library documents the same page checks and message references. */
export function requirementPageValidations(pageKey: string) {
  const components = new Set<string>();
  const visit = (nodes: Component[]) => nodes.forEach(node => {
    const key = node.mapping ?? (/^[a-z]/.test(node.type) ? node.type : undefined);
    if (key) components.add(key);
    visit(node.components ?? []);
  });
  visit(pages.find(page => page.page === pageKey)?.components ?? []);
  const ids = new Set(mappings.filter(mapping => mapping.pages?.includes(pageKey) || components.has(mapping.component)).flatMap(mapping => (mapping.validations ?? []).filter(binding => binding.scope === 'page').map(binding => binding.validation)));
  return definitions.filter(definition => ids.has(definition.id) && definition.level === 'page' && definition.message);
}

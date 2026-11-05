import type { ComponentRow } from '../persistence/types/library';

export const componentRoles = ['application-frame', 'page-section', 'shared-piece'] as const;
export const componentRoleLabels = {
  'application-frame': 'Application frame',
  'page-section': 'Page sections',
  'shared-piece': 'Shared pieces',
} as const;

export const componentSections = ['Components', 'Reference'] as const;
export type ComponentSection = typeof componentSections[number];
export type ComponentDefinition = ComponentRow['definition'];

export function componentCategory(component: ComponentDefinition) {
  return component.section.split('/')[0].trim();
}

/** Count distinct documented placements, never repeated rendered records. */
export function componentUsages(component: ComponentDefinition) {
  return [...new Map((component.usages ?? []).map(usage => [`${usage.pageKey ?? ''}:${usage.source}`, usage])).values()];
}

export function reusableComponents<T extends { definition: ComponentDefinition }>(components: readonly T[]) {
  return components.filter(component => componentUsages(component.definition).length >= 2);
}

/** Composition describes registered source dependencies, including conditional paths, not a mounted tree. */
export function validateComponentStructure(rows: readonly { key: string; definition: Pick<ComponentDefinition, 'role' | 'contains' | 'parts'> }[]) {
  const byKey = new Map(rows.map(row => [row.key, row]));
  if (byKey.size !== rows.length) throw new Error('Duplicate component identity');
  for (const { key, definition } of rows) {
    if (!componentRoles.includes(definition.role)) throw new Error(`Invalid component role: ${key}`);
    if (!Array.isArray(definition.contains) || new Set(definition.contains).size !== definition.contains.length || definition.contains.some(child => child === key || !byKey.has(child))) throw new Error(`Invalid component composition: ${key}`);
    if (!Array.isArray(definition.parts) || new Set(definition.parts.map(part => part.name)).size !== definition.parts.length || definition.parts.some(part => !part.name?.trim() || !['export', 'native-element', 'action', 'slot'].includes(part.kind) || !part.sourceSymbol?.trim() || !part.description?.trim())) throw new Error(`Invalid component parts: ${key}`);
  }
  const complete = new Set<string>(), active = new Set<string>();
  function visit(key: string) {
    if (active.has(key)) throw new Error(`Cyclic component composition: ${key}`);
    if (complete.has(key)) return;
    active.add(key);
    byKey.get(key)!.definition.contains.forEach(visit);
    active.delete(key); complete.add(key);
  }
  byKey.forEach((_, key) => visit(key));
}

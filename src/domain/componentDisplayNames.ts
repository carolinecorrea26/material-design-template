import definitions from '../../requirements/global/components.json' with { type: 'json' };

const metadata = new Map(Object.values(definitions).flat().map(component => [component.name, component]));

/** Stable code identities and configured display names have separate purposes. */
export function configuredComponent(name: string) {
  const definition = metadata.get(name);
  if (!definition?.displayName?.trim()) throw new Error(`Missing configured component display name: ${name}`);
  return definition;
}

export const componentDisplayName = (component: { name: string }) => configuredComponent(component.name).displayName;

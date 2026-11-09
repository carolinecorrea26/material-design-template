import bindings from '../../requirements/global/configuration-bindings.json';
import { getPrototypeLibrary } from './prototypeLibrary';

type Configuration = { id: string; default?: unknown };
const definitions = Object.values(import.meta.glob('../../requirements/global/configurations/*.json', { eager: true })).flatMap(module => ((module as { default: { configurations: Configuration[] } }).default).configurations);

/** The installed fresh projection owns effective values; detached examples use
 * the same authored global default. No legacy configuration fills a missing value. */
export function requirementConfigurationValue(id: keyof typeof bindings): unknown {
  const library = getPrototypeLibrary();
  if (library) {
    const value = bindings[id].split('.').reduce<unknown>((value, key) => value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined, library.settings);
    if (value === undefined) throw new Error(`Missing fresh-start configuration: ${id}`);
    return value;
  }
  const definition = definitions.find(definition => definition.id === id);
  if (!definition || definition.default === undefined) throw new Error(`Missing fresh-start configuration default: ${id}`);
  return definition.default;
}

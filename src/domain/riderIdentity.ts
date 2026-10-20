import type { RiderDefinition } from './coverage';
import { libraryDisplayId } from './provenance';
/** Canonical rider identity is separate from scoped product/rider assignment identity. */
export function riderEntityKey(productKey: string, rider: RiderDefinition): string {
  const stable = (value: unknown): unknown => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, stable(v)])) : value;
  return `rider.${productKey}.${rider.id}.${libraryDisplayId('riderDefinition', JSON.stringify(stable(rider)))}`;
}

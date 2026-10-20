import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import { fieldSurfaceDefaults } from '../../migration/fieldSurfaceDefaults';
import type { ResolvedFieldSurface } from '../../domain/fieldSurfaces';
import type { FieldDefinition } from './types';

let legacy: Record<string, ResolvedFieldSurface> | undefined;
/** Code defaults are restricted to catalog mode. Stored prototypes fail closed. */
export function getFieldSurface(name: string): ResolvedFieldSurface {
  const library = getPrototypeLibrary();
  if (library) {
    const surface = library.fieldSurfaces[name];
    if (!surface) throw new Error(`Missing stored field surface: ${name}`);
    return surface;
  }
  if (!legacy) {
    const defaults = fieldSurfaceDefaults();
    legacy = Object.fromEntries(Object.entries(defaults.surfaces).map(([name, definition]) => [name, { ...definition, mapping: {
      fields: definition.fields.map(binding => defaults.fields.find(field => field.id === binding.fieldKey)!),
      fieldToKey: Object.fromEntries(definition.fields.map(binding => [binding.fieldKey, binding.valueKey])),
      gridFields: definition.fields.filter(binding => binding.grid).map(binding => binding.fieldKey),
    } }]));
  }
  if (!legacy[name]) throw new Error(`Unknown field surface: ${name}`);
  return legacy[name];
}
/** Project stored binding names into local control state. */
export function getSurfaceFields(name: string): FieldDefinition[] {
  const { mapping } = getFieldSurface(name);
  return mapping.fields.map(field => ({ ...field, id: mapping.fieldToKey[field.id] }));
}
export function getSurfaceField(name: string, id: string) {
  const surface = getFieldSurface(name);
  const field = surface.mapping.fields.find(field => field.id === id || surface.mapping.fieldToKey[field.id] === id);
  return field ? { ...field, id: surface.mapping.fieldToKey[field.id] } : undefined;
}
export function getHealthDetailSurfaceName(page: 'health-li' | 'health-si' | 'health-di', answerId: string) {
  return page === 'health-li' ? 'healthLiDetails' : page === 'health-si' ? 'healthSiDetails' : `healthDi${answerId.replace('health-di-', '').replace('-spouse', '')}Details`;
}
export function getHealthDetailSurface(page: 'health-li' | 'health-si' | 'health-di', answerId: string) {
  return getFieldSurface(getHealthDetailSurfaceName(page, answerId));
}

/** Product policy narrows authored choices; authored options own order and labels. */
export function paymentControlField(role: string, id: string, allowed: readonly { value: string; label: string }[]): FieldDefinition | undefined {
  const field = getSurfaceField('paymentControls', role);
  if (!field) return undefined;
  return { ...field, id, options: (field.options ?? []).filter(option => allowed.some(choice => choice.value === option.value)) };
}
/** Summary code reads semantic roles while storage uses authored bindings. */
export function surfaceSemanticValues(name: string, row: Record<string, unknown>) {
  const surface = getFieldSurface(name);
  const prefix = name === 'beneficiaryIndividual' || name === 'beneficiaryTrust' ? 'beneficiary-' : name === 'healthLiDetails' ? 'health-li-detail-' : name === 'healthSiDetails' ? 'health-si-detail-' : `health-di-${name.slice('healthDi'.length).replace('Details', '')}-detail-`;
  return Object.fromEntries(surface.mapping.fields.map(field => [field.id.startsWith(prefix) ? field.id.slice(prefix.length) : field.id, row[surface.mapping.fieldToKey[field.id]]]));
}
export function beneficiarySemanticValues<T extends Record<string, unknown>>(row: T): T {
  return { ...row, ...surfaceSemanticValues(row.beneficiaryType === 'trust' ? 'beneficiaryTrust' : 'beneficiaryIndividual', row) };
}

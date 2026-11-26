import type { RequirementCatalogSource } from './requirementCatalog.mjs';
import type { PageId } from '../types';
import type { DatabaseSchema } from '../persistence/types';

export type TemplatePropertyId = 'continue' | 'contact-title' | 'beneficiary-dialog';
export type TemplateEdit = { property: TemplatePropertyId; site: string | null; value: string | null };
export type TemplateProperty = { id: TemplatePropertyId; label: string; area: string; source: string; key: string; projection: string; siteOverride: boolean; pages: PageId[]; usage: string };
export type TemplateImpact = { property: TemplatePropertyId; site: string; before: string; after: string; inherited: boolean };
export const templateProperties: TemplateProperty[];
export function templateProperty(id: string): TemplateProperty | undefined;
export function templateAssignmentPath(site: string): string;
export function templateTarget(edit: Pick<TemplateEdit, 'property' | 'site'>): string;
export function validateTemplateChanges(input: unknown, sites: string[]): TemplateEdit[];
export function templateValue(data: Pick<DatabaseSchema, 'contentValues'>, edit: Pick<TemplateEdit, 'property' | 'site'>): { assigned: string | null; effective: string };
export function templateImpact(data: Pick<DatabaseSchema, 'contentValues'>, changes: TemplateEdit[], sites: string[]): TemplateImpact[];
export function applyTemplateEdits(source: RequirementCatalogSource, changes: TemplateEdit[]): RequirementCatalogSource;

import type { RequirementPage } from './requirementCatalog.mjs';
import type { PageSectionComponent } from '../config/pageSections/types';
export function requirementPageSections(page: RequirementPage, sectionOrders?: Record<string, string[]>): Array<[string, RequirementPage['layout']['sections'][string] & { components?: string[]; composition?: PageSectionComponent[] }]>;
export function validateRequirementOutcomeCondition(condition: unknown): void;
export function validateRequirementPageAssignments(pages: RequirementPage[], defaults: { pages: Record<string, { requirement: string; siteRequirementOptions?: string[] }> }, assignments?: Record<string, Record<string, { requirement?: string; position?: number }>>): void;

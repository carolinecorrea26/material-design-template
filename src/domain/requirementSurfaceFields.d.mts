import type { FieldDefinition } from './fields';
import type { RequirementPage, RequirementCatalogSource } from './requirementCatalog.mjs';
export function requirementSurfaceFields(surface: NonNullable<RequirementPage['surfaces']>[string], page: string, source: RequirementCatalogSource, siteId?: string): FieldDefinition[];

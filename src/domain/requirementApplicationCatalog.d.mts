import type { RequirementCatalogSource } from './requirementCatalog.mjs';
import type { DatabaseSchema } from '../persistence/types';

export function compileApplicationSiteIdentities<T extends Pick<DatabaseSchema, 'sites' | 'associationEntities'>>(data: T, source: RequirementCatalogSource, selectedSite?: string, siteScope?: readonly string[]): T;

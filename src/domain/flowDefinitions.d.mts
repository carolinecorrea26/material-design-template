import type { FlowDefinition } from './flows';
import type { RequirementCatalogSource } from './requirementCatalog.mjs';
type Records = RequirementCatalogSource['application']['records'];
export function flowDefinition(records: unknown, key: string): FlowDefinition;
export function validateFlowDefinitions(records: Records, source: RequirementCatalogSource): void;

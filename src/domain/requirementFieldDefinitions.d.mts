import type { FieldDefinition } from "./fields";
import type { RequirementFieldSource, RequirementMapping, RequirementPerson } from "./requirementFields";
export function resolveAnswerKey(field: string, person: RequirementPerson, patterns?: Partial<Record<RequirementPerson, string>>): string;
export function validateFieldMappingConstraints(mapping: unknown): void;
export function resolveMappedFields(mapping: RequirementMapping, options: { siteId?: string; person?: RequirementPerson; page?: string; includeAll?: boolean; source: RequirementFieldSource }): FieldDefinition[];

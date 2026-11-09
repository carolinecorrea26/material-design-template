import type { FieldDefinition } from "./fields";
import type { RequirementFieldSource, RequirementMapping, RequirementPerson } from "./requirementFields";
export function resolveMappedFields(mapping: RequirementMapping, options: { siteId?: string; person?: RequirementPerson; page?: string; includeAll?: boolean; source: RequirementFieldSource }): FieldDefinition[];

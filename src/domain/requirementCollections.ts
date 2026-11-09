import eligibility from "../../requirements/parked/eligibility.json";
import people from "../../requirements/global/configurations/people.json";
import { requirementAnswerKey, resolveMappedFields } from "./requirementFields";
import { requirementText } from "./requirementContent";

/** Detached section examples use the same authored collection as the application. */
export function requirementChildCollection(siteId?: string) {
  const group = eligibility.layout.sections.children;
  const fields = resolveMappedFields(eligibility.fieldMapping, { page: eligibility.page, person: "child", siteId }).map(field => ({ ...field, id: requirementAnswerKey(field.id, "child") }));
  return { name: group.collection, label: requirementText(group.repeats.item),
    maxItems: Number(people.configurations.find(configuration => configuration.id === group.repeats.max)!.default),
    mapping: { fields, fieldToKey: Object.fromEntries(fields.map(field => [field.id, field.id])), gridFields: group.repeats.grid.map(field => requirementAnswerKey(field, "child")) } };
}

import type { ClientEntityId } from "./organizations";
import type { SiteId } from "./sites";
import type { FieldId } from "./fields";

export type ConditionId = `condition-${string}`;
export type ConditionOperator = "equals" | "notEquals" | "includes" | "oneOf";

export type ConditionClause = {
  fieldId: FieldId;
  operator: ConditionOperator;
  value: unknown;
};

export type ConditionDefinition = {
  id: ConditionId;
  conditions: ConditionClause[];
  match: "all" | "any";
};

export type RuleId = `rule-${string}`;
export type RuleDefinition = {
  organization?: import("./ruleOrganization").RuleOrganization;
  execution?: import("./routingRules").RoutingRuleExecution;
  id: RuleId;
  categories?: string[];
  documentationStatus?: "current" | "planned";
  sequence?: number;
  dependsOn?: RuleId[];
  documentedIn?: "rules" | "fields" | "components" | "configurations" | "validation";
  area: string;
  rule: string;
  behavior: string;
  ref: string;
  type?: "behavioral" | "conditional";
  scope?: "global" | "client" | "site";
  conditionIds?: ConditionId[];
  clientIds?: ClientEntityId[];
  siteIds?: SiteId[];
};

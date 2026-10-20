import type { LibraryMetadata } from "../../domain/provenance";
import type { ConditionDefinition, RuleDefinition } from "../../domain/rules";
import type { LibraryRow } from "./catalog";

export type ConditionRow = LibraryRow<ConditionDefinition>;
export type RuleRow = LibraryRow<Omit<RuleDefinition, "scope" | "siteIds" | "clientIds" | "conditionIds">>;
export interface RuleConditionRow extends Partial<LibraryMetadata> { id: string; key: string; ruleKey: string; conditionKey: string; position: number }
export interface RuleActionRow extends LibraryRow<{ kind: "documented-behavior"; description: string; source: string } | { kind: "rule-documentation"; version: 2 }> { ruleKey: string }

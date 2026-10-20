// Generated storage contracts; business relationships use stable semantic keys.
import type { Json } from "./common";
import type { LibraryMetadata } from "../../domain/provenance";
export interface Patterns extends LibraryMetadata {
  id: string;
  key: string;
  name: string;
  category: string;
  description: string;
  version: string | null;
  status: string;
}
export interface RulePredicates extends LibraryMetadata {
  id: string;
  key: string;
  ruleKey: string;
  fact: string;
  operator: string;
  value: Json;
  position: number;
}
export interface StructuredRuleActions extends LibraryMetadata {
  id: string;
  key: string;
  ruleKey: string;
  actionType: string;
  value: Json | null;
  position: number;
}
export interface PatternAssignments extends LibraryMetadata {
  id: string;
  key: string;
  patternKey: string;
  clientKey: string | null;
  siteKey: string | null;
  productKey: string | null;
  applicantKey: string | null;
  configuration: Json;
}
export interface PatternRules extends LibraryMetadata {
  id: string;
  key: string;
  patternKey: string;
  relatedKey: string;
  relationshipType: string;
}
export interface PatternConditions extends LibraryMetadata {
  id: string;
  key: string;
  patternKey: string;
  relatedKey: string;
  relationshipType: string;
}
export interface PatternFlagDefinitions extends LibraryMetadata {
  id: string;
  key: string;
  patternKey: string;
  relatedKey: string;
  relationshipType: string;
}
export interface PatternFlows extends LibraryMetadata {
  id: string;
  key: string;
  patternKey: string;
  relatedKey: string;
  relationshipType: string;
}
export interface PatternProducts extends LibraryMetadata {
  id: string;
  key: string;
  patternKey: string;
  relatedKey: string;
  relationshipType: string;
}
export interface PatternCoverageCategories extends LibraryMetadata {
  id: string;
  key: string;
  patternKey: string;
  relatedKey: string;
  relationshipType: string;
}
export interface PatternConfigurationDefinitions extends LibraryMetadata {
  id: string;
  key: string;
  patternKey: string;
  relatedKey: string;
  relationshipType: string;
}
export interface PatternQuestionSets extends LibraryMetadata {
  id: string;
  key: string;
  patternKey: string;
  relatedKey: string;
  relationshipType: string;
}

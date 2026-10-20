// Generated storage contracts; business relationships use stable semantic keys.
import type { Json } from "./common";
import type { LibraryMetadata } from "../../domain/provenance";
export interface FlagDefinitions extends LibraryMetadata {
  id: string;
  key: string;
  name: string;
  level: string;
  valueType: string;
  persistence: string;
  description: string;
  allowedValues: Json | null;
  derivation: string | null;
}
export interface FlagValues extends LibraryMetadata {
  id: string;
  key: string;
  flagKey: string;
  value: string;
}
export interface FlagAssignments extends LibraryMetadata {
  id: string;
  key: string;
  flagKey: string;
  clientKey: string | null;
  siteKey: string | null;
  productKey: string | null;
  coverageKey: string | null;
  riderKey: string | null;
  applicantKey: string | null;
  applicationId: string | null;
  value: Json;
}
export interface FlagRules extends LibraryMetadata {
  id: string;
  key: string;
  flagKey: string;
  conditionKey: string;
  value: Json;
  priority: number;
}
export interface RuleFlags extends LibraryMetadata {
  id: string;
  key: string;
  ruleKey: string;
  flagKey: string;
  operator: string;
  value: Json;
}

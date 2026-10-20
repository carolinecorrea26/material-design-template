/** Compatibility surface retained through the migration validation gate. */
export type * from "../domain/organizations";
export type * from "../domain/associations";
export type * from "../domain/sites";
export type * from "../domain/pages";
export type * from "../domain/content";
export type { CoverageCategoryEntityId, RiderId, CoverageCategory, CoverageProduct, Rider } from "../domain/coverage";
export type { ConfigurationId, ConfigurationDefinition } from "../domain/configuration";
export type { RuleId, RuleDefinition } from "../domain/rules";
export type { Field } from "../domain/fields";
export type { FlowId } from "../domain/flows";
export type FlowDefinition = Pick<import("../domain/flows").FlowDefinition, "id" | "title">;

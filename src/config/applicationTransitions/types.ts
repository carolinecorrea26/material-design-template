import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type { FieldId } from "../fields/types";

export type OverwritePolicy = "always" | "if-empty";

export type FieldValueMapping<Source extends Record<string, unknown>> = {
  source: keyof Source & string;
  targetFieldId: FieldId;
  overwrite?: OverwritePolicy;
  include?: (source: Source) => boolean;
};

export type StructuredApplicationStateKey =
  | "coverageSelections"
  | "selectedCategoryChips"
  | "productApplicants"
  | "coverageAmounts";

export type StructuredValueMapping<Source extends Record<string, unknown>> = {
  target: StructuredApplicationStateKey;
  resolve: (source: Source) => ApplicationFormValues[string];
  overwrite?: OverwritePolicy;
};

export type ApplicationTransitionDefinition<
  Source extends Record<string, unknown>,
> = {
  id: string;
  trigger: string;
  fieldMappings: FieldValueMapping<Source>[];
  structuredMappings?: StructuredValueMapping<Source>[];
};

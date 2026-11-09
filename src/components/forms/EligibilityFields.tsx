import { resolveMappedFields } from "../../domain/requirementFields";
import { requirementText } from "../../domain/requirementContent";
import { requirementValidationMessage } from '../../domain/requirementValidations';
import { fieldValidationChecks } from '../../utils/fieldValidation';
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Stack } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ControlledFieldRenderer from "./ControlledFieldRenderer";
import FieldRenderer from "./FieldRenderer";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import type { FieldDefinition, FieldOption } from "../../config/fields/types";
import { deriveStateProvinceFromZipOrPostalCode } from "../../utils/zipToStateProvince";
import { calculateAge } from "../../utils/calculateAge";

export type EligibilityValues = { birthday: string; zipCode: string; state: string };
export type EligibilityPresentation = { fields?: FieldDefinition[]; eligibleStatesOnly?: boolean; maxAge?: number | null };
const defaultFields = resolveMappedFields({ component: "eligibility" }).filter(field => ["zip-postal-code", "state-province", "birth-date"].includes(field.id));
type QuoteProps = EligibilityPresentation & {
  values: EligibilityValues;
  onChange: (next: Partial<EligibilityValues>) => void;
  attempted: boolean;
  eligibilityError?: string;
  idPrefix?: string;
};
type ApplicationProps = EligibilityPresentation & {
  form: Pick<FormRouteRenderProps, "control" | "errors" | "watchedValues" | "setValue">;
  fields: FieldDefinition[];
};
const emptyStateOptions: FieldOption[] = [];
const fieldKeys = { birthday: "birth-date", zipCode: "zip-postal-code", state: "state-province" } as const;
const valueKeys = { "birth-date": "birthday", "zip-postal-code": "zipCode", "state-province": "state" } as const;

/** Shared ZIP / State / Birthday group for application Eligibility and quote tools.
 * The form adapter preserves application registration; the controlled adapter
 * preserves quote-owned values. Both use the same derivation, feedback and layout.
 */
export default function EligibilityFields(props: QuoteProps | ApplicationProps) {
  const application = "form" in props ? props : undefined;
  const quote = "values" in props ? props : undefined;
  const fields = (props.fields ?? defaultFields).filter(field => Object.hasOwn(valueKeys, field.id));
  const values = quote?.values ?? {
    zipCode: String(application?.form.watchedValues["zip-postal-code"] ?? ""),
    state: String(application?.form.watchedValues["state-province"] ?? ""),
    birthday: String(application?.form.watchedValues["birth-date"] ?? ""),
  };
  const onChange = quote?.onChange;
  const setValue = application?.form.setValue;
  const update = useCallback((key: keyof EligibilityValues, value: string) => {
    if (setValue) setValue(fieldKeys[key], value, { shouldDirty: true, shouldValidate: true });
    else onChange?.({ [key]: value });
  }, [setValue, onChange]);
  const stateField = fields.find(field => field.id === "state-province");
  const stateOptions = stateField?.options ?? emptyStateOptions;
  const eligibleStatesOnly = props.eligibleStatesOnly;
  const lastDerivedZip = useRef("");
  const messageFrame = useRef<number | null>(null);
  const messageTimeout = useRef<number | null>(null);
  const [showInferredState, setShowInferredState] = useState(false);
  const clearMessage = useCallback(() => {
    if (messageFrame.current !== null) window.cancelAnimationFrame(messageFrame.current);
    if (messageTimeout.current !== null) window.clearTimeout(messageTimeout.current);
  }, []);
  useEffect(() => clearMessage, [clearMessage]);

  useEffect(() => {
    if (values.zipCode === lastDerivedZip.current) return;
    lastDerivedZip.current = values.zipCode;
    clearMessage();
    setShowInferredState(false);
    if (values.zipCode.trim().length < 5) return;
    const derived = deriveStateProvinceFromZipOrPostalCode(values.zipCode, stateOptions);
    if (!derived) return;
    if (derived !== values.state) update("state", derived);
    messageFrame.current = window.requestAnimationFrame(() => setShowInferredState(true));
    messageTimeout.current = window.setTimeout(() => setShowInferredState(false), 4000);
  }, [values.zipCode, values.state, stateOptions, eligibleStatesOnly, update, clearMessage]);

  const { errors: quoteErrors } = validateEligibility(values, { ...props, fields });
  // Use the standard field gap; empty feedback rows must not add another gap.
  return <Stack spacing={2} useFlexGap>
    {fields.map(field => {
      const key = valueKeys[field.id as keyof typeof valueKeys];
      const feedback = key === "state" && showInferredState ? <Box component="span" role="status" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "success.main", fontWeight: 500 }}>
        <CheckRoundedIcon sx={{ fontSize: 16 }} />{requirementText("eligibility.inferred-state")}
      </Box> : undefined;
      const onValueChange = () => {
        if (key === "state") {
          lastDerivedZip.current = values.zipCode;
          clearMessage();
          setShowInferredState(false);
        }
      };
      return application ? <FieldRenderer key={field.id} field={field} control={application.form.control}
        errors={application.form.errors}
        margin="none" feedback={feedback} onValueChange={onValueChange}
      /> : <ControlledFieldRenderer key={field.id} field={{ ...field, id: `${quote?.idPrefix ?? "elig"}-${field.id}` }}
        value={values[key]} error={quote?.attempted ? quoteErrors[key] : undefined}
        feedback={feedback}
        onChange={value => { onValueChange(); update(key, String(value)); }}
      />;
    })}
    {quote?.eligibilityError && <Alert severity="error">{quote.eligibilityError}</Alert>}
  </Stack>;
}

/**
 * Validates eligibility values and returns field-level errors.
 * Supplied field definitions own inline checks. Existing eligibility checks
 * return the shared page-level message independently of field errors.
 */
export function validateEligibility(values: EligibilityValues, { fields = defaultFields, maxAge = 80, eligibleStatesOnly }: EligibilityPresentation = {}): {
  errors: Record<string, string>;
  eligibilityError: string;
  isValid: boolean;
} {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const key = valueKeys[field.id as keyof typeof valueKeys];
    if (!key) continue;
    const invalid = fieldValidationChecks(field).find(check => !check.validate(values[key]));
    if (invalid) errors[key] = invalid.message;
  }

  let eligibilityError = "";
  const stateOptions = fields.find(field => field.id === 'state-province')?.options ?? [];
  if (eligibleStatesOnly && values.state && !stateOptions.some(option => option.value === values.state)) eligibilityError = requirementValidationMessage('eligible-state-required');
  if (Object.keys(errors).length === 0) {
    const age = calculateAge(values.birthday);
    if (maxAge !== null && age !== null && age >= maxAge) {
      eligibilityError = requirementValidationMessage('applicant-ineligible');
    }
  }

  return {
    errors,
    eligibilityError,
    isValid: Object.keys(errors).length === 0 && !eligibilityError,
  };
}

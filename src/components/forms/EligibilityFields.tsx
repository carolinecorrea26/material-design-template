import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { fieldCatalog } from "../../config/fields";
import {
  deriveStateProvinceFromZipOrPostalCode,
  formatZipOrPostalCode,
} from "../../utils/zipToStateProvince";
import {
  parseStoredDate,
  formatDateForStorage,
  formatDateDisplay,
} from "../../utils/dateFormatting";
import { calculateAge } from "../../utils/calculateAge";

export type EligibilityValues = {
  birthday: string;
  zipCode: string;
  state: string;
};

type EligibilityFieldsProps = {
  values: EligibilityValues;
  onChange: (next: Partial<EligibilityValues>) => void;
  /** When true, validation errors and age error are shown. */
  attempted: boolean;
  /** External age error string (e.g. "age 80 or older" message). Cleared by caller. */
  ageError?: string;
  /** ID prefix for label/select elements — avoids duplicate IDs when rendered multiple times. */
  idPrefix?: string;
};

function getStateOptions() {
  return fieldCatalog["state-province"].options ?? [];
}

/**
 * Reusable DOB + ZIP + State field group.
 * Handles date formatting, auto-deriving state from ZIP, and field-level validation.
 *
 * ZIP auto-sets state on change; the user may then override state manually.
 * If the user edits ZIP again, state is re-derived from the new ZIP.
 *
 * Used on the Home page quote entry card and inside QuoteCalculator
 * when collecting eligibility before showing coverage estimates.
 */
export default function EligibilityFields({
  values,
  onChange,
  attempted,
  ageError,
  idPrefix = "elig",
}: EligibilityFieldsProps) {
  const stateOptions = useMemo(() => getStateOptions(), []);
  const [dobFocused, setDobFocused] = useState(false);

  // Track the zip that last auto-set the state, so we only re-derive when zip changes.
  const lastDerivedZipRef = useRef<string>("");

  // Auto-derive state from zip whenever zip changes (but not on manual state edits).
  useEffect(() => {
    if (values.zipCode === lastDerivedZipRef.current) return;

    const derived = deriveStateProvinceFromZipOrPostalCode(
      values.zipCode,
      stateOptions,
    );
    lastDerivedZipRef.current = values.zipCode;

    if (derived && derived !== values.state) {
      onChange({ state: derived });
    }
  }, [values.zipCode, stateOptions, values.state, onChange]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!values.birthday) {
      e.birthday = "Date of birth is required.";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.birthday)) {
      e.birthday = "Enter a complete date (MM/DD/YYYY).";
    }
    if (!values.zipCode) e.zipCode = "ZIP / postal code is required.";
    if (!values.state) e.state = "State is required.";
    return e;
  }, [values.birthday, values.zipCode, values.state]);

  /** Returns true if all fields pass validation. */
  const isValid = Object.keys(errors).length === 0;
  // Expose for callers that need to check validity before submitting
  void isValid;

  const stateLabelId = `${idPrefix}-state-label`;

  function handleZipChange(rawValue: string) {
    const formatted = formatZipOrPostalCode(rawValue);
    // Reset the "last derived" ref so the effect re-runs for the new zip.
    lastDerivedZipRef.current = "";
    onChange({ zipCode: formatted });
  }

  function handleStateChange(newState: string) {
    // Update the "last derived" zip ref to the current zip so the effect
    // doesn't immediately override the user's manual selection.
    lastDerivedZipRef.current = values.zipCode;
    onChange({ state: newState });
  }

  return (
    <Stack spacing={2}>
      <TextField
        label="Date of Birth"
        fullWidth
        required
        placeholder="MM/DD/YYYY"
        value={parseStoredDate(values.birthday)}
        onChange={(event) => {
          const formatted = formatDateDisplay(event.target.value);
          const digits = formatted.replace(/\D/g, "");
          if (digits.length === 8) {
            onChange({ birthday: formatDateForStorage(formatted) });
          } else {
            onChange({ birthday: formatted });
          }
        }}
        onFocus={() => setDobFocused(true)}
        onBlur={() => setDobFocused(false)}
        inputProps={{ inputMode: "numeric" }}
        InputLabelProps={{ shrink: dobFocused || !!values.birthday }}
        error={attempted && !!errors.birthday}
        helperText={
          attempted && errors.birthday ? errors.birthday : undefined
        }
      />

      <TextField
        label="ZIP / Postal Code"
        fullWidth
        required
        value={values.zipCode}
        onChange={(event) => handleZipChange(event.target.value)}
        inputProps={{ inputMode: "text", maxLength: 7 }}
        error={attempted && !!errors.zipCode}
        helperText={attempted ? errors.zipCode || undefined : undefined}
      />

      <FormControl fullWidth required error={attempted && !!errors.state}>
        <InputLabel id={stateLabelId}>State</InputLabel>
        <Select
          labelId={stateLabelId}
          label="State"
          value={values.state}
          onChange={(event) => handleStateChange(event.target.value)}
        >
          {stateOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {attempted && errors.state && (
          <FormHelperText>{errors.state}</FormHelperText>
        )}
      </FormControl>

      {ageError && <Alert severity="error">{ageError}</Alert>}
    </Stack>
  );
}

/**
 * Validates eligibility values and returns field-level errors.
 * Also performs the age >= 80 check and returns an ageError string if applicable.
 */
export function validateEligibility(values: EligibilityValues): {
  errors: Record<string, string>;
  ageError: string;
  isValid: boolean;
} {
  const errors: Record<string, string> = {};
  if (!values.birthday) {
    errors.birthday = "Date of birth is required.";
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.birthday)) {
    errors.birthday = "Enter a complete date (MM/DD/YYYY).";
  }
  if (!values.zipCode) errors.zipCode = "ZIP / postal code is required.";
  if (!values.state) errors.state = "State is required.";

  let ageError = "";
  if (Object.keys(errors).length === 0) {
    const age = calculateAge(values.birthday);
    if (age !== null && age >= 80) {
      ageError =
        "We're sorry, but coverage is not available for applicants age 80 or older.";
    }
  }

  return {
    errors,
    ageError,
    isValid: Object.keys(errors).length === 0 && !ageError,
  };
}

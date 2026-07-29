import {
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  type TextFieldProps,
} from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import type { FieldDefinition, FieldOption } from "../../config/fields/types";
import SelectionGroup from "./SelectionGroup";
import {
  parseStoredDate,
  formatDateForStorage,
  formatDateDisplay,
} from "../../utils/dateFormatting";

type FormValues = Record<string, string | boolean | string[]>;

type FieldRendererProps = {
  field: FieldDefinition;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  hideLabel?: boolean;
  margin?: "none" | "dense" | "normal";
  onValueChange?: () => void;
};

type FieldStatusState = {
  hasError?: boolean;
};

const CURRENCY_FIELD_IDS = new Set([
  "average-monthly-income",
  "spouse-average-monthly-income",
  "monthly-business-expenses",
]);

function isCurrencyField(field: FieldDefinition) {
  return field.format === "currency" || CURRENCY_FIELD_IDS.has(field.id);
}

function isZipOrPostalField(field: FieldDefinition) {
  return field.id.includes("zip") || field.autoComplete === "postal-code";
}

function getValidationRules(field: FieldDefinition) {
  const rules: {
    required?: string | { value: true; message: string };
    validate?: (value: unknown) => true | string;
  } = {};

  if (field.inputType === "checkbox") {
    if (field.required) {
      rules.validate = (value) => value === true || "This field is required.";
    }

    return rules;
  }

  if (field.inputType === "checkbox-group") {
    if (field.required) {
      rules.validate = (value) =>
        Array.isArray(value) && value.length > 0
          ? true
          : "Select at least one option.";
    }

    return rules;
  }

  if (field.inputType === "multi-select") {
    if (field.required) {
      rules.validate = (value) =>
        Array.isArray(value) && value.length > 0
          ? true
          : "Select at least one option.";
    }

    return rules;
  }

  if (field.required) {
    rules.required = "This field is required.";
  }

  if (isZipOrPostalField(field)) {
    rules.validate = (value) => {
      if (!value) return true;
      return String(value).trim().length >= 5
        ? true
        : "Enter a valid ZIP / Postal Code.";
    };
  }

  if (field.format === "email") {
    rules.validate = (value) => {
      if (!value) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
        ? true
        : "Enter a valid email address.";
    };
  }

  if (field.format === "phone") {
    rules.validate = (value) => {
      if (!value) return true;
      const digits = String(value).replace(/\D/g, "");
      return digits.length === 10
        ? true
        : "Enter a valid 10-digit phone number.";
    };
  }

  if (field.format === "ssn") {
    rules.validate = (value) => {
      if (!value) return true;
      const digits = String(value).replace(/\D/g, "");
      return digits.length === 9 ? true : "Enter a valid 9-digit SSN.";
    };
  }

  if (field.format === "percent") {
    rules.validate = (value) => {
      if (!value) return true;
      const digits = String(value).replace(/\D/g, "");
      return digits.length <= 3
        ? true
        : "Enter a percent value with up to 3 digits.";
    };
  }

  if (field.inputType === "number") {
    rules.validate = (value) => {
      if (!value) return true;
      return /^\d+$/.test(String(value)) ? true : "Enter numbers only.";
    };
  }

  return rules;
}

function sanitizeDigits(value: string, maxDigits?: number) {
  const digits = value.replace(/\D/g, "");
  if (typeof maxDigits === "number") {
    return digits.slice(0, maxDigits);
  }
  return digits;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatSsn(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 9);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
}

function maskSsnWithLastVisible(value: string, showLast: boolean) {
  const digits = value.replace(/\D/g, "");
  if (!digits || !showLast) {
    return value.replace(/\d/g, "\u2022");
  }
  // Show the last digit, mask the rest
  let result = "";
  let digitsSeen = 0;
  for (let i = 0; i < value.length; i++) {
    if (/\d/.test(value[i])) {
      digitsSeen++;
      if (digitsSeen === digits.length) {
        result += value[i]; // Show last digit
      } else {
        result += "\u2022";
      }
    } else {
      result += value[i];
    }
  }
  return result;
}

function formatCurrency(value: unknown) {
  const normalized = typeof value === "string" ? value : String(value ?? "");
  const digits = sanitizeDigits(normalized, 12);

  if (!digits) {
    return "";
  }

  return `$${Number(digits).toLocaleString("en-US")}`;
}

function formatPercent(value: string) {
  return sanitizeDigits(value, 3);
}

function getLabelVariant(field: FieldDefinition) {
  if (field.labelVariant) return field.labelVariant;
  // Auto-switch to standard (external) label for long labels to prevent clipping
  if (field.label && field.label.length >= 40) return "standard";
  return "floating";
}

function hasCompletedValue(field: FieldDefinition, value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const stringValue = String(value ?? "").trim();

  if (!stringValue) {
    return false;
  }

  if (isZipOrPostalField(field)) {
    return stringValue.length >= 5;
  }

  if (field.format === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue);
  }

  if (field.format === "phone") {
    return stringValue.replace(/\D/g, "").length === 10;
  }

  if (field.format === "ssn") {
    return stringValue.replace(/\D/g, "").length === 9;
  }

  if (field.format === "percent") {
    return stringValue.replace(/\D/g, "").length > 0;
  }

  if (field.inputType === "number") {
    return /^\d+$/.test(stringValue);
  }

  if (field.inputType === "date") {
    return (
      /^\d{2}\/\d{2}\/\d{4}$/.test(stringValue) ||
      /^\d{4}-\d{2}-\d{2}$/.test(stringValue)
    );
  }

  return stringValue.length >= 2;
}

function inputChecksEnabled() {
  return new URLSearchParams(window.location.search).has("inputChecks");
}

function isFieldComplete(
  field: FieldDefinition,
  value: unknown,
  statusState?: FieldStatusState,
) {
  if (!inputChecksEnabled()) return false;
  if (statusState?.hasError) return false;
  return hasCompletedValue(field, value);
}

function isFieldInError(statusState?: FieldStatusState) {
  if (!inputChecksEnabled()) return false;
  return Boolean(statusState?.hasError);
}

function renderCompletedIcon(sx = {}) {
  return (
    <CheckCircleRoundedIcon
      aria-label="Completed"
      sx={{
        color: "success.main",
        fontSize: { xs: "1rem", md: "1.25rem" },
        flexShrink: 0,
        ...sx,
      }}
    />
  );
}

function renderErrorIcon(sx = {}) {
  return (
    <HighlightOffRoundedIcon
      aria-label="Error"
      sx={{
        color: "error.main",
        fontSize: { xs: "1rem", md: "1.25rem" },
        flexShrink: 0,
        ...sx,
      }}
    />
  );
}

function renderCompletedAdornment(existingAdornment?: ReactNode) {
  return (
    <>
      {existingAdornment}
      <InputAdornment position="end">{renderCompletedIcon()}</InputAdornment>
    </>
  );
}

function renderErrorAdornment(existingAdornment?: ReactNode) {
  return (
    <>
      {existingAdornment}
      <InputAdornment position="end">{renderErrorIcon()}</InputAdornment>
    </>
  );
}

function renderCompletedSelectIcon() {
  return renderCompletedIcon({
    position: "absolute",
    right: 40,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    zIndex: 1,
  });
}

function renderErrorSelectIcon() {
  return renderErrorIcon({
    position: "absolute",
    right: 40,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    zIndex: 1,
  });
}

function renderFieldLabel(field: FieldDefinition) {
  return (
    <Box
      component="span"
      sx={{ display: "inline", alignItems: "center", gap: 0.5 }}
    >
      <span>{field.label}</span>
      {field.tooltip ? (
        <Tooltip title={field.tooltip} arrow>
          <InfoOutlinedIcon sx={{ fontSize: "1rem", color: "action.active" }} />
        </Tooltip>
      ) : null}
    </Box>
  );
}

const controlSx = {
  p: 0,
  pointerEvents: "none",
  color: "text.primary",
  "&.Mui-checked": {
    color: "primary.main",
  },
  "&:hover": {
    backgroundColor: "action.hover",
  },
  "&.Mui-checked:hover": {
    backgroundColor: "action.hover",
  },
};

function SsnField({
  field,
  control,
  validationRules,
  renderTextLikeField,
}: {
  field: FieldDefinition;
  control: Control<any>;
  validationRules: Record<string, unknown>;
  renderTextLikeField: (
    controllerField: any,
    fieldState: any,
    options?: any,
  ) => ReactNode;
}) {
  const [showLastDigit, setShowLastDigit] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <Controller
      name={field.id}
      control={control}
      rules={validationRules}
      render={({ field: controllerField, fieldState }) => {
        const realValue = (controllerField.value as string) ?? "";
        const maskedDisplay = maskSsnWithLastVisible(realValue, showLastDigit);
        return renderTextLikeField(controllerField, fieldState, {
          value: maskedDisplay,
          onChange: (event: ChangeEvent<HTMLInputElement>) => {
            const inputVal = event.target.value;
            const newDigits = inputVal.replace(/[^\d]/g, "");
            const existingDigits = realValue.replace(/\D/g, "");
            // Count bullets in display vs input to detect deletion
            const maskedBullets = maskedDisplay.replace(
              /[^\u2022]/g,
              "",
            ).length;
            const inputBullets = inputVal.replace(/[^\u2022]/g, "").length;

            if (inputBullets < maskedBullets && newDigits.length === 0) {
              // Deletion: remove last digit(s)
              const trimmed = existingDigits.slice(0, inputBullets);
              controllerField.onChange(formatSsn(trimmed));
              setShowLastDigit(false);
            } else {
              // Addition: append new digits to existing
              const combined = (existingDigits + newDigits).slice(0, 9);
              controllerField.onChange(formatSsn(combined));

              // Show the last digit briefly
              setShowLastDigit(true);
              if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
              hideTimerRef.current = setTimeout(() => {
                setShowLastDigit(false);
              }, 800);
            }
          },
          inputProps: {
            autoComplete: "off",
            "aria-label": field.label || "Social Security Number",
          },
        }) as ReactElement;
      }}
    />
  );
}

export default function FieldRenderer({
  field,
  control,
  errors,
  hideLabel = false,
  margin = "normal",
  onValueChange,
}: FieldRendererProps) {
  const validationRules = getValidationRules(field);
  const fieldError = errors[field.id]?.message as string | undefined;
  const resolvedHelperText = fieldError ?? field.helperText;

  const hasError = Boolean(errors[field.id]);
  const statusState: FieldStatusState = { hasError };

  function renderTextLikeField(
    controllerField: {
      value: unknown;
      onChange: (value: string) => void;
      onBlur: () => void;
    },
    _fieldState?: unknown,
    options: {
      type?: string;
      value?: string;
      onChange?: (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => void;
      placeholder?: string;
      inputProps?: Record<string, unknown>;
      inputAdornmentProps?: TextFieldProps["InputProps"];
    } = {},
  ) {
    const labelVariant = getLabelVariant(field);
    const value = options.value ?? (controllerField.value as string) ?? "";
    const hasCustomEndAdornment = Boolean(
      options.inputAdornmentProps?.endAdornment,
    );
    const isComplete =
      !field.multiline && isFieldComplete(field, value, statusState);
    const showError = !field.multiline && isFieldInError(statusState);
    const inputPropsWithCompletion = {
      ...options.inputAdornmentProps,
      endAdornment: hasCustomEndAdornment
        ? options.inputAdornmentProps?.endAdornment
        : isComplete
          ? renderCompletedAdornment()
          : showError
            ? renderErrorAdornment()
            : undefined,
    };
    const handleChange =
      options.onChange ??
      ((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        controllerField.onChange(event.target.value);
        onValueChange?.();
      });

    const textField = (
      <TextField
        name={field.id}
        label={
          labelVariant === "floating" ? renderFieldLabel(field) : undefined
        }
        required={field.required}
        type={options.type ?? "text"}
        fullWidth
        margin={labelVariant === "floating" ? "normal" : "none"}
        placeholder={options.placeholder ?? field.placeholder}
        autoComplete={field.autoComplete}
        inputProps={{ inputMode: field.inputMode, ...options.inputProps }}
        value={value}
        onChange={handleChange}
        onBlur={controllerField.onBlur}
        disabled={field.disabled}
        error={Boolean(errors[field.id])}
        helperText={
          labelVariant === "floating" ? resolvedHelperText : undefined
        }
        multiline={field.multiline}
        minRows={field.multiline ? (field.minRows ?? 3) : undefined}
        InputProps={inputPropsWithCompletion}
      />
    );

    if (labelVariant === "floating") {
      return textField;
    }

    return (
      <FormControl fullWidth margin={margin} error={Boolean(errors[field.id])}>
        {!hideLabel ? (
          <FormLabel required={field.required} sx={{ mb: 1 }}>
            {renderFieldLabel(field)}
          </FormLabel>
        ) : null}
        {textField}
        <FormHelperText>{resolvedHelperText}</FormHelperText>
      </FormControl>
    );
  }

  if (field.inputType === "radio") {
    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField }) => {
          const isComplete = isFieldComplete(
            field,
            controllerField.value,
            statusState,
          );
          const showError = isFieldInError(statusState);

          return (
            <FormControl
              fullWidth
              margin={margin}
              error={Boolean(errors[field.id])}
            >
              {!hideLabel ? (
                <FormLabel
                  required={field.required}
                  sx={{ display: "block", mb: 1 }}
                  id={`${field.id}-label`}
                >
                  {renderFieldLabel(field)}
                </FormLabel>
              ) : null}

              <Box
                role="radiogroup"
                aria-labelledby={`${field.id}-label`}
                onBlur={controllerField.onBlur}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  gap: 1,
                  mt: hideLabel ? 0 : 1,
                }}
              >
                {(field.options ?? []).map((option) => {
                  const checked = controllerField.value === option.value;

                  return (
                    <SelectionGroup
                      key={option.value}
                      role="radio"
                      aria-checked={checked}
                      tabIndex={checked ? 0 : -1}
                      onClick={() => {
                        controllerField.onChange(option.value);
                        onValueChange?.();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          controllerField.onChange(option.value);
                          onValueChange?.();
                        }
                      }}
                    >
                      <Radio
                        checked={checked}
                        size="small"
                        sx={controlSx}
                        tabIndex={-1}
                        aria-hidden
                      />
                      <Box
                        component="span"
                        className="SelectionGroup-label"
                        sx={{ fontSize: "0.875rem", flex: 1 }}
                      >
                        {option.label}
                      </Box>
                      {isComplete && checked
                        ? renderCompletedIcon({ ml: "auto" })
                        : showError && checked
                          ? renderErrorIcon({ ml: "auto" })
                          : null}
                    </SelectionGroup>
                  );
                })}
              </Box>

              <FormHelperText>{resolvedHelperText}</FormHelperText>
            </FormControl>
          );
        }}
      />
    );
  }

  if (field.inputType === "dropdown") {
    const labelVariant = getLabelVariant(field);
    const labelId = `${field.id}-label`;

    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField }) => {
          const value = (controllerField.value as string) ?? "";
          const isComplete = isFieldComplete(field, value, statusState);
          const showError = isFieldInError(statusState);
          const hasIcon = isComplete || showError;

          return (
            <FormControl
              fullWidth
              margin={margin}
              error={Boolean(errors[field.id])}
            >
              {labelVariant === "standard" ? (
                <>
                  {!hideLabel ? (
                    <FormLabel required={field.required} sx={{ mb: 1 }}>
                      {renderFieldLabel(field)}
                    </FormLabel>
                  ) : null}
                  <Box sx={{ position: "relative" }}>
                    <Select
                      fullWidth
                      name={field.id}
                      value={value}
                      onChange={(event) => {
                        controllerField.onChange(event.target.value);
                        onValueChange?.();
                      }}
                      onBlur={controllerField.onBlur}
                      displayEmpty
                      disabled={field.disabled}
                      inputProps={{ autoComplete: field.autoComplete ?? "off" }}
                      sx={{
                        "& .MuiSelect-select": {
                          pr: hasIcon ? "64px !important" : undefined,
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>{field.placeholder ?? "Select"}</em>
                      </MenuItem>
                      {(field.options ?? []).map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {isComplete
                      ? renderCompletedSelectIcon()
                      : showError
                        ? renderErrorSelectIcon()
                        : null}
                  </Box>
                </>
              ) : (
                <>
                  <InputLabel id={labelId} required={field.required}>
                    {renderFieldLabel(field)}
                  </InputLabel>
                  <Box sx={{ position: "relative" }}>
                    <Select
                      fullWidth
                      name={field.id}
                      labelId={labelId}
                      label={field.label}
                      value={value}
                      onChange={(event) => {
                        controllerField.onChange(event.target.value);
                        onValueChange?.();
                      }}
                      onBlur={controllerField.onBlur}
                      disabled={field.disabled}
                      inputProps={{ autoComplete: field.autoComplete ?? "off" }}
                      sx={{
                        "& .MuiSelect-select": {
                          pr: hasIcon ? "64px !important" : undefined,
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>{field.placeholder ?? "Select"}</em>
                      </MenuItem>
                      {(field.options ?? []).map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {isComplete
                      ? renderCompletedSelectIcon()
                      : showError
                        ? renderErrorSelectIcon()
                        : null}
                  </Box>
                </>
              )}

              <FormHelperText>{resolvedHelperText}</FormHelperText>
            </FormControl>
          );
        }}
      />
    );
  }

  if (field.inputType === "searchable-select") {
    const labelVariant = getLabelVariant(field);

    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField }) => {
          const value = (controllerField.value as string) ?? "";
          const selectedOption =
            (field.options ?? []).find((option) => option.value === value) ??
            null;
          const isComplete = isFieldComplete(field, value, statusState);
          const showError = isFieldInError(statusState);
          const statusAdornment = isComplete
            ? renderCompletedAdornment()
            : showError
              ? renderErrorAdornment()
              : null;

          const autocomplete = (
            <Autocomplete<FieldOption, false, false, false>
              fullWidth
              options={field.options ?? []}
              value={selectedOption}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, selected) =>
                option.value === selected.value
              }
              onChange={(_, option) => {
                controllerField.onChange(option?.value ?? "");
                onValueChange?.();
              }}
              onBlur={controllerField.onBlur}
              disabled={field.disabled}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name={field.id}
                  label={
                    labelVariant === "floating"
                      ? renderFieldLabel(field)
                      : undefined
                  }
                  required={field.required}
                  margin={labelVariant === "floating" ? "normal" : "none"}
                  placeholder={field.placeholder}
                  error={Boolean(errors[field.id])}
                  helperText={
                    labelVariant === "floating" ? resolvedHelperText : undefined
                  }
                  inputProps={{
                    ...params.inputProps,
                    autoComplete: field.autoComplete ?? "off",
                  }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {statusAdornment}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          );

          if (labelVariant === "floating") {
            return autocomplete;
          }

          return (
            <FormControl
              fullWidth
              margin={margin}
              error={Boolean(errors[field.id])}
            >
              {!hideLabel ? (
                <FormLabel required={field.required} sx={{ mb: 1 }}>
                  {renderFieldLabel(field)}
                </FormLabel>
              ) : null}
              {autocomplete}
              <FormHelperText>{resolvedHelperText}</FormHelperText>
            </FormControl>
          );
        }}
      />
    );
  }

  if (field.inputType === "multi-select") {
    const labelId = `${field.id}-label`;

    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField }) => {
          const selectedValues = Array.isArray(controllerField.value)
            ? controllerField.value.map(String)
            : [];
          const isComplete = isFieldComplete(
            field,
            selectedValues,
            statusState,
          );
          const showError = isFieldInError(statusState);
          const hasIcon = isComplete || showError;

          return (
            <FormControl
              fullWidth
              margin="normal"
              error={Boolean(errors[field.id])}
              required={field.required}
            >
              <InputLabel id={labelId} required={field.required}>
                {renderFieldLabel(field)}
              </InputLabel>

              <Box sx={{ position: "relative" }}>
                <Select<string[]>
                  fullWidth
                  labelId={labelId}
                  label={field.label}
                  multiple
                  value={selectedValues}
                  onChange={(event) => {
                    const value = event.target.value;
                    controllerField.onChange(
                      typeof value === "string" ? value.split(",") : value,
                    );
                    onValueChange?.();
                  }}
                  onBlur={controllerField.onBlur}
                  renderValue={(selected) => selected.join(", ")}
                  sx={{
                    "& .MuiSelect-select": {
                      pr: hasIcon ? "64px !important" : undefined,
                    },
                  }}
                >
                  {(field.options ?? []).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Checkbox
                        checked={selectedValues.includes(option.value)}
                      />
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {isComplete
                  ? renderCompletedSelectIcon()
                  : showError
                    ? renderErrorSelectIcon()
                    : null}
              </Box>

              <FormHelperText>{resolvedHelperText}</FormHelperText>
            </FormControl>
          );
        }}
      />
    );
  }

  if (field.inputType === "checkbox") {
    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField }) => {
          const isComplete = isFieldComplete(
            field,
            controllerField.value,
            statusState,
          );
          const showError = isFieldInError(statusState);

          return (
            <FormControl
              fullWidth
              margin="normal"
              error={Boolean(errors[field.id])}
            >
              <SelectionGroup>
                <Checkbox
                  checked={Boolean(controllerField.value)}
                  onChange={(event) => {
                    controllerField.onChange(event.target.checked);
                    controllerField.onBlur();
                  }}
                  onBlur={controllerField.onBlur}
                  sx={controlSx}
                />
                <Box
                  component="span"
                  className="SelectionGroup-label"
                  sx={{ flex: 1 }}
                >
                  {field.label}
                  {field.required ? (
                    <Typography
                      component="span"
                      sx={{ color: "error.main", ml: 0.25 }}
                    >
                      *
                    </Typography>
                  ) : null}
                </Box>
                {isComplete
                  ? renderCompletedIcon({ ml: "auto" })
                  : showError
                    ? renderErrorIcon({ ml: "auto" })
                    : null}
              </SelectionGroup>

              <FormHelperText>{resolvedHelperText}</FormHelperText>
            </FormControl>
          );
        }}
      />
    );
  }

  if (field.inputType === "checkbox-group") {
    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField }) => {
          const selectedValues = Array.isArray(controllerField.value)
            ? controllerField.value.map(String)
            : [];
          const isComplete = isFieldComplete(
            field,
            selectedValues,
            statusState,
          );
          const showError = isFieldInError(statusState);

          return (
            <FormControl
              fullWidth
              margin="normal"
              error={Boolean(errors[field.id])}
            >
              <FormLabel
                required={field.required}
                sx={{ display: "block", mb: 1 }}
              >
                {renderFieldLabel(field)}
              </FormLabel>

              <Stack spacing={1} sx={{ mt: 1 }}>
                {(field.options ?? []).map((option) => {
                  const checked = selectedValues.includes(option.value);

                  return (
                    <SelectionGroup key={option.value}>
                      <Checkbox
                        checked={checked}
                        onChange={(event) => {
                          const nextValues = event.target.checked
                            ? [...selectedValues, option.value]
                            : selectedValues.filter(
                                (value) => value !== option.value,
                              );

                          controllerField.onChange(nextValues);
                          controllerField.onBlur();
                        }}
                        onBlur={controllerField.onBlur}
                        sx={controlSx}
                      />
                      <Typography
                        component="span"
                        className="SelectionGroup-label"
                      >
                        {option.label}
                      </Typography>
                      {isComplete && checked
                        ? renderCompletedIcon({ ml: "auto" })
                        : showError
                          ? renderErrorIcon({ ml: "auto" })
                          : null}
                    </SelectionGroup>
                  );
                })}
              </Stack>

              <FormHelperText>{resolvedHelperText}</FormHelperText>
            </FormControl>
          );
        }}
      />
    );
  }

  if (field.inputType === "date") {
    const dateHelperText = fieldError ?? field.helperText ?? "MM/DD/YYYY";
    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField }) => {
          const labelVariant = getLabelVariant(field);
          const displayValue = parseStoredDate(
            (controllerField.value as string) ?? "",
          );
          const isComplete = isFieldComplete(field, displayValue, statusState);
          const showError = isFieldInError(statusState);
          const textField = (
            <TextField
              label={
                labelVariant === "floating"
                  ? renderFieldLabel(field)
                  : undefined
              }
              required={field.required}
              fullWidth
              margin={labelVariant === "floating" ? "normal" : "none"}
              autoComplete={field.autoComplete}
              inputProps={{ inputMode: "numeric" }}
              value={displayValue}
              onChange={(event) => {
                const formatted = formatDateDisplay(event.target.value);
                const digits = formatted.replace(/\D/g, "");
                if (digits.length === 8) {
                  controllerField.onChange(formatDateForStorage(formatted));
                } else {
                  controllerField.onChange(formatted);
                }
                onValueChange?.();
              }}
              onBlur={controllerField.onBlur}
              disabled={field.disabled}
              error={Boolean(errors[field.id])}
              helperText={
                labelVariant === "floating" ? dateHelperText : undefined
              }
              InputProps={{
                endAdornment: isComplete
                  ? renderCompletedAdornment()
                  : showError
                    ? renderErrorAdornment()
                    : undefined,
              }}
            />
          );

          if (labelVariant === "floating") {
            return textField;
          }

          return (
            <FormControl
              fullWidth
              margin={margin}
              error={Boolean(errors[field.id])}
            >
              {!hideLabel ? (
                <FormLabel required={field.required} sx={{ mb: 1 }}>
                  {renderFieldLabel(field)}
                </FormLabel>
              ) : null}
              {textField}
              <FormHelperText>{dateHelperText}</FormHelperText>
            </FormControl>
          );
        }}
      />
    );
  }

  if (isCurrencyField(field)) {
    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField, fieldState }) =>
          renderTextLikeField(controllerField, fieldState, {
            value: formatCurrency(controllerField.value),
            inputProps: { inputMode: field.inputMode ?? "numeric" },
            onChange: (event) => {
              controllerField.onChange(formatCurrency(event.target.value));
              onValueChange?.();
            },
          })
        }
      />
    );
  }

  if (field.format === "percent") {
    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField, fieldState }) =>
          renderTextLikeField(controllerField, fieldState, {
            value: formatPercent((controllerField.value as string) ?? ""),
            inputProps: {
              inputMode: field.inputMode ?? "numeric",
              pattern: "[0-9]*",
              maxLength: 3,
            },
            onChange: (event) => {
              controllerField.onChange(formatPercent(event.target.value));
            },
          })
        }
      />
    );
  }

  const htmlInputType =
    field.format === "email"
      ? "email"
      : field.format === "phone"
        ? "tel"
        : "text";

  if (field.inputType === "number") {
    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField, fieldState }) =>
          renderTextLikeField(controllerField, fieldState, {
            value: (controllerField.value as string) ?? "",
            inputProps: {
              inputMode: field.inputMode ?? "numeric",
              pattern: "[0-9]*",
            },
            onChange: (event) => {
              controllerField.onChange(sanitizeDigits(event.target.value));
              onValueChange?.();
            },
          })
        }
      />
    );
  }

  if (field.format === "phone") {
    const showPhoneTypeSelector = field.showPhoneTypeSelector ?? true;
    const phoneTypeFieldName = field.phoneTypeFieldId ?? "phone-type";

    if (!showPhoneTypeSelector) {
      return (
        <Controller
          key={field.id}
          name={field.id}
          control={control}
          rules={validationRules}
          render={({ field: controllerField, fieldState }) =>
            renderTextLikeField(controllerField, fieldState, {
              type: htmlInputType,
              value: (controllerField.value as string) ?? "",
              onChange: (event) => {
                controllerField.onChange(formatPhone(event.target.value));
              },
            })
          }
        />
      );
    }

    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField }) => {
          const phoneValue = (controllerField.value as string) ?? "";
          const isComplete = isFieldComplete(field, phoneValue, statusState);
          const showError = isFieldInError(statusState);

          return (
            <Controller
              name={phoneTypeFieldName}
              control={control}
              defaultValue="mobile"
              rules={{ required: "Phone Type is required" }}
              render={({ field: phoneTypeField }) =>
                renderTextLikeField(controllerField, undefined, {
                  type: htmlInputType,
                  value: phoneValue,
                  onChange: (event) => {
                    controllerField.onChange(formatPhone(event.target.value));
                  },
                  inputAdornmentProps: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box sx={{ position: "relative" }}>
                          {isComplete
                            ? renderCompletedIcon({
                                position: "absolute",
                                left: -28,
                                top: "50%",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                              })
                            : showError
                              ? renderErrorIcon({
                                  position: "absolute",
                                  left: -28,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  pointerEvents: "none",
                                })
                              : null}
                          <Select
                            value={(phoneTypeField.value as string) ?? "mobile"}
                            onChange={(event) =>
                              phoneTypeField.onChange(event.target.value)
                            }
                            variant="standard"
                            disableUnderline
                            sx={{
                              minWidth: 92,
                              ml: 1,
                              "& .MuiSelect-select": {
                                py: 0.5,
                              },
                            }}
                          >
                            <MenuItem value="mobile">Mobile</MenuItem>
                            <MenuItem value="home">Home</MenuItem>
                            <MenuItem value="business">Business</MenuItem>
                          </Select>
                        </Box>
                      </InputAdornment>
                    ),
                  },
                })
              }
            />
          );
        }}
      />
    );
  }

  if (field.format === "ssn") {
    return (
      <SsnField
        key={field.id}
        field={field}
        control={control}
        validationRules={validationRules}
        renderTextLikeField={renderTextLikeField}
      />
    );
  }

  return (
    <Controller
      key={field.id}
      name={field.id}
      control={control}
      rules={validationRules}
      render={({ field: controllerField, fieldState }) =>
        renderTextLikeField(controllerField, fieldState, {
          type: htmlInputType,
          value: (controllerField.value as string) ?? "",
        })
      }
    />
  );
}

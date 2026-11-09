import { TextLikeField } from "./TextLikeField";
import PhoneField from "./PhoneField";
import { getPhoneTypeFieldId } from "../../domain/phoneFields";
import { getLabelVariant, isZipOrPostalField, isFieldComplete, isFieldInError, renderCompletedIcon, renderErrorIcon, renderCompletedAdornment, renderErrorAdornment, renderCompletedSelectIcon, renderErrorSelectIcon, renderFieldLabel, type FieldStatusState } from "./fieldInputPresentation";
import { getFieldValidationRules } from "../../utils/fieldValidation";
import {
  useRef,
  useContext,
  useState,
  type ChangeEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import {
  Link,
  Autocomplete,
  Box,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  type TextFieldProps,
} from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import type { FieldDefinition, FieldOption } from "../../config/fields/types";
import { fieldCatalog } from "../../config/fields";
import { FieldDefinitionsContext } from "./FieldDefinitionsContext";
import SelectionGroup from "./SelectionGroup";
import RadioSelectionGroup from "./RadioSelectionGroup";
import { formatZipOrPostalCode } from "../../utils/zipToStateProvince";
import {
  parseStoredDate,
  formatDateForStorage,
  formatDateDisplay,
  parseStoredMonthYear,
  formatMonthYearForStorage,
  formatMonthYearDisplay,
} from "../../utils/dateFormatting";

type FormValues = Record<string, string | boolean | string[]>;

type FieldRendererProps = {
  field: FieldDefinition;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  hideLabel?: boolean;
  margin?: "none" | "dense" | "normal";
  onValueChange?: (value?: string | boolean | string[]) => void;
  /** Keep a compact helper line so routine feedback does not move the next input. */
  reserveFeedbackSpace?: boolean;
  feedback?: ReactNode;
};


const SSN_HELPER_TEXT =
  "We protect your personal information using industry-standard security measures and only use it as described in our";

function openPrivacyNoticeModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app:open-privacy-notice"));
}

function renderSsnHelperText() {
  return (
    <>
      {`${SSN_HELPER_TEXT} `}
      <Link
        href="#"
        onClick={(event) => {
          event.preventDefault();
          openPrivacyNoticeModal();
        }}
      >
        Privacy Notice
      </Link>
      .
    </>
  );
}

function isCurrencyField(field: FieldDefinition) {
  return field.format === "currency";
}

const SEARCHABLE_SELECT_OPTION_THRESHOLD = 10;

// Dropdowns with a long option list are hard to scan/scroll, so they render as a
// searchable select once they hit the threshold, unless the field opts out.
function getEffectiveInputType(field: FieldDefinition) {
  if (
    field.inputType === "dropdown" &&
    (field.options?.length ?? 0) >= SEARCHABLE_SELECT_OPTION_THRESHOLD
  ) {
    return "searchable-select" as const;
  }

  return field.inputType;
}

function sanitizeDigits(value: string, maxDigits?: number) {
  const digits = value.replace(/\D/g, "");
  if (typeof maxDigits === "number") {
    return digits.slice(0, maxDigits);
  }
  return digits;
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
  onValueChange,
}: {
  field: FieldDefinition;
  control: Control<any>;
  validationRules: Record<string, unknown>;
  onValueChange?: FieldRendererProps["onValueChange"];
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
            const inputDigits = inputVal.replace(/\D/g, "");
            const existingDigits = realValue.replace(/\D/g, "");
            const visibleDigitSlots = (inputVal.match(/[\u2022\d]/g) ?? [])
              .length;
            const nativeInputEvent = event.nativeEvent as InputEvent;
            const inputType = nativeInputEvent.inputType ?? "";

            let nextDigits = existingDigits;

            if (inputType.startsWith("delete")) {
              const keepCount = Math.min(
                visibleDigitSlots,
                existingDigits.length,
              );
              nextDigits = existingDigits.slice(0, keepCount);
            } else if (inputType === "insertFromPaste") {
              nextDigits = inputDigits.slice(0, 9);
            } else if (visibleDigitSlots < existingDigits.length) {
              nextDigits = existingDigits.slice(0, visibleDigitSlots);
            } else if (visibleDigitSlots > existingDigits.length) {
              const appendedCount = visibleDigitSlots - existingDigits.length;
              const appendedDigits = inputDigits.slice(-appendedCount);
              nextDigits = (existingDigits + appendedDigits).slice(0, 9);
            } else {
              nextDigits = inputDigits.slice(0, 9);
            }

            controllerField.onChange(formatSsn(nextDigits));
            onValueChange?.();

            if (nextDigits.length > existingDigits.length) {
              setShowLastDigit(true);
              if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
              hideTimerRef.current = setTimeout(() => {
                setShowLastDigit(false);
              }, 800);
            } else {
              setShowLastDigit(false);
            }
          },
          inputAdornmentProps: {
            startAdornment: (
              <InputAdornment position="start">
                <LockRoundedIcon
                  sx={{ color: "action.active", fontSize: "1rem" }}
                />
              </InputAdornment>
            ),
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

function FieldRendererInput({
  field,
  control,
  errors,
  hideLabel = false,
  margin = "normal",
  onValueChange,
  reserveFeedbackSpace,
  feedback,
}: FieldRendererProps) {
  const relatedFields = useContext(FieldDefinitionsContext);
  const validationRules = getFieldValidationRules(field);
  const effectiveInputType = getEffectiveInputType(field);
  const fieldError = errors[field.id]?.message as string | undefined;
  const resolvedHelperText =
    fieldError ??
    feedback ??
    (field.format === "ssn" ? renderSsnHelperText() : field.helperText) ??
    (reserveFeedbackSpace ? " " : undefined);

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
    const handleChange = options.onChange ?? ((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = isZipOrPostalField(field) ? formatZipOrPostalCode(event.target.value)
        : field.format === 'digits' ? sanitizeDigits(event.target.value) : event.target.value;
      controllerField.onChange(value);
      onValueChange?.(value);
    });
    return <TextLikeField {...options} field={field} value={options.value ?? String(controllerField.value ?? "")}
      onChange={handleChange} onBlur={controllerField.onBlur} hideLabel={hideLabel} margin={margin}
      hasError={Boolean(errors[field.id])} helperText={resolvedHelperText} />;
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
            <RadioSelectionGroup
              name={field.id}
              label={hideLabel ? undefined : renderFieldLabel(field)}
              options={field.options ?? []}
              value={String(controllerField.value ?? "")}
              required={field.required}
              disabled={field.disabled}
              error={Boolean(errors[field.id])}
              helperText={resolvedHelperText}
              margin={margin}
              onBlur={controllerField.onBlur}
              inputRef={controllerField.ref}
              onChange={(value) => {
                controllerField.onChange(value);
                onValueChange?.(value);
              }}
              renderOptionEnd={(value) =>
                controllerField.value === value
                  ? isComplete
                    ? renderCompletedIcon({ ml: "auto" })
                    : showError ? renderErrorIcon({ ml: "auto" }) : null
                  : null
              }
            />
          );
        }}
      />
    );
  }

  if (effectiveInputType === "dropdown") {
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
                    <FormLabel id={`${field.id}-label`} required={field.required} sx={{ mb: 1 }}>
                      {renderFieldLabel(field)}
                    </FormLabel>
                  ) : null}
                  <Box sx={{ position: "relative" }}>
                    <Select
                      fullWidth
                      name={field.id}
                      labelId={labelId}
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

  if (effectiveInputType === "searchable-select") {
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
              id={field.id}
              fullWidth
              options={field.options ?? []}
              value={selectedOption}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, selected) =>
                option.value === selected.value
              }
              onChange={(_, option) => {
                controllerField.onChange(option?.value ?? "");
                onValueChange?.(option?.value ?? "");
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
                  margin={labelVariant === "floating" ? margin : "none"}
                  placeholder={field.placeholder}
                  error={Boolean(errors[field.id])}
                  helperText={
                    labelVariant === "floating" ? resolvedHelperText : undefined
                  }
                  inputProps={{
                    ...params.inputProps,
                    autoComplete: field.autoComplete ?? "off",
                    "aria-labelledby": labelVariant === "standard" ? `${field.id}-label` : params.inputProps["aria-labelledby"],
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
                <FormLabel id={`${field.id}-label`} required={field.required} sx={{ mb: 1 }}>
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
              margin={margin}
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
                  renderValue={(selected) => selected.map(value => field.options?.find(option => option.value === value)?.label ?? value).join(", ")}
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
              margin={margin}
              error={Boolean(errors[field.id])}
            >
              <SelectionGroup disabled={field.disabled}>
                <Checkbox
                  name={field.id}
                  inputProps={{ "aria-label": field.label }}
                  disabled={field.disabled}
                  checked={Boolean(controllerField.value)}
                  required={field.required}
                  onChange={(event) => {
                    controllerField.onChange(event.target.checked);
                    controllerField.onBlur();
                    onValueChange?.(event.target.checked);
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
              margin={margin}
              error={Boolean(errors[field.id])}
            >
              <FormLabel
                required={field.required}
                id={`${field.id}-label`}
                sx={{ display: "block", mb: 1 }}
              >
                {renderFieldLabel(field)}
              </FormLabel>

              <Stack
                spacing={1}
                sx={{ mt: 1 }}
                role="group"
                aria-labelledby={`${field.id}-label`}
                aria-describedby={
                  resolvedHelperText ? `${field.id}-helper` : undefined
                }
              >
                {(field.options ?? []).map((option) => {
                  const checked = selectedValues.includes(option.value);

                  return (
                    <SelectionGroup key={option.value} disabled={field.disabled}>
                      <Checkbox
                        name={field.id}
                        value={option.value}
                        disabled={field.disabled}
                        checked={checked}
                        onChange={(event) => {
                          const nextValues = event.target.checked
                            ? [...selectedValues, option.value]
                            : selectedValues.filter(
                                (value) => value !== option.value,
                              );

                          controllerField.onChange(nextValues);
                          controllerField.onBlur();
                          onValueChange?.(nextValues);
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

              <FormHelperText id={`${field.id}-helper`}>
                {resolvedHelperText}
              </FormHelperText>
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
              margin={labelVariant === "floating" ? margin : "none"}
              autoComplete={field.autoComplete}
              name={controllerField.name}
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
                <FormLabel id={`${field.id}-label`} required={field.required} sx={{ mb: 1 }}>
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

  if (field.format === "month-year") {
    const myHelperText = fieldError ?? field.helperText ?? "MM/YYYY";
    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField }) => {
          const labelVariant = getLabelVariant(field);
          const displayValue = parseStoredMonthYear(
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
              margin={labelVariant === "floating" ? margin : "none"}
              inputProps={{ inputMode: "numeric" }}
              value={displayValue}
              onChange={(event) => {
                const formatted = formatMonthYearDisplay(event.target.value);
                const digits = formatted.replace(/\D/g, "");
                if (digits.length === 6) {
                  controllerField.onChange(
                    formatMonthYearForStorage(formatted),
                  );
                } else {
                  controllerField.onChange(formatted);
                }
                onValueChange?.();
              }}
              onBlur={controllerField.onBlur}
              disabled={field.disabled}
              error={Boolean(errors[field.id])}
              helperText={
                labelVariant === "floating" ? myHelperText : undefined
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
                <FormLabel id={`${field.id}-label`} required={field.required} sx={{ mb: 1 }}>
                  {renderFieldLabel(field)}
                </FormLabel>
              ) : null}
              {textField}
              <FormHelperText>{myHelperText}</FormHelperText>
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
              onValueChange?.();
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
              "aria-label": field.label,
              inputMode: field.allowDecimal ? "decimal" : field.inputMode ?? "numeric",
              pattern: field.allowDecimal ? "[0-9]*[.]?[0-9]*" : "[0-9]*",
            },
            onChange: (event) => {
              controllerField.onChange(field.allowDecimal ? event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1") : sanitizeDigits(event.target.value));
              onValueChange?.();
            },
          })
        }
      />
    );
  }

  if (field.format === "phone") {
    const typeId = getPhoneTypeFieldId(field);
    const typeField = field.showPhoneTypeSelector === false ? undefined : (relatedFields ?? Object.values(fieldCatalog)).find(definition => definition.id === typeId);
    if (field.showPhoneTypeSelector !== false && !typeField) throw new Error(`Missing configured phone type field: ${typeId}`);
    const common = { field, hideLabel, margin, hasError: Boolean(errors[field.id]), helperText: resolvedHelperText };
    return <Controller name={field.id} control={control} rules={validationRules} render={({ field: number }) => {
      const numberProps = { ...common, value: String(number.value ?? ""), onChange: (value: string) => { number.onChange(value); onValueChange?.(); }, onBlur: number.onBlur };
      return typeField ? <Controller name={typeField.id} control={control} defaultValue={typeField.defaultValue ?? ""}
        rules={getFieldValidationRules(typeField)} render={({ field: type, fieldState }) => <PhoneField {...numberProps}
          typeField={typeField} typeValue={String(type.value ?? typeField.defaultValue ?? "")}
          onTypeChange={type.onChange} onTypeBlur={type.onBlur} typeError={fieldState.error?.message} />}
      /> : <PhoneField {...numberProps} />;
    }} />;
  }

  if (field.format === "ssn") {
    return (
      <SsnField
        key={field.id}
        field={field}
        control={control}
        validationRules={validationRules}
        renderTextLikeField={renderTextLikeField}
        onValueChange={onValueChange}
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

export default function FieldRenderer(props: FieldRendererProps) {
  return <Box data-analytics-field={props.field.id} sx={{ display: "contents", ...(props.reserveFeedbackSpace && { "& .MuiFormHelperText-root": { minHeight: "1.66em" }, "& .MuiFormControl-root": { mt: 0, mb: 0 } }) }}><FieldRendererInput {...props} /></Box>;
}

import type { ChangeEvent } from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import {
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { FieldDefinition } from "../../config/fields/types";
import SelectableOptionRow from "./SelectableOptionRow";

type FormValues = Record<string, string | boolean | string[]>;

type FieldRendererProps = {
  field: FieldDefinition;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  hideLabel?: boolean;
  margin?: "none" | "dense" | "normal";
};

const CURRENCY_FIELD_IDS = new Set([
  "average-monthly-income",
  "spouse-average-monthly-income",
  "monthly-business-expenses",
]);

function isCurrencyField(field: FieldDefinition) {
  return field.format === "currency" || CURRENCY_FIELD_IDS.has(field.id);
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
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
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
  return field.labelVariant ?? "floating";
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

function parseStoredDate(value: string): string {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function formatDateForStorage(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 8) return "";
  const mm = digits.slice(0, 2);
  const dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
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

export default function FieldRenderer({
  field,
  control,
  errors,
  hideLabel = false,
  margin = "normal",
}: FieldRendererProps) {
  const validationRules = getValidationRules(field);
  const fieldError = errors[field.id]?.message as string | undefined;
  const resolvedHelperText = fieldError ?? field.helperText;

  function renderTextLikeField(
    controllerField: {
      value: unknown;
      onChange: (value: string) => void;
      onBlur: () => void;
    },
    options: {
      type?: string;
      value?: string;
      onChange?: (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => void;
      placeholder?: string;
      inputProps?: Record<string, unknown>;
      inputAdornmentProps?: Record<string, unknown>;
    } = {},
  ) {
    const labelVariant = getLabelVariant(field);
    const value = options.value ?? (controllerField.value as string) ?? "";
    const handleChange =
      options.onChange ??
      ((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        controllerField.onChange(event.target.value);
      });

    const textField = (
      <TextField
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
        InputProps={options.inputAdornmentProps}
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
        render={({ field: controllerField }) => (
          <FormControl
            fullWidth
            margin={margin}
            error={Boolean(errors[field.id])}
          >
            {!hideLabel ? (
              <FormLabel
                required={field.required}
                sx={{ display: "block", mb: 1 }}
              >
                {renderFieldLabel(field)}
              </FormLabel>
            ) : null}

            <ToggleButtonGroup
              exclusive
              value={(controllerField.value as string) ?? ""}
              onChange={(_, value) => {
                if (value !== null) {
                  controllerField.onChange(value);
                }
              }}
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                gap: 1,
                mt: hideLabel ? 0 : 1,
              }}
            >
              {(field.options ?? []).map((option) => (
                <ToggleButton
                  key={option.value}
                  value={option.value}
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 1.5,
                    py: 1.5,
                    textTransform: "none",
                  }}
                >
                  <Radio
                    checked={controllerField.value === option.value}
                    size="small"
                    sx={controlSx}
                  />
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <FormHelperText>{resolvedHelperText}</FormHelperText>
          </FormControl>
        )}
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
        render={({ field: controllerField }) => (
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
                <Select
                  value={(controllerField.value as string) ?? ""}
                  onChange={(event) =>
                    controllerField.onChange(event.target.value)
                  }
                  displayEmpty
                  disabled={field.disabled}
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
              </>
            ) : (
              <>
                <InputLabel id={labelId} required={field.required}>
                  {renderFieldLabel(field)}
                </InputLabel>
                <Select
                  labelId={labelId}
                  label={field.label}
                  value={(controllerField.value as string) ?? ""}
                  onChange={(event) =>
                    controllerField.onChange(event.target.value)
                  }
                  disabled={field.disabled}
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
              </>
            )}

            <FormHelperText>{resolvedHelperText}</FormHelperText>
          </FormControl>
        )}
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

              <Select<string[]>
                labelId={labelId}
                label={field.label}
                multiple
                value={selectedValues}
                onChange={(event) => {
                  const value = event.target.value;
                  controllerField.onChange(
                    typeof value === "string" ? value.split(",") : value,
                  );
                }}
                renderValue={(selected) => selected.join(", ")}
              >
                {(field.options ?? []).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Checkbox checked={selectedValues.includes(option.value)} />
                    {option.label}
                  </MenuItem>
                ))}
              </Select>

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
        render={({ field: controllerField }) => (
          <FormControl
            fullWidth
            margin="normal"
            error={Boolean(errors[field.id])}
          >
            <SelectableOptionRow>
              <Checkbox
                checked={Boolean(controllerField.value)}
                onChange={(event) =>
                  controllerField.onChange(event.target.checked)
                }
                sx={controlSx}
              />
              <Typography variant="body2">
                {field.label}
                {field.required ? (
                  <Typography
                    component="span"
                    sx={{ color: "error.main", ml: 0.25 }}
                  >
                    *
                  </Typography>
                ) : null}
              </Typography>
            </SelectableOptionRow>

            <FormHelperText>{resolvedHelperText}</FormHelperText>
          </FormControl>
        )}
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
                    <SelectableOptionRow key={option.value}>
                      <Checkbox
                        checked={checked}
                        onChange={(event) => {
                          const nextValues = event.target.checked
                            ? [...selectedValues, option.value]
                            : selectedValues.filter(
                                (value) => value !== option.value,
                              );

                          controllerField.onChange(nextValues);
                        }}
                        sx={controlSx}
                      />
                      <Typography variant="body2">{option.label}</Typography>
                    </SelectableOptionRow>
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
    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField }) =>
          renderTextLikeField(controllerField, {
            value: parseStoredDate((controllerField.value as string) ?? ""),
            placeholder: "MM/DD/YYYY",
            inputProps: { inputMode: "numeric" },
            onChange: (event) => {
              const formatted = formatDateDisplay(event.target.value);
              const digits = formatted.replace(/\D/g, "");
              if (digits.length === 8) {
                controllerField.onChange(formatDateForStorage(formatted));
              } else {
                controllerField.onChange(formatted);
              }
            },
          })
        }
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
        render={({ field: controllerField }) =>
          renderTextLikeField(controllerField, {
            value: formatCurrency(controllerField.value),
            inputProps: { inputMode: field.inputMode ?? "numeric" },
            onChange: (event) => {
              controllerField.onChange(formatCurrency(event.target.value));
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
        render={({ field: controllerField }) =>
          renderTextLikeField(controllerField, {
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
        render={({ field: controllerField }) =>
          renderTextLikeField(controllerField, {
            value: (controllerField.value as string) ?? "",
            inputProps: {
              inputMode: field.inputMode ?? "numeric",
              pattern: "[0-9]*",
            },
            onChange: (event) => {
              controllerField.onChange(sanitizeDigits(event.target.value));
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
          render={({ field: controllerField }) =>
            renderTextLikeField(controllerField, {
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
        render={({ field: controllerField }) => (
          <Controller
            name={phoneTypeFieldName}
            control={control}
            defaultValue="mobile"
            rules={{ required: "Phone Type is required" }}
            render={({ field: phoneTypeField }) =>
              renderTextLikeField(controllerField, {
                type: htmlInputType,
                value: (controllerField.value as string) ?? "",
                onChange: (event) => {
                  controllerField.onChange(formatPhone(event.target.value));
                },
                inputAdornmentProps: {
                  endAdornment: (
                    <InputAdornment position="end">
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
                    </InputAdornment>
                  ),
                },
              })
            }
          />
        )}
      />
    );
  }

  if (field.format === "ssn") {
    return (
      <Controller
        key={field.id}
        name={field.id}
        control={control}
        rules={validationRules}
        render={({ field: controllerField }) =>
          renderTextLikeField(controllerField, {
            value: (controllerField.value as string) ?? "",
            onChange: (event) => {
              controllerField.onChange(formatSsn(event.target.value));
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
      render={({ field: controllerField }) =>
        renderTextLikeField(controllerField, {
          type: htmlInputType,
          value: (controllerField.value as string) ?? "",
        })
      }
    />
  );
}

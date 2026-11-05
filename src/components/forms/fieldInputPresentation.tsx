import type { ReactNode } from "react";
import { Box, InputAdornment, Tooltip } from "@mui/material";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import type { FieldDefinition } from "../../config/fields/types";
export type FieldStatusState = { hasError?: boolean };

export function isZipOrPostalField(field: FieldDefinition) {
  return field.autoComplete === "postal-code";
}

export function getLabelVariant(field: FieldDefinition) {
  if (field.labelVariant) return field.labelVariant;
  // Auto-switch to standard (external) label for long labels to prevent clipping
  if (field.label && field.label.length >= 40) return "standard";
  return "floating";
}

export function hasCompletedValue(field: FieldDefinition, value: unknown) {
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
    return (field.allowDecimal ? /^\d+(\.\d+)?$/ : /^\d+$/).test(stringValue);
  }

  if (field.inputType === "date") {
    return (
      /^\d{2}\/\d{2}\/\d{4}$/.test(stringValue) ||
      /^\d{4}-\d{2}-\d{2}$/.test(stringValue)
    );
  }

  if (field.format === "month-year") {
    return (
      /^\d{2}\/\d{4}$/.test(stringValue) || /^\d{4}-\d{2}$/.test(stringValue)
    );
  }

  return stringValue.length >= 2;
}

export function inputChecksEnabled() {
  return new URLSearchParams(window.location.search).has("inputChecks");
}

export function isFieldComplete(
  field: FieldDefinition,
  value: unknown,
  statusState?: FieldStatusState,
) {
  if (!inputChecksEnabled()) return false;
  if (statusState?.hasError) return false;
  return hasCompletedValue(field, value);
}

export function isFieldInError(statusState?: FieldStatusState) {
  if (!inputChecksEnabled()) return false;
  return Boolean(statusState?.hasError);
}

export function renderCompletedIcon(sx = {}) {
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

export function renderErrorIcon(sx = {}) {
  return (
    <CancelRoundedIcon
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

export function renderCompletedAdornment(existingAdornment?: ReactNode) {
  return (
    <>
      {existingAdornment}
      <InputAdornment position="end">{renderCompletedIcon()}</InputAdornment>
    </>
  );
}

export function renderErrorAdornment(existingAdornment?: ReactNode) {
  return (
    <>
      {existingAdornment}
      <InputAdornment position="end">{renderErrorIcon()}</InputAdornment>
    </>
  );
}

export function renderCompletedSelectIcon() {
  return renderCompletedIcon({
    position: "absolute",
    right: 40,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    zIndex: 1,
  });
}

export function renderErrorSelectIcon() {
  return renderErrorIcon({
    position: "absolute",
    right: 40,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    zIndex: 1,
  });
}

export function renderFieldLabel(field: FieldDefinition) {
  return (
    <Box
      component="span"
      sx={{ display: "inline", alignItems: "center", gap: 0.5 }}
    >
      <span>{field.label}</span>
      {field.tooltip ? (
        <Tooltip title={field.tooltip} arrow>
          <InfoRoundedIcon sx={{ fontSize: "1rem", color: "action.active" }} />
        </Tooltip>
      ) : null}
    </Box>
  );
}


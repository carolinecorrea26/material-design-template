import { Alert, Box, type AlertColor, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

type PageAlertProps = {
  /** Alert severity. Defaults to "error". */
  severity?: AlertColor;
  /**
   * The message to display. Can be a string or JSX (e.g. a list of errors).
   * Component renders nothing when this is undefined or null.
   */
  message?: ReactNode;
  /** Show a dismiss button. Caller manages open state. */
  onDismiss?: () => void;
  sx?: SxProps<Theme>;
};

/**
 * Full-width contextual alert rendered above the form content area.
 * Replaces the former PageErrorAlert with support for all severity variants.
 *
 * Usage:
 *   <PageAlert severity="error" message={pageError} />
 *   <PageAlert severity="success" message="Your progress has been saved." />
 *   <PageAlert severity="warning" message="This plan is not available in your state." />
 *   <PageAlert severity="info" message="Membership verification is in progress." />
 */
export default function PageAlert({
  severity = "error",
  message,
  onDismiss, sx,
}: PageAlertProps) {
  if (!message) return null;

  return (
    <Box sx={[{ mb: 2 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      <Alert
        severity={severity}
        onClose={onDismiss}
        sx={{ width: "100%" }}
        // Error and warning use assertive live regions; info/success use polite.
        role={severity === "error" || severity === "warning" ? "alert" : "status"}
      >
        {message}
      </Alert>
    </Box>
  );
}

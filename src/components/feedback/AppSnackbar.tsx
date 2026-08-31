import { Alert, Snackbar, useMediaQuery, useTheme } from "@mui/material";
import type { AlertColor } from "@mui/material";

export type AppSnackbarProps = {
  open: boolean;
  onClose: () => void;
  message: string;
  severity?: AlertColor;
  /** Auto-hide duration in ms. Defaults to 2500. */
  autoHideDuration?: number;
};

/**
 * Base snackbar component.
 * Appears at the bottom on small screens and top-center on large screens.
 */
export default function AppSnackbar({
  open,
  onClose,
  message,
  severity = "success",
  autoHideDuration = 2500,
}: AppSnackbarProps) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={
        isSmall
          ? { vertical: "bottom", horizontal: "center" }
          : { vertical: "top", horizontal: "center" }
      }
    >
      <Alert onClose={onClose} severity={severity} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
}

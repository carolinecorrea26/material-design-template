import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";

type AppModalAction = {
  label: string;
  onClick: () => void;
  /** Defaults to "contained" for the primary action, "text" for secondary. */
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "error" | "inherit";
};

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /**
   * Action buttons rendered in DialogActions.
   * - Omit (or pass empty array) for no action bar.
   * - Pass one action for a single "Dismiss / OK" button.
   * - Pass two actions for confirm + cancel (primary first, secondary second).
   *
   * If a close (×) icon is always desired regardless, set `showCloseIcon`.
   */
  actions?: AppModalAction[];
  /** Always show the × icon button in the title bar. Defaults to true. */
  showCloseIcon?: boolean;
  /** Max width in px for desktop. Defaults to 900. */
  maxWidth?: number;
  /**
   * Use "alertdialog" for destructive confirmations (e.g. delete, navigate away).
   * Defaults to "dialog".
   */
  role?: "dialog" | "alertdialog";
  /** Min height for the dialog on desktop. Defaults to "50vh". Set to "auto" for compact dialogs. */
  minHeight?: string;
};

export type { AppModalAction };

export default function AppModal({
  open,
  onClose,
  title,
  children,
  actions,
  showCloseIcon = true,
  maxWidth = 900,
  role = "dialog",
  minHeight = "50vh",
}: AppModalProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen={!isDesktop}
      role={role}
      PaperProps={{
        sx: isDesktop ? { minHeight, maxHeight: "85vh", maxWidth } : {},
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          pb: 1,
        }}
      >
        {typeof title === "string" ? (
          <Typography variant="h5">{title}</Typography>
        ) : (
          title
        )}
        {showCloseIcon && (
          <IconButton onClick={onClose} aria-label="Close" size="small">
            <CloseRoundedIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent dividers>{children}</DialogContent>

      {actions && actions.length > 0 && (
        <DialogActions>
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant ?? (index === 0 ? "contained" : "text")}
              color={action.color ?? "primary"}
            >
              {action.label}
            </Button>
          ))}
        </DialogActions>
      )}
    </Dialog>
  );
}

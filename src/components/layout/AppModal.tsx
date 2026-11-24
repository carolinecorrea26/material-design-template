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
import { useId, type ReactNode } from "react";

type AppModalAction = {
  label: string;
  onClick: () => void;
  /** Defaults to "contained" for the primary action, "text" for secondary. */
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "error" | "inherit";
  autoFocus?: boolean;
  disabled?: boolean;
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
  footerActions?: ReactNode;
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
  /** Force fullScreen regardless of viewport, for content meant to fill the entire viewport (e.g. documentation section browsers). */
  forceFullScreen?: boolean;
  fullScreenOnMobile?: boolean;
  dismissible?: boolean;
  headerContent?: ReactNode;
  contentDividers?: boolean;
  closeLabel?: string;
  titleId?: string;
  descriptionId?: string;
};

export type { AppModalAction };

export default function AppModal({
  open,
  onClose,
  title,
  children,
  actions,
  footerActions,
  showCloseIcon = true,
  maxWidth = 900,
  role = "dialog",
  minHeight = "50vh",
  forceFullScreen = false,
  fullScreenOnMobile = true, dismissible = true, headerContent, contentDividers = true,
  closeLabel = "Close", titleId: suppliedTitleId, descriptionId,
}: AppModalProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const fullScreen = forceFullScreen || (fullScreenOnMobile && !isDesktop);
  const generatedTitleId = useId();
  const titleId = suppliedTitleId ?? generatedTitleId;

  return (
    <Dialog
      open={open}
      onClose={dismissible ? onClose : undefined}
      disableEscapeKeyDown={!dismissible}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      maxWidth={false}
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        role,
        sx: !fullScreen ? { minHeight, maxHeight: "85vh", maxWidth } : {},
      }}
    >
      <DialogTitle id={titleId}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          pb: 1,
        }}
      >
        {typeof title === "string" ? (
          <Typography variant="h5" component="span">
            {title}
          </Typography>
        ) : (
          title
        )}
        {showCloseIcon && dismissible && (
          <IconButton onClick={onClose} aria-label={closeLabel} size="small">
            <CloseRoundedIcon />
          </IconButton>
        )}
      </DialogTitle>

      {headerContent}
      <DialogContent dividers={contentDividers}>{children}</DialogContent>

      {(footerActions || actions && actions.length > 0) && (
        <DialogActions>
          {footerActions}
          {actions?.map((action, index) => (
            <Button
              key={index}
              autoFocus={action.autoFocus}
              disabled={action.disabled}
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

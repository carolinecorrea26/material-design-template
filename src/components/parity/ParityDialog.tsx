// src/components/parity/ParityDialog.tsx
import * as React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export interface ParityDialogProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  children?: React.ReactNode;
}

export function ParityDialog({
  open,
  title,
  onClose,
  primaryAction,
  secondaryAction,
  children
}: ParityDialogProps) {
  const labelledBy = title ? "dialog-title" : undefined;
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={labelledBy} fullWidth maxWidth="sm">
      {title ? (
        <DialogTitle 
          id={labelledBy}
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pb: 1
          }}
        >
          {title}
          <IconButton 
            edge="end"
            onClick={onClose}
            aria-label="close"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      ) : null}
      <DialogContent dividers>{children}</DialogContent>
      {(primaryAction || secondaryAction) && (
        <DialogActions>
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} disabled={secondaryAction.disabled} variant="text">
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button onClick={primaryAction.onClick} disabled={primaryAction.disabled} variant="contained">
              {primaryAction.label}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}

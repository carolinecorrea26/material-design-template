// src/components/parity/ParitySnackbar.tsx
import * as React from "react";
import { Alert, Snackbar } from "@mui/material";
import type { AlertColor } from "@mui/material/Alert";


export interface ParitySnackbarProps {
  open: boolean;
  onClose: () => void;
  message: string;
  severity?: AlertColor; // "success" | "info" | "warning" | "error"
  inline?: boolean; // if true, render standalone Alert instead of Snackbar
  persistent?: boolean; // if true, won't auto-hide
}

export function ParitySnackbar({ open, onClose, message, severity = "info", inline = false, persistent = false }: ParitySnackbarProps) {
  if (inline) {
    return <Alert severity={severity} onClose={onClose}>{message}</Alert>;
  }
  return (
    <Snackbar
      open={open}
      autoHideDuration={persistent ? null : 4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

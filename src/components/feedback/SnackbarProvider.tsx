import * as React from "react";
import type { AlertColor } from "@mui/material";
import { ParitySnackbar } from "../parity";

type Snack = { open: boolean; message: string; severity: AlertColor; persistent?: boolean };
type Ctx = { notify: (msg: string, severity?: AlertColor, persistent?: boolean) => void };

const SnackbarCtx = React.createContext<Ctx | undefined>(undefined);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snack, setSnack] = React.useState<Snack>({ open: false, message: "", severity: "info", persistent: false });
  const notify = (message: string, severity: AlertColor = "info", persistent: boolean = false) =>
    setSnack({ open: true, message, severity, persistent });

  return (
    <SnackbarCtx.Provider value={{ notify }}>
      {children}
      <ParitySnackbar
        open={snack.open}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        message={snack.message}
        severity={snack.severity}
        persistent={snack.persistent}
      />
    </SnackbarCtx.Provider>
  );
}

export function useSnackbar() {
  const ctx = React.useContext(SnackbarCtx);
  if (!ctx) throw new Error("useSnackbar must be used within SnackbarProvider");
  return ctx;
}

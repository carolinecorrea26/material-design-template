import type { ReactNode } from "react";
import { Alert, Link } from "@mui/material";

type ExpiringCodeAlertProps = {
  secondsLeft: number;
  kind: "link" | "code";
  onResend: () => void;
  children?: ReactNode;
  activeIcon?: ReactNode;
  confirmationMessage?: ReactNode;
  showConfirmation?: boolean;
};

/** Shared active/expired/resend alert for resume links and verification codes. */
export default function ExpiringCodeAlert({
  secondsLeft,
  kind,
  onResend,
  children,
  activeIcon,
  confirmationMessage,
  showConfirmation = false,
}: ExpiringCodeAlertProps) {
  if (secondsLeft === 0) {
    return (
      <Alert severity="error">
        Your {kind === "link" ? "secure link" : "verification code"} has
        expired. {" "}
        <Link
          href="#"
          underline="hover"
          onClick={(event) => {
            event.preventDefault();
            onResend();
          }}
          sx={{ fontSize: "inherit", verticalAlign: "baseline" }}
        >
          Resend {kind}
        </Link>
      </Alert>
    );
  }

  if (showConfirmation && confirmationMessage) {
    return <Alert severity="success">{confirmationMessage}</Alert>;
  }

  return children ? (
    <Alert severity="success" icon={activeIcon}>
      {children}
    </Alert>
  ) : null;
}

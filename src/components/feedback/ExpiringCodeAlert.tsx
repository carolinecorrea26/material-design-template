import { requirementText } from "../../domain/requirementContent";
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
        {requirementText("application.ui.your")}{kind === "link" ? requirementText("application.ui.secure-link") : requirementText("application.ui.verification-code")} {requirementText("application.ui.has-expired")}{" "}
        <Link
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onResend();
          }}
          sx={{ fontSize: "inherit", verticalAlign: "baseline" }}
        >
          {requirementText("application.ui.resend")}{kind}
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

import { DialogContentText } from "@mui/material";
import AppModal from "./AppModal";

type ConfirmationDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "primary" | "error";
  onConfirm: () => void;
};

export default function ConfirmationDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  confirmColor = "primary",
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      maxWidth={480}
      minHeight="auto"
      title={title}
      role="alertdialog"
      actions={[
        {
          label: confirmLabel,
          onClick: onConfirm,
          variant: "contained",
          color: confirmColor,
        },
        {
          label: cancelLabel,
          onClick: onClose,
          variant: "text",
        },
      ]}
    >
      <DialogContentText>{message}</DialogContentText>
    </AppModal>
  );
}

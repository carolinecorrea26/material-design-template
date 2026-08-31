import AppSnackbar from "./AppSnackbar";

type ProgressSavedSnackbarProps = {
  open: boolean;
  onClose: () => void;
};

export default function ProgressSavedSnackbar({
  open,
  onClose,
}: ProgressSavedSnackbarProps) {
  return (
    <AppSnackbar
      open={open}
      onClose={onClose}
      message="Progress saved"
      severity="success"
      autoHideDuration={2000}
    />
  );
}

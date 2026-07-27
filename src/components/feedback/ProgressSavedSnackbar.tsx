import { Alert, Snackbar } from "@mui/material";

type ProgressSavedSnackbarProps = {
  open: boolean;
  onClose: () => void;
};

export default function ProgressSavedSnackbar({
  open,
  onClose,
}: ProgressSavedSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={2000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity="success" variant="filled">
        Progress saved
      </Alert>
    </Snackbar>
  );
}

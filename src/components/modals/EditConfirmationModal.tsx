import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

interface EditConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function EditConfirmationModal({ open, onClose, onConfirm }: EditConfirmationModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h4" component="span">
          Edit Your Application
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" paragraph>
          We will take you to this section of the application to edit.
        </Typography>
        <Typography variant="body2">
          Some edits may change availability, cost, and other details of your current application and require you to re-navigate through your application from that point forward to verify your answers.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" autoFocus>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}

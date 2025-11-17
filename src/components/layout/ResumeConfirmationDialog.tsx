import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
  Typography, IconButton, Divider
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

interface ResumeConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResumeConfirmationDialog({
  open,
  onClose,
  onConfirm
}: ResumeConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="resume-dialog-title"
      aria-describedby="resume-dialog-description"
      maxWidth="sm"
    >
      <DialogTitle
        id="resume-dialog-title"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}
      >
        <Typography variant="h6" component="div">
          Resume Application?
        </Typography>
        <IconButton
          edge="end"
          onClick={onClose}
          aria-label="close"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <DialogContentText id="resume-dialog-description">
          You're about to continue an application you started earlier. Do you want to proceed?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="primary" variant="contained" autoFocus>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
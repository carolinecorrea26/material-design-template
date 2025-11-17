import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ScheduleCallModalProps {
  open: boolean;
  onClose: () => void;
  calendlyUrl: string;
  clientName?: string;
}

/**
 * Schedule Call Modal Component
 * 
 * Displays a Calendly scheduler in a modal dialog.
 * Used for client-specific appointment scheduling.
 */
export function ScheduleCallModal({ 
  open, 
  onClose, 
  calendlyUrl,
  clientName = 'Schedule Your Appointment'
}: ScheduleCallModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '800px',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        {clientName}
        <IconButton
          edge="end"
          onClick={onClose}
          aria-label="close"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box
          component="iframe"
          src={calendlyUrl}
          sx={{
            width: '100%',
            height: '100%',
            border: 'none',
            minHeight: '600px',
          }}
          title="Schedule an appointment"
        />
      </DialogContent>
    </Dialog>
  );
}

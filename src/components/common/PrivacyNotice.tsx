import { Dialog, DialogTitle, DialogContent, DialogContentText, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

type PrivacyNoticeProps = {
  open: boolean;
  onClose: () => void;
};

export function PrivacyNotice({ open, onClose }: PrivacyNoticeProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="privacy-notice-title"
    >
      <DialogTitle 
        id="privacy-notice-title"
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}
      >
        Privacy Notice
        <IconButton
          edge="end"
          onClick={onClose}
          aria-label="close"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          This is a placeholder for the Privacy Notice content. This notice would typically contain information about:
          <ul>
            <li>What information we collect</li>
            <li>How we use your information</li>
            <li>How we protect your privacy</li>
            <li>Your rights and choices</li>
            <li>Updates to this privacy notice</li>
          </ul>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
}
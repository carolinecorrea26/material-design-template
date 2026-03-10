import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
} from "@mui/material";

interface QuickQuoteModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickQuoteModal({
  open,
  onClose,
}: QuickQuoteModalProps) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="quick-quote-title">
      <DialogTitle id="quick-quote-title">Quick Quote</DialogTitle>
      <DialogContent>
        <Typography>Quick quote modal coming soon.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

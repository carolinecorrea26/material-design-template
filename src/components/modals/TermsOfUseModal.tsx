import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon, Print as PrintIcon } from "@mui/icons-material";

interface TermsOfUseModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TermsOfUseModal({ open, onClose }: TermsOfUseModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4" component="span">
            New York Life Terms of Use
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ '& > p': { mb: 2 } }}>
          <Typography variant="body2" paragraph>
            If you are applying online, you are applying for insurance coverage using electronic processes that will include the use of electronic records and electronic signatures. New York Life is required by law to provide you with certain disclosures and information about your insurance application ("New York Life Online Privacy Notice"). Upon your consent, New York Life will deliver its online privacy notice to you electronically.
          </Typography>

          <Typography variant="body2" paragraph>
            Please print or download "New York Life's Online Privacy Notice" and keep it for your records. Your consent also permits the general use of electronic records and electronic signatures in connection with your application.
          </Typography>

          <Typography variant="body2" paragraph>
            If you do not consent to electronic delivery of New York Life's Online Privacy Notice, you must be provided with a paper/hard-copy version. However, New York Life cannot proceed with the acceptance and processing of your electronic application.
          </Typography>

          <Typography variant="body2" paragraph>
            This notice contains important information that you are entitled to receive before you consent to electronic delivery. Please read carefully this notice regarding use of your consent to e-signature and records — print a copy for your files.
          </Typography>

          <Typography variant="body2" paragraph>
            By electronically signing this form you are consenting to the use of electronic transactions and electronic signatures on New York Life's website, as well as receipt of electronic versions of certain records. In addition you are agreeing to be bound by any consent or agreement you make or transmit through the Internet on this website, including but not limited to any consent you give to receive records or communications from New York Life solely through electronic transmission.
          </Typography>

          <Typography variant="body2" paragraph>
            You agree that, by using this site, your agreement or consent will be legally binding and enforceable and the legal equivalent of your handwritten signature. If you consent to electronic disclosures, that consent will apply to:
          </Typography>

          <Typography variant="body2" paragraph sx={{ pl: 2 }}>
            (a) Any or all information that New York Life is required to give you or may receive from you in connection with your insurance,
          </Typography>

          <Typography variant="body2" paragraph sx={{ pl: 2 }}>
            (b) this application, and
          </Typography>

          <Typography variant="body2" paragraph sx={{ pl: 2 }}>
            (c) any associated notices, disclosures, or other documents.
          </Typography>

          <Typography variant="body2" paragraph>
            You may withdraw this consent at any time. By withdrawing your consent New York Life cannot continue to process your electronic application. You may re-apply by downloading a paper hard-copy version of the application. If you wish to withdraw your consent to e-signatures or wish to receive hard-copy/paper records or have New York Life's Online Privacy Notice sent to you — please contact the plan administrator.
          </Typography>

          <Typography variant="body2" paragraph>
            In order to electronically complete your application/request for insurance, the following computer hardware and software requirements must be supported:
          </Typography>

          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              For your security, this site is protected with 128-bit encryption. You must have a browser with this capacity to use this site.
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Best viewed with a screen resolution of 1280 × 800 or greater.
            </Typography>
            <Typography component="li" variant="body2">
              Best viewed with a current version of Chrome browser. Other browsers or older versions of these browsers are either not supported, or may not render an ideal user experience.
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
            11-1-11 ed.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'flex-end', px: 3, py: 2 }}>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}

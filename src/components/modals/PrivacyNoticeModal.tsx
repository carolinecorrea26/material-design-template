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

interface PrivacyNoticeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PrivacyNoticeModal({ open, onClose }: PrivacyNoticeModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const affiliates = [
    "New York Life Insurance Company",
    "New York Life Insurance and Annuity Corporation",
    "New York Life Investment Management LLC",
    "New York Life Enterprises LLC",
    "Apogem Capital LLC",
    "Ausbil Investment Management Limited",
    "Candriam S.C.A.",
    "Eagle Strategies LLC",
    "Flatiron RR LLC, Manager Series",
    "NYLI ETF Trust",
    "NYLI Active ETF Trust",
    "Kartesia Management SA",
    "Life Insurance Company of North America",
    "MacKay Shields LLC",
    "NYLI CBRE Global Infrastructure Megatrends Term Fund",
    "NYLI MacKay DefinedTerm Municipal Opportunities Fund",
    "NYLI MacKay Muni Opportunities Fund",
    "NYLI Funds Trust",
    "NYLI VP Funds Trust",
    "New York Life Group Insurance Company of NY",
    "New York Life Investment Management Asia Limited",
    "New York Life Trust Company",
    "NYLIFE Distributors LLC",
    "NYLIFE Insurance Company of Arizona",
    "NYLIFE Securities LLC",
    "NYLIM Service Company LLC",
    "NYLINK Insurance Agencies, Inc.",
    "NYL Investors LLC",
    "Tristan Capital Partners",
  ];

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
            Privacy Notice
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
        <Box sx={{ '& > *': { mb: 2 } }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Our information practices
            </Typography>
            <Typography variant="body2" paragraph>
              This Privacy Notice applies to information collected in connection with financial products or services you obtain or seek to obtain from members of the New York Life Family of Companies* that are subject to the Gramm-Leach-Bliley Act.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Types of information we collect
            </Typography>
            <Typography variant="body2" paragraph>
              In the normal course of business we may collect:
            </Typography>
            <Box component="ul" sx={{ pl: 4, mt: 1, mb: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Information provided on applications and other forms (including name, address, email address, phone number, date of birth, Social Security number, and financial and other household information)
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Data about transactions (such as the types of products purchased and account status)
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Information from outside sources such as public information
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Information gathered from our websites, such as through online forms, site visit data and internet collection devices ("cookies")
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Information collected from consumer reporting agencies
              </Typography>
              <Typography component="li" variant="body2">
                Health information collected with your permission when you apply for insurance
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Safeguarding your information
            </Typography>
            <Typography variant="body2" paragraph>
              We maintain physical, electronic, and procedural safeguards that meet state and federal regulations. Access to customer information is limited to people who need the information to perform their job responsibilities. We regularly update and improve our security standards, procedures, and technology to protect against unauthorized access to your confidential information.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              How we use information
            </Typography>
            <Typography variant="body2" paragraph>
              We may share the information we collect about you as allowed by law, including for normal business administration and related business activities. The information may be shared:
            </Typography>
            <Box component="ul" sx={{ pl: 4, mt: 1, mb: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Within New York Life
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                With non-affiliates, such as banks, third parties that perform research and marketing functions for us, or service providers that help us process transactions or service accounts. New York Life may use service providers such as billing, printing and mail service companies.
              </Typography>
            </Box>
            <Typography variant="body2" paragraph>
              We may disclose the information we collect when required or permitted by law, such as to:
            </Typography>
            <Box component="ul" sx={{ pl: 4, mt: 1, mb: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Respond to a subpoena
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Prevent fraud and other crimes
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Comply with legal requirements
              </Typography>
              <Typography component="li" variant="body2">
                Respond to a government inquiry
              </Typography>
            </Box>
            <Typography variant="body2" paragraph>
              The accuracy of your information is important to us. You have the right to access and seek correction of your information, and we will respond to your request in accordance with the applicable law. We will follow the privacy law in your state if that law has different requirements than the policy described in this Privacy Notice.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Informing customers about privacy
            </Typography>
            <Typography variant="body2" paragraph>
              This Privacy Notice was last updated in February 2025. Customers will receive our Privacy Notice at least once a year, as long as they are a group policyholder. You can receive additional copies of our Privacy Notice by writing to:
            </Typography>
            <Typography variant="body2" paragraph sx={{ pl: 2 }}>
              Group Membership Compliance Officer<br />
              New York Life Insurance Company<br />
              44 South Broadway<br />
              White Plains, NY 10601
            </Typography>
            <Typography variant="body2" paragraph>
              You can also call us at (800) 695-4226.
            </Typography>
            <Typography variant="body2" paragraph>
              Our goal is to ensure that your relationship with us is handled with the high degree of integrity and professionalism you expect. Thank you for your continuing trust in New York Life.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" paragraph>
              * The New York Life Family of Companies (also referred to as "the New York Life Family," "we," "our," or "us" throughout this notice) currently includes the following affiliates and funds:
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Affiliates and Funds List:
            </Typography>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 1,
                mb: 2
              }}
            >
              {affiliates.map((affiliate, index) => (
                <Typography key={index} variant="body2" sx={{ fontSize: '0.875rem' }}>
                  {affiliate}
                </Typography>
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Form 22294-CA (February 2025)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              © 2025 New York Life Insurance Company
            </Typography>
          </Box>
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

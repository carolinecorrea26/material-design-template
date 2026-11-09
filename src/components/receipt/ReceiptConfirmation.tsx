import { Alert, Button, Stack, Typography } from '@mui/material';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import type { ReceiptContent } from '../../content/types';
import { receiptDefaults } from '../../content/defaults/receipt';
import ReceiptNextSteps from './ReceiptNextSteps';

type ReceiptConfirmationProps = {
  title: string;
  content: ReceiptContent;
  confirmationNumber: string;
  documentsNote?: string;
  onDownloadApplication: () => void;
  onDownloadPayment: () => void;
};

/** Submission receipt header, security notice and available document downloads. */
export default function ReceiptConfirmation({ title, content, confirmationNumber, documentsNote, onDownloadApplication, onDownloadPayment }: ReceiptConfirmationProps) {
  return <Stack spacing={2.5}>
    <Stack spacing={1}>
      <Typography variant="h3" component="h1">{title}</Typography>
      <Typography variant="body2" color="text.secondary">{content.confirmationNumberLabel} <Typography component="span" variant="inherit" fontWeight={700} color="text.primary">{confirmationNumber || "—"}</Typography></Typography>
    </Stack>
    <ReceiptNextSteps content={{ title: content.receivedMessage ?? receiptDefaults.receivedMessage!, items: [{ title: '', description: content.paymentNotice ?? receiptDefaults.paymentNotice! }] }} />
    <Alert severity="warning" sx={{ '& .MuiAlert-message': { width: '100%', minWidth: 0 } }}>
      <Stack spacing={2}>
        <Typography variant="body2">{documentsNote ?? content.documentsNote}</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
          <Button variant="contained" startIcon={<FileDownloadRoundedIcon />} onClick={onDownloadApplication}>{content.documentDownloadLabels.application}</Button>
          <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={onDownloadPayment}>{content.documentDownloadLabels.payment}</Button>
        </Stack>
      </Stack>
    </Alert>
  </Stack>;
}

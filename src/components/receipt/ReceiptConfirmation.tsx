import InformationAlert from '../feedback/InformationAlert';
import { Button, Stack, Typography } from '@mui/material';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import type { ReceiptContent } from '../../content/types';

type ReceiptConfirmationProps = {
  title: string;
  description?: string;
  content: ReceiptContent;
  confirmationNumber: string;
  hasActivePaymentInformation: boolean;
  documentsNote?: string;
  onDownloadApplication: () => void;
  onDownloadPayment?: () => void;
  underwritingNote?: ReceiptContent["underwritingNote"];
};

/** Submission receipt header, security notice and available document downloads. */
export default function ReceiptConfirmation({ title, description, content, confirmationNumber, hasActivePaymentInformation, documentsNote, onDownloadApplication, onDownloadPayment, underwritingNote }: ReceiptConfirmationProps) {
  return <Stack spacing={2.5}>
    <Stack spacing={1}>
      <Typography variant="h3" component="h1">{title}</Typography>
      {description && <Typography variant="body2" color="text.secondary">{description}</Typography>}
      <Typography variant="body2" color="text.secondary">{content.confirmationNumberLabel} <Typography component="span" variant="inherit" fontWeight={700} color="text.primary">{confirmationNumber || "—"}</Typography></Typography>
    </Stack>
    <InformationAlert title={content.whatHappensNext.title} description={hasActivePaymentInformation ? content.paymentNotice : undefined}>
      <Stack spacing={2}>
        {underwritingNote && <Stack spacing={0.5}>
          {underwritingNote.title && <Typography variant="subtitle2" fontWeight={700}>{underwritingNote.title}</Typography>}
          <Typography variant="body2">{underwritingNote.text}</Typography>
        </Stack>}
        <Typography variant="body2" fontWeight={700}>{documentsNote ?? content.documentsNote}</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
          <Button variant="contained" startIcon={<FileDownloadRoundedIcon />} onClick={onDownloadApplication}>{content.documentDownloadLabels.application}</Button>
          {onDownloadPayment && <Button variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={onDownloadPayment}>{content.documentDownloadLabels.payment}</Button>}
        </Stack>
      </Stack>
    </InformationAlert>
  </Stack>;
}

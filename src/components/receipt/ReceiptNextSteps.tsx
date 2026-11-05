import { Alert, AlertTitle } from '@mui/material';
import type { ReceiptContent } from '../../content/types';
/** Receipt acknowledgement with client-supplied payment and welcome-kit guidance. */
export default function ReceiptNextSteps({ content }: { content: ReceiptContent['whatHappensNext'] }) {
  if (!content.title.trim() && !content.items.some(item => item.description.trim())) return null;
  return <Alert severity="info" role="status"><AlertTitle sx={{ mb: content.items.some(item => item.description.trim()) ? 0.5 : 0 }}>{content.title}</AlertTitle>{content.items.map(item => item.description).join(' ')}</Alert>;
}

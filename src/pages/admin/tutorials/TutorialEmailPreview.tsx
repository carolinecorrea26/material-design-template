import { useMemo } from 'react';
import { Alert } from '@mui/material';
import EmailPreview from '../../../components/docs/EmailPreview';
import { getMockEmailSamples, type MockEmailType } from '../../../utils/mockEmail';

/** The existing email renderer owns wording, recipients and applicant details. */
export default function TutorialEmailPreview({ siteId, type, onContinue }: { siteId: string; type: MockEmailType; onContinue?: () => void }) {
  const message = useMemo(() => getMockEmailSamples(siteId).find(item => item.type === type), [siteId, type]);
  if (!message) return <Alert severity="info">No example is available for this message.</Alert>;
  return <EmailPreview message={message} onContinue={onContinue} />;
}

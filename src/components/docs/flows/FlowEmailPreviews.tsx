import { useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailPreview from '../EmailPreview';
import type { EmailTemplateRow } from '../emailTemplateRows';
import { getMockEmailSamples } from '../../../utils/mockEmail';
import LibraryLink from '../../../pages/admin/library/LibraryLink';

export type FlowEmail = EmailTemplateRow & { key: string; label: string };
function FlowEmailItem({ email, siteId, initiallyExpanded }: { email: FlowEmail; siteId: string; initiallyExpanded: boolean }) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const message = expanded ? getMockEmailSamples(siteId, { resumeRecipient: email.recipient }).find(message => message.type === email.type) : undefined;
  return <Accordion expanded={expanded} onChange={(_, open) => setExpanded(open)} disableGutters>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="body2"><strong>{email.recipient}</strong> · {email.label}</Typography></AccordionSummary>
    <AccordionDetails><Stack spacing={1.5}>
      <Typography variant="body2">{email.whenSent}</Typography>
      <LibraryLink domain="emails" filters={{ q: email.key }}>Email definition</LibraryLink>
      {message && <EmailPreview message={message} />}
    </Stack></AccordionDetails>
  </Accordion>;
}

export default function FlowEmailPreviews({ emails, siteId, initiallyExpanded = false }: { emails: FlowEmail[]; siteId: string; initiallyExpanded?: boolean }) {
  return <Stack spacing={1} aria-label="Email previews">{emails.map(email => <FlowEmailItem key={`${siteId}:${email.key}:${email.recipient}`} email={email} siteId={siteId} initiallyExpanded={initiallyExpanded} />)}</Stack>;
}

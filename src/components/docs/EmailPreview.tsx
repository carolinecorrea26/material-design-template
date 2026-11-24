import { Box, Stack, Typography } from '@mui/material';
import type { MockEmailPreview } from '../../utils/mockEmail';

/** One email view for Library flow documentation and tutorial walkthroughs. */
export default function EmailPreview({ message, onContinue }: { message: MockEmailPreview; onContinue?: () => void }) {
  return <Stack spacing={1}>
    <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, overflowWrap: 'anywhere' }}><Typography variant="body2">From: {message.fromName} &lt;{message.fromEmail}&gt;</Typography><Typography variant="body2">To: {message.toEmail}</Typography><Typography fontWeight={700}>Subject: {message.subject}</Typography></Box>
    <Box component="iframe" title={message.subject} srcDoc={message.html} sandbox="allow-same-origin" onLoad={event => {
      event.currentTarget.contentDocument?.addEventListener('click', click => {
        const anchor = (click.target as HTMLElement).closest('a');
        if (!anchor) return;
        click.preventDefault();
        if (anchor.href.includes('/resume') || message.type === 'advisor-edit-request') onContinue?.();
      });
    }} sx={{ width: '100%', height: 720, border: '1px solid', borderColor: 'divider', bgcolor: 'white' }} />
  </Stack>;
}

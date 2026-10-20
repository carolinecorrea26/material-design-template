import { useState } from 'react';
import { Alert, Button, Link, Stack, Typography } from '@mui/material';
import { applicantRecovery, type ResumeMessage } from '../../services/applicantSaveService';

/** Explicit local delivery preview, never a real email/SMS send. */
export default function ApplicantMockOutbox({ applicationId, siteKey, recipient }: { applicationId: string; siteKey: string; recipient: string }) {
  const [messages, setMessages] = useState<ResumeMessage[]>([]);
  const [error, setError] = useState('');
  if (!import.meta.env.VITE_MOCK_PLATFORM_ENABLED || siteKey !== "demo") return null;
  async function refresh() {
    try { setMessages((await applicantRecovery.outbox(applicationId, siteKey, recipient)).messages); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Local outbox unavailable'); }
  }
  return <Stack spacing={1}>
    <Alert severity="info">Local delivery simulation. No email, text or phone call is sent.</Alert>
    <Button onClick={() => void refresh()}>Refresh local outbox</Button>
    {error && <Alert severity="error">{error}</Alert>}
    {messages.slice().reverse().map(message => <Typography key={message.id} variant="body2">
      {message.kind === 'link' ? <Link href={message.url}>Open simulated resume link</Link> : <>Simulated {message.method} code: <strong>{message.code}</strong></>}
      {' · '}{message.recipient}{' · expires '}{new Date(message.expiresAt).toLocaleTimeString()}
    </Typography>)}
  </Stack>;
}

import { Box, Card, CardContent, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { tutorialNotifications } from '../../../domain/tutorialNotifications';
import type { TutorialDefinition } from '../../../domain/tutorials';
import TutorialEmailPreview from './TutorialEmailPreview';
import TutorialReferenceScreens from './TutorialReferenceScreens';
import TutorialScreenPlaceholder from './TutorialScreenPlaceholder';

export default function TutorialNotifications({ siteId, tutorial }: { siteId: string; tutorial: TutorialDefinition }) {
  const [search, setSearch] = useSearchParams();
  const group = tutorialNotifications.types.find(item => item.id === search.get('notification')) ?? tutorialNotifications.types[0];
  const email = group.emails.find(item => item.recipient === search.get('recipient')) ?? group.emails[0];
  const reference = tutorial.variant === 'current' ? tutorial.notificationReferences?.[group.id] : undefined;
  const timings = [...new Set(group.emails.map(item => item.template.whenSent))];
  function select(parameter: string, value: string) {
    setSearch(previous => { const next = new URLSearchParams(previous); next.set(parameter, value); if (parameter === 'notification') next.delete('recipient'); return next; });
  }
  return <Stack spacing={2}>
    <Tabs value={group.id} onChange={(_, value: string) => select('notification', value)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Notification types" sx={{ borderBottom: '1px solid', borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none' } }}>{tutorialNotifications.types.map(item => <Tab key={item.id} value={item.id} label={item.label} id={`notification-${item.id}`} aria-controls="notification-details" />)}</Tabs>
    <Card component="section" id="notification-details" role="tabpanel" aria-labelledby={`notification-${group.id}`} variant="outlined"><CardContent><Stack spacing={3}>
      <Box><Typography component="h3" variant="subtitle1" fontWeight={800}>Type</Typography><Typography component="p" variant="h5">{group.label}</Typography></Box>
      <Box><Typography component="h3" variant="subtitle1" fontWeight={800}>Description</Typography><Typography>{group.description}</Typography></Box>
      <Box><Typography component="h3" variant="subtitle1" fontWeight={800}>When notified</Typography>{reference ? <Typography>{reference.whenNotified}</Typography> : timings.map(timing => <Typography key={timing}>{timing}</Typography>)}</Box>
      <Box><Typography component="h3" variant="subtitle1" fontWeight={800}>Content</Typography>
        <Tabs value={email.recipient} onChange={(_, value: string) => select('recipient', value)} aria-label="Email recipient" sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none' } }}>{group.emails.map(item => <Tab key={item.recipient} value={item.recipient} label={`${item.recipient} email`} id={`recipient-${group.id}-${item.recipient}`} aria-controls="notification-email" />)}</Tabs>
        <Box id="notification-email" role="tabpanel" aria-labelledby={`recipient-${group.id}-${email.recipient}`}>{tutorial.variant === 'current' ? reference?.screens[email.recipient]?.length ? <TutorialReferenceScreens tutorial={tutorial} screenIds={reference.screens[email.recipient]} /> : <TutorialScreenPlaceholder description={reference?.notes?.[email.recipient] ?? `Current-template capture needed: ${group.label} — ${email.recipient.toLowerCase()} email.`} /> : <TutorialEmailPreview key={`${group.id}:${email.recipient}`} siteId={siteId} type={email.template.type} />}</Box>
      </Box>
    </Stack></CardContent></Card>
  </Stack>;
}

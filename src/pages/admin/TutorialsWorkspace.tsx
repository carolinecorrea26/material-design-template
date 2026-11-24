import { useEffect, useRef, useState } from 'react';
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, List, ListItemButton, ListItemText, Stack, Tab, Tabs, Typography, useMediaQuery } from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import { Workspace, WorkspaceHeader } from '../../components/admin/AdminPrimitives';
import { tutorials, tutorialSectionSteps, tutorialApplicationAccess, type TutorialDefinition, type TutorialStep, type TutorialPreview } from '../../domain/tutorials';
import { resolveSiteId } from '../../data/activeSite';
import TutorialLivePage from './tutorials/TutorialLivePage';
import TutorialEmailPreview from './tutorials/TutorialEmailPreview';
import TutorialNotifications from './tutorials/TutorialNotifications';
import TutorialTroubleshooting from './tutorials/TutorialTroubleshooting';
import TutorialReferenceScreens from './tutorials/TutorialReferenceScreens';
import TutorialScreenPlaceholder from './tutorials/TutorialScreenPlaceholder';

export default function TutorialsWorkspace() {
  const { tutorialId } = useParams();
  const tutorial = tutorials.find(item => item.id === tutorialId);
  if (!tutorialId) return <Workspace><WorkspaceHeader title="Tutorials" description="Explore portal actions, notifications and troubleshooting." /><Stack spacing={2}>{tutorials.map(item => <Card key={item.id} variant="outlined"><CardContent><Stack spacing={2}><Typography variant="h5" component="h2">{item.title}</Typography><Typography>{item.summary}</Typography><Button component={RouterLink} to={`/admin-center/tutorials/${item.id}?site=${encodeURIComponent(resolveSiteId())}`} variant="contained" sx={{ alignSelf: 'flex-start' }}>Open tutorial</Button></Stack></CardContent></Card>)}</Stack></Workspace>;
  if (!tutorial) return <Workspace><WorkspaceHeader title="Tutorial not found" description="Choose an available guide." /><Button component={RouterLink} to={`/admin-center/tutorials?site=${encodeURIComponent(resolveSiteId())}`}>All tutorials</Button></Workspace>;
  return <TutorialActions key={tutorial.id} tutorial={tutorial} />;
}
function TutorialActions({ tutorial }: { tutorial: TutorialDefinition }) {
  const [search, setSearch] = useSearchParams();
  const desktop = useMediaQuery(theme => theme.breakpoints.up('lg'));
  const section = tutorial.sections.find(item => item.id === search.get('section')) ?? tutorial.sections[0];
  const steps = tutorialSectionSteps(tutorial, section);
  const index = Math.max(0, steps.findIndex(item => item.id === search.get('step')));
  const step: TutorialStep & { id: string } = steps[index] ?? { id: 'notifications', title: 'Email notifications', actor: section.actor, activeUser: 'Neither', accessStage: 'Unavailable', paragraphs: [] };
  const actor = step.actor === 'Current person' ? section.actor : step.actor;
  const access = tutorialApplicationAccess(step, actor);
  const siteId = resolveSiteId();
  const [override, setOverride] = useState<TutorialPreview | null>(null);
  const [showRecoveryEmail, setShowRecoveryEmail] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const key = `${section.id}/${step.id}`;
  useEffect(() => { setOverride(null); setShowRecoveryEmail(false); }, [key]);
  function go(sectionId: string, stepId?: string) {
    setSearch(previous => { const next = new URLSearchParams(previous); next.set('section', sectionId); next.delete('phase'); if (stepId) next.set('step', stepId); else next.delete('step'); return next; });
    heading.current?.focus();
  }
  function openEmailLink() {
    setShowRecoveryEmail(false);
    if (step.id === 'applicant-invitation') go(section.id, 'request-link');
    else if (section.id === 'revise' && step.id === 'advisor-edit-email') go(section.id, 'continue');
    else setOverride({ pageId: actor === 'Advisor' ? 'advisor-login' : 'resume', mode: actor === 'Advisor' ? 'continue' : 'request-link' });
  }
  const preview = showRecoveryEmail ? undefined : override ?? step.preview;
  const Icon = actor === 'Advisor' ? SupportAgentRoundedIcon : PersonRoundedIcon;
  return <Workspace>
    <WorkspaceHeader title={tutorial.title} description={tutorial.summary} actions={<Stack direction="row" spacing={1}>{tutorial.flowId && <Button component={RouterLink} to={`/admin-center/library/flows?site=${encodeURIComponent(siteId)}&flow=${tutorial.flowId}`}>View defined flow</Button>}<Button component={RouterLink} to={`/admin-center/tutorials?site=${encodeURIComponent(resolveSiteId())}`}>All tutorials</Button></Stack>} />
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, minWidth: 0 }}>
      <Box component="nav" aria-label="Tutorial contents" sx={{ width: { lg: 225 }, flexShrink: 0 }}>
        <Tabs orientation={desktop ? 'vertical' : 'horizontal'} value={section.id} variant="scrollable" scrollButtons="auto" aria-label="Tutorial actions" onChange={(_, value: string) => go(value)} sx={{ borderRight: { lg: 1 }, borderBottom: { xs: 1, lg: 0 }, borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none', alignItems: { lg: 'flex-start' }, textAlign: 'left', minHeight: 44 } }}>{tutorial.sections.map(item => <Tab key={item.id} value={item.id} label={item.title} />)}</Tabs>
        {!['notifications', 'troubleshooting'].includes(section.id) && <List aria-label="Topics in this action" sx={{ display: { xs: 'none', lg: 'block' }, mt: 2 }}>{steps.map(item => <ListItemButton key={item.id} selected={item.id === step.id} aria-current={item.id === step.id ? 'step' : undefined} onClick={() => go(section.id, item.id)}><ListItemText primary={item.title} slotProps={{ primary: { variant: 'body2', fontWeight: item.id === step.id ? 700 : 400 } }} /></ListItemButton>)}</List>}
      </Box>
      <Stack spacing={2} sx={{ minWidth: 0, flex: 1 }}>
        <Box><Typography component="h2" variant="h5" fontWeight={800}>{section.title}</Typography><Typography color="text.secondary">{section.description}</Typography></Box>
        {tutorial.referenceNote && section.id !== 'troubleshooting' && <Alert severity="info"><Stack spacing={1}>
          <Typography variant="body2">{tutorial.referenceNote}</Typography>
          {tutorial.exampleParticipants && <Box aria-label="People in these screenshots">{Object.entries(tutorial.exampleParticipants).map(([role, person]) => <Typography key={role} variant="body2" sx={{ overflowWrap: 'anywhere' }}><strong>{role}{person.name ? `: ${person.name}` : ''}</strong> — {person.email}</Typography>)}</Box>}
        </Stack></Alert>}
        {section.id === 'notifications' ? <TutorialNotifications siteId={siteId} tutorial={tutorial} /> : section.id === 'troubleshooting' ? <TutorialTroubleshooting /> : <>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2, bgcolor: actor === 'Advisor' ? 'primary.dark' : 'secondary.dark', color: 'common.white', borderRadius: 2 }}><Avatar sx={{ bgcolor: 'rgba(255,255,255,.15)', color: 'inherit' }}><Icon /></Avatar><Box><Typography fontWeight={800} variant="h6">{actor}</Typography><Typography>This person is taking the action shown below.</Typography></Box></Stack>
        <Stack spacing={1}>
          <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} aria-label="Application access in this example">{access.people.map(person => <Chip key={person.person} icon={person.status === 'unavailable' ? <LockRoundedIcon /> : <LockOpenRoundedIcon />} color={person.status === 'active' ? 'success' : person.status === 'available' ? 'info' : 'default'} variant={person.status === 'available' ? 'outlined' : 'filled'} label={person.label} />)}</Stack>
          <Typography variant="body2" color="text.secondary">{access.explanation}</Typography>
          <Typography variant="body2" color="text.secondary">{access.legend}</Typography>
        </Stack>
        <Card component="section" aria-labelledby="tutorial-step-title" variant="outlined"><CardContent><Stack spacing={2}>
          <Typography ref={heading} tabIndex={-1} component="h3" variant="h5" id="tutorial-step-title" sx={{ outline: 'none' }}>{step.title}</Typography>
          {step.paragraphs.map(text => <Typography key={text}>{text}</Typography>)}
          {step.note && <Alert severity="info">{step.note}</Alert>}
          {tutorial.variant === 'current' ? <><TutorialReferenceScreens tutorial={tutorial} screenIds={step.screens} />{step.placeholder && <TutorialScreenPlaceholder description={step.placeholder} />}</> : preview ? <TutorialLivePage siteId={siteId} preview={preview} actor={actor} step={step.id} /> : step.emailType || showRecoveryEmail ? <TutorialEmailPreview key={`${key}:${showRecoveryEmail}`} siteId={siteId} type={showRecoveryEmail ? 'advisor-sent-to-applicant' : step.emailType!} onContinue={openEmailLink} /> : null}
          {step.recovery && <Button variant="outlined" onClick={() => { if (step.recovery?.pageId) setOverride({ pageId: step.recovery.pageId, mode: step.recovery.mode! }); else { setOverride(null); setShowRecoveryEmail(true); } }}>{step.recovery.label}</Button>}
          <Stack direction="row" justifyContent="space-between" spacing={2}><Button disabled={index === 0} onClick={() => go(section.id, steps[index - 1].id)}>Previous step</Button><Button variant="contained" disabled={index === steps.length - 1} onClick={() => go(section.id, steps[index + 1].id)}>Next step</Button></Stack>
        </Stack></CardContent></Card>
        </>}
        {section.id !== 'troubleshooting' && <Typography variant="body2" color="text.secondary">{tutorial.variant === 'current' ? 'Existing-portal reference. Links visible inside captured emails are part of the image.' : section.id === 'notifications' ? 'Example email content. This preview does not send email.' : 'Interactive examples use fictional data. Access indicators illustrate the handoff model; real cross-user locks, delivery and underwriting services are not connected.'}</Typography>}
      </Stack>
    </Box>
  </Workspace>;
}

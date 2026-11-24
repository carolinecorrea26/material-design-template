import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogContent, DialogTitle, MenuItem, Stack, Step, StepContent, StepLabel, Stepper, TextField, Typography } from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { Workspace, WorkspaceHeader } from '../../components/admin/AdminPrimitives';
import { applicantAdminDefinition as definition, applicantAdminExamples, canUpdateApplicantAdminExample, readApplicantAdminAnswers } from '../../domain/applicantAdminDemo';
import { resolveSiteId } from '../../data/activeSite';
import SitePreview from '../../components/docs/SitePreview';
import { tutorialPreviewUrl } from './tutorials/TutorialLivePage';
import type { PageId } from '../../types';

export default function ApplicantAdminWorkspace() {
  const [id, setId] = useState(applicantAdminExamples[1].id);
  const application = applicantAdminExamples.find(item => item.id === id)!;
  const [editor, setEditor] = useState<PageId | null>(null);
  const [saved, setSaved] = useState('');
  const [details, setDetails] = useState(() => readApplicantAdminAnswers(id));
  const frameContainer = useRef<HTMLDivElement>(null);
  const siteId = resolveSiteId();
  const approved = canUpdateApplicantAdminExample(id);
  const activeStage = definition.stages.findIndex(item => item.id === application.stage);
  useEffect(() => { setDetails(readApplicantAdminAnswers(id)); setSaved(''); setEditor(null); }, [id]);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const frame = frameContainer.current?.querySelector('iframe');
      if (event.origin !== window.location.origin || event.source !== frame?.contentWindow || event.data?.type !== 'applicant-demo-saved' || event.data.record !== id || event.data.pageId !== editor) return;
      setDetails(readApplicantAdminAnswers(id)); setSaved(`${editor === 'payment' ? 'Payment' : 'Beneficiary'} information saved for this example.`); setEditor(null);
    };
    window.addEventListener('message', onMessage); return () => window.removeEventListener('message', onMessage);
  }, [id, editor]);
  return <Workspace>
    <WorkspaceHeader title={definition.title} description={definition.description} />
    <Alert severity="info">Fast Track prototype · fictional submitted applications. Status updates and changes here do not reach a plan administrator, insurer or payment service.</Alert>
    <TextField select label="Preview application" value={id} onChange={event => setId(event.target.value)} sx={{ maxWidth: 560 }}>{applicantAdminExamples.map(item => <MenuItem key={item.id} value={item.id}>{item.reference} · {item.status === 'Approved' ? 'Approved' : definition.stages.find(stage => stage.id === item.stage)?.label}</MenuItem>)}</TextField>
    <Card variant="outlined"><CardContent><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}><Box><Typography component="h2" variant="h6">Application {application.reference}</Typography><Typography>{application.applicant}</Typography></Box><Chip label={approved ? 'Approved' : 'In review'} color={approved ? 'success' : 'info'} /></Stack></CardContent></Card>
    <Card variant="outlined"><CardContent><Typography component="h2" variant="h5" gutterBottom>Application progress</Typography><Stepper activeStep={activeStage} orientation="vertical">{definition.stages.map((stage, index) => <Step key={stage.id} expanded completed={index < activeStage || approved}><StepLabel><Typography fontWeight={800}>{stage.label}</Typography><Typography variant="body2" color="text.secondary">{index < activeStage || approved ? 'Complete' : index === activeStage ? 'In progress' : 'Upcoming'} · {stage.owner}</Typography></StepLabel><StepContent><Typography>{stage.description}</Typography>{stage.id === 'final-decision' && approved && <Alert severity="success" sx={{ mt: 2 }}>Approved. You will receive your welcome kit and more information about your coverage.</Alert>}</StepContent></Step>)}</Stepper></CardContent></Card>
    <Card variant="outlined"><CardContent><Stack spacing={2}><Typography component="h2" variant="h5">Payment and beneficiaries</Typography><Typography>{approved ? 'Add or review the information needed after approval.' : 'These actions become available after your application is approved.'}</Typography><Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>{definition.approvedActions.map(action => <Button key={action.pageId} variant="outlined" disabled={!approved} startIcon={!approved ? <LockRoundedIcon /> : undefined} onClick={() => setEditor(action.pageId as PageId)}>{action.label}</Button>)}</Stack>{saved && <Alert severity="success">{saved}</Alert>}{Object.keys(details).length > 0 && <Typography variant="body2">Saved example details are available when you reopen the forms.</Typography>}</Stack></CardContent></Card>
    <Dialog open={editor !== null} onClose={() => setEditor(null)} maxWidth="lg" fullWidth><DialogTitle>{editor === 'payment' ? 'Payment information' : 'Beneficiary information'}<Button onClick={() => setEditor(null)} sx={{ float: 'right' }}>Close</Button></DialogTitle><DialogContent><Typography sx={{ mb: 2 }}>Use fictional details. Choose Next on the form to validate and save this example.</Typography><Box ref={frameContainer}>{editor && <SitePreview siteId={siteId} clientName={siteId} homePath={tutorialPreviewUrl(siteId, { pageId: editor, mode: 'applicant-admin' }, 'Applicant', undefined, id)} />}</Box></DialogContent></Dialog>
  </Workspace>;
}

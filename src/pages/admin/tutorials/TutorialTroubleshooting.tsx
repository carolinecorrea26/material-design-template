import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import troubleshooting from '../../../../requirements/global/tutorials/troubleshooting.json';

/** Shared guidance only; the FAQ does not implement recovery or access rules. */
export default function TutorialTroubleshooting() {
  return <Stack spacing={1} aria-label="Troubleshooting frequently asked questions">
    {troubleshooting.questions.map((item, index) => <Accordion key={item.id} defaultExpanded={index === 0} disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
      <AccordionSummary id={`${item.id}-question`} aria-controls={`${item.id}-answer`} expandIcon={<ExpandMoreRoundedIcon />}><Typography component="span" variant="body1" fontWeight="normal">{item.question}</Typography></AccordionSummary>
      <AccordionDetails id={`${item.id}-answer`}><Stack spacing={2}>{item.answers.map((answer, answerIndex) => <Typography key={answerIndex} color="text.disabled" fontWeight="normal">{'label' in answer && `${answer.label}: `}{answer.text}</Typography>)}</Stack></AccordionDetails>
    </Accordion>)}
  </Stack>;
}

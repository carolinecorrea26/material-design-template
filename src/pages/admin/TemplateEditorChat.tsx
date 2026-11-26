import { useState, type FormEvent } from 'react';
import { Box, Button, Checkbox, FormControlLabel, Paper, Stack, TextField, Typography } from '@mui/material';
import { templateProperties, templateProperty, type TemplateEdit, type TemplatePropertyId } from '../../domain/templateEdits.mjs';
import type { TemplateEditorData } from '../../services/templateEditor';

const questions = {
  property: 'What would you like to edit?',
  scope: 'Where should this change apply?',
  sites: 'Which Sites should get this change?',
  wording: 'What wording should the editor use?',
  reason: 'Why are you making this change?',
  review: 'Ready to save this change to the draft?',
  done: 'Saved. Open the draft to review Site impact and preview the change.',
};
type Step = keyof typeof questions;
type Turn = { step: Step; answer: string };

type Props = {
  data: Pick<TemplateEditorData, 'sites' | 'values'>;
  busy: boolean;
  draftReason?: string;
  onSave: (changes: TemplateEdit[], reason: string) => Promise<boolean>;
};

export default function TemplateEditorChat({ data, busy, draftReason, onSave }: Props) {
  const [step, setStep] = useState<Step>('property');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [propertyId, setPropertyId] = useState<TemplatePropertyId | null>(null);
  const [sites, setSites] = useState<string[]>([]);
  const [entry, setEntry] = useState('');
  const [wording, setWording] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const property = propertyId ? templateProperty(propertyId) : undefined;
  const next = (phase: Step, answer: string) => {
    setTurns(previous => [...previous, { step, answer }]);
    setStep(phase);
    setEntry('');
  };

  const chooseProperty = (id: TemplatePropertyId) => {
    const selected = templateProperty(id)!;
    setPropertyId(id);
    next(selected.siteOverride ? 'scope' : 'wording', selected.label);
  };

  const chooseWording = (value: string | null) => {
    setWording(value);
    next(draftReason ? 'review' : 'reason', value ?? 'Use global default');
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const answer = entry.trim();
    switch (step) {
      case 'sites':
        if (sites.length) next('wording', data.sites.filter(site => sites.includes(site.key)).map(site => site.name).join(', '));
        break;
      case 'wording':
        if (answer) chooseWording(answer);
        break;
      case 'reason':
        if (answer) { setReason(answer); next('review', answer); }
        break;
      case 'review': {
        if (!propertyId) return;
        const targets = sites.length ? sites : [null];
        const saved = await onSave(targets.map(site => ({ property: propertyId, site, value: wording })), draftReason ?? reason);
        if (saved) next('done', 'Save to draft');
        break;
      }
    }
  }

  function restart() {
    setStep('property');
    setTurns([]);
    setPropertyId(null);
    setSites([]);
    setEntry('');
    setWording(null);
    setReason('');
  }

  return <Paper component="section" aria-label="Ask to edit" variant="outlined" sx={{ p: 2 }}>
    <Stack gap={2} component="form" onSubmit={event => void submit(event)}>
      <Typography component="h2" variant="h6">Ask to edit</Typography>
      {draftReason && <Typography variant="body2" color="text.secondary">Changes will be added to the open draft.</Typography>}
      {turns.length > 0 && <Stack gap={1} sx={{ maxHeight: 200, overflowY: 'auto' }}>
        {turns.map(turn => <Box key={turn.step} sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
          <Typography variant="caption" color="text.secondary">{questions[turn.step]}</Typography>
          <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{turn.answer}</Typography>
        </Box>)}
      </Stack>}
      <Typography component="h3" variant="subtitle2" aria-live="polite">{questions[step]}</Typography>
      {step === 'property' && templateProperties.map(option => <Button key={option.id} variant="outlined" disabled={busy} onClick={() => chooseProperty(option.id)}>{option.label}</Button>)}
      {step === 'scope' && <>
        <Button variant="outlined" disabled={busy} onClick={() => next('wording', 'Global template')}>Global template</Button>
        <Button variant="outlined" disabled={busy || !data.sites.length} onClick={() => next('sites', 'Selected Sites')}>Selected Sites</Button>
      </>}
      {step === 'sites' && <>
        <Stack>{data.sites.map(site => <FormControlLabel key={site.key} label={site.name} control={<Checkbox
          checked={sites.includes(site.key)} disabled={busy}
          onChange={(_, checked) => setSites(current => checked ? [...current, site.key] : current.filter(key => key !== site.key))}
        />} />)}</Stack>
        <Button type="submit" variant="outlined" disabled={busy || !sites.length}>Confirm Sites</Button>
      </>}
      {step === 'wording' && property && <>
        <Typography variant="body2">Used in {property.usage}.</Typography>
        {(sites.length ? data.sites.filter(site => sites.includes(site.key)) : [{ key: 'global', name: 'Global template' }]).map(site => (
          <Typography key={site.key} variant="body2" color="text.secondary">{site.name} · {data.values[property.id][site.key]?.effective}</Typography>
        ))}
        <TextField label="New wording" value={entry} onChange={event => setEntry(event.target.value)} disabled={busy} slotProps={{ htmlInput: { maxLength: 200 } }} />
        <Button type="submit" variant="outlined" disabled={busy || !entry.trim()}>Confirm wording</Button>
        {sites.length > 0 && <Button disabled={busy} onClick={() => chooseWording(null)}>Use global default</Button>}
      </>}
      {step === 'reason' && <>
        <TextField label="Reason" value={entry} onChange={event => setEntry(event.target.value)} disabled={busy} slotProps={{ htmlInput: { maxLength: 1000 } }} />
        <Button type="submit" variant="outlined" disabled={busy || !entry.trim()}>Review edit</Button>
      </>}
      {step === 'review' && <Button type="submit" variant="contained" disabled={busy}>Save to draft</Button>}
      {step !== 'property' && <Button disabled={busy} onClick={restart}>{step === 'done' ? 'Start another edit' : 'Start over'}</Button>}
    </Stack>
  </Paper>;
}

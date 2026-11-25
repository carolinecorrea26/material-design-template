import { useState } from 'react';
import { Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import type { EffectiveSite } from '../../domain/effectiveSite';
import { editDraftEligibility, type DraftEligibilityBounds, type LibraryDraft } from '../../domain/libraryDraft';
import { BuilderText } from './SiteBuilderIdentityFields';

const labels = {
  minimumAgeYears: 'Minimum age (years)', maximumAgeYears: 'Maximum age (years)',
  minimumAgeDays: 'Minimum age (days)', studentMaximumAgeYears: 'Maximum student age (years)',
  minimumWorkHours: 'Minimum weekly work hours',
} satisfies Record<keyof DraftEligibilityBounds, string>;

const keys = Object.keys(labels) as (keyof DraftEligibilityBounds)[];

function BoundsForm({ bounds, apply }: { bounds: DraftEligibilityBounds | undefined; apply: (values: DraftEligibilityBounds) => void }) {
  const [values, setValues] = useState(() => Object.fromEntries(keys.map(key => [key, bounds?.[key]?.toString() ?? ''])));
  return <Stack spacing={1}>
    <Typography variant="body2">Leave a bound blank when it does not apply to this applicant.</Typography>
    {keys.map(key => <BuilderText key={key} field={{ id: `eligibility-${key}`, label: labels[key], inputType: 'text', inputMode: key === 'minimumWorkHours' ? 'decimal' : 'numeric' }} value={values[key]}
      onChange={value => setValues(previous => ({ ...previous, [key]: value }))} />)}
    <Button sx={{ alignSelf: 'flex-start' }} onClick={() => apply(Object.fromEntries(keys.map(key => [key, values[key].trim() ? Number(values[key]) : null])) as DraftEligibilityBounds)}>Apply eligibility bounds</Button>
  </Stack>;
}

export default function DraftProductEligibility({ draft, product, update }: {
  draft: LibraryDraft;
  product: EffectiveSite['products'][number];
  update: (edit: () => LibraryDraft) => void;
}) {
  const [selection, setSelection] = useState('');
  const selected = product.applicants.find(applicant => applicant.applicantKey === selection) ?? product.applicants[0];
  if (!selected) return null;
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}>
    <Typography variant="h6">Product eligibility</Typography>
    <TextField select label="Applicant" value={selected.applicantKey} onChange={event => setSelection(event.target.value)}>
      {product.applicants.map(applicant => <MenuItem key={applicant.applicantKey} value={applicant.applicantKey}>{applicant.applicantKey}</MenuItem>)}
    </TextField>
    <BoundsForm key={selected.applicantKey} bounds={selected.constraints?.value}
      apply={values => update(() => editDraftEligibility(draft, product.productKey, selected.applicantKey, values))} />
  </Stack></Paper>;
}

import { useState } from 'react';
import { Alert, FormControlLabel, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { editDraftBenefitPolicy, type LibraryDraft } from '../../domain/libraryDraft';
import { isBenefitPolicy, resolveNormalizedBenefit } from '../../domain/benefitPolicy';
import { resolveEffectiveSite } from '../../domain/effectiveSite';
export default function DerivedBenefitEditor({ draft, update }: { draft: LibraryDraft; update: (fn: () => LibraryDraft) => void }) {
  const site = resolveEffectiveSite(draft.data, draft.siteKey);
  const [income, setIncome] = useState(5000), [existing, setExisting] = useState(0), [age, setAge] = useState(40);
  const policies = site.configuration.products.flatMap(p => p.benefitPolicies.filter(v => isBenefitPolicy(v.value)).map(v => ({ productKey: p.productKey, policy: v.value as import('../../domain/benefitPolicy').BenefitPolicy })));
  if (!policies.length) return null;
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack gap={2}><Typography variant="h6">Derived benefit controls and test facts</Typography><Stack direction={{ xs: 'column', sm: 'row' }} gap={1}><TextField label="Scenario monthly income" type="number" value={income} onChange={e => setIncome(Number(e.target.value))} /><TextField label="Scenario existing benefit" type="number" value={existing} onChange={e => setExisting(Number(e.target.value))} /><TextField label="Scenario age" type="number" value={age} onChange={e => setAge(Number(e.target.value))} /></Stack>
  {policies.map(({ productKey, policy }) => <Stack key={productKey} gap={1}><Typography variant="subtitle1">{productKey}</Typography>{policy.applicants.map(rule => {
    const decision = resolveNormalizedBenefit(site, productKey, rule.applicantKey, { monthlyIncome: income, existingMonthlyBenefit: existing, ageYears: age, applicantClass: rule.applicantClass });
    const patch = (value: Partial<typeof rule>) => update(() => editDraftBenefitPolicy(draft, productKey, { ...policy, applicants: policy.applicants.map(r => r === rule ? { ...r, ...value } : r) }));
    return <Stack key={`${rule.applicantKey}-${rule.applicantClass}`} gap={1}><Typography>{rule.applicantKey} {rule.applicantClass ?? ''}</Typography><Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>{(['minimum', 'maximum', 'increment'] as const).map(key => <TextField key={key} label={`${rule.applicantKey} ${key}`} type="number" value={rule[key]} onChange={e => patch({ [key]: Number(e.target.value) })} />)}</Stack>{rule.income && <><TextField label="Income percentage" type="number" value={rule.income.fraction * 100} onChange={e => patch({ income: { ...rule.income!, fraction: Number(e.target.value) / 100 } })} /><FormControlLabel label="Subtract existing benefit" control={<Switch checked={rule.income.subtractExisting} onChange={(_, subtractExisting) => patch({ income: { ...rule.income!, subtractExisting } })} />} /></>}
    <Alert severity={decision.status === 'resolved' ? 'info' : 'warning'}>Scenario result: {decision.status} · maximum {decision.maximum ?? 'unresolved'} · {decision.errors.join('; ') || decision.missingFacts.join(', ') || 'No formula errors'}</Alert></Stack>;
  })}</Stack>)}
  </Stack></Paper>;
}

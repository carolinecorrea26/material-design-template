import { useState } from 'react';
import { Alert, Button, FormControlLabel, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { editDraftBenefitPolicy, type LibraryDraft } from '../../domain/libraryDraft';
import { isBenefitPolicy, resolveNormalizedBenefit, type BenefitApplicantPolicy, type BenefitFacts } from '../../domain/benefitPolicy';
import type { EffectiveSite } from '../../domain/effectiveSite';

const amounts = {
  minimum: 'Minimum benefit',
  maximum: 'Maximum benefit',
  increment: 'Benefit increment',
} as const;

function BenefitFormula({ rule, site, productKey, facts, apply }: {
  rule: BenefitApplicantPolicy;
  site: EffectiveSite;
  productKey: string;
  facts: BenefitFacts;
  apply: (next: BenefitApplicantPolicy) => void;
}) {
  const [minimum, setMinimum] = useState(String(rule.minimum));
  const [maximum, setMaximum] = useState(String(rule.maximum));
  const [increment, setIncrement] = useState(String(rule.increment));
  const [income, setIncome] = useState(rule.income ? String(rule.income.fraction * 100) : '');
  const [subtractExisting, setSubtractExisting] = useState(!!rule.income?.subtractExisting);
  const inputs = { minimum: [minimum, setMinimum], maximum: [maximum, setMaximum], increment: [increment, setIncrement] } as const;
  const invalid = [minimum, maximum, increment, ...(rule.income ? [income] : [])].some(value => !value.trim());
  const decision = resolveNormalizedBenefit(site, productKey, rule.applicantKey, { ...facts, applicantClass: rule.applicantClass });
  return <Stack spacing={1}>
    <Typography variant="subtitle1">{[rule.applicantKey, rule.applicantClass].filter(Boolean).join(' · ')}</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      {Object.entries(inputs).map(([key, [value, setValue]]) =>
        <TextField key={key} label={amounts[key as keyof typeof amounts]} type="number" value={value} onChange={event => setValue(event.target.value)} required />,
      )}
    </Stack>
    {rule.income && <>
      <TextField label="Income percentage" type="number" value={income} onChange={event => setIncome(event.target.value)} required />
      <FormControlLabel label="Subtract existing benefit" control={<Switch checked={subtractExisting} onChange={(_, checked) => setSubtractExisting(checked)} />} />
    </>}
    <Button sx={{ alignSelf: 'flex-start' }} disabled={invalid} onClick={() => apply({
      ...rule, minimum: Number(minimum), maximum: Number(maximum), increment: Number(increment),
      ...(rule.income && { income: { ...rule.income, fraction: Number(income) / 100, subtractExisting } }),
    })}>Apply benefit formula</Button>
    <Alert severity={decision.status === 'resolved' ? 'info' : 'warning'}>
      {[`Scenario ${decision.status}`, decision.maximum === undefined ? 'No resolved maximum' : `Maximum ${decision.maximum}`,
        ...decision.errors, ...decision.missingFacts].join(' · ')}
    </Alert>
  </Stack>;
}

export default function DerivedBenefitEditor({ draft, update, site, productKey }: {
  draft: LibraryDraft;
  update: (fn: () => LibraryDraft) => void;
  site: EffectiveSite;
  productKey: string;
}) {
  const [income, setIncome] = useState(5000);
  const [existing, setExisting] = useState(0);
  const [age, setAge] = useState(40);
  const policies = site.configuration.products.find(product => product.productKey === productKey)?.benefitPolicies;
  const policy = policies?.length === 1 ? policies[0].value : undefined;
  if (!isBenefitPolicy(policy)) return null;
  const facts = { monthlyIncome: income, existingMonthlyBenefit: existing, ageYears: age };
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}>
    <Typography variant="h6">Derived benefit formulas</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <TextField label="Scenario monthly income" type="number" value={income} onChange={event => setIncome(Number(event.target.value))} />
      <TextField label="Scenario existing benefit" type="number" value={existing} onChange={event => setExisting(Number(event.target.value))} />
      <TextField label="Scenario age" type="number" value={age} onChange={event => setAge(Number(event.target.value))} />
    </Stack>
    {policy.applicants.map(rule => <BenefitFormula key={`${rule.applicantKey}/${rule.applicantClass ?? ''}`} rule={rule} site={site} productKey={productKey} facts={facts}
      apply={next => update(() => editDraftBenefitPolicy(draft, productKey, { ...policy, applicants: policy.applicants.map(row => row === rule ? next : row) }))} />)}
  </Stack></Paper>;
}

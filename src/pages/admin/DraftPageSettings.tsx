import { useState } from 'react';
import { Alert, Button, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import type { FieldDefinition } from '../../domain/fields';
import type { EffectiveSite } from '../../domain/effectiveSite';
import { freshStartSource } from '../../domain/freshStartCatalog';
import { editDraftMembershipQuestion, editDraftMemberId, editDraftPageCopy, editDraftPageSetting, type LibraryDraft } from '../../domain/libraryDraft';
import type { Json } from '../../persistence/types';
import { BuilderText } from './SiteBuilderIdentityFields';

type Props = { draft: LibraryDraft; update: (edit: () => LibraryDraft) => void };

function MembershipOptions({ draft, update, question, memberId, included }: Props & {
  question: FieldDefinition;
  memberId?: FieldDefinition;
  included: boolean;
}) {
  const associationMode = draft.data.sitePolicies.find(row => row.siteKey === draft.siteKey)?.definition.associationSelection?.mode === 'select';
  const choices = Object.entries(question.configurations ?? {}).filter(([key]) => associationMode ? key === 'association' : key !== 'association');
  const names: Record<string, string> = { 'yes-no': 'Yes or no (radio)', 'new-or-current': 'New or current member (radio)', category: 'Custom options (dropdown)', association: 'Association selector' };
  const [configuration, setConfiguration] = useState(question.configuration ?? 'yes-no');
  const [label, setLabel] = useState(question.label);
  const [options, setOptions] = useState<FieldDefinition['options']>(question.configuration === 'category' ? question.options ?? [] : []);
  const outcomes = [...new Set(choices.flatMap(([, variant]) => variant.options?.map(option => option.outcome) ?? []).filter(Boolean))];
  const [showId, setShowId] = useState(included);
  const [idLabel, setIdLabel] = useState(memberId?.label ?? 'Member ID');
  const [requireId, setRequireId] = useState(!!memberId?.required);
  const [digitsOnly, setDigitsOnly] = useState(memberId?.format === 'digits');
  const [minimum, setMinimum] = useState(memberId?.minLength?.toString() ?? '');

  return <Stack spacing={2}>
    <Typography variant="subtitle1">Membership question</Typography>
    <TextField select label="Question type" value={configuration} onChange={event => {
      setConfiguration(event.target.value);
      setLabel(question.configurations?.[event.target.value]?.label ?? question.label);
    }}>{choices.map(([key]) => <MenuItem value={key} key={key}>{names[key] ?? key}</MenuItem>)}</TextField>
    <BuilderText field={{ id: 'membership-prompt-edit', inputType: 'text', label: 'Question prompt', required: true }} value={label} onChange={setLabel} />
    {configuration === 'category' && <Stack spacing={1}>
      {(options ?? []).map((option, index) => <Stack key={option.value} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <BuilderText field={{ id: `membership-option-${option.value}`, inputType: 'text', label: `Choice ${index + 1}`, required: true }} value={option.label}
          onChange={value => setOptions(previous => previous?.map(item => item === option ? { ...item, label: value } : item))} />
        <TextField select label="Eligibility outcome" sx={{ minWidth: 170 }} value={option.outcome ?? ''}
          onChange={event => setOptions(previous => previous?.map(item => item === option ? { ...item, outcome: event.target.value } : item))}>
          {outcomes.map(outcome => <MenuItem key={outcome} value={outcome}>{outcome?.replaceAll('-', ' ')}</MenuItem>)}
        </TextField>
        <Button onClick={() => setOptions(previous => previous?.filter(item => item !== option))}>Remove</Button>
      </Stack>)}
      <Button sx={{ alignSelf: 'flex-start' }} onClick={() => setOptions(previous => [...(previous ?? []), { value: crypto.randomUUID(), label: '', outcome: outcomes[0] }])}>Add choice</Button>
    </Stack>}
    <Button sx={{ alignSelf: 'flex-start' }} onClick={() => update(() => editDraftMembershipQuestion(draft, configuration, label, options))}>Apply question</Button>
    <Typography variant="subtitle1">Additional membership information</Typography>
    <FormControlLabel label="Collect Member ID after an accepted Membership answer" control={<Switch checked={showId} onChange={(_, checked) => setShowId(checked)} />} />
    {showId && <Stack spacing={1}>
      <BuilderText field={{ id: 'member-id-label-edit', inputType: 'text', label: 'Member ID label', required: true }} value={idLabel} onChange={setIdLabel} />
      <FormControlLabel label="Require Member ID" control={<Switch checked={requireId} onChange={(_, checked) => setRequireId(checked)} />} />
      <FormControlLabel label="Digits only" control={<Switch checked={digitsOnly} onChange={(_, checked) => setDigitsOnly(checked)} />} />
      <TextField type="number" label="Minimum Member ID length" value={minimum} onChange={event => setMinimum(event.target.value)} helperText="Leave blank to use the shared minimum." />
    </Stack>}
    <Button sx={{ alignSelf: 'flex-start' }} onClick={() => update(() => editDraftMemberId(draft, {
      included: showId, required: requireId, digitsOnly, minLength: minimum ? Number(minimum) : null, label: idLabel,
    }))}>Apply Member ID settings</Button>
  </Stack>;
}

function CopySlot({ initial, label, kind, optional, onSave }: {
  initial: Json;
  label: string;
  kind?: 'image' | 'notice' | 'notes';
  optional?: boolean;
  onSave: (value: Json) => void;
}) {
  const [value, setValue] = useState(initial);
  const text = (key: string) => value && typeof value === 'object' && !Array.isArray(value) ? String(value[key] ?? '') : '';
  const pairs = kind === 'image' ? [['src', 'Image path or HTTPS URL'], ['alt', 'Image description']]
    : kind === 'notice' ? [['title', 'Notice title'], ['text', 'Notice message']] : [];
  return <Stack spacing={1}>
    {pairs.length ? pairs.map(([key, name]) => <BuilderText key={key} field={{ id: `copy-${key}`, label: name, inputType: 'text', required: true, multiline: key === 'text' }}
      value={text(key)} onChange={next => setValue(previous => ({ ...(previous && typeof previous === 'object' && !Array.isArray(previous) ? previous : {}), [key]: next }))} />)
      : <BuilderText field={{ id: 'page-copy-edit', label, inputType: 'text', multiline: true, required: !optional }} value={String(value ?? '')} onChange={setValue} />}
    <Button sx={{ alignSelf: 'flex-start' }} onClick={() => onSave(value)}>Apply copy</Button>
  </Stack>;
}

function SettingValue({ id, label, setting, initial, draft, update }: Props & {
  id: string;
  label: string;
  setting: ReturnType<typeof freshStartSource>['configurations'][number];
  initial: Json;
}) {
  const apply = (value: Json) => update(() => editDraftPageSetting(draft, id, value));
  const [value, setValue] = useState(() => typeof initial === 'string' ? Object.keys(setting.runtimeValues ?? {}).find(key => setting.runtimeValues?.[key] === initial) ?? initial : Array.isArray(initial) ? initial.join(', ') : initial == null ? '' : String(initial));
  if (setting.type === 'boolean') return <FormControlLabel label={label} control={<Switch checked={initial === true} onChange={(_, checked) => apply(checked)} />} />;
  if (setting.type === 'enum') return <TextField select label={label} value={value} onChange={event => {
    const next = event.target.value;
    setValue(next);
    apply(next);
  }} helperText={id === 'home-variant' ? 'The default shows a quote when quoting and rates are enabled, and an image otherwise.' : undefined}>
    {setting.options?.map(option => <MenuItem key={option} value={option}>{id === 'home-variant' ? option === 'default' ? 'Default (quote when available)' : 'Always use hero image' : option.replaceAll('-', ' ')}</MenuItem>)}
  </TextField>;
  return <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
    <BuilderText field={{ id: `setting-${id}`, label, inputType: 'text', ...(setting.type === 'number' && { inputMode: 'decimal' }), helperText: setting.type === 'string-list' ? 'Separate values with commas.' : undefined }} value={value} onChange={setValue} />
    <Button onClick={() => apply(setting.type === 'string-list' ? value.split(',').map(item => item.trim()).filter(Boolean) : value.trim() ? Number(value) : null)}>Apply</Button>
  </Stack>;
}

export default function DraftPageSettings({ draft, update, page }: Props & { page: EffectiveSite['configuration']['pages'][number] }) {
  const [source] = useState(freshStartSource);
  const specification = source.pages[page.key];
  const slots = Object.entries(specification?.contentSlots ?? {}).filter(([, slot]) => slot.kind !== 'notes');
  const [slotKey, setSlotKey] = useState('');
  const slot = slots.find(([key]) => key === slotKey)?.[1];
  const copy = page.key && slotKey ? draft.data.contentValues.find(row => row.siteKey === draft.siteKey && row.scope === 'site' && row.contentKey === slotKey)?.value
    ?? draft.data.contentValues.find(row => row.scope === 'global' && row.contentKey === slotKey)?.value : undefined;
  const ids = new Set([
    ...Object.values(source.fields.sitePages ?? {}).flatMap(site => {
      const assignment = site[page.key] as { configurations?: Record<string, unknown> } | undefined;
      return Object.keys(assignment?.configurations ?? {});
    }),
    ...slots.flatMap(([, value]) => value.requiredWhen ? [value.requiredWhen.configuration] : []),
    ...Object.entries(source.configurationBindings).filter(([, path]) =>
      page.key === 'payment' && path.startsWith('applicantExperience.payment.') ||
      page.key === 'eligibility' && /^(tpaIntegration\.|applicantExperience\.eligibleStates)/.test(path) ||
      page.key === 'beneficiary' && path.startsWith('beneficiaryPolicy.')
    ).map(([id]) => id),
  ]);
  const settings = source.configurations.filter(setting => ids.has(setting.id) && !setting.globalOnly && !!source.configurationBindings[setting.id]).flatMap(setting => {
    const definition = draft.data.configurationDefinitions.find(row => row.definition.path?.join('.') === source.configurationBindings[setting.id]);
    if (!definition) return [];
    const rows = draft.data.configurationValues.filter(row => row.configurationKey === definition.key);
    const value = rows.find(row => row.scope === 'site' && row.siteKey === draft.siteKey)?.value ?? rows.find(row => row.scope === 'global')?.value ?? null;
    const metadata = definition.definition.metadata;
    const label = metadata && typeof metadata === 'object' && !Array.isArray(metadata) && typeof metadata.label === 'string' ? metadata.label : setting.id;
    return [{ setting, label, value }];
  });
  const question = page.key === 'membership' ? page.fields.find(field => field.key === 'membership')?.definition : undefined;
  const memberId = page.fields.find(field => field.key === 'member-id');
  return <Paper variant="outlined" sx={{ p: 2 }}><Stack spacing={2}>
    <Typography variant="h6">Page options</Typography>
    {settings.map(({ setting, label, value }) => <SettingValue key={setting.id} id={setting.id} label={label} setting={setting} initial={value} draft={draft} update={update} />)}
    {question && <MembershipOptions draft={draft} update={update} question={question} memberId={memberId?.definition} included={!!memberId?.included} />}
    {slots.length > 0 && <>
      <TextField select label="Page copy to customize" value={slotKey} onChange={event => setSlotKey(event.target.value)}
        slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
        <MenuItem value="">Choose page copy</MenuItem>
        {slots.map(([key, value]) => <MenuItem value={key} key={key}>{value.name}</MenuItem>)}
      </TextField>
      {slot && copy !== undefined && <CopySlot key={slotKey} initial={copy} label={slot.name} kind={slot.kind} optional={slot.optional} onSave={value => update(() => editDraftPageCopy(draft, page.key, slotKey, value))} />}
      {slot && copy === undefined && <Alert severity="info">This copy is unavailable in the current draft.</Alert>}
    </>}
    {!settings.length && !slots.length && !question && <Typography color="text.secondary">This page uses the shared template settings.</Typography>}
  </Stack></Paper>;
}

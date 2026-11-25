import { useForm } from 'react-hook-form';
import { Button, Stack, Typography } from '@mui/material';
import AddressFields, { addressFieldNames } from '../../components/forms/AddressFields';
import ControlledFieldRenderer from '../../components/forms/ControlledFieldRenderer';
import LogoUploadField from '../../components/admin/LogoUploadField';
import type { FieldDefinition } from '../../domain/fields';
import type { LibraryDraft } from '../../domain/libraryDraft';
import { prefillAssociationFromTpa, suggestIdentityAcronym, type SiteBuildIdentity } from '../../domain/siteBuild';

export function BuilderText({ field, value, onChange }: {
  field: FieldDefinition;
  value?: string;
  onChange: (value: string) => void;
}) {
  return <ControlledFieldRenderer field={field} value={value ?? ''} onChange={next => onChange(String(next))} />;
}

function storedField(draft: LibraryDraft, key: string): FieldDefinition {
  const field = draft.data.fields.find(row => row.key === key)?.definition;
  if (!field) throw new Error(`Missing shared Builder field: ${key}`);
  return field;
}

const addressKeys = {
  'street-address': 'street', 'apt-suite': 'unit', city: 'city', state: 'state', 'zip-code': 'zip',
} as const;

function IdentityAddress({ label, draft, address, onChange }: {
  label: string;
  draft: LibraryDraft;
  address?: SiteBuildIdentity['organizationAddress'];
  onChange: (value: SiteBuildIdentity['organizationAddress']) => void;
}) {
  const { control, formState: { errors }, getValues } = useForm<Record<string, string | boolean | string[]>>({
    values: Object.fromEntries(addressFieldNames.map(id => [id, address?.[addressKeys[id]] ?? ''])),
  });
  const fields = addressFieldNames.map(id => storedField(draft, id));
  return <Stack spacing={1}>
    <Typography variant="subtitle2">{label}</Typography>
    <AddressFields fields={fields} control={control} errors={errors} onFieldChange={() => {
      onChange(Object.fromEntries(addressFieldNames.map(id => [addressKeys[id], String(getValues(id) ?? '')])));
    }} />
  </Stack>;
}

export default function SiteBuilderIdentityFields({ kind, draft, identity, patch }: {
  kind: 'organization' | 'association';
  draft: LibraryDraft;
  identity: SiteBuildIdentity;
  patch: (value: Partial<SiteBuildIdentity>) => void;
}) {
  const tpa = kind === 'organization';
  const label = tpa ? 'TPA' : 'Association';
  const name = identity[`${kind}Name`];
  const prefill = tpa ? {} : prefillAssociationFromTpa(draft, identity);
  const canPrefill = Object.keys(prefill).length > 0;
  const email = { ...storedField(draft, 'email'), id: `${kind}-email`, helperText: undefined };
  const phone = { ...storedField(draft, 'phone'), id: `${kind}-phone`, label: 'Phone', showPhoneTypeSelector: false };
  return <Stack spacing={2}>
    <BuilderText field={{ id: `${kind}-name`, label: `${label} name`, inputType: 'text', required: true, autoComplete: 'organization' }}
      value={name} onChange={value => patch({ [`${kind}Name`]: value })} />
    <BuilderText field={{ id: `${kind}-acronym`, label: 'Acronym', inputType: 'text', required: true, helperText: `Suggested from the ${label} name. You can edit it.` }}
      value={identity[`${kind}Acronym`] ?? suggestIdentityAcronym(name)}
      onChange={value => patch({ [`${kind}Acronym`]: value })} />
    {!tpa && <Stack spacing={0.5} alignItems="flex-start">
      <Button type="button" variant="outlined" disabled={!canPrefill} onClick={() => patch(prefill)}>Same as TPA</Button>
      <Typography variant="caption" color="text.secondary">
        {canPrefill ? 'Copies the available website, email, phone, and address.' : 'This TPA has no saved contact details to copy.'}
      </Typography>
    </Stack>}
    <BuilderText field={{ id: `${kind}-website`, label: 'Website', inputType: 'text', autoComplete: 'url' }}
      value={identity[`${kind}Website`]} onChange={value => patch({ [`${kind}Website`]: value })} />
    <BuilderText field={email} value={identity[`${kind}Email`]} onChange={value => patch({ [`${kind}Email`]: value })} />
    <BuilderText field={phone} value={identity[`${kind}Phone`]} onChange={value => patch({ [`${kind}Phone`]: value })} />
    <IdentityAddress label={`${label} address`} draft={draft} address={identity[`${kind}Address`]} onChange={value => patch({ [`${kind}Address`]: value })} />
    <LogoUploadField label={`${label} logo`} required={!tpa} value={identity[`${kind}Logo`]}
      onChange={value => patch({ [`${kind}Logo`]: value })} />
  </Stack>;
}

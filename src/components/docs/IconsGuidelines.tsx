import { useMemo, useState, type ComponentType } from 'react';
import { InputAdornment, Stack, TextField, Typography, type SvgIconProps } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { coverageCategories } from '../../config/coverageCategories';
import QuickDecisionIcon from '../coverage/QuickDecisionIcon';
import { applicantIcons } from '../../content/docs/iconInventory.generated';
import { DocsPage } from '../../docs/shared/DocsBlocks';

const categoryIcons: Record<string, ComponentType<SvgIconProps>> = Object.fromEntries(
  coverageCategories.map(category => [{ LI: 'Diversity1Rounded', AD: 'PersonalInjuryRounded', DI: 'AccessibleRounded', OO: 'BusinessRounded', SH: 'LocalHospitalRounded' }[category.id], category.icon]),
);
const iconOverrides: Record<string, ComponentType<SvgIconProps>> = { ...categoryIcons, OfflineBoltRounded: QuickDecisionIcon };
const ownerName = (source: string) => source.split('/').at(-1)!.replace(/\.[jt]sx?$/, '');

export const IconsGuidelines = () => {
  const [filter, setFilter] = useState('');
  const icons = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return applicantIcons
      .filter(icon => `${icon.name} ${icon.sources.join(' ')}`.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filter]);

  return <DocsPage eyebrow="Foundations" title="Icons"
    intro="Icons used in the application, listed alphabetically by their MUI names. Coverage and QuickDecision icons retain configured artwork and shared fallbacks."
    maxWidth={1200}>
    <TextField size="small" label="Filter icons" value={filter} onChange={event => setFilter(event.target.value)}
      slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
      sx={{ width: '100%', maxWidth: 360, mb: 1 }} />
    <Stack direction="row" flexWrap="wrap" gap={1.5}>
        {icons.map(({ Icon: StockIcon, name, label, sources }) => {
          const Icon = iconOverrides[name] ?? StockIcon;
          const owners = sources.map(ownerName).join(', ');
          return <Stack key={name} spacing={0.5} alignItems="center"
            sx={{ width: 128, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflowWrap: 'anywhere' }} title={owners}>
            <Icon color="primary" titleAccess={label} />
            <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>{label}</Typography>
          </Stack>;
        })}
    </Stack>
    {icons.length === 0 && <Typography>No icons match this filter.</Typography>}
  </DocsPage>;
};

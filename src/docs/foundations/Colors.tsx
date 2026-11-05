import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { createAppTheme } from '../../app/theme';
import { readSharedCatalog } from '../../persistence/sharedCatalog';
import { resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { DocsPage, DocsSection, SwatchRow } from '../shared/DocsBlocks';

function Palette() {
  const theme = useTheme();
  return <DocsPage title="Global palette">
    <DocsSection title="Primary">
      <SwatchRow swatches={[
        { label: 'primary.main', value: theme.palette.primary.main },
        { label: 'primary.light', value: theme.palette.primary.light },
        { label: 'primary.dark', value: theme.palette.primary.dark },
        { label: 'primary.contrastText', value: theme.palette.primary.contrastText },
      ]} />
    </DocsSection>
    <DocsSection title="Text">
      <SwatchRow swatches={[
        { label: 'text.primary', value: theme.palette.text.primary },
        { label: 'text.secondary', value: theme.palette.text.secondary },
        { label: 'text.disabled', value: theme.palette.text.disabled },
      ]} />
    </DocsSection>
    <DocsSection title="Background and divider">
      <SwatchRow swatches={[
        { label: 'background.default', value: theme.palette.background.default },
        { label: 'background.paper', value: theme.palette.background.paper },
        { label: 'divider', value: theme.palette.divider },
      ]} />
    </DocsSection>
    <DocsSection title="Client and Site colors"><ClientColors /></DocsSection>
  </DocsPage>;
}

type ClientColorRow = { key: string; name: string; mode: string; brand: string; action: string };

function ClientColors() {
  const [rows, setRows] = useState<ClientColorRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    readSharedCatalog().then(catalog => {
      const items = catalog.data.sites.map(site => {
        const library = resolvePrototypeLibrary(catalog.data, site.key, catalog.revision);
        const config = library.client.theme;
        const theme = createAppTheme(config);
        return { key: site.key, name: library.site.name.value, mode: config?.type === 'custom' ? 'Custom' : config?.preset ?? 'Default', brand: theme.palette.primary.main, action: config?.primaryAction?.main ?? theme.palette.primary.main };
      });
      if (active) setRows(items);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  if (failed) return <Typography role="alert" color="error">Client colors could not be loaded.</Typography>;
  if (!rows) return <Typography>Loading client colors…</Typography>;
  const color = (value: string) => <Stack direction="row" spacing={1} alignItems="center"><Box aria-hidden="true" sx={{ width: 20, height: 20, flexShrink: 0, bgcolor: value, borderRadius: 0.5, border: '1px solid', borderColor: 'divider' }} /><Typography variant="body2">{value}</Typography></Stack>;
  return <TableContainer><Table size="small" aria-label="Saved client and Site colors">
    <TableHead><TableRow><TableCell>Site</TableCell><TableCell>Theme</TableCell><TableCell>Brand</TableCell><TableCell>Primary action</TableCell></TableRow></TableHead>
    <TableBody>{rows.map(row => <TableRow key={row.key} data-site={row.key}>
      <TableCell component="th" scope="row">{row.name}</TableCell><TableCell>{row.mode}</TableCell><TableCell>{color(row.brand)}</TableCell><TableCell>{color(row.action)}</TableCell>
    </TableRow>)}</TableBody>
  </Table></TableContainer>;
}

export const Colors = () => <Palette />;

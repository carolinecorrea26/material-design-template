// @vitest-environment node
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { afterEach, expect, it } from 'vitest';
import { createAppTheme } from '../../app/theme';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import StepEditButton from './StepEditButton';
import PageHelpChips from '../content/PageHelpChips';
import HealthDetailSummary from '../forms/HealthDetailSummary';
import RateFrequencyToggle from '../coverage/RateFrequencyToggle';
import ClientHelpBanner from '../layout/ClientHelpBanner';

afterEach(() => installPrototypeLibrary(null));
it('uses the active theme for edit controls, help, health summaries and rate icons across brands', () => {
  const library = resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'theme-controls'); installPrototypeLibrary(library);
  for (const primary of ['#943c8c', '#297a53']) {
    const theme = createTheme(createAppTheme({ type: 'custom', primary }), { palette: { common: { white: '#fefefe' }, text: { secondary: '#234567' }, action: { hover: 'rgba(80, 20, 90, 0.05)', selected: 'rgba(80, 20, 90, 0.15)' } } });
    const html = renderToStaticMarkup(<ThemeProvider theme={theme}><StepEditButton label="Profile" onClick={() => {}} /><PageHelpChips items={[{ id: 'help', label: 'Configured help' }]} onSelect={() => {}} /><HealthDetailSummary values={{ assistanceType: 'Assistance example', onset: '2020', conditionsDetails: 'Saved detail' }} kind="assistance" /><RateFrequencyToggle /><ClientHelpBanner client={library.client} /></ThemeProvider>);
    expect(html).toContain(theme.palette.primary.dark);
    expect(html).toContain('rgba(80, 20, 90, 0.05)');
    expect(html).toContain('rgba(80, 20, 90, 0.15)');
    expect(html).toContain('color:#234567');
    expect(html).toContain('MuiTypography-caption');
    expect(html).toContain('%23fefefe');
    expect(html).not.toContain('#001f5f');
    expect(html).not.toContain('#e2ebff');
    expect(html).not.toContain('#f1f5f9');
  }
});

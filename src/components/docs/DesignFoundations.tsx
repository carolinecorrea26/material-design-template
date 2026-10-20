import { useState } from 'react';
import { MenuItem, Stack, TextField } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '../../app/theme';
import type { ClientConfig } from '../../config/clients/types';
import { Colors } from '../../docs/foundations/Colors';
import { Typography } from '../../docs/foundations/Typography';
import { Spacing } from '../../docs/foundations/Spacing';
import { Shape } from '../../docs/foundations/Shape';
import { Elevation } from '../../docs/foundations/Elevation';
import { BreakpointsAndResponsiveDesign } from '../../docs/foundations/Breakpoints';
import { MuiThemeOverrides } from '../../docs/foundations/ThemeOverrides';
import { DynamicFeedbackAndStatus } from '../../docs/guidelines/DynamicFeedbackAndStatus';

const views = [
  { id: 'colors', label: 'Colors', Component: Colors },
  { id: 'typography', label: 'Typography', Component: Typography },
  { id: 'spacing', label: 'Spacing', Component: Spacing },
  { id: 'shape', label: 'Shape', Component: Shape },
  { id: 'elevation', label: 'Elevation', Component: Elevation },
  { id: 'breakpoints', label: 'Breakpoints & responsive design', Component: BreakpointsAndResponsiveDesign },
  { id: 'overrides', label: 'Component theme overrides', Component: MuiThemeOverrides },
  { id: 'feedback', label: 'Feedback & status guidance', Component: DynamicFeedbackAndStatus },
];

export default function DesignFoundations({ client }: { client?: ClientConfig }) {
  const [view, setView] = useState('colors');
  const Component = views.find(row => row.id === view)!.Component;
  return <Stack spacing={2}>
    <TextField select size="small" label="Design foundation" value={view} onChange={event => setView(event.target.value)} sx={{ maxWidth: 360 }}>{views.map(row => <MenuItem key={row.id} value={row.id}>{row.label}</MenuItem>)}</TextField>
    <ThemeProvider theme={createAppTheme(client?.theme)}><Component /></ThemeProvider>
  </Stack>;
}

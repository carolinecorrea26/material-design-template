import StepEditButton from '../../components/navigation/StepEditButton';
import PageHelpChips from '../../components/content/PageHelpChips';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import {
  Badge, Box, Breadcrumbs, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel, Link, MenuItem,
  Radio, RadioGroup, Stack, ToggleButton, Tooltip, Typography,
} from '@mui/material';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { DocsPage, SourceNote, DocsTable, TableRow, TableCell } from '../shared/DocsBlocks';
import FieldRenderer from '../../components/forms/FieldRenderer';
import { FieldDefinitionsContext } from '../../components/forms/FieldDefinitionsContext';
import { resolveMappedFields } from '../../domain/requirementFields';
import { requirementText } from '../../domain/requirementContent';

const fields = [
  ...resolveMappedFields({ component: 'membership' }),
  ...resolveMappedFields({ component: 'quote-calculator' }),
  ...resolveMappedFields({ component: 'eligibility' }),
  ...resolveMappedFields({ page: 'profile' }),
  ...resolveMappedFields({ page: 'payment' }),
  ...resolveMappedFields({ page: 'health-di-supp' }),
];
function authored(id: string) {
  const field = fields.find(field => field.id === id);
  if (!field) throw new Error(`Missing theme-reference field: ${id}`);
  return field;
}
const muiDefault = createTheme();
type OverrideExample = { label: string; components?: string[]; difference: string; example: (defaultMui: boolean) => ReactNode };

function ThemeValueExample({ value }: { value: 'palette' | 'typography' | 'radius' }) {
  const theme = useTheme();
  if (value === 'typography') return <Stack spacing={1}><Typography variant="h3">Application heading</Typography><Typography variant="body2">{theme.typography.fontFamily}</Typography></Stack>;
  if (value === 'radius') return <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>{theme.shape.borderRadius}px corners</Box>;
  return <Stack gap={1}>{(['primary', 'success', 'error'] as const).map(color => <Box key={color} sx={{ bgcolor: `${color}.main`, color: `${color}.contrastText`, px: 1, py: 0.5 }}>{color}: {theme.palette[color].main}</Box>)}</Stack>;
}

function NativeSelectionFields() {
  return <Stack spacing={2}>
    <FormControl required={authored('gender').required}><FormLabel>{authored('gender').label}</FormLabel><RadioGroup name="mui-native-gender" defaultValue="female">{authored('gender').options!.map(option => <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />)}</RadioGroup></FormControl>
    <FormControl><FormLabel>{authored('dependents').label}</FormLabel><FormGroup>{authored('dependents').options!.map(option => <FormControlLabel key={option.value} control={<Checkbox name={`mui-native-${option.value}`} defaultChecked={option.value === 'spouse'} />} label={option.label} />)}</FormGroup></FormControl>
  </Stack>;
}

/** Only actual theme customizations and the shared custom selection rows belong here. */
export function MuiThemeOverrides() {
  const theme = useTheme();
  const optionField = authored('health-di-assistance-type');
  const optionValue = 'moving';
  const optionLabel = optionField.options!.find(option => option.value === optionValue)!.label;
  const { control, formState: { errors } } = useForm<Record<string, string | boolean | string[]>>({
    defaultValues: Object.fromEntries(['mui', 'app'].flatMap(prefix => Object.entries({ 'first-name': 'Jordan', 'last-name': '', gender: 'female', dependents: ['spouse'], 'health-di-assistance-type': optionValue }).map(([id, value]) => [`${prefix}-${id}`, value]))),
  });
  const field = (id: string, defaultMui: boolean) => <FieldRenderer field={{ ...authored(id), id: `${defaultMui ? 'mui' : 'app'}-${id}` }} control={control} errors={errors} />;
  const examples: OverrideExample[] = [
    {
      label: 'Palette',
      difference: 'Application primary/secondary, success, error, text, page-background and divider colors replace the MUI palette defaults. Site theme configuration supplies the primary color.',
      example: () => <ThemeValueExample value="palette" />,
    },
    {
      label: 'Typography',
      difference: 'Inter replaces Roboto; headings use weight 800. Shared page titles use h3 at 1.5rem on every screen; other headings retain responsive sizing. Caption and overline text use the minimum text size of 0.875rem. Button labels keep their entered case.',
      example: () => <ThemeValueExample value="typography" />,
    },
    {
      label: 'Corner radius',
      difference: 'The base radius is 8px instead of MUI’s 4px. Buttons separately use the configured pill or standard shape.',
      example: () => <ThemeValueExample value="radius" />,
    },
    {
      label: 'Buttons', components: ['MuiButton', 'MuiToggleButton'],
      difference: 'Pill shape by default; standard shape uses the shared 8px radius. Button labels keep their entered case and use weight 600; small buttons retain the theme button font size. A configured primary-action color affects only enabled, contained primary buttons.',
      example: () => <Stack direction="row" gap={1} flexWrap="wrap"><Button variant="contained">Continue</Button><Button variant="outlined">Back</Button><Button variant="text" size="small">Cancel</Button><ToggleButton size="small" value="selected">View</ToggleButton></Stack>,
    },
    {
      label: 'Completed-section edit action', components: ['MuiIconButton'],
      difference: 'StepEditButton uses primary-dark text and a primary tint from the active theme. Hover strengthens the tint; disabled controls use the shared disabled roles. Other IconButtons keep their existing variants.',
      example: () => <Stack direction="row" spacing={1}><StepEditButton label={requirementText('navigation.progress-step-labels.getting-started')} onClick={() => {}} /><StepEditButton label={requirementText('navigation.progress-step-labels.getting-started')} disabled onClick={() => {}} /></Stack>,
    },
    {
      label: 'Chips, badges and page help', components: ['MuiChip', 'MuiBadge'],
      difference: 'Chips and badge counts inherit the theme caption size. PageHelpChips uses the theme action hover/selected surfaces instead of fixed gray colors. Other chips keep their existing variants.',
      example: () => <Stack spacing={2}><PageHelpChips items={[{ id: 'example-help', label: requirementText('home.how-applying-works.title') }]} onSelect={() => {}} /><Badge badgeContent={2} color="primary"><Typography>Coverage</Typography></Badge></Stack>,
    },
    {
      label: 'Breadcrumbs', components: ['MuiBreadcrumbs'],
      difference: 'The trail inherits caption typography. Current and completed entries use weight 500; future entries retain the default weight.',
      example: () => <Breadcrumbs><Link href="#" variant="inherit" data-completed="true">Membership</Link><Typography variant="inherit" aria-current="page">Eligibility</Typography></Breadcrumbs>,
    },
    {
      label: 'Tooltips', components: ['MuiTooltip'],
      difference: 'Tooltip text inherits the theme caption size instead of MUI’s 11px default.',
      example: () => <Tooltip title="Application help"><Button>Hover for help</Button></Tooltip>,
    },
    {
      label: 'Links', components: ['MuiLink', 'MuiCssBaseline'],
      difference: 'Weight 600 and no underline, including on hover. CssBaseline applies the same weight and decoration to native anchor elements and keeps superscripts, subscripts and small text at the theme minimum. Breadcrumb emphasis is a separate theme override.',
      example: () => <Link href="#" onClick={event => event.preventDefault()}>View application information</Link>,
    },
    {
      label: 'Field labels', components: ['MuiFormLabel'],
      difference: 'Weight 500 instead of 400; required asterisks always use the error color.',
      example: defaultMui => field('last-name', defaultMui),
    },
    {
      label: 'Floating labels', components: ['MuiInputLabel'],
      difference: 'Shrunk labels compensate for MUI’s 75% scale so their visible text meets the theme minimum. The outlined notch uses the same caption size.',
      example: defaultMui => field('first-name', defaultMui),
    },
    {
      label: 'Choice labels', components: ['MuiFormControlLabel'],
      difference: 'Weight 500 instead of 400 on labels paired with MUI controls.',
      example: () => <FormControlLabel control={<Checkbox defaultChecked />} label={authored('bank-authorization').label} />,
    },
    {
      label: 'Input surface and answers', components: ['MuiInputBase'],
      difference: 'White input surface and weight-700 entered answers. Placeholder text retains weight 400.',
      example: defaultMui => field('first-name', defaultMui),
    },
    {
      label: 'Resting input outline', components: ['MuiOutlinedInput'],
      difference: 'The resting outline uses the theme divider color (12% opacity) instead of MUI’s 23% black outline, matching selection-row borders. MUI keeps its hover, focus, error and disabled states.',
      example: defaultMui => <Box sx={{ maxWidth: 280 }}>{field('bank-institution', defaultMui)}</Box>,
    },
    {
      label: 'Helper and error text', components: ['MuiFormHelperText'],
      difference: 'Line height 1.2. Shared field layouts own the gap after helper text, without an additional bottom margin.',
      example: () => <FormHelperText error>{requirementText('validation.field.email')}</FormHelperText>,
    },
    {
      label: 'Selected option text', components: ['MuiSelect'],
      difference: 'Long selections wrap instead of clipping to one line with an ellipsis; the control height grows with its contents.',
      example: defaultMui => <Box sx={{ width: 180 }}>{field(optionField.id, defaultMui)}</Box>,
    },
    {
      label: 'Menu options', components: ['MuiMenuItem'],
      difference: 'Option labels wrap at words or, when needed, inside long words; line height is 1.3.',
      example: () => <Box role="menu" sx={{ maxWidth: 180, border: '1px solid', borderColor: 'divider' }}><MenuItem role="menuitem" selected>{optionLabel}</MenuItem></Box>,
    },
    {
      label: 'Radio and checkbox rows · shared component',
      difference: 'SelectionGroup adds full-width rounded rows, a divider-colored border, padding, selected tint, hover and keyboard-focus treatment. FieldRenderer and RadioSelectionGroup use it; the native radio/checkbox icons retain MUI styling.',
      example: defaultMui => defaultMui ? <NativeSelectionFields /> : <Stack spacing={2}>{field('gender', false)}{field('dependents', false)}</Stack>,
    },
  ];
  return <FieldDefinitionsContext value={fields}>
    <DocsPage eyebrow="Foundations" title="Overrides" maxWidth={1600}
      intro="Each customization compares unmodified MUI on the left with the current application theme on the right, using the same content and field definitions. Radio and checkbox rows also show the shared application component.">
      <DocsTable columns={['Customization', 'What changes', 'MUI default', 'Application override']}>
        {examples.map(example => <TableRow key={example.label} data-theme-components={example.components?.join(' ')}>
          <TableCell sx={{ verticalAlign: 'top', width: '14%' }}><Typography variant="subtitle2">{example.label}</Typography>{example.components && <SourceNote>{example.components.join(' / ')}</SourceNote>}</TableCell>
          <TableCell sx={{ verticalAlign: 'top', width: '26%' }}>{example.difference}</TableCell>
          {[true, false].map(defaultMui => <TableCell key={String(defaultMui)} data-theme-example={defaultMui ? 'mui-default' : 'application-override'} sx={{ verticalAlign: 'top', width: '30%', minWidth: 230 }}>
            <ThemeProvider theme={() => defaultMui ? muiDefault : theme}>
              <Box sx={sampleTheme => ({ ...sampleTheme.typography.body1, color: sampleTheme.palette.text.primary, minWidth: 0 })}>{example.example(defaultMui)}</Box>
            </ThemeProvider>
          </TableCell>)}
        </TableRow>)}
      </DocsTable>
      <SourceNote>src/app/theme.ts · src/components/forms/SelectionGroup.tsx · src/components/forms/RadioSelectionGroup.tsx</SourceNote>
    </DocsPage>
  </FieldDefinitionsContext>;
}

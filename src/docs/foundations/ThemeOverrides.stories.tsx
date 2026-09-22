import type { Meta } from "@storybook/react-vite";
import {
  Alert,
  AppBar,
  Badge,
  Breadcrumbs,
  Button,
  Chip,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Link,
  MenuItem,
  Select,
  Skeleton,
  Step,
  StepLabel,
  Stepper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from "@mui/material";
import { CARD_RADIUS } from "../../app/theme";
import { DocsPage, DocsSection, SourceNote, DocsTable, TableRow, TableCell } from "../shared/DocsBlocks";

const meta = {
  title: "Foundations/MUI Theme Overrides",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

type OverrideRow = { components: string; whatChanges: string };

const overrides: OverrideRow[] = [
  { components: "MuiButton", whatChanges: "Pill shape (radius 9999), bold no-uppercase label, translateY(-2px) lift on hover; contained variant adds a colored box-shadow glow; sizeLarge gets extra padding." },
  { components: "MuiOutlinedInput", whatChanges: `Radius ${CARD_RADIUS}; border defaults to FIELD_BORDER_COLOR, darkens to text.primary on hover, switches to primary on focus, error on validation failure; entered text renders bold (fontWeight 700), placeholder stays regular weight.` },
  { components: "MuiSelect / MuiMenuItem", whatChanges: "Both forced to wrap long option text (whiteSpace: normal) instead of MUI's default single-line truncation, so long labels (e.g. the WAEPA federal-agency list) stay fully readable." },
  { components: "MuiInputLabel / MuiFormLabel / MuiFormHelperText", whatChanges: "Label color LABEL_COLOR at weight 500, switches to primary when focused; required asterisk renders in error color; helper text fixed at 0.825rem." },
  { components: "MuiFormControlLabel / MuiFormGroup", whatChanges: "FormControlLabel is forced full-width and auto-bolds its label to weight 900 when the child checkbox/radio is checked (via :has(.Mui-checked)); FormGroup is forced into a column layout even when MUI's own .MuiFormGroup-row class is applied." },
  { components: "MuiToggleButton / MuiToggleButtonGroup", whatChanges: `Used as the radio/segmented-control shell app-wide — bordered, radius ${CARD_RADIUS}, selected state tints the background with primary at ~10% opacity and bumps label weight to 900.` },
  { components: "MuiCard / MuiCardContent / MuiAlert", whatChanges: `Shared radius ${CARD_RADIUS} across cards and alerts for one consistent surface language; CardContent padding fixed at 24px.` },
  { components: "MuiChip", whatChanges: "Icon spacing tightened; the default filled color variant uses a surface-gray background instead of MUI's default gray." },
  { components: "MuiLink", whatChanges: "Primary color, bold weight, underline only on hover (not shown by default)." },
  { components: "MuiStepIcon / MuiStepLabel / MuiStepConnector / MuiStepContent", whatChanges: "Neutral gray (#8fa1b9) by default; active/completed steps switch to primary. Powers ProgressStep's mobile vertical Stepper." },
  { components: "MuiAppBar / MuiToolbar", whatChanges: "AppBar: white background, bottom divider border, no drop shadow (flat header). Toolbar: fixed 16px gap between its children." },
  { components: "MuiContainer", whatChanges: `defaultProps.maxWidth is set to "md" app-wide; responsive horizontal padding grows at sm/md breakpoints via theme.spacing().` },
  { components: "MuiBreadcrumbs", whatChanges: "Separator color fixed to a neutral gray with cursor: default (it's a decorative separator, not a clickable element)." },
  { components: "MuiSkeleton", whatChanges: "Background color fixed to a neutral gray with a custom shimmer gradient, replacing MUI's default skeleton shimmer." },
  { components: "MuiLinearProgress", whatChanges: "Height fixed to 6px with a light neutral track color — used by AppHeader's application-progress bar." },
  { components: "MuiBadge", whatChanges: "Badge dot sized down (16px min, 4px horizontal padding, 0.65rem bold text) — used by the coverage cart's item-count badge." },
  { components: "MuiTypography", whatChanges: "defaultProps.variantMapping maps every custom form-specific variant to a non-heading element (mostly span/p) — see Foundations / Typography for the full mapping table." },
  { components: "MuiCssBaseline", whatChanges: "A single global selector, .SelectionGroup-root .SelectionGroup-label, sets that label's font-weight/size. See the flagged issue below — this is the one override that reaches into a component's internal class name instead of the component owning its own styling." },
];

export const MuiThemeOverrides = () => (
  <DocsPage
    eyebrow="Foundations"
    title="MUI Theme Overrides"
    intro="Every meaningful override defined under theme.ts's components key, grouped by related concern. These overrides are part of this app's design system — Material UI's own defaults are rarely used unmodified."
    maxWidth={1200}
  >
    <DocsSection title="Full reference">
      <DocsTable columns={["Component(s)", "What changes"]}>
        {overrides.map((row) => (
          <TableRow key={row.components}>
            <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", fontFamily: "monospace", fontSize: "0.75rem" }}>
              {row.components}
            </TableCell>
            <TableCell>{row.whatChanges}</TableCell>
          </TableRow>
        ))}
      </DocsTable>
      <SourceNote>src/app/theme.ts — components (lines 286–596)</SourceNote>
    </DocsSection>

    <DocsSection title="Selected live examples">
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Button variant="contained">Contained</Button>
          <Button variant="outlined">Outlined</Button>
          <Chip label="Default chip" />
          <Chip label="Filled" variant="filled" color="default" />
          <Badge badgeContent={3} color="primary"><Chip label="Cart" /></Badge>
        </Stack>

        <ToggleButtonGroup value="a" exclusive onChange={() => {}}>
          <ToggleButton value="a">Selected</ToggleButton>
          <ToggleButton value="b">Unselected</ToggleButton>
        </ToggleButtonGroup>

        <FormControlLabel control={<Checkbox defaultChecked />} label="Checked label auto-bolds" />

        <Select value="a" size="small" sx={{ maxWidth: 260 }} onChange={() => {}}>
          <MenuItem value="a">A short option</MenuItem>
          <MenuItem value="b">
            A much longer option label that wraps onto multiple lines instead of truncating with an ellipsis
          </MenuItem>
        </Select>

        <Breadcrumbs>
          <Link href="#">Coverage</Link>
          <Link href="#">Beneficiary</Link>
          <Typography color="text.primary">Contact</Typography>
        </Breadcrumbs>

        <Stack spacing={1} sx={{ maxWidth: 320 }}>
          <Skeleton variant="rounded" height={24} />
          <Skeleton variant="rounded" height={24} width="70%" />
        </Stack>

        <LinearProgress variant="determinate" value={60} sx={{ maxWidth: 320 }} />

        <AppBar position="static" sx={{ maxWidth: 320 }}>
          <Toolbar variant="dense">
            <Chip label="A" size="small" />
            <Typography variant="subtitle2">16px gap, no shadow</Typography>
          </Toolbar>
        </AppBar>

        <Stepper activeStep={1} orientation="vertical" sx={{ maxWidth: 260 }}>
          <Step completed><StepLabel>Getting started</StepLabel></Step>
          <Step><StepLabel>Coverage options</StepLabel></Step>
          <Step><StepLabel>Profile</StepLabel></Step>
        </Stepper>
      </Stack>
    </DocsSection>

    <DocsSection title="Flagged: MuiCssBaseline → SelectionGroup coupling">
      <Alert severity="warning" sx={{ maxWidth: 800 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
          Investigated during this pass — not fixed.
        </Typography>
        <Typography variant="body2">
          The global <code>.SelectionGroup-root .SelectionGroup-label</code>{" "}
          rule looks like it should move into{" "}
          <code>SelectionGroup.tsx</code>, but it can't: that component only
          renders its <code>children</code> — it never renders the label
          itself. The className is applied independently by 8 separate call
          sites across <code>FieldRenderer.tsx</code> (×3),{" "}
          <code>CoverageCategorySelector.tsx</code>,{" "}
          <code>QuoteCalculator.tsx</code> (×2), <code>QuoteModal.tsx</code>{" "}
          (×2, one with its own conflicting inline <code>sx</code>{" "}
          font-size),
          <code>ResumeMethod.tsx</code>, and <code>Beneficiary.tsx</code>.
          Fixing this properly means giving <code>SelectionGroup</code> a{" "}
          <code>label</code> prop and updating all 8 call sites — a real,
          moderate-size refactor, not a one-line move. Per this phase's scope
          (foundations documentation only, no broad refactors), this is
          logged as technical debt for a later phase rather than fixed here.
        </Typography>
      </Alert>
    </DocsSection>
  </DocsPage>
);

import {
  AppBar, Button, Chip, FormControlLabel, Checkbox, Link, MenuItem,
  Select, Stack, ToggleButton, ToggleButtonGroup, Toolbar, Typography,
} from "@mui/material";
import { DocsPage, DocsSection, SourceNote, DocsTable, TableRow, TableCell } from "../shared/DocsBlocks";

const overrides = [
  ["MuiButton", "Optional pill shape and separate colors for filled primary buttons; defaults inherit MUI and the primary palette."],
  ["MuiAppBar", "Paper background, inherited text color, bottom divider, and no elevation."],
  ["MuiToolbar", "16px gap between header items."],
  ["MuiContainer", "Default maxWidth is md."],
  ["MuiLink", "Underline on hover."],
  ["MuiFormLabel", "Required asterisks use the palette error color, including input labels."],
  ["MuiOutlinedInput", "Use the palette divider color for the resting outline."],
  ["MuiSelect / MuiMenuItem", "Wrap long insurance option labels so they remain readable."],
];

export const MuiThemeOverrides = () => (
  <DocsPage eyebrow="Foundations" title="MUI Theme Overrides"
    intro="The theme keeps a few application-wide defaults. Required asterisks use the error color; buttons, toggles, chips, steppers, skeletons, and progress indicators use MUI's standard behavior and styling.">
    <DocsSection title="Application defaults">
      <DocsTable columns={["Component(s)", "What changes"]}>
        {overrides.map(([component, description]) => (
          <TableRow key={component}>
            <TableCell sx={{ fontFamily: "monospace" }}>{component}</TableCell>
            <TableCell>{description}</TableCell>
          </TableRow>
        ))}
      </DocsTable>
      <SourceNote>src/app/theme.ts — components</SourceNote>
    </DocsSection>
    <DocsSection title="Live examples">
      <Stack spacing={3}>
        <Stack direction="row" spacing={2}>
          <Button variant="contained">Contained</Button>
          <Button variant="outlined">Outlined</Button>
          <Chip label="Default chip" />
        </Stack>
        <ToggleButtonGroup value="a" exclusive onChange={() => {}}>
          <ToggleButton value="a">Selected</ToggleButton>
          <ToggleButton value="b">Unselected</ToggleButton>
        </ToggleButtonGroup>
        <FormControlLabel control={<Checkbox defaultChecked />} label="Checkbox label" />
        <Select value="a" size="small" sx={{ maxWidth: 260 }} onChange={() => {}}>
          <MenuItem value="a">A longer insurance option label that wraps across lines</MenuItem>
        </Select>
        <Link href="#">Documentation link</Link>
        <AppBar position="static" sx={{ maxWidth: 320 }}>
          <Toolbar><Typography variant="subtitle2">Application header</Typography></Toolbar>
        </AppBar>
      </Stack>
    </DocsSection>
  </DocsPage>
);

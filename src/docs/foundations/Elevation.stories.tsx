import type { Meta } from "@storybook/react-vite";
import { Alert, AppBar, Box, Button, Card, CardContent, Stack, Toolbar, Typography } from "@mui/material";
import { DocsPage, DocsSection, SourceNote } from "../shared/DocsBlocks";

const meta = {
  title: "Foundations/Elevation",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

export const Elevation = () => (
  <DocsPage
    eyebrow="Foundations"
    title="Elevation"
    intro="There is no global MUI shadows[] scale override in theme.ts — this app does not use elevation as a general-purpose depth system the way MUI's default Paper elevation levels do. Depth/emphasis is instead handled ad hoc, component by component, as shown below."
  >
    <DocsSection
      title="What actually varies"
      description="These are the only two intentional shadow/elevation treatments defined in the theme. Everything else (Card, Alert, Paper) uses elevation 0 or a plain border."
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>Contained button — colored glow on hover</Typography>
          <Button variant="contained">Hover me</Button>
          <SourceNote>src/app/theme.ts — components.MuiButton.styleOverrides.contained: boxShadow: `0 8px 18px ${"${primary.main}"}3d`</SourceNote>
        </Box>
        <Box>
          <Typography variant="subtitle2" gutterBottom>App bar — explicitly flat</Typography>
          <AppBar position="static" sx={{ maxWidth: 420 }}>
            <Toolbar variant="dense">
              <Typography variant="subtitle2">AppHeader</Typography>
            </Toolbar>
          </AppBar>
          <SourceNote>src/app/theme.ts — components.MuiAppBar.styleOverrides.root: boxShadow: "none", relies on a bottom border instead of a shadow</SourceNote>
        </Box>
        <Box>
          <Typography variant="subtitle2" gutterBottom>Card / Alert — flat, bordered, shared radius (no shadow)</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Card variant="outlined" sx={{ width: 160, height: 70 }}>
              <CardContent><Typography variant="caption">No shadow</Typography></CardContent>
            </Card>
            <Alert severity="info" sx={{ width: 200 }}>No shadow</Alert>
          </Stack>
        </Box>
      </Stack>
    </DocsSection>

    <DocsSection title="Open question for production">
      <Alert severity="warning" sx={{ maxWidth: 760 }}>
        If production design calls for a real elevation system (e.g. distinct
        shadow levels for resting vs. raised vs. floating surfaces — drawers,
        dialogs, popovers, dropdown menus), it does not exist yet and would
        need to be added as a genuine <code>theme.shadows</code> override,
        not inferred from the two ad hoc treatments above.
      </Alert>
    </DocsSection>
  </DocsPage>
);

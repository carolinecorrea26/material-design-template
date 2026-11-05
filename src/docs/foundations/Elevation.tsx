import { AppBar, Button, Paper, Stack, Toolbar, Typography } from "@mui/material";
import { DocsPage, DocsSection, SourceNote } from "../shared/DocsBlocks";

export const Elevation = () => (
  <DocsPage eyebrow="Foundations" title="Elevation"
    intro="The application uses MUI's built-in shadows and Paper elevation levels. The theme keeps the header flat with elevation 0.">
    <DocsSection title="MUI elevation">
      <Stack direction="row" spacing={2} flexWrap="wrap">
        {[0, 1, 3, 8].map(elevation => (
          <Paper key={elevation} elevation={elevation} sx={{ p: 3 }}>
            <Typography>Elevation {elevation}</Typography>
          </Paper>
        ))}
      </Stack>
      <SourceNote>theme.shadows — unchanged MUI defaults</SourceNote>
    </DocsSection>
    <DocsSection title="Buttons and header">
      <Stack spacing={3}>
        <Button variant="contained" sx={{ alignSelf: "flex-start" }}>Standard button</Button>
        <AppBar position="static" sx={{ maxWidth: 420 }}>
          <Toolbar><Typography>Flat application header</Typography></Toolbar>
        </AppBar>
      </Stack>
      <SourceNote>src/app/theme.ts — MuiAppBar.defaultProps.elevation</SourceNote>
    </DocsSection>
  </DocsPage>
);

import type { Meta } from "@storybook/react-vite";
import { useTheme, ThemeProvider } from "@mui/material/styles";
import { Alert, Box, Card, CardContent, Stack, Typography, useMediaQuery } from "@mui/material";
import { createAppTheme } from "../../app/theme";
import { DocsPage, DocsSection, SourceNote, DocsTable, TableRow, TableCell } from "../shared/DocsBlocks";

const meta = {
  title: "Foundations/Breakpoints & Responsive Design",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

function BreakpointReadout({ label }: { label: string }) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));
  return (
    <Card variant="outlined" sx={{ flex: 1, minWidth: 220 }}>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>{label}</Typography>
        <Typography variant="body2">
          <code>up("sm")</code>: <strong>{String(isSmUp)}</strong>
        </Typography>
        <Typography variant="body2">
          <code>up("md")</code>: <strong>{String(isMdUp)}</strong>
        </Typography>
        <Box sx={{ mt: 1, display: { xs: "block", md: "none" } }}>
          <Typography variant="caption" color="warning.main">
            Narrow-screen branch rendered ({"{ xs: block, md: none }"})
          </Typography>
        </Box>
        <Box sx={{ mt: 1, display: { xs: "none", md: "block" } }}>
          <Typography variant="caption" color="success.main">
            Wide-screen branch rendered ({"{ xs: none, md: block }"})
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

const realTheme = createAppTheme();
const forcedMobileTheme = createAppTheme("default", { forceMobileLayout: true });

export const BreakpointsAndResponsiveDesign = () => {
  const theme = useTheme();

  return (
    <DocsPage
      eyebrow="Foundations"
      title="Breakpoints & Responsive Design"
      intro="Standard MUI breakpoints, plus one prototype-specific override — forceMobileLayout — that several structural components key off of. Resize this panel (or use the toolbar's viewport control) to see the live readout below respond to your actual browser width."
      maxWidth={1100}
    >
      <DocsSection title="Breakpoint values">
        <DocsTable columns={["Key", "Min width (px)", "Typical use"]}>
          <TableRow>
            <TableCell sx={{ fontFamily: "monospace" }}>xs</TableCell>
            <TableCell>{theme.breakpoints.values.xs}</TableCell>
            <TableCell>Phone — the default/base styling.</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontFamily: "monospace" }}>sm</TableCell>
            <TableCell>{theme.breakpoints.values.sm}</TableCell>
            <TableCell>Padding/spacing bumps (e.g. FormShell). Deliberately left real even under forceMobileLayout.</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontFamily: "monospace" }}>md</TableCell>
            <TableCell>{theme.breakpoints.values.md}</TableCell>
            <TableCell>Structural desktop/mobile branches: ProgressStep's sidebar-vs-stepper, AppDrawer's side-panel-vs-bottom-sheet, AppModal's fullScreen toggle, HelpChips' overflow-fade, MemberVerification's fullScreen dialog.</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontFamily: "monospace" }}>lg</TableCell>
            <TableCell>{theme.breakpoints.values.lg}</TableCell>
            <TableCell>Wider multi-column layouts (e.g. field example grids going to 3 columns).</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontFamily: "monospace" }}>xl</TableCell>
            <TableCell>{theme.breakpoints.values.xl}</TableCell>
            <TableCell>Rarely used directly.</TableCell>
          </TableRow>
        </DocsTable>
        <SourceNote>Values read live from useTheme().breakpoints.values — MUI defaults, unmodified by this app under normal (non-forceMobileLayout) rendering.</SourceNote>
      </DocsSection>

      <DocsSection
        title="forceMobileLayout"
        description={
          `A client-configurable "single" form template pins md/lg/xl to an unreachable width (1e6) while leaving xs/sm untouched, so every useMediaQuery(breakpoints.up("md")) structural check below resolves to its narrow-screen branch regardless of actual browser width. sm stays real specifically so sm-level padding (e.g. FormShell's px: { xs: 2, sm: "48px" }) still applies on an actual desktop browser.`
        }
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <ThemeProvider theme={realTheme}>
            <BreakpointReadout label="Real theme (template=multi)" />
          </ThemeProvider>
          <ThemeProvider theme={forcedMobileTheme}>
            <BreakpointReadout label="forceMobileLayout: true (template=single)" />
          </ThemeProvider>
        </Stack>
        <Alert severity="info" sx={{ mt: 2, maxWidth: 760 }}>
          Both cards above render at your actual current browser width — the
          right card always reports <code>up("md")</code> as{" "}
          <code>false</code> because its theme's <code>md</code> breakpoint is
          set to an unreachable value, not because the viewport is actually
          narrow.
        </Alert>
        <SourceNote>src/app/theme.ts — createAppTheme's forceMobileLayout option; src/config/template/resolveTemplate.ts selects "single" vs "multi"</SourceNote>
      </DocsSection>

      <DocsSection title="Reflow at narrow widths">
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
          Per the application's accessibility requirements (see{" "}
          <code>Guidelines / Accessibility</code>), narrow-viewport variants
          (mobile stepper, drawer-based panels, hidden tab text labels) are
          required to hide only redundant <em>visual</em> labels — never
          functionality — and any hidden text label must be replaced with an
          equivalent <code>aria-label</code> rather than dropped.
        </Typography>
      </DocsSection>
    </DocsPage>
  );
};

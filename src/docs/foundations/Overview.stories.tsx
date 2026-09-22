import type { Meta } from "@storybook/react-vite";
import { Chip, Stack, Typography } from "@mui/material";
import { DocsPage, DocsSection } from "../shared/DocsBlocks";

const meta = {
  title: "Foundations/Overview",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

export const Overview = () => (
  <DocsPage
    eyebrow="Foundations"
    title="Design foundations"
    intro="The tokens and conventions every component in this app is built from — colors, typography, spacing, shape, breakpoints, and the MUI theme overrides that make Material UI's defaults look like this app. Every page in this section reads its values live from src/app/theme.ts (via createAppTheme) rather than a second hand-typed specification, so it cannot silently drift from the running app."
  >
    <DocsSection title="What lives here vs. elsewhere">
      <Stack spacing={1.5}>
        <Typography variant="body2">
          <strong>Foundations (this section)</strong> — reusable design tokens
          and theme-level conventions: what a color/type-scale/spacing-unit{" "}
          <em>is</em>, not which page uses it.
        </Typography>
        <Typography variant="body2">
          <strong>Guidelines</strong> — how those tokens should be applied:
          accessibility implementation patterns, form validation/error
          presentation, responsive UI rules, feedback/status conventions.
        </Typography>
        <Typography variant="body2">
          <strong>Forms / Layout / Navigation / Content / Feedback / Overlays
          / Coverage & Commerce</strong> — the actual reusable components,
          documented in isolation with their variants, states, and API.
        </Typography>
        <Typography variant="body2">
          <strong>Portal Admin → Information Architecture</strong> (in the
          running app, not Storybook) — pages, fields by page, application
          flows, business rules, client configuration, and other
          application-specific/requirements documentation. It does not
          duplicate the reusable UI documentation that lives here.
        </Typography>
      </Stack>
    </DocsSection>

    <DocsSection title="Status">
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label="Storybook is the visual source of truth" color="primary" size="small" />
        <Chip label="Coverage tracked in Page Coverage Audit" variant="outlined" size="small" />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        See <code>src/docs/StorybookAudit.md</code> for the full migration
        matrix, information architecture, and prioritized build sequence.
        The in-app <code>Design System</code> page links back here and provides
        a temporary client-theme preview tool.
      </Typography>
    </DocsSection>
  </DocsPage>
);

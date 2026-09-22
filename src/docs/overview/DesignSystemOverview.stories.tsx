import type { Meta } from "@storybook/react-vite";
import { Alert, Stack, Typography } from "@mui/material";
import { DocsPage, DocsSection } from "../shared/DocsBlocks";

const meta = {
  title: "Overview/Design System Overview",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

export const DesignSystemOverview = () => (
  <DocsPage
    title="Design System Overview"
    intro="This Storybook is the authoritative design system, reusable component library, and reusable UI-pattern documentation for the template prototype. It is built against the current source rather than maintained as a separate specification."
  >
    <DocsSection title="What Storybook owns">
      <Typography variant="body2" color="text.secondary">
        Design foundations and tokens, reusable components and their APIs,
        variants and states, form controls and validation/error
        presentation, reusable interaction patterns, responsive UI behavior,
        accessibility implementation guidance, and feedback/loading/status
        patterns.
      </Typography>
    </DocsSection>

    <DocsSection title="What stays in the running app (Portal Admin / Information Architecture)">
      <Typography variant="body2" color="text.secondary">
        Pages, fields by page, application flows, business rules, feature
        implementation status, client configuration, URL parameters,
        product/applicant eligibility, content configuration, integrations,
        and workflow requirements/triggers. The same detailed UI rule should
        not need to be maintained independently in both systems — where a
        rule is really about how a component looks or behaves, it belongs
        here; where it's about why the application invokes it, it belongs in
        Information Architecture.
      </Typography>
    </DocsSection>

    <DocsSection title="Current migration status">
      <Stack spacing={1}>
        <Typography variant="body2">
          <strong>Foundations</strong> — colors, typography, spacing, shape,
          elevation, breakpoints/responsive design, MUI theme overrides,
          branding, and icons are migrated and read live from{" "}
          <code>src/app/theme.ts</code>.
        </Typography>
        <Typography variant="body2">
          <strong>Guidelines / Accessibility</strong> — migrated from the
          Information Architecture page's Accessibility section, translated
          into actionable guidance rather than a pasted requirements table.
        </Typography>
        <Typography variant="body2">
          <strong>Component stories</strong> — Forms, Layout, Navigation,
          Content, Feedback, Overlays, and Coverage & Commerce are represented
          by stories for the current shared components. Use the Page Coverage
          Audit and component inventory to identify any remaining gaps.
        </Typography>
      </Stack>
    </DocsSection>

    <Alert severity="info" sx={{ maxWidth: 760 }}>
      Storybook is the source of truth, but coverage can continue to grow. Check{" "}
      <code>src/docs/StorybookAudit.md</code>'s migration matrix for the
      authoritative status of any specific section or component before
      assuming something is documented here just because it exists in the
      app.
    </Alert>
  </DocsPage>
);

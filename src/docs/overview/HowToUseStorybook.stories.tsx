import type { Meta } from "@storybook/react-vite";
import { Stack, Typography } from "@mui/material";
import { DocsPage, DocsSection } from "../shared/DocsBlocks";

const meta = {
  title: "Overview/How to Use Storybook",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

export const HowToUseStorybook = () => (
  <DocsPage
    title="How to Use Storybook"
    intro="Conventions this Storybook follows, so stories stay consistent as more get added."
  >
    <DocsSection title="Theme switcher (toolbar)">
      <Typography variant="body2" color="text.secondary">
        The paintbrush icon in the toolbar switches between the four client
        theme presets (<code>default</code>, <code>teal</code>,{" "}
        <code>purple</code>, <code>dark-blue</code>). Every story is themed
        via <code>createAppTheme(context.globals.themeColor)</code> — the
        preset-compatible call used by the real theme resolver, so switching
        it re-themes the whole preview, not just a color swatch. Custom-primary
        derivation is demonstrated in <code>Foundations / Colors</code>.
      </Typography>
    </DocsSection>

    <DocsSection title="Accessibility panel">
      <Typography variant="body2" color="text.secondary">
        The Accessibility tab (powered by <code>@storybook/addon-a11y</code>)
        runs an automated axe-core scan against every story and is
        non-blocking by default (<code>a11y.test: "todo"</code> in{" "}
        <code>.storybook/preview.tsx</code>). Automated scans catch roughly a
        third of real accessibility issues — treat a clean panel as a floor,
        not proof of conformance. See <code>Guidelines / Accessibility</code>{" "}
        for what still requires manual/production verification.
      </Typography>
    </DocsSection>

    <DocsSection title="Viewport & responsive testing">
      <Typography variant="body2" color="text.secondary">
        Use the viewport control in the toolbar to preview a story at
        different widths. For breakpoint-specific behavior that depends on
        the app's <code>forceMobileLayout</code> theme option (not just
        physical viewport width), see the live side-by-side comparison on{" "}
        <code>Foundations / Breakpoints & Responsive Design</code> — resizing
        alone won't reproduce that behavior.
      </Typography>
    </DocsSection>

    <DocsSection title="Story organization">
      <Stack spacing={1}>
        <Typography variant="body2">
          Top-level sections follow UI purpose, not source folder — e.g.{" "}
          <code>Overlays</code> groups dialogs/drawers/modals together even
          though those files physically live under{" "}
          <code>src/components/layout/</code>.
        </Typography>
        <Typography variant="body2">
          The sidebar order is fixed via{" "}
          <code>parameters.options.storySort</code> in{" "}
          <code>.storybook/preview.tsx</code>: Overview → Foundations →
          Guidelines → Forms → Layout → Navigation → Content → Feedback →
          Overlays → Coverage & Commerce → Application Patterns → Project.
        </Typography>
        <Typography variant="body2">
          The full target hierarchy and what's built vs. pending is in{" "}
          <code>src/docs/StorybookAudit.md</code>.
        </Typography>
      </Stack>
    </DocsSection>

    <DocsSection title="Docs-style pages vs. component stories">
      <Typography variant="body2" color="text.secondary">
        Pages under <code>Foundations</code>, <code>Guidelines</code>, and{" "}
        <code>Overview</code> are documentation pages built from shared
        blocks in <code>src/docs/shared/DocsBlocks.tsx</code> (
        <code>DocsPage</code>, <code>DocsSection</code>,{" "}
        <code>DocsTable</code>, etc.) — they read live values from the real
        theme rather than hand-typed specs wherever possible. Component
        stories (once built) will instead mount the real component directly
        with Storybook controls exposed for its props, per the component
        documentation standard in the Phase 2 spec.
      </Typography>
    </DocsSection>

    <DocsSection title="Adding a new Foundations/Guidelines page">
      <Typography variant="body2" color="text.secondary">
        Create a <code>*.stories.tsx</code> file, import the shared blocks
        from <code>src/docs/shared/DocsBlocks.tsx</code>, and read values from{" "}
        <code>useTheme()</code> or <code>createAppTheme()</code> rather than
        retyping a value that already exists in <code>theme.ts</code>, so the
        documentation cannot drift from the running application.
      </Typography>
    </DocsSection>
  </DocsPage>
);

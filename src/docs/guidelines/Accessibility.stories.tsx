import type { Meta } from "@storybook/react-vite";
import { Alert, Chip, Divider, Stack, Typography } from "@mui/material";
import { DocsPage, DocsSection, StatusChip } from "../shared/DocsBlocks";

const meta = {
  title: "Guidelines/Accessibility",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

/**
 * Source material: src/pages/InformationArchitecture.tsx's Accessibility
 * section (the `accessibilityRequirements` table, ~40 rows across 12 areas,
 * each carrying a WCAG 2.2 reference and an Implemented/Partial/Requires
 * production testing status). That table is NOT reproduced verbatim here —
 * it stays in Information Architecture as the governance-level requirements
 * record. This page translates it into actionable, component-oriented
 * guidance grouped by theme, per the Phase 2 spec's instruction to organize
 * this material into useful guidance rather than one giant requirement
 * table.
 */

const Applies = ({ items }: { items: string[] }) => (
  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
    <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, alignSelf: "center" }}>
      Applies to:
    </Typography>
    {items.map((c) => (
      <Chip key={c} label={c} size="small" variant="outlined" sx={{ fontFamily: "monospace", fontSize: "0.7rem" }} />
    ))}
  </Stack>
);

export const Accessibility = () => (
  <DocsPage
    eyebrow="Guidelines"
    title="Accessibility"
    intro="This app targets WCAG 2.2 Level AA — as a target, not a certified conformance claim. This page is the implementation reference: how shared components actually satisfy that target. Information Architecture keeps the governance-level requirement and its per-item conformance status; this page shows how."
    maxWidth={1100}
  >
    <Alert severity="info" sx={{ maxWidth: 800 }}>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
        The split, with a concrete example
      </Typography>
      <Typography variant="body2">
        <strong>IA requirement:</strong> "Application controls must be
        keyboard operable and meet the project's accessibility
        requirements." <strong>Storybook implementation</strong> (this page,
        and eventually each component's own Docs page): shows exactly how{" "}
        <code>SelectionGroup</code>'s roving-tabindex rows, dialog focus
        trapping, and snackbar urgency actually implement that requirement.
      </Typography>
    </Alert>

    <DocsSection title="Semantic structure & landmarks">
      <Typography variant="body2" color="text.secondary">
        One primary heading per page with a non-skipping section hierarchy
        underneath it; native HTML elements for every interactive
        control (button/a/input/select) so browsers and assistive
        technology get correct default semantics without extra ARIA; ARIA is
        added only to supplement native semantics that don't exist yet (e.g.
        a card acting as a radio option), never duplicated onto controls
        that already expose the right role. The page shell exposes exactly
        one <code>main</code> landmark, one header, one footer.
      </Typography>
      <Applies items={["AppShell", "AppBody", "PageHeader", "CategoryHeader"]} />
      <StatusChip status="Implemented" />
    </DocsSection>

    <DocsSection title="Keyboard operability">
      <Typography variant="body2" color="text.secondary">
        Every interactive control — including custom selection cards,
        category tabs, and expand/collapse toggles — must be reachable via
        Tab/Shift+Tab and activated with Enter/Space; no mouse-only
        interaction exists anywhere. Tab order follows visual/task order,
        including fixed UI like the cookie banner. Dialogs/drawers/menus
        rely on MUI's own focus trap and Escape-to-close — nothing overrides
        that default.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="center">
        <StatusChip status="Partial" />
        <Typography variant="caption" color="text.secondary">
          Custom radio-style rows (coverage category cards, gender/tobacco
          toggles, Yes/No question rows) support roving-tabindex + Enter/Space
          activation like a native radio group, but full native arrow-key
          roving between options is a documented follow-up, not yet
          implemented everywhere.
        </Typography>
      </Stack>
      <Applies items={["SelectionGroup", "AppDrawer", "AppModal", "AppMenu"]} />
    </DocsSection>

    <DocsSection title="Focus visibility & management">
      <Typography variant="body2" color="text.secondary">
        Every interactive element keeps a visible focus outline — no global
        style suppresses it without a compensating replacement.
        Destructive/removal actions that unmount their own trigger (removing
        a list row, "See my quote" revealing new content) explicitly move
        focus to a stable nearby control or the newly revealed region
        instead of dropping it to <code>document.body</code>. A "Skip to
        main content" link is the first focusable element on every page. On
        failed submission, the page scrolls toward the first field in error.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="flex-start">
        <StatusChip status="Requires production testing" />
        <Typography variant="caption" color="text.secondary">
          Focus not being hidden behind sticky/fixed headers needs
          re-verification with real content lengths and viewport sizes.
        </Typography>
      </Stack>
      <Alert severity="warning" sx={{ mt: 1.5, maxWidth: 720 }}>
        Known implementation gap (from the Phase 1 audit, not yet fixed):
        both of the app's <code>scrollToFirstError</code> implementations (
        <code>RoutePage.tsx</code> and a duplicated copy in{" "}
        <code>Coverage.tsx</code>) call <code>scrollIntoView</code> but never{" "}
        <code>.focus()</code> the invalid field — so keyboard/screen-reader
        users land near the error visually without their actual focus moving
        there.
      </Alert>
      <Applies items={["DynamicList", "PageNav", "FieldRenderer"]} />
    </DocsSection>

    <DocsSection title="Forms, labels & validation">
      <Typography variant="body2" color="text.secondary">
        Every control has a real associated label; icon-only controls carry
        an <code>aria-label</code> describing their action, with per-row
        context where duplicates exist on one page (e.g. "Remove Jane Doe
        (50%)"). Required fields expose <code>required</code>/
        <code>aria-required</code> in addition to the visual asterisk.
        Field-level errors use the shared field renderer's native
        error/helper-text wiring (plus explicit{" "}
        <code>aria-describedby</code> for custom radio and checkbox-group
        rows) rather than a same-page banner alone. Helper text is always
        linked via <code>aria-describedby</code>. Errors never rely on color
        alone. Radio/checkbox groups are wrapped in a{" "}
        <code>radiogroup</code>/<code>group</code> role with{" "}
        <code>aria-labelledby</code> pointing at the visible question text.
      </Typography>
      <Applies items={["FieldRenderer", "SelectionGroup", "DynamicList", "PageAlert"]} />
      <StatusChip status="Implemented" />
    </DocsSection>

    <DocsSection title="Dynamic content & status messaging">
      <Typography variant="body2" color="text.secondary">
        Recalculating cost/estimate panels and "Loading your coverage
        options" states use <code>role="status"</code>/
        <code>aria-live="polite"</code> (decorative spinners hidden or
        labeled) so a value updating is announced instead of silently
        changing. Routine confirmations (progress saved, success toasts) use{" "}
        <code>role="status"</code> — only genuine errors/warnings use{" "}
        <code>role="alert"</code>, so routine updates don't interrupt the way
        an error would. Adding/editing/removing a repeatable item posts a
        short polite announcement. Pages reached by a direct navigation that
        bypasses the standard Next-button transition (e.g. an advisor
        "send back" confirmation) provide their own brief arrival
        announcement. Live regions are scoped to meaningful state changes,
        not wrapped around every re-render.
      </Typography>
      <Applies items={["AppSnackbar", "PageAlert", "PageTransitionSkeleton", "DynamicList"]} />
      <StatusChip status="Implemented" />
    </DocsSection>

    <DocsSection title="Dialogs, drawers & overlays">
      <Typography variant="body2" color="text.secondary">
        Every modal dialog and drawer is labelled via{" "}
        <code>aria-labelledby</code> pointing at its visible title, or an
        explicit <code>aria-label</code> when there is no visible title.
        Modal behavior (focus moves inside on open, Tab trapped, Escape
        closes) uses MUI's default, unmodified. Every icon-only close
        control has an <code>aria-label</code> naming what it closes.
        Destructive/warning confirmations use{" "}
        <code>role="alertdialog"</code>; informational dialogs use the
        default <code>dialog</code> role. Background content is excluded
        from the tab order and hidden from assistive technology while a
        modal is open — MUI's default backdrop behavior, not overridden.
      </Typography>
      <Applies items={["AppModal", "AppDrawer", "ConfirmationDialog", "SendApplicationDialog"]} />
      <StatusChip status="Implemented" />
    </DocsSection>

    <DocsSection title="Images & icons">
      <Typography variant="body2" color="text.secondary">
        Informative images (logos) use descriptive alt text, never a
        filename. Decorative icons (section icons, spinners paired with
        visible loading text, category badges) are hidden from assistive
        technology via MUI's default <code>SvgIcon</code> behavior or an
        explicit <code>aria-hidden</code>. Every icon-only button has an{" "}
        <code>aria-label</code> describing its action, including dynamic
        state where relevant (the cart button announces its current item
        count).
      </Typography>
      <Applies items={["AppHeader", "FeaturedBadge", "QuickDecisionIndicator"]} />
      <StatusChip status="Implemented" />
    </DocsSection>

    <DocsSection title="Navigation & progress">
      <Typography variant="body2" color="text.secondary">
        The active progress step carries <code>aria-current="step"</code>{" "}
        (in addition to its visual styling); breadcrumb-style navigation
        marks the active page with <code>aria-current="page"</code>. Step
        completion/active state always pairs its visual treatment with that
        programmatic marker — never color/bold alone. Back/next controls,
        category tabs, and menu triggers carry accessible names describing
        their destination, including when their visible text label is
        hidden at small viewport widths.
      </Typography>
      <Applies items={["ProgressStep", "PageNav", "CoverageOptionsPanel"]} />
      <StatusChip status="Implemented" />
    </DocsSection>

    <DocsSection title="Color, contrast & responsive reflow">
      <Typography variant="body2" color="text.secondary">
        Status/eligibility/error indicators pair color with text and/or an
        icon — removing color never removes meaning. Layouts use relative
        units and MUI's responsive breakpoints rather than fixed-pixel
        containers that would clip enlarged text. Narrow-viewport variants
        (mobile stepper, drawer-based panels, hidden tab text labels) hide
        only redundant visual labels — hidden text is always replaced with
        an equivalent <code>aria-label</code>, never just dropped.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="flex-start">
        <StatusChip status="Requires production testing" />
        <Typography variant="caption" color="text.secondary">
          AA contrast (4.5:1 text, 3:1 large text/non-text UI) and 200%-zoom
          reflow are designed for but need verification against the
          production palette and every client theme override, not just the
          prototype's placeholder colors.
        </Typography>
      </Stack>
      <Applies items={["ProgressStep", "CoverageOptionsPanel", "HelpChips"]} />
    </DocsSection>

    <DocsSection title="Pointer & touch interaction">
      <Typography variant="body2" color="text.secondary">
        No functionality anywhere in the template uses drag-only
        interaction (sliders, drag-to-reorder) — every quantity/amount
        control is a select, stepper, or typed input. Custom selection rows
        and cards use <code>onClick</code>, which fires identically for
        touch and mouse, rather than hover-only handlers; swipeable drawers
        fall back to tap-to-open/close.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="flex-start">
        <StatusChip status="Requires production testing" />
        <Typography variant="caption" color="text.secondary">
          Interactive controls target at least a 24×24 CSS-pixel hit area
          (WCAG 2.2's minimum target-size exception). Controls touched during
          recent work were checked against this; a full pass across every
          legacy control is still a production follow-up.
        </Typography>
      </Stack>
      <Applies items={["SelectionGroup", "AppDrawer"]} />
    </DocsSection>

    <DocsSection title="Authentication & resume recovery">
      <Typography variant="body2" color="text.secondary">
        Resume/verification steps (email link, text/voice code, security
        questions) rely on object recognition or a code the user already
        possesses or receives — never a puzzle, a distorted-image
        transcription, or memorizing new information — satisfying WCAG
        2.2's Accessible Authentication minimum. The verification-code
        screen's "Resend code" action actually works: it resets the
        countdown and confirms (visually and via a live-region
        announcement) that a new code was sent.
      </Typography>
      <Applies items={["MemberVerification"]} />
      <StatusChip status="Implemented" />
    </DocsSection>

    <Divider />

    <DocsSection
      title="Testing & validation (process requirements, not implementation)"
      description="These are process commitments for production readiness, not something a component's story can satisfy on its own."
    >
      <Stack spacing={1}>
        <Typography variant="body2">
          • Automated tooling (axe-core or equivalent) against every
          page/state — this Storybook's Accessibility panel is a start, not
          a substitute; automated testing alone catches roughly a third of
          real WCAG issues.
        </Typography>
        <Typography variant="body2">
          • Full keyboard-only walkthroughs of every flow (application form,
          quote tool, beneficiary management, resume/authentication).
        </Typography>
        <Typography variant="body2">
          • Screen reader testing with at least one desktop reader (NVDA or
          JAWS + Chrome/Edge) and one mobile reader (VoiceOver or TalkBack),
          including dynamic states.
        </Typography>
        <Typography variant="body2">
          • 200%-zoom and narrow-viewport reflow checks.
        </Typography>
        <Typography variant="body2">
          • Contrast verification against final production colors, including
          every client theme override — not the prototype's placeholder
          palette.
        </Typography>
      </Stack>
      <StatusChip status="Requires production testing" />
    </DocsSection>
  </DocsPage>
);

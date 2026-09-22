import type { Meta } from "@storybook/react-vite";
import { Alert, Stack, Typography } from "@mui/material";
import { DocsPage, DocsSection, DocsTable, TableRow, TableCell, SourceNote } from "../shared/DocsBlocks";
import PageAlert from "../../components/feedback/PageAlert";

const meta = {
  title: "Guidelines/Dynamic Feedback & Status",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

/**
 * Source material: the retired in-app "Design rules → Alerts" section.
 * section (the `alertRules` severity-to-meaning matrix) — migrated here per
 * the Phase 2A audit's deferred item, plus the shared feedback components'
 * actual supported behavior.
 */

type AlertRule = { severity: "error" | "warning" | "info" | "success"; meaning: string; usedFor: string };

const alertRules: AlertRule[] = [
  { severity: "error", meaning: "Blocking problem the user must resolve before continuing.", usedFor: "Expired/invalid resume links, failed code validation, membership/eligibility failures, quote errors." },
  { severity: "warning", meaning: "Caution — not blocking, but needs the user's attention.", usedFor: "Incomplete required info (Membership, Payment), cart total not yet confirmed, Review consent reminders." },
  { severity: "info", meaning: "Contextual, non-urgent detail or status update.", usedFor: "TPA integration notices, autosave confirmations, applicant-section notes, Receipt next steps." },
  { severity: "success", meaning: "Confirms a completed action.", usedFor: "Eligibility confirmation, advisor send confirmation, progress-saved snackbar." },
];

export const DynamicFeedbackAndStatus = () => (
  <DocsPage
    eyebrow="Guidelines"
    title="Dynamic Feedback & Status"
    intro="One severity system covers every alert, banner, and snackbar in the app — severity communicates meaning, and should never be substituted for visual variety alone. This page also covers the accessibility distinction between polite status updates and urgent alerts, and how loading/processing/empty states fit together."
    maxWidth={1100}
  >
    <DocsSection title="Severity meanings" description="One severity system, shared by PageAlert and AppSnackbar — do not pick a severity for visual variety.">
      <DocsTable columns={["Severity", "Meaning", "Used for"]}>
        {alertRules.map((rule) => (
          <TableRow key={rule.severity}>
            <TableCell sx={{ fontWeight: 700, textTransform: "capitalize" }}>{rule.severity}</TableCell>
            <TableCell>{rule.meaning}</TableCell>
            <TableCell>{rule.usedFor}</TableCell>
          </TableRow>
        ))}
      </DocsTable>
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {alertRules.map((rule) => (
          <PageAlert key={rule.severity} severity={rule.severity} message={rule.meaning} />
        ))}
      </Stack>
      <SourceNote>src/components/feedback/PageAlert.tsx, AppSnackbar.tsx</SourceNote>
    </DocsSection>

    <DocsSection
      title="Polite vs. assertive live regions"
      description="Both PageAlert and AppSnackbar map severity to the same ARIA role — this is the one rule to keep consistent anywhere a new feedback surface is added."
    >
      <DocsTable columns={["Severity", "Role", "Urgency"]}>
        <TableRow><TableCell>error, warning</TableCell><TableCell sx={{ fontFamily: "monospace" }}>role="alert"</TableCell><TableCell>Assertive — interrupts, announced immediately</TableCell></TableRow>
        <TableRow><TableCell>info, success</TableCell><TableCell sx={{ fontFamily: "monospace" }}>role="status"</TableCell><TableCell>Polite — announced when the screen reader is next idle</TableCell></TableRow>
      </DocsTable>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 720 }}>
        The same mapping applies to <code>DynamicList</code>'s add/edit/remove
        announcements, <code>LoadingOverlay</code>/<code>PageTransitionSkeleton</code>'s
        loading announcements (always polite — a loading state is never
        urgent enough to interrupt), and every other live region in the app.
      </Typography>
    </DocsSection>

    <DocsSection title="Loading & processing states" description="Four LoadingOverlay sizes cover four different contexts; PageTransitionSkeleton is specifically for route transitions between application pages.">
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720, mb: 1 }}>
        <code>LoadingOverlay</code> — <code>sm</code> inline (e.g. inside a
        button), <code>md</code> section-level, <code>lg</code> page-level,{" "}
        <code>fullscreen</code> blocks the whole viewport for
        external-redirect or global-submission flows.{" "}
        <code>PageTransitionSkeleton</code> — shown by <code>FormRoutePage</code>{" "}
        while the next application page resolves; not a general-purpose
        loading indicator.
      </Typography>
      <Alert severity="info" sx={{ maxWidth: 720 }}>
        <code>ProcessingStatusPage</code> is the canonical richer processing
        surface for DocuSign and QuickDecision: spinner, optional mark,
        heading, and explanatory body. Use <code>LoadingOverlay</code> when an
        existing surface should remain visible behind a blocking overlay.
      </Alert>
    </DocsSection>

    <DocsSection title="Empty states" description="EmptyState is the one shared pattern for a section or panel with nothing to show — no page currently reinvents this inline.">
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
        Used by CoverageCart (no coverage selected yet) and QuoteCalculator.
        Static content, not a live region — there is nothing dynamic to
        announce about an empty state itself.
      </Typography>
    </DocsSection>

    <DocsSection title="Known deviation from this system">
      <Alert severity="warning" sx={{ maxWidth: 760 }}>
        Roughly 13 pages (Beneficiary, Membership, Payment, Review, Resume,
        ResumeCode, Eligibility, Profile, Receipt, and others) render a raw
        MUI <code>Alert</code> directly instead of <code>PageAlert</code>,
        bypassing this severity system's single point of maintenance. Flagged
        in the Phase 1 audit as a recommended (not required) migration; not
        fixed in this pass.
      </Alert>
    </DocsSection>
  </DocsPage>
);

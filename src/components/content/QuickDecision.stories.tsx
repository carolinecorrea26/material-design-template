import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Stack, Typography } from "@mui/material";
import QuickDecisionDrawerContent, {
  QuickDecisionMark,
  QuickDecisionMarkStyled,
  QuickDecisionMarkPlain,
} from "./QuickDecisionExplainer";
import QuickDecisionInfoBox from "./QuickDecisionInfoBox";
import QuickDecisionIndicator from "../ui/QuickDecisionIndicator";

/**
 * The same QuickDecision℠ explainer content rendered through two different
 * chrome patterns — HowApplyingWorksPanel's drawer (QuickDecisionDrawerContent,
 * a full explainer body) and ProductCatalog/CoverageOptionsPanel's inline
 * collapsible banner (QuickDecisionInfoBox, which reuses the same content
 * component internally with plainMark). Documented together deliberately,
 * per the Phase 1 audit's explicit recommendation, rather than as unrelated
 * components — along with the third, visually inconsistent sibling
 * (QuickDecisionIndicator, a bare icon with no text) shown for comparison.
 */
const meta = {
  title: "Content/QuickDecision",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

export const InfoBoxInlineCollapse: StoryObj = {
  name: "QuickDecisionInfoBox (inline collapsible banner)",
  render: () => (
    <Box sx={{ maxWidth: 640 }}>
      <QuickDecisionInfoBox />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '"Show more" expands the same explainer content shown in the drawer surface below, inline, via aria-expanded/aria-controls on a role="button" span rather than a native button — click it to see both.',
      },
    },
  },
};

export const DrawerExplainerContent: StoryObj = {
  name: "QuickDecisionDrawerContent (full explainer body)",
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <QuickDecisionDrawerContent />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The same content HowApplyingWorksPanel's drawer variant mounts inside its own AppDrawer sub-panel — shown here standalone, without that chrome.",
      },
    },
  },
};

export const MarkVariants: StoryObj = {
  name: "QuickDecisionMark family (styled / plain / bare)",
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 420 }}>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          QuickDecisionMarkStyled — bold, success green, lightning icon
        </Typography>
        <Typography variant="body2">
          <QuickDecisionMarkStyled /> available!
        </Typography>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          QuickDecisionMarkPlain — bold weight only, no color/icon
        </Typography>
        <Typography variant="body2">
          <QuickDecisionMarkPlain /> available!
        </Typography>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          QuickDecisionMark — bare text + superscript, no styling at all
        </Typography>
        <Typography variant="body2">
          <QuickDecisionMark /> available!
        </Typography>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          QuickDecisionIndicator — the visually inconsistent sibling: a bare
          icon, no visible text at all (only a titleAccess tooltip)
        </Typography>
        <Typography variant="body2">
          <QuickDecisionIndicator /> (icon only, no label)
        </Typography>
      </Stack>
    </Stack>
  ),
};

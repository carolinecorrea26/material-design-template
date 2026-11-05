import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Stack, Typography } from "@mui/material";
import QuickDecisionDrawerContent, {
  QuickDecisionMark,
  QuickDecisionMarkStyled,
  QuickDecisionMarkPlain,
} from "./QuickDecisionExplainer";
import QuickDecisionInfoBox from "./QuickDecisionInfoBox";
import QuickDecisionIndicator from "../coverage/QuickDecisionIndicator";

/** QuickDecision explainer content, inline disclosure, and brand marks. */
const meta = {
  id: "content-quickdecision",
  title: "Components/Coverage and pricing/QuickDecision information",
  component: QuickDecisionDrawerContent,
  subcomponents: { QuickDecisionInfoBox, QuickDecisionIndicator },
  parameters: { docs: { description: { component: "QuickDecision explainer, inline disclosure, and marks used by coverage components." } }, layout: "padded" },
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
          '"Show more" expands the shared explainer inline. The native button exposes aria-expanded and aria-controls and supports keyboard activation.',
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

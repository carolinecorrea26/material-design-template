import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import HowApplyingWorksPanel from "./HowApplyingWorksPanel";

/**
 * HowApplyingWorksPanel renders the step-by-step "how applying works"
 * explainer in two shapes: full-width `page` variant (Home page) or a
 * narrower `drawer` variant (AppMenu), which also manages its own
 * QuickDecision/Application-Review sub-drawers when the step text contains
 * a linked term. The Phase 1 audit flagged the decorative numbered-circle
 * badges (1, 2, 3...) as not `aria-hidden` — left as-is here, since fixing
 * it wasn't in this component's assigned scope ("Document," not
 * "Fix-then-document," per the audit's action key).
 */
const meta = {
  title: "Coverage & Commerce/HowApplyingWorksPanel",
  component: HowApplyingWorksPanel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HowApplyingWorksPanel>;

export default meta;

export const PageVariant: StoryObj = {
  name: 'variant="page" (Home page)',
  render: () => (
    <Box sx={{ maxWidth: 900 }}>
      <HowApplyingWorksPanel variant="page" />
    </Box>
  ),
};

export const DrawerVariant: StoryObj = {
  name: 'variant="drawer" (AppMenu, with sub-drawers)',
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <HowApplyingWorksPanel variant="drawer" />
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'In drawer variant, the "review your application" and QuickDecision℠ links inside step text open their own nested AppDrawer sub-panels — try clicking one.',
      },
    },
  },
};

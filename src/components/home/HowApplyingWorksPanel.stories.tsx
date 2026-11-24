import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import HowApplyingWorksPanel from "./HowApplyingWorksPanel";

/**
 * HowApplyingWorksPanel renders the step-by-step "how applying works"
 * explainer in two shapes: full-width `page` variant (Home page) or a
 * narrower `drawer` variant (AppMenu), which also manages its own
 * QuickDecision/Application-Review sub-drawers when the step text contains
 * a linked term. The page variant defaults to regular images; clients can select an animated
 * application preview; the drawer always uses the illustrated small-viewport
 * layout, stacking each image above its step text.
 */
const meta = {
  id: "coverage-commerce-howapplyingworkspanel",
  title: "Components/Pages/Home/Sections/How applying works/Panel variations",
  component: HowApplyingWorksPanel,
  parameters: { standalone: true, docs: { description: { component: "Explains the three application steps using images or a configured animated preview." } }, layout: "padded" },
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
          'The drawer shares the landing-page illustrations and steps, with each image stacked above its text at every viewport width. The "review your application" and QuickDecision℠ links open nested AppDrawer sub-panels.',
      },
    },
  },
};

export const Animated: StoryObj = { render: () => <HowApplyingWorksPanel variant="page" presentation="animated" /> };

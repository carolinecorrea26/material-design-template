import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import CoverageOptionsPanel from "./CoverageOptionsPanel";

/**
 * CoverageOptionsPanel is a tabbed "browse what coverage is available"
 * reader — page variant on the Home page, drawer variant in AppMenu. Real
 * client coverage config drives the tabs/products; there's no props for
 * mock data. The Phase 1 audit flagged its product-name links as
 * placeholder `href="#"` anchors that went nowhere — fixed in this pass to
 * plain (non-interactive) text instead of a fake link, since there's no
 * real product-detail destination for them to point to.
 */
const meta = {
  title: "Coverage & Commerce/CoverageOptionsPanel",
  component: CoverageOptionsPanel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CoverageOptionsPanel>;

export default meta;

export const PageVariant: StoryObj = {
  name: 'variant="page" (Home page)',
  render: () => (
    <Box sx={{ maxWidth: 900 }}>
      <CoverageOptionsPanel variant="page" />
    </Box>
  ),
};

export const DrawerVariant: StoryObj = {
  name: 'variant="drawer" (AppMenu)',
  render: () => (
    <Box sx={{ maxWidth: 420 }}>
      <CoverageOptionsPanel variant="drawer" />
    </Box>
  ),
};

export const InitialCategory: StoryObj = {
  name: 'initialCategory="DI"',
  render: () => (
    <Box sx={{ maxWidth: 900 }}>
      <CoverageOptionsPanel variant="page" initialCategory="DI" />
    </Box>
  ),
};

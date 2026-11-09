import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Button } from "@mui/material";
import CoveragePortfolioDrawer from "./CoveragePortfolioDrawer";

/**
 * CoveragePortfolioDrawer is a read-only "existing coverage" summary shown
 * on the Coverage page to TPA-verified members — its coverage data is
 * fictional data from the fresh-start portfolio fixture, also used for
 * configured in-force amount reductions. The
 * Coverage page enforces TPA portfolio access; these standalone examples
 * illustrate the drawer after access has been granted.
 */
const meta = {
  id: "coverage-commerce-coverageportfoliodrawer",
  title: "Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Existing coverage",
  component: CoveragePortfolioDrawer,
  parameters: { standalone: true, docs: { description: { component: "Shows existing member and spouse coverage in a drawer. Examples include coverage without riders, a rider without a separate amount, and a rider with its own benefit amount. Values are fictional prototype portfolio data." } }, layout: "fullscreen" },
} satisfies Meta<typeof CoveragePortfolioDrawer>;

export default meta;

function DrawerDemo({ hasSpouse = false }: { hasSpouse?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <Box sx={{ p: 2 }}>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Reopen portfolio drawer
      </Button>
      <CoveragePortfolioDrawer open={open} onClose={() => setOpen(false)} hasSpouse={hasSpouse} />
    </Box>
  );
}

export const MemberOnly: StoryObj = {
  name: "hasSpouse=false (member portfolio only)",
  render: () => <DrawerDemo />,
};

export const WithSpouse: StoryObj = {
  name: "hasSpouse=true (member + spouse portfolios)",
  render: () => <DrawerDemo hasSpouse />,
};

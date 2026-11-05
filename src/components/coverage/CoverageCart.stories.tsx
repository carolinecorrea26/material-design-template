import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Button } from '@mui/material';
import CoverageCart, { type CoverageSummaryEntry } from './CoverageCart';
import AppDrawer from '../layout/AppDrawer';
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';
import { openOverlay } from '../../../.storybook/previewInteractions';

const meta = {
  id: 'coverage-commerce-coveragecart', title: "Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Coverage summary", component: CoverageCart,
  parameters: { standalone: true, layout: 'fullscreen', docs: { description: { component: 'Drawer and inline cart views receive explicit entries, rate states and callbacks. The application adapter owns saved answers, eligibility, rating and navigation.' } } },
} satisfies Meta<typeof CoverageCart>;
export default meta;
function DrawerExample({ initialEntries = [] }: { initialEntries?: CoverageSummaryEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [open, setOpen] = useState(true);
  return <>
    {!open && <Box sx={{ p: 2 }}><Button onClick={() => setOpen(true)}>Reopen drawer</Button></Box>}
    <AppDrawer open={open} onClose={() => setOpen(false)} ariaLabel="Coverage cart">
      <CoverageCart variant="drawer" onClose={() => setOpen(false)} entries={entries}
        totalMonthly={entries.reduce((sum, entry) => sum + entry.applicants.reduce((sum, applicant) => sum + (applicant.monthlyEstimate ?? 0), 0), 0)}
        onRemoveCoverage={id => setEntries(entries => entries.filter(entry => entry.coverage.id !== id))} />
    </AppDrawer>
  </>;
}
export const EmptyDrawer: StoryObj = { name: 'Empty (no coverage selected)', render: () => <DrawerExample /> };
export const PopulatedDrawer: StoryObj = { name: 'Populated (explicit example entries)', render: () => <ComponentFixture>{fixture => <DrawerExample initialEntries={fixture.products.filter(product => product.categoryId === 'LI').slice(0, 2).map(coverage => ({ coverage, applicants: [{ applicantId: 'member', amount: 100000, riders: [], monthlyEstimate: 25, display: { status: 'available', amount: 25 } }] }))} />}</ComponentFixture> };
export const RemoveCoverageDialog: StoryObj = { ...PopulatedDrawer, play: async context => {
  // The cart itself is a portal, so inspect its visible owner document.
  await openOverlay(/^Remove /)({ canvasElement: context.canvasElement.ownerDocument.body });
} };

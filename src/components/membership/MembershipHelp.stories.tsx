import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Typography } from '@mui/material';
import MembershipHelp from './MembershipHelp';
import PageHeader from '../layout/PageHeader';
import CoverageOptionsPanel from '../coverage/CoverageOptionsPanel';
import HowApplyingWorksPanel from '../home/HowApplyingWorksPanel';
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';
const meta = { id: 'pages-membership-introduction-and-help', title: "Components/Pages/Membership/Sections/Contextual help", component: MembershipHelp,
  parameters: { standalone: true, catalog: { position: 0 }, layout: 'fullscreen', docs: { description: { component: 'Help chips receive explicit drawer contents and an estimate callback. The application quote workflow is exercised by Whole page.' } } },
} satisfies Meta<typeof MembershipHelp>;
export default meta;
function Example() {
  const [action, setAction] = useState('');
  return <ComponentFixture>{fixture => <Box sx={{ maxWidth: 640, mx: 'auto', p: 3 }}>
    <PageHeader title="Membership" help={<MembershipHelp onEstimate={() => setAction('Estimate requested. See Whole page for the application quote workflow.')} drawerHelpItems={[
      { id: 'coverage-options-available', title: 'Coverage options', content: <CoverageOptionsPanel variant="drawer" content={fixture.content} coverages={fixture.products} coverageConfig={fixture.client.coverages} /> },
      { id: 'application-process', title: 'How applying works', content: <HowApplyingWorksPanel variant="drawer" /> },
    ]} />} />
    <Typography role="status">{action}</Typography>
  </Box>}</ComponentFixture>;
}
export const Default: StoryObj = { render: () => <Example /> };

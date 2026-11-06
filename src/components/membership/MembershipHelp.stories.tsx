import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@mui/material';
import MembershipHelp from './MembershipHelp';
import PageHeader from '../layout/PageHeader';
import CoverageOptionsPanel from '../coverage/CoverageOptionsPanel';
import HowApplyingWorksPanel from '../home/HowApplyingWorksPanel';
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';
const meta = { id: 'pages-membership-introduction-and-help', title: "Components/Pages/Membership/Sections/Contextual help", component: MembershipHelp,
  parameters: { standalone: true, catalog: { position: 0 }, layout: 'fullscreen', docs: { description: { component: 'Help chips receive explicit drawer contents.' } } },
} satisfies Meta<typeof MembershipHelp>;
export default meta;
function Example() {
  return <ComponentFixture>{fixture => <Box sx={{ maxWidth: 640, mx: 'auto', p: 3 }}>
    <PageHeader title="Membership" help={<MembershipHelp drawerHelpItems={[
      { id: 'coverage-options-available', title: 'Coverage options', content: <CoverageOptionsPanel variant="drawer" content={fixture.content} coverages={fixture.products} coverageConfig={fixture.client.coverages} /> },
      { id: 'application-process', title: 'How applying works', content: <HowApplyingWorksPanel variant="drawer" /> },
    ]} />} />
  </Box>}</ComponentFixture>;
}
export const Default: StoryObj = { render: () => <Example /> };

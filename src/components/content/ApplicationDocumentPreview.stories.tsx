import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Typography } from '@mui/material';
import ApplicationDocumentPreview, { type ApplicationDocumentSection } from './ApplicationDocumentPreview';

const meta = {
  id: 'content-applicationdocumentpreview', title: "Components/Content and data display/Document preview", component: ApplicationDocumentPreview,
  parameters: {
    standalone: true, layout: 'padded',
    review: { scope: 'shared-component', focus: 'Review document pagination, placeholders, signatures and edit callbacks using explicit display sections. The application adapter owns field/page resolution.', references: [{ label: 'Review page composition', storyId: 'pages-review-whole-page--empty' }] },
    docs: { description: { component: 'Application readout from supplied display sections, association name, dates and edit targets. No Site or application provider is required.' } },
  },
} satisfies Meta<typeof ApplicationDocumentPreview>;
export default meta;
const exampleDocumentSections: ApplicationDocumentSection[] = [
  { title: 'Membership', groups: [{ entries: [{ label: 'Name', value: 'Jordan Morgan' }, { label: 'Email', value: 'jordan@example.org' }] }] },
  { title: 'Coverage', groups: [{ title: 'Example Term Life', entries: [{ label: 'Member coverage', value: '$100,000' }] }] },
  { title: 'Contact', groups: [{ entries: [{ label: 'Street address', value: '100 Example Street' }] }] },
  { title: 'Profile', groups: [{ entries: [{ label: 'Physician', value: '' }] }] },
];
function PreviewExample({ hideSignature = false, editable = false }: { hideSignature?: boolean; editable?: boolean }) {
  const [edited, setEdited] = useState('');
  return <Box sx={{ maxWidth: 800 }}>
    <ApplicationDocumentPreview sections={exampleDocumentSections} associationName="Example Association"
      sectionPages={[{ title: 'Membership', pageId: 'membership' }, { title: 'Coverage', pageId: 'coverage' }, { title: 'Contact', pageId: 'contact' }, { title: 'Profile', pageId: 'profile' }]}
      signatureName="Jordan Morgan" signedDate="2026-10-28" currentDate="10/28/2026" hideSignature={hideSignature}
      onEditSection={editable ? pageId => setEdited(pageId) : undefined} />
    <Typography role="status">{edited ? `Edit requested: ${edited}` : ''}</Typography>
  </Box>;
}
export const Default: StoryObj = { render: () => <PreviewExample /> };
export const HiddenSignature: StoryObj = { name: 'hideSignature=true', render: () => <PreviewExample hideSignature /> };
export const WithEditButtons: StoryObj = { name: 'onEditSection (per-section edit buttons)', render: () => <PreviewExample editable hideSignature /> };

import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Typography } from '@mui/material';
import LegalReviewSection from './LegalReviewSection';
import { getContent } from '../../content';
const meta = {
  id: "forms-legal-review-section",
  title: "Components/Pages/Review/Sections/Disclosures and consent", component: LegalReviewSection,
  parameters: { standalone: true, layout: 'padded', review: { scope: 'shared-component', focus: 'Shared legal-section heading, bordered surface, optional scroll limit and supplied Print callback. Page examples use saved legal wording and the browser print action.', references: [{ label: 'Review page', storyId: 'pages-review-whole-page--empty' }] } },
} satisfies Meta<typeof LegalReviewSection>;
export default meta;
function SectionExample({ maxHeight, onPrint = fn() }: { maxHeight?: number; onPrint?: () => void }) {
  const content = getContent().review;
  return <LegalReviewSection id="electronic-consent" title={content.electronicConsentTitle} maxHeight={maxHeight} onPrint={onPrint}>
    <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap' }}>{content.electronicConsentContent}</Typography>
  </LegalReviewSection>;
}
export const Default: StoryObj<{ onPrint: () => void }> = { args: { onPrint: fn() }, render: args => <SectionExample onPrint={args.onPrint} /> };
export const Scrollable: StoryObj = { render: () => <SectionExample maxHeight={100} /> };

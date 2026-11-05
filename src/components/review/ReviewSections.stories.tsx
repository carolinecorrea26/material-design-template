import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import ReviewSections from './ReviewSections';
import SectionStoryForm from '../../../.storybook/forms/SectionStoryForm';
import { fieldCatalog } from '../../config/fields';
import { getContent } from '../../content';
import ApplicationDocumentPreview from '../content/ApplicationDocumentPreview';

const meta = {
  id: "pages-review-sections",
  title: "Components/Pages/Review/Sections/Complete composition", component: ReviewSections,
  parameters: {
    standalone: true, layout: 'fullscreen', catalog: { position: 0 },
    review: { scope: 'section-example', focus: 'Optional composition inspection using explicit state and current configured content. No Site participation or consent-selection policy runs here.', references: [{ label: 'Review the real page', storyId: 'pages-review-whole-page--empty' }, { label: 'Shared disclosure surface', storyId: 'forms-legal-review-section--default' }, { label: 'Shared statement placement', storyId: 'forms-review-statement--before-consent-notice' }] },
  },
} satisfies Meta<typeof ReviewSections>;
export default meta;
function SectionsExample({ spouse = false, advisor = false }: { spouse?: boolean; advisor?: boolean }) {
  const reviewContent = getContent().review;
  return <SectionStoryForm fields={Object.values(fieldCatalog)}>{props => <>
    <ReviewSections {...props} reviewContent={reviewContent}
      documentPreview={<ApplicationDocumentPreview sections={[{ title: 'Membership', groups: [{ entries: [{ label: 'Name', value: 'Jordan Morgan' }] }] }]} associationName="Example Association" signatureName="" signedDate="" currentDate="10/28/2026" hideSignature />}
      isAdvisorApplicantFlow={advisor} showHealthQuestionsNote={false} showSelfLabel={spouse}
      readAndSignText={reviewContent.readAndSignContent}
      beforeConsentNotices={[]} blocks={[]} additionalFields={[]}
      selfConsentField={fieldCatalog['review-self-consent']} spouseConsentField={spouse ? fieldCatalog['review-spouse-consent'] : undefined}
      onPrint={fn()} onDownload={fn()} />
  </>}</SectionStoryForm>;
}
export const Default: StoryObj = { render: () => <SectionsExample /> };
export const MemberAndSpouse: StoryObj = { render: () => <SectionsExample spouse /> };
export const AdvisorGuidance: StoryObj = { render: () => <SectionsExample advisor /> };

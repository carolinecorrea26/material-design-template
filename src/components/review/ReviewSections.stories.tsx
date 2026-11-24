import { composeReadAndSign, resolveReviewLegalSections } from '../../config/reviewExperience';
import { requirementText } from '../../domain/requirementContent';
import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';
import ReviewSections from './ReviewSections';
import SectionStoryForm from '../../../.storybook/forms/SectionStoryForm';
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';
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
  return <ComponentFixture>{fixture => { const reviewContent = fixture.content.review; const policy = fixture.client.reviewPolicy!; return <SectionStoryForm fields={fixture.fields}>{props => <>
    <ReviewSections {...props} reviewContent={reviewContent} legalSections={resolveReviewLegalSections(fixture)}
      documentPreview={<ApplicationDocumentPreview sections={[{ title: 'Membership', groups: [{ entries: [{ label: 'Name', value: 'Jordan Morgan' }] }] }]} associationName="Example Association" signatureName="" signedDate="" hideSignature />}
      isAdvisorApplicantFlow={advisor} legalDocuments={policy.documentLinks?.map(link => ({ ...link, document: link.document === 'important-notice' ? reviewContent.importantNotices![policy.importantNotice!.defaultDocument] : fixture.content.footer.privacyNoticeContent }))} remainingSteps={['review.remaining-steps.payment', 'review.remaining-steps.docusign'].map(key => requirementText(key))} showSelfLabel={spouse}
      readAndSignText={composeReadAndSign(reviewContent.readAndSignContent, policy.fraud.defaultText, policy.consent!.underwrittenText, true, { introductoryStatement: policy.authorization!.introductoryStatement, text: policy.authorization!.wording!.defaultText }, policy.premiumContributionStatement)}
      beforeConsentNotices={[]} blocks={[]} additionalFields={[]}
      selfConsentField={fixture.fields.find(field => field.id === 'review-self-consent')!} spouseConsentField={spouse ? fixture.fields.find(field => field.id === 'review-spouse-consent')! : undefined}
      onPrint={fn()} />
  </>}</SectionStoryForm>; }}</ComponentFixture>;
}
export const Default: StoryObj = { render: () => <SectionsExample /> };
export const MemberAndSpouse: StoryObj = { render: () => <SectionsExample spouse /> };
export const AdvisorGuidance: StoryObj = { render: () => <SectionsExample advisor /> };

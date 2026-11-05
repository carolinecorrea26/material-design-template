import type { Meta, StoryObj } from '@storybook/react-vite';
import ReviewStatement from './ReviewStatement';
import { getContent } from '../../content';
import { readSharedCatalog } from '../../persistence/sharedCatalog';
import { isReviewPolicy } from '../../domain/reviewPolicy';
const meta = {
  id: "forms-review-statement",
  title: "Components/Pages/Review/Sections/Read-and-sign statement", component: ReviewStatement,
  parameters: {
    standalone: true, layout: 'padded',
    review: { scope: 'shared-component', focus: 'Review text rendering and native notice placement immediately before CONSENT. Examples use current content and saved notice wording; whole-page scenarios resolve policy participation.', references: [{ label: 'Review saved page wording', storyId: 'pages-review-whole-page--jurisdiction-notices' }] },
  },
} satisfies Meta<typeof ReviewStatement>;
export default meta;
const text = () => getContent().review.readAndSignContent;
export const Default: StoryObj = { render: () => <ReviewStatement text={text()} notices={[]} /> };
export const BeforeConsentNotice: StoryObj = {
  loaders: [async () => {
    const catalog = await readSharedCatalog();
    const policy = catalog.data.configurationValues.find(row => row.key === 'waepa.review-policy')?.value;
    if (!isReviewPolicy(policy)) throw new Error('Saved review policy unavailable.');
    const notices = policy.blocks.filter(block => block.placement === 'before-consent');
    if (!notices.length) throw new Error('Saved before-consent notices unavailable.');
    return { notices };
  }],
  render: (_args, context) => <ReviewStatement text={text()} notices={context.loaded.notices} />,
};

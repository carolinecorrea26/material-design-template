import type { Meta, StoryObj } from '@storybook/react-vite';
import ContactSections from './ContactSections';
import ContactStoryForm from '../../../.storybook/contactStoryForm';
const meta = { id: "pages-contact-sections-together",
  title: "Components/Pages/Contact/Sections/Sections together", component: ContactSections, parameters: { standalone: true, catalog: { position: 3 }, layout: 'fullscreen',
  review: {
    scope: 'section-example',
    focus: 'A local composition check with all supplied Contact sections. Use the whole-page scenarios for page acceptance and application participation.',
    references: [{ label: 'Review Contact as a page', storyId: 'pages-contact-whole-page--empty' }],
  },
  docs: { description: { component: 'Explicitly supplied Contact sections together. Whole page exercises Site rules and application navigation.' } } } } satisfies Meta<typeof ContactSections>;
export default meta;
export const Default: StoryObj = { render: () => <ContactStoryForm business>{props => <ContactSections {...props} />}</ContactStoryForm> };

import examples from '../../../requirements/global/prototype-fixtures/home-examples.json';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Home from '../../pages/Home';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../../persistence/sharedCatalog';
const standard: ApplicationPageScenario = { capability: 'multipleTerms', description: 'The real Home page using fresh-start template content, quote-entry fields, coverage presentation and entry actions. Answers stay local to this example.', values: {} };
const notice: ApplicationPageScenario = { ...standard,
  description: 'Detached configuration enables the optional entry notice. Start my application opens it; Cancel remains on Home and Continue proceeds locally. Saved Site settings are unchanged.',
  home: examples.entryNotice,
};
const meta = { id: "pages-home-whole-page",
  title: "Components/Pages/Home/Whole page", component: Home, loaders: [async () => ({ catalog: await readSharedCatalog() })], parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Home>;
export default meta;
const example = (scenario: ApplicationPageScenario): StoryObj => ({ render: (_args, context) => <ApplicationPageExample key={context.id} catalog={context.loaded.catalog as SharedCatalog} scenario={scenario}><Home /></ApplicationPageExample> });
export const Default = example(standard);
export const EntryNotice = example(notice);

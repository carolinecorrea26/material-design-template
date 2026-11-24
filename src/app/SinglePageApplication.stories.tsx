import { useLayoutEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import SinglePageApplication from './SinglePageApplication';
import ApplicationPageExample, { type ApplicationPageScenario } from '../../.storybook/applicationPageExample';
import { readSharedCatalog, type SharedCatalog } from '../persistence/sharedCatalog';

const scenario: ApplicationPageScenario = { capability: 'multipleTerms', description: 'The shared embedded application and section navigation, using the supported template URL parameter.', values: {} };
function EmbeddedApplication({ catalog }: { catalog: SharedCatalog }) {
  useLayoutEffect(() => {
    const previous = window.location.href;
    const stored = sessionStorage.getItem('activeFormTemplate');
    const url = new URL(previous);
    url.searchParams.set('template', 'single');
    window.history.replaceState(null, '', url);
    return () => {
      window.history.replaceState(null, '', previous);
      if (stored === null) sessionStorage.removeItem('activeFormTemplate');
      else sessionStorage.setItem('activeFormTemplate', stored);
    };
  }, []);
  return <ApplicationPageExample catalog={catalog} scenario={scenario}><SinglePageApplication /></ApplicationPageExample>;
}
const meta = {
  id: 'layout-single-page-application',
  title: 'Components/Layout/Embedded application',
  component: SinglePageApplication,
  loaders: [async () => ({ catalog: await readSharedCatalog() })],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Real application pages inside the shared SinglePageSections frame. Next and Back retain answers; completed sections expose Edit. This is one composition example, reusing the canonical fields and sections.' } } },
} satisfies Meta<typeof SinglePageApplication>;
export default meta;
export const Embedded: StoryObj = { render: (_args, context) => <EmbeddedApplication catalog={context.loaded.catalog as SharedCatalog} /> };

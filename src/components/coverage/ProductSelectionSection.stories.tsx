import type { Meta, StoryObj } from '@storybook/react-vite';
import ProductCatalog from './ProductCatalog';
import ProductCatalogExample from '../../../.storybook/ProductCatalogExample';
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';

const meta = { title: 'Components/Pages/Coverage/Sections/Product selection', component: ProductCatalog,
  parameters: { standalone: true, catalog: { position: 1 }, layout: 'padded', docs: { description: { component: 'The actual ProductCatalog section, using the same authored data/local interaction fixture as its canonical component example. Whole page retains eligibility and navigation rules.' } } },
} satisfies Meta<typeof ProductCatalog>;
export default meta;
export const Default: StoryObj = { render: () => <ComponentFixture>{fixture => <ProductCatalogExample fixture={fixture} />}</ComponentFixture> };

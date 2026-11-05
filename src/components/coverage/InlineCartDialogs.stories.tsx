import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import CoverageCart from './CoverageCart';
import ComponentFixture from '../../../.storybook/fixtures/ComponentFixture';
import { openOverlay } from '../../../.storybook/previewInteractions';

const meta = { title: 'Components/Feedback and overlays/Dialogs and drawers/Application dialogs/Edit or remove coverage', component: CoverageCart,
  parameters: { standalone: true, layout: 'padded' },
} satisfies Meta<typeof CoverageCart>;
export default meta;
function Example() {
  const [frequency, setFrequency] = useState<'monthly' | 'annual'>('monthly');
  const [removed, setRemoved] = useState<string[]>([]);
  return <ComponentFixture>{fixture => {
    const products = fixture.products.filter(product => product.categoryId === 'LI').slice(0, 1);
    return <CoverageCart variant="inline" rateFrequency={frequency} showRateFrequencyToggle grandTotal={removed.length ? 0 : 25}
      categoryProducts={products} selectedCoverageIds={products.map(product => product.id).filter(id => !removed.includes(id))}
      productApplicants={Object.fromEntries(products.map(product => [product.id, ['member']]))} calculatingRateKeys={new Set()} frequencyCalculating={false} selectionCalculating={false}
      onFrequencyToggle={setFrequency} calcCoveragePremium={() => 25} isCoverageCalculating={() => false} onEditCoverage={() => {}} onDeleteCoverage={id => setRemoved(current => [...current, id])} />;
  }}</ComponentFixture>;
}
export const EditCoverage: StoryObj = { render: () => <Example />, play: openOverlay(/^Edit /) };
export const RemoveCoverage: StoryObj = { render: () => <Example />, play: openOverlay(/^Remove /) };

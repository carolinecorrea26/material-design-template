import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import CoverageCategorySelector from "./CoverageCategorySelector";
import { coverageCategories } from "../../config/coverageCategories";
import type { CoverageCategoryId } from "../../config/coverageCategories";

/**
 * CoverageCategorySelector is a multi-select toggle list for coverage
 * categories, used on the Coverage page, QuoteCalculator, and (formerly)
 * QuoteModal. It's a controlled component — selection state and toggling
 * live entirely in the consumer, which is why every story below manages its
 * own useState. Rows use a custom role="checkbox"/aria-checked SelectionGroup
 * pattern rather than native checkboxes, matching FieldRenderer's own
 * checkbox-group convention.
 */
const meta = {
  title: "Coverage & Commerce/CoverageCategorySelector",
  component: CoverageCategorySelector,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CoverageCategorySelector>;

export default meta;

function SelectorDemo({
  initialSelectedIds = [],
  legend,
  error,
  errorMessage,
}: {
  initialSelectedIds?: CoverageCategoryId[];
  legend?: string;
  error?: boolean;
  errorMessage?: string;
}) {
  const [selectedIds, setSelectedIds] = useState<CoverageCategoryId[]>(initialSelectedIds);
  return (
    <CoverageCategorySelector
      categories={coverageCategories}
      selectedIds={selectedIds}
      onToggle={(id) =>
        setSelectedIds((current) =>
          current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
        )
      }
      legend={legend}
      error={error}
      errorMessage={errorMessage}
    />
  );
}

export const Default: StoryObj = {
  render: () => <SelectorDemo initialSelectedIds={["LI"]} />,
};

export const NoneSelected: StoryObj = {
  render: () => <SelectorDemo />,
};

export const RequiredError: StoryObj = {
  name: "error (nothing selected, required)",
  render: () => (
    <SelectorDemo error errorMessage="Select at least one coverage type." />
  ),
};

export const CustomLegend: StoryObj = {
  render: () => (
    <SelectorDemo
      initialSelectedIds={["DI"]}
      legend="Which coverage would you like a quote for?"
    />
  ),
};

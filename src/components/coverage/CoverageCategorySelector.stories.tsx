import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import CoverageCategorySelector from "./CoverageCategorySelector";
import ComponentFixture from "../../../.storybook/fixtures/ComponentFixture";
import { getCoverageCategories } from "../../config/coverageCategories";
import type { CoverageCategoryId } from "../../config/coverageCategories";

/** Coverage categories rendered with FieldRenderer's standard checkbox group. */
const meta = {
  id: "coverage-commerce-coveragecategoryselector",
  title: "Components/Coverage and pricing/Coverage category selector",
  component: CoverageCategorySelector,
  parameters: { standalone: true, docs: { description: { component: "Lets applicants choose the coverage categories they want to explore." } }, layout: "padded" },
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
    <ComponentFixture>{fixture => <CoverageCategorySelector
      field={fixture.fieldSurfaces.coverageControls.mapping.fields.find(field => field.id === "coverage-categories")}
      categories={getCoverageCategories(fixture.client.coverages.categoryNames).filter(category => fixture.products.some(product => product.categoryId === category.id))}
      selectedIds={selectedIds}
      onToggle={(id) =>
        setSelectedIds((current) =>
          current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
        )
      }
      legend={legend}
      error={error}
      errorMessage={errorMessage}
    />}</ComponentFixture>
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

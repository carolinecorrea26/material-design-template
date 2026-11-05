import ControlledFieldRenderer from "../forms/ControlledFieldRenderer";
import type { CoverageCategory, CoverageCategoryId } from "../../config/coverageCategories";

type CoverageCategorySelectorProps = {
  categories: readonly CoverageCategory[];
  selectedIds: readonly CoverageCategoryId[];
  onToggle: (id: CoverageCategoryId) => void;
  legend?: string;
  error?: boolean;
  errorMessage?: string;
};

/** Coverage category selection using the standard checkbox-group field. */
export default function CoverageCategorySelector({
  categories,
  selectedIds,
  onToggle,
  legend = "Which coverage are you interested in?",
  error = false,
  errorMessage,
}: CoverageCategorySelectorProps) {
  return (
    <ControlledFieldRenderer
      field={{
        id: "coverage-categories",
        label: legend,
        inputType: "checkbox-group",
        required: true,
        options: categories.map(category => ({ value: category.id, label: category.label })),
      }}
      value={[...selectedIds]}
      error={error ? errorMessage : undefined}
      onChange={next => {
        if (!Array.isArray(next)) return;
        const changed = categories.find(category => next.includes(category.id) !== selectedIds.includes(category.id));
        if (changed) onToggle(changed.id);
      }}
    />
  );
}

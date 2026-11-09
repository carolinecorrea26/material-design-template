import { requirementCoverageControl } from "../../domain/requirementFields";
import ControlledFieldRenderer from "../forms/ControlledFieldRenderer";
import { FieldGroup } from "../layout/SectionDivider";
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
  legend,
  error = false,
  errorMessage,
}: CoverageCategorySelectorProps) {
  const definition = requirementCoverageControl("coverage-categories");
  return (
    <FieldGroup className="FieldGroup-root">
    <ControlledFieldRenderer
      field={{
        ...definition,
        label: legend ?? definition.label,
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
    </FieldGroup>
  );
}

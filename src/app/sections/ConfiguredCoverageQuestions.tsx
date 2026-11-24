import { hasProspectiveDependents } from '../../utils/applicantVisibility';
import type { ComponentProps } from "react";
import CoverageQuestions from "../../components/coverage/CoverageQuestions";
import { resolveCoverageQuestionSections } from "../../config/resolvers/resolveCoverageQuestionSections";
import { resolveVisibilityCondition } from "../../config/conditions";
import { coverageFactFieldIds } from "../../config/fields/coverageFactFields";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getPrototypeLibrary } from "../../domain/prototypeLibrary";
export default function ConfiguredCoverageQuestions(props: ComponentProps<typeof CoverageQuestions>) {
  const pageSections = resolveCoverageQuestionSections({ sections: props.pageSections, selectedCategories: props.selectedCategories, coverageQuestions: props.coverageQuestions }).filter(section => resolveVisibilityCondition(section, props.watchedValues, props.allFields));
  const factIds = coverageFactFieldIds(props.categoryProducts, props.watchedValues);
  return <CoverageQuestions {...props} showSelfLabel={hasProspectiveDependents(props.watchedValues, props.categoryProducts)} pageSections={pageSections} factFields={props.allFields.filter(field => factIds.some(id => id === field.id) && !pageSections.some(section => section.fieldIds.some(id => id === field.id)))} applicantLabels={getActiveClient().applicantLabels} sectionNotes={getPrototypeLibrary()?.content.pages.coverage?.sectionNotes} />;
}

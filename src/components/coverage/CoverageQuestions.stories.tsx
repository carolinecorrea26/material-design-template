import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Button } from "@mui/material";
import CoverageQuestions from "./CoverageQuestions";
import type { CoverageCategoryId } from "../../config/coverages/types";
import { coverageCategories } from "../../config/coverageCategories";

import ComponentFixture from "../../../.storybook/fixtures/ComponentFixture";
import type { PrototypeLibrary } from "../../domain/prototypeLibrary";
import { coverageFactFieldIds } from "../../config/fields/coverageFactFields";
import { resolveCoverageQuestionSections } from "../../config/resolvers/resolveCoverageQuestionSections";
import { evaluateCondition } from "../../config/conditions/evaluateConditions";
/** The same category question, configured follow-ups and product facts as the live page. */
const meta = {
  id: "coverage-commerce-coveragequestions",
  title: "Components/Pages/Coverage/Sections/Coverage questions",
  component: CoverageQuestions,
  parameters: { standalone: true, catalog: { position: 0 }, docs: { description: { component: "Category question with its configured member/spouse follow-ups and additional product eligibility facts, using the same section as the Coverage page." } }, layout: "padded" },
} satisfies Meta<typeof CoverageQuestions>;

export default meta;

function CoverageQuestionsDemo({
  selectedCategories: initialCategories,
  hasSpouse = false,
}: {
  selectedCategories: CoverageCategoryId[];
  hasSpouse?: boolean;
}) {
  return <ComponentFixture>{fixture => <CoverageQuestionsForm initialCategories={initialCategories} hasSpouse={hasSpouse} fixture={fixture} />}</ComponentFixture>;
}

function CoverageQuestionsForm({ initialCategories, hasSpouse, fixture }: { initialCategories: CoverageCategoryId[]; hasSpouse: boolean; fixture: PrototypeLibrary }) {
  const { control, formState, trigger, watch } = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { dependents: hasSpouse ? ["spouse"] : [] }, mode: "onChange" });
  const watchedValues = watch();
  const [selectedCategories, setSelectedCategories] = useState(initialCategories);
  const visible = (target: { visibilityConditionId?: string }) => !target.visibilityConditionId || fixture.site.configuration.conditions.some(condition => condition.value.definition.id === target.visibilityConditionId && evaluateCondition(condition.value.definition, watchedValues));
  const page = fixture.site.configuration.pages.find(page => page.key === "coverage")!;
  const fields = page.fields.filter(row => row.included && visible(row.definition)).map(row => row.definition);
  const sections = resolveCoverageQuestionSections({ sections: page.sections.map(section => section.definition.value), selectedCategories, coverageQuestions: fixture.client.coverageQuestions }, fixture).filter(visible);
  const products = fixture.products.filter(product => selectedCategories.includes(product.categoryId));
  const factIds = coverageFactFieldIds(products, watchedValues);

  return (
    <Box sx={{ maxWidth: 640 }}>
      <CoverageQuestions
        control={control}
        errors={formState.errors}
        watchedValues={watchedValues ?? {}}
        allFields={fields}
        pageSections={sections}
        selectedCategories={selectedCategories}
        hasSpouse={hasSpouse}
        availableCategories={coverageCategories.filter(category => fixture.products.some(product => product.categoryId === category.id))}
        categoryProducts={products}
        factFields={fields.filter(field => factIds.includes(field.id as typeof factIds[number]) && !sections.some(section => section.fieldIds.some(id => id === field.id)))}
        applicantLabels={fixture.client.applicantLabels}
        sectionNotes={fixture.content.pages.coverage?.sectionNotes}
        onCategoryToggle={id => setSelectedCategories(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])}
      />
      <Button variant="outlined" sx={{ mt: 3 }} onClick={() => void trigger()}>Check required fields</Button>
    </Box>
  );
}

export const NoCategorySelected: StoryObj = {
  name: "Category question",
  render: () => <CoverageQuestionsDemo selectedCategories={[]} />,
  parameters: {
    docs: {
      description: {
        story:
          "The category question is shown first. Select one or more categories to reveal their follow-up questions; the standalone question controls retain their shared references.",
      },
    },
  },
};

export const LifeInsuranceSelected: StoryObj = {
  name: "Life (gender + tobacco questions)",
  render: () => <CoverageQuestionsDemo selectedCategories={["LI"]} />,
};

export const DisabilitySelected: StoryObj = {
  name: "Disability (gender + work-income questions)",
  render: () => <CoverageQuestionsDemo selectedCategories={["DI"]} />,
};

export const WithSpouse: StoryObj = {
  name: "Life + spouse (self and spouse sections)",
  render: () => <CoverageQuestionsDemo selectedCategories={["LI"]} hasSpouse />,
  parameters: {
    docs: {
      description: {
        story:
          "With hasSpouse, sections render twice under separate ApplicantSectionDivider wrappers — once for self, once for spouse — and the spouse group is only shown if it actually has visible sections of its own.",
      },
    },
  },
};

export const OfficeOverheadSelected: StoryObj = {
  name: "Office overhead (business-expense follow-ups)",
  render: () => <CoverageQuestionsDemo selectedCategories={["OO"]} />,
};
export const SupplementalHealthSelected: StoryObj = {
  name: "Supplemental health follow-ups",
  render: () => <CoverageQuestionsDemo selectedCategories={["SH"]} />,
};

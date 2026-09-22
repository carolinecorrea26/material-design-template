import { useForm, useWatch } from "react-hook-form";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import CoverageQuestions from "./CoverageQuestions";
import { getClientPageFields } from "../../config/clientFields/getClientPageFields";
import { getPageSections } from "../../config/pageSections";
import type { CoverageCategoryId } from "../../config/coverages/types";

/**
 * CoverageQuestions orchestrates the category-driven question sections
 * (tobacco, income, business expenses) shown below CoverageCategorySelector
 * on the Coverage page — the one real consumer of ConditionalGroup. Section
 * visibility is data-driven from real page-section config
 * (getPageSections("coverage")) crossed with which categories are selected,
 * not a fixed list, so this story uses the real config rather than a
 * hand-built mock to stay honest about what's actually configured today.
 */
const meta = {
  title: "Coverage & Commerce/CoverageQuestions",
  component: CoverageQuestions,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CoverageQuestions>;

export default meta;

const pageSections = getPageSections("coverage");
const allFields = getClientPageFields("coverage", {});

function CoverageQuestionsDemo({
  selectedCategories,
  hasSpouse = false,
}: {
  selectedCategories: CoverageCategoryId[];
  hasSpouse?: boolean;
}) {
  const { control, formState } = useForm({ mode: "onChange" });
  const watchedValues = useWatch({ control });

  const categoryNeedsGender = selectedCategories.some((c) => c === "LI" || c === "DI");
  const categoryNeedsSmoker = selectedCategories.some((c) => c === "LI" || c === "SH");
  const categoryNeedsDi = selectedCategories.includes("DI");
  const categoryNeedsOo = selectedCategories.includes("OO");
  const categoryNeedsHours = categoryNeedsDi || categoryNeedsOo;

  return (
    <Box sx={{ maxWidth: 640 }}>
      <CoverageQuestions
        control={control}
        errors={formState.errors}
        watchedValues={watchedValues ?? {}}
        allFields={allFields}
        pageSections={pageSections}
        selectedCategories={selectedCategories}
        categoryNeedsGender={categoryNeedsGender}
        categoryNeedsSmoker={categoryNeedsSmoker}
        categoryNeedsDi={categoryNeedsDi}
        categoryNeedsOo={categoryNeedsOo}
        categoryNeedsHours={categoryNeedsHours}
        hasSpouse={hasSpouse}
      />
    </Box>
  );
}

export const NoCategorySelected: StoryObj = {
  name: "No category selected (renders null)",
  render: () => <CoverageQuestionsDemo selectedCategories={[]} />,
  parameters: {
    docs: {
      description: {
        story:
          "Returns null outright when selectedCategories is empty — there's nothing to ask about yet. This matches the Coverage page's own layout: the divider below this component is also hidden in that state.",
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

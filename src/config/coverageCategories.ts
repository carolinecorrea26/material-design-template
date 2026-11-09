import optionLists from "../../requirements/global/option-lists.json";
import { requirementText } from "../domain/requirementContent";
import { clientCategoryIcon } from "../components/content/ClientCategoryIcon";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import AccessibleRoundedIcon from "@mui/icons-material/AccessibleRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import PersonalInjuryRoundedIcon from "@mui/icons-material/PersonalInjuryRounded";
import Diversity1RoundedIcon from "@mui/icons-material/Diversity1Rounded";

const categoryCopy = (id: string) => {
  const option = optionLists["coverage-categories"].find(option => option.value === id);
  if (!option) throw new Error(`Missing coverage category option: ${id}`);
  return { label: option.label, ...("shortLabel" in option ? { shortLabel: option.shortLabel } : {}) };
};

// Icons bind technical category IDs; applicant wording is authored with the options.
export const coverageCategories = [
  { id: "LI", ...categoryCopy("LI"), icon: clientCategoryIcon("LI", Diversity1RoundedIcon) },
  { id: "AD", ...categoryCopy("AD"), icon: clientCategoryIcon("AD", PersonalInjuryRoundedIcon) },
  { id: "DI", ...categoryCopy("DI"), icon: clientCategoryIcon("DI", AccessibleRoundedIcon) },
  { id: "OO", ...categoryCopy("OO"), icon: clientCategoryIcon("OO", BusinessRoundedIcon) },
  { id: "SH", ...categoryCopy("SH"), icon: clientCategoryIcon("SH", LocalHospitalRoundedIcon) },
] as const;

export type CoverageCategory = (typeof coverageCategories)[number];
export type CoverageCategoryId = CoverageCategory["id"];

export const defaultCategorySectionLabels: Record<CoverageCategoryId, string> =
  Object.fromEntries(coverageCategories.map((c) => [c.id, c.label])) as Record<
    CoverageCategoryId,
    string
  >;

export function getCoverageCategorySectionLabel(
  categoryId: CoverageCategoryId,
  clientOverrides?: Partial<Record<CoverageCategoryId, string>>,
): string {
  const name =
    clientOverrides?.[categoryId] ?? defaultCategorySectionLabels[categoryId];
  return requirementText("coverage.category.section-title", { name });
}

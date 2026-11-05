import { clientCategoryIcon } from "../components/content/ClientCategoryIcon";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import AccessibleRoundedIcon from "@mui/icons-material/AccessibleRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import PersonalInjuryRoundedIcon from "@mui/icons-material/PersonalInjuryRounded";
import Diversity1RoundedIcon from "@mui/icons-material/Diversity1Rounded";

export const coverageCategories = [
  { id: "LI", label: "Life", icon: clientCategoryIcon("LI", Diversity1RoundedIcon) },
  {
    id: "AD",
    label: "Accidental Death and Dismemberment",
    shortLabel: "AD&D",
    icon: clientCategoryIcon("AD", PersonalInjuryRoundedIcon),
  },
  { id: "DI", label: "Disability", icon: clientCategoryIcon("DI", AccessibleRoundedIcon) },
  {
    id: "OO",
    label: "Office Overhead",
    shortLabel: "Office",
    icon: clientCategoryIcon("OO", BusinessRoundedIcon),
  },
  {
    id: "SH",
    label: "Supplemental Health",
    shortLabel: "Supp. Health",
    icon: clientCategoryIcon("SH", LocalHospitalRoundedIcon),
  },
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
  return `Group ${name}`;
}

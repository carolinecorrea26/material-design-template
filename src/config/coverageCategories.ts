import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
// import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import AccessibleOutlinedIcon from "@mui/icons-material/AccessibleOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
// import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import PersonalInjuryOutlinedIcon from "@mui/icons-material/PersonalInjuryOutlined";
import Diversity1RoundedIcon from "@mui/icons-material/Diversity1Rounded";
// import EmergencyOutlinedIcon from "@mui/icons-material/EmergencyOutlined";

export const coverageCategories = [
  { id: "LI", label: "Life", icon: Diversity1RoundedIcon },
  {
    id: "AD",
    label: "Accidental Death and Dismemberment",
    shortLabel: "AD&D",
    icon: PersonalInjuryOutlinedIcon,
  },
  { id: "DI", label: "Disability", icon: AccessibleOutlinedIcon },
  {
    id: "OO",
    label: "Office Overhead",
    shortLabel: "Office",
    icon: BusinessOutlinedIcon,
  },
  {
    id: "SH",
    label: "Supplemental Health",
    shortLabel: "Supp. Health",
    icon: LocalHospitalOutlinedIcon,
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

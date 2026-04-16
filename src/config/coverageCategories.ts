import FavoriteIcon from "@mui/icons-material/Favorite";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import AccessibleForwardIcon from "@mui/icons-material/AccessibleForward";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";

export const coverageCategories = [
  { id: "LI", label: "Life", icon: FavoriteIcon },
  {
    id: "AD",
    label: "Accidental Death and Dismemberment",
    icon: ReportProblemOutlinedIcon,
  },
  { id: "DI", label: "Disability", icon: AccessibleForwardIcon },
  { id: "OO", label: "Office Overhead", icon: BusinessCenterOutlinedIcon },
  { id: "SH", label: "Supplemental Health", icon: LocalHospitalOutlinedIcon },
] as const;

export type CoverageCategory = (typeof coverageCategories)[number];
export type CoverageCategoryId = CoverageCategory["id"];

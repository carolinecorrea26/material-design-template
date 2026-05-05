import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
// import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import AccessibleOutlinedIcon from "@mui/icons-material/AccessibleOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
// import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import PersonalInjuryOutlinedIcon from "@mui/icons-material/PersonalInjuryOutlined";
import SupportOutlinedIcon from "@mui/icons-material/SupportOutlined";
// import EmergencyOutlinedIcon from "@mui/icons-material/EmergencyOutlined";

export const coverageCategories = [
  { id: "LI", label: "Life", icon: SupportOutlinedIcon },
  {
    id: "AD",
    label: "Accidental Death and Dismemberment",
    icon: PersonalInjuryOutlinedIcon,
  },
  { id: "DI", label: "Disability", icon: AccessibleOutlinedIcon },
  { id: "OO", label: "Office Overhead", icon: BusinessOutlinedIcon },
  { id: "SH", label: "Supplemental Health", icon: LocalHospitalOutlinedIcon },
] as const;

export type CoverageCategory = (typeof coverageCategories)[number];
export type CoverageCategoryId = CoverageCategory["id"];

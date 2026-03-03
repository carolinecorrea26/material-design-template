import {
  VolunteerActivismRounded as LifeIcon,
  WarningRounded as AccidentIcon,
  Accessible as DisabilityIcon,
  Business as OfficeIcon,
  LocalHospitalRounded as HealthIcon,
} from "@mui/icons-material";
import type { CoverageCategory } from "../types/app";

/**
 * Get the appropriate icon component for a coverage category
 */
function getCoverageIcon(category: CoverageCategory) {
  switch (category) {
    case "LI":
      return LifeIcon;
    case "AD":
      return AccidentIcon;
    case "DI":
      return DisabilityIcon;
    case "OO":
      return OfficeIcon;
    case "SH":
      return HealthIcon;
    default:
      return LifeIcon;
  }
}

/**
 * Get the label for a coverage category
 */
function getCoverageLabel(category: CoverageCategory): string {
  switch (category) {
    case "LI":
      return "Group Life Insurance";
    case "AD":
      return "Accidental Death & Dismemberment";
    case "DI":
      return "Group Disability Insurance";
    case "OO":
      return "Group Office Overhead Expense Insurance";
    case "SH":
      return "Group Supplemental Health Insurance";
    default:
      return category;
  }
}

/**
 * Coverage Icon Component
 * Renders an icon for the given coverage category
 */
interface CoverageIconProps {
  category: CoverageCategory;
  fontSize?: "small" | "medium" | "large" | "inherit";
  color?: string;
  sx?: Record<string, unknown>;
}

export default function CoverageIcon({
  category,
  fontSize = "small",
  color,
  sx,
}: CoverageIconProps) {
  const IconComponent = getCoverageIcon(category);
  return <IconComponent fontSize={fontSize} sx={{ color, ...sx }} />;
}

// Export helper functions
export { getCoverageIcon, getCoverageLabel };

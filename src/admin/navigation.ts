import type { SvgIconComponent } from "@mui/icons-material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import CorporateFareRoundedIcon from "@mui/icons-material/CorporateFareRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import ChangeCircleRoundedIcon from "@mui/icons-material/ChangeCircleRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";

export type AdminNavigationItem = { label: string; path: string; icon: SvgIconComponent };
export type AdminNavigationGroup = { label: string; items: AdminNavigationItem[] };

export const adminNavigation: AdminNavigationGroup[] = [
  { label: "HOME", items: [{ label: "Home", path: "/admin-center", icon: HomeRoundedIcon }] },
  {
    label: "PORTAL",
    items: [
      { label: "Sites", path: "/admin-center/sites", icon: CorporateFareRoundedIcon },
      { label: "Portal Library", path: "/admin-center/library", icon: LibraryBooksRoundedIcon },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Changes", path: "/admin-center/changes", icon: ChangeCircleRoundedIcon },
      { label: "Site Builder", path: "/admin-center/site-builder", icon: ConstructionRoundedIcon },
      { label: "Releases", path: "/admin-center/releases", icon: RocketLaunchRoundedIcon },
      { label: "Applications", path: "/admin-center/applications", icon: DescriptionRoundedIcon },
    ],
  },
  { label: "INSIGHTS", items: [{ label: "Analytics", path: "/admin-center/analytics", icon: InsightsRoundedIcon }] },
  { label: "SYSTEM", items: [{ label: "Administration", path: "/admin-center/administration", icon: AdminPanelSettingsRoundedIcon }] },
];

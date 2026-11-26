import { getStorybookUrl } from "../config/storybook";
import type { SvgIconComponent } from "@mui/icons-material";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import LibraryBooksRoundedIcon from "@mui/icons-material/LibraryBooksRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import ChangeCircleRoundedIcon from "@mui/icons-material/ChangeCircleRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import AccessibilityNewRoundedIcon from "@mui/icons-material/AccessibilityNewRounded";
export type AdminNavigationItem = { label: string; path: string; icon: SvgIconComponent; external?: boolean; masterAdminOnly?: boolean };
export type AdminNavigationGroup = { label: string; items: AdminNavigationItem[] };
export const adminNavigation: AdminNavigationGroup[] = [
  { label: "HOME", items: [
    { label: "Dashboard", path: "/admin-center", icon: DashboardRoundedIcon },
    { label: "Sites", path: "/admin-center/sites", icon: LanguageRoundedIcon },
    { label: "Applications", path: "/admin-center/applications", icon: DescriptionRoundedIcon },
  ] },
  { label: "ADMIN", items: [
    { label: "Account Management", path: "/admin-center/administration", icon: ManageAccountsRoundedIcon, masterAdminOnly: true },
    { label: "TPA Admin", path: "/admin-center/tpa-admin", icon: BusinessRoundedIcon },
    { label: "Customer Admin", path: "/admin-center/customer-admin", icon: GroupsRoundedIcon },
    { label: "Applicant Admin", path: "/admin-center/applicant-admin", icon: PersonSearchRoundedIcon },
    { label: "Advisor Admin", path: "/admin-center/advisor-admin", icon: SupportAgentRoundedIcon },
  ] },
  { label: "SYSTEM", items: [
    { label: "Template & Site Editor", path: "/admin-center/template-editor", icon: ConstructionRoundedIcon },
    { label: "Portal Library", path: "/admin-center/library", icon: LibraryBooksRoundedIcon },
    { label: "Tutorials", path: "/admin-center/tutorials", icon: SchoolRoundedIcon },
    { label: "Storybook", path: getStorybookUrl(), icon: AutoStoriesRoundedIcon, external: true },
    { label: "Site Builder", path: "/admin-center/site-builder", icon: ConstructionRoundedIcon },
  ] },
  { label: "OPERATIONS", items: [
    { label: "Releases", path: "/admin-center/releases", icon: RocketLaunchRoundedIcon },
    { label: "Changes", path: "/admin-center/changes", icon: ChangeCircleRoundedIcon },
    { label: "Migration schedule", path: "/admin-center/migration-schedule", icon: CalendarMonthRoundedIcon },
  ] },
  { label: "INSIGHTS", items: [
    { label: "Issue Log", path: "/admin-center/issue-log", icon: BugReportRoundedIcon },
    { label: "Accessibility", path: "/admin-center/accessibility", icon: AccessibilityNewRoundedIcon },
    { label: "Adobe Analytics", path: "/admin-center/adobe-analytics", icon: BarChartRoundedIcon },
    { label: "Contentsquare", path: "/admin-center/contentsquare", icon: TrackChangesRoundedIcon },
  ] },
];
const libraryNavigation = ['Portal Library', 'Storybook', 'Tutorials', 'Applicant Admin'];
const siteNavigation = ['Sites', 'Site Builder'];
export const visibleAdminNavigation = (database = false, admin = false, mock = false) => adminNavigation
  .map(group => ({ ...group, items: group.items
    .filter(item => libraryNavigation.includes(item.label) || (database || mock) && siteNavigation.includes(item.label) || database && (item.label === 'Applications' || admin && (item.masterAdminOnly || item.label === 'Template & Site Editor')))
    .map(item => database && item.masterAdminOnly ? { ...item, label: 'Portal users' } : item) }))
  .filter(group => group.items.length > 0);

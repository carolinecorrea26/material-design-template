import { TemplateChangeReference } from "../../docs/ProjectOverview";
import ApplicationStateLibrary from "./library/ApplicationStateLibrary";
import { Link as RouterLink, useParams, useSearchParams } from "react-router-dom";
import { Box, Stack, Tab, Tabs, useMediaQuery, Typography } from "@mui/material";
import { Workspace } from "../../components/admin/AdminPrimitives";
import SitePreview from "../../components/docs/SitePreview";
import LibrarySiteSelector, { useLibrarySelection } from "./library/LibrarySiteSelector";
import { LibraryScopeContext, type LibraryScope } from "./library/LibraryScope";
import { libraryHref } from "./library/LibraryLink";
import { LibraryCatalogProvider } from "./library/LibraryCatalogContext";
import StoredLibraryDomain from "./library/StoredLibraryDomain";
import StoredPagesLibrary from "./library/StoredPagesLibrary";
import StoredFieldsLibrary from "./library/StoredFieldsLibrary";
import { FlowsLibrary } from "./library/SiteDetailsLibraryDomains";
import ThemesBrandingLibrary from "./library/ThemesBrandingLibrary";
import ComponentsLibrary from "./library/ComponentsLibrary";
import AnalyticsLibrary from "./library/AnalyticsLibrary";
import CommunicationsLibrary from "./library/CommunicationsLibrary";
import ClientInformationLibrary from "./library/ClientInformationLibrary";
import RulesLibrary, { ruleDomains } from "./library/RulesLibrary";
import ValidationLibrary from "./library/ValidationLibrary";
import AccessibilityLibrary from "./library/AccessibilityLibrary";

export const libraryTabs = [
  { id: "client-information", label: "Client information" },
  { id: "components", label: "Components" },
  { id: "pages", label: "Pages" },
  { id: "flows", label: "Flows" },
  { id: "fields", label: "Fields" },
  { id: "rules", label: "Rules & configuration" },

  { id: "features", label: "Features" },
  { id: "content", label: "Content" },
  { id: "communications", label: "Emails" },
  { id: "themes", label: "Branding & Design" },
  { id: "accessibility", label: "Accessibility" },
  { id: "analytics", label: "Analytics" },
];
const domainDescriptions: Record<string, string> = {
  "client-information": "Client identity, logo, contacts and its TPA record from MCR.",
  components: "Reusable applicant portal components, descriptions, and Storybook examples.",
  pages: "Browse pages by application, resume, or advisor flow. Application order shows the main flow order; conditional pages may be skipped. Select a Site to inspect page availability and requirements.",
  fields: "Browse field labels, input types, placement and order within pages or shared tools, requirements and options. Field labels link to their Storybook controls.",
  validation: "Inspect field validation and effective requirements by page for the selected Site.",
  analytics: "Review the pages, fields, controls, overlays, and tools that need analytics tags, including event triggers, Site applicability, and tagging gaps.",
  accessibility: "WCAG 2.2 AA requirements and acceptance checks for prototype sites, with Siteimprove reporting in Insights.",
  coverage: "Inspect products, amounts, underwriting requirements, and coverage categories.",
  patterns: "Review reusable integration, calculation, and coverage patterns.",
  flags: "Review configured and derived flags, scopes, and decision values.",
  rules: "Inspect business rules, products and riders, portal settings, URL parameters and validations. Conditions and decision outputs belong to their related requirements.",
  flows: "Explore application journeys and their branching paths.",
  features: "Browse documented portal capabilities and impacted areas. Site-specific settings are listed in Configurations.",
  configurations: "Inspect configuration definitions and resolved settings for the selected scope.",
  "url-parameters": "Review supported URL parameters, their behavior, and recorded Site usage.",
  content: "Browse managed copy, images, links, and documents for the selected scope.",
  communications: "Inspect transactional email templates and their contact configuration.",
  themes: "Inspect branding, icons and design foundations, with interactive theme previews for the selected scope.",
  "site-preview": "Interact with the selected Site using mobile, tablet, or desktop viewports.",
};
const aliases: Record<string, string> = { templates: "configurations", emails: "communications", "pages-fields": "pages", "site-details": "pages", "site-overview": "pages", documents: "content", patterns: "rules", flags: "rules" };

export default function PortalLibrary() {
  const { domainId } = useParams();
  const desktop = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const [search] = useSearchParams();
  const [selection, setSelection] = useLibrarySelection();
  const scope: LibraryScope = selection === "all" ? "global" : "effective";
  const siteId = selection;
  const domains = scope === "effective" ? [...libraryTabs.slice(0, -1), { id: "site-preview", label: "Site Preview" }, libraryTabs.at(-1)!] : libraryTabs;
  const requested = aliases[domainId ?? ""] ?? domainId;
  const domain = domains.find(entry => entry.id === (ruleDomains.includes(requested ?? "") ? "rules" : requested)) ?? libraryTabs[0];
  return <Workspace>
    <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>Portal Library</Typography>
    <LibraryScopeContext.Provider value={scope}>
      <LibrarySiteSelector siteId={selection} onChange={setSelection} />
      <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3, minWidth: 0 }}>
      <Tabs orientation={desktop ? "vertical" : "horizontal"} value={domain.id} variant="scrollable" scrollButtons="auto" aria-label="Portal Library domains" sx={{ borderRight: { lg: 1 }, borderBottom: { xs: 1, lg: 0 }, borderColor: "divider", flexShrink: 0, width: { lg: 210 }, "& .MuiTab-root": { alignItems: { lg: "flex-start" }, textAlign: "left", maxWidth: "none", minHeight: 44 } }}>
        {domains.map((entry) => <Tab key={entry.id} value={entry.id} label={entry.label} component={RouterLink} to={libraryHref(entry.id, search)} />)}
      </Tabs>
      <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
        <Stack component="header" aria-label="Library domain heading" spacing={0.75}>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 800 }}>{domain.label}</Typography>
          <Typography variant="body2" color="text.secondary">{domainDescriptions[domain.id]}</Typography>
        </Stack>
        {domain.id === "accessibility" ? <AccessibilityLibrary siteKey={selection} /> : domain.id === "flows" ? <Stack spacing={3}><FlowsLibrary /><LibraryCatalogProvider siteKey={selection}><ApplicationStateLibrary /></LibraryCatalogProvider></Stack> : domain.id === "themes" ? <ThemesBrandingLibrary /> : domain.id === "site-preview" ? <SitePreview siteId={siteId} clientName={siteId} /> : <LibraryCatalogProvider siteKey={selection}>
          {domain.id === "pages" ? <StoredPagesLibrary siteKey={selection} /> : domain.id === "fields" ? <StoredFieldsLibrary siteKey={selection} /> : domain.id === "client-information" ? <ClientInformationLibrary siteKey={selection} /> : domain.id === "rules" ? <RulesLibrary domain={requested ?? "rules"} siteKey={selection} /> : domain.id === "components" ? <ComponentsLibrary /> : domain.id === "analytics" ? <AnalyticsLibrary siteKey={selection} /> : domain.id === "communications" ? <CommunicationsLibrary siteKey={selection} /> : domain.id === "features" ? <Stack spacing={3}><StoredLibraryDomain domain="features" siteKey={selection} /><details><summary>Template change reference</summary><TemplateChangeReference /></details></Stack> : domain.id === "validation" ? <ValidationLibrary siteKey={selection} /> : <StoredLibraryDomain domain={domain.id} siteKey={selection} />}
        </LibraryCatalogProvider>}
      </Stack>
      </Box>
    </LibraryScopeContext.Provider>
  </Workspace>;
}

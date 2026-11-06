import { Link as RouterLink, useParams, useSearchParams } from "react-router-dom";
import { Box, Stack, Tab, Tabs, useMediaQuery, Typography } from "@mui/material";
import { Workspace } from "../../components/admin/AdminPrimitives";
import SitePreview from "../../components/docs/SitePreview";
import LibrarySiteSelector, { useLibrarySelection } from "./library/LibrarySiteSelector";
import { LibraryScopeContext, type LibraryScope } from "./library/LibraryScope";
import { libraryHref } from "./library/LibraryLink";
import { LibraryCatalogProvider, useLibraryCatalog } from "./library/LibraryCatalogContext";
import { resolvePageCatalog } from "../../domain/pageCatalog";
import StoredLibraryDomain from "./library/StoredLibraryDomain";
import StoredPagesLibrary from "./library/StoredPagesLibrary";
import StoredFieldsLibrary from "./library/StoredFieldsLibrary";
import StoredFlowsLibrary from "./library/StoredFlowsLibrary";
import AnalyticsLibrary from "./library/AnalyticsLibrary";
import ContentLibrary from "./library/ContentLibrary";
import ClientInformationLibrary from "./library/ClientInformationLibrary";
import RulesLibrary from "./library/RulesLibrary";
import ConfigurationsLibrary from "./library/ConfigurationsLibrary";
import ValidationLibrary from "./library/ValidationLibrary";
import AccessibilityLibrary from "./library/AccessibilityLibrary";
import RequirementChangesLibrary from "./library/RequirementChangesLibrary";
import FormulasLibrary from "./library/FormulasLibrary";

export const libraryTabs = [
  { id: "overview", label: "Overview" },
  { id: "pages", label: "Pages" },
  { id: "fields", label: "Fields" },
  { id: "flows", label: "Flows" },
  { id: "rules", label: "Rules" },
  { id: "validation", label: "Validations" },
  { id: "configurations", label: "Configurations" },
  { id: "formulas", label: "Formulas" },
  { id: "content", label: "Content" },
  { id: "accessibility", label: "Accessibility" },
  { id: "analytics", label: "Analytics" },
  { id: "changes", label: "Requirement changes" },
];
const domainDescriptions: Record<string, string> = {
  overview: "Client, association and TPA information, with an interactive Site preview.",
  pages: "Browse pages by flow, requirement and available fields, grouped by page, modal and drawer. Select a Site to see its configured requirements, including pages set to none. Page sequence is defined by the navigation rules for each flow.",
  fields: "Browse field IDs, input labels, types, Storybook components, keyboards, options, defaults and helper text. Page and section usage is listed below the field catalog.",
  validation: "Page errors, field errors, and application recovery and processing states.",
  analytics: "Review the pages, fields, controls, overlays, and tools that need analytics tags, including event triggers, Site applicability, and tagging gaps.",
  formulas: "Pricing and calculation formulas from requirements/global/formulas. Mock formulas stand in where actual rate requirements do not exist; Library rate modifiers, billing and reference rate tables still apply.",
  changes: "Agreed requirement changes from the fresh-start migration: change ID, description and reason.",
  accessibility: "Accessibility tracking setup, prototype concerns and WCAG 2.2 AA review.",
  coverage: "Inspect products, amounts, underwriting requirements, and coverage categories.",
  patterns: "Review reusable integration, calculation, and coverage patterns.",
  flags: "Review configured and derived flags, scopes, and decision values.",
  rules: "Functional rules describing how the Site behaves, including navigation and conditional actions.",
  flows: "Review application journeys and their decisions in table format.",
  features: "Browse documented portal capabilities and impacted areas. Site-specific settings are listed in Configurations.",
  configurations: "Applicant, coverage, theme and portal settings for the selected scope.",
  "url-parameters": "Review supported URL parameters, their behavior, and recorded Site usage.",
  content: "CMS content, images, links, documents and email templates for the selected scope.",
  communications: "Inspect transactional email templates and their contact configuration.",
  themes: "Inspect branding, icons and design foundations, with interactive theme previews for the selected scope.",
};
const aliases: Record<string, string> = { components: "pages", "client-information": "overview", "site-preview": "overview", templates: "configurations", themes: "configurations", products: "configurations", coverage: "configurations", "coverage-review": "configurations", "url-parameters": "configurations", features: "configurations", emails: "content", communications: "content", documents: "content", "pages-fields": "pages", "site-details": "pages", "site-overview": "pages", patterns: "rules", flags: "rules", validations: "validation" };

function StoredSitePreview({ siteKey }: { siteKey: string }) {
  const catalog = useLibraryCatalog();
  if (siteKey === "all") return <Typography>Select a Site to open its interactive preview.</Typography>;
  const home = resolvePageCatalog(catalog.data, siteKey).find(page => page.enabled && page.definition.type === "home");
  return home ? <SitePreview siteId={siteKey} clientName={siteKey} homePath={home.definition.path} /> : <Typography>No Home page is enabled for this Site.</Typography>;
}

function LibraryOverview({ siteKey, legacyPreview }: { siteKey: string; legacyPreview: boolean }) {
  const [search, setSearch] = useSearchParams();
  const view = search.get("view") === "site-preview" || legacyPreview && !search.has("view") ? "site-preview" : "client-information";
  return <Stack spacing={3}>
    <Tabs value={view} aria-label="Overview views" onChange={(_, next: string) => setSearch({ site: siteKey, view: next })}>
      <Tab value="client-information" label="Client information" /><Tab value="site-preview" label="Site preview" />
    </Tabs>
    {view === "site-preview" ? <StoredSitePreview siteKey={siteKey} /> : <ClientInformationLibrary siteKey={siteKey} />}
  </Stack>;
}

export default function PortalLibrary() {
  const { domainId } = useParams();
  const desktop = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const [search] = useSearchParams();
  const [selection, setSelection] = useLibrarySelection();
  const scope: LibraryScope = selection === "all" ? "global" : "effective";
  const domains = libraryTabs;
  const requested = aliases[domainId ?? ""] ?? domainId;
  const domain = domains.find(entry => entry.id === requested) ?? libraryTabs[0];
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
        {domain.id === "accessibility" ? <AccessibilityLibrary siteKey={selection} /> : domain.id === "changes" ? <RequirementChangesLibrary /> : domain.id === "formulas" ? <FormulasLibrary /> : <LibraryCatalogProvider siteKey={selection}>
          {domain.id === "pages" ? <StoredPagesLibrary siteKey={selection} /> : domain.id === "fields" ? <StoredFieldsLibrary siteKey={selection} /> : domain.id === "overview" ? <LibraryOverview siteKey={selection} legacyPreview={domainId === "site-preview"} /> : domain.id === "rules" ? <RulesLibrary siteKey={selection} /> : domain.id === "configurations" ? <ConfigurationsLibrary domain={domainId} siteKey={selection} /> : domain.id === "flows" ? <StoredFlowsLibrary siteKey={selection} /> : domain.id === "analytics" ? <AnalyticsLibrary siteKey={selection} /> : domain.id === "content" ? <ContentLibrary domain={domainId} siteKey={selection} /> : domain.id === "validation" ? <ValidationLibrary siteKey={selection} /> : <StoredLibraryDomain domain={domain.id} siteKey={selection} />}
        </LibraryCatalogProvider>}
      </Stack>
      </Box>
    </LibraryScopeContext.Provider>
  </Workspace>;
}

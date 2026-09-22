import { type MouseEvent as ReactMouseEvent, useState, useMemo, useCallback } from "react";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { formFlow, coverageUnlocksPage } from "../../config/formFlow";
import { getPagePath } from "../../config/pages";
import { HEALTH_PAGE_IDS } from "../../config/progressSteps";
import type { ClientId, PageId } from "../../types";
import { themeColorLabels } from "../../config/clients/types";
import { clientGroups, getClientGroupForSiteId, type ClientGroup } from "../../config/clients/clientGroups";
import { DEFAULT_TEMPLATE } from "../../config/template/resolveTemplate";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getCoverageCategorySectionLabel } from "../../config/coverageCategories";
import type { CoverageCategoryId } from "../../config/coverageCategories";
import { useApplicationForm, STORAGE_KEY } from "../../app/ApplicationFormContext";
import { router } from "../../app/router";
import { generateFormDataUpToPage } from "../../dev/utils/generateFormData";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import { findClientIdUnlockingPage } from "../../config/client/findClientForPage";
import {
  resolveClientPages,
  resolvePageVisibility,
  resolvePageBreadcrumbLabel,
  resolveClientFields,
  resolveClientCoverage,
  resolveClientConfigurations,
  resolveClientFlows,
  summarizeClientOverrides,
  applicationPageOrder,
  type ResolvedCoverage,
} from "../../config/resolvers";
import { urlParameters } from "../../content/docs/urlParameters";
import { CLIENT_HIGHLIGHT_BG, CLIENT_HIGHLIGHT_BORDER } from "./ClientNote";
import SearchField from "./SearchField";
import ResponsiveTableContainer from "./ResponsiveTableContainer";
import ResizableHeaderCell from "./ResizableHeaderCell";
import useResizableColumns from "./useResizableColumns";
import SectionTabs from "./SectionTabs";
import ResolvedConfigurationList from "./ResolvedConfigurationList";
import RuleReferenceList from "./RuleReferenceList";
import ValidationReferenceList from "./ValidationReferenceList";
import SubsectionHeader from "./SubsectionHeader";
import TruncatedString from "./TruncatedString";
import FlowDiagram from "./flows/FlowDiagram";

// ---------------------------------------------------------------------------
// Active site (drives all "client-specific" highlighting below).
// Resolved the same way the rest of the app resolves it: ?client= URL param,
// falling back to sessionStorage, falling back to "demo".
// ---------------------------------------------------------------------------
const activeClient = getActiveClient();

// ---------------------------------------------------------------------------
// Coverage configuration model — Global → Override → Effective resolution
// lives in resolveClientCoverage; everything below is presentation
// formatting only (string joins/ranges for the table).
// ---------------------------------------------------------------------------

type ClientCoverageRow = {
  id: string;
  code: string;
  name: string;
  categoryId: CoverageCategoryId;
  underwritingType: string;
  applicants: string;
  memberRange: string;
  spouseRange: string;
  childRange: string;
  riders: string;
  waitingPeriods: string;
  maxBenefitPeriods: string;
  beneficiaryRequired: string;
  healthFlowTriggered: string;
  notes: string;
  clientDiffs: string[];
};

function formatAmountRange(min?: number, max?: number): string {
  if (min == null && max == null) return "—";
  const fmt = (n?: number) => (n != null ? `$${n.toLocaleString()}` : "?");
  return `${fmt(min)} – ${fmt(max)}`;
}

/** Beneficiary designation requirement for the active client — not tracked per-product in this prototype, so it's the same for every coverage row. */
const beneficiaryRequirement = resolvePageVisibility(
  "beneficiary",
  activeClient,
).effective.requirement;
const beneficiaryRequiredLabel =
  beneficiaryRequirement === "none"
    ? "None"
    : beneficiaryRequirement === "optional"
      ? "Optional"
      : "Required";

function formatCoverageRow(
  resolved: ResolvedCoverage,
  beneficiaryRequiredLabel: string,
): ClientCoverageRow {
  const { effective } = resolved;
  const riders = effective.riders ?? [];
  const waitingPeriods = effective.waitingPeriodOptions ?? [];
  const applicantWaitingPeriods = Object.entries(
    effective.waitingPeriodOptionsByApplicant ?? {},
  ).flatMap(([applicant, options]) =>
    (options ?? []).map((option) => `${applicant}: ${option.label}`),
  );
  const maxBenefitPeriods = effective.maxBenefitPeriodOptions ?? [];
  const applicantBenefitPeriods = Object.entries(
    effective.maxBenefitPeriodOptionsByApplicant ?? {},
  ).flatMap(([applicant, options]) =>
    (options ?? []).map((option) => `${applicant}: ${option.label}`),
  );
  return {
    id: resolved.id,
    code: effective.code,
    name: effective.name,
    categoryId: effective.categoryId,
    underwritingType: effective.underwritingType,
    applicants: effective.applicants.join(", "),
    beneficiaryRequired: beneficiaryRequiredLabel,
    healthFlowTriggered: resolved.healthPagesUnlocked.join(", ") || "—",
    memberRange: formatAmountRange(effective.minAmount, effective.maxAmount),
    spouseRange: formatAmountRange(
      effective.spouseMinAmount,
      effective.spouseMaxAmount,
    ),
    childRange: formatAmountRange(
      effective.childMinAmount,
      effective.childMaxAmount,
    ),
    riders: riders.length > 0 ? riders.map((r) => r.name).join(", ") : "—",
    waitingPeriods:
      waitingPeriods.length > 0 || applicantWaitingPeriods.length > 0
        ? [
            ...waitingPeriods.map((w) => w.label),
            ...applicantWaitingPeriods,
          ].join(", ")
        : "—",
    maxBenefitPeriods:
      maxBenefitPeriods.length > 0 || applicantBenefitPeriods.length > 0
        ? [
            ...maxBenefitPeriods.map((m) => m.label),
            ...applicantBenefitPeriods,
          ].join(", ")
        : "—",
    notes:
      [effective.coverageNote, effective.description]
        .filter((n): n is string => Boolean(n))
        .join(" — ") || "—",
    clientDiffs: resolved.clientDiffs,
  };
}

const resolvedCoverage = resolveClientCoverage(activeClient);
const enabledCoverage = resolvedCoverage.filter((c) => c.status !== "disabled");
const clientCoverageRows: ClientCoverageRow[] = enabledCoverage.map((c) =>
  formatCoverageRow(c, beneficiaryRequiredLabel),
);
const clientCoverageCategoryIds: CoverageCategoryId[] =
  activeClient.coverages.categories ??
  (Array.from(
    new Set(clientCoverageRows.map((r) => r.categoryId)),
  ) as CoverageCategoryId[]);
const excludedCoverageNames = resolvedCoverage
  .filter((c) => c.status === "disabled")
  .map((c) => `${c.global.name} (${c.id})`);

// ---------------------------------------------------------------------------
// Configuration model — resolveClientConfigurations already computes
// Global/Override/Effective/Status per setting; rows without a live
// ClientConfig accessor (liveValueAvailable: false) describe global, schema-only,
// or planned behavior with no single per-client value, so they're counted but
// not rendered as a duplicate of the global schema — see Effective
// Configuration's reference link instead.
// ---------------------------------------------------------------------------

const resolvedConfigurations = resolveClientConfigurations(activeClient);
const resolvableConfigurations = resolvedConfigurations.filter((c) => c.liveValueAvailable);
const schemaOnlyConfigurationCount =
  resolvedConfigurations.length - resolvableConfigurations.length;
// ---------------------------------------------------------------------------
// Overrides digest — derived from the same resolvers Effective Site renders
// from (see summarizeClientOverrides), never hand-maintained.
// ---------------------------------------------------------------------------

const resolvedFlows = resolveClientFlows(activeClient);
const overridesSummary = summarizeClientOverrides(activeClient);
const totalClientRuleCount = overridesSummary.reduce((sum, d) => sum + d.overriddenCount, 0);
const effectiveClientRules = overridesSummary.flatMap((domain) =>
  domain.items.map((item) => ({
    area: domain.label,
    rule: item.label,
    behavior: item.detail,
    ref: `Effective ${domain.label.toLowerCase()} configuration`,
  })),
);

// ---------------------------------------------------------------------------
// Site information
// ---------------------------------------------------------------------------

const activeClientGroup = getClientGroupForSiteId(activeClient.id);
const showsHeroImage =
  activeClient.features?.homePageVariant === "hero-image" ||
  activeClient.features?.homePageVariant === "welcome-back";
const configuredTemplate = activeClient.features?.defaultTemplate ?? DEFAULT_TEMPLATE;
const templateLabel = configuredTemplate === "single" ? "Single-page" : "Multi-step";
const usesNonDefaultTheme =
  activeClient.theme?.type === "custom" ||
  (activeClient.theme?.type === "preset" && activeClient.theme.preset !== "default");

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const categoryOrder = ["application", "resume", "advisor"];

/**
 * The Client Site Details tab — one client's site, resolved against the
 * Global Template. Moved out of the old standalone ClientSiteDetails.tsx
 * page into a tab panel; the Global→Override→Effective resolver calls
 * above (including resolveClientFlows/Effective Flows) are unchanged, only
 * relocated — presentation-only changes below (client/site picker,
 * Client Site Overview split, search + resizable columns).
 */
export default function ClientSiteDetailsPanel({
  onNavigateToGlobal,
}: {
  onNavigateToGlobal: (anchorId?: string) => void;
}) {
  const { setPageValues } = useApplicationForm();
  const [pageFilter, setPageFilter] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [coverageFilter, setCoverageFilter] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ClientGroup>(activeClientGroup);
  const [selectedSiteId, setSelectedSiteId] = useState<ClientId>(activeClient.id);

  const navigateToSite = useCallback((siteId: ClientId) => {
    if (siteId === activeClient.id) return;
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set("client", siteId);
    window.location.href = url.toString();
  }, []);

  const handleGroupChange = useCallback(
    (nextGroup: ClientGroup | null) => {
      if (!nextGroup) return;
      setSelectedGroup(nextGroup);
      const nextSite = nextGroup.sites[0];
      setSelectedSiteId(nextSite.id);
      navigateToSite(nextSite.id);
    },
    [navigateToSite],
  );

  const handleSiteChange = useCallback(
    (nextSite: ClientId | null) => {
      if (!nextSite) return;
      setSelectedSiteId(nextSite);
      navigateToSite(nextSite);
    },
    [navigateToSite],
  );

  const allPagesFlat = useMemo(
    () =>
      resolveClientPages(activeClient)
        .filter((page) => page.global.category !== "internal")
        .map((page) => ({
          id: page.id,
          title: page.global.title,
          path: page.global.path,
          category: page.global.category,
          step: page.global.step,
          breadcrumb: page.global.breadcrumb,
          included: page.effective.included,
          visibleWhen: page.effective.visibleWhen,
          clientOverridden: page.status !== "inherited",
        })),
    [],
  );

  const filteredPages = useMemo(() => {
    const lc = pageFilter.toLowerCase();
    const filtered = lc
      ? allPagesFlat.filter((p) =>
          `${p.id} ${p.title} ${p.category} ${p.path} ${p.step} ${p.breadcrumb}`
            .toLowerCase()
            .includes(lc),
        )
      : allPagesFlat;

    return [...filtered].sort((a, b) => {
      const catA = categoryOrder.indexOf(a.category);
      const catB = categoryOrder.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      // Within application pages, preserve flow order
      if (a.category === "application") {
        const ia = applicationPageOrder.indexOf(a.id);
        const ib = applicationPageOrder.indexOf(b.id);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      }
      return 0;
    });
  }, [pageFilter, allPagesFlat]);

  const totalPageCount = filteredPages.length;
  const includedEffectivePageIds = useMemo(
    () => new Set(allPagesFlat.filter((page) => page.included).map((page) => page.id)),
    [allPagesFlat],
  );
  const { widths: pagesColumnWidths, resize: resizePagesColumn } = useResizableColumns({
    category: 130,
    page: 140,
    title: 260,
    sequence: 110,
    breadcrumb: 160,
    visibleWhen: 240,
  });

  // Application form pages assume prior steps (coverage selection, etc.)
  // already ran and populated sessionStorage. Jumping to them directly from
  // this IA table would otherwise render with no questions, tabs, or
  // progress bar, so seed plausible dummy data up to that page first — the
  // same approach the Dev Tools "Jump to Page" action uses.
  const handlePageLinkClick = useCallback(
    (event: ReactMouseEvent, pageId: PageId, path: string) => {
      if (!formFlow.includes(pageId)) return;
      event.preventDefault();

      // Health pages are gated on a specific coverage underwriting type
      // (or rider) being selected. If the active client's catalog has no
      // coverage that can unlock this page, no amount of dummy data will
      // help — switch to a client that does, which requires a full reload
      // so getActiveClient()-derived config picks it up everywhere.
      if (HEALTH_PAGE_IDS.includes(pageId)) {
        const activeClientUnlocksPage = getActiveClientCoverages().some(
          (coverage) => coverageUnlocksPage(pageId, coverage),
        );

        if (!activeClientUnlocksPage) {
          const unlockingClientId = findClientIdUnlockingPage(pageId);

          if (unlockingClientId) {
            const url = new URL(path, window.location.origin);
            url.searchParams.set("client", unlockingClientId);
            url.searchParams.set("autofill", pageId);
            window.location.href = url.toString();
            return;
          }
        }
      }

      const formData = generateFormDataUpToPage(pageId);
      const current = JSON.parse(
        window.sessionStorage.getItem(STORAGE_KEY) ?? "{}",
      ) as typeof formData;
      const nextValues = { ...current, ...formData };

      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextValues));
      setPageValues(nextValues);

      void router.navigate(path);
    },
    [setPageValues],
  );

  const fieldsByPage = useMemo(
    () =>
      resolveClientFields(activeClient).map((page) => ({
        pageId: page.pageId,
        pageTitle: page.pageTitle,
        rows: page.fields.filter((f) => f.included).map((f) => f.row),
        hiddenRows: page.fields.filter((f) => !f.included).map((f) => f.row),
      })),
    [],
  );

  const filteredFieldsByPage = useMemo(() => {
    if (!fieldFilter) return fieldsByPage;
    const lc = fieldFilter.toLowerCase();
    return fieldsByPage
      .map((page) => ({
        ...page,
        rows: page.rows.filter((r) =>
          `${r.fieldId} ${r.label} ${r.inputType} ${r.sectionLabel}`
            .toLowerCase()
            .includes(lc),
        ),
      }))
      .filter((page) => page.rows.length > 0);
  }, [fieldFilter, fieldsByPage]);
  const totalFieldCount = useMemo(
    () => filteredFieldsByPage.reduce((sum, p) => sum + p.rows.length, 0),
    [filteredFieldsByPage],
  );
  const { widths: fieldsColumnWidths, resize: resizeFieldsColumn } = useResizableColumns({
    page: 100,
    section: 90,
    fieldId: 160,
    label: 220,
    type: 110,
    required: 90,
    options: 300,
    visibleWhen: 220,
    applicantScope: 130,
    validation: 220,
    client: 160,
  });

  const { widths: coverageColumnWidths, resize: resizeCoverageColumn } = useResizableColumns({
    id: 120,
    code: 100,
    name: 220,
    underwriting: 120,
    applicants: 140,
    memberRange: 130,
    spouseRange: 130,
    childRange: 130,
    riders: 200,
    beneficiaryRequired: 160,
    healthFlow: 160,
    notes: 220,
    client: 160,
  });
  const filteredCoverageRows = useMemo(() => {
    if (!coverageFilter) return clientCoverageRows;
    const lc = coverageFilter.toLowerCase();
    return clientCoverageRows.filter((r) =>
      `${r.id} ${r.code} ${r.name} ${r.notes}`.toLowerCase().includes(lc),
    );
  }, [coverageFilter]);

  const { widths: urlParamInUseWidths, resize: resizeUrlParamInUseColumn } = useResizableColumns({
    parameter: 140,
    description: 320,
    inUse: 140,
  });
  const [urlParamInUseFilter, setUrlParamInUseFilter] = useState("");
  const filteredUrlParameters = useMemo(() => {
    if (!urlParamInUseFilter) return urlParameters;
    const lc = urlParamInUseFilter.toLowerCase();
    return urlParameters.filter((p) =>
      `${p.parameter} ${p.newBehavior.join(" ")}`.toLowerCase().includes(lc),
    );
  }, [urlParamInUseFilter]);

  const prototypeUrl = useMemo(() => {
    const url = new URL(getPagePath("home"), window.location.origin);
    url.searchParams.set("client", activeClient.id);
    return url.toString();
  }, []);

  const clientUrlParametersInUse = activeClient.urlParametersInUse ?? [];

  return (
    <Stack spacing={3}>
      <Box>
        <Chip
          label={`Active client: ${activeClient.branding.name} (${activeClient.id})`}
          color="primary"
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Client Site Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 920 }}>
          This tab starts with the <strong>Client Site Overview</strong>, then documents the fully
          resolved <strong>Effective Site</strong>. Values that do not use the global default are
          highlighted{" "}
          <Box
            component="span"
            sx={{
              bgcolor: CLIENT_HIGHLIGHT_BG,
              border: "1px solid",
              borderColor: CLIENT_HIGHLIGHT_BORDER,
              borderRadius: 0.5,
              px: 0.5,
            }}
          >
            in yellow
          </Box>{" "}
          wherever they appear; inherited defaults are shown without emphasis. For template-wide
          documentation — flows, rules &amp; validation, and the
          full configuration schema — see{" "}
          <Link component="button" underline="hover" onClick={() => onNavigateToGlobal()}>
            Global Site Details
          </Link>
          .
        </Typography>
      </Box>

      <Card
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "24px",
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
        }}
      >
        <CardContent>
          <Box>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
              Select a client
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Choose which client — and, for clients with more than one active site, which
              site — to view. The page updates as soon as you pick one.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
            <Autocomplete
              options={clientGroups}
              value={selectedGroup}
              onChange={(_, value) => handleGroupChange(value)}
              disableClearable
              getOptionLabel={(option) => `${option.branding.acronym} - ${option.branding.name}`}
              getOptionKey={(option) => option.groupId}
              isOptionEqualToValue={(option, value) => option.groupId === value.groupId}
              sx={{ flex: 1, maxWidth: 420 }}
              renderInput={(params) => (
                <TextField {...params} label="Client" placeholder="Search clients…" />
              )}
            />
            <Autocomplete
              options={selectedGroup.sites}
              value={selectedGroup.sites.find((s) => s.id === selectedSiteId) ?? selectedGroup.sites[0]}
              onChange={(_, value) => handleSiteChange(value?.id ?? null)}
              disableClearable
              disabled={selectedGroup.sites.length <= 1}
              getOptionLabel={(option) => option.siteLabel ?? "Default"}
              getOptionKey={(option) => option.id}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              sx={{ flex: 1, maxWidth: 320 }}
              renderInput={(params) => <TextField {...params} label="Site" />}
            />
          </Stack>
        </CardContent>
      </Card>

          {/* CLIENT SITE OVERVIEW */}
          <Box id="overview-section">
            <Typography variant="h5" component="h2" sx={{ fontWeight: 800, mb: 0.5 }}>
              Client Site Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Client identity, branding and support, followed by this site's URLs, theme and
              configured template.
            </Typography>
            <SectionTabs
              tabs={[
                { id: "client-information-subsection", label: "Client Information" },
                { id: "site-information-subsection", label: "Site Information" },
              ]}
            >
              {/* CLIENT INFORMATION */}
              <Box id="client-information-subsection">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Identity, contact, and branding for the active client.
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
                  <Box sx={{ flexShrink: 0 }}>
                    {logoError ? (
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {activeClient.branding.name}
                      </Typography>
                    ) : (
                      <Box
                        component="img"
                        src={activeClient.branding.logo}
                        alt={activeClient.branding.logoAlt}
                        onError={() => setLogoError(true)}
                        sx={{ height: 48, width: "auto", maxWidth: 220, objectFit: "contain" }}
                      />
                    )}
                  </Box>
                  <Table size="small" sx={{ maxWidth: 640 }}>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: 180 }}>Name</TableCell>
                        <TableCell>{activeClient.branding.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Acronym</TableCell>
                        <TableCell>{activeClient.branding.acronym}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Support phone</TableCell>
                        <TableCell>
                          {activeClient.support.phoneDisplay ?? activeClient.support.phone ?? "—"}
                          {activeClient.support.phoneHours ? ` (${activeClient.support.phoneHours})` : ""}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Support email</TableCell>
                        <TableCell>{activeClient.support.email ?? "—"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Website</TableCell>
                        <TableCell>{activeClient.support.website ?? "—"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Address</TableCell>
                        <TableCell>
                          {activeClient.support.address
                            ? [
                                activeClient.support.address.street,
                                activeClient.support.address.city,
                                activeClient.support.address.state,
                                activeClient.support.address.zip,
                              ]
                                .filter(Boolean)
                                .join(", ")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Stack>
              </Box>

              {/* SITE INFORMATION */}
              <Box id="site-information-subsection">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This site's own identity — hero image, environment links, color theme, and which template it's configured to use.
                </Typography>
                <Table size="small" sx={{ maxWidth: 640 }}>
                  <TableBody>
                    <TableRow sx={showsHeroImage ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}>
                      <TableCell sx={{ fontWeight: 700, width: 180, verticalAlign: "top" }}>
                        Hero image
                      </TableCell>
                      <TableCell>
                        {showsHeroImage ? (
                          <Box
                            component="img"
                            src={`/client/${activeClient.id}/hero.png`}
                            alt={`${activeClient.branding.name} hero`}
                            sx={{ height: 64, width: "auto", maxWidth: 240, objectFit: "cover", borderRadius: 1 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
                            Not configured (default landing variant)
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={activeClient.siteUrls?.testing ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}>
                      <TableCell sx={{ fontWeight: 700 }}>Testing</TableCell>
                      <TableCell>
                        {activeClient.siteUrls?.testing ? (
                          <Link href={activeClient.siteUrls.testing} target="_blank" rel="noopener">
                            {activeClient.siteUrls.testing}
                          </Link>
                        ) : (
                          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
                            Not yet configured
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={activeClient.siteUrls?.preProduction ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}>
                      <TableCell sx={{ fontWeight: 700 }}>Pre-production</TableCell>
                      <TableCell>
                        {activeClient.siteUrls?.preProduction ? (
                          <Link href={activeClient.siteUrls.preProduction} target="_blank" rel="noopener">
                            {activeClient.siteUrls.preProduction}
                          </Link>
                        ) : (
                          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
                            Not yet configured
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={activeClient.siteUrls?.production ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}>
                      <TableCell sx={{ fontWeight: 700 }}>Production</TableCell>
                      <TableCell>
                        {activeClient.siteUrls?.production ? (
                          <Link href={activeClient.siteUrls.production} target="_blank" rel="noopener">
                            {activeClient.siteUrls.production}
                          </Link>
                        ) : (
                          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
                            Not yet configured
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Prototype</TableCell>
                      <TableCell>
                        <Link href={prototypeUrl} target="_blank" rel="noopener" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                          {prototypeUrl} <OpenInNewRoundedIcon fontSize="inherit" />
                        </Link>
                      </TableCell>
                    </TableRow>
                    <TableRow sx={usesNonDefaultTheme ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}>
                      <TableCell sx={{ fontWeight: 700 }}>Color theme</TableCell>
                      <TableCell>
                        {activeClient.theme?.type === "custom"
                          ? `Custom (${activeClient.theme.primary})`
                          : themeColorLabels[activeClient.theme?.preset ?? "default"]}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={configuredTemplate !== DEFAULT_TEMPLATE ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}>
                      <TableCell sx={{ fontWeight: 700 }}>Template configured</TableCell>
                      <TableCell>
                        {templateLabel}
                        {activeClientGroup.sites.length > 1 && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {activeClient.siteLabel ?? "Default"} site
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </SectionTabs>
          </Box>

          {/* EFFECTIVE SITE */}
          <Box id="effective-site-section">
            <Typography variant="h5" component="h2" sx={{ fontWeight: 800, mb: 0.5 }}>
              Effective Site
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The global template resolved for this client. Non-default pages, fields, coverage,
              configuration and client rules are highlighted in yellow.
            </Typography>
            <SectionTabs
              tabs={[
                { id: "effective-pages-table", label: `Pages (${totalPageCount})` },
                { id: "effective-fields-table", label: `Fields (${totalFieldCount})` },
                { id: "effective-coverage-table", label: `Coverage (${clientCoverageRows.length})` },
                { id: "effective-flows-section", label: "Flows" },
                { id: "effective-configuration-table", label: `Configuration Options (${resolvableConfigurations.length})` },
                { id: "effective-url-parameters", label: "URL Parameters" },
                { id: "effective-client-rules", label: `Rules (${totalClientRuleCount})` },
                { id: "effective-validation", label: "Validation" },
              ]}
              defaultTabId="effective-pages-table"
            >
              {/* PAGES */}
              <Box id="effective-pages-table">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Every page in the global template: which pages exist, their sequence/breadcrumb in the application flow, and — via Visible When — whether the active client includes, makes optional, or excludes each one. Overrides are highlighted.
                </Typography>
                <Stack spacing={2}>
                  <SearchField
                    value={pageFilter}
                    onChange={setPageFilter}
                    placeholder="Filter pages…"
                  />
                  <ResponsiveTableContainer>
                    <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
                      <colgroup>
                        {Object.values(pagesColumnWidths).map((width, i) => (
                          <col key={i} style={{ width }} />
                        ))}
                      </colgroup>
                      <TableHead>
                        <TableRow>
                          <ResizableHeaderCell
                            width={pagesColumnWidths.category}
                            onResize={(w) => resizePagesColumn("category", w)}
                          >
                            Category
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={pagesColumnWidths.page}
                            onResize={(w) => resizePagesColumn("page", w)}
                          >
                            Page
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={pagesColumnWidths.title}
                            onResize={(w) => resizePagesColumn("title", w)}
                          >
                            Title
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={pagesColumnWidths.sequence}
                            onResize={(w) => resizePagesColumn("sequence", w)}
                          >
                            Sequence
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={pagesColumnWidths.breadcrumb}
                            onResize={(w) => resizePagesColumn("breadcrumb", w)}
                          >
                            Breadcrumb
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={pagesColumnWidths.visibleWhen}
                            onResize={(w) => resizePagesColumn("visibleWhen", w)}
                          >
                            Visible when ({activeClient.id})
                          </ResizableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredPages.map((page, i) => {
                          const showCategory =
                            i === 0 ||
                            filteredPages[i - 1].category !== page.category;
                          return (
                            <TableRow
                              key={page.id}
                              sx={
                                page.clientOverridden
                                  ? { bgcolor: CLIENT_HIGHLIGHT_BG }
                                  : undefined
                              }
                            >
                              <TableCell
                                sx={{
                                  verticalAlign: "top",
                                  fontWeight: 600,
                                  fontSize: "0.8125rem",
                                  color: showCategory
                                    ? "text.primary"
                                    : "transparent",
                                  borderTop:
                                    showCategory && i !== 0
                                      ? "2px solid"
                                      : undefined,
                                  borderTopColor:
                                    showCategory && i !== 0
                                      ? "divider"
                                      : undefined,
                                  whiteSpace: "normal !important",
                                  textTransform: "capitalize",
                                }}
                              >
                                {page.category}
                              </TableCell>
                              <TableCell
                                sx={{
                                  borderTop:
                                    showCategory && i !== 0
                                      ? "2px solid"
                                      : undefined,
                                  borderTopColor:
                                    showCategory && i !== 0
                                      ? "divider"
                                      : undefined,
                                  whiteSpace: "normal !important",
                                }}
                              >
                                <Link
                                  href={page.path}
                                  sx={{ fontWeight: 700 }}
                                  onClick={(event) =>
                                    handlePageLinkClick(
                                      event,
                                      page.id,
                                      page.path,
                                    )
                                  }
                                >
                                  {page.id}
                                </Link>
                              </TableCell>
                              <TableCell
                                sx={{
                                  whiteSpace: "normal !important",
                                }}
                              >
                                {page.title}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                {page.step}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                {page.breadcrumb}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                <TruncatedString value={page.visibleWhen} threshold={150} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ResponsiveTableContainer>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    See Effective Configuration below for page-related
                    configuration options, or{" "}
                    <Link component="button" underline="hover" onClick={() => onNavigateToGlobal()}>
                      Global Site Details
                    </Link>{" "}
                    for the full rules and configuration reference.
                  </Typography>
                </Stack>
              </Box>

              {/* FLOWS */}
              <Box id="effective-flows-section">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Global flow definitions resolved with this client's flow overrides. Overridden flows are highlighted and render the effective client journey; inherited flows remain identical to the Global Template.
                </Typography>
                <Stack spacing={3}>
                  {resolvedFlows.map((flow, index) => (
                    <Box
                      key={flow.id}
                      sx={
                        flow.status === "overridden"
                          ? {
                              bgcolor: CLIENT_HIGHLIGHT_BG,
                              border: "1px solid",
                              borderColor: CLIENT_HIGHLIGHT_BORDER,
                              borderRadius: 2,
                              p: 2,
                            }
                          : undefined
                      }
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {flow.effective.title}
                        </Typography>
                        {flow.status === "overridden" && (
                          <Chip label="Client override" size="small" color="warning" variant="outlined" />
                        )}
                      </Stack>
                      {flow.status === "overridden" && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          Overrides global {flow.global.title}: {flow.clientDiffs.join(", ")}.
                        </Typography>
                      )}
                      <FlowDiagram definition={flow.effective} />
                      {index < resolvedFlows.length - 1 && <Divider sx={{ mt: 3 }} />}
                    </Box>
                  ))}
                </Stack>
              </Box>

              {/* FIELDS */}
              <Box id="effective-fields-table">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Every field in the global template after this client's additions, hidden fields, required-state changes, and supported property overrides are applied. Overrides are highlighted.
                </Typography>
                <Stack spacing={2}>
                  <SearchField
                    value={fieldFilter}
                    onChange={setFieldFilter}
                    placeholder="Filter fields…"
                  />
                  <ResponsiveTableContainer>
                    <Table
                      size="small"
                      sx={{ tableLayout: "fixed", width: "max-content" }}
                    >
                      <colgroup>
                        {Object.values(fieldsColumnWidths).map((width, i) => (
                          <col key={i} style={{ width }} />
                        ))}
                      </colgroup>
                      <TableHead>
                        <TableRow>
                          <ResizableHeaderCell
                            width={fieldsColumnWidths.page}
                            onResize={(w) => resizeFieldsColumn("page", w)}
                            sx={{ position: "sticky", top: 0, zIndex: 2 }}
                          >
                            Page
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsColumnWidths.section}
                            onResize={(w) => resizeFieldsColumn("section", w)}
                            sx={{ position: "sticky", top: 0, zIndex: 2 }}
                          >
                            Section
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsColumnWidths.fieldId}
                            onResize={(w) => resizeFieldsColumn("fieldId", w)}
                            sx={{ position: "sticky", top: 0, zIndex: 2 }}
                          >
                            Field ID
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsColumnWidths.label}
                            onResize={(w) => resizeFieldsColumn("label", w)}
                            sx={{ position: "sticky", top: 0, zIndex: 2 }}
                          >
                            Label
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsColumnWidths.type}
                            onResize={(w) => resizeFieldsColumn("type", w)}
                            sx={{ position: "sticky", top: 0, zIndex: 2 }}
                          >
                            Type
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsColumnWidths.required}
                            onResize={(w) => resizeFieldsColumn("required", w)}
                            sx={{ position: "sticky", top: 0, zIndex: 2 }}
                          >
                            Required
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsColumnWidths.options}
                            onResize={(w) => resizeFieldsColumn("options", w)}
                            sx={{ position: "sticky", top: 0, zIndex: 2 }}
                          >
                            Options
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsColumnWidths.visibleWhen}
                            onResize={(w) =>
                              resizeFieldsColumn("visibleWhen", w)
                            }
                            sx={{ position: "sticky", top: 0, zIndex: 2 }}
                          >
                            Visible when
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsColumnWidths.applicantScope}
                            onResize={(w) =>
                              resizeFieldsColumn("applicantScope", w)
                            }
                            sx={{ position: "sticky", top: 0, zIndex: 2 }}
                          >
                            Applicant scope
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsColumnWidths.validation}
                            onResize={(w) => resizeFieldsColumn("validation", w)}
                            sx={{ position: "sticky", top: 0, zIndex: 2 }}
                          >
                            Validation
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsColumnWidths.client}
                            onResize={(w) => resizeFieldsColumn("client", w)}
                            sx={{ position: "sticky", top: 0, zIndex: 2 }}
                          >
                            Client override ({activeClient.id})
                          </ResizableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredFieldsByPage.map((page) =>
                          page.rows.map((row, index) => (
                            <TableRow
                              key={`${page.pageId}-${row.sectionId}-${row.fieldId}-${index}`}
                              sx={
                                row.clientNote
                                  ? { bgcolor: CLIENT_HIGHLIGHT_BG }
                                  : undefined
                              }
                            >
                              <TableCell
                                sx={{ whiteSpace: "normal !important" }}
                              >
                                {resolvePageBreadcrumbLabel(page.pageId)}
                              </TableCell>
                              <TableCell
                                sx={{ whiteSpace: "normal !important" }}
                              >
                                {row.sectionLabel}
                              </TableCell>
                              <TableCell
                                sx={{ whiteSpace: "normal !important" }}
                              >
                                {row.fieldId}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                <TruncatedString value={row.label} threshold={140} />
                              </TableCell>
                              <TableCell>{row.inputType}</TableCell>
                              <TableCell>{row.required}</TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                <TruncatedString value={row.options} threshold={140} />
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                <TruncatedString value={row.visibleWhen} threshold={140} />
                              </TableCell>
                              <TableCell
                                sx={{ whiteSpace: "normal !important" }}
                              >
                                {row.applicant}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                <TruncatedString value={row.validation ?? "—"} threshold={140} />
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                <TruncatedString value={row.clientNote ?? "—"} threshold={140} />
                              </TableCell>
                            </TableRow>
                          )),
                        )}
                      </TableBody>
                    </Table>
                  </ResponsiveTableContainer>
                  {filteredFieldsByPage.some(
                    (page) => page.hiddenRows.length > 0,
                  ) && (
                    <Stack spacing={0.5}>
                      {filteredFieldsByPage
                        .filter((page) => page.hiddenRows.length > 0)
                        .map((page) => (
                          <Typography
                            key={page.pageId}
                            variant="caption"
                            color="text.secondary"
                          >
                            Hidden for {activeClient.branding.name} (
                            {resolvePageBreadcrumbLabel(page.pageId)}
                            ):{" "}
                            {page.hiddenRows
                              .map((r) => `${r.fieldId} (${r.label})`)
                              .join(", ")}
                          </Typography>
                        ))}
                    </Stack>
                  )}
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    See Effective Configuration below for field-related
                    configuration options, or{" "}
                    <Link component="button" underline="hover" onClick={() => onNavigateToGlobal()}>
                      Global Site Details
                    </Link>{" "}
                    for the full rules and configuration reference.
                  </Typography>
                </Stack>
              </Box>

              {/* COVERAGE */}
              <Box id="effective-coverage-table">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Applicant → Coverage Category → Product → Coverage Options after this client's coverage configuration is resolved. Product, range, rider, and related overrides are highlighted.
                </Typography>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Coverage catalog (src/config/coverages) as enabled and configured for the
                    active client ({activeClient.branding.name}). Coverage properties overridden
                    for this client (ClientConfig.coverages) are highlighted in yellow.
                  </Typography>
                  {(() => {
                    const cc = activeClient.coverages;
                    const displaySettings: string[] = [];
                    if (cc.categorySectionLabels)
                      displaySettings.push(
                        `Category labels: ${Object.entries(cc.categorySectionLabels)
                          .map(([id, label]) => `${id} → "${label}"`)
                          .join(", ")}`,
                      );
                    if (cc.allCategoriesExpanded)
                      displaySettings.push(
                        "All category accordions expanded by default",
                      );
                    if (cc.additionalCoverageWarning)
                      displaySettings.push(
                        `Additional coverage warning: ${cc.additionalCoverageWarning}`,
                      );
                    if (cc.estimatedRateDisplay)
                      displaySettings.push(
                        `Estimated rate display: ${JSON.stringify(cc.estimatedRateDisplay)}`,
                      );
                    if (cc.productEstimatedCostBreakdown?.enabled)
                      displaySettings.push(
                        "Product estimated cost breakdown enabled",
                      );
                    return displaySettings.length > 0 ? (
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: CLIENT_HIGHLIGHT_BG,
                          border: "1px solid",
                          borderColor: CLIENT_HIGHLIGHT_BORDER,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
                        >
                          Client-specific category &amp; display settings
                        </Typography>
                        {displaySettings.map((line) => (
                          <Typography
                            key={line}
                            variant="caption"
                            sx={{ display: "block" }}
                          >
                            {line}
                          </Typography>
                        ))}
                      </Box>
                    ) : null;
                  })()}

                  <SearchField
                    value={coverageFilter}
                    onChange={setCoverageFilter}
                    placeholder="Filter coverage…"
                  />

                  {clientCoverageCategoryIds.map((categoryId) => {
                    const rows = filteredCoverageRows.filter(
                      (r) => r.categoryId === categoryId,
                    );
                    if (rows.length === 0) return null;
                    const label = getCoverageCategorySectionLabel(
                      categoryId,
                      activeClient.coverages.categorySectionLabels,
                    );
                    return (
                      <Box key={categoryId} sx={{ pt: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {categoryId} · {rows.length} coverages
                          </Typography>
                        </Stack>
                        <ResponsiveTableContainer>
                            <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
                              <colgroup>
                                {Object.values(coverageColumnWidths).map((width, i) => (
                                  <col key={i} style={{ width }} />
                                ))}
                              </colgroup>
                              <TableHead>
                                <TableRow>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.id}
                                    onResize={(w) => resizeCoverageColumn("id", w)}
                                  >
                                    ID
                                  </ResizableHeaderCell>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.code}
                                    onResize={(w) => resizeCoverageColumn("code", w)}
                                  >
                                    Code
                                  </ResizableHeaderCell>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.name}
                                    onResize={(w) => resizeCoverageColumn("name", w)}
                                  >
                                    Name
                                  </ResizableHeaderCell>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.underwriting}
                                    onResize={(w) => resizeCoverageColumn("underwriting", w)}
                                  >
                                    Underwriting
                                  </ResizableHeaderCell>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.applicants}
                                    onResize={(w) => resizeCoverageColumn("applicants", w)}
                                  >
                                    Applicants
                                  </ResizableHeaderCell>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.memberRange}
                                    onResize={(w) => resizeCoverageColumn("memberRange", w)}
                                  >
                                    Member range
                                  </ResizableHeaderCell>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.spouseRange}
                                    onResize={(w) => resizeCoverageColumn("spouseRange", w)}
                                  >
                                    Spouse range
                                  </ResizableHeaderCell>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.childRange}
                                    onResize={(w) => resizeCoverageColumn("childRange", w)}
                                  >
                                    Child range
                                  </ResizableHeaderCell>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.riders}
                                    onResize={(w) => resizeCoverageColumn("riders", w)}
                                  >
                                    Riders
                                  </ResizableHeaderCell>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.beneficiaryRequired}
                                    onResize={(w) => resizeCoverageColumn("beneficiaryRequired", w)}
                                  >
                                    Beneficiary required
                                  </ResizableHeaderCell>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.healthFlow}
                                    onResize={(w) => resizeCoverageColumn("healthFlow", w)}
                                  >
                                    Health flow triggered
                                  </ResizableHeaderCell>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.notes}
                                    onResize={(w) => resizeCoverageColumn("notes", w)}
                                  >
                                    Notes
                                  </ResizableHeaderCell>
                                  <ResizableHeaderCell
                                    width={coverageColumnWidths.client}
                                    onResize={(w) => resizeCoverageColumn("client", w)}
                                  >
                                    Client ({activeClient.id})
                                  </ResizableHeaderCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {rows.map((row) => (
                                  <TableRow
                                    key={row.id}
                                    sx={
                                      row.clientDiffs.length > 0
                                        ? { bgcolor: CLIENT_HIGHLIGHT_BG }
                                        : undefined
                                    }
                                  >
                                    <TableCell
                                      sx={{
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem",
                                        whiteSpace: "normal !important",
                                      }}
                                    >
                                      {row.id}
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem",
                                        whiteSpace: "normal !important",
                                      }}
                                    >
                                      {row.code}
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        whiteSpace: "normal !important",
                                      }}
                                    >
                                      {row.name}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: "normal !important" }}>{row.underwritingType}</TableCell>
                                    <TableCell sx={{ whiteSpace: "normal !important" }}>
                                      <TruncatedString value={row.applicants} threshold={120} />
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: "normal !important" }}>{row.memberRange}</TableCell>
                                    <TableCell sx={{ whiteSpace: "normal !important" }}>{row.spouseRange}</TableCell>
                                    <TableCell sx={{ whiteSpace: "normal !important" }}>{row.childRange}</TableCell>
                                    <TableCell sx={{ whiteSpace: "normal !important" }}>
                                      <TruncatedString value={row.riders} threshold={130} />
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: "normal !important" }}>
                                      {row.beneficiaryRequired}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: "normal !important" }}>
                                      <TruncatedString value={row.healthFlowTriggered} threshold={130} />
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: "normal !important" }}>
                                      <TruncatedString value={row.notes} threshold={150} />
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: "normal !important" }}>
                                      <TruncatedString
                                        value={row.clientDiffs.length > 0 ? `Overridden: ${row.clientDiffs.join(", ")}` : "—"}
                                        threshold={140}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                        </ResponsiveTableContainer>
                      </Box>
                    );
                  })}

                  {excludedCoverageNames.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Not enabled for {activeClient.branding.name}:{" "}
                      {excludedCoverageNames.join(", ")}
                    </Typography>
                  )}
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    See Effective Configuration below for coverage-related
                    configuration options, or{" "}
                    <Link component="button" underline="hover" onClick={() => onNavigateToGlobal()}>
                      Global Site Details
                    </Link>{" "}
                    for the full rules and configuration reference.
                  </Typography>
                </Stack>
              </Box>

              {/* EFFECTIVE CONFIGURATION */}
              <Box id="effective-configuration-table">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This client's effective value for every setting with live per-client resolution.
                  Values that differ from the default are highlighted.
                </Typography>
                <ResolvedConfigurationList
                  rows={resolvableConfigurations}
                />
                {schemaOnlyConfigurationCount > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {schemaOnlyConfigurationCount} additional options are global, schema-only, or
                    planned and do not currently have a live per-client value — see{" "}
                    <Link component="button" underline="hover" onClick={() => onNavigateToGlobal("configuration-options-subsection")}>
                      Global Site Details → Configuration Options
                    </Link>
                    .
                  </Typography>
                )}
              </Box>

              <Box id="effective-url-parameters">
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        URL Parameters
                      </Typography>
                      <Chip label={urlParameters.length} size="small" />
                      {clientUrlParametersInUse.length > 0 && (
                        <Chip
                          label={`${clientUrlParametersInUse.length} in use`}
                          size="small"
                          sx={{
                            bgcolor: CLIENT_HIGHLIGHT_BG,
                            borderColor: CLIENT_HIGHLIGHT_BORDER,
                            color: "#5c4a00",
                            border: "1px solid",
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      Which template URL parameters this client actually uses in live URLs. Tracked
                      per client — every client starts at none configured until confirmed usage is
                      added.
                    </Typography>
                    <Stack spacing={2}>
                      <SearchField
                        value={urlParamInUseFilter}
                        onChange={setUrlParamInUseFilter}
                        placeholder="Filter parameters…"
                      />
                      <ResponsiveTableContainer>
                        <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
                          <colgroup>
                            {Object.values(urlParamInUseWidths).map((width, i) => (
                              <col key={i} style={{ width }} />
                            ))}
                          </colgroup>
                          <TableHead>
                            <TableRow>
                              <ResizableHeaderCell
                                width={urlParamInUseWidths.parameter}
                                onResize={(w) => resizeUrlParamInUseColumn("parameter", w)}
                              >
                                Parameter
                              </ResizableHeaderCell>
                              <ResizableHeaderCell
                                width={urlParamInUseWidths.description}
                                onResize={(w) => resizeUrlParamInUseColumn("description", w)}
                              >
                                Description
                              </ResizableHeaderCell>
                              <ResizableHeaderCell
                                width={urlParamInUseWidths.inUse}
                                onResize={(w) => resizeUrlParamInUseColumn("inUse", w)}
                              >
                                In use ({activeClient.id})
                              </ResizableHeaderCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredUrlParameters.map((param) => {
                              const inUse = clientUrlParametersInUse.includes(param.parameter);
                              return (
                                <TableRow
                                  key={param.parameter}
                                  sx={inUse ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}
                                >
                                  <TableCell
                                    sx={{
                                      verticalAlign: "top",
                                      fontFamily: "monospace",
                                      fontWeight: 700,
                                      fontSize: "0.8125rem",
                                      whiteSpace: "normal !important",
                                    }}
                                  >
                                    {param.parameter}
                                  </TableCell>
                                  <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important" }}>
                                    <TruncatedString value={param.newBehavior.join(" ")} />
                                  </TableCell>
                                  <TableCell sx={{ verticalAlign: "top" }}>
                                    <Chip
                                      label={inUse ? "Yes" : "Not yet tracked"}
                                      size="small"
                                      color={inUse ? "primary" : "default"}
                                      variant={inUse ? "filled" : "outlined"}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </ResponsiveTableContainer>
                    </Stack>
              </Box>
              <Box id="effective-client-rules">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Client-owned rules are the effective choices that differ from global behavior.
                  Each is derived from the same page, field, coverage, flow and configuration
                  resolvers used by the other tabs.
                </Typography>
                <SubsectionHeader title="Client Rules" count={effectiveClientRules.length} />
                <RuleReferenceList rows={effectiveClientRules} flat highlightAll />
              </Box>

              <Box id="effective-validation">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Validation messages for pages included in this effective client site.
                </Typography>
                <SubsectionHeader title="Validation" />
                <ValidationReferenceList includedPageIds={includedEffectivePageIds} />
              </Box>
            </SectionTabs>
          </Box>
    </Stack>
  );
}

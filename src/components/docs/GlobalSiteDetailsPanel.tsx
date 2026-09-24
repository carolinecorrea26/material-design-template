import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  Divider,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { getPagePath, getPageTitle } from "../../config/pages";
import {
  getGlobalPages,
  getSiteDetailsPageLabel,
  getSiteDetailsPageOrder,
} from "../../config/resolvers";
import { getStorybookStoryUrl } from "../../config/storybook";
import { formFlow } from "../../config/formFlow";
import {
  getPageFieldRows,
  isClientSpecificField,
  pagesWithNoFields,
} from "../../content/docs/fieldRows";
import { coverages } from "../../config/coverages";
import { formatCoverageAmounts } from "../../utils/coverageAmounts";
import { formatProductIdentifiers } from "../../utils/coverageIdentifiers";
import { coverageCategories, getCoverageCategorySectionLabel } from "../../config/coverageCategories";
import SectionTabs from "./SectionTabs";
import TruncatedString from "./TruncatedString";
import SubsectionHeader from "./SubsectionHeader";
import ResponsiveTableContainer from "./ResponsiveTableContainer";
import ResizableHeaderCell from "./ResizableHeaderCell";
import SearchField from "./SearchField";
import PageFilterSelect, { ALL_PAGES } from "./PageFilterSelect";
import useResizableColumns from "./useResizableColumns";
import ConfigReferenceList from "./ConfigReferenceList";
import RuleReferenceList from "./RuleReferenceList";
import ValidationReferenceList from "./ValidationReferenceList";
import FlowDiagram from "./flows/FlowDiagram";
import {
  consumerFlow,
  advisorFlow,
  resumeFlow,
  autosaveFlow,
  quoteFlow,
  tpaVerificationFlow,
  healthRoutingRows,
} from "../../content/docs/flows";
import { siteRules } from "../../content/docs/siteRules";
import {
  configurationsData,
} from "../../content/docs/configurations";
import {
  urlParameters,
  urlParametersAdditional,
  urlParameterSourceSummary,
  urlParamStatusColor,
  type UrlParamStatus,
} from "../../content/docs/urlParameters";
// ---------------------------------------------------------------------------
// Application → Pages: the global (client-independent) page registry.
// ---------------------------------------------------------------------------

const siteDetailsPageOrder = getSiteDetailsPageOrder();
const globalPages = getGlobalPages()
  .filter((page) => page.category !== "internal")
  .sort((a, b) => siteDetailsPageOrder.indexOf(a.id) - siteDetailsPageOrder.indexOf(b.id));

// ---------------------------------------------------------------------------
// Application → Fields: the global field catalog per page — pre-diff input
// to resolveClientFields (src/config/resolvers), so this can never drift
// from what Client Site Details' per-client Fields table starts from.
// ---------------------------------------------------------------------------

const globalFieldsByPage = formFlow
  .filter((pageId) => !pagesWithNoFields.has(pageId))
  .map((pageId) => ({
    pageId,
    pageTitle: getPageTitle(pageId),
    rows: getPageFieldRows(pageId)
      .filter((row) => !isClientSpecificField(row.fieldId))
      .map((row) =>
        row.fieldId === "membership"
          ? {
              ...row,
              label: "Are you a member of {client name}?",
              inputType: "radio",
              options: "Yes, No",
              visibleWhen: "Always visible",
            }
          : row,
      ),
  }))
  .filter((page) => page.rows.length > 0);

const totalGlobalFieldCount = globalFieldsByPage.reduce((sum, p) => sum + p.rows.length, 0);

// ---------------------------------------------------------------------------
// Application → Coverage: the raw coverage catalog — no per-client
// enabled/disabled framing, no overrides.
// ---------------------------------------------------------------------------

/**
 * The Global Site Details tab — the client-independent template model
 * (Application structure, Configuration, Behavior). Site Features / Capabilities
 * now live on their own Portal Admin page. Moved out of the old standalone SiteDetails.tsx page into a tab panel; no
 * resolver/content logic changed, only presentation (search + resizable
 * columns added to every listing table; section headers standardized via
 * SubsectionHeader).
 */
export default function GlobalSiteDetailsPanel({
  onNavigateToClientTab,
}: {
  onNavigateToClientTab: () => void;
}) {
  // Pages table — search + resizable columns
  const [pageSearch, setPageSearch] = useState("");
  const [selectedPage, setSelectedPage] = useState(ALL_PAGES);
  const { widths: pagesWidths, resize: resizePagesColumn } = useResizableColumns({
    category: 130,
    page: 140,
    title: 260,
    sequence: 110,
    breadcrumb: 160,
  });
  const filteredGlobalPages = useMemo(() => {
    const lc = pageSearch.toLowerCase();
    return globalPages.filter(
      (page) =>
        (selectedPage === ALL_PAGES || page.id === selectedPage) &&
        (!lc ||
          `${page.id} ${page.title} ${page.category} ${page.step} ${page.breadcrumb}`
            .toLowerCase()
            .includes(lc)),
    );
  }, [pageSearch, selectedPage]);
  const pageOptions = useMemo(
    () => globalPages.map((page) => ({ value: page.id, label: getSiteDetailsPageLabel(page.id) })),
    [],
  );

  // Fields table — search + resizable columns
  const [fieldFilter, setFieldFilter] = useState("");
  const [fieldPageFilter, setFieldPageFilter] = useState(ALL_PAGES);
  const { widths: fieldsWidths, resize: resizeFieldsColumn } = useResizableColumns({
    page: 140,
    fieldId: 160,
    label: 220,
    type: 110,
    required: 90,
    options: 260,
    component: 190,
  });
  const filteredGlobalFieldsByPage = useMemo(() => {
    const lc = fieldFilter.toLowerCase();
    return globalFieldsByPage
      .filter((page) => fieldPageFilter === ALL_PAGES || page.pageId === fieldPageFilter)
      .map((page) => ({
        ...page,
        rows: page.rows.filter((r) =>
          !lc ||
          `${r.fieldId} ${r.label} ${r.inputType} ${r.sectionLabel}`.toLowerCase().includes(lc),
        ),
      }))
      .filter((page) => page.rows.length > 0);
  }, [fieldFilter, fieldPageFilter]);
  const fieldPageOptions = useMemo(
    () =>
      globalFieldsByPage.map((page) => ({
        value: page.pageId,
        label: getSiteDetailsPageLabel(page.pageId),
      })),
    [],
  );
  const filteredGlobalFieldCount = useMemo(
    () => filteredGlobalFieldsByPage.reduce((sum, p) => sum + p.rows.length, 0),
    [filteredGlobalFieldsByPage],
  );

  // Coverage tables (per category) — search + resizable columns, shared widths
  const [coverageFilter, setCoverageFilter] = useState("");
  const { widths: coverageWidths, resize: resizeCoverageColumn } = useResizableColumns({
    id: 140,
    code: 100,
    name: 220,
    gNumber: 150,
    planCode: 120,
    situs: 100,
    underwriting: 120,
    applicants: 140,
    amounts: 300,
    riders: 200,
    definition: 220,
  });
  const filteredCoverages = useMemo(() => {
    if (!coverageFilter) return coverages;
    const lc = coverageFilter.toLowerCase();
    return coverages.filter((c) =>
      `${c.id} ${c.code} ${c.name} ${c.definition}`.toLowerCase().includes(lc),
    );
  }, [coverageFilter]);

  // URL Parameters tables — search + resizable columns
  const [urlParamFilter, setUrlParamFilter] = useState("");
  const { widths: urlParamWidths, resize: resizeUrlParamColumn } = useResizableColumns({
    parameter: 140,
    status: 100,
    currentTemplate: 280,
    newTemplate: 300,
    notes: 220,
  });
  const filteredUrlParameters = useMemo(() => {
    if (!urlParamFilter) return urlParameters;
    const lc = urlParamFilter.toLowerCase();
    return urlParameters.filter((row) =>
      `${row.parameter} ${row.status} ${row.notes}`.toLowerCase().includes(lc),
    );
  }, [urlParamFilter]);

  const [urlParamAdditionalFilter, setUrlParamAdditionalFilter] = useState("");
  const { widths: urlParamAdditionalWidths, resize: resizeUrlParamAdditionalColumn } =
    useResizableColumns({
      parameter: 120,
      status: 160,
      newValues: 300,
      notes: 200,
      sourceRef: 200,
    });
  const filteredUrlParametersAdditional = useMemo(() => {
    if (!urlParamAdditionalFilter) return urlParametersAdditional;
    const lc = urlParamAdditionalFilter.toLowerCase();
    return urlParametersAdditional.filter((row) =>
      `${row.parameter} ${row.status} ${row.notes}`.toLowerCase().includes(lc),
    );
  }, [urlParamAdditionalFilter]);

  const [urlParamSummaryFilter, setUrlParamSummaryFilter] = useState("");
  const { widths: urlParamSummaryWidths, resize: resizeUrlParamSummaryColumn } =
    useResizableColumns({
      parameter: 120,
      classification: 260,
      productionStatus: 260,
    });
  const filteredUrlParameterSourceSummary = useMemo(() => {
    if (!urlParamSummaryFilter) return urlParameterSourceSummary;
    const lc = urlParamSummaryFilter.toLowerCase();
    return urlParameterSourceSummary.filter((row) =>
      `${row.parameter} ${row.classification} ${row.productionStatus}`.toLowerCase().includes(lc),
    );
  }, [urlParamSummaryFilter]);

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Global Site Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, maxWidth: 920 }}>
          The <strong>global template model</strong> — not scoped to any one client — documents
          application logic, every customer- and advisor-facing page, the abstract field model,
          the coverage catalog, supported configuration and defaults, and globally owned rules.
          For per-client configuration, see{" "}
          <Link component="button" underline="hover" onClick={onNavigateToClientTab}>
            Client Site Details
          </Link>
          . For Storybook and client theme previews, see{" "}
          <Link href={getPagePath("design-system")}>Design System</Link>.
        </Typography>
      </Box>

      <SectionTabs
        tabs={[
          { id: "pages-subsection", label: `Pages (${globalPages.length})` },
          { id: "fields-subsection", label: `Fields (${totalGlobalFieldCount})` },
          { id: "coverage-subsection", label: `Coverage (${coverages.length})` },
          { id: "flows-subsection", label: "Flows" },
          {
            id: "configuration-options-subsection",
            label: `Configuration Options (${configurationsData.length})`,
          },
          { id: "url-parameters-subsection", label: "URL Parameters" },
          { id: "behavioral-rules-subsection", label: `Rules (${siteRules.length})` },
          { id: "validation-subsection", label: "Validation" },
        ]}
        defaultTabId="pages-subsection"
      >
              <Box id="pages-subsection">
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <SearchField
                      value={pageSearch}
                      onChange={setPageSearch}
                      placeholder="Search pages…"
                    />
                    <PageFilterSelect
                      value={selectedPage}
                      onChange={setSelectedPage}
                      options={pageOptions}
                    />
                  </Stack>
                  <ResponsiveTableContainer>
                    <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
                      <colgroup>
                        <col style={{ width: pagesWidths.category }} />
                        <col style={{ width: pagesWidths.page }} />
                        <col style={{ width: pagesWidths.title }} />
                        <col style={{ width: pagesWidths.sequence }} />
                        <col style={{ width: pagesWidths.breadcrumb }} />
                      </colgroup>
                      <TableHead>
                        <TableRow>
                          <ResizableHeaderCell
                            width={pagesWidths.category}
                            onResize={(w) => resizePagesColumn("category", w)}
                          >
                            Category
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={pagesWidths.page}
                            onResize={(w) => resizePagesColumn("page", w)}
                          >
                            Page
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={pagesWidths.title}
                            onResize={(w) => resizePagesColumn("title", w)}
                          >
                            Title
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={pagesWidths.sequence}
                            onResize={(w) => resizePagesColumn("sequence", w)}
                          >
                            Sequence
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={pagesWidths.breadcrumb}
                            onResize={(w) => resizePagesColumn("breadcrumb", w)}
                          >
                            Breadcrumb
                          </ResizableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredGlobalPages.map((page, i) => {
                          const showCategory =
                            i === 0 || filteredGlobalPages[i - 1].category !== page.category;
                          return (
                            <TableRow key={page.id} id={`page-${page.id}`}>
                              <TableCell
                                sx={{
                                  verticalAlign: "top",
                                  fontWeight: 600,
                                  fontSize: "0.8125rem",
                                  color: showCategory ? "text.primary" : "transparent",
                                  borderTop: showCategory && i !== 0 ? "2px solid" : undefined,
                                  borderTopColor: showCategory && i !== 0 ? "divider" : undefined,
                                  whiteSpace: "normal !important",
                                  textTransform: "capitalize",
                                }}
                              >
                                {page.category}
                              </TableCell>
                              <TableCell
                                sx={{
                                  borderTop: showCategory && i !== 0 ? "2px solid" : undefined,
                                  borderTopColor: showCategory && i !== 0 ? "divider" : undefined,
                                  whiteSpace: "normal !important",
                                  fontFamily: "monospace",
                                  fontSize: "0.75rem",
                                }}
                              >
                                <Link
                                  href={`${page.path}?client=demo${formFlow.includes(page.id) ? `&autofill=${page.id}` : ""}`}
                                  sx={{ fontWeight: 700 }}
                                >
                                  {page.id}
                                </Link>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                {page.title}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                {page.step}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                {page.breadcrumb}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ResponsiveTableContainer>
                </Stack>
              </Box>

              <Box id="fields-subsection">
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <SearchField
                      value={fieldFilter}
                      onChange={setFieldFilter}
                      placeholder="Search fields…"
                    />
                    <PageFilterSelect
                      value={fieldPageFilter}
                      onChange={setFieldPageFilter}
                      options={fieldPageOptions}
                    />
                  </Stack>
                  <ResponsiveTableContainer>
                    <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
                      <colgroup>
                        {Object.values(fieldsWidths).map((width, i) => (
                          <col key={i} style={{ width }} />
                        ))}
                      </colgroup>
                      <TableHead>
                        <TableRow>
                          <ResizableHeaderCell
                            width={fieldsWidths.page}
                            onResize={(w) => resizeFieldsColumn("page", w)}
                          >
                            Page
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsWidths.fieldId}
                            onResize={(w) => resizeFieldsColumn("fieldId", w)}
                          >
                            Field ID
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsWidths.label}
                            onResize={(w) => resizeFieldsColumn("label", w)}
                          >
                            Label
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsWidths.type}
                            onResize={(w) => resizeFieldsColumn("type", w)}
                          >
                            Type
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsWidths.required}
                            onResize={(w) => resizeFieldsColumn("required", w)}
                          >
                            Required
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsWidths.options}
                            onResize={(w) => resizeFieldsColumn("options", w)}
                          >
                            Options
                          </ResizableHeaderCell>
                          <ResizableHeaderCell
                            width={fieldsWidths.component}
                            onResize={(w) => resizeFieldsColumn("component", w)}
                          >
                            Component
                          </ResizableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredGlobalFieldsByPage.map((page) =>
                          page.rows.map((row, index) => (
                            <TableRow key={`${page.pageId}-${row.sectionId}-${row.fieldId}-${index}`}>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                {getSiteDetailsPageLabel(page.pageId)}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                {row.fieldId}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                <TruncatedString value={row.label} threshold={140} />
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                {row.inputType}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                {row.required}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                <TruncatedString value={row.options} threshold={140} />
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "normal !important" }}>
                                {row.storybook ? (
                                  <Link
                                    href={getStorybookStoryUrl(row.storybook.storyId)}
                                    target="_blank"
                                    rel="noopener"
                                  >
                                    {row.storybook.label}
                                  </Link>
                                ) : (
                                  row.componentLabel ?? "—"
                                )}
                              </TableCell>
                            </TableRow>
                          )),
                        )}
                      </TableBody>
                    </Table>
                  </ResponsiveTableContainer>
                  {filteredGlobalFieldCount === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No fields match “{fieldFilter}”.
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Box id="coverage-subsection">
                <Stack spacing={2}>
                  <SearchField
                    value={coverageFilter}
                    onChange={setCoverageFilter}
                    placeholder="Filter coverage…"
                  />
                  {coverageCategories.map(({ id: categoryId }) => {
                    const rows = filteredCoverages.filter((c) => c.categoryId === categoryId);
                    if (rows.length === 0) return null;
                    return (
                      <Box key={categoryId}>
                        <SubsectionHeader
                          title={getCoverageCategorySectionLabel(categoryId)}
                          variant="subtitle2"
                          count={rows.length}
                        />
                        <ResponsiveTableContainer>
                          <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
                            <colgroup>
                              {Object.values(coverageWidths).map((width, i) => (
                                <col key={i} style={{ width }} />
                              ))}
                            </colgroup>
                            <TableHead>
                              <TableRow>
                                <ResizableHeaderCell
                                  width={coverageWidths.id}
                                  onResize={(w) => resizeCoverageColumn("id", w)}
                                >
                                  ID
                                </ResizableHeaderCell>
                                <ResizableHeaderCell
                                  width={coverageWidths.code}
                                  onResize={(w) => resizeCoverageColumn("code", w)}
                                >
                                  Code
                                </ResizableHeaderCell>
                                <ResizableHeaderCell
                                  width={coverageWidths.name}
                                  onResize={(w) => resizeCoverageColumn("name", w)}
                                >
                                  Name
                                </ResizableHeaderCell>
                                <ResizableHeaderCell width={coverageWidths.gNumber} onResize={(w) => resizeCoverageColumn("gNumber", w)}>
                                  G-number
                                </ResizableHeaderCell>
                                <ResizableHeaderCell width={coverageWidths.planCode} onResize={(w) => resizeCoverageColumn("planCode", w)}>
                                  Plan Code
                                </ResizableHeaderCell>
                                <ResizableHeaderCell width={coverageWidths.situs} onResize={(w) => resizeCoverageColumn("situs", w)}>
                                  Group Policy Situs
                                </ResizableHeaderCell>
                                <ResizableHeaderCell
                                  width={coverageWidths.underwriting}
                                  onResize={(w) => resizeCoverageColumn("underwriting", w)}
                                >
                                  Underwriting
                                </ResizableHeaderCell>
                                <ResizableHeaderCell
                                  width={coverageWidths.applicants}
                                  onResize={(w) => resizeCoverageColumn("applicants", w)}
                                >
                                  Applicants
                                </ResizableHeaderCell>
                                <ResizableHeaderCell
                                  width={coverageWidths.amounts}
                                  onResize={(w) => resizeCoverageColumn("amounts", w)}
                                >
                                  Coverage Amounts
                                </ResizableHeaderCell>
                                <ResizableHeaderCell
                                  width={coverageWidths.riders}
                                  onResize={(w) => resizeCoverageColumn("riders", w)}
                                >
                                  Riders
                                </ResizableHeaderCell>
                                <ResizableHeaderCell
                                  width={coverageWidths.definition}
                                  onResize={(w) => resizeCoverageColumn("definition", w)}
                                >
                                  Definition
                                </ResizableHeaderCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {rows.map((c) => (
                                <TableRow key={c.id}>
                                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem", whiteSpace: "normal !important" }}>
                                    {c.id}
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem", whiteSpace: "normal !important" }}>
                                    {c.code}
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: "normal !important" }}>
                                    {c.name}
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: "pre-line !important" }}><TruncatedString value={formatProductIdentifiers(c.gNumber)} threshold={120} /></TableCell>
                                  <TableCell sx={{ whiteSpace: "pre-line !important" }}><TruncatedString value={formatProductIdentifiers(c.planCode)} threshold={120} /></TableCell>
                                  <TableCell sx={{ whiteSpace: "normal !important" }}>{c.groupPolicySitus ?? "—"}</TableCell>
                                  <TableCell sx={{ whiteSpace: "normal !important" }}>{c.underwritingType}</TableCell>
                                  <TableCell sx={{ whiteSpace: "normal !important" }}>
                                    <TruncatedString value={c.applicants.join(", ")} threshold={120} />
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: "pre-line !important" }}><TruncatedString value={formatCoverageAmounts(c)} threshold={220} /></TableCell>
                                  <TableCell sx={{ whiteSpace: "normal !important" }}>
                                    <TruncatedString
                                      value={
                                        c.riders && c.riders.length > 0
                                          ? c.riders.map((r) => r.name).join(", ")
                                          : "—"
                                      }
                                      threshold={130}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: "normal !important" }}>
                                    <TruncatedString value={c.definition} threshold={150} />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ResponsiveTableContainer>
                      </Box>
                    );
                  })}
                  {filteredCoverages.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No coverage matches “{coverageFilter}”.
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Box id="flows-subsection">
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      {consumerFlow.title}
                    </Typography>
                    <FlowDiagram definition={consumerFlow} />
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      {advisorFlow.title}
                    </Typography>
                    <FlowDiagram definition={advisorFlow} />
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      {resumeFlow.title}
                    </Typography>
                    <FlowDiagram definition={resumeFlow} />
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      {autosaveFlow.title}
                    </Typography>
                    <FlowDiagram definition={autosaveFlow} />
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      {quoteFlow.title}
                    </Typography>
                    <FlowDiagram definition={quoteFlow} />
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      {tpaVerificationFlow.title}
                    </Typography>
                    <FlowDiagram definition={tpaVerificationFlow} />
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      Health Routing
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Health pages are displayed conditionally based on selected products and
                      underwriting types. Multiple health pages may apply in a single application
                      flow. Pages marked ⚠️ are not yet implemented in the prototype.
                    </Typography>
                    <Stack spacing={1}>
                      {healthRoutingRows.map((item) => (
                        <Paper
                          key={item.pageLabel}
                          variant="outlined"
                          sx={{
                            px: 2,
                            py: 1.5,
                            display: "grid",
                            gridTemplateColumns: "180px 24px 1fr",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Box>
                            <Chip
                              label={item.pageLabel}
                              size="small"
                              sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                            />
                          </Box>
                          <ArrowForwardRoundedIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.condition}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.purpose}
                              {!item.implemented && " ⚠️ Not yet implemented"}
                            </Typography>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Box>

          {/* CONFIGURATION OPTIONS */}
              <Box id="configuration-options-subsection">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Site provisioning choices only. <strong>Required</strong> settings must be supplied
                  for a usable site; <strong>Optional</strong> settings may be omitted and inherit the
                  template default shown here. Editable content, global constants, and behavior
                  derived from the selected products are documented elsewhere rather than presented
                  as configuration options.
                </Typography>
                <SubsectionHeader title="Configuration Options" count={configurationsData.length} />
                <ConfigReferenceList
                  rows={configurationsData}
                  compact
                  showDefaults
                />
              </Box>


              <Box id="url-parameters-subsection">
                <SubsectionHeader title="URL Parameters" />
                <Stack spacing={3}>
                  <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5 }}>
                      Status:
                    </Typography>
                    {(Object.keys(urlParamStatusColor) as UrlParamStatus[]).map((status) => (
                      <Chip
                        key={status}
                        label={status}
                        size="small"
                        color={urlParamStatusColor[status]}
                        variant="outlined"
                      />
                    ))}
                  </Stack>

                  <Box>
                    <SubsectionHeader
                      title="Parameter Requirements"
                      variant="subtitle1"
                      count={urlParameters.length}
                    />
                    <Stack spacing={2}>
                      <SearchField
                        value={urlParamFilter}
                        onChange={setUrlParamFilter}
                        placeholder="Filter parameters…"
                      />
                      <ResponsiveTableContainer>
                        <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
                          <colgroup>
                            {Object.values(urlParamWidths).map((width, i) => (
                              <col key={i} style={{ width }} />
                            ))}
                          </colgroup>
                          <TableHead>
                            <TableRow>
                              <ResizableHeaderCell
                                width={urlParamWidths.parameter}
                                onResize={(w) => resizeUrlParamColumn("parameter", w)}
                              >
                                Parameter
                              </ResizableHeaderCell>
                              <ResizableHeaderCell
                                width={urlParamWidths.status}
                                onResize={(w) => resizeUrlParamColumn("status", w)}
                              >
                                Status
                              </ResizableHeaderCell>
                              <ResizableHeaderCell
                                width={urlParamWidths.currentTemplate}
                                onResize={(w) => resizeUrlParamColumn("currentTemplate", w)}
                              >
                                Current Template
                              </ResizableHeaderCell>
                              <ResizableHeaderCell
                                width={urlParamWidths.newTemplate}
                                onResize={(w) => resizeUrlParamColumn("newTemplate", w)}
                              >
                                New Template
                              </ResizableHeaderCell>
                              <ResizableHeaderCell
                                width={urlParamWidths.notes}
                                onResize={(w) => resizeUrlParamColumn("notes", w)}
                              >
                                Notes / Rules
                              </ResizableHeaderCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredUrlParameters.map((row) => (
                              <TableRow key={row.parameter}>
                                <TableCell sx={{ verticalAlign: "top", fontFamily: "monospace", fontWeight: 700, fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                                  {row.parameter}
                                </TableCell>
                                <TableCell sx={{ verticalAlign: "top" }}>
                                  <Chip label={row.status} size="small" color={urlParamStatusColor[row.status]} sx={{ height: 20, fontSize: "0.7rem" }} />
                                </TableCell>
                                <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                                  <TruncatedString
                                    value={`${row.currentValues.join(", ")} — ${row.currentBehavior.join(" ")}`}
                                    threshold={170}
                                  />
                                </TableCell>
                                <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                                  <TruncatedString
                                    value={`${row.newValues.join(", ")} — ${row.newBehavior.join(" ")}`}
                                    threshold={170}
                                  />
                                </TableCell>
                                <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "normal !important", color: "text.secondary" }}>
                                  <TruncatedString value={row.notes} threshold={160} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ResponsiveTableContainer>
                    </Stack>
                  </Box>

                  <Box>
                    <SubsectionHeader
                      title="Additional Parameters Identified in New Template Source"
                      variant="subtitle1"
                      count={urlParametersAdditional.length}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      These parameters were identified during review of the new-template source
                      and were not present in the current-template parameter inventory above.
                      Their inclusion documents existing prototype/source behavior; it does not by
                      itself designate prototype/development-only parameters as production
                      requirements.
                    </Typography>
                    <Stack spacing={2}>
                      <SearchField
                        value={urlParamAdditionalFilter}
                        onChange={setUrlParamAdditionalFilter}
                        placeholder="Filter parameters…"
                      />
                      <ResponsiveTableContainer>
                        <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
                          <colgroup>
                            {Object.values(urlParamAdditionalWidths).map((width, i) => (
                              <col key={i} style={{ width }} />
                            ))}
                          </colgroup>
                          <TableHead>
                            <TableRow>
                              <ResizableHeaderCell
                                width={urlParamAdditionalWidths.parameter}
                                onResize={(w) => resizeUrlParamAdditionalColumn("parameter", w)}
                              >
                                Parameter
                              </ResizableHeaderCell>
                              <ResizableHeaderCell
                                width={urlParamAdditionalWidths.status}
                                onResize={(w) => resizeUrlParamAdditionalColumn("status", w)}
                              >
                                Status
                              </ResizableHeaderCell>
                              <ResizableHeaderCell
                                width={urlParamAdditionalWidths.newValues}
                                onResize={(w) => resizeUrlParamAdditionalColumn("newValues", w)}
                              >
                                New Value(s) / Format &amp; Behavior
                              </ResizableHeaderCell>
                              <ResizableHeaderCell
                                width={urlParamAdditionalWidths.notes}
                                onResize={(w) => resizeUrlParamAdditionalColumn("notes", w)}
                              >
                                Notes / Rules
                              </ResizableHeaderCell>
                              <ResizableHeaderCell
                                width={urlParamAdditionalWidths.sourceRef}
                                onResize={(w) => resizeUrlParamAdditionalColumn("sourceRef", w)}
                              >
                                Source Reference
                              </ResizableHeaderCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredUrlParametersAdditional.map((row) => (
                              <TableRow key={row.parameter}>
                                <TableCell sx={{ verticalAlign: "top", fontFamily: "monospace", fontWeight: 700, fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                                  {row.parameter}
                                </TableCell>
                                <TableCell sx={{ verticalAlign: "top", fontSize: "0.75rem", whiteSpace: "normal !important" }}>
                                  <Chip
                                    label={row.status}
                                    size="small"
                                    color={urlParamStatusColor[row.status.split(" —")[0] as UrlParamStatus] ?? "primary"}
                                    sx={{ height: 20, fontSize: "0.7rem", mb: 0.5 }}
                                  />
                                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                    {row.currentTemplate}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                                  <TruncatedString
                                    value={`${row.newValues.join(", ")} — ${row.newBehavior.join(" ")}`}
                                    threshold={170}
                                  />
                                </TableCell>
                                <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "normal !important", color: "text.secondary" }}>
                                  <TruncatedString value={row.notes} threshold={160} />
                                </TableCell>
                                <TableCell sx={{ verticalAlign: "top" }}>
                                  <TruncatedString value={row.sourceRefs.join("; ")} threshold={150} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ResponsiveTableContainer>
                    </Stack>
                  </Box>

                  <Box>
                    <SubsectionHeader
                      title="Source Review Summary"
                      variant="subtitle1"
                      count={urlParameterSourceSummary.length}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      The new-template source currently contains the following additional query
                      parameters beyond the migrated/current-template inventory.
                    </Typography>
                    <Stack spacing={2}>
                      <SearchField
                        value={urlParamSummaryFilter}
                        onChange={setUrlParamSummaryFilter}
                        placeholder="Filter parameters…"
                      />
                      <ResponsiveTableContainer>
                        <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
                          <colgroup>
                            {Object.values(urlParamSummaryWidths).map((width, i) => (
                              <col key={i} style={{ width }} />
                            ))}
                          </colgroup>
                          <TableHead>
                            <TableRow>
                              <ResizableHeaderCell
                                width={urlParamSummaryWidths.parameter}
                                onResize={(w) => resizeUrlParamSummaryColumn("parameter", w)}
                              >
                                Parameter
                              </ResizableHeaderCell>
                              <ResizableHeaderCell
                                width={urlParamSummaryWidths.classification}
                                onResize={(w) => resizeUrlParamSummaryColumn("classification", w)}
                              >
                                Source Classification
                              </ResizableHeaderCell>
                              <ResizableHeaderCell
                                width={urlParamSummaryWidths.productionStatus}
                                onResize={(w) => resizeUrlParamSummaryColumn("productionStatus", w)}
                              >
                                Production Requirement Status
                              </ResizableHeaderCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredUrlParameterSourceSummary.map((row) => (
                              <TableRow key={row.parameter}>
                                <TableCell sx={{ verticalAlign: "top", fontFamily: "monospace", fontWeight: 700, fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                                  {row.parameter}
                                </TableCell>
                                <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                                  <TruncatedString value={row.classification} threshold={150} />
                                </TableCell>
                                <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                                  <TruncatedString value={row.productionStatus} threshold={150} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ResponsiveTableContainer>
                    </Stack>
                  </Box>
                </Stack>
              </Box>

          {/* RULES */}
              <Box id="behavioral-rules-subsection">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Rules owned by the global application template. Client-specific rules are shown
                  on the effective client site.
                </Typography>
                <SubsectionHeader title="Behavioral Rules" count={siteRules.length} />
                <RuleReferenceList rows={siteRules} flat />
              </Box>


              <Box id="validation-subsection">
                <SubsectionHeader title="Validation" />
                <ValidationReferenceList />
              </Box>
      </SectionTabs>
    </Stack>
  );
}

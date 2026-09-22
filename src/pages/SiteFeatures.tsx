import { useMemo, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ResponsiveTableContainer from "../components/docs/ResponsiveTableContainer";
import ResizableHeaderCell from "../components/docs/ResizableHeaderCell";
import SearchField from "../components/docs/SearchField";
import SectionTabs from "../components/docs/SectionTabs";
import useResizableColumns from "../components/docs/useResizableColumns";
import { capabilitiesData, type Capability } from "../content/docs/capabilities";
import { componentsData } from "../content/docs/componentInventory";
import { parkedIdeas } from "../content/docs/parkedIdeas";
import { getPagePath } from "../config/pages";
import { STORYBOOK_URL } from "../config/storybook";

type FeatureStatus = "available" | "in-progress" | "not-started";

type ConfigurationLink = {
  label: string;
  group?: string;
  href?: string;
};

type FeatureRow = {
  id: string;
  name: string;
  description: string;
  configurationOptions: ConfigurationLink[];
  relatedLinks: Capability["seeAlso"];
  storybookComponentNames: string[];
  status: FeatureStatus;
};

const storybookComponentsByCapability: Record<string, string[]> = {
  "capability-quote": [
    "QuoteCalculator",
    "RateFrequencyControl",
    "CoverageOptionsPanel",
    "CoverageCart",
  ],
  "capability-advisor": ["SendApplicationDialog"],
  "capability-resume": ["ExpiringCodeAlert", "ResendCountdownRow"],
  "capability-autosave": ["ProgressSavedSnackbar"],
  "capability-tpa": ["MemberVerification", "CoveragePortfolioDrawer"],
  "capability-health-underwriting": ["YesNoDetailList", "ProcessingStatusPage"],
  "capability-esign": ["ApplicationDocumentPreview", "ProcessingStatusPage"],
  "capability-page-helpers": ["HelpChips"],
  "capability-online-beneficiary": ["DynamicList"],
};

const storybookComponents = new Map(
  componentsData
    .filter((component) => component.hasStory)
    .map((component) => [component.name, component]),
);

function storybookHref(componentName: string): string | undefined {
  const component = storybookComponents.get(componentName);
  if (!component) return undefined;
  return `${STORYBOOK_URL.replace(/\/$/, "")}${component.storybookLink}`;
}

const configurationByCapability: Record<string, ConfigurationLink[]> = {
  "capability-quote": [
    { label: "Coverage/product availability", group: "Products & coverage options" },
    { label: "Coverage amount ranges", group: "Products & coverage options" },
    { label: "Estimated rate display", group: "Premium & estimated cost" },
  ],
  "capability-page-helpers": [
    { label: "Help panel content", group: "Page & help content" },
    { label: "Page/section helper content", group: "Page & help content" },
  ],
  "capability-online-payment": [
    { label: "Payment page mode", group: "Page inclusion & workflow" },
  ],
  "capability-online-beneficiary": [
    { label: "Beneficiary page mode", group: "Page inclusion & workflow" },
    { label: "Applicable coverage products", group: "Products & coverage options" },
  ],
  "capability-esign": [
    { label: "Signing page/workflow inclusion", group: "Page inclusion & workflow" },
  ],
  "capability-advisor": [
    { label: "Advisor flow/page inclusion", group: "Page inclusion & workflow" },
  ],
  "capability-resume": [
    { label: "Resume flow/page inclusion", group: "Page inclusion & workflow" },
    { label: "Resume contact/content", group: "Page & help content" },
  ],
  "capability-autosave": [
    { label: "Persistence infrastructure", group: "Shared infrastructure" },
  ],
  "capability-abandoned-leads": [
    { label: "Support/contact configuration", group: "Support & contact" },
    { label: "Reminder/support content", group: "Page & help content" },
  ],
  "capability-tpa": [
    { label: "Verification fields", group: "Field configuration" },
    { label: "Verification routing", group: "Page inclusion & workflow" },
  ],
  "capability-health-underwriting": [
    { label: "Product underwriting type", group: "Products & coverage options" },
    { label: "Health-page routing", group: "Page inclusion & workflow" },
  ],
  "capability-url-entry": [
    { label: "Supported URL parameters", href: "#url-parameters-subsection" },
  ],
};

const featureRows: FeatureRow[] = [
  ...capabilitiesData.map((feature) => ({
    id: feature.id,
    name: feature.name,
    description: feature.summary,
    configurationOptions: configurationByCapability[feature.id] ?? [],
    relatedLinks: feature.seeAlso,
    storybookComponentNames: storybookComponentsByCapability[feature.id] ?? [],
    status: "available" as const,
  })),
  {
    id: "future-instant-id",
    name: "InstantID",
    description:
      "Identity-verification capability intended to streamline or replace parts of eligibility and member verification once integration details are finalized.",
    configurationOptions: [],
    relatedLinks: [],
    storybookComponentNames: [],
    status: "in-progress",
  },
  ...parkedIdeas.map((idea) => ({
    id: `future-${idea.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: idea.title,
    description: idea.notes.join(" "),
    configurationOptions: [],
    relatedLinks: [],
    storybookComponentNames: [],
    status: "not-started" as const,
  })),
];

type ConfigurationFilter = "all" | "configurable" | "no-configuration";

const featureTabs: { id: string; label: string; status: FeatureStatus }[] = [
  { id: "available-features", label: "Available", status: "available" },
  { id: "in-progress-features", label: "In progress", status: "in-progress" },
  { id: "future-ideas", label: "Future ideas", status: "not-started" },
];

export default function SiteFeatures() {
  const siteDetailsPath = getPagePath("site-details");
  const [search, setSearch] = useState("");
  const [configurationFilter, setConfigurationFilter] =
    useState<ConfigurationFilter>("all");
  const { widths, resize } = useResizableColumns({
    feature: 240,
    description: 420,
    configuration: 260,
    related: 240,
    storybook: 220,
  });

  const configurationHref = (option: ConfigurationLink) => {
    if (option.href) return `${siteDetailsPath}${option.href}`;
    if (option.group) return `${siteDetailsPath}#configuration-options-subsection`;
    return `${siteDetailsPath}#configuration-options-subsection`;
  };

  const filteredRowsByStatus = useMemo(() => {
    const query = search.trim().toLowerCase();
    return Object.fromEntries(
      featureTabs.map(({ status }) => {
        const rows = featureRows.filter((feature) => {
          if (feature.status !== status) return false;
          if (configurationFilter === "configurable" && feature.configurationOptions.length === 0)
            return false;
          if (configurationFilter === "no-configuration" && feature.configurationOptions.length > 0)
            return false;
          if (!query) return true;
          return [
            feature.name,
            feature.description,
            ...feature.configurationOptions.map((option) => option.label),
            ...feature.relatedLinks.map((link) => link.label),
            ...feature.storybookComponentNames,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        });
        return [status, rows];
      }),
    ) as Record<FeatureStatus, FeatureRow[]>;
  }, [configurationFilter, search]);

  const renderTable = (status: FeatureStatus) => {
    const rows = filteredRowsByStatus[status];
    return (
      <Box id={featureTabs.find((tab) => tab.status === status)?.id} sx={{ minWidth: 0 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ flexWrap: "wrap", mb: 2 }}
        >
          <SearchField value={search} onChange={setSearch} placeholder="Search site features…" />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Configuration</InputLabel>
            <Select
              label="Configuration"
              value={configurationFilter}
              onChange={(event) =>
                setConfigurationFilter(event.target.value as ConfigurationFilter)
              }
            >
              <MenuItem value="all">All configuration states</MenuItem>
              <MenuItem value="configurable">Has configuration options</MenuItem>
              <MenuItem value="no-configuration">No configuration options</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <ResponsiveTableContainer>
          <Table
            size="small"
            aria-label={`${featureTabs.find((tab) => tab.status === status)?.label} site features`}
            sx={{ tableLayout: "fixed", width: "max-content" }}
          >
            <colgroup>
              <col style={{ width: widths.feature }} />
              <col style={{ width: widths.description }} />
              <col style={{ width: widths.configuration }} />
              <col style={{ width: widths.related }} />
              <col style={{ width: widths.storybook }} />
            </colgroup>
            <TableHead>
              <TableRow>
                <ResizableHeaderCell
                  width={widths.feature}
                  onResize={(width) => resize("feature", width)}
                >
                  Feature
                </ResizableHeaderCell>
                <ResizableHeaderCell
                  width={widths.description}
                  onResize={(width) => resize("description", width)}
                >
                  Description
                </ResizableHeaderCell>
                <ResizableHeaderCell
                  width={widths.configuration}
                  onResize={(width) => resize("configuration", width)}
                >
                  Configuration options
                </ResizableHeaderCell>
                <ResizableHeaderCell
                  width={widths.related}
                  onResize={(width) => resize("related", width)}
                >
                  Related links
                </ResizableHeaderCell>
                <ResizableHeaderCell
                  width={widths.storybook}
                  onResize={(width) => resize("storybook", width)}
                >
                  Storybook components
                </ResizableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((feature) => (
                <TableRow key={feature.id} hover>
                  <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important", overflowWrap: "anywhere" }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {feature.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important", overflowWrap: "anywhere" }}>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important", overflowWrap: "anywhere" }}>
                    {feature.configurationOptions.length > 0 ? (
                      <Stack spacing={0.5}>
                        {feature.configurationOptions.map((option) => (
                          <Link
                            key={`${feature.id}-${option.label}`}
                            component={RouterLink}
                            to={configurationHref(option)}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="body2"
                            sx={{
                              display: "inline-flex",
                              alignItems: "flex-start",
                              gap: 0.5,
                              fontWeight: 600,
                              overflowWrap: "anywhere",
                            }}
                          >
                            <span>{option.label}</span>
                            <OpenInNewRoundedIcon sx={{ fontSize: "0.9rem", mt: 0.25, flex: "0 0 auto" }} />
                          </Link>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important", overflowWrap: "anywhere" }}>
                    {feature.relatedLinks.length > 0 ? (
                      <Stack spacing={0.5}>
                        {feature.relatedLinks.map((link) => (
                          <Link
                            key={`${feature.id}-${link.href}-${link.label}`}
                            component={RouterLink}
                            to={`${siteDetailsPath}${link.href}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="body2"
                            sx={{
                              display: "inline-flex",
                              alignItems: "flex-start",
                              gap: 0.5,
                              fontWeight: 600,
                              overflowWrap: "anywhere",
                            }}
                          >
                            <span>{link.label}</span>
                            <OpenInNewRoundedIcon sx={{ fontSize: "0.9rem", mt: 0.25, flex: "0 0 auto" }} />
                          </Link>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important", overflowWrap: "anywhere" }}>
                    {feature.storybookComponentNames.length > 0 ? (
                      <Stack spacing={0.5}>
                        {feature.storybookComponentNames.map((componentName) => {
                          const href = storybookHref(componentName);
                          if (!href) return null;
                          return (
                            <Link
                              key={`${feature.id}-${componentName}`}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="body2"
                              sx={{
                                display: "inline-flex",
                                alignItems: "flex-start",
                                gap: 0.5,
                                fontWeight: 600,
                                overflowWrap: "anywhere",
                              }}
                            >
                              <span>{componentName}</span>
                              <OpenInNewRoundedIcon sx={{ fontSize: "0.9rem", mt: 0.25, flex: "0 0 auto" }} />
                            </Link>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No features match the current search and filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ResponsiveTableContainer>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Showing {rows.length} of {featureRows.filter((feature) => feature.status === status).length}
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        py: { xs: 3, md: 5 },
        px: { xs: 2, md: 4 },
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
            Site Features
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 900 }}>
            Complete feature inventory for the Portal template, including configuration entry
            points, supporting documentation, and implementation status.
          </Typography>
        </Box>

        <SectionTabs
          tabs={featureTabs.map((tab) => ({
            id: tab.id,
            label: `${tab.label} (${featureRows.filter((feature) => feature.status === tab.status).length})`,
          }))}
          defaultTabId="available-features"
        >
          {renderTable("available")}
          {renderTable("in-progress")}
          {renderTable("not-started")}
        </SectionTabs>
      </Stack>
    </Box>
  );
}

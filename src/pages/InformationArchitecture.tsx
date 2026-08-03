import type { ReactNode } from "react";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { fieldCatalog } from "../config/fields";
import { formFlow } from "../config/formFlow";
import {
  pages,
  getPageTitle,
  getPageSubhead,
  getPageNavTitle,
} from "../config/pages";
import { pageSections } from "../config/pageSections";
import type { SectionVisibilityRule } from "../config/pageSections/types";
import type { PageId } from "../types";

const tableOfContents = [
  { id: "page-flow", label: "Page flow" },
  { id: "prototype-routes", label: "Prototype routes" },
  { id: "page-fields", label: "Page fields" },
  { id: "health-routing", label: "Health routing" },
];

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value == null || value === "") return "—";
  return String(value);
}

function formatVisibleWhen(rules?: SectionVisibilityRule[]) {
  if (!rules || rules.length === 0) return "Always visible";

  return rules
    .map((rule) => {
      if ("equals" in rule) {
        return `${rule.fieldId} = ${formatValue(rule.equals)}`;
      }

      if ("notEquals" in rule) {
        return `${rule.fieldId} is not ${formatValue(rule.notEquals)}`;
      }

      if ("includes" in rule) {
        return `${rule.fieldId} includes ${formatValue(rule.includes)}`;
      }

      return "Conditional";
    })
    .join(" AND ");
}

function formatOptions(fieldId: string) {
  const field = fieldCatalog[fieldId as keyof typeof fieldCatalog];

  if (!field?.options || field.options.length === 0) return "—";

  return field.options.map((option) => option.label).join(", ");
}

function getPage(pageId: PageId) {
  return pages.find((page) => page.id === pageId);
}

function getPagePathLocal(pageId: PageId) {
  return getPage(pageId)?.path ?? "—";
}

function getPageGroup(pageId: PageId) {
  const page = getPage(pageId);

  if (!page || !("groupId" in page)) return "—";

  return page.groupId;
}

function getRoutingRule(pageId: PageId) {
  if (pageId === "beneficiary") {
    return "Shown when selected coverage includes Life Insurance or Accidental Death.";
  }

  if (pageId === "health-si") {
    return "Shown when selected coverage includes FUW or SI underwriting.";
  }

  if (pageId === "health-qd") {
    return "Shown when selected coverage includes QuickDecision underwriting.";
  }

  if (pageId === "health-di") {
    return "Shown when selected coverage includes Disability.";
  }

  if (pageId === "health-cir") {
    return "Shown when a CIR rider is selected.";
  }

  if (pageId === "receipt") {
    return "Final confirmation page.";
  }

  return "Standard flow page.";
}

function getPageFieldRows(pageId: PageId) {
  const sections = pageSections[pageId] ?? [];

  if (sections.length === 0) {
    return [
      {
        sectionId: "custom",
        sectionLabel: "Custom page content",
        applicant: "—",
        fieldId: "—",
        label: "No catalog-driven fields",
        inputType: "—",
        required: "—",
        options: "—",
        visibleWhen: "Handled directly in page/component logic",
      },
    ];
  }

  return sections.flatMap((section) => {
    if (section.fieldIds.length === 0) {
      return [
        {
          sectionId: section.id,
          sectionLabel: section.title ?? section.description ?? section.id,
          applicant: section.applicant ?? "—",
          fieldId: "—",
          label: "Dynamic/repeating content",
          inputType: "—",
          required: "—",
          options: "—",
          visibleWhen: formatVisibleWhen(section.visibleWhen),
        },
      ];
    }

    return section.fieldIds.map((fieldId) => {
      const field = fieldCatalog[fieldId];

      return {
        sectionId: section.id,
        sectionLabel: section.title ?? section.description ?? section.id,
        applicant: section.applicant ?? "—",
        fieldId,
        label: field?.label ?? fieldId,
        inputType: field?.inputType ?? "—",
        required: field?.required ? "Yes" : "No",
        options: formatOptions(fieldId),
        visibleWhen: formatVisibleWhen(section.visibleWhen),
      };
    });
  });
}

function SectionAccordion({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Accordion
      id={id}
      defaultExpanded
      disableGutters
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "24px !important",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRoundedIcon />}
        sx={{
          px: { xs: 2, md: 3 },
          py: 1,
          backgroundColor: "background.subtle",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

export default function InformationArchitecture() {
  const formPages = formFlow.map((pageId) => ({
    id: pageId,
    title: getPageTitle(pageId),
    subhead: getPageSubhead(pageId),
    path: getPagePathLocal(pageId),
    group: getPageGroup(pageId),
  }));

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box>
          <Chip
            label="Internal prototype documentation"
            color="error"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
            Sites Information Architecture
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 920 }}
          >
            A simple map of the current site prototype: page flow, page titles,
            subtitles, field inventory, conditional rules, and prototype routes.
          </Typography>
        </Box>

        <Card
          id="table-of-contents"
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "24px",
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
          }}
        >
          <CardContent>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
              Table of contents
            </Typography>
            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              spacing={1}
              sx={{ mt: 2 }}
            >
              {tableOfContents.map((item) => (
                <Chip
                  key={item.id}
                  component="a"
                  href={`#${item.id}`}
                  clickable
                  label={item.label}
                  variant="outlined"
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <SectionAccordion
          id="page-flow"
          title="Page flow"
          description="The form pages in order, including the latest titles and subtitles from the page config."
        >
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Step</TableCell>
                  <TableCell>Page</TableCell>
                  <TableCell>Subtitle</TableCell>
                  <TableCell>Path</TableCell>
                  <TableCell>Group</TableCell>
                  <TableCell>Routing / skip rule</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formPages.map((page, index) => (
                  <TableRow key={page.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {page.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {page.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{page.subhead}</TableCell>
                    <TableCell>
                      <Link href={page.path}>{page.path}</Link>
                    </TableCell>
                    <TableCell>{page.group}</TableCell>
                    <TableCell>{getRoutingRule(page.id)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </SectionAccordion>

        <SectionAccordion
          id="prototype-routes"
          title="Prototype routes"
          description="All routes registered in the prototype, including internal, receipt, resume, and advisor pages."
        >
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Page ID</TableCell>
                  <TableCell>Path</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Subtitle</TableCell>
                  <TableCell>Navigation title</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>{page.id}</TableCell>
                    <TableCell>
                      <Link href={page.path}>{page.path}</Link>
                    </TableCell>
                    <TableCell>{page.type}</TableCell>
                    <TableCell>{getPageTitle(page.id as PageId)}</TableCell>
                    <TableCell>
                      {getPageSubhead(page.id as PageId) ?? "—"}
                    </TableCell>
                    <TableCell>{getPageNavTitle(page.id as PageId)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </SectionAccordion>

        <SectionAccordion
          id="page-fields"
          title="Page fields"
          description="Each page expands to show its field sections, labels, input types, options, and visibility rules."
        >
          <Stack spacing={2}>
            {formPages.map((page) => {
              const fieldRows = getPageFieldRows(page.id);

              return (
                <Accordion
                  key={page.id}
                  defaultExpanded
                  variant="outlined"
                  disableGutters
                  sx={{
                    borderRadius: "16px !important",
                    overflow: "hidden",
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>
                        {page.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {page.id} · {fieldRows.length} field rows
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Section</TableCell>
                            <TableCell>Applicant</TableCell>
                            <TableCell>Field ID</TableCell>
                            <TableCell>Label</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Required</TableCell>
                            <TableCell>Options</TableCell>
                            <TableCell>Visible when</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {fieldRows.map((row, index) => (
                            <TableRow
                              key={`${page.id}-${row.sectionId}-${row.fieldId}-${index}`}
                            >
                              <TableCell>{row.sectionLabel}</TableCell>
                              <TableCell>{row.applicant}</TableCell>
                              <TableCell>{row.fieldId}</TableCell>
                              <TableCell>{row.label}</TableCell>
                              <TableCell>{row.inputType}</TableCell>
                              <TableCell>{row.required}</TableCell>
                              <TableCell>{row.options}</TableCell>
                              <TableCell>{row.visibleWhen}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        </SectionAccordion>

        <SectionAccordion
          id="health-routing"
          title="Health routing"
          description="Health pages are conditionally shown based on underwriting type, selected category, and selected riders."
        >
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Condition</TableCell>
                  <TableCell>Page shown</TableCell>
                  <TableCell>Purpose</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    Selected coverage has FUW or SI underwriting
                  </TableCell>
                  <TableCell>health-si</TableCell>
                  <TableCell>Standard or simplified health questions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Selected coverage has QD underwriting</TableCell>
                  <TableCell>health-qd</TableCell>
                  <TableCell>QuickDecision health questions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Selected coverage category includes DI</TableCell>
                  <TableCell>health-di</TableCell>
                  <TableCell>Disability-specific health information</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>CIR rider is selected</TableCell>
                  <TableCell>health-cir</TableCell>
                  <TableCell>
                    Critical illness rider health information
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </SectionAccordion>
      </Stack>
    </Container>
  );
}

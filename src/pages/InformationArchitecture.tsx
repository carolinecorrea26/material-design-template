import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
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
import { pages } from "../config/pages";
import {
  categoriesRequiringQuestions,
  categoryQuestionFields,
  categoryQuestionFieldsSpouse,
  formFlow,
} from "../config/formFlow";
import { fieldCatalog } from "../config/fields";
import { pageSections } from "../config/pageSections";
import type { SectionVisibilityRule } from "../config/pageSections/types";
import { getActiveClient } from "../client/getActiveClient";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import type { PageId } from "../types/page";

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

function getPageTitle(pageId: PageId) {
  return pages.find((page) => page.id === pageId)?.title ?? pageId;
}

function getPagePath(pageId: PageId) {
  return pages.find((page) => page.id === pageId)?.path ?? "—";
}

function getPageGroup(pageId: PageId) {
  const page = pages.find((item) => item.id === pageId);

  if (!page || !("groupId" in page)) return "—";

  return page.groupId;
}

function getRoutingRule(pageId: PageId) {
  if (pageId === "coverage-questions") {
    return "Always shown. Gender is always asked; additional questions depend on selected coverage categories.";
  }

  if (pageId === "beneficiary") {
    return "Shown when selected coverage includes Life Insurance or Accidental Death.";
  }

  if (pageId === "financial") {
    return "Shown when selected coverage includes Life Insurance or Disability.";
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

const fieldRows = formFlow.flatMap((pageId) => {
  const sections = pageSections[pageId] ?? [];

  if (sections.length === 0) {
    return [
      {
        pageId,
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
          pageId,
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
        pageId,
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
});

export default function InformationArchitecture() {
  const client = getActiveClient();
  const activeCoverages = getActiveClientCoverages();

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={3}>
        <Box>
          <Chip
            label="Internal prototype documentation"
            color="primary"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Information Architecture
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 900 }}
          >
            This page documents the current prototype structure for requirements
            gathering, custom GPT review, page-flow explanation, field mapping,
            and implementation alignment.
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              Prototype Summary
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Active client
                    </TableCell>
                    <TableCell>{client.branding.name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Form flow</TableCell>
                    <TableCell>{formFlow.join(" → ")}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Coverage categories requiring questions
                    </TableCell>
                    <TableCell>
                      {categoriesRequiringQuestions.join(", ")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Custom GPT usage note
                    </TableCell>
                    <TableCell>
                      Use this page as the live source for explaining the
                      prototype IA, page sequence, field inventory, conditional
                      logic, and coverage/underwriting routing.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              Page Flow
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              This table shows the main application flow and the conditions that
              may affect whether a page appears.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Step</TableCell>
                    <TableCell>Page ID</TableCell>
                    <TableCell>Path</TableCell>
                    <TableCell>Group</TableCell>
                    <TableCell>Page title</TableCell>
                    <TableCell>Routing / skip rule</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formFlow.map((pageId, index) => (
                    <TableRow key={pageId}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{pageId}</TableCell>
                      <TableCell>
                        <Link href={getPagePath(pageId)}>
                          {getPagePath(pageId)}
                        </Link>
                      </TableCell>
                      <TableCell>{getPageGroup(pageId)}</TableCell>
                      <TableCell>{getPageTitle(pageId)}</TableCell>
                      <TableCell>{getRoutingRule(pageId)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              Field Inventory by Page
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              This table is generated from the page section and field catalog
              config, so it stays aligned with the prototype structure.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Page</TableCell>
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
                      key={`${row.pageId}-${row.sectionId}-${row.fieldId}-${index}`}
                    >
                      <TableCell>{row.pageId}</TableCell>
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
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              Coverage Questions Logic
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Coverage questions are shown based on selected coverage
              categories. Gender is always asked on the coverage questions page.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Coverage category</TableCell>
                    <TableCell>Self fields</TableCell>
                    <TableCell>Spouse fields</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoriesRequiringQuestions.map((categoryId) => (
                    <TableRow key={categoryId}>
                      <TableCell>{categoryId}</TableCell>
                      <TableCell>
                        {categoryQuestionFields[categoryId]?.join(", ") ?? "—"}
                      </TableCell>
                      <TableCell>
                        {categoryQuestionFieldsSpouse[categoryId]?.join(", ") ??
                          "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              Coverage / Product Catalog
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              This table reflects the currently active client coverage catalog.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Coverage ID</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Applicants</TableCell>
                    <TableCell>Underwriting</TableCell>
                    <TableCell>Options</TableCell>
                    <TableCell>Riders</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeCoverages.map((coverage) => (
                    <TableRow key={coverage.id}>
                      <TableCell>{coverage.id}</TableCell>
                      <TableCell>{coverage.code}</TableCell>
                      <TableCell>{coverage.name}</TableCell>
                      <TableCell>{coverage.categoryId}</TableCell>
                      <TableCell>{coverage.applicants.join(", ")}</TableCell>
                      <TableCell>{coverage.underwritingType}</TableCell>
                      <TableCell>
                        {coverage.options
                          .map((option) => option.type)
                          .join(", ")}
                      </TableCell>
                      <TableCell>
                        {coverage.riders
                          ?.map((rider) => rider.name)
                          .join(", ") ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              Underwriting / Health Page Routing
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
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
                    <TableCell>
                      Standard or simplified health questions
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Selected coverage has QD underwriting</TableCell>
                    <TableCell>health-qd</TableCell>
                    <TableCell>QuickDecision health questions</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Selected coverage category includes DI
                    </TableCell>
                    <TableCell>health-di</TableCell>
                    <TableCell>
                      Disability-specific health information
                    </TableCell>
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
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
              Prototype Routes
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Page ID</TableCell>
                    <TableCell>Path</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Title</TableCell>
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
                      <TableCell>{page.title}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Divider />

        <Typography variant="body2" color="text.secondary">
          Recommended custom GPT instruction: review this page first when asked
          to explain the prototype structure, requirements, page flow, fields,
          conditional logic, or routing behavior.
        </Typography>
      </Stack>
    </Container>
  );
}

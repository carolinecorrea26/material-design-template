import { Box, Divider, IconButton, Stack, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import { fieldCatalog } from "../../config/fields";
import type { FieldDefinition } from "../../config/fields/types";
import { pageSections } from "../../config/pageSections/pageSections";
import { isSectionVisible } from "../page/RoutePage";
import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type { PageId } from "../../types";

type DisplayEntry = {
  label: string;
  value: string;
};

type DisplayGroup = {
  title?: string;
  entries: DisplayEntry[];
};

type DisplaySection = {
  title: string;
  groups: DisplayGroup[];
};

type BeneficiaryItem = {
  designation: "primary" | "contingent";
  beneficiaryType: "individual" | "trust";
  firstName: string;
  lastName: string;
  relationship: string;
  trustName: string;
  share: number;
};

type ApplicationDocumentPreviewProps = {
  values: ApplicationFormValues;
  signatureName: string;
  signedDate: string;
  currentDate: string;
  onEditSection?: (pageId: PageId) => void;
  hideSignature?: boolean;
};

const PLACEHOLDER = "\u2014";

const documentPages: Array<{ pageId: PageId; title: string }> = [
  { pageId: "membership", title: "Applicant Information" },
  { pageId: "eligibility", title: "Eligibility" },
  { pageId: "coverage", title: "Coverage Selections" },
  { pageId: "beneficiary", title: "Beneficiaries" },
  { pageId: "contact", title: "Contact Information" },
  { pageId: "profile", title: "Personal & Financial Information" },
  { pageId: "review", title: "Review and Consent" },
];

const reviewConsentLabels: Record<string, string> = {
  "review-self-consent": "Applicant electronic consent",
  "review-spouse-consent": "Spouse electronic consent",
};

function formatLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function formatCurrency(value: string) {
  const digits = value.replace(/[^\d.-]/g, "");
  if (!digits) return value;

  const parsed = Number(digits);
  if (!Number.isFinite(parsed)) return value;

  return parsed.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function resolveOptionLabel(field: FieldDefinition | undefined, value: string) {
  return (
    field?.options?.find((option) => option.value === value)?.label ?? value
  );
}

function formatFieldValue(fieldId: string, rawValue: unknown) {
  if (rawValue == null || rawValue === "") {
    return PLACEHOLDER;
  }

  const field = fieldCatalog[fieldId as keyof typeof fieldCatalog];

  if (typeof rawValue === "boolean") {
    return rawValue ? "Yes" : "No";
  }

  if (Array.isArray(rawValue)) {
    if (rawValue.length === 0) {
      return PLACEHOLDER;
    }

    return rawValue
      .map((entry) => resolveOptionLabel(field, String(entry)))
      .join(", ");
  }

  if (typeof rawValue === "number") {
    return String(rawValue);
  }

  if (typeof rawValue === "string") {
    if (field?.inputType === "date") {
      return formatDate(rawValue);
    }

    if (field?.format === "currency") {
      return formatCurrency(rawValue);
    }

    return resolveOptionLabel(field, rawValue);
  }

  return String(rawValue);
}

function getNameFieldPair(fieldId: string): string | null {
  if (fieldId === "first-name" || fieldId === "last-name") return "name";
  if (fieldId === "spouse-first-name" || fieldId === "spouse-last-name") {
    return "spouse-name";
  }
  if (fieldId === "child-first-name" || fieldId === "child-last-name") {
    return "child-name";
  }
  if (fieldId === "physician-first-name" || fieldId === "physician-last-name") {
    return "physician-name";
  }

  return null;
}

function getApplicantLabel(applicant: string) {
  if (applicant === "member") return "Self";
  if (applicant === "spouse") return "Spouse";
  if (applicant === "child") return "Child";
  return formatLabel(applicant);
}

function buildSectionEntries(values: ApplicationFormValues, pageId: PageId) {
  const sections = pageSections[pageId] ?? [];

  return sections
    .filter((section) => isSectionVisible(section, values))
    .map((section) => {
      const processed = new Set<string>();
      const entries: DisplayEntry[] = [];

      for (const fieldId of section.fieldIds) {
        if (processed.has(fieldId)) {
          continue;
        }

        const pairKey = getNameFieldPair(fieldId);
        if (pairKey) {
          const otherFieldId = fieldId.includes("first")
            ? fieldId.replace("-first-", "-last-")
            : fieldId.replace("-last-", "-first-");

          const firstName = fieldId.includes("first")
            ? values[fieldId]
            : values[otherFieldId];
          const lastName = fieldId.includes("last")
            ? values[fieldId]
            : values[otherFieldId];

          entries.push({
            label: formatLabel(pairKey),
            value:
              [String(firstName ?? "").trim(), String(lastName ?? "").trim()]
                .filter(Boolean)
                .join(" ") || PLACEHOLDER,
          });

          processed.add(fieldId);
          processed.add(otherFieldId);
          continue;
        }

        const field = fieldCatalog[fieldId as keyof typeof fieldCatalog];
        entries.push({
          label: field?.label ?? formatLabel(fieldId),
          value: formatFieldValue(fieldId, values[fieldId]),
        });
        processed.add(fieldId);
      }

      return {
        title: section.title ?? section.description,
        entries,
      } satisfies DisplayGroup;
    });
}

function buildCoverageSection(values: ApplicationFormValues): DisplaySection {
  const selectedIds = Array.isArray(values.coverageSelections)
    ? values.coverageSelections.map(String)
    : [];
  const coverages = getActiveClientCoverages();
  const coverageNames = selectedIds
    .map(
      (coverageId) =>
        coverages.find((coverage) => coverage.id === coverageId)?.name,
    )
    .filter((value): value is string => Boolean(value));

  return {
    title: "Coverage Selections",
    groups: [
      {
        entries: [
          {
            label: "Selected products",
            value: coverageNames.length
              ? coverageNames.join(", ")
              : PLACEHOLDER,
          },
        ],
      },
    ],
  };
}

function buildBeneficiariesSection(
  values: ApplicationFormValues,
): DisplaySection {
  const coverages = getActiveClientCoverages();
  const beneficiaries =
    values.beneficiaries &&
    typeof values.beneficiaries === "object" &&
    !Array.isArray(values.beneficiaries)
      ? (values.beneficiaries as Record<string, BeneficiaryItem[]>)
      : {};

  const entries = Object.entries(beneficiaries).map(([productKey, items]) => {
    const [coverageId, applicant] = productKey.split(":");
    const coverage = coverages.find((item) => item.id === coverageId);
    const label = coverage
      ? `${coverage.name} - ${getApplicantLabel(applicant)}`
      : productKey;

    const value =
      Array.isArray(items) && items.length > 0
        ? items
            .map((item) => {
              const name =
                item.beneficiaryType === "trust"
                  ? item.trustName
                  : `${item.firstName} ${item.lastName}`.trim();
              const relationship =
                item.beneficiaryType === "trust"
                  ? "Trust"
                  : item.relationship || "Relationship not provided";

              return `${formatLabel(item.designation)}: ${name || PLACEHOLDER} (${relationship}, ${item.share}%)`;
            })
            .join("; ")
        : PLACEHOLDER;

    return { label, value };
  });

  return {
    title: "Beneficiaries",
    groups: [
      {
        entries: entries.length
          ? entries
          : [{ label: "Beneficiaries", value: PLACEHOLDER }],
      },
    ],
  };
}

function buildReviewSection(values: ApplicationFormValues): DisplaySection {
  const entries = Object.entries(reviewConsentLabels)
    .filter(([fieldId]) => fieldId in values)
    .map(([fieldId, label]) => ({
      label,
      value: formatFieldValue(fieldId, values[fieldId]),
    }));

  return {
    title: "Review and Consent",
    groups: entries.length ? [{ entries }] : [],
  };
}

function buildDocumentSections(values: ApplicationFormValues) {
  return documentPages
    .map((entry) => {
      if (entry.pageId === "coverage") {
        return buildCoverageSection(values);
      }

      if (entry.pageId === "beneficiary") {
        return buildBeneficiariesSection(values);
      }

      if (entry.pageId === "review") {
        return buildReviewSection(values);
      }

      return {
        title: entry.title,
        groups: buildSectionEntries(values, entry.pageId),
      } satisfies DisplaySection;
    })
    .filter((section) => section.groups.length > 0);
}

function chunkSections<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function renderEntryValue(value: string) {
  return value || PLACEHOLDER;
}

export default function ApplicationDocumentPreview({
  values,
  signatureName,
  signedDate,
  currentDate,
  onEditSection,
  hideSignature,
}: ApplicationDocumentPreviewProps) {
  const client = getActiveClient();
  const sections = buildDocumentSections(values);
  const pages = chunkSections(sections, 3);

  // Map section titles back to page IDs for edit buttons
  const sectionTitleToPageId = new Map(
    documentPages.map((p) => [p.title, p.pageId]),
  );

  return (
    <Box
      sx={{
        border: "1px solid rgba(0, 0, 0, 0.12)",
        borderRadius: 2,
        backgroundColor: "#f3f4f6",
        p: { xs: 1.5, md: 2.5 },
        maxHeight: { xs: "56vh", lg: "72vh" },
        overflowY: "auto",
      }}
    >
      <Stack spacing={2.5}>
        {pages.map((pageSections, pageIndex) => (
          <Box
            key={`page-${pageIndex + 1}`}
            sx={{
              backgroundColor: "#fff",
              border: "1px solid rgba(15, 23, 42, 0.12)",
              borderRadius: 1,
              px: { xs: 2, md: 4 },
              py: { xs: 2.5, md: 4 },
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Stack spacing={3}>
              {pageIndex === 0 ? (
                <Stack spacing={1.5}>
                  <Typography variant="overline">
                    Application Preview
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <div>
                      <Typography variant="h5">
                        {client.branding.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Insurance Application Review Copy
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body2" color="text.secondary">
                        Prepared on {currentDate}
                      </Typography>
                    </div>
                  </Stack>
                  <Divider />
                </Stack>
              ) : null}

              {pageSections.map((section) => {
                const sectionPageId = sectionTitleToPageId.get(section.title);
                return (
                  <Stack key={section.title} spacing={1.5}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {section.title}
                      </Typography>
                      {onEditSection &&
                        sectionPageId &&
                        sectionPageId !== "review" && (
                          <IconButton
                            size="small"
                            onClick={() => onEditSection(sectionPageId)}
                            aria-label={`Edit ${section.title}`}
                            sx={{ color: "primary.main" }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        )}
                    </Stack>

                    {section.groups.map((group, groupIndex) => (
                      <Stack
                        key={`${section.title}-${group.title ?? groupIndex}`}
                        spacing={1}
                      >
                        {group.title ? (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {group.title}
                          </Typography>
                        ) : null}

                        <Stack spacing={0.75}>
                          {group.entries.map((entry) => (
                            <Stack
                              key={`${section.title}-${group.title ?? "group"}-${entry.label}`}
                              direction={{ xs: "column", sm: "row" }}
                              spacing={0.75}
                              justifyContent="space-between"
                              sx={{
                                py: 0.75,
                                borderBottom:
                                  "1px dotted rgba(15, 23, 42, 0.16)",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ width: { sm: "42%" }, flexShrink: 0 }}
                              >
                                {entry.label}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  textAlign: { sm: "right" },
                                  wordBreak: "break-word",
                                }}
                              >
                                {renderEntryValue(entry.value)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                );
              })}

              {pageIndex === pages.length - 1 && !hideSignature ? (
                <Stack spacing={1.25} sx={{ pt: 1.5 }}>
                  <Divider />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Signature
                  </Typography>
                  <Box
                    sx={{
                      border: "1px solid rgba(15, 23, 42, 0.16)",
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        Electronic signature
                      </Typography>
                      <Typography
                        sx={{
                          minHeight: 44,
                          fontSize: "2rem",
                          lineHeight: 1.1,
                          fontFamily:
                            '"Brush Script MT", "Segoe Script", cursive',
                          color: signatureName.trim()
                            ? "text.primary"
                            : "text.disabled",
                        }}
                      >
                        {signatureName.trim() || PLACEHOLDER}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Signed date: {signedDate || PLACEHOLDER}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              ) : null}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

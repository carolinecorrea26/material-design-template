import { Box, Divider, IconButton, Stack, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { getActiveClient } from "../../config/client/getActiveClient";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import { fieldCatalog } from "../../config/fields";
import type { FieldDefinition, FieldId } from "../../config/fields/types";
import type { CoverageApplicantId } from "../../config/coverages/types";
import {
  pageSections,
  sectionLabels,
} from "../../config/pageSections/pageSections";
import { isSectionVisible } from "../../app/RoutePage";
import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type { PageId } from "../../types";

type DisplayEntry = {
  label: string;
  value: string;
  fieldId?: string;
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
  { pageId: "membership", title: "Membership" },
  { pageId: "eligibility", title: "Eligibility" },
  { pageId: "coverage", title: "Coverage" },
  { pageId: "beneficiary", title: "Beneficiary" },
  { pageId: "contact", title: "Contact" },
  { pageId: "profile", title: "Profile" },
];

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

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase());
}

function normalizeDisplayCasing(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  // Preserve emails, links, ids, and already-cased strings.
  if (
    trimmed.includes("@") ||
    /https?:\/\//i.test(trimmed) ||
    trimmed.includes("www.")
  ) {
    return trimmed;
  }

  if (!/[a-z]/.test(trimmed) || /[A-Z]/.test(trimmed)) {
    return trimmed;
  }

  return toTitleCase(trimmed);
}

function hasFilledValue(rawValue: unknown) {
  if (rawValue == null) return false;
  if (typeof rawValue === "string") return rawValue.trim().length > 0;
  if (Array.isArray(rawValue)) return rawValue.length > 0;
  return true;
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
      .map((entry) =>
        normalizeDisplayCasing(resolveOptionLabel(field, String(entry))),
      )
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

    return normalizeDisplayCasing(resolveOptionLabel(field, rawValue));
  }

  return String(rawValue);
}

/** Returns a group key if this field should be merged into a combined Name entry, null otherwise. */
function getNameGroupKey(fieldId: string): string | null {
  if (
    fieldId === "title" ||
    fieldId === "first-name" ||
    fieldId === "last-name"
  )
    return "name";
  if (fieldId === "spouse-first-name" || fieldId === "spouse-last-name")
    return "spouse-name";
  if (fieldId === "child-first-name" || fieldId === "child-last-name")
    return "child-name";
  if (fieldId === "physician-first-name" || fieldId === "physician-last-name")
    return "physician-name";
  if (
    fieldId === "ama-physician-first-name" ||
    fieldId === "ama-physician-last-name" ||
    fieldId === "ama-physician-title"
  )
    return "ama-physician-name";
  return null;
}

/** Returns all field IDs that belong to the same name group. */
function getNameGroupFieldIds(groupKey: string): string[] {
  switch (groupKey) {
    case "name":
      return ["title", "first-name", "last-name"];
    case "spouse-name":
      return ["spouse-first-name", "spouse-last-name"];
    case "child-name":
      return ["child-first-name", "child-last-name"];
    case "physician-name":
      return ["physician-first-name", "physician-last-name"];
    case "ama-physician-name":
      return [
        "ama-physician-title",
        "ama-physician-first-name",
        "ama-physician-last-name",
      ];
    default:
      return [];
  }
}

function buildNameValue(
  groupKey: string,
  values: ApplicationFormValues,
): string {
  const fieldIds = getNameGroupFieldIds(groupKey);
  const parts = fieldIds
    .map((id) => {
      const raw = values[id];
      if (!raw) return "";
      const field = fieldCatalog[id as keyof typeof fieldCatalog];
      return resolveOptionLabel(field, String(raw)).trim();
    })
    .filter(Boolean);
  return parts.join(" ") || PLACEHOLDER;
}

function getApplicantLabel(applicant: string) {
  if (applicant === "member") return "Self";
  if (applicant === "spouse") return "Spouse";
  if (applicant === "child") return "Child";
  return formatLabel(applicant);
}

function resolveProfileGroupTitle(sectionId: string) {
  if (sectionId.includes("Physician")) {
    return "Physician information";
  }

  if (sectionId.includes("Financial")) {
    return sectionLabels.financialInfo;
  }

  if (sectionId.includes("DriversLicense")) {
    return "Driver's license";
  }

  if (sectionId.includes("TravelOutsideUs")) {
    return "Outside U.S. travel";
  }

  if (sectionId.includes("OutsideUs")) {
    return "Outside U.S. residence";
  }

  if (sectionId.includes("Personal")) {
    return sectionLabels.personalInfo;
  }

  return undefined;
}

function resolveSectionGroupTitle(
  pageId: PageId,
  section: {
    id: string;
    title?: string;
    description?: string;
  },
) {
  if (section.title) {
    return section.title;
  }

  if (section.description) {
    return section.description;
  }

  if (pageId === "profile") {
    return resolveProfileGroupTitle(section.id);
  }

  return undefined;
}

const previewLabelOverrides: Record<string, string> = {
  "outside-us-country": "Country (Residence outside U.S.)",
  "travel-outside-us-country": "Country (Travel destination)",
  "spouse-outside-us-country": "Country (Spouse residence outside U.S.)",
  "spouse-travel-outside-us-country": "Country (Spouse travel destination)",
};

function dedupeAndFormatLabels(entries: DisplayEntry[]) {
  const labelCounts = new Map<string, number>();
  for (const entry of entries) {
    labelCounts.set(entry.label, (labelCounts.get(entry.label) ?? 0) + 1);
  }

  const usedLabels = new Map<string, number>();

  return entries.map((entry) => {
    let label = entry.label;
    const isDuplicated = (labelCounts.get(entry.label) ?? 0) > 1;

    if (isDuplicated && entry.fieldId) {
      label =
        previewLabelOverrides[entry.fieldId] ?? formatLabel(entry.fieldId);
    }

    const nextUse = (usedLabels.get(label) ?? 0) + 1;
    usedLabels.set(label, nextUse);
    if (nextUse > 1) {
      label = `${label} (${nextUse})`;
    }

    return {
      ...entry,
      label,
    };
  });
}

function formatCoverageAmount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function getRecordValue<T>(
  value: unknown,
  validator: (candidate: unknown) => candidate is T,
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, T>;
  }

  const source = value as Record<string, unknown>;
  const out: Record<string, T> = {};

  for (const [key, candidate] of Object.entries(source)) {
    if (validator(candidate)) {
      out[key] = candidate;
    }
  }

  return out;
}

function getVisibleCoverageApplicants(
  coverage: { applicants: CoverageApplicantId[]; id: string },
  productApplicants: Record<string, CoverageApplicantId[]>,
  selectedDependents: CoverageApplicantId[],
) {
  if (Object.prototype.hasOwnProperty.call(productApplicants, coverage.id)) {
    const selected = Array.isArray(productApplicants[coverage.id])
      ? productApplicants[coverage.id]
      : [];

    return coverage.applicants.filter((applicant) =>
      selected.includes(applicant),
    );
  }

  if (selectedDependents.length > 0) {
    return coverage.applicants.filter((applicant) => {
      if (applicant === "member") return true;
      return selectedDependents.includes(applicant);
    });
  }

  return coverage.applicants.includes("member") ? ["member"] : [];
}

function isNonNullable<T>(value: T | null | undefined): value is T {
  return value != null;
}

function buildSectionEntries(values: ApplicationFormValues, pageId: PageId) {
  const sections = pageSections[pageId] ?? [];

  const groups = sections
    .filter((section) => isSectionVisible(section, values))
    .map((section) => {
      const processed = new Set<string>();
      const entries: DisplayEntry[] = [];

      for (const fieldId of section.fieldIds) {
        if (processed.has(fieldId)) {
          continue;
        }

        const rawValue = values[fieldId];
        const groupKey = getNameGroupKey(fieldId);
        if (groupKey) {
          // Only emit the combined entry once — when we hit the first field in the group
          const groupFieldIds = getNameGroupFieldIds(groupKey);
          const isFirstInGroup =
            groupFieldIds[0] === fieldId ||
            !groupFieldIds
              .slice(0, groupFieldIds.indexOf(fieldId))
              .some((id) => section.fieldIds.includes(id as FieldId));

          if (isFirstInGroup) {
            const nameValue = buildNameValue(groupKey, values);
            if (nameValue !== PLACEHOLDER) {
              entries.push({
                label: "Name",
                value: nameValue,
                fieldId,
              });
            }
          }

          // Mark all group fields as processed
          for (const id of groupFieldIds) {
            processed.add(id);
          }
          continue;
        }

        if (!hasFilledValue(rawValue)) {
          processed.add(fieldId);
          continue;
        }

        const field = fieldCatalog[fieldId as keyof typeof fieldCatalog];
        const value = formatFieldValue(fieldId, rawValue);
        if (value === PLACEHOLDER) {
          processed.add(fieldId);
          continue;
        }

        entries.push({
          label: field?.label ?? formatLabel(fieldId),
          value,
          fieldId,
        });
        processed.add(fieldId);
      }

      const sectionEntries = dedupeAndFormatLabels(entries);
      if (sectionEntries.length === 0) {
        return null;
      }

      return {
        title: resolveSectionGroupTitle(pageId, section),
        entries: sectionEntries,
      } satisfies DisplayGroup;
    })
    .filter(isNonNullable);

  return groups;
}

function buildCoverageSection(values: ApplicationFormValues): DisplaySection {
  const selectedIds = Array.isArray(values.coverageSelections)
    ? values.coverageSelections.map(String)
    : [];

  const selectedDependents: CoverageApplicantId[] = Array.isArray(
    values.dependents,
  )
    ? values.dependents.filter(
        (applicant): applicant is CoverageApplicantId =>
          applicant === "spouse" || applicant === "child",
      )
    : [];

  const productApplicants = getRecordValue<CoverageApplicantId[]>(
    values.productApplicants,
    (candidate): candidate is CoverageApplicantId[] =>
      Array.isArray(candidate) &&
      candidate.every(
        (item) => item === "member" || item === "spouse" || item === "child",
      ),
  );

  const coverageAmounts = getRecordValue<number>(
    values.coverageAmounts,
    (candidate): candidate is number =>
      typeof candidate === "number" && Number.isFinite(candidate),
  );

  const coverageRiders = getRecordValue<boolean>(
    values.coverageRiders,
    (candidate): candidate is boolean => typeof candidate === "boolean",
  );

  const coverageRiderAmounts = getRecordValue<number>(
    values.coverageRiderAmounts,
    (candidate): candidate is number =>
      typeof candidate === "number" && Number.isFinite(candidate),
  );

  const coverageWaitingPeriods = getRecordValue<string>(
    values.coverageWaitingPeriods,
    (candidate): candidate is string => typeof candidate === "string",
  );

  const coverageMaxBenefitPeriods = getRecordValue<string>(
    values.coverageMaxBenefitPeriods,
    (candidate): candidate is string => typeof candidate === "string",
  );

  const coverages = getActiveClientCoverages();
  const coverageById = new Map(
    coverages.map((coverage) => [coverage.id, coverage]),
  );

  const groups = selectedIds
    .map((coverageId) => {
      const coverage = coverageById.get(coverageId);
      if (!coverage) return null;

      const visibleApplicants = getVisibleCoverageApplicants(
        coverage,
        productApplicants,
        selectedDependents,
      );

      const entries: DisplayEntry[] = [];
      if (visibleApplicants.length > 0) {
        entries.push({
          label: "Applicants",
          value: visibleApplicants.map(getApplicantLabel).join(", "),
        });
      }

      for (const applicant of visibleApplicants) {
        const amount = formatCoverageAmount(
          coverageAmounts[`${coverage.id}:${applicant}`],
        );

        if (amount) {
          entries.push({
            label: `${getApplicantLabel(applicant)} amount`,
            value: amount,
          });
        }

        const selectedRiders = (coverage.riders ?? [])
          .filter(
            (rider) =>
              coverageRiders[`${coverage.id}:${rider.id}:${applicant}`],
          )
          .map((rider) => {
            if (!rider.hasAmount) return rider.name;
            const riderAmount = formatCoverageAmount(
              coverageRiderAmounts[`${coverage.id}:${rider.id}:${applicant}`],
            );
            return riderAmount ? `${rider.name} (${riderAmount})` : rider.name;
          });

        if (selectedRiders.length > 0) {
          entries.push({
            label: `${getApplicantLabel(applicant)} riders`,
            value: selectedRiders.join(", "),
          });
        }
      }

      if (
        coverage.waitingPeriodOptions &&
        coverage.waitingPeriodOptions.length > 0
      ) {
        const selectedWaitingPeriod =
          coverageWaitingPeriods[coverage.id] ??
          coverage.waitingPeriodOptions[0].value;
        const waitingPeriodLabel =
          coverage.waitingPeriodOptions.find(
            (option) => option.value === selectedWaitingPeriod,
          )?.label ?? selectedWaitingPeriod;
        if (waitingPeriodLabel) {
          entries.push({
            label: "Waiting period",
            value: waitingPeriodLabel,
          });
        }
      }

      if (
        coverage.maxBenefitPeriodOptions &&
        coverage.maxBenefitPeriodOptions.length > 0
      ) {
        const selectedMaxBenefitPeriod =
          coverageMaxBenefitPeriods[coverage.id] ??
          coverage.maxBenefitPeriodOptions[0].value;
        const maxBenefitPeriodLabel =
          coverage.maxBenefitPeriodOptions.find(
            (option) => option.value === selectedMaxBenefitPeriod,
          )?.label ?? selectedMaxBenefitPeriod;
        if (maxBenefitPeriodLabel) {
          entries.push({
            label: "Max benefit period",
            value: maxBenefitPeriodLabel,
          });
        }
      }

      if (entries.length === 0) {
        entries.push({
          label: "Selected",
          value: "Yes",
        });
      }

      return {
        title: coverage.name,
        entries,
      } satisfies DisplayGroup;
    })
    .filter(isNonNullable);

  return {
    title: "Coverage",
    groups:
      groups.length > 0
        ? groups
        : [
            {
              entries: [{ label: "Selected products", value: PLACEHOLDER }],
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
    title: "Beneficiary",
    groups: [
      {
        entries: entries.length
          ? entries
          : [{ label: "Beneficiaries", value: PLACEHOLDER }],
      },
    ],
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
        border: "1px solid",
        borderColor: "divider",
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
              backgroundColor: "background.paper",
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
                          {group.entries.map((entry, entryIndex) => (
                            <Stack
                              key={`${section.title}-${group.title ?? "group"}-${entry.label}-${entryIndex}`}
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

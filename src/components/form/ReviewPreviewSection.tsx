import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, Card, Stack, Typography } from "@mui/material";
import ApplicantSection from "../form/ApplicantSection";
import { shouldShowApplicantLabel } from "../form/applicantVisibility";
import type { PageId } from "../../types/page";
import { getActiveClientCoverages } from "../../client/getActiveClientCoverages";
import { pageSections } from "../../config/pageSections/pageSections";
import { fieldCatalog } from "../../config/fields";

type PreviewRow = {
  label: string;
  fieldId: string;
  value: unknown;
  indent?: boolean;
};

type PreviewEntries = {
  self: PreviewRow[];
  spouse: PreviewRow[];
};

type ReviewCardConfig = {
  pageId: PageId;
  title: string;
  showSelfLabel?: boolean;
};

type ReviewPreviewSectionProps = {
  values: Record<string, unknown>;
  hasSpouse: boolean;
  reviewCards: ReviewCardConfig[];
  reviewFieldBlocklist: Set<string>;
  subQuestionFieldIds: Set<string>;
  onEdit: (pageId: PageId) => void;
};

const sectionTitleSx = {
  fontSize: "1rem",
  fontWeight: 700,
};

const cardSx = {
  p: 2,
  borderRadius: 2,
};

const rowStackSx = {
  pb: 0.75,
  borderBottom: "1px dotted #d0d0d0",
};

const rowLabelSx = {
  maxWidth: "40%",
  flexShrink: 0,
};

const rowValueSx = {
  wordBreak: "break-word",
};

const indentedRowSx = {
  pl: 1.5,
  borderLeft: "3px solid",
  borderLeftColor: "primary.main",
};

function formatLabel(key: string) {
  return key
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function capitalizeFirst(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
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

function formatCurrencyValue(value: unknown) {
  const numStr =
    typeof value === "string" ? value.replace(/[^\d.-]/g, "") : String(value);
  const num = parseFloat(numStr);

  if (isNaN(num)) {
    return String(value);
  }

  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatFieldValue(fieldId: string, value: unknown): string | string[] {
  if (value == null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  const field = fieldId
    ? fieldCatalog[fieldId as keyof typeof fieldCatalog]
    : undefined;

  if (Array.isArray(value)) {
    if (!value.length) return "-";

    if (field?.options) {
      return value.map((item) => {
        const option = field.options!.find((o) => o.value === String(item));
        return option ? option.label : capitalizeFirst(String(item));
      });
    }

    return value.map((item) =>
      typeof item === "string" ? capitalizeFirst(item) : String(item),
    );
  }

  if (field?.options && typeof value === "string") {
    const option = field.options.find((o) => o.value === value);
    if (option) return option.label;
  }

  if (field?.inputType === "date" && typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[2]}/${match[3]}/${match[1]}`;
    }
  }

  if (field?.format === "currency") {
    return formatCurrencyValue(value);
  }

  if (typeof value === "string") return capitalizeFirst(value);
  if (typeof value === "number") return String(value);
  return String(value);
}

function getCoverageNameMap() {
  return new Map(
    getActiveClientCoverages().map((coverage) => [coverage.id, coverage]),
  );
}

function getCoverageNames(values: Record<string, unknown>) {
  const selectedCoverageIds = Array.isArray(values.coverageSelections)
    ? values.coverageSelections
    : [];
  const coverageById = getCoverageNameMap();

  return selectedCoverageIds.map((id) => {
    const coverage = coverageById.get(String(id));
    return coverage?.name ?? String(id);
  });
}

function formatBeneficiaryRows(values: Record<string, unknown>): PreviewRow[] {
  const beneficiaries = values.beneficiaries;
  if (
    !beneficiaries ||
    typeof beneficiaries !== "object" ||
    Array.isArray(beneficiaries)
  ) {
    return [];
  }

  const coverageById = getCoverageNameMap();
  const rows: PreviewRow[] = [];

  Object.entries(beneficiaries as Record<string, unknown>).forEach(
    ([productKey, items]) => {
      if (!Array.isArray(items) || !items.length) return;

      const [coverageId, applicantId] = productKey.split(":");
      const coverageName =
        coverageById.get(coverageId)?.name ?? formatLabel(coverageId);
      const applicantLabel =
        applicantId === "spouse" ? " (Spouse)" : " (Member)";

      const displayLines = items.map(
        (item: {
          designation: string;
          beneficiaryType: string;
          firstName?: string;
          lastName?: string;
          relationship?: string;
          trustName?: string;
          share: number;
        }) => {
          const name =
            item.beneficiaryType === "trust"
              ? item.trustName || "Trust"
              : `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
                "Unknown";

          const designation =
            item.designation === "primary" ? "Primary" : "Contingent";
          const share = `${item.share}%`;
          const relationship = item.relationship
            ? ` · ${item.relationship}`
            : "";

          return `${name} · ${designation} · ${share}${relationship}`;
        },
      );

      rows.push({
        label: `${coverageName}${applicantLabel}`,
        fieldId: "",
        value: displayLines,
      });
    },
  );

  return rows;
}

function getCoverageOptionRows(
  values: Record<string, unknown>,
): PreviewEntries {
  const self: PreviewRow[] = [];
  const spouse: PreviewRow[] = [];
  const coverageById = getCoverageNameMap();

  const amounts =
    values.coverageAmounts &&
    typeof values.coverageAmounts === "object" &&
    !Array.isArray(values.coverageAmounts)
      ? (values.coverageAmounts as Record<string, unknown>)
      : {};

  const riders =
    values.coverageRiders &&
    typeof values.coverageRiders === "object" &&
    !Array.isArray(values.coverageRiders)
      ? (values.coverageRiders as Record<string, unknown>)
      : {};

  Object.entries(amounts).forEach(([key, amount]) => {
    if (!amount) return;

    const [coverageId, applicantId] = key.split(":");
    const coverage = coverageById.get(coverageId);
    if (!coverage) return;

    const row: PreviewRow = {
      label: coverage.name,
      fieldId: "",
      value: formatCurrencyValue(amount),
    };

    if (applicantId === "spouse") {
      spouse.push(row);
    } else {
      self.push(row);
    }
  });

  Object.entries(riders).forEach(([key, enabled]) => {
    if (!enabled) return;

    const [coverageId, riderId, applicantId] = key.split(":");
    const coverage = coverageById.get(coverageId);
    const rider = coverage?.riders?.find((entry) => entry.id === riderId);

    const row: PreviewRow = {
      label: rider ? `${rider.name} Rider` : `${formatLabel(riderId)} Rider`,
      fieldId: "",
      value: "Included",
    };

    if (applicantId === "spouse") {
      spouse.push(row);
    } else {
      self.push(row);
    }
  });

  return { self, spouse };
}

function getApplicantSectionRows(params: {
  values: Record<string, unknown>;
  pageId: PageId;
  applicant: "self" | "spouse";
  reviewFieldBlocklist: Set<string>;
  subQuestionFieldIds: Set<string>;
}): PreviewRow[] {
  const {
    values,
    pageId,
    applicant,
    reviewFieldBlocklist,
    subQuestionFieldIds,
  } = params;

  const sections = (pageSections[pageId] || []).filter((section) => {
    if (applicant === "self" && section.applicant === "spouse") return false;
    if (applicant === "spouse" && section.applicant !== "spouse") return false;
    return true;
  });

  const processed = new Set<string>();
  const rows: PreviewRow[] = [];
  const subSectionsByTrigger = new Map<string, readonly string[][]>();
  const mutableMainSections: string[][] = [];
  const mainSections: string[][] = [];

  sections.forEach((section) => {
    const triggerRules = (section.visibleWhen ?? []).filter(
      (rule) => "equals" in rule || "notEquals" in rule,
    );

    if (!triggerRules.length) {
      mutableMainSections.push(section.fieldIds);
      return;
    }

    triggerRules.forEach((rule) => {
      const existing = subSectionsByTrigger.get(rule.fieldId) ?? [];
      subSectionsByTrigger.set(rule.fieldId, [...existing, section.fieldIds]);
    });
  });

  mainSections.push(...mutableMainSections);

  function pushFieldRows(fieldIds: readonly string[], indent: boolean) {
    fieldIds.forEach((fieldId) => {
      if (reviewFieldBlocklist.has(fieldId) || processed.has(fieldId)) {
        processed.add(fieldId);
        return;
      }

      const pairKey = getNameFieldPair(fieldId);

      if (pairKey) {
        const otherFieldId = fieldId.includes("first")
          ? fieldId.replace("-first-", "-last-")
          : fieldId.replace("-last-", "-first-");

        if (!processed.has(otherFieldId)) {
          const firstValue = fieldId.includes("first")
            ? values[fieldId]
            : values[otherFieldId];
          const lastValue = fieldId.includes("first")
            ? values[otherFieldId]
            : values[fieldId];
          const combined = [firstValue, lastValue].filter(Boolean).join(" ");

          if (combined) {
            rows.push({
              label: formatLabel(pairKey),
              fieldId: pairKey,
              value: combined,
              indent,
            });
          }
        }

        processed.add(fieldId);
        processed.add(otherFieldId);
        return;
      }

      if (values[fieldId] == null || values[fieldId] === "") {
        processed.add(fieldId);
        return;
      }

      const field = fieldCatalog[fieldId as keyof typeof fieldCatalog];
      rows.push({
        label: field?.label || formatLabel(fieldId),
        fieldId,
        value: values[fieldId],
        indent: indent || subQuestionFieldIds.has(fieldId),
      });

      processed.add(fieldId);

      const dependentSections = subSectionsByTrigger.get(fieldId) ?? [];
      dependentSections.forEach((sectionFieldIds) => {
        pushFieldRows(sectionFieldIds, true);
      });
    });
  }

  mainSections.forEach((fieldIds) => {
    pushFieldRows(fieldIds, false);
  });

  return rows;
}

function getPreviewEntries(params: {
  values: Record<string, unknown>;
  pageId: PageId;
  reviewFieldBlocklist: Set<string>;
  subQuestionFieldIds: Set<string>;
}): PreviewEntries {
  const { values, pageId, reviewFieldBlocklist, subQuestionFieldIds } = params;

  if (pageId === "coverage") {
    const coverageNames = getCoverageNames(values);

    return coverageNames.length
      ? {
          self: [
            {
              label: "Selected products",
              fieldId: "",
              value: coverageNames,
            },
          ],
          spouse: [],
        }
      : { self: [], spouse: [] };
  }

  if (pageId === "coverage-options") {
    return getCoverageOptionRows(values);
  }

  if (pageId === "beneficiary") {
    return {
      self: formatBeneficiaryRows(values),
      spouse: [],
    };
  }

  return {
    self: getApplicantSectionRows({
      values,
      pageId,
      applicant: "self",
      reviewFieldBlocklist,
      subQuestionFieldIds,
    }),
    spouse: getApplicantSectionRows({
      values,
      pageId,
      applicant: "spouse",
      reviewFieldBlocklist,
      subQuestionFieldIds,
    }),
  };
}

function PreviewRows({ rows }: { rows: PreviewRow[] }) {
  if (!rows.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No data available.
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      {rows.map((row, index) => {
        const displayValue = formatFieldValue(row.fieldId, row.value);
        const isMultiValue = Array.isArray(displayValue);

        return (
          <Box
            key={`${row.label}-${index}`}
            sx={row.indent ? indentedRowSx : undefined}
          >
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="flex-start"
              sx={rowStackSx}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={rowLabelSx}
              >
                {row.label}
              </Typography>

              <Box sx={{ textAlign: "right", flex: 1 }}>
                {isMultiValue ? (
                  <Stack spacing={0.25} alignItems="flex-end">
                    {(displayValue as string[]).map((item, itemIndex) => (
                      <Typography
                        key={itemIndex}
                        variant="body2"
                        sx={rowValueSx}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={rowValueSx}>
                    {displayValue}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

function PreviewCard({
  pageId,
  title,
  showSelfLabel,
  values,
  hasSpouse,
  reviewFieldBlocklist,
  subQuestionFieldIds,
  onEdit,
}: ReviewCardConfig &
  Pick<
    ReviewPreviewSectionProps,
    | "values"
    | "hasSpouse"
    | "reviewFieldBlocklist"
    | "subQuestionFieldIds"
    | "onEdit"
  >) {
  const { self, spouse } = getPreviewEntries({
    values,
    pageId,
    reviewFieldBlocklist,
    subQuestionFieldIds,
  });

  const hasSelfContent = self.length > 0;
  const hasSpouseContent = spouse.length > 0 && hasSpouse;

  if (!hasSelfContent && !hasSpouseContent) {
    return null;
  }

  return (
    <Card variant="outlined" sx={cardSx}>
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>

          <Button
            size="small"
            variant="contained"
            color="info"
            startIcon={<EditOutlinedIcon />}
            onClick={() => onEdit(pageId)}
          >
            Edit
          </Button>
        </Stack>

        <Stack spacing={1.5}>
          {hasSelfContent ? (
            <ApplicantSection
              applicant="self"
              showLabel={
                showSelfLabel !== false &&
                shouldShowApplicantLabel("self", values, "review")
              }
            >
              <PreviewRows rows={self} />
            </ApplicantSection>
          ) : null}

          {hasSpouseContent ? (
            <ApplicantSection applicant="spouse" showLabel>
              <PreviewRows rows={spouse} />
            </ApplicantSection>
          ) : null}
        </Stack>
      </Stack>
    </Card>
  );
}

export default function ReviewPreviewSection({
  values,
  hasSpouse,
  reviewCards,
  reviewFieldBlocklist,
  subQuestionFieldIds,
  onEdit,
}: ReviewPreviewSectionProps) {
  return (
    <Stack spacing={1.5}>
      <Typography sx={sectionTitleSx}>
        Review your insurance application
      </Typography>

      <Stack spacing={1.5}>
        {reviewCards.map((card) => (
          <PreviewCard
            key={card.pageId}
            pageId={card.pageId}
            title={card.title}
            showSelfLabel={card.showSelfLabel}
            values={values}
            hasSpouse={hasSpouse}
            reviewFieldBlocklist={reviewFieldBlocklist}
            subQuestionFieldIds={subQuestionFieldIds}
            onEdit={onEdit}
          />
        ))}
      </Stack>
    </Stack>
  );
}

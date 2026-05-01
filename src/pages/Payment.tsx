import { Alert, Box, Card, Stack, Typography } from "@mui/material";
import FormRoutePage from "../components/form/FormRoutePage";
import FormSectionTitle from "../components/form/FormSectionTitle";
import FieldRenderer from "../components/form/FieldRenderer";
import { coverageCategories } from "../config/coverageCategories";
import type { CoverageCategoryId } from "../config/coverages/types";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { fieldCatalog } from "../config/fields";
import type { FieldDefinition, FieldId } from "../config/fields/types";

type AppliedProduct = {
  coverageId: string;
  categoryId: CoverageCategoryId;
  coverageName: string;
  applicants: Array<{
    key: string;
    applicant: string;
    amount: number;
  }>;
};

const paymentMethodOptions = [
  { value: "bill-me", label: "Bill me" },
  { value: "bank-account", label: "Bank account" },
] as const;

const paymentFrequencyOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semiannually", label: "Semiannually" },
  { value: "annually", label: "Annually" },
] as const;

const BANK_FIELD_IDS: FieldId[] = [
  "bank-name-on-account",
  "bank-institution",
  "bank-routing-number",
  "bank-account-number",
  "bank-authorization",
];

function toPositiveAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function estimateMonthlyPremium(
  categoryId: CoverageCategoryId,
  amount: number,
) {
  let raw: number;

  switch (categoryId) {
    case "LI":
      raw = (amount / 1000) * 0.12;
      break;
    case "AD":
      raw = (amount / 1000) * 0.05;
      break;
    case "DI":
      raw = amount * 0.02;
      break;
    case "OO":
      raw = amount * 0.018;
      break;
    case "SH":
      raw = amount * 0.01;
      break;
    default:
      raw = 0;
  }

  return Math.round(raw * 100) / 100;
}

function formatCurrency(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getApplicantLabel(applicant: string): string {
  if (applicant === "member") return "Self";
  if (applicant === "spouse") return "Spouse";
  if (applicant === "child") return "Child";
  return applicant;
}

function getAppliedProducts(values: Record<string, unknown>): AppliedProduct[] {
  const selectedCoverageIds = Array.isArray(values.coverageSelections)
    ? new Set(values.coverageSelections.map(String))
    : new Set<string>();

  const coverageAmounts =
    values.coverageAmounts &&
    typeof values.coverageAmounts === "object" &&
    !Array.isArray(values.coverageAmounts)
      ? (values.coverageAmounts as Record<string, unknown>)
      : {};

  const activeCoverages = getActiveClientCoverages();
  const coverageById = new Map(
    activeCoverages.map((coverage) => [coverage.id, coverage]),
  );

  const entries = Object.entries(coverageAmounts)
    .flatMap(([compoundKey, rawAmount]) => {
      const amount = toPositiveAmount(rawAmount);
      if (!amount) return [];

      const [coverageId, applicant] = compoundKey.split(":");
      if (!coverageId || !applicant) return [];

      if (
        selectedCoverageIds.size > 0 &&
        !selectedCoverageIds.has(coverageId)
      ) {
        return [];
      }

      const coverage = coverageById.get(coverageId);
      if (!coverage) return [];

      return [
        {
          key: compoundKey,
          coverageId,
          applicant,
          amount,
          categoryId: coverage.categoryId,
          coverageName: coverage.name,
        },
      ];
    })
    .sort((a, b) => {
      if (a.categoryId !== b.categoryId) {
        return a.categoryId.localeCompare(b.categoryId);
      }

      if (a.coverageName !== b.coverageName) {
        return a.coverageName.localeCompare(b.coverageName);
      }

      return a.applicant.localeCompare(b.applicant);
    });

  const grouped = new Map<string, AppliedProduct>();

  entries.forEach((entry) => {
    const existing = grouped.get(entry.coverageId);

    if (existing) {
      existing.applicants.push({
        key: entry.key,
        applicant: entry.applicant,
        amount: entry.amount,
      });
      return;
    }

    grouped.set(entry.coverageId, {
      coverageId: entry.coverageId,
      categoryId: entry.categoryId,
      coverageName: entry.coverageName,
      applicants: [
        {
          key: entry.key,
          applicant: entry.applicant,
          amount: entry.amount,
        },
      ],
    });
  });

  return [...grouped.values()].sort((a, b) =>
    a.coverageName.localeCompare(b.coverageName),
  );
}

function getPaymentDevFields(
  values: Record<string, unknown>,
): FieldDefinition[] {
  const appliedProducts = getAppliedProducts(values);
  const fields: FieldDefinition[] = [];

  const hasAnyBankAccountSelected = appliedProducts.some((product) => {
    const fieldId = `payment-method:${product.coverageId}`;
    return values[fieldId] === "bank-account";
  });

  for (const product of appliedProducts) {
    fields.push({
      id: `payment-method:${product.coverageId}`,
      label: "Payment Method",
      inputType: "radio",
      required: true,
      options: paymentMethodOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    });

    fields.push({
      id: `payment-frequency:${product.coverageId}`,
      label: "Payment Frequency",
      inputType: "radio",
      required: true,
      options: paymentFrequencyOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    });
  }

  if (hasAnyBankAccountSelected) {
    fields.push(...BANK_FIELD_IDS.map((fieldId) => fieldCatalog[fieldId]));
  }

  return fields;
}

export default function Payment() {
  return (
    <FormRoutePage
      pageId="payment"
      title="Choose how you'd like to pay for coverage. You won't be billed until you are approved for coverage."
      devFillFields={getPaymentDevFields}
    >
      {({ control, errors, watchedValues }) => {
        const values = watchedValues as Record<string, unknown>;
        const appliedProducts = getAppliedProducts(values);

        const groupedCategories = coverageCategories
          .map((category) => ({
            category,
            products: appliedProducts.filter(
              (product) => product.categoryId === category.id,
            ),
          }))
          .filter((group) => group.products.length > 0);

        const hasAnyBankAccountSelected = appliedProducts.some((product) => {
          const fieldId = `payment-method:${product.coverageId}`;
          return watchedValues[fieldId] === "bank-account";
        });

        return (
          <Stack spacing={2}>
            {groupedCategories.length === 0 ? (
              <Alert severity="info">
                No applied-for products were found. Return to coverage options
                to choose coverage and continue.
              </Alert>
            ) : (
              groupedCategories.map(({ category, products }) => {
                return (
                  <Stack key={category.id} spacing={1.25}>
                    <FormSectionTitle
                      icon={category.icon}
                      label={category.label}
                    />

                    {products.map((product) => {
                      const paymentMethodFieldId = `payment-method:${product.coverageId}`;
                      const paymentFrequencyFieldId = `payment-frequency:${product.coverageId}`;

                      const applicantPremiums = product.applicants.map(
                        (applicantEntry) => ({
                          applicant: applicantEntry.applicant,
                          premium: estimateMonthlyPremium(
                            product.categoryId,
                            applicantEntry.amount,
                          ),
                        }),
                      );

                      const totalPremium = applicantPremiums.reduce(
                        (sum, entry) => sum + entry.premium,
                        0,
                      );

                      const hasDependentBreakdown = applicantPremiums.some(
                        (entry) => entry.applicant !== "member",
                      );

                      return (
                        <Card
                          key={product.coverageId}
                          variant="outlined"
                          sx={{ p: 2 }}
                        >
                          <Stack spacing={1.5}>
                            <Typography fontWeight={700}>
                              {product.coverageName}
                            </Typography>

                            <FieldRenderer
                              field={{
                                id: paymentMethodFieldId,
                                label: "Payment Method",
                                inputType: "radio",
                                required: true,
                                options: paymentMethodOptions.map((option) => ({
                                  value: option.value,
                                  label: option.label,
                                })),
                              }}
                              control={control}
                              errors={errors}
                            />

                            <FieldRenderer
                              field={{
                                id: paymentFrequencyFieldId,
                                label: "Payment Frequency",
                                inputType: "radio",
                                required: true,
                                options: paymentFrequencyOptions.map(
                                  (option) => ({
                                    value: option.value,
                                    label: option.label,
                                  }),
                                ),
                              }}
                              control={control}
                              errors={errors}
                            />

                            <Box
                              sx={{
                                px: 1.5,
                                py: 1.25,
                                borderRadius: 1,
                                backgroundColor: "#f7f9fc",
                                border: "1px solid rgba(0, 22, 57, 0.08)",
                              }}
                            >
                              <Stack spacing={0.5}>
                                <Typography variant="body2" fontWeight={600}>
                                  Estimated Cost
                                  <Box
                                    component="sup"
                                    sx={{ fontSize: "0.8em" }}
                                  >
                                    1
                                  </Box>
                                </Typography>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Your estimated premium:{" "}
                                  <Box
                                    component="span"
                                    sx={{
                                      color: "primary.main",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {formatCurrency(totalPremium)}
                                  </Box>
                                </Typography>

                                {hasDependentBreakdown &&
                                  applicantPremiums.map((entry) => (
                                    <Typography
                                      key={entry.applicant}
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {getApplicantLabel(entry.applicant)}:{" "}
                                      {formatCurrency(entry.premium)}
                                    </Typography>
                                  ))}
                              </Stack>
                            </Box>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                );
              })
            )}

            {hasAnyBankAccountSelected && (
              <Card variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Typography variant="h6" sx={{ fontSize: "1rem" }}>
                    Bank Account Information
                  </Typography>

                  {BANK_FIELD_IDS.map((fieldId) => (
                    <FieldRenderer
                      key={fieldId}
                      field={fieldCatalog[fieldId]}
                      control={control}
                      errors={errors}
                    />
                  ))}
                </Stack>
              </Card>
            )}

            <Box sx={{ mt: 3, fontSize: "0.875rem", color: "text.secondary" }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  lineHeight: 1.6,
                }}
              >
                <Box component="sup" sx={{ fontSize: "0.8em", mr: 0.5 }}>
                  1
                </Box>
                Quoted cost is the best rate available based on the information
                you provided. Final cost may be based upon factors such as
                gender, health status, and use of tobacco/nicotine. Rates
                current as of 2026.
              </Typography>
            </Box>
          </Stack>
        );
      }}
    </FormRoutePage>
  );
}

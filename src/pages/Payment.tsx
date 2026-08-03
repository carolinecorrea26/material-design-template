import { useState } from "react";
import { Alert, Box, Divider, Stack, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { formatUSD as formatCurrency } from "../utils/formatUSD";
import ProductCard from "../components/layout/ProductCard";
import { estimateMonthlyPremium } from "../utils/estimateMonthlyPremium";
import FormRoutePage from "../app/RoutePage";
import SectionDivider from "../components/layout/SectionDivider";
import CategoryCard from "../components/layout/CategoryCard";

import FieldRenderer from "../components/forms/FieldRenderer";
import { getCoverageCategorySectionLabel } from "../config/coverageCategories";
import type { CoverageCategoryId } from "../config/coverages/types";
import { groupCoveragesByCategory } from "../utils/groupCoveragesByCategory";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { getActiveClient } from "../config/client/getActiveClient";
import { getClientPageRequirement } from "../config/client/getClientPageRequirement";
import { fieldCatalog } from "../config/fields";
import type { FieldDefinition, FieldId } from "../config/fields/types";
import { paymentHandlingHelpItem } from "../content/helpContent";
import FormHelpChips from "../components/content/HelpChips";
import AppDrawer from "../components/layout/AppDrawer";

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
  { value: "monthly", label: "Monthly", multiplier: 1 },
  { value: "quarterly", label: "Quarterly", multiplier: 3 },
  { value: "semiannually", label: "Semiannually", multiplier: 6 },
  { value: "annually", label: "Annually", multiplier: 12 },
] as const;

const BANK_FIELD_IDS: FieldId[] = [
  "bank-name-on-account",
  "bank-institution",
  "bank-routing-number",
  "bank-account-number",
  "bank-authorization",
];

const PAYMENT_INFO_OPT_IN_FIELD_ID = "payment-information-opt-in";

const paymentInfoOptInField: FieldDefinition = {
  id: PAYMENT_INFO_OPT_IN_FIELD_ID,
  label: "Do you want to add payment information?",
  inputType: "radio",
  required: true,
  options: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ],
};

function shouldShowPaymentQuestions(
  pageRequirement: "required" | "optional" | "none",
  values: Record<string, unknown>,
): boolean {
  if (pageRequirement !== "optional") {
    return true;
  }

  return values[PAYMENT_INFO_OPT_IN_FIELD_ID] === "yes";
}

function getPaymentPageError(
  pageRequirement: "required" | "optional" | "none",
  values: Record<string, unknown>,
): string | undefined {
  if (pageRequirement === "none") {
    return undefined;
  }

  if (
    pageRequirement === "optional" &&
    !shouldShowPaymentQuestions(pageRequirement, values)
  ) {
    return undefined;
  }

  const appliedProducts = getAppliedProducts(values);

  if (appliedProducts.length === 0) {
    return undefined;
  }

  const hasMissingPaymentInfo = appliedProducts.some((product) => {
    const paymentMethod = values[`payment-method:${product.coverageId}`];
    const paymentFrequency = values[`payment-frequency:${product.coverageId}`];

    return (
      typeof paymentMethod !== "string" ||
      paymentMethod.trim().length === 0 ||
      typeof paymentFrequency !== "string" ||
      paymentFrequency.trim().length === 0
    );
  });

  if (hasMissingPaymentInfo) {
    return "Please add payment information for all applicable products before continuing.";
  }

  return undefined;
}

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

function getApplicantLabel(applicant: string): string {
  if (applicant === "member") return "Self";
  if (applicant === "spouse") return "Spouse";
  if (applicant === "child") return "Child";
  return applicant;
}

function getFrequencyMultiplier(frequency: string): number {
  const option = paymentFrequencyOptions.find((o) => o.value === frequency);
  return option?.multiplier ?? 1;
}

function getFrequencyLabel(frequency: string): string {
  const option = paymentFrequencyOptions.find((o) => o.value === frequency);
  return option?.label ?? "Monthly";
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
  pageRequirement: "required" | "optional" | "none",
): FieldDefinition[] {
  if (pageRequirement === "none") {
    return [];
  }

  const fields: FieldDefinition[] = [];

  if (pageRequirement === "optional") {
    fields.push(paymentInfoOptInField);
  }

  if (!shouldShowPaymentQuestions(pageRequirement, values)) {
    return fields;
  }

  const appliedProducts = getAppliedProducts(values);

  const hasAnyBankAccountSelected = appliedProducts.some((product) => {
    const fieldId = `payment-method:${product.coverageId}`;
    return values[fieldId] === "bank-account";
  });

  for (const product of appliedProducts) {
    fields.push({
      id: `payment-method:${product.coverageId}`,
      label: "Payment Method",
      inputType: "radio",
      options: paymentMethodOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    });

    fields.push({
      id: `payment-frequency:${product.coverageId}`,
      label: "Payment Frequency",
      inputType: "dropdown",
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
  const pageRequirement = getClientPageRequirement("payment");
  const helpItems = [paymentHandlingHelpItem];
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const activeHelpItem =
    helpItems.find((item) => item.id === activeHelpId) ?? null;

  return (
    <FormRoutePage
      pageId="payment"
      devFillFields={(values) => getPaymentDevFields(values, pageRequirement)}
      validate={(values) =>
        getPaymentPageError(pageRequirement, values as Record<string, unknown>)
      }
      help={
        <>
          <FormHelpChips items={helpItems} onSelect={setActiveHelpId} />
          <AppDrawer
            open={!!activeHelpItem}
            title={activeHelpItem?.title ?? ""}
            onClose={() => setActiveHelpId(null)}
          >
            {activeHelpItem?.content}
          </AppDrawer>
        </>
      }
    >
      {({ control, errors, watchedValues }) => {
        const values = watchedValues as Record<string, unknown>;
        const categorySectionLabelOverrides =
          getActiveClient().coverages.categorySectionLabels;
        const showPaymentQuestions = shouldShowPaymentQuestions(
          pageRequirement,
          values,
        );
        const appliedProducts = getAppliedProducts(values);

        const groupedCategories = groupCoveragesByCategory(appliedProducts);

        const hasAnyBankAccountSelected = appliedProducts.some((product) => {
          const fieldId = `payment-method:${product.coverageId}`;
          return watchedValues[fieldId] === "bank-account";
        });

        return (
          <Stack spacing={2}>
            {pageRequirement === "optional" && (
              <FieldRenderer
                field={paymentInfoOptInField}
                control={control}
                errors={errors}
              />
            )}

            {pageRequirement === "optional" && showPaymentQuestions && (
              <Divider sx={{ my: 2 }} />
            )}

            {showPaymentQuestions && (
              <>
                <Alert
                  severity="warning"
                  icon={<InfoOutlinedIcon fontSize="inherit" />}
                  sx={{ alignItems: "flex-start" }}
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    You will not be charged yet.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Your payment information is collected as part of the
                    application but you will not be charged until and unless you
                    are approved for coverage. No money leaves your account
                    during the application process.
                  </Typography>
                </Alert>

                {groupedCategories.length === 0 ? (
                  <Alert severity="info">
                    No applied-for products were found. Return to coverage
                    options to choose coverage and continue.
                  </Alert>
                ) : (
                  groupedCategories.map(({ category, products }) => {
                    return (
                      <Stack key={category.id} spacing={1.5}>
                        <CategoryCard
                          label={getCoverageCategorySectionLabel(
                            category.id,
                            categorySectionLabelOverrides,
                          )}
                          icon={category.icon}
                        >
                          {products.map((product) => {
                            const paymentMethodFieldId = `payment-method:${product.coverageId}`;
                            const paymentFrequencyFieldId = `payment-frequency:${product.coverageId}`;
                            const selectedPaymentMethod = values[
                              paymentMethodFieldId
                            ] as string | undefined;

                            const selectedFrequency =
                              (values[paymentFrequencyFieldId] as string) ||
                              "monthly";
                            const frequencyMultiplier =
                              getFrequencyMultiplier(selectedFrequency);
                            const frequencyLabel =
                              getFrequencyLabel(selectedFrequency);

                            const applicantPremiums = product.applicants.map(
                              (applicantEntry) => ({
                                applicant: applicantEntry.applicant,
                                monthlyPremium: estimateMonthlyPremium(
                                  product.categoryId,
                                  applicantEntry.amount,
                                ),
                              }),
                            );

                            const totalMonthly = applicantPremiums.reduce(
                              (sum, entry) => sum + entry.monthlyPremium,
                              0,
                            );

                            const totalForFrequency =
                              totalMonthly * frequencyMultiplier;

                            const hasDependentBreakdown =
                              applicantPremiums.some(
                                (entry) => entry.applicant !== "member",
                              );

                            return (
                              <ProductCard key={product.coverageId}>
                                <Stack spacing={2}>
                                  <Typography variant="productNameLabel">
                                    {product.coverageName}
                                  </Typography>

                                  <FieldRenderer
                                    field={{
                                      id: paymentMethodFieldId,
                                      label: "Payment Method",
                                      inputType: "radio",
                                      options: paymentMethodOptions.map(
                                        (option) => ({
                                          value: option.value,
                                          label: option.label,
                                        }),
                                      ),
                                    }}
                                    control={control}
                                    errors={errors}
                                  />

                                  <FieldRenderer
                                    field={{
                                      id: paymentFrequencyFieldId,
                                      label: "Payment Frequency",
                                      inputType: "dropdown",
                                      placeholder: "Select frequency",
                                      disabled: !selectedPaymentMethod,
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
                                      mt: 0.5,
                                      pt: 1.5,
                                      borderTop: "1px solid",
                                      borderColor: "divider",
                                    }}
                                  >
                                    <Stack spacing={1.25}>
                                      {hasDependentBreakdown && (
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          Estimated{" "}
                                          {frequencyLabel.toLowerCase()} cost
                                        </Typography>
                                      )}

                                      {hasDependentBreakdown &&
                                        applicantPremiums.map((entry) => (
                                          <Stack
                                            key={entry.applicant}
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            spacing={1}
                                          >
                                            <Typography
                                              variant="subtitle2"
                                              color="text.secondary"
                                            >
                                              {getApplicantLabel(
                                                entry.applicant,
                                              )}
                                            </Typography>
                                            <Typography
                                              variant="subtitle2"
                                              fontWeight="bold"
                                              sx={{ whiteSpace: "nowrap" }}
                                            >
                                              {formatCurrency(
                                                entry.monthlyPremium *
                                                  frequencyMultiplier,
                                              )}
                                            </Typography>
                                          </Stack>
                                        ))}

                                      <Box
                                        sx={{
                                          borderTop: hasDependentBreakdown
                                            ? "1px solid"
                                            : "none",
                                          borderColor: "divider",
                                          pt: hasDependentBreakdown ? 1.25 : 0,
                                        }}
                                      >
                                        <Stack
                                          direction="row"
                                          justifyContent="space-between"
                                          alignItems="baseline"
                                        >
                                          <Typography variant="subtitle2">
                                            {hasDependentBreakdown
                                              ? "Total estimated cost"
                                              : `Estimated ${frequencyLabel.toLowerCase()} cost`}
                                            <sup>1</sup>
                                          </Typography>
                                          <Typography
                                            component="span"
                                            variant="subtitle2"
                                            fontWeight="bold"
                                            sx={{
                                              color: "primary.main",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {formatCurrency(totalForFrequency)}
                                          </Typography>
                                        </Stack>
                                      </Box>
                                    </Stack>
                                  </Box>
                                </Stack>
                              </ProductCard>
                            );
                          })}
                        </CategoryCard>
                      </Stack>
                    );
                  })
                )}

                {hasAnyBankAccountSelected && (
                  <Stack spacing={1.5} sx={{ pt: 1 }}>
                    <SectionDivider
                      label="Banking Information"
                      variant="subsection"
                    />

                    {BANK_FIELD_IDS.map((fieldId) => (
                      <FieldRenderer
                        key={fieldId}
                        field={fieldCatalog[fieldId]}
                        control={control}
                        errors={errors}
                      />
                    ))}
                  </Stack>
                )}

                <Box sx={{ mt: 3, color: "text.secondary" }}>
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
                    Quoted cost is the best rate available based on the
                    information you provided. Final cost may be based upon
                    factors such as gender, health status, and use of
                    tobacco/nicotine. Rates current as of 2026.
                  </Typography>
                </Box>
              </>
            )}
          </Stack>
        );
      }}
    </FormRoutePage>
  );
}

import { Controller } from "react-hook-form";
import {
  Alert,
  Box,
  Card,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FormRoutePage from "../components/form/FormRoutePage";
import FormSectionTitle from "../components/form/FormSectionTitle";
import FieldRenderer from "../components/form/FieldRenderer";
import { coverageCategories } from "../config/coverageCategories";
import type { CoverageCategoryId } from "../config/coverages/types";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import type { FieldDefinition } from "../config/fields/types";

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
      options: [
        { value: "bill-me", label: "Bill me" },
        { value: "bank-account", label: "Bank account" },
      ],
    } as FieldDefinition);

    fields.push({
      id: `payment-frequency:${product.coverageId}`,
      label: "Payment Frequency",
      inputType: "dropdown",
      required: true,
      options: [
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly" },
        { value: "semiannually", label: "Semiannually" },
        { value: "annually", label: "Annually" },
      ],
    } as FieldDefinition);
  }

  // Add bank account fields if any payment method is set to bank-account
  if (hasAnyBankAccountSelected) {
    fields.push({
      id: "payment-routing-number",
      label: "Routing Number",
      inputType: "text",
      required: true,
    } as FieldDefinition);

    fields.push({
      id: "payment-account-number",
      label: "Account Number",
      inputType: "text",
      required: true,
    } as FieldDefinition);

    fields.push({
      id: "payment-account-type",
      label: "Account Type",
      inputType: "dropdown",
      required: true,
      options: [
        { value: "checking", label: "Checking" },
        { value: "savings", label: "Savings" },
      ],
    } as FieldDefinition);

    fields.push({
      id: "bank-authorization",
      label: "Authorization",
      inputType: "checkbox",
      required: true,
    } as FieldDefinition);
  }

  return fields;
}

export default function Payment() {
  return (
    <FormRoutePage
      pageId="payment"
      title="Choose how you would like to pay for your coverage."
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
                      const productLabel = product.coverageName;
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
                              {productLabel}
                            </Typography>
                            <FieldRenderer
                              field={
                                {
                                  id: paymentMethodFieldId,
                                  label: "Payment Method",
                                  inputType: "radio",
                                  required: true,
                                  options: paymentMethodOptions.map(
                                    (option) => ({
                                      value: option.value,
                                      label: option.label,
                                    }),
                                  ),
                                } satisfies FieldDefinition
                              }
                              control={control}
                              errors={errors}
                            />

                            <FieldRenderer
                              field={
                                {
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
                                } satisfies FieldDefinition
                              }
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

                  <Controller
                    name="bank-name-on-account"
                    control={control}
                    rules={{
                      validate: (value) =>
                        !hasAnyBankAccountSelected ||
                        (typeof value === "string" &&
                          value.trim().length > 0) ||
                        "Name on Account is required.",
                    }}
                    render={({ field }) => (
                      <TextField
                        label="Name on Account"
                        fullWidth
                        value={(field.value as string) ?? ""}
                        onChange={field.onChange}
                        error={Boolean(errors["bank-name-on-account"])}
                        helperText={
                          (errors["bank-name-on-account"]?.message as string) ??
                          ""
                        }
                      />
                    )}
                  />

                  <Controller
                    name="bank-institution"
                    control={control}
                    rules={{
                      validate: (value) =>
                        !hasAnyBankAccountSelected ||
                        (typeof value === "string" &&
                          value.trim().length > 0) ||
                        "Bank Institution is required.",
                    }}
                    render={({ field }) => (
                      <TextField
                        label="Bank Institution"
                        fullWidth
                        value={(field.value as string) ?? ""}
                        onChange={field.onChange}
                        error={Boolean(errors["bank-institution"])}
                        helperText={
                          (errors["bank-institution"]?.message as string) ?? ""
                        }
                      />
                    )}
                  />

                  <Controller
                    name="bank-routing-number"
                    control={control}
                    rules={{
                      validate: (value) =>
                        !hasAnyBankAccountSelected ||
                        (typeof value === "string" &&
                          value.trim().length > 0) ||
                        "Routing Number is required.",
                    }}
                    render={({ field }) => (
                      <TextField
                        label="Routing Number"
                        fullWidth
                        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        value={(field.value as string) ?? ""}
                        onChange={(event) =>
                          field.onChange(event.target.value.replace(/\D/g, ""))
                        }
                        error={Boolean(errors["bank-routing-number"])}
                        helperText={
                          (errors["bank-routing-number"]?.message as string) ??
                          ""
                        }
                      />
                    )}
                  />

                  <Controller
                    name="bank-account-number"
                    control={control}
                    rules={{
                      validate: (value) =>
                        !hasAnyBankAccountSelected ||
                        (typeof value === "string" &&
                          value.trim().length > 0) ||
                        "Account Number is required.",
                    }}
                    render={({ field }) => (
                      <TextField
                        label="Account Number"
                        fullWidth
                        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        value={(field.value as string) ?? ""}
                        onChange={(event) =>
                          field.onChange(event.target.value.replace(/\D/g, ""))
                        }
                        error={Boolean(errors["bank-account-number"])}
                        helperText={
                          (errors["bank-account-number"]?.message as string) ??
                          ""
                        }
                      />
                    )}
                  />

                  <Controller
                    name="bank-authorization"
                    control={control}
                    rules={{
                      validate: (value) =>
                        !hasAnyBankAccountSelected ||
                        value === true ||
                        "Authorization is required.",
                    }}
                    render={({ field }) => (
                      <FormControl
                        required
                        error={Boolean(errors["bank-authorization"])}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={Boolean(field.value)}
                              onChange={(event) =>
                                field.onChange(event.target.checked)
                              }
                            />
                          }
                          label="I authorize recurring payments from this bank account."
                        />
                        <FormHelperText>
                          {(errors["bank-authorization"]?.message as string) ??
                            ""}
                        </FormHelperText>
                      </FormControl>
                    )}
                  />
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

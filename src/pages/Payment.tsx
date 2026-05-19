import {
  Alert,
  Autocomplete,
  Box,
  Card,
  FormControl,
  FormHelperText,
  FormLabel,
  Radio,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CreditCardOffOutlinedIcon from "@mui/icons-material/CreditCardOffOutlined";
import LoopRoundedIcon from "@mui/icons-material/LoopRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { Controller } from "react-hook-form";
import FormRoutePage from "../components/form/FormRoutePage";
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
  { value: "monthly", label: "Monthly", multiplier: 1 },
  { value: "quarterly", label: "Quarterly", multiplier: 3 },
  { value: "semiannually", label: "Semiannually", multiplier: 6 },
  { value: "annually", label: "Annually", multiplier: 12 },
] as const;

const COMMON_BANKS = [
  "Chase Bank",
  "Bank of America",
  "Wells Fargo",
  "American Express",
  "Key Bank",
  "Citibank",
  "Capital One",
  "US Bank",
  "PNC Bank",
  "TD Bank",
] as const;

const BANK_OPTIONS: string[] = [...COMMON_BANKS, "Other"];

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
  const helpItems = [
    {
      id: "payment-handling",
      label: "How is my payment information handled?",
      title: "How is my payment information handled?",
      content: (
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            We take the security of your payment information seriously. Here's
            how we handle it throughout the application process.
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <CreditCardOffOutlinedIcon
              sx={{
                color: "primary.main",
                fontSize: "2.5rem",
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Payment is not collected now
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your payment information is collected as part of the application
                but you will not be charged until and unless you are approved
                for coverage. No money leaves your account during the
                application process.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <LockOutlinedIcon
              sx={{
                color: "primary.main",
                fontSize: "2.5rem",
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Stored securely
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All payment data is encrypted in transit and at rest using
                industry-standard security protocols. Your information is stored
                in PCI-compliant systems and is never accessible in plain text.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <LoopRoundedIcon
              sx={{
                color: "primary.main",
                fontSize: "2.5rem",
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                How payment is processed
              </Typography>
              <Typography variant="body2" color="text.secondary">
                If your application is approved, payment will be processed
                according to the frequency you select (monthly, quarterly,
                semiannually, or annually). You&apos;ll receive confirmation
                before any charge is made.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <DeleteOutlineRoundedIcon
              sx={{
                color: "primary.main",
                fontSize: "2.5rem",
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Cancellation &amp; data purge
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can cancel your application at any time before approval with
                no obligation. All payment and application information is purged
                from our systems 10 days after submission if no action is taken
                or the application is not approved.
              </Typography>
            </Box>
          </Box>
        </Stack>
      ),
    },
  ];

  return (
    <FormRoutePage
      pageId="payment"
      title="Choose how you'd like to pay for coverage. You won't be billed until you are approved for coverage."
      devFillFields={getPaymentDevFields}
      helpItems={helpItems}
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
            <Alert
              severity="warning"
              icon={<InfoOutlinedIcon fontSize="inherit" />}
              sx={{ alignItems: "flex-start" }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                You will not be charged yet.
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Your payment information is collected as part of the application
                but you will not be charged until and unless you are approved
                for coverage. No money leaves your account during the
                application process.
              </Typography>
            </Alert>

            {groupedCategories.length === 0 ? (
              <Alert severity="info">
                No applied-for products were found. Return to coverage options
                to choose coverage and continue.
              </Alert>
            ) : (
              groupedCategories.map(({ category, products }) => {
                return (
                  <Stack key={category.id} spacing={1.25}>
                    {products.map((product) => {
                      const paymentMethodFieldId = `payment-method:${product.coverageId}`;
                      const paymentFrequencyFieldId = `payment-frequency:${product.coverageId}`;

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
                            <Typography
                              fontWeight={600}
                              sx={{ fontSize: "1rem" }}
                            >
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

                            <Controller
                              name={paymentFrequencyFieldId}
                              control={control}
                              rules={{
                                required: "Payment frequency is required",
                              }}
                              render={({ field: freqField }) => (
                                <FormControl
                                  fullWidth
                                  error={Boolean(
                                    errors[paymentFrequencyFieldId],
                                  )}
                                >
                                  <FormLabel
                                    required
                                    sx={{ display: "block", mb: 1 }}
                                  >
                                    Payment Frequency
                                  </FormLabel>
                                  <ToggleButtonGroup
                                    exclusive
                                    value={(freqField.value as string) ?? ""}
                                    onChange={(_, value) => {
                                      if (value !== null)
                                        freqField.onChange(value);
                                    }}
                                    sx={{
                                      display: "flex",
                                      flexDirection: "column",
                                      width: "100%",
                                      gap: 1,
                                      mt: 1,
                                    }}
                                  >
                                    {paymentFrequencyOptions.map((option) => (
                                      <ToggleButton
                                        key={option.value}
                                        value={option.value}
                                        sx={{
                                          width: "100%",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "flex-start",
                                          gap: 1.5,
                                          py: 1.5,
                                          textTransform: "none",
                                        }}
                                      >
                                        <Radio
                                          checked={
                                            freqField.value === option.value
                                          }
                                          size="small"
                                          sx={{ pointerEvents: "none" }}
                                        />
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            flex: 1,
                                          }}
                                        >
                                          <Typography variant="body2">
                                            {option.label}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ fontWeight: 600 }}
                                          >
                                            {formatCurrency(
                                              totalMonthly * option.multiplier,
                                            )}
                                          </Typography>
                                        </Box>
                                      </ToggleButton>
                                    ))}
                                  </ToggleButtonGroup>
                                  <FormHelperText>
                                    {(errors[paymentFrequencyFieldId]
                                      ?.message as string) ?? ""}
                                  </FormHelperText>
                                </FormControl>
                              )}
                            />

                            {/* Estimated cost styled like coverage cart total */}
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: "rgba(0, 22, 57, 0.04)",
                                border: "1px solid rgba(0, 22, 57, 0.08)",
                              }}
                            >
                              <Stack spacing={1}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 700 }}
                                >
                                  Estimated {frequencyLabel} Cost
                                  <Box
                                    component="sup"
                                    sx={{ fontSize: "0.7em", ml: 0.25 }}
                                  >
                                    1
                                  </Box>
                                </Typography>

                                <Typography
                                  variant="h5"
                                  sx={{
                                    fontWeight: 700,
                                    color: "primary.main",
                                  }}
                                >
                                  {formatCurrency(totalForFrequency)}
                                </Typography>

                                {hasDependentBreakdown && (
                                  <Stack spacing={0.5}>
                                    {applicantPremiums.map((entry) => (
                                      <Typography
                                        key={entry.applicant}
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {getApplicantLabel(entry.applicant)}:{" "}
                                        {formatCurrency(
                                          entry.monthlyPremium *
                                            frequencyMultiplier,
                                        )}
                                      </Typography>
                                    ))}
                                  </Stack>
                                )}

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ mt: 0.5, fontStyle: "italic" }}
                                >
                                  Quoted cost is the best rate available. Final
                                  cost may vary based on health status, gender,
                                  and tobacco/nicotine use.
                                </Typography>
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

                  {/* Bank institution autocomplete — at the top */}
                  <Controller
                    name="bank-institution"
                    control={control}
                    rules={{ required: "Bank institution is required" }}
                    render={({ field: controllerField }) => (
                      <Autocomplete
                        freeSolo
                        options={BANK_OPTIONS}
                        value={(controllerField.value as string) || null}
                        onChange={(_, newValue) => {
                          controllerField.onChange(newValue ?? "");
                        }}
                        onInputChange={(_, newInputValue) => {
                          controllerField.onChange(newInputValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Bank / Institution"
                            required
                            error={Boolean(errors["bank-institution"])}
                            helperText={
                              errors["bank-institution"]
                                ? String(
                                    errors["bank-institution"]?.message ?? "",
                                  )
                                : "Search or select your bank"
                            }
                          />
                        )}
                      />
                    )}
                  />

                  {BANK_FIELD_IDS.filter(
                    (fieldId) => fieldId !== "bank-institution",
                  ).map((fieldId) => (
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

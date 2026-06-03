import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  InputLabel,
  ListSubheader,
  MenuItem,
  Radio,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { getActiveClient } from "../client/getActiveClient";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { fieldCatalog } from "../config/fields";
import { coverageCategories } from "../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
  CoverageDefinition,
} from "../config/coverages/types";
import FieldRenderer from "../components/form/FieldRenderer";
import FormRoutePage from "../components/form/FormRoutePage";
import FormPageHelp from "../components/form/FormPageHelp";
import {
  coverageOptionsAvailableHelpItem,
  groupInsuranceHelpItem,
  howApplyingWorksHelpItem,
} from "../content/helpContent";
import {
  deriveStateProvinceFromZipOrPostalCode,
  formatZipOrPostalCode,
} from "../utils/zipToStateProvince";
import { formatUSD } from "../utils/formatUSD";
import { estimateMonthlyPremium } from "../utils/estimateMonthlyPremium";
import { generateAmountChoices } from "../utils/generateAmountChoices";
import {
  parseStoredDate,
  formatDateForStorage,
  formatDateDisplay,
} from "../utils/dateFormatting";

type EstimateGender = "male" | "female" | "";
type EstimateYesNo = "yes" | "no" | "";
type EstimateState = {
  birthday: string;
  zipCode: string;
  state: string;
  productId: string;
  gender: EstimateGender;
  smoker: EstimateYesNo;
  tobaccoLastUsed: string;
  tobaccoProducts: string[];
  avgIncome: string;
  hoursPerWeek: string;
  monthlyExpenses: string;
  responsibilityPct: string;
};

function getBenefitAmountLabel(categoryId: CoverageCategoryId): string {
  if (categoryId === "DI" || categoryId === "OO") {
    return "Monthly Benefit Amount";
  }

  return "Coverage Amount";
}

function getApplicantLabel(applicant: CoverageApplicantId): string {
  if (applicant === "member") return "Member";
  if (applicant === "spouse") return "Spouse";
  return "Child";
}

function getStateOptions() {
  const options = fieldCatalog["state-province"].options ?? [];
  return options;
}

export default function Membership() {
  const client = getActiveClient();
  const pageId = "membership";
  const coverages = useMemo(() => getActiveClientCoverages(), []);

  const [estimateValues, setEstimateValues] = useState<EstimateState>({
    birthday: "",
    zipCode: "",
    state: "",
    productId: "",
    gender: "",
    smoker: "",
    tobaccoLastUsed: "",
    tobaccoProducts: [],
    avgIncome: "",
    hoursPerWeek: "",
    monthlyExpenses: "",
    responsibilityPct: "",
  });
  const [estimateAttempted, setEstimateAttempted] = useState(false);
  const [showEstimateProducts, setShowEstimateProducts] = useState(false);

  const [estimateAmountsByProductId, setEstimateAmountsByProductId] = useState<
    Record<string, number>
  >({});
  const [estimateRatesByProductId, setEstimateRatesByProductId] = useState<
    Record<string, number>
  >({});

  const stateOptions = useMemo(() => getStateOptions(), []);

  useEffect(() => {
    const derived = deriveStateProvinceFromZipOrPostalCode(
      estimateValues.zipCode,
      stateOptions,
    );
    if (derived && derived !== estimateValues.state) {
      setEstimateValues((current) => ({ ...current, state: derived }));
    }
  }, [estimateValues.zipCode, stateOptions, estimateValues.state]);

  const productsByCategory = useMemo(
    () =>
      coverageCategories
        .map((category) => ({
          category,
          products: coverages
            .filter((coverage) => coverage.categoryId === category.id)
            .slice()
            .sort((a, b) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              return a.name.localeCompare(b.name);
            }),
        }))
        .filter((group) => group.products.length > 0),
    [coverages],
  );

  const selectedProduct = useMemo(
    () =>
      coverages.find((coverage) => coverage.id === estimateValues.productId),
    [coverages, estimateValues.productId],
  );

  const selectedCategoryId = selectedProduct?.categoryId ?? null;

  const estimateCategoryNeedsGender =
    selectedCategoryId === "LI" || selectedCategoryId === "DI";
  const estimateCategoryNeedsSmoker =
    selectedCategoryId === "LI" || selectedCategoryId === "SH";
  const estimateCategoryNeedsDi = selectedCategoryId === "DI";
  const estimateCategoryNeedsOo = selectedCategoryId === "OO";
  const estimateCategoryNeedsHours =
    estimateCategoryNeedsDi || estimateCategoryNeedsOo;

  const estimateProductsToShow = selectedProduct ? [selectedProduct] : [];

  const estimateValidationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!estimateValues.birthday) {
      errors.birthday = "Date of birth is required.";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(estimateValues.birthday)) {
      errors.birthday = "Enter a complete date (MM/DD/YYYY).";
    }

    if (!estimateValues.zipCode) {
      errors.zipCode = "ZIP / postal code is required.";
    }

    if (!estimateValues.state) {
      errors.state = "State is required.";
    }

    if (!estimateValues.productId) {
      errors.productId = "Product selection is required.";
    }

    if (estimateCategoryNeedsGender && !estimateValues.gender) {
      errors.gender = "Gender is required.";
    }

    if (estimateCategoryNeedsSmoker && !estimateValues.smoker) {
      errors.smoker = "Please select an option.";
    }

    if (estimateCategoryNeedsDi && !estimateValues.avgIncome) {
      errors.avgIncome = "Average monthly income is required.";
    }

    if (estimateCategoryNeedsHours && !estimateValues.hoursPerWeek) {
      errors.hoursPerWeek = "Hours worked per week is required.";
    }

    if (estimateCategoryNeedsOo && !estimateValues.monthlyExpenses) {
      errors.monthlyExpenses = "Monthly business expenses are required.";
    }

    if (estimateCategoryNeedsOo && !estimateValues.responsibilityPct) {
      errors.responsibilityPct = "Responsibility percentage is required.";
    }

    return errors;
  }, [
    estimateCategoryNeedsDi,
    estimateCategoryNeedsGender,
    estimateCategoryNeedsHours,
    estimateCategoryNeedsOo,
    estimateCategoryNeedsSmoker,
    estimateValues,
  ]);

  function resetEstimateResults() {
    setShowEstimateProducts(false);
    setEstimateAmountsByProductId({});
    setEstimateRatesByProductId({});
  }

  function updateEstimateValues(nextValues: Partial<EstimateState>) {
    setEstimateValues((current) => ({
      ...current,
      ...nextValues,
    }));
    resetEstimateResults();
  }

  function handleEstimateProductChange(nextProductId: string) {
    setEstimateValues((current) => ({
      ...current,
      productId: nextProductId,
      gender: "",
      smoker: "",
      tobaccoLastUsed: "",
      tobaccoProducts: [],
      avgIncome: "",
      hoursPerWeek: "",
      monthlyExpenses: "",
      responsibilityPct: "",
    }));
    resetEstimateResults();
  }

  function handleGetEstimate() {
    setEstimateAttempted(true);

    if (Object.keys(estimateValidationErrors).length > 0 || !selectedProduct) {
      setShowEstimateProducts(false);
      return;
    }

    const choices = generateAmountChoices(
      selectedProduct.categoryId,
      selectedProduct.minAmount,
      selectedProduct.maxAmount,
    );
    const initialAmount = choices[0] ?? 0;
    const initialRate = estimateMonthlyPremium(
      selectedProduct.categoryId,
      initialAmount,
    );

    setEstimateAmountsByProductId({ [selectedProduct.id]: initialAmount });
    setEstimateRatesByProductId({ [selectedProduct.id]: initialRate });
    setShowEstimateProducts(true);
  }

  function handleEstimateAmountChange(
    product: CoverageDefinition,
    amount: number,
  ) {
    setEstimateAmountsByProductId((current) => ({
      ...current,
      [product.id]: amount,
    }));

    setEstimateRatesByProductId((current) => ({
      ...current,
      [product.id]: estimateMonthlyPremium(product.categoryId, amount),
    }));
  }

  const helpItems = [
    coverageOptionsAvailableHelpItem,
    groupInsuranceHelpItem(client.branding.name),
    howApplyingWorksHelpItem,
    {
      id: "estimate-cost",
      label: "How much does it cost?",
      title: "How much does it cost?",
      content: (
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Enter a few details to view available coverage options and estimated
            costs.
          </Typography>

          <TextField
            label="Date of Birth"
            fullWidth
            required
            value={parseStoredDate(estimateValues.birthday)}
            onChange={(event) => {
              const formatted = formatDateDisplay(event.target.value);
              const digits = formatted.replace(/\D/g, "");
              if (digits.length === 8) {
                updateEstimateValues({
                  birthday: formatDateForStorage(formatted),
                });
              } else {
                updateEstimateValues({ birthday: formatted });
              }
            }}
            inputProps={{ inputMode: "numeric" }}
            error={estimateAttempted && !!estimateValidationErrors.birthday}
            helperText={
              estimateAttempted && estimateValidationErrors.birthday
                ? estimateValidationErrors.birthday
                : "MM/DD/YYYY"
            }
          />

          <TextField
            label="ZIP / Postal Code"
            fullWidth
            required
            value={estimateValues.zipCode}
            onChange={(event) =>
              updateEstimateValues({
                zipCode: formatZipOrPostalCode(event.target.value),
              })
            }
            inputProps={{ inputMode: "text", maxLength: 7 }}
            error={estimateAttempted && !!estimateValidationErrors.zipCode}
            helperText={
              estimateAttempted
                ? estimateValidationErrors.zipCode || undefined
                : undefined
            }
          />

          <FormControl
            fullWidth
            required
            error={estimateAttempted && !!estimateValidationErrors.state}
          >
            <InputLabel id="estimate-state-label">State</InputLabel>
            <Select
              labelId="estimate-state-label"
              label="State"
              value={estimateValues.state}
              onChange={(event) =>
                updateEstimateValues({ state: event.target.value })
              }
            >
              {stateOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {estimateAttempted && estimateValidationErrors.state ? (
              <FormHelperText>{estimateValidationErrors.state}</FormHelperText>
            ) : null}
          </FormControl>

          <FormControl
            fullWidth
            required
            error={estimateAttempted && !!estimateValidationErrors.productId}
          >
            <FormLabel
              required
              sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}
            >
              What coverage are you interested in?
            </FormLabel>
            <Select
              displayEmpty
              value={estimateValues.productId}
              onChange={(event) =>
                handleEstimateProductChange(event.target.value)
              }
              renderValue={(value) => {
                if (!value) return <em>Select a product</em>;
                const product = coverages.find((c) => c.id === value);
                return product?.name ?? value;
              }}
            >
              {productsByCategory.flatMap((group) => [
                <ListSubheader
                  key={`${group.category.id}-header`}
                  disableSticky
                  sx={{
                    color: "text.primary",
                    fontWeight: 700,
                    lineHeight: 1.6,
                    backgroundColor: "#ffffff",
                  }}
                >
                  {group.category.label}
                </ListSubheader>,
                ...group.products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                )),
              ])}
            </Select>
            {estimateAttempted && estimateValidationErrors.productId ? (
              <FormHelperText>
                {estimateValidationErrors.productId}
              </FormHelperText>
            ) : null}
          </FormControl>

          {estimateCategoryNeedsGender ? (
            <FormControl
              fullWidth
              required
              error={estimateAttempted && !!estimateValidationErrors.gender}
            >
              <FormLabel required sx={{ mb: 1 }}>
                Gender
              </FormLabel>
              <ToggleButtonGroup
                exclusive
                value={estimateValues.gender}
                onChange={(_, value) => {
                  if (value !== null) {
                    updateEstimateValues({ gender: value as EstimateGender });
                  }
                }}
                sx={{ display: "flex", gap: 1 }}
              >
                <ToggleButton
                  value="male"
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    gap: 1,
                    justifyContent: "flex-start",
                  }}
                >
                  <Radio
                    checked={estimateValues.gender === "male"}
                    size="small"
                    sx={{ p: 0 }}
                  />
                  Male
                </ToggleButton>
                <ToggleButton
                  value="female"
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    gap: 1,
                    justifyContent: "flex-start",
                  }}
                >
                  <Radio
                    checked={estimateValues.gender === "female"}
                    size="small"
                    sx={{ p: 0 }}
                  />
                  Female
                </ToggleButton>
              </ToggleButtonGroup>
              {estimateAttempted && estimateValidationErrors.gender ? (
                <FormHelperText>
                  {estimateValidationErrors.gender}
                </FormHelperText>
              ) : null}
            </FormControl>
          ) : null}

          {estimateCategoryNeedsSmoker ? (
            <FormControl
              fullWidth
              required
              error={estimateAttempted && !!estimateValidationErrors.smoker}
            >
              <FormLabel required sx={{ mb: 1 }}>
                Do you use nicotine products?
              </FormLabel>
              <ToggleButtonGroup
                exclusive
                value={estimateValues.smoker}
                onChange={(_, value) => {
                  if (value !== null) {
                    updateEstimateValues({
                      smoker: value as EstimateYesNo,
                    });
                  }
                }}
                sx={{ display: "flex", gap: 1 }}
              >
                <ToggleButton
                  value="yes"
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    gap: 1,
                    justifyContent: "flex-start",
                  }}
                >
                  <Radio
                    checked={estimateValues.smoker === "yes"}
                    size="small"
                    sx={{ p: 0 }}
                  />
                  Yes
                </ToggleButton>
                <ToggleButton
                  value="no"
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    gap: 1,
                    justifyContent: "flex-start",
                  }}
                >
                  <Radio
                    checked={estimateValues.smoker === "no"}
                    size="small"
                    sx={{ p: 0 }}
                  />
                  No
                </ToggleButton>
              </ToggleButtonGroup>
              {estimateAttempted && estimateValidationErrors.smoker ? (
                <FormHelperText>
                  {estimateValidationErrors.smoker}
                </FormHelperText>
              ) : null}
            </FormControl>
          ) : null}

          {estimateCategoryNeedsDi ? (
            <TextField
              label="Average monthly income"
              fullWidth
              required
              value={estimateValues.avgIncome}
              onChange={(event) =>
                updateEstimateValues({
                  avgIncome: event.target.value.replace(/[^0-9]/g, ""),
                })
              }
              error={estimateAttempted && !!estimateValidationErrors.avgIncome}
              helperText={
                estimateAttempted
                  ? estimateValidationErrors.avgIncome || " "
                  : " "
              }
            />
          ) : null}

          {estimateCategoryNeedsHours ? (
            <TextField
              label="Hours worked per week"
              fullWidth
              required
              value={estimateValues.hoursPerWeek}
              onChange={(event) =>
                updateEstimateValues({
                  hoursPerWeek: event.target.value.replace(/[^0-9]/g, ""),
                })
              }
              error={
                estimateAttempted && !!estimateValidationErrors.hoursPerWeek
              }
              helperText={
                estimateAttempted
                  ? estimateValidationErrors.hoursPerWeek || " "
                  : " "
              }
            />
          ) : null}

          {estimateCategoryNeedsOo ? (
            <>
              <TextField
                label="Average monthly business expenses"
                fullWidth
                required
                value={estimateValues.monthlyExpenses}
                onChange={(event) =>
                  updateEstimateValues({
                    monthlyExpenses: event.target.value.replace(/[^0-9]/g, ""),
                  })
                }
                error={
                  estimateAttempted &&
                  !!estimateValidationErrors.monthlyExpenses
                }
                helperText={
                  estimateAttempted
                    ? estimateValidationErrors.monthlyExpenses || " "
                    : " "
                }
              />

              <TextField
                label="% you are responsible for"
                fullWidth
                required
                value={estimateValues.responsibilityPct}
                onChange={(event) => {
                  const digits = event.target.value.replace(/[^0-9]/g, "");
                  const normalized = digits
                    ? Math.min(parseInt(digits, 10), 100).toString()
                    : "";
                  updateEstimateValues({
                    responsibilityPct: normalized,
                  });
                }}
                error={
                  estimateAttempted &&
                  !!estimateValidationErrors.responsibilityPct
                }
                helperText={
                  estimateAttempted
                    ? estimateValidationErrors.responsibilityPct || " "
                    : " "
                }
              />
            </>
          ) : null}

          <Button variant="contained" onClick={handleGetEstimate}>
            Get estimate
          </Button>

          {showEstimateProducts ? (
            <Stack spacing={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Selected product
              </Typography>

              {estimateProductsToShow.length === 0 ? (
                <Alert severity="info">
                  No products are currently available for this selection.
                </Alert>
              ) : (
                estimateProductsToShow.map((product) => {
                  const amountChoices = generateAmountChoices(
                    product.categoryId,
                    product.minAmount,
                    product.maxAmount,
                  );
                  const selectedAmount =
                    estimateAmountsByProductId[product.id] ??
                    amountChoices[0] ??
                    0;
                  const estimatedRate =
                    estimateRatesByProductId[product.id] ?? 0;

                  return (
                    <Box
                      key={product.id}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 2,
                        backgroundColor: "background.paper",
                      }}
                    >
                      <Stack spacing={1.5}>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {product.description ?? product.definition}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Available for{" "}
                            {product.applicants
                              .map((applicant) => getApplicantLabel(applicant))
                              .join(", ")}
                          </Typography>
                        </Stack>

                        <FormControl fullWidth size="small">
                          <InputLabel id={`${product.id}-amount-label`}>
                            {getBenefitAmountLabel(product.categoryId)}
                          </InputLabel>
                          <Select
                            labelId={`${product.id}-amount-label`}
                            label={getBenefitAmountLabel(product.categoryId)}
                            value={selectedAmount}
                            onChange={(event) =>
                              handleEstimateAmountChange(
                                product,
                                Number(event.target.value),
                              )
                            }
                          >
                            {amountChoices.map((amount) => (
                              <MenuItem key={amount} value={amount}>
                                {formatUSD(amount, 0)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="body2" color="text.secondary">
                            Estimated monthly rate
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ color: "success.main", fontWeight: 700 }}
                          >
                            {formatUSD(estimatedRate)}/mo
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  );
                })
              )}

              <Typography variant="caption" color="text.secondary">
                Quoted cost is the best rate available based on the information
                entered and is for illustrative purposes only.
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      ),
    },
  ];

  return (
    <FormRoutePage
      pageId={pageId}
      help={<FormPageHelp items={helpItems} />}
      initialTransitionMessage="Loading your membership application..."
    >
      {({ control, errors, watchedValues, allFields }) => {
        const membershipField = allFields.find(
          (field) => field.id === "membership",
        );
        const remainingFields = allFields.filter(
          (field) => field.id !== "membership",
        );

        const membershipValue = watchedValues.membership;

        const showMembershipIneligibleAlert =
          client.id !== "ama" &&
          client.id !== "waepa" &&
          membershipValue === "no";

        const showMembershipFollowUpFields =
          client.id === "ama"
            ? Boolean(membershipValue)
            : client.id === "waepa"
              ? membershipValue === "current" || membershipValue === "new"
              : membershipValue === "yes";

        const hasTitleField = remainingFields.some(
          (field) => field.id === "title",
        );

        return (
          <>
            {membershipField && (
              <FieldRenderer
                key={membershipField.id}
                field={membershipField}
                control={control}
                errors={errors}
              />
            )}

            {showMembershipIneligibleAlert && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="body2">
                    Membership is required to apply for coverage through{" "}
                    {client.branding.name}. If you&apos;re unsure of your
                    membership status, here are some ways to confirm:
                  </Typography>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      Check your membership
                    </Typography>
                    <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
                      <Typography component="li" variant="body2">
                        Look for a membership card or welcome email from your
                        association.
                      </Typography>
                      <Typography component="li" variant="body2">
                        Check if you receive association newsletters, journals,
                        or other member communications.
                      </Typography>
                      <Typography component="li" variant="body2">
                        Log in to your association&apos;s member portal to
                        verify your status.
                      </Typography>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      Not yet a member?
                    </Typography>
                    <Typography variant="body2">
                      You can apply for membership with your association to
                      become eligible for coverage. Contact{" "}
                      {client.branding.name}
                      or visit your association&apos;s website to learn about
                      membership options and how to join.
                    </Typography>
                  </Box>

                  {client.support.website && (
                    <Typography variant="body2">
                      For more information, visit{" "}
                      <Typography
                        component="a"
                        href={`https://${client.support.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: "primary.main",
                          textDecoration: "underline",
                          font: "inherit",
                        }}
                      >
                        {client.support.website}
                      </Typography>{" "}
                      or call {client.support.phoneDisplay}.
                    </Typography>
                  )}
                </Stack>
              </Alert>
            )}

            {showMembershipFollowUpFields && (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: hasTitleField ? "120px 1fr 1fr" : "1fr 1fr",
                    },
                    gap: { xs: 0, sm: 2 },
                  }}
                >
                  {remainingFields
                    .filter((field) =>
                      ["title", "first-name", "last-name"].includes(field.id),
                    )
                    .map((field) => (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        control={control}
                        errors={errors}
                      />
                    ))}
                </Box>

                {remainingFields
                  .filter(
                    (field) =>
                      !["title", "first-name", "last-name"].includes(field.id),
                  )
                  .map((field) => (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      control={control}
                      errors={errors}
                    />
                  ))}
              </>
            )}
          </>
        );
      }}
    </FormRoutePage>
  );
}

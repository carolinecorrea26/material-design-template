import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import ContentPasteSearchRoundedIcon from "@mui/icons-material/ContentPasteSearchRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import { getActiveClient } from "../client/getActiveClient";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { getPageTitle } from "../config/pages";
import { fieldCatalog } from "../config/fields";
import { coverageCategories } from "../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
  CoverageDefinition,
} from "../config/coverages/types";
import FieldRenderer from "../components/form/FieldRenderer";
import FormRoutePage from "../components/form/FormRoutePage";

type EstimateGender = "male" | "female" | "";
type EstimateYesNo = "yes" | "no" | "";
type EstimateState = {
  birthday: string;
  state: string;
  category: CoverageCategoryId | "";
  gender: EstimateGender;
  smoker: EstimateYesNo;
  tobaccoLastUsed: string;
  tobaccoProducts: string[];
  avgIncome: string;
  hoursPerWeek: string;
  monthlyExpenses: string;
  responsibilityPct: string;
};

const TOBACCO_PRODUCT_OPTIONS = [
  "Cigarettes",
  "Cigars",
  "Pipe",
  "Chewing tobacco",
  "Nicotine gum or patch",
  "E-cigarettes or vaping",
];

function formatUSD(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function generateAmountChoices(
  categoryId: CoverageCategoryId,
  minAmount?: number,
  maxAmount?: number,
): number[] {
  if (minAmount != null && maxAmount != null) {
    let step: number;

    if (categoryId === "LI" || categoryId === "AD") {
      step = 25000;
    } else if (categoryId === "DI" || categoryId === "OO") {
      step = 500;
    } else {
      step = maxAmount <= 1000 ? 50 : 500;
    }

    const choices = new Set<number>([minAmount, maxAmount]);
    for (let value = minAmount; value <= maxAmount; value += step) {
      choices.add(value);
    }

    return [...choices].sort((a, b) => a - b);
  }

  if (categoryId === "LI" || categoryId === "AD") {
    return [25000, 50000, 100000, 250000, 500000];
  }

  if (categoryId === "DI" || categoryId === "OO") {
    return [500, 1000, 1500, 2000, 2500, 3000];
  }

  return [100, 250, 500, 1000];
}

function estimateMonthlyPremium(
  categoryId: CoverageCategoryId,
  amount: number,
): number {
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
    state: "",
    category: "",
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
  const availableEstimateCategories = useMemo(() => {
    const availableIds = new Set(
      coverages.map((coverage) => coverage.categoryId),
    );
    return coverageCategories.filter((category) =>
      availableIds.has(category.id),
    );
  }, [coverages]);

  const estimateCategoryNeedsGender =
    estimateValues.category === "LI" || estimateValues.category === "DI";
  const estimateCategoryNeedsSmoker =
    estimateValues.category === "LI" || estimateValues.category === "SH";
  const estimateCategoryNeedsDi = estimateValues.category === "DI";
  const estimateCategoryNeedsOo = estimateValues.category === "OO";
  const estimateCategoryNeedsHours =
    estimateCategoryNeedsDi || estimateCategoryNeedsOo;

  const estimateCategoryProducts = useMemo(
    () =>
      estimateValues.category
        ? coverages.filter(
            (coverage) => coverage.categoryId === estimateValues.category,
          )
        : [],
    [coverages, estimateValues.category],
  );

  const estimateValidationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!estimateValues.birthday) {
      errors.birthday = "Birthday is required.";
    }

    if (!estimateValues.state) {
      errors.state = "State is required.";
    }

    if (!estimateValues.category) {
      errors.category = "Coverage category is required.";
    }

    if (estimateCategoryNeedsGender && !estimateValues.gender) {
      errors.gender = "Gender is required.";
    }

    if (estimateCategoryNeedsSmoker && !estimateValues.smoker) {
      errors.smoker = "Please select an option.";
    }

    if (estimateCategoryNeedsSmoker && estimateValues.smoker === "yes") {
      if (!estimateValues.tobaccoLastUsed) {
        errors.tobaccoLastUsed = "Last used date is required.";
      }

      if (estimateValues.tobaccoProducts.length === 0) {
        errors.tobaccoProducts = "Select at least one tobacco product.";
      }
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

  function handleEstimateCategoryChange(nextCategory: CoverageCategoryId | "") {
    setEstimateValues((current) => ({
      ...current,
      category: nextCategory,
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

    if (Object.keys(estimateValidationErrors).length > 0) {
      setShowEstimateProducts(false);
      return;
    }

    const initialAmounts = estimateCategoryProducts.reduce<
      Record<string, number>
    >((acc, product) => {
      const choices = generateAmountChoices(
        product.categoryId,
        product.minAmount,
        product.maxAmount,
      );
      acc[product.id] = choices[0] ?? 0;
      return acc;
    }, {});

    const initialRates = estimateCategoryProducts.reduce<
      Record<string, number>
    >((acc, product) => {
      const amount = initialAmounts[product.id] ?? 0;
      acc[product.id] = estimateMonthlyPremium(product.categoryId, amount);
      return acc;
    }, {});

    setEstimateAmountsByProductId(initialAmounts);
    setEstimateRatesByProductId(initialRates);
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
    {
      id: "application-process",
      label: "How does applying work?",
      title: "How does applying work?",
      content: (
        <Stack spacing={3}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <EditNoteRoundedIcon
              sx={{
                color: "primary.main",
                fontSize: "2.5rem",
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Apply online in about 20 minutes.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Answer a few questions and submit your application securely.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <ContentPasteSearchRoundedIcon
              sx={{
                color: "primary.main",
                fontSize: "2.5rem",
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Your application will be reviewed.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Once your application is submitted, it will be reviewed. This
                may happen in real time or take a few days depending on the
                coverage you apply for. In some cases, you may also need to
                answer health-related questions before a decision can be made.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <VerifiedUserRoundedIcon
              sx={{
                color: "primary.main",
                fontSize: "2.5rem",
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Receive your application decision.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Once all information is reviewed, you&apos;ll be notified of
                your decision. If approved, you will receive a certificate of
                insurance and have a 30-day no-obligation free look. When
                QuickDecision
                <sup>SM</sup> is available, you may receive a faster decision,
                often without a medical exam.
              </Typography>
            </Box>
          </Box>

          <Divider />

          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              About the application review process
            </Typography>

            <Typography variant="body2" color="text.secondary">
              When you apply for coverage, the underwriting team reviews your
              application to make a decision.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Depending on the coverage you&apos;re applying for and the
              information you provide, you may be asked to answer some
              health-related questions. This helps evaluate eligibility and
              determine the best rate for you.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              The review process typically takes a few business days, but with
              QuickDecision
              <sup>SM</sup>, many applications can be approved faster without
              requiring a medical exam.
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      id: "estimate-cost",
      label: "How much does it cost?",
      title: "How much does it cost?",
      content: (
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Enter a few details to view available products and estimated
            coverage amounts.
          </Typography>

          <TextField
            label="Birthday"
            type="date"
            fullWidth
            required
            value={estimateValues.birthday}
            onChange={(event) =>
              updateEstimateValues({ birthday: event.target.value })
            }
            InputLabelProps={{ shrink: true }}
            error={estimateAttempted && !!estimateValidationErrors.birthday}
            helperText={
              estimateAttempted ? estimateValidationErrors.birthday || " " : " "
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
            error={estimateAttempted && !!estimateValidationErrors.category}
          >
            <InputLabel id="estimate-category-label">
              Coverage category
            </InputLabel>
            <Select
              labelId="estimate-category-label"
              label="Coverage category"
              value={estimateValues.category}
              onChange={(event) =>
                handleEstimateCategoryChange(
                  (event.target.value as CoverageCategoryId | "") ?? "",
                )
              }
            >
              {availableEstimateCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.label}
                </MenuItem>
              ))}
            </Select>
            {estimateAttempted && estimateValidationErrors.category ? (
              <FormHelperText>
                {estimateValidationErrors.category}
              </FormHelperText>
            ) : null}
          </FormControl>

          {estimateCategoryNeedsGender ? (
            <FormControl
              fullWidth
              required
              error={estimateAttempted && !!estimateValidationErrors.gender}
            >
              <InputLabel id="estimate-gender-label">Gender</InputLabel>
              <Select
                labelId="estimate-gender-label"
                label="Gender"
                value={estimateValues.gender}
                onChange={(event) =>
                  updateEstimateValues({
                    gender: event.target.value as EstimateGender,
                  })
                }
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
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
              <InputLabel id="estimate-smoker-label">
                Tobacco or nicotine use
              </InputLabel>
              <Select
                labelId="estimate-smoker-label"
                label="Tobacco or nicotine use"
                value={estimateValues.smoker}
                onChange={(event) =>
                  updateEstimateValues({
                    smoker: event.target.value as EstimateYesNo,
                    tobaccoLastUsed:
                      event.target.value === "yes"
                        ? estimateValues.tobaccoLastUsed
                        : "",
                    tobaccoProducts:
                      event.target.value === "yes"
                        ? estimateValues.tobaccoProducts
                        : [],
                  })
                }
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
              {estimateAttempted && estimateValidationErrors.smoker ? (
                <FormHelperText>
                  {estimateValidationErrors.smoker}
                </FormHelperText>
              ) : null}
            </FormControl>
          ) : null}

          {estimateCategoryNeedsSmoker && estimateValues.smoker === "yes" ? (
            <>
              <TextField
                label="Last used date"
                type="date"
                fullWidth
                required
                value={estimateValues.tobaccoLastUsed}
                onChange={(event) =>
                  updateEstimateValues({ tobaccoLastUsed: event.target.value })
                }
                InputLabelProps={{ shrink: true }}
                error={
                  estimateAttempted &&
                  !!estimateValidationErrors.tobaccoLastUsed
                }
                helperText={
                  estimateAttempted
                    ? estimateValidationErrors.tobaccoLastUsed || " "
                    : " "
                }
              />

              <FormControl
                fullWidth
                required
                error={
                  estimateAttempted &&
                  !!estimateValidationErrors.tobaccoProducts
                }
              >
                <InputLabel id="estimate-tobacco-products-label">
                  Tobacco products used
                </InputLabel>
                <Select
                  labelId="estimate-tobacco-products-label"
                  label="Tobacco products used"
                  multiple
                  value={estimateValues.tobaccoProducts}
                  onChange={(event) =>
                    updateEstimateValues({
                      tobaccoProducts:
                        typeof event.target.value === "string"
                          ? event.target.value.split(",")
                          : event.target.value,
                    })
                  }
                  renderValue={(selected) => selected.join(", ")}
                >
                  {TOBACCO_PRODUCT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      <Checkbox
                        checked={estimateValues.tobaccoProducts.includes(
                          option,
                        )}
                        size="small"
                      />
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {estimateAttempted &&
                estimateValidationErrors.tobaccoProducts ? (
                  <FormHelperText>
                    {estimateValidationErrors.tobaccoProducts}
                  </FormHelperText>
                ) : null}
              </FormControl>
            </>
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
                Available products
              </Typography>

              {estimateCategoryProducts.length === 0 ? (
                <Alert severity="info">
                  No products are currently available for this coverage
                  category.
                </Alert>
              ) : (
                estimateCategoryProducts.map((product) => {
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
      title={getPageTitle(pageId)}
      helpItems={helpItems}
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
                You must be an active member to continue with this application.
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

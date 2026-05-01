import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
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
      errors.birthday = "Birthday is required.";
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
            error={estimateAttempted && !!estimateValidationErrors.productId}
          >
            <InputLabel id="membership-estimate-product-label">
              Product
            </InputLabel>
            <Select
              labelId="membership-estimate-product-label"
              label="Product"
              value={estimateValues.productId}
              onChange={(event) =>
                handleEstimateProductChange(event.target.value)
              }
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
                Tobacco or nicotine use
              </FormLabel>
              <ToggleButtonGroup
                exclusive
                value={estimateValues.smoker}
                onChange={(_, value) => {
                  if (value !== null) {
                    updateEstimateValues({
                      smoker: value as EstimateYesNo,
                      tobaccoLastUsed:
                        value === "yes" ? estimateValues.tobaccoLastUsed : "",
                      tobaccoProducts:
                        value === "yes" ? estimateValues.tobaccoProducts : [],
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

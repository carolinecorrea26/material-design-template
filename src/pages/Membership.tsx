import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  InputLabel,
  Link,
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
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
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
import FormHelpDrawer from "../components/form/FormHelpDrawer";
import QuickDecisionDrawerContent from "../components/common/QuickDecisionDrawerContent";
import {
  deriveStateProvinceFromZipOrPostalCode,
  formatZipOrPostalCode,
} from "../utils/zipToStateProvince";

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

type CoverageProductGroup = {
  category: (typeof coverageCategories)[number];
  products: CoverageDefinition[];
};

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

function parseStoredDate(value: string): string {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function formatDateForStorage(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 8) return "";
  const mm = digits.slice(0, 2);
  const dd = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function InlineDrawerLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Typography
      component="span"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      sx={{
        display: "inline",
        color: "primary.main",
        font: "inherit",
        lineHeight: "inherit",
        textDecoration: "underline",
        textUnderlineOffset: "0.12em",
        cursor: "pointer",
      }}
    >
      {children}
    </Typography>
  );
}

function QuickDecisionMark() {
  return (
    <>
      QuickDecision
      <Box component="sup" sx={{ fontSize: "0.6em", lineHeight: 1 }}>
        SM
      </Box>
    </>
  );
}

const APPLYING_STEPS = [
  {
    id: 0,
    title: "Apply online",
    body: "Complete our online application to apply for coverage that fits your needs. You'll be able to review your options and see your estimated cost.",
    imageSrc: "/1-apply.svg",
    imageAlt: "Apply online",
  },
  {
    id: 1,
    title: "Answer health questions",
    body: "Many types of insurance require health information to provide a decision on your application. We may ask health questions on your application or a representative of New York Life or their medical service provider may contact you to collect your health history. If needed, we will schedule a medical exam at no cost to you and at a time and place convenient to you.",
    imageSrc: "/2-medical.svg",
    imageAlt: "Answer health questions",
  },
  {
    id: 2,
    title: "Get a decision",
    body: "Decisions are made after all information is received and reviewed by New York Life. If approved, you will receive a certificate of insurance and have a 30-day no-obligation free look. Plus, when QuickDecision SM is available, you can get a faster decision on your application, typically with no medical exam.",
    imageSrc: "/3-decision.svg",
    imageAlt: "Get a decision",
  },
] as const;

function HowApplyingWorksDrawerContent() {
  type SubDrawerId = "application-review" | "quick-decision" | null;
  const [subDrawer, setSubDrawer] = useState<SubDrawerId>(null);

  return (
    <>
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          This online experience is designed to help you complete your
          application quickly and easily.
        </Typography>

        {APPLYING_STEPS.map((step) => (
          <Stack
            key={step.id}
            direction="row"
            spacing={2}
            alignItems="flex-start"
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {step.title}
              </Typography>
              {step.id === 1 ? (
                <Typography variant="body2" color="text.secondary">
                  Many types of insurance require health information to provide
                  a decision on your application. We may ask health questions on
                  your application or a representative of New York Life or their
                  medical service provider may contact you to collect your
                  health history. If needed, we will schedule a medical exam at
                  no cost to you and at a time and place convenient to you.{" "}
                  <InlineDrawerLink
                    onClick={() => setSubDrawer("application-review")}
                  >
                    Learn more about the application review process.
                  </InlineDrawerLink>
                </Typography>
              ) : step.id === 2 ? (
                <Typography variant="body2" color="text.secondary">
                  Decisions are made after all information is received and
                  reviewed by New York Life. If approved, you will receive a
                  certificate of insurance and have a 30-day no-obligation free
                  look. Plus, when{" "}
                  <InlineDrawerLink
                    onClick={() => setSubDrawer("quick-decision")}
                  >
                    <QuickDecisionMark />
                  </InlineDrawerLink>{" "}
                  is available, you can get a faster decision on your
                  application, typically with no medical exam.
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {step.body}
                </Typography>
              )}
            </Box>
          </Stack>
        ))}
      </Stack>

      <FormHelpDrawer
        open={subDrawer !== null}
        title={
          subDrawer === "application-review"
            ? "Application review process"
            : "QuickDecision"
        }
        onClose={() => setSubDrawer(null)}
      >
        {subDrawer === "application-review" ? (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              During the application review process, also known as underwriting,
              our team will review your application to provide a decision on
              your application.
            </Typography>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                What to expect
              </Typography>
              <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  A medical service provider may contact you to confirm details
                  about your health.
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  A medical exam may be scheduled if needed at no cost to you
                  and at a time and place convenient to you.
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  We may also request additional information, such as
                  prescription history, financial information, medical records
                  from your physician(s), and/or medical claims history.
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  Any forms needing your signature will be sent securely via
                  DocuSign.
                </Typography>
              </Stack>
            </Box>

            <Typography variant="body2" color="text.secondary">
              The review process typically takes a few business days, but with{" "}
              <InlineDrawerLink onClick={() => setSubDrawer("quick-decision")}>
                <QuickDecisionMark />
              </InlineDrawerLink>
              , many applications can get a real-time decision, often without
              requiring a medical exam.
            </Typography>
          </Stack>
        ) : (
          <QuickDecisionDrawerContent />
        )}
      </FormHelpDrawer>
    </>
  );
}

function GroupInsuranceDrawerContent({
  associationName,
}: {
  associationName: string;
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        With group insurance through {associationName}, eligible applicants can
        take advantage of specially negotiated rates made available through the
        group.
      </Typography>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Explore available group insurance options
        </Typography>

        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
          <Typography component="li" variant="body2" color="text.secondary">
            Group rates may be available to eligible applicants through their
            association or sponsoring organization.
          </Typography>

          <Typography component="li" variant="body2" color="text.secondary">
            Because eligibility and coverage needs can vary, the application
            helps confirm which products, coverage amounts, and rates are
            available for each applicant.
          </Typography>

          <Typography component="li" variant="body2" color="text.secondary">
            Availability and rates may vary based on state, eligibility,
            underwriting requirements, coverage selected, and other application
            details.{" "}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}

function CoverageProductsDrawerContent({
  productsByCategory,
}: {
  productsByCategory: CoverageProductGroup[];
}) {
  return (
    <Stack spacing={2.25}>
      <Typography variant="body2" color="text.secondary">
        These products are available through this group. You can review and
        select coverage options later in the application.
      </Typography>

      <Stack spacing={2}>
        {productsByCategory.map(({ category, products }) => (
          <Box key={category.id}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
              {category.label}
            </Typography>

            <Stack spacing={0.75}>
              {products.map((product) => (
                <Link
                  key={product.id}
                  href="#"
                  underline="hover"
                  onClick={(event) => event.preventDefault()}
                  sx={{
                    width: "fit-content",
                    color: "primary.main",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    lineHeight: 1.35,
                    textUnderlineOffset: "0.15em",
                  }}
                >
                  {product.name}
                </Link>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
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
  const [isCoverageProductsDrawerOpen, setIsCoverageProductsDrawerOpen] =
    useState(false);
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

  const coverageCategorySummary = productsByCategory
    .map(({ category }) => category.label)
    .join(" · ");

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
    {
      id: "group-insurance",
      label: "What is group insurance?",
      title: "What is group insurance?",
      content: (
        <GroupInsuranceDrawerContent associationName={client.branding.name} />
      ),
    },
    {
      id: "application-process",
      label: "How does applying work?",
      title: "How does applying work?",
      content: <HowApplyingWorksDrawerContent />,
    },
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
      title={getPageTitle(pageId)}
      helpItems={helpItems}
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
            <Box
              sx={{
                width: "100%",
                borderRadius: "22px",
                background: "rgb(231, 240, 255)",
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1.5, sm: 1.75 },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "9999px",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    color: "primary.main",
                    backgroundColor: "rgba(6, 104, 255, 0.1)",
                  }}
                >
                  <ShieldOutlinedIcon fontSize="small" />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.25,
                      mb: 0.25,
                    }}
                  >
                    Available {client.branding.acronym}-sponsored coverage
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: "#5c6572",
                      lineHeight: 1.45,
                    }}
                  >
                    {coverageCategorySummary || "Coverage options"}{" "}
                    {productsByCategory.length > 0 ? (
                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        onClick={() => setIsCoverageProductsDrawerOpen(true)}
                        sx={{
                          ml: 0.5,
                          color: "primary.main",
                          font: "inherit",
                          fontWeight: 600,
                          textUnderlineOffset: "0.15em",
                          cursor: "pointer",
                          border: 0,
                          background: "transparent",
                          p: 0,
                          verticalAlign: "baseline",
                        }}
                      >
                        View products
                      </Link>
                    ) : null}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <FormHelpDrawer
              open={isCoverageProductsDrawerOpen}
              title="Available coverage products"
              onClose={() => setIsCoverageProductsDrawerOpen(false)}
            >
              <CoverageProductsDrawerContent
                productsByCategory={productsByCategory}
              />
            </FormHelpDrawer>

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

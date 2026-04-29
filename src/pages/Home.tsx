import { useEffect, useMemo, useState, type ReactNode } from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { AnimatePresence, motion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  Link,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import FormHelpDrawer from "../components/form/FormHelpDrawer";
import { getActiveClient } from "../client/getActiveClient";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { coverageCategories } from "../config/coverageCategories";
import type {
  CoverageApplicantId,
  CoverageCategoryId,
  CoverageDefinition,
} from "../config/coverages/types";
import { fieldCatalog } from "../config/fields";
import { getPagePath } from "../config/pages";

type EstimateGender = "male" | "female" | "";
type EstimateYesNo = "yes" | "no" | "";
type DrawerId = "application-review" | "quick-decision" | null;

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

type AboutCardContent = {
  title: string;
  subtitle?: string;
  paragraphs: string[];
};

const SHOW_QUOTE_TOOL = true;
const PAGE_MAX_WIDTH = 1180;
const STEP_DURATION = 10000;

const TOBACCO_PRODUCT_OPTIONS = [
  "Cigarettes",
  "Cigars",
  "Pipe",
  "Chewing tobacco",
  "Nicotine gum or patch",
  "E-cigarettes or vaping",
];

const SURFACE_SX = {
  border: "1px solid rgba(52, 59, 72, 0.10)",
  borderRadius: 4,
  backgroundColor: "#ffffff",
  boxShadow: "0 18px 40px rgba(52, 59, 72, 0.06)",
};

const CATEGORY_DESCRIPTIONS: Record<CoverageCategoryId, string> = {
  LI: "Life coverage can help provide financial protection for the people who depend on you.",
  AD: "Accidental death and dismemberment coverage can help protect against covered accidental loss or injury.",
  DI: "Disability coverage can help replace income if a covered disability affects your ability to work.",
  OO: "Office overhead coverage can help keep eligible business expenses paid during a covered disability.",
  SH: "Supplemental health coverage can help with out-of-pocket costs tied to covered health events.",
};

const NYL_ABOUT_CONTENT: AboutCardContent = {
  title: "New York Life Insurance Company",
  subtitle: "A trusted name for over 180 years",
  paragraphs: [
    "At the heart of New York Life is a commitment to be there for customers when they need us, whether today or decades into the future.",
    "New York Life has received the highest financial strength ratings currently awarded to any U.S. life insurer, helping give customers confidence in the promises behind their coverage.",
  ],
};

const ASSOCIATION_ABOUT_CONTENT: Partial<Record<string, AboutCardContent>> = {
  ama: {
    title: "AMA Insurance",
    subtitle: "Helping physicians protect what matters most",
    paragraphs: [
      "For more than 50 years, AMA-sponsored insurance has helped protect physicians and their families.",
      "As a subsidiary of the American Medical Association, AMA Insurance uses the group buying power of more than one million physicians to offer specially negotiated rates and tailored benefits from top insurance companies.",
    ],
  },
};

const APPLYING_STEPS = [
  {
    id: 0,
    number: "1",
    title: "Apply online",
    body: "Get an instant quote and submit your application in minutes.",
    icon: EditOutlinedIcon,
  },
  {
    id: 1,
    number: "2",
    title: "Provide medical info",
    body: "Many types of insurance require health information to provide a decision on your application. We may ask health questions on your application or a representative of New York Life or their medical service provider may contact you to collect your health history. If needed, we will schedule a medical exam at no cost to you and at a time and place convenient to you.",
    icon: FavoriteBorderRoundedIcon,
  },
  {
    id: 2,
    number: "3",
    title: "Get a decision",
    body: "Decisions are made after all information is received and reviewed by New York Life. If approved, you will receive a certificate of insurance and have a 30-day no-obligation free look. Plus, when QuickDecisionSM is available, you can get a faster decision on your application, typically with no medical exam.",
    icon: TaskAltRoundedIcon,
  },
] as const;

function formatUSD(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCoverageRange(coverage: CoverageDefinition) {
  if (coverage.minAmount == null && coverage.maxAmount == null) {
    return "Coverage amount varies by selection.";
  }

  if (coverage.minAmount != null && coverage.maxAmount != null) {
    return `${formatUSD(coverage.minAmount, 0)} - ${formatUSD(
      coverage.maxAmount,
      0,
    )}`;
  }

  if (coverage.minAmount != null) {
    return `Starting at ${formatUSD(coverage.minAmount, 0)}`;
  }

  return `Up to ${formatUSD(coverage.maxAmount ?? 0, 0)}`;
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
  let raw = 0;

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
  }

  return Math.round(raw * 100) / 100;
}

function getEstimateAmountLabel(categoryId: CoverageCategoryId): string {
  return categoryId === "DI" || categoryId === "OO"
    ? "Monthly benefit amount"
    : "Coverage amount";
}

function getApplicantLabel(applicant: CoverageApplicantId): string {
  if (applicant === "member") return "Member";
  if (applicant === "spouse") return "Spouse";
  return "Child";
}

function getStateOptions() {
  return fieldCatalog["state-province"].options ?? [];
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

function HowApplyingWorksSection({
  onOpenApplicationReview,
  onOpenQuickDecision,
}: {
  onOpenApplicationReview: () => void;
  onOpenQuickDecision: () => void;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveStep((current) => (current + 1) % APPLYING_STEPS.length);
      setProgressKey((current) => current + 1);
    }, STEP_DURATION);

    return () => window.clearTimeout(timeout);
  }, [activeStep]);

  const active = useMemo(() => APPLYING_STEPS[activeStep], [activeStep]);
  const ActiveIcon = active.icon;

  return (
    <Stack spacing={2.5}>
      <Stack spacing={1} sx={{ maxWidth: 760 }}>
        <Typography variant="h2">How applying online works</Typography>
        <Typography variant="body1" color="text.secondary">
          The online process is designed to help you move quickly while still
          giving New York Life the information needed to review your
          application.
        </Typography>
      </Stack>

      <Box>
        <Stack spacing={{ xs: 3, md: 4 }}>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Stack spacing={3}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 3,
                }}
              >
                {APPLYING_STEPS.map((step) => {
                  const isActive = step.id === activeStep;
                  const isComplete = step.id < activeStep;

                  return (
                    <Button
                      key={step.id}
                      variant="text"
                      onClick={() => {
                        setActiveStep(step.id);
                        setProgressKey((current) => current + 1);
                      }}
                      sx={{
                        minWidth: 0,
                        p: 0,
                        textTransform: "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        color: "inherit",
                        "&:hover": { backgroundColor: "transparent" },
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          border: "2px solid",
                          borderColor: isActive
                            ? "primary.main"
                            : isComplete
                              ? "rgba(7, 104, 255, 0.18)"
                              : "rgba(52, 59, 72, 0.16)",
                          backgroundColor: isActive
                            ? "primary.main"
                            : isComplete
                              ? "rgba(7, 104, 255, 0.08)"
                              : "#ffffff",
                          color: isActive
                            ? "#ffffff"
                            : isComplete
                              ? "primary.main"
                              : "text.secondary",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.375rem",
                          fontWeight: 700,
                          boxShadow: isActive
                            ? "0 12px 28px rgba(7, 104, 255, 0.18)"
                            : "none",
                          transition: "all 200ms ease",
                        }}
                      >
                        {step.number}
                      </Box>

                      <Typography
                        sx={{
                          mt: 1.5,
                          maxWidth: 180,
                          fontWeight: 600,
                          fontSize: "1rem",
                          color: isActive ? "text.primary" : "text.secondary",
                          textAlign: "center",
                        }}
                      >
                        {step.title}
                      </Typography>
                    </Button>
                  );
                })}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 3,
                  px: 1,
                }}
              >
                {APPLYING_STEPS.map((step) => {
                  const isComplete = step.id < activeStep;
                  const isActive = step.id === activeStep;

                  return (
                    <Box
                      key={`progress-${step.id}`}
                      sx={{
                        height: 3,
                        borderRadius: 999,
                        overflow: "hidden",
                        backgroundColor: "rgba(52, 59, 72, 0.14)",
                        position: "relative",
                      }}
                    >
                      {isComplete ? (
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 999,
                            backgroundColor: "primary.main",
                          }}
                        />
                      ) : null}

                      {isActive ? (
                        <motion.div
                          key={`${progressKey}-${step.id}`}
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: STEP_DURATION / 1000,
                            ease: "linear",
                          }}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            borderRadius: 999,
                            backgroundColor: "#0768ff",
                            transformOrigin: "left center",
                          }}
                        />
                      ) : null}
                    </Box>
                  );
                })}
              </Box>
            </Stack>
          </Box>

          <Box sx={{ display: { xs: "block", md: "none" } }}>
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 1.5,
                }}
              >
                {APPLYING_STEPS.map((step) => {
                  const isActive = step.id === activeStep;
                  const isComplete = step.id < activeStep;

                  return (
                    <Button
                      key={step.id}
                      variant="text"
                      onClick={() => {
                        setActiveStep(step.id);
                        setProgressKey((current) => current + 1);
                      }}
                      sx={{
                        minWidth: 0,
                        p: 0,
                        textTransform: "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        color: "inherit",
                        "&:hover": { backgroundColor: "transparent" },
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          border: "2px solid",
                          borderColor: isActive
                            ? "primary.main"
                            : isComplete
                              ? "rgba(7, 104, 255, 0.18)"
                              : "rgba(52, 59, 72, 0.16)",
                          backgroundColor: isActive
                            ? "primary.main"
                            : isComplete
                              ? "rgba(7, 104, 255, 0.08)"
                              : "#ffffff",
                          color: isActive
                            ? "#ffffff"
                            : isComplete
                              ? "primary.main"
                              : "text.secondary",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          fontWeight: 700,
                          boxShadow: isActive
                            ? "0 10px 24px rgba(7, 104, 255, 0.18)"
                            : "none",
                          transition: "all 200ms ease",
                        }}
                      >
                        {step.number}
                      </Box>

                      <Typography
                        sx={{
                          mt: 1,
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          lineHeight: 1.25,
                          color: isActive ? "text.primary" : "text.secondary",
                          textAlign: "center",
                        }}
                      >
                        {step.title}
                      </Typography>
                    </Button>
                  );
                })}
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 1.5,
                }}
              >
                {APPLYING_STEPS.map((step) => {
                  const isComplete = step.id < activeStep;
                  const isActive = step.id === activeStep;

                  return (
                    <Box
                      key={`mobile-progress-${step.id}`}
                      sx={{
                        height: 6,
                        borderRadius: 999,
                        overflow: "hidden",
                        backgroundColor: "rgba(52, 59, 72, 0.14)",
                        position: "relative",
                      }}
                    >
                      {isComplete ? (
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 999,
                            backgroundColor: "primary.main",
                          }}
                        />
                      ) : null}

                      {isActive ? (
                        <motion.div
                          key={`mobile-${progressKey}-${step.id}`}
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: STEP_DURATION / 1000,
                            ease: "linear",
                          }}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            borderRadius: 999,
                            backgroundColor: "#0768ff",
                            transformOrigin: "left center",
                          }}
                        />
                      ) : null}
                    </Box>
                  );
                })}
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              ...SURFACE_SX,
              borderRadius: 4,
              p: { xs: 2.5, md: 3.5 },
              background:
                "linear-gradient(135deg, rgba(244, 248, 255, 0.96) 0%, rgba(255, 255, 255, 1) 52%, rgba(247, 251, 255, 1) 100%)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 3, md: 4 }}
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box
                sx={{
                  width: { xs: 96, md: 120 },
                  height: { xs: 96, md: 120 },
                  borderRadius: "50%",
                  backgroundColor: "rgba(7, 104, 255, 0.10)",
                  color: "primary.main",
                  border: "1px solid rgba(7, 104, 255, 0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  alignSelf: { xs: "center", md: "center" },
                }}
              >
                <motion.div
                  key={`icon-${active.id}`}
                  animate={{ y: [0, -6, 0], scale: [1, 1.05, 1] }}
                  transition={{
                    duration: 1.6,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                >
                  <ActiveIcon sx={{ fontSize: { xs: 40, md: 52 } }} />
                </motion.div>
              </Box>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{ width: "100%" }}
                >
                  <Stack spacing={1.5}>
                    {/* <Box
                      sx={{
                        display: "inline-flex",
                        width: "fit-content",
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 999,
                        backgroundColor: "rgba(7, 104, 255, 0.10)",
                        color: "primary.main",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Step {active.number}
                    </Box> */}

                    <Typography variant="h4">{active.title}</Typography>

                    {active.id === 1 ? (
                      <Typography variant="body1" color="text.secondary">
                        Many types of insurance require health information to
                        provide a decision on your application. We may ask
                        health questions on your application or a representative
                        of New York Life or their medical service provider may
                        contact you to collect your health history. If needed,
                        we will schedule a medical exam at no cost to you and at
                        a time and place convenient to you.{" "}
                        <InlineDrawerLink onClick={onOpenApplicationReview}>
                          Learn more about the application review process.
                        </InlineDrawerLink>
                      </Typography>
                    ) : active.id === 2 ? (
                      <Typography variant="body1" color="text.secondary">
                        Decisions are made after all information is received and
                        reviewed by New York Life. If approved, you will receive
                        a certificate of insurance and have a 30-day
                        no-obligation free look. Plus, when{" "}
                        <InlineDrawerLink onClick={onOpenQuickDecision}>
                          <QuickDecisionMark />
                        </InlineDrawerLink>{" "}
                        is available, you can get a faster decision on your
                        application, typically with no medical exam.
                      </Typography>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        {active.body}
                      </Typography>
                    )}
                  </Stack>
                </motion.div>
              </AnimatePresence>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}

function HomeQuoteCard() {
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const stateOptions = useMemo(() => getStateOptions(), []);

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

    if (!estimateValues.birthday) errors.birthday = "Birthday is required.";
    if (!estimateValues.state) errors.state = "State is required.";
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
      errors.monthlyExpenses =
        "Average monthly business expenses are required.";
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
    setEstimateValues((current) => ({ ...current, ...nextValues }));
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

  return (
    <Box
      sx={{
        ...SURFACE_SX,
        width: "100%",
        borderColor: "rgba(7, 104, 255, 0.14)",
        background:
          "linear-gradient(135deg, #f4f8ff 0%, #ffffff 52%, #f7fbff 100%)",
      }}
    >
      <Stack spacing={2.25} sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Stack spacing={0.75}>
          <Typography
            variant="h2"
            paddingBottom={1}
            sx={{
              fontSize: {
                xs: "1.5rem",
                sm: "1.5rem",
                md: "1.5rem",
                lg: "2rem",
              },
            }}
          >
            Get an instant quote.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            See coverage options, monthly premiums, and exclusive group rates in
            minutes.
          </Typography>
        </Stack>

        <Stack spacing={1.25}>
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
            <InputLabel id="home-estimate-state-label">State</InputLabel>
            <Select
              labelId="home-estimate-state-label"
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
            <InputLabel id="home-estimate-product-label">Product</InputLabel>
            <Select
              labelId="home-estimate-product-label"
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
              <InputLabel id="home-estimate-gender-label">Gender</InputLabel>
              <Select
                labelId="home-estimate-gender-label"
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
              <InputLabel id="home-estimate-smoker-label">
                Tobacco or nicotine use
              </InputLabel>
              <Select
                labelId="home-estimate-smoker-label"
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
                <InputLabel id="home-estimate-tobacco-products-label">
                  Tobacco products used
                </InputLabel>
                <Select
                  labelId="home-estimate-tobacco-products-label"
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
                  updateEstimateValues({ responsibilityPct: normalized });
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
        </Stack>

        <Stack spacing={1}>
          <Button variant="outlined" size="large" onClick={handleGetEstimate}>
            Get estimate
          </Button>
          <Typography variant="caption" color="text.secondary">
            Estimates are illustrative only and based on the information
            entered.
          </Typography>
        </Stack>

        {showEstimateProducts ? (
          <Stack spacing={1.25}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
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
                const estimatedRate = estimateRatesByProductId[product.id] ?? 0;

                return (
                  <Box
                    key={product.id}
                    sx={{
                      border: "1px solid rgba(52, 59, 72, 0.12)",
                      borderRadius: 3,
                      backgroundColor: "#ffffff",
                      p: 2,
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.description ?? product.definition}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {coverageCategories.find(
                            (category) => category.id === product.categoryId,
                          )?.label ?? product.categoryId}{" "}
                          · Available for{" "}
                          {product.applicants.map(getApplicantLabel).join(", ")}
                        </Typography>
                      </Stack>

                      <FormControl fullWidth size="small">
                        <InputLabel id={`${product.id}-home-amount-label`}>
                          {getEstimateAmountLabel(product.categoryId)}
                        </InputLabel>
                        <Select
                          labelId={`${product.id}-home-amount-label`}
                          label={getEstimateAmountLabel(product.categoryId)}
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
                        gap={2}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Estimated monthly rate
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "success.main" }}
                        >
                          {formatUSD(estimatedRate)}/mo
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })
            )}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

export default function Home() {
  const client = getActiveClient();
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeDrawer, setActiveDrawer] = useState<DrawerId>(null);
  const [activeCoverageCategory, setActiveCoverageCategory] =
    useState<CoverageCategoryId>("LI");

  const coverageGroups = useMemo(
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

  useEffect(() => {
    if (coverageGroups.length === 0) return;

    const nextDefault = coverageGroups.some(
      (group) => group.category.id === "LI",
    )
      ? "LI"
      : coverageGroups[0].category.id;

    const hasActive = coverageGroups.some(
      (group) => group.category.id === activeCoverageCategory,
    );

    if (!hasActive) {
      setActiveCoverageCategory(nextDefault);
    }
  }, [activeCoverageCategory, coverageGroups]);

  const activeCoverageGroup =
    coverageGroups.find(
      (group) => group.category.id === activeCoverageCategory,
    ) ?? coverageGroups[0];

  const associationContent = ASSOCIATION_ABOUT_CONTENT[client.id] ?? null;

  const drawerTitle: ReactNode =
    activeDrawer === "application-review" ? (
      "About the application review process"
    ) : (
      <>
        What is <QuickDecisionMark />?
      </>
    );

  return (
    <Box sx={{ width: "100%", flex: 1 }}>
      <Stack
        spacing={{ xs: 5, md: 7 }}
        sx={{
          width: "100%",
          maxWidth: PAGE_MAX_WIDTH,
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 1.5, md: 3 },
          pb: { xs: 4, md: 6 },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: SHOW_QUOTE_TOOL
              ? { xs: "1fr", md: "minmax(0, 500px) minmax(0, 500px)" }
              : "1fr",
            gap: { xs: 2.5, md: 3.5 },
            alignItems: "start",
          }}
        >
          <Stack
            spacing={2.5}
            sx={{
              alignSelf: "flex-start",
              maxWidth: SHOW_QUOTE_TOOL ? 600 : 760,
              justifySelf: SHOW_QUOTE_TOOL ? "stretch" : "center",
              textAlign: SHOW_QUOTE_TOOL
                ? "left"
                : { xs: "left", md: "center" },
              alignItems: SHOW_QUOTE_TOOL
                ? "flex-start"
                : { xs: "flex-start", md: "center" },
              px: { xs: 2, sm: 3, md: 4 },
              py: { xs: 2.5, sm: 3, md: 4 },
            }}
          >
            <Chip
              icon={
                <VerifiedUserOutlinedIcon
                  sx={{ fontSize: "1rem !important" }}
                />
              }
              label="Simple • Secure • Member-only rates"
              variant="outlined"
              sx={{
                borderColor: "divider",
                bgcolor: "#f9fafc",
                fontSize: "0.75rem",
                height: "auto",
                py: 0.5,
                borderRadius: "999px",
                "& .MuiChip-label": { px: 1.5, py: 0.25 },
                "& .MuiChip-icon": { color: "primary.main", ml: 1 },
              }}
            />

            <Stack spacing={1.5}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: {
                    xs: "2rem",
                    sm: "2.5rem",
                    md: "3rem",
                    lg: "4rem",
                  },
                  lineHeight: 1.08,
                  maxWidth: 600,
                }}
              >
                Protect what matters most.
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 600 }}
              >
                Exclusive group rates for {client.branding.name} members, with
                coverage underwritten by New York Life Insurance Company.
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Button
                component={RouterLink}
                to={getPagePath("membership")}
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{ px: 3.5, py: 1.25 }}
              >
                Get started
              </Button>
            </Stack>
          </Stack>

          {SHOW_QUOTE_TOOL ? <HomeQuoteCard /> : null}
        </Box>

        <HowApplyingWorksSection
          onOpenApplicationReview={() => setActiveDrawer("application-review")}
          onOpenQuickDecision={() => setActiveDrawer("quick-decision")}
        />

        <Stack spacing={2.5}>
          <Stack spacing={1} sx={{ maxWidth: 760 }}>
            <Typography variant="h2">About the coverages</Typography>
            <Typography variant="body1" color="text.secondary">
              Review the coverage categories available on this site and the
              products offered within each category.
            </Typography>
          </Stack>

          <Box
            sx={{
              ...SURFACE_SX,
              overflow: "hidden",
              background:
                "linear-gradient(135deg, #f4f8ff 0%, #ffffff 52%, #f7fbff 100%)",
            }}
          >
            {coverageGroups.length === 0 ? (
              <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                <Alert severity="info">
                  No coverage categories are currently available for this site.
                </Alert>
              </Box>
            ) : (
              <Stack
                direction={{ xs: "column", md: "row" }}
                divider={
                  <Divider
                    flexItem
                    orientation={isMobile ? "horizontal" : "vertical"}
                  />
                }
              >
                <Box
                  sx={{
                    width: { xs: "100%", md: 260 },
                    flexShrink: 0,
                    backgroundColor: { xs: "transparent", md: "#fbfcff" },
                  }}
                >
                  <Tabs
                    value={activeCoverageGroup?.category.id ?? false}
                    onChange={(_, value: CoverageCategoryId) =>
                      setActiveCoverageCategory(value)
                    }
                    orientation={isMobile ? "horizontal" : "vertical"}
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{
                      px: { xs: 1, md: 0 },
                      py: { xs: 1, md: 2 },
                      minHeight: "100%",
                      "& .MuiTabs-indicator": {
                        backgroundColor: "primary.main",
                      },
                      "& .MuiTab-root": {
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                        textAlign: "left",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        minHeight: 52,
                        px: 2,
                      },
                    }}
                  >
                    {coverageGroups.map(({ category }) => (
                      <Tab
                        key={category.id}
                        value={category.id}
                        label={category.label}
                      />
                    ))}
                  </Tabs>
                </Box>

                <Box sx={{ flex: 1, p: { xs: 2.5, md: 3 } }}>
                  {activeCoverageGroup ? (
                    <Stack spacing={2}>
                      <Stack spacing={0.75}>
                        <Typography variant="h4">
                          {activeCoverageGroup.category.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {
                            CATEGORY_DESCRIPTIONS[
                              activeCoverageGroup.category.id
                            ]
                          }
                        </Typography>
                      </Stack>

                      <Divider />

                      <Stack spacing={1.5}>
                        {activeCoverageGroup.products.map((product) => (
                          <Box key={product.id}>
                            <Stack spacing={0.4}>
                              <Link
                                href="#"
                                underline="hover"
                                onClick={(event) => event.preventDefault()}
                                sx={{
                                  fontWeight: 700,
                                  color: "primary.main",
                                  cursor: "pointer",
                                  width: "fit-content",
                                }}
                              >
                                {product.name} brochure
                              </Link>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {product.description ?? product.definition}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatCoverageRange(product)} · Available for{" "}
                                {product.applicants
                                  .map(getApplicantLabel)
                                  .join(", ")}
                              </Typography>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  ) : null}
                </Box>
              </Stack>
            )}
          </Box>
        </Stack>

        <Stack spacing={2.5}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                associationContent != null
                  ? { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }
                  : "1fr",
              gap: { xs: 3, md: 5 },
              alignItems: "start",
            }}
          >
            <Stack spacing={2}>
              <Stack spacing={0.75}>
                <Typography
                  variant="h3"
                  // sx={{ fontSize: { xs: "1.875rem", md: "2.25rem" } }}
                >
                  {NYL_ABOUT_CONTENT.title}
                </Typography>
                {NYL_ABOUT_CONTENT.subtitle ? (
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {NYL_ABOUT_CONTENT.subtitle}
                  </Typography>
                ) : null}
              </Stack>

              <Stack spacing={1.25}>
                {NYL_ABOUT_CONTENT.paragraphs.map((paragraph) => (
                  <Typography
                    key={paragraph}
                    variant="body2"
                    color="text.secondary"
                  >
                    {paragraph}
                  </Typography>
                ))}
              </Stack>

              <Stack
                direction="row"
                spacing={2}
                flexWrap="wrap"
                useFlexGap
                sx={{ rowGap: 1 }}
              >
                {[
                  ["A++", "A.M. Best"],
                  ["AAA", "Fitch Ratings"],
                  ["Aa1", "Moody's Investors Service"],
                  ["AA+", "Standard & Poor's"],
                ].map(([grade, source]) => (
                  <Stack
                    key={grade + source}
                    direction="row"
                    spacing={0.75}
                    alignItems="baseline"
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "primary.main" }}
                    >
                      {grade}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {source}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Typography variant="caption" color="text.secondary">
                Financial strength ratings shown are based on the referenced
                marketing content and noted there as of 09/30/2025.
              </Typography>
            </Stack>

            {associationContent ? (
              <Stack spacing={2}>
                <Stack spacing={0.75}>
                  <Typography variant="h5">
                    {associationContent.title}
                  </Typography>
                  {associationContent.subtitle ? (
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {associationContent.subtitle}
                    </Typography>
                  ) : null}
                </Stack>

                <Stack spacing={1.25}>
                  {associationContent.paragraphs.map((paragraph) => (
                    <Typography
                      key={paragraph}
                      variant="body2"
                      color="text.secondary"
                    >
                      {paragraph}
                    </Typography>
                  ))}
                </Stack>
              </Stack>
            ) : null}
          </Box>
        </Stack>
      </Stack>

      <FormHelpDrawer
        open={activeDrawer !== null}
        title={drawerTitle}
        onClose={() => setActiveDrawer(null)}
      >
        {activeDrawer === "application-review" ? (
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
              <InlineDrawerLink
                onClick={() => setActiveDrawer("quick-decision")}
              >
                <QuickDecisionMark />
              </InlineDrawerLink>
              , many applications can get a real-time decision, often without
              requiring a medical exam.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              <QuickDecisionMark /> helps speed up your application by using
              your answers to health questions along with securely accessed
              data, such as prescription history, medical claims, driving
              records, and prior insurance activity. In many cases, this means
              no medical exams or lab tests are needed.
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
                  Most decisions are made quickly.
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  Some applications may need additional review.
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  If so, an underwriter may contact you for more information.
                </Typography>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Important to know
              </Typography>
              <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  Approval depends on confirming your group status and
                  eligibility for the coverage amount selected.
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  <QuickDecisionMark /> may not be available for all products or
                  in all states/territories.
                </Typography>
              </Stack>
            </Box>
          </Stack>
        )}
      </FormHelpDrawer>
    </Box>
  );
}

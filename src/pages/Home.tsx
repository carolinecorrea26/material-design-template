import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
// import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
// import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import ArrowRightAltRoundedIcon from "@mui/icons-material/ArrowRightAltRounded";
import { keyframes } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  InputLabel,
  Link,
  ListSubheader,
  MenuItem,
  Radio,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import FormHelpDrawer from "../components/form/FormHelpDrawer";
import QuickDecisionIndicator from "../components/common/QuickDecisionIndicator";
import QuickDecisionDrawerContent from "../components/common/QuickDecisionDrawerContent";
import { ApplicationReviewDrawerContent } from "../content/helpContent";
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
type DrawerId = "application-review" | "quick-decision" | null;

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

type AboutCardContent = {
  title: string;
  subtitle?: string;
  paragraphs: ReactNode[];
};

const SHOW_QUOTE_TOOL = true;
const PAGE_MAX_WIDTH = 1180;

const SURFACE_SX = {
  border: "1px solid rgba(52, 59, 72, 0.10)",
  borderRadius: 4,
  backgroundColor: "#ffffff",
  boxShadow: "0 18px 40px rgba(52, 59, 72, 0.06)",
};

const SECTION_TITLE_SX = {
  fontSize: {
    xs: "1.5rem",
    sm: "1.5rem",
    md: "1.75rem",
    lg: "2rem",
  },
  fontWeight: 700,
  // color: "primary.dark",
};

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const FADE_IN_SECTION_SX = (delay: number) => ({
  opacity: 0,
  animation: `${fadeInUp} 0.7s ease-out ${delay}s forwards`,
});

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
    <>
      As of today, New York Life has received the highest financial strength
      ratings
      <Box component="sup" sx={{ fontSize: "0.75em", lineHeight: 1 }}>
        1
      </Box>{" "}
      currently awarded to any U.S. life insurer. For our customers, that means
      promises kept, and peace of mind for the millions of families and
      businesses who rely on us.
    </>,
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
    // number: "1",
    title: "Apply online",
    body: "Complete our online application to apply for coverage that fits your needs. You'll be able to review your options and see your estimated cost.",
    imageSrc: "/1-apply.svg",
    imageAlt: "Apply online",
  },
  {
    id: 1,
    // number: "2",
    title: "Answer health questions",
    body: "Many types of insurance require health information to provide a decision on your application. We may ask health questions on your application or a representative of New York Life or their medical service provider may contact you to collect your health history. If needed, we will schedule a medical exam at no cost to you and at a time and place convenient to you.",
    imageSrc: "/2-medical.svg",
    imageAlt: "Answer health questions",
  },
  {
    id: 2,
    // number: "3",
    title: "Get a decision",
    body: "Decisions are made after all information is received and reviewed by New York Life. If approved, you will receive a certificate of insurance and have a 30-day no-obligation free look. Plus, when QuickDecisionSM is available, you can get a faster decision on your application, typically with no medical exam.",
    imageSrc: "/3-decision.svg",
    imageAlt: "Get a decision",
  },
] as const;

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

function calculateAge(birthdayStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdayStr)) return null;
  const [y, m, d] = birthdayStr.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 12);
  if (!digits) return "";
  return `$${Number(digits).toLocaleString("en-US")}`;
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
  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h2" sx={SECTION_TITLE_SX}>
          What to expect when applying
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This online experience is designed to help you complete your
          application quickly and easily.
        </Typography>
      </Stack>

      <Stack spacing={8}>
        {APPLYING_STEPS.map((step) => (
          <Box key={step.id} sx={{ padding: { xs: "0 1.5rem", md: "0 2rem" } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 3, md: 6 }}
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box
                sx={{ flexShrink: 0, alignSelf: { xs: "center", md: "auto" } }}
              >
                <Box
                  component="img"
                  src={step.imageSrc}
                  alt={step.imageAlt}
                  sx={{
                    display: "block",
                    width: { xs: "150px", sm: "120px", md: "150px" },
                    height: { xs: "150px", sm: "120px", md: "150px" },
                    objectFit: "contain",
                  }}
                />
              </Box>

              <Box sx={{ width: "100%" }}>
                <Stack spacing={1.5}>
                  <Typography
                    variant="h4"
                    fontSize={{
                      xs: "1.25rem",
                      sm: "1.25rem",
                      md: "1.5rem",
                      lg: "1.5rem",
                    }}
                    textAlign={{ xs: "center", md: "left" }}
                  >
                    {step.title}
                  </Typography>

                  {step.id === 1 ? (
                    <Typography variant="body1" color="text.secondary">
                      Many types of insurance require health information to
                      provide a decision on your application. We may ask health
                      questions on your application or a representative of New
                      York Life or their medical service provider may contact
                      you to collect your health history. If needed, we will
                      schedule a medical exam at no cost to you and at a time
                      and place convenient to you.{" "}
                      <InlineDrawerLink onClick={onOpenApplicationReview}>
                        Learn more about the application review process.
                      </InlineDrawerLink>
                    </Typography>
                  ) : step.id === 2 ? (
                    <Typography variant="body1" color="text.secondary">
                      Decisions are made after all information is received and
                      reviewed by New York Life. If approved, you will receive a
                      certificate of insurance and have a 30-day no-obligation
                      free look. Plus, when{" "}
                      <InlineDrawerLink onClick={onOpenQuickDecision}>
                        <QuickDecisionMark />
                      </InlineDrawerLink>{" "}
                      is available, you can get a faster decision on your
                      application, typically with no medical exam.
                    </Typography>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      {step.body}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

const ESTIMATE_STORAGE_KEY = "homeEstimateValues";

function loadStoredEstimateValues(): Partial<EstimateState> {
  try {
    const stored = window.localStorage.getItem(ESTIMATE_STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored) as Partial<EstimateState>;
  } catch {
    return {};
  }
}

function saveEstimateValues(
  values: Pick<EstimateState, "birthday" | "zipCode" | "state">,
) {
  window.localStorage.setItem(ESTIMATE_STORAGE_KEY, JSON.stringify(values));
}

function HomeQuoteCard() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const stateOptions = useMemo(() => getStateOptions(), []);

  const storedEstimate = useMemo(() => loadStoredEstimateValues(), []);

  const [estimateValues, setEstimateValues] = useState<EstimateState>({
    birthday: storedEstimate.birthday ?? "",
    zipCode: storedEstimate.zipCode ?? "",
    state: storedEstimate.state ?? "",
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
  const [initialAttempted, setInitialAttempted] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [isEstimateLoading, setIsEstimateLoading] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteLoadingMessage, setQuoteLoadingMessage] = useState("");
  const [dobFocused, setDobFocused] = useState(false);
  const [estimateAmountsByProductId, setEstimateAmountsByProductId] = useState<
    Record<string, number>
  >({});
  const [estimateRatesByProductId, setEstimateRatesByProductId] = useState<
    Record<string, number>
  >({});
  const [quoteRevealed, setQuoteRevealed] = useState(false);
  const [ageError, setAgeError] = useState("");
  const [modalAttempted, setModalAttempted] = useState(false);

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

  // Auto-derive state from zip code
  useEffect(() => {
    const derived = deriveStateProvinceFromZipOrPostalCode(
      estimateValues.zipCode,
      stateOptions,
    );
    if (derived && derived !== estimateValues.state) {
      setEstimateValues((current) => ({ ...current, state: derived }));
    }
  }, [estimateValues.zipCode, stateOptions, estimateValues.state]);

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

  const initialValidationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!estimateValues.birthday) {
      errors.birthday = "Date of birth is required.";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(estimateValues.birthday)) {
      errors.birthday = "Enter a complete date (MM/DD/YYYY).";
    }
    if (!estimateValues.zipCode)
      errors.zipCode = "ZIP / postal code is required.";
    if (!estimateValues.state) errors.state = "State is required.";
    return errors;
  }, [estimateValues.birthday, estimateValues.zipCode, estimateValues.state]);

  const modalValidationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!estimateValues.productId) {
      errors.productId = "Please select a product.";
    }
    if (estimateCategoryNeedsGender && !estimateValues.gender) {
      errors.gender = "Gender is required.";
    }
    if (estimateCategoryNeedsSmoker && !estimateValues.smoker) {
      errors.smoker = "This field is required.";
    }
    if (estimateCategoryNeedsDi && !estimateValues.avgIncome) {
      errors.avgIncome = "Average monthly income is required.";
    }
    if (estimateCategoryNeedsHours && !estimateValues.hoursPerWeek) {
      errors.hoursPerWeek = "Hours worked per week is required.";
    }
    if (estimateCategoryNeedsOo && !estimateValues.monthlyExpenses) {
      errors.monthlyExpenses = "Monthly business expenses is required.";
    }
    if (estimateCategoryNeedsOo && !estimateValues.responsibilityPct) {
      errors.responsibilityPct = "Responsibility percentage is required.";
    }
    return errors;
  }, [
    estimateValues.productId,
    estimateValues.gender,
    estimateValues.smoker,
    estimateValues.avgIncome,
    estimateValues.hoursPerWeek,
    estimateValues.monthlyExpenses,
    estimateValues.responsibilityPct,
    estimateCategoryNeedsGender,
    estimateCategoryNeedsSmoker,
    estimateCategoryNeedsDi,
    estimateCategoryNeedsHours,
    estimateCategoryNeedsOo,
  ]);

  function updateEstimateValues(nextValues: Partial<EstimateState>) {
    setEstimateValues((current) => ({ ...current, ...nextValues }));
  }

  function handleEstimateProductChange(nextProductId: string) {
    const nextProduct = coverages.find((c) => c.id === nextProductId);
    const nextCategoryId = nextProduct?.categoryId ?? null;

    // Determine if the new product needs additional fields
    const needsGender = nextCategoryId === "LI" || nextCategoryId === "DI";
    const needsSmoker = nextCategoryId === "LI" || nextCategoryId === "SH";
    const needsDi = nextCategoryId === "DI";
    const needsOo = nextCategoryId === "OO";
    const needsHours = needsDi || needsOo;

    // Check if all required additional fields are already filled
    const hasGender = !needsGender || !!estimateValues.gender;
    const hasSmoker = !needsSmoker || !!estimateValues.smoker;
    const hasIncome = !needsDi || !!estimateValues.avgIncome;
    const hasHours = !needsHours || !!estimateValues.hoursPerWeek;
    const hasExpenses = !needsOo || !!estimateValues.monthlyExpenses;
    const hasResponsibility = !needsOo || !!estimateValues.responsibilityPct;

    const allAdditionalFieldsFilled =
      hasGender &&
      hasSmoker &&
      hasIncome &&
      hasHours &&
      hasExpenses &&
      hasResponsibility;

    // No additional fields required at all for this product
    const noAdditionalFieldsNeeded =
      !needsGender && !needsSmoker && !needsDi && !needsOo && !needsHours;

    setEstimateValues((current) => ({
      ...current,
      productId: nextProductId,
    }));
    setModalAttempted(false);

    if (noAdditionalFieldsNeeded || allAdditionalFieldsFilled) {
      // Auto-compute quote
      if (nextProduct) {
        // Check hours ineligibility
        if (needsHours) {
          const hours = parseInt(estimateValues.hoursPerWeek, 10);
          if (!isNaN(hours) && hours < 40) {
            setQuoteRevealed(true);
            return;
          }
        }
        const choices = generateAmountChoices(
          nextProduct.categoryId,
          nextProduct.minAmount,
          nextProduct.maxAmount,
        );

        // If switching within the same category, try to keep the previous amount
        const prevProduct = coverages.find(
          (c) => c.id === estimateValues.productId,
        );
        const prevAmount = prevProduct
          ? estimateAmountsByProductId[prevProduct.id]
          : undefined;
        const keepAmount =
          prevProduct &&
          prevProduct.categoryId === nextProduct.categoryId &&
          prevAmount != null &&
          choices.includes(prevAmount);

        const selectedAmount = keepAmount ? prevAmount : (choices[0] ?? 0);
        const selectedRate = estimateMonthlyPremium(
          nextProduct.categoryId,
          selectedAmount,
        );
        setEstimateAmountsByProductId((current) => ({
          ...current,
          [nextProduct.id]: selectedAmount,
        }));
        setEstimateRatesByProductId((current) => ({
          ...current,
          [nextProduct.id]: selectedRate,
        }));
        setQuoteRevealed(true);
      }
    } else {
      setQuoteRevealed(false);
    }
  }

  function handleGetEstimate() {
    setInitialAttempted(true);
    setAgeError("");

    if (Object.keys(initialValidationErrors).length > 0) {
      return;
    }

    // Check age eligibility (80+)
    const age = calculateAge(estimateValues.birthday);
    if (age !== null && age >= 80) {
      setAgeError(
        "We're sorry, but coverage is not available for applicants age 80 or older.",
      );
      return;
    }

    // Persist DOB/zip/state to localStorage
    saveEstimateValues({
      birthday: estimateValues.birthday,
      zipCode: estimateValues.zipCode,
      state: estimateValues.state,
    });

    // Show loading state on button
    setIsEstimateLoading(true);
    setTimeout(() => {
      setIsEstimateLoading(false);
      openQuoteModal();
    }, 1000);
  }

  function openQuoteModal() {
    // Pre-select first product if none selected
    const firstProduct =
      productsByCategory.length > 0
        ? productsByCategory[0].products[0]
        : undefined;
    const preselectedId = estimateValues.productId || firstProduct?.id || "";
    const preselectedProduct =
      coverages.find((c) => c.id === preselectedId) ?? firstProduct;

    if (preselectedProduct && !estimateValues.productId) {
      setEstimateValues((current) => ({
        ...current,
        productId: preselectedProduct.id,
      }));
    }

    // Determine if the preselected product needs additional fields
    const catId = preselectedProduct?.categoryId ?? null;
    const needsGender = catId === "LI" || catId === "DI";
    const needsSmoker = catId === "LI" || catId === "SH";
    const needsDi = catId === "DI";
    const needsOo = catId === "OO";
    const needsHours = needsDi || needsOo;
    const noAdditionalFieldsNeeded =
      !needsGender && !needsSmoker && !needsDi && !needsOo && !needsHours;

    if (noAdditionalFieldsNeeded && preselectedProduct) {
      // Show loading skeleton then reveal quote
      setQuoteRevealed(false);
      setIsQuoteLoading(true);
      setQuoteLoadingMessage("Checking for latest rates...");
      setModalAttempted(false);
      setQuoteModalOpen(true);

      setTimeout(() => {
        setQuoteLoadingMessage("Calculating your estimated cost...");
      }, 500);

      setTimeout(() => {
        const choices = generateAmountChoices(
          preselectedProduct.categoryId,
          preselectedProduct.minAmount,
          preselectedProduct.maxAmount,
        );
        const initialAmount = choices[0] ?? 0;
        const initialRate = estimateMonthlyPremium(
          preselectedProduct.categoryId,
          initialAmount,
        );
        setEstimateAmountsByProductId((current) => ({
          ...current,
          [preselectedProduct.id]: initialAmount,
        }));
        setEstimateRatesByProductId((current) => ({
          ...current,
          [preselectedProduct.id]: initialRate,
        }));
        setIsQuoteLoading(false);
        setQuoteLoadingMessage("");
        setQuoteRevealed(true);
      }, 1000);
    } else {
      setQuoteRevealed(false);
      setModalAttempted(false);
      setQuoteModalOpen(true);
    }
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

  function handleModalGetEstimate() {
    setModalAttempted(true);

    if (Object.keys(modalValidationErrors).length > 0) {
      return;
    }

    const product = selectedProduct;
    if (!product) return;

    // Check hours eligibility for DI/OO
    if (estimateCategoryNeedsHours) {
      const hours = parseInt(estimateValues.hoursPerWeek, 10);
      if (!isNaN(hours) && hours < 40) {
        // Reveal in error state
        setQuoteRevealed(true);
        return;
      }
    }

    // Show loading skeleton then reveal
    setQuoteRevealed(false);
    setIsQuoteLoading(true);
    setQuoteLoadingMessage("Checking for latest rates...");

    setTimeout(() => {
      setQuoteLoadingMessage("Calculating your estimated cost...");
    }, 500);

    setTimeout(() => {
      const choices = generateAmountChoices(
        product.categoryId,
        product.minAmount,
        product.maxAmount,
      );
      const initialAmount = choices[0] ?? 0;
      const initialRate = estimateMonthlyPremium(
        product.categoryId,
        initialAmount,
      );

      setEstimateAmountsByProductId((current) => ({
        ...current,
        [product.id]: initialAmount,
      }));
      setEstimateRatesByProductId((current) => ({
        ...current,
        [product.id]: initialRate,
      }));
      setIsQuoteLoading(false);
      setQuoteLoadingMessage("");
      setQuoteRevealed(true);
    }, 1000);
  }

  const isHoursIneligible =
    quoteRevealed &&
    estimateCategoryNeedsHours &&
    (() => {
      const hours = parseInt(estimateValues.hoursPerWeek, 10);
      return !isNaN(hours) && hours < 40;
    })();

  // The product currently showing a quote in the modal
  const modalProduct = selectedProduct ?? null;
  const modalAmountChoices = modalProduct
    ? generateAmountChoices(
        modalProduct.categoryId,
        modalProduct.minAmount,
        modalProduct.maxAmount,
      )
    : [];
  const modalSelectedAmount = modalProduct
    ? (estimateAmountsByProductId[modalProduct.id] ??
      modalAmountChoices[0] ??
      0)
    : 0;
  const modalEstimatedRate = modalProduct
    ? (estimateRatesByProductId[modalProduct.id] ?? 0)
    : 0;

  return (
    <>
      <Box
        sx={{
          ...SURFACE_SX,
          width: "100%",
          borderColor: "rgba(7, 104, 255, 0.14)",
          background:
            "linear-gradient(135deg, #f4f8ff 0%, #ffffff 52%, #f7fbff 100%)",
        }}
      >
        <Stack spacing={2.25} sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Box>
            <Typography
              variant="h4"
              paddingBottom={1}
              sx={{ xs: "1.5rem", sm: "1.5rem", md: "1.75rem", lg: "2rem" }}
              fontWeight={600}
            >
              Get an estimate in seconds
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            <TextField
              label="Date of Birth"
              fullWidth
              required
              placeholder="MM/DD/YYYY"
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
              onFocus={() => setDobFocused(true)}
              onBlur={() => setDobFocused(false)}
              inputProps={{ inputMode: "numeric" }}
              InputLabelProps={{
                shrink: dobFocused || !!estimateValues.birthday,
              }}
              error={initialAttempted && !!initialValidationErrors.birthday}
              helperText={
                initialAttempted && initialValidationErrors.birthday
                  ? initialValidationErrors.birthday
                  : undefined
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
              error={initialAttempted && !!initialValidationErrors.zipCode}
              helperText={
                initialAttempted
                  ? initialValidationErrors.zipCode || undefined
                  : undefined
              }
            />

            <FormControl
              fullWidth
              required
              error={initialAttempted && !!initialValidationErrors.state}
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
              {initialAttempted && initialValidationErrors.state ? (
                <FormHelperText>{initialValidationErrors.state}</FormHelperText>
              ) : null}
            </FormControl>
          </Stack>

          <Stack spacing={1}>
            <Button
              variant="outlined"
              size="large"
              onClick={handleGetEstimate}
              disabled={isEstimateLoading}
            >
              {isEstimateLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Get estimate"
              )}
            </Button>
            {ageError ? (
              <Alert severity="error" sx={{ mt: 0.5 }}>
                {ageError}
              </Alert>
            ) : null}
          </Stack>
        </Stack>
      </Box>

      {/* Quote Modal */}
      <Dialog
        open={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={!isMdUp}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Your coverage estimate
          </Typography>
          <IconButton
            onClick={() => setQuoteModalOpen(false)}
            aria-label="Close"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 3, md: 4 }}
          >
            {/* Questions - left on desktop, top on mobile */}
            <Box
              sx={{
                flex: 1,
                order: { xs: 1, md: 1 },
                minWidth: 0,
              }}
            >
              <Stack spacing={2}>
                <FormControl
                  fullWidth
                  required
                  error={modalAttempted && !!modalValidationErrors.productId}
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
                    onChange={(event) => {
                      handleEstimateProductChange(event.target.value);
                    }}
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
                  {modalAttempted && modalValidationErrors.productId ? (
                    <FormHelperText>
                      {modalValidationErrors.productId}
                    </FormHelperText>
                  ) : null}
                </FormControl>

                {estimateCategoryNeedsGender ? (
                  <FormControl
                    fullWidth
                    required
                    error={modalAttempted && !!modalValidationErrors.gender}
                  >
                    <FormLabel required sx={{ mb: 1 }}>
                      Gender
                    </FormLabel>
                    <ToggleButtonGroup
                      exclusive
                      value={estimateValues.gender}
                      onChange={(_, value) => {
                        if (value !== null) {
                          updateEstimateValues({
                            gender: value as EstimateGender,
                          });
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
                    {modalAttempted && modalValidationErrors.gender ? (
                      <FormHelperText>
                        {modalValidationErrors.gender}
                      </FormHelperText>
                    ) : null}
                  </FormControl>
                ) : null}

                {estimateCategoryNeedsSmoker ? (
                  <FormControl
                    fullWidth
                    required
                    error={modalAttempted && !!modalValidationErrors.smoker}
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
                    {modalAttempted && modalValidationErrors.smoker ? (
                      <FormHelperText>
                        {modalValidationErrors.smoker}
                      </FormHelperText>
                    ) : null}
                  </FormControl>
                ) : null}

                {estimateCategoryNeedsDi ? (
                  <TextField
                    label="Average monthly income"
                    fullWidth
                    required
                    value={
                      estimateValues.avgIncome
                        ? formatCurrencyInput(estimateValues.avgIncome)
                        : ""
                    }
                    onChange={(event) => {
                      const digits = event.target.value.replace(/[^0-9]/g, "");
                      updateEstimateValues({ avgIncome: digits });
                    }}
                    inputProps={{ inputMode: "numeric" }}
                    InputLabelProps={{ shrink: true }}
                    placeholder="$0"
                    helperText={
                      modalAttempted && modalValidationErrors.avgIncome
                        ? modalValidationErrors.avgIncome
                        : "Enter your average gross monthly income before taxes."
                    }
                    error={modalAttempted && !!modalValidationErrors.avgIncome}
                  />
                ) : null}

                {estimateCategoryNeedsHours ? (
                  <TextField
                    label="# Hours You Work/Week"
                    fullWidth
                    required
                    value={estimateValues.hoursPerWeek}
                    onChange={(event) =>
                      updateEstimateValues({
                        hoursPerWeek: event.target.value.replace(/[^0-9]/g, ""),
                      })
                    }
                    inputProps={{ inputMode: "numeric" }}
                    helperText={
                      modalAttempted && modalValidationErrors.hoursPerWeek
                        ? modalValidationErrors.hoursPerWeek
                        : undefined
                    }
                    error={
                      modalAttempted && !!modalValidationErrors.hoursPerWeek
                    }
                  />
                ) : null}

                {estimateCategoryNeedsOo ? (
                  <>
                    <TextField
                      label="Average monthly business expenses"
                      fullWidth
                      required
                      value={
                        estimateValues.monthlyExpenses
                          ? formatCurrencyInput(estimateValues.monthlyExpenses)
                          : ""
                      }
                      onChange={(event) => {
                        const digits = event.target.value.replace(
                          /[^0-9]/g,
                          "",
                        );
                        updateEstimateValues({ monthlyExpenses: digits });
                      }}
                      inputProps={{ inputMode: "numeric" }}
                      InputLabelProps={{ shrink: true }}
                      placeholder="$0"
                      helperText={
                        modalAttempted && modalValidationErrors.monthlyExpenses
                          ? modalValidationErrors.monthlyExpenses
                          : undefined
                      }
                      error={
                        modalAttempted &&
                        !!modalValidationErrors.monthlyExpenses
                      }
                    />
                    <TextField
                      label="% you are responsible for"
                      fullWidth
                      required
                      value={estimateValues.responsibilityPct}
                      onChange={(event) => {
                        const digits = event.target.value.replace(
                          /[^0-9]/g,
                          "",
                        );
                        const normalized = digits
                          ? Math.min(parseInt(digits, 10), 100).toString()
                          : "";
                        updateEstimateValues({
                          responsibilityPct: normalized,
                        });
                      }}
                      helperText={
                        modalAttempted &&
                        modalValidationErrors.responsibilityPct
                          ? modalValidationErrors.responsibilityPct
                          : undefined
                      }
                      error={
                        modalAttempted &&
                        !!modalValidationErrors.responsibilityPct
                      }
                    />
                  </>
                ) : null}

                {estimateCategoryNeedsGender ||
                estimateCategoryNeedsSmoker ||
                estimateCategoryNeedsDi ||
                estimateCategoryNeedsOo ||
                estimateCategoryNeedsHours ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleModalGetEstimate}
                    disabled={isQuoteLoading}
                    sx={{ mt: 1 }}
                  >
                    {isQuoteLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Get estimate"
                    )}
                  </Button>
                ) : null}
              </Stack>
            </Box>

            {/* Quote result - right on desktop, bottom on mobile */}
            <Box
              sx={{
                flex: 1,
                order: { xs: 2, md: 2 },
                minWidth: 0,
              }}
            >
              {modalProduct ? (
                <Box
                  sx={{
                    border: "1px solid rgba(52, 59, 72, 0.12)",
                    borderRadius: 3,
                    backgroundColor: "#f9fafc",
                    p: 2.5,
                  }}
                >
                  <Stack spacing={2}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {modalProduct.name}
                    </Typography>

                    {isQuoteLoading ? (
                      <Box sx={{ py: 2 }}>
                        <Skeleton
                          variant="rounded"
                          height={42}
                          sx={{ borderRadius: 1, mb: 2 }}
                        />
                        <Skeleton
                          variant="rounded"
                          height={20}
                          sx={{ borderRadius: 1, mb: 1, width: "60%" }}
                        />
                        <Skeleton
                          variant="rounded"
                          height={32}
                          sx={{ borderRadius: 1, mb: 2, width: "40%" }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "block",
                            mt: 1,
                          }}
                        >
                          {quoteLoadingMessage}
                        </Typography>
                      </Box>
                    ) : quoteRevealed && !isHoursIneligible ? (
                      <>
                        <FormControl fullWidth size="small">
                          <InputLabel
                            id={`${modalProduct.id}-modal-amount-label`}
                          >
                            {getEstimateAmountLabel(modalProduct.categoryId)}
                          </InputLabel>
                          <Select
                            labelId={`${modalProduct.id}-modal-amount-label`}
                            label={getEstimateAmountLabel(
                              modalProduct.categoryId,
                            )}
                            value={modalSelectedAmount}
                            onChange={(event) =>
                              handleEstimateAmountChange(
                                modalProduct,
                                Number(event.target.value),
                              )
                            }
                          >
                            {modalAmountChoices.map((amount) => (
                              <MenuItem key={amount} value={amount}>
                                {formatUSD(amount, 0)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Divider />

                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          gap={2}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Your estimated rate
                            <Box
                              component="sup"
                              sx={{ fontSize: "0.7em", lineHeight: 1 }}
                            >
                              1
                            </Box>
                          </Typography>
                          <Typography
                            variant="h2"
                            sx={{
                              fontWeight: 700,
                              color: "success.main",
                            }}
                          >
                            {formatUSD(modalEstimatedRate)}/mo
                          </Typography>
                        </Stack>

                        <Typography variant="caption" color="text.secondary">
                          <Box
                            component="sup"
                            sx={{ fontSize: "0.85em", lineHeight: 1 }}
                          >
                            1
                          </Box>
                          Quoted cost is the best rate available based on the
                          information you provided. Final cost may be based upon
                          factors such as gender, health status, and use of
                          tobacco/nicotine. Rates current as of 2026.
                        </Typography>
                      </>
                    ) : quoteRevealed && isHoursIneligible ? (
                      <Alert severity="error">
                        We're sorry, but this product requires working at least
                        40 hours per week to be eligible for coverage.
                      </Alert>
                    ) : (
                      <Box
                        sx={{
                          textAlign: "center",
                          py: 4,
                          color: "text.secondary",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Your estimated cost will appear here once you click
                          &ldquo;Get estimate&rdquo;.
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              ) : (
                <Box
                  sx={{
                    border: "1px solid rgba(52, 59, 72, 0.12)",
                    borderRadius: 3,
                    backgroundColor: "#f9fafc",
                    p: 2.5,
                    textAlign: "center",
                    py: 4,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Your estimated cost will appear here once you click
                    &ldquo;Get estimate&rdquo;.
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Home() {
  const client = getActiveClient();
  const coverages = useMemo(() => getActiveClientCoverages(), []);
  const [activeDrawer, setActiveDrawer] = useState<DrawerId>(null);
  const [activeCoverageCategory, setActiveCoverageCategory] =
    useState<CoverageCategoryId>("LI");
  const howApplyingWorksRef = useRef<HTMLDivElement>(null);

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

  const DRAWER_CONFIG: Record<Exclude<DrawerId, null>, { title: ReactNode }> = {
    "application-review": {
      title: "About the application review process",
    },
    "quick-decision": {
      title: (
        <>
          What is <QuickDecisionMark />?
        </>
      ),
    },
  };

  const drawerTitle =
    activeDrawer != null ? DRAWER_CONFIG[activeDrawer].title : "";

  return (
    <Box sx={{ width: "100%", flex: 1 }}>
      <Stack
        spacing={{ xs: 12, md: 10 }}
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
            ...FADE_IN_SECTION_SX(0),
          }}
        >
          <Stack
            spacing={2}
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
              px: { xs: 1.5, sm: 3, md: 0 },
              pb: 2,
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
                    xs: "2.25rem",
                    sm: "3rem",
                    md: "3.5rem",
                    lg: "4rem",
                  },
                  lineHeight: 1.08,
                  maxWidth: 500,
                  fontWeight: 700,
                }}
              >
                Protect what matters most
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 400 }}
                fontSize={{ xs: "1.125rem", md: "1.25rem" }}
              >
                Coverage designed exclusively for {client.branding.name}{" "}
                members.
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              <Button
                component={RouterLink}
                to={getPagePath("membership")}
                variant="contained"
                size="large"
                endIcon={<ArrowRightAltRoundedIcon />}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  px: 3.5,
                  py: 1.25,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Get started
              </Button>

              <Button
                variant="outlined"
                size="large"
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  px: 3.5,
                  py: 1.25,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onClick={() => {
                  howApplyingWorksRef.current?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                Learn more
              </Button>
            </Stack>
          </Stack>

          {SHOW_QUOTE_TOOL ? <HomeQuoteCard /> : null}
        </Box>

        <Box ref={howApplyingWorksRef} sx={FADE_IN_SECTION_SX(0.15)}>
          <HowApplyingWorksSection
            onOpenApplicationReview={() =>
              setActiveDrawer("application-review")
            }
            onOpenQuickDecision={() => setActiveDrawer("quick-decision")}
          />
        </Box>

        <Stack spacing={2.5} sx={FADE_IN_SECTION_SX(0.3)}>
          <Stack spacing={1}>
            <Typography variant="h2" sx={SECTION_TITLE_SX}>
              About the coverages
            </Typography>
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
                direction="row"
                divider={<Divider flexItem orientation="vertical" />}
              >
                <Box
                  sx={{
                    width: { xs: 56, md: 260 },
                    flexShrink: 0,
                    backgroundColor: { xs: "transparent", md: "#fbfcff" },
                  }}
                >
                  <Tabs
                    value={activeCoverageGroup?.category.id ?? false}
                    onChange={(_, value: CoverageCategoryId) =>
                      setActiveCoverageCategory(value)
                    }
                    orientation="vertical"
                    variant="standard"
                    sx={{
                      px: { xs: 0, md: 0 },
                      py: { xs: 1, md: 2 },
                      minHeight: "100%",
                      "& .MuiTabs-indicator": {
                        backgroundColor: "primary.main",
                      },
                      "& .MuiTab-root": {
                        alignItems: "center",
                        justifyContent: { xs: "center", md: "flex-start" },
                        textAlign: "left",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        minHeight: 52,
                        minWidth: { xs: 56, md: "auto" },
                        px: { xs: 0, md: 2 },
                      },
                    }}
                  >
                    {coverageGroups.map(({ category }) => {
                      const IconComponent = category.icon;
                      return (
                        <Tab
                          key={category.id}
                          value={category.id}
                          icon={<IconComponent sx={{ fontSize: "1.25rem" }} />}
                          iconPosition="start"
                          label={
                            <Box
                              component="span"
                              sx={{ display: { xs: "none", md: "inline" } }}
                            >
                              {category.label}
                            </Box>
                          }
                          sx={{
                            gap: 1,
                            "& .MuiTab-iconWrapper": {
                              mr: { xs: 0, md: 1 },
                            },
                          }}
                        />
                      );
                    })}
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
                                {product.name}
                                {product.underwritingType === "QD" && (
                                  <QuickDecisionIndicator />
                                )}
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
                                {formatCoverageRange(product)} · Available for:{" "}
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

        <Stack spacing={2.5} sx={FADE_IN_SECTION_SX(0.45)}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                associationContent != null ? { xs: "1fr" } : "1fr",
              gap: { xs: 3, md: 5 },
              alignItems: "start",
            }}
          >
            {associationContent ? (
              <Stack spacing={2}>
                <Stack spacing={0.75}>
                  <Typography
                    variant="h4"
                    paddingBottom={1}
                    sx={{
                      xs: "1.5rem",
                      sm: "1.5rem",
                      md: "1.75rem",
                      lg: "2rem",
                    }}
                    fontWeight={600}
                  >
                    {associationContent.title}
                  </Typography>
                  {associationContent.subtitle ? (
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {associationContent.subtitle}
                    </Typography>
                  ) : null}
                </Stack>

                <Stack spacing={1.25}>
                  {associationContent.paragraphs.map((paragraph, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      color="text.secondary"
                    >
                      {paragraph}
                    </Typography>
                  ))}
                </Stack>
                <Box
                  component="img"
                  src={client.branding.logo}
                  alt={client.branding.logoAlt}
                  sx={{
                    display: "block",
                    height: 30,
                    width: "auto",
                    objectFit: "contain",
                    objectPosition: "left center",
                    mb: 0.5,
                  }}
                />
              </Stack>
            ) : null}
            <Stack spacing={2}>
              <Stack spacing={0.75}>
                <Typography
                  variant="h4"
                  paddingBottom={1}
                  sx={{ xs: "1.5rem", sm: "1.5rem", md: "1.75rem", lg: "2rem" }}
                  fontWeight={600}
                >
                  {NYL_ABOUT_CONTENT.title}
                </Typography>
                {NYL_ABOUT_CONTENT.subtitle ? (
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {NYL_ABOUT_CONTENT.subtitle}
                  </Typography>
                ) : null}
              </Stack>

              <Stack spacing={1.25}>
                {NYL_ABOUT_CONTENT.paragraphs.map((paragraph, index) => (
                  <Typography
                    key={index}
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
                <Box component="sup" sx={{ fontSize: "0.85em", lineHeight: 1 }}>
                  1
                </Box>
                Third Party Rating Reports as of 09/30/2025.
              </Typography>
              <Box
                component="img"
                src="/logo.svg"
                alt="New York Life Logo"
                sx={{
                  display: "block",
                  height: 40,
                  width: "auto",
                  objectFit: "contain",
                  objectPosition: "left center",
                  mb: 0.5,
                }}
              />
            </Stack>
          </Box>
        </Stack>
      </Stack>

      <FormHelpDrawer
        open={activeDrawer !== null}
        title={drawerTitle}
        onClose={() => setActiveDrawer(null)}
      >
        {activeDrawer === "application-review" ? (
          <ApplicationReviewDrawerContent
            onOpenQuickDecision={() => setActiveDrawer("quick-decision")}
          />
        ) : (
          <QuickDecisionDrawerContent />
        )}
      </FormHelpDrawer>
    </Box>
  );
}

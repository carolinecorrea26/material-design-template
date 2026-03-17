import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Stack,
  Typography,
  Box,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
  Checkbox,
  FormLabel,
  ToggleButtonGroup,
  ToggleButton,
  Radio,
  Skeleton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SwipeableDrawer,
  Autocomplete,
  TextField,
  IconButton,
  Link as MuiLink,
} from "@mui/material";
import {
  EditNoteRounded,
  ContentPasteSearchRounded,
  VerifiedUserRounded,
  Close as CloseIcon,
} from "@mui/icons-material";
import { COVERAGE_CARDS } from "../constants/getStartedProducts";
import PageHeader from "../components/layout/PageHeader";
import ScrollChipRow from "../components/layout/ScrollChipRow";
import FormStepTransition from "../components/layout/FormStepTransition";
import FormPageLayout from "../components/layout/FormPageLayout";
import PageNavigation from "../components/layout/PageNavigation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import RHFTextField from "../components/form/RHFTextField";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFSelect from "../components/form/RHFSelect";
import RHFCheckbox from "../components/form/RHFCheckbox";
import { formatUSPhone } from "../utils/formatting";
import {
  ACTIVE_CLIENT_ID,
  getClientBranding,
  getClientCoverageCategories,
  getClientFieldLabels,
  getClientMembershipQuestion,
  getClientProductAmounts,
} from "../config/clients";
import { getProducts, quoteRate } from "../api/client";
import { COVERAGE_CATEGORY_LABELS } from "../constants/coverage";
import { STATE_OPTIONS, TITLE_OPTIONS, TOBACCO_PRODUCTS } from "../constants/eligibility";
import { useAppData } from "../state/AppDataContext";
import CoverageDetailsModal from "../components/modals/CoverageDetailsModal";
import QuickQuoteModal from "../components/modals/QuickQuoteModal";
import type { Product, CoverageCategory, Applicant } from "../types/app";

type CoverageCardView = {
  id: CoverageCategory;
  title: string;
  description: string;
  products: Array<{
    id: string;
    name: string;
    applicants: string[];
    href: string;
  }>;
};

type MembershipFormValues = {
  isMember?: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  waepaAttestation?: string;
  waepaEmployer?: string;
  waepaStartDate?: string;
  waepaDeclaration?: boolean;
};

const APPLICANT_LABELS: Record<Applicant, string> = {
  self: "Self",
  spouse: "Spouse",
  child: "Child",
};

const BROCHURE_BASE_URL = "https://d160mojjx9yhiu.cloudfront.net/pdfs/4591";

export default function GetStarted() {
  const { data, setEligibility, setContact } = useAppData();
  const navigate = useNavigate();
  const membershipQuestion = getClientMembershipQuestion();
  const [membershipValue, setMembershipValue] = React.useState<
    string | undefined
  >(data.eligibility?.isMember);
  const isWaepa = ACTIVE_CLIENT_ID === "waepa";
  const branding = getClientBranding();
  const clientCoverageCategories = React.useMemo(
    () => getClientCoverageCategories(),
    [],
  );
  const [productCatalog, setProductCatalog] = React.useState<Product[]>([]);
  const [quickQuoteOpen, setQuickQuoteOpen] = React.useState(false);
  const [coverageCatalogOpen, setCoverageCatalogOpen] = React.useState(false);
  const [processOpen, setProcessOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerTitle, setDrawerTitle] = React.useState("");
  const [aboutApplicationReviewOpen, setAboutApplicationReviewOpen] =
    React.useState(false);
  const [estimateBirthday, setEstimateBirthday] = React.useState("");
  const [estimateState, setEstimateState] = React.useState("");
  const [estimateCategory, setEstimateCategory] = React.useState<
    CoverageCategory | ""
  >("");
  const [estimateGender, setEstimateGender] = React.useState<"male" | "female" | "">("");
  const [estimateSmoker, setEstimateSmoker] = React.useState<"yes" | "no" | "">("");
  const [estimateTobaccoLastUsed, setEstimateTobaccoLastUsed] =
    React.useState("");
  const [estimateTobaccoProducts, setEstimateTobaccoProducts] = React.useState<
    string[]
  >([]);
  const [estimateAvgIncome, setEstimateAvgIncome] = React.useState("");
  const [estimateHoursPerWeek, setEstimateHoursPerWeek] = React.useState("");
  const [estimateMonthlyExpenses, setEstimateMonthlyExpenses] = React.useState("");
  const [estimateResponsibilityPct, setEstimateResponsibilityPct] =
    React.useState("");
  const [estimateAttempted, setEstimateAttempted] = React.useState(false);
  const [showEstimateProducts, setShowEstimateProducts] = React.useState(false);
  const [estimateAmountsByProductId, setEstimateAmountsByProductId] =
    React.useState<Record<string, number>>({});
  const [estimateRatesByProductId, setEstimateRatesByProductId] =
    React.useState<Record<string, number>>({});
  const [estimatingQuotes, setEstimatingQuotes] = React.useState(false);
  const drawerScrollRef = React.useRef<HTMLDivElement | null>(null);
  const getEstimateButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const productAmounts = React.useMemo(() => getClientProductAmounts(), []);
  const fieldLabels = React.useMemo(() => getClientFieldLabels(), []);
  const categoryAmounts = React.useMemo(
    () => ({
      LI: "$100K–$1M",
      AD: "$25K–$500K",
      DI: "$2K–$20K/mo",
      OO: "$2K–$20K/mo",
      SH: "$10K–$50K",
    }),
    [],
  );

  const defaultValues = React.useMemo<MembershipFormValues>(
    () => ({
      isMember: data.eligibility?.isMember ?? "",
      title: data.eligibility?.title ?? "",
      firstName: data.eligibility?.firstName ?? "",
      middleInitial: data.eligibility?.middleInitial ?? "",
      lastName: data.eligibility?.lastName ?? "",
      suffix: data.eligibility?.suffix ?? "",
      email: data.eligibility?.email ?? "",
      phoneNumber: data.contact?.phoneNumber ?? "",
      phoneType:
        (data.contact?.phoneType as MembershipFormValues["phoneType"]) ??
        undefined,
      waepaAttestation: data.eligibility?.waepaAttestation ?? "",
      waepaEmployer: data.eligibility?.waepaEmployer ?? "",
      waepaStartDate: data.eligibility?.waepaStartDate ?? "",
      waepaDeclaration: data.eligibility?.waepaDeclaration ?? false,
    }),
    [data.contact, data.eligibility],
  );

  const validationSchema = React.useMemo(() => {
    return z
      .object({
        isMember: z.string().min(1, "Please select an option"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phoneNumber: z.string().optional(),
        waepaAttestation: z.string().optional(),
        waepaEmployer: z.string().optional(),
        waepaStartDate: z.string().optional(),
        waepaDeclaration: z.boolean().optional(),
      })
      .superRefine((values, ctx) => {
        const isWaepaMember = isWaepa && values.isMember === "new";
        const requiresCoreFields =
          isWaepaMember || (!!values.isMember && values.isMember !== "no");

        if (requiresCoreFields) {
          if (!values.firstName) {
            ctx.addIssue({
              code: "custom",
              path: ["firstName"],
              message: "First Name is required",
            });
          }
          if (!values.lastName) {
            ctx.addIssue({
              code: "custom",
              path: ["lastName"],
              message: "Last Name is required",
            });
          }
          if (!values.email) {
            ctx.addIssue({
              code: "custom",
              path: ["email"],
              message: "Email is required",
            });
          }
          if (!values.phoneNumber) {
            ctx.addIssue({
              code: "custom",
              path: ["phoneNumber"],
              message: "Phone Number is required",
            });
          }
        }

        if (isWaepaMember) {
          if (!values.waepaAttestation) {
            ctx.addIssue({
              code: "custom",
              path: ["waepaAttestation"],
              message: "Please select an option",
            });
          }
          if (!values.waepaDeclaration) {
            ctx.addIssue({
              code: "custom",
              path: ["waepaDeclaration"],
              message: "You must accept the declaration",
            });
          }
          if (values.waepaAttestation === "federal-active") {
            if (!values.waepaEmployer) {
              ctx.addIssue({
                code: "custom",
                path: ["waepaEmployer"],
                message: "Please select your employing agency",
              });
            }
            if (!values.waepaStartDate) {
              ctx.addIssue({
                code: "custom",
                path: ["waepaStartDate"],
                message: "Start Date is required",
              });
            }
          }
        }
      });
  }, [isWaepa]);

  const methods = useForm<MembershipFormValues>({
    defaultValues,
    resolver: zodResolver(validationSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  React.useEffect(() => {
    methods.reset(defaultValues);
  }, [defaultValues, methods]);

  React.useEffect(() => {
    let mounted = true;
    getProducts()
      .then((fetched) => {
        if (mounted && Array.isArray(fetched) && fetched.length > 0) {
          setProductCatalog(fetched);
        }
      })
      .catch((error) => {
        console.error("Failed to load products", error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const brochurePrefix = React.useMemo(
    () => branding.acronym?.toLowerCase() ?? "abe",
    [branding.acronym],
  );

  const getBrochureUrl = React.useCallback(
    (category: CoverageCategory) =>
      `${BROCHURE_BASE_URL}/${brochurePrefix}-${category.toLowerCase()}-overview.pdf`,
    [brochurePrefix],
  );

  const defaultCoverageCards = React.useMemo<CoverageCardView[]>(
    () =>
      COVERAGE_CARDS.map((card) => ({
        id: card.id as CoverageCategory,
        title: card.title,
        description: card.description,
        products: card.products.map((product) => ({
          id: product.id,
          name: product.name,
          applicants: product.applicants,
          href: getBrochureUrl(card.id as CoverageCategory),
        })),
      })),
    [getBrochureUrl],
  );

  const coverageCards = React.useMemo<CoverageCardView[]>(() => {
    if (productCatalog.length === 0) {
      return defaultCoverageCards;
    }

    const grouped: Record<CoverageCategory, Product[]> = {
      LI: [],
      AD: [],
      DI: [],
      OO: [],
      SH: [],
    };

    productCatalog.forEach((product) => {
      if (grouped[product.category]) {
        grouped[product.category].push(product);
      }
    });

    const cards = (Object.keys(grouped) as CoverageCategory[])
      .map((category) => {
        const categoryProducts = grouped[category];
        if (categoryProducts.length === 0) return null;
        const meta = COVERAGE_CARDS.find((card) => card.id === category);
        return {
          id: category,
          title: meta?.title ?? COVERAGE_CATEGORY_LABELS[category],
          description: meta?.description ?? "",
          products: categoryProducts.map((product) => ({
            id: product.id,
            name: product.name,
            applicants: product.eligibleApplicants.map(
              (applicant) => APPLICANT_LABELS[applicant] ?? applicant,
            ),
            href: getBrochureUrl(category),
          })),
        } satisfies CoverageCardView;
      })
      .filter((card): card is CoverageCardView => Boolean(card));

    return cards.length ? cards : defaultCoverageCards;
  }, [productCatalog, defaultCoverageCards, getBrochureUrl]);

  const coverageInfoCards = React.useMemo(
    () =>
      coverageCards.filter((card) =>
        clientCoverageCategories.includes(card.id),
      ),
    [clientCoverageCategories, coverageCards],
  );

  const membershipQuestionElement = React.useMemo(() => {
    if (isWaepa) {
      return (
        <Stack spacing={1}>
          <RHFRadioGroup
            name="isMember"
            label="Are you a current WAEPA member, or are you becoming a new member?"
            options={[
              { label: "Current member", value: "current" },
              { label: "New member", value: "new" },
            ]}
            required
          />
          <Typography variant="body2" color="text.secondary">
            Applying for coverage will make you a member.
          </Typography>
        </Stack>
      );
    }

    const questionText =
      membershipQuestion?.primaryQuestion ??
      "Are you an active member of your association?";

    if (membershipQuestion?.type === "select") {
      const options = membershipQuestion.options ?? [];
      if (options.length > 0) {
        return (
          <RHFSelect
            name="isMember"
            label={questionText}
            options={options}
            required
          />
        );
      }
    }

    return (
      <RHFRadioGroup
        name="isMember"
        label={questionText}
        options={
          membershipQuestion?.options ?? [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]
        }
        required
      />
    );
  }, [isWaepa, membershipQuestion]);

  const handleConfirmMembership = methods.handleSubmit((values) => {
    setEligibility({
      ...data.eligibility,
      isMember: values.isMember ?? data.eligibility?.isMember,
      firstName: values.firstName ?? data.eligibility?.firstName ?? "",
      lastName: values.lastName ?? data.eligibility?.lastName ?? "",
      email: values.email ?? data.eligibility?.email ?? "",
      waepaAttestation: values.waepaAttestation,
      waepaEmployer: values.waepaEmployer,
      waepaStartDate: values.waepaStartDate,
      waepaDeclaration: values.waepaDeclaration,
    });

    if (values.phoneNumber) {
      setContact({
        ...data.contact,
        phoneNumber: values.phoneNumber,
      });
    }

    navigate("/eligibility");
  });

  React.useEffect(() => {
    const subscription = methods.watch((value, { name }) => {
      if (name === "isMember") {
        setMembershipValue((value.isMember as string) ?? undefined);
      }

      setEligibility({
        ...data.eligibility,
        isMember: value.isMember ?? data.eligibility?.isMember,
        firstName: value.firstName ?? data.eligibility?.firstName ?? "",
        lastName: value.lastName ?? data.eligibility?.lastName ?? "",
        email: value.email ?? data.eligibility?.email ?? "",
        waepaAttestation:
          value.waepaAttestation ?? data.eligibility?.waepaAttestation,
        waepaEmployer: value.waepaEmployer ?? data.eligibility?.waepaEmployer,
        waepaStartDate:
          value.waepaStartDate ?? data.eligibility?.waepaStartDate,
        waepaDeclaration:
          value.waepaDeclaration ?? data.eligibility?.waepaDeclaration,
      });

      if (value.phoneNumber !== undefined) {
        setContact({
          ...data.contact,
          phoneNumber: value.phoneNumber,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, data.eligibility, data.contact, setEligibility, setContact]);

  React.useEffect(() => {
    const handleFillForm = () => {
      const filledData: MembershipFormValues = {
        isMember: isWaepa ? "new" : "yes",
        firstName: "Jordan",
        lastName: "Smith",
        email: "jordan.smith@example.com",
        phoneNumber: "555-123-4567",
        waepaAttestation: "federal-active",
        waepaEmployer: "Federal Bureau of Investigation",
        waepaStartDate: "2022-01-15",
        waepaDeclaration: true,
      };

      methods.reset(filledData);
    };

    window.addEventListener("devtools:fillform", handleFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleFillForm);
  }, [methods, isWaepa]);

  const showAdditionalFields = React.useMemo(() => {
    if (!membershipValue) {
      return false;
    }
    if (isWaepa || ACTIVE_CLIENT_ID === "ama") {
      return true;
    }
    return membershipValue === "yes";
  }, [isWaepa, membershipValue]);

  const showIneligibleMessage =
    membershipValue === "no" && ACTIVE_CLIENT_ID !== "ama" && !isWaepa;

  const waepaAttestation = methods.watch("waepaAttestation") as
    | string
    | undefined;
  const waepaDeclaration = methods.watch("waepaDeclaration") as
    | boolean
    | undefined;
  const showWaepaNewMemberFields = isWaepa && membershipValue === "new";
  const showWaepaEmploymentFields =
    showWaepaNewMemberFields && waepaAttestation === "federal-active";

  const waepaContinueDisabled =
    showAdditionalFields && showWaepaNewMemberFields && !waepaDeclaration;

  const WAEPA_ATTESTATION_OPTIONS = React.useMemo(
    () => [
      {
        label:
          "I am a civilian federal employee of the U.S. government actively at work",
        value: "federal-active",
      },
      {
        label: "I am a retired civilian federal annuitant",
        value: "federal-annuitant",
      },
      {
        label: "I am a former federal employee",
        value: "former-federal",
      },
      {
        label:
          "I am a spouse of a WAEPA member and want to apply as an Associate member",
        value: "spouse-associate",
      },
      {
        label:
          "I am an adult child of a WAEPA member and want to apply as an Associate member",
        value: "child-associate",
      },
    ],
    [],
  );

  const WAEPA_EMPLOYER_OPTIONS = React.useMemo(
    () => [
      "Administration for Children and Families",
      "Administrative Conference of the United States",
      "Administrative Review Board",
      "Agricultural Marketing Service",
      "Federal Bureau of Investigation",
    ],
    [],
  );

  const estimateCategoryNeedsGender =
    estimateCategory === "LI" || estimateCategory === "DI";
  const estimateCategoryNeedsSmoker =
    estimateCategory === "LI" || estimateCategory === "SH";
  const estimateCategoryNeedsDi = estimateCategory === "DI";
  const estimateCategoryNeedsOo = estimateCategory === "OO";
  const estimateCategoryNeedsHours =
    estimateCategoryNeedsDi || estimateCategoryNeedsOo;

  const estimateCategoryProducts = React.useMemo(
    () =>
      estimateCategory
        ? productCatalog.filter(
            (product) =>
              product.category === estimateCategory &&
              clientCoverageCategories.includes(product.category),
          )
        : [],
    [estimateCategory, productCatalog, clientCoverageCategories],
  );

  const handleCurrencyInput = React.useCallback((value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    return digits ? `$${parseInt(digits, 10).toLocaleString()}` : "";
  }, []);

  const formatMonthly = React.useCallback(
    (value: number) =>
      value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }),
    [],
  );

  const estimateValidationErrors = React.useMemo(() => {
    const errors: Record<string, string> = {};

    if (!estimateBirthday) errors.birthday = "Birthday is required";
    if (!estimateState) errors.state = `${fieldLabels.state ?? "State"} is required`;
    if (!estimateCategory) errors.category = "Coverage category is required";

    if (estimateCategoryNeedsGender && !estimateGender) {
      errors.gender = `${fieldLabels.gender ?? "Gender"} is required`;
    }

    if (estimateCategoryNeedsSmoker && !estimateSmoker) {
      errors.smoker = "Please select an option";
    }

    if (estimateCategoryNeedsSmoker && estimateSmoker === "yes") {
      if (!estimateTobaccoLastUsed) {
        errors.tobaccoLastUsed = "Last Used date is required";
      }
      if (estimateTobaccoProducts.length === 0) {
        errors.tobaccoProducts = "Select at least one product";
      }
    }

    if (estimateCategoryNeedsDi && !estimateAvgIncome) {
      errors.avgIncome = "Average Monthly Income is required";
    }

    if (estimateCategoryNeedsHours && !estimateHoursPerWeek) {
      errors.hours = "Hours per week is required";
    }

    if (estimateCategoryNeedsOo && !estimateMonthlyExpenses) {
      errors.monthlyExpenses = "Monthly Business Expenses is required";
    }

    if (estimateCategoryNeedsOo && !estimateResponsibilityPct) {
      errors.responsibilityPct = "Percentage is required";
    }

    return errors;
  }, [
    estimateBirthday,
    estimateState,
    estimateCategory,
    estimateCategoryNeedsGender,
    estimateCategoryNeedsSmoker,
    estimateCategoryNeedsDi,
    estimateCategoryNeedsHours,
    estimateCategoryNeedsOo,
    estimateGender,
    estimateSmoker,
    estimateTobaccoLastUsed,
    estimateTobaccoProducts,
    estimateAvgIncome,
    estimateHoursPerWeek,
    estimateMonthlyExpenses,
    estimateResponsibilityPct,
    fieldLabels.state,
    fieldLabels.gender,
  ]);

  const handleGetEstimate = React.useCallback(async () => {
    setEstimateAttempted(true);
    if (Object.keys(estimateValidationErrors).length > 0) {
      setShowEstimateProducts(false);
      return;
    }

    const startedAt = Date.now();
    const initialAmounts = estimateCategoryProducts.reduce<Record<string, number>>(
      (acc, product) => {
        if (!product.amounts || product.amounts.length === 0) {
          acc[product.id] = 0;
          return acc;
        }
        acc[product.id] = Math.min(...product.amounts);
        return acc;
      },
      {},
    );

    setEstimateAmountsByProductId(initialAmounts);
  setShowEstimateProducts(false);
    setEstimatingQuotes(true);

    const smoker = estimateSmoker === "yes";
    const quoteEntries = await Promise.all(
      estimateCategoryProducts.map(async (product) => {
        const amount = initialAmounts[product.id] ?? 0;
        if (!amount || amount <= 0) {
          return [product.id, 0] as const;
        }
        try {
          const quote = await quoteRate({
            productId: product.id,
            applicant: "self",
            amount,
            smoker,
            age: undefined,
          });
          return [product.id, quote.monthly] as const;
        } catch (error) {
          console.error("Failed to quote estimate", error);
          return [product.id, 0] as const;
        }
      }),
    );

    const elapsed = Date.now() - startedAt;
    const remainingDelay = Math.max(0, 2000 - elapsed);
    if (remainingDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingDelay));
    }

    setEstimateRatesByProductId(Object.fromEntries(quoteEntries));
    setEstimatingQuotes(false);
    setShowEstimateProducts(true);
  }, [
    estimateValidationErrors,
    estimateCategoryProducts,
    estimateSmoker,
  ]);

  const handleEstimateAmountChange = React.useCallback(
    async (product: Product, amount: number) => {
      setEstimateAmountsByProductId((prev) => ({
        ...prev,
        [product.id]: amount,
      }));

      if (!amount || amount <= 0) {
        setEstimateRatesByProductId((prev) => ({
          ...prev,
          [product.id]: 0,
        }));
        return;
      }

      try {
        const quote = await quoteRate({
          productId: product.id,
          applicant: "self",
          amount,
          smoker: estimateSmoker === "yes",
          age: undefined,
        });
        setEstimateRatesByProductId((prev) => ({
          ...prev,
          [product.id]: quote.monthly,
        }));
      } catch (error) {
        console.error("Failed to quote estimate", error);
      }
    },
    [estimateSmoker],
  );

  React.useEffect(() => {
    if (!showEstimateProducts || drawerTitle !== "How much does it cost?") {
      return;
    }

    requestAnimationFrame(() => {
      const scrollContainer = drawerScrollRef.current;
      const estimateButton = getEstimateButtonRef.current;
      if (!scrollContainer || !estimateButton) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const buttonRect = estimateButton.getBoundingClientRect();
      const nextTop =
        scrollContainer.scrollTop + (buttonRect.top - containerRect.top);
      scrollContainer.scrollTo({ top: nextTop, behavior: "smooth" });
    });
  }, [showEstimateProducts, drawerTitle]);

  const handleEstimateCategoryChange = React.useCallback(
    (category: CoverageCategory | "") => {
      setEstimateCategory(category);
      setEstimateGender("");
      setEstimateSmoker("");
      setEstimateTobaccoLastUsed("");
      setEstimateTobaccoProducts([]);
      setEstimateAvgIncome("");
      setEstimateHoursPerWeek("");
      setEstimateMonthlyExpenses("");
      setEstimateResponsibilityPct("");
      setShowEstimateProducts(false);
      setEstimateAmountsByProductId({});
      setEstimateRatesByProductId({});
    },
    [],
  );

  const handleOpenDrawer = (title: string) => {
    setDrawerTitle(title);
    if (title === "How much does it cost?") {
      setEstimateAttempted(false);
      setShowEstimateProducts(false);
      setEstimateAmountsByProductId({});
      setEstimateRatesByProductId({});
    }
    setDrawerOpen(true);
  };

  const renderDrawerContent = () => {
    if (drawerTitle === "How does applying work?") {
      return (
        <Stack spacing={3}>
          {/* Step 1: Apply Online */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <EditNoteRounded
              sx={{ color: "primary.main", fontSize: "2.5rem", flexShrink: 0 }}
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

          {/* Step 2: Provide Health Information */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <ContentPasteSearchRounded
              sx={{ color: "primary.main", fontSize: "2.5rem", flexShrink: 0 }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Your application will be reviewed.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Once your application is submitted, it will be reviewed. This
                may be real-time or take a few days depending on the coverage
                applied for. Sometimes the coverage applied for requires health
                information to provide a decision on your application.{" "}
                <MuiLink
                  component="button"
                  variant="body2"
                  onClick={() => setAboutApplicationReviewOpen(true)}
                  sx={{ cursor: "pointer" }}
                >
                  Learn more
                </MuiLink>{" "}
                about the application review process.
              </Typography>
            </Box>
          </Box>

          {/* Step 3: Get Your Decision */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <VerifiedUserRounded
              sx={{ color: "primary.main", fontSize: "2.5rem", flexShrink: 0 }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Receive your application decision.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Once all information is reviewed, you'll be notified of your
                decision. If approved, you will receive a certificate of
                insurance and have a 30-day no-obligation free look. Plus, when
                QuickDecision<sup>SM</sup> is available, you can get a faster
                decision on your application, typically with no medical exam.
              </Typography>
            </Box>
          </Box>
        </Stack>
      );
    }

    if (drawerTitle === "How much does it cost?") {
      return (
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Enter a few details to view available products and coverage amounts.
          </Typography>

          <TextField
            label={fieldLabels.dateOfBirth ?? "Birthday"}
            type="date"
            fullWidth
            required
            value={estimateBirthday}
            onChange={(event) => {
              setEstimateBirthday(event.target.value);
              setShowEstimateProducts(false);
              setEstimateRatesByProductId({});
              setEstimateAmountsByProductId({});
            }}
            InputLabelProps={{ shrink: true }}
            error={estimateAttempted && !!estimateValidationErrors.birthday}
            helperText={estimateAttempted ? estimateValidationErrors.birthday : undefined}
          />

          <FormControl
            fullWidth
            required
            error={estimateAttempted && !!estimateValidationErrors.state}
          >
            <InputLabel id="estimate-state-label">{fieldLabels.state ?? "State"}</InputLabel>
            <MuiSelect
              labelId="estimate-state-label"
              label={fieldLabels.state ?? "State"}
              value={estimateState}
              onChange={(event) => {
                setEstimateState(event.target.value);
                setShowEstimateProducts(false);
                setEstimateRatesByProductId({});
                setEstimateAmountsByProductId({});
              }}
            >
              <MenuItem value="">
                <em>Select a state</em>
              </MenuItem>
              {STATE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </MuiSelect>
            {estimateAttempted && estimateValidationErrors.state && (
              <FormHelperText>{estimateValidationErrors.state}</FormHelperText>
            )}
          </FormControl>

          <FormControl
            fullWidth
            required
            error={estimateAttempted && !!estimateValidationErrors.category}
          >
            <InputLabel id="estimate-category-label">Coverage Category</InputLabel>
            <MuiSelect
              labelId="estimate-category-label"
              label="Coverage Category"
              value={estimateCategory}
              onChange={(event) =>
                handleEstimateCategoryChange(event.target.value as CoverageCategory)
              }
            >
              <MenuItem value="">
                <em>Select a category</em>
              </MenuItem>
              {clientCoverageCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {COVERAGE_CATEGORY_LABELS[category]}
                </MenuItem>
              ))}
            </MuiSelect>
            {estimateAttempted && estimateValidationErrors.category && (
              <FormHelperText>{estimateValidationErrors.category}</FormHelperText>
            )}
          </FormControl>

          {estimateCategoryNeedsGender && (
            <Box>
              <FormLabel
                required
                error={estimateAttempted && !!estimateValidationErrors.gender}
              >
                {fieldLabels.gender ?? "Gender"}
              </FormLabel>
              <ToggleButtonGroup
                value={estimateGender}
                exclusive
                onChange={(_, value) => {
                  if (value === null) return;
                  setEstimateGender(value as "male" | "female");
                  setShowEstimateProducts(false);
                  setEstimateRatesByProductId({});
                  setEstimateAmountsByProductId({});
                }}
                fullWidth
                sx={{
                  mt: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  "& .MuiToggleButton-root": {
                    width: "100%",
                    justifyContent: "flex-start",
                    gap: 1.5,
                    textTransform: "none",
                    borderColor:
                      estimateAttempted && estimateValidationErrors.gender
                        ? "error.main"
                        : undefined,
                  },
                  "& .MuiToggleButton-root.Mui-selected": {
                    bgcolor: "white",
                    color: "text.primary",
                    "&:hover": {
                      bgcolor: "white",
                    },
                  },
                }}
              >
                <ToggleButton value="male" aria-label="Male">
                  <Radio checked={estimateGender === "male"} size="small" sx={{ p: 0 }} />
                  Male
                </ToggleButton>
                <ToggleButton value="female" aria-label="Female">
                  <Radio
                    checked={estimateGender === "female"}
                    size="small"
                    sx={{ p: 0 }}
                  />
                  Female
                </ToggleButton>
              </ToggleButtonGroup>
              {estimateAttempted && estimateValidationErrors.gender && (
                <FormHelperText error>{estimateValidationErrors.gender}</FormHelperText>
              )}
            </Box>
          )}

          {estimateCategoryNeedsSmoker && (
            <>
              <Box>
                <FormLabel
                  required
                  error={estimateAttempted && !!estimateValidationErrors.smoker}
                >
                  Have you used tobacco or nicotine substitutes?
                </FormLabel>
                <ToggleButtonGroup
                  value={estimateSmoker}
                  exclusive
                  onChange={(_, value) => {
                    if (value === null) return;
                    const nextSmoker = value as "yes" | "no";
                    setEstimateSmoker(nextSmoker);
                    if (nextSmoker === "no") {
                      setEstimateTobaccoLastUsed("");
                      setEstimateTobaccoProducts([]);
                    }
                    setShowEstimateProducts(false);
                    setEstimateRatesByProductId({});
                    setEstimateAmountsByProductId({});
                  }}
                  fullWidth
                  sx={{
                    mt: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    "& .MuiToggleButton-root": {
                      width: "100%",
                      justifyContent: "flex-start",
                      gap: 1.5,
                      textTransform: "none",
                      borderColor:
                        estimateAttempted && estimateValidationErrors.smoker
                          ? "error.main"
                          : undefined,
                    },
                    "& .MuiToggleButton-root.Mui-selected": {
                      bgcolor: "white",
                      color: "text.primary",
                      "&:hover": {
                        bgcolor: "white",
                      },
                    },
                  }}
                >
                  <ToggleButton value="yes" aria-label="Yes">
                    <Radio checked={estimateSmoker === "yes"} size="small" sx={{ p: 0 }} />
                    Yes
                  </ToggleButton>
                  <ToggleButton value="no" aria-label="No">
                    <Radio checked={estimateSmoker === "no"} size="small" sx={{ p: 0 }} />
                    No
                  </ToggleButton>
                </ToggleButtonGroup>
                {estimateAttempted && estimateValidationErrors.smoker && (
                  <FormHelperText error>{estimateValidationErrors.smoker}</FormHelperText>
                )}
              </Box>

              {estimateSmoker === "yes" && (
                <>
                  <TextField
                    label="Last Used"
                    type="date"
                    fullWidth
                    required
                    value={estimateTobaccoLastUsed}
                    onChange={(event) => {
                      setEstimateTobaccoLastUsed(event.target.value);
                      setShowEstimateProducts(false);
                      setEstimateRatesByProductId({});
                      setEstimateAmountsByProductId({});
                    }}
                    InputLabelProps={{ shrink: true }}
                    error={estimateAttempted && !!estimateValidationErrors.tobaccoLastUsed}
                    helperText={
                      estimateAttempted
                        ? estimateValidationErrors.tobaccoLastUsed
                        : undefined
                    }
                  />

                  <FormControl
                    fullWidth
                    required
                    error={estimateAttempted && !!estimateValidationErrors.tobaccoProducts}
                  >
                    <InputLabel id="estimate-tobacco-products-label">
                      Product(s) Used
                    </InputLabel>
                    <MuiSelect
                      multiple
                      labelId="estimate-tobacco-products-label"
                      label="Product(s) Used"
                      value={estimateTobaccoProducts}
                      onChange={(event) => {
                        setEstimateTobaccoProducts(event.target.value as string[]);
                        setShowEstimateProducts(false);
                        setEstimateRatesByProductId({});
                        setEstimateAmountsByProductId({});
                      }}
                      renderValue={(selected) => (selected as string[]).join(", ")}
                    >
                      {TOBACCO_PRODUCTS.map((product) => (
                        <MenuItem key={product} value={product}>
                          <Checkbox checked={estimateTobaccoProducts.includes(product)} />
                          {product}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                    {estimateAttempted && estimateValidationErrors.tobaccoProducts && (
                      <FormHelperText>
                        {estimateValidationErrors.tobaccoProducts}
                      </FormHelperText>
                    )}
                  </FormControl>
                </>
              )}
            </>
          )}

          {estimateCategoryNeedsDi && (
            <TextField
              label="Average Monthly Income"
              required
              fullWidth
              value={estimateAvgIncome}
              onChange={(event) => {
                setEstimateAvgIncome(handleCurrencyInput(event.target.value));
                setShowEstimateProducts(false);
                setEstimateRatesByProductId({});
                setEstimateAmountsByProductId({});
              }}
              error={estimateAttempted && !!estimateValidationErrors.avgIncome}
              helperText={
                (estimateAttempted && estimateValidationErrors.avgIncome) ||
                "Monthly income helps determine disability coverage ranges."
              }
            />
          )}

          {estimateCategoryNeedsHours && (
            <TextField
              label="# Hours You Work/Week"
              required
              fullWidth
              value={estimateHoursPerWeek}
              onChange={(event) => {
                const numeric = event.target.value.replace(/[^0-9]/g, "");
                setEstimateHoursPerWeek(numeric);
                setShowEstimateProducts(false);
                setEstimateRatesByProductId({});
                setEstimateAmountsByProductId({});
              }}
              error={estimateAttempted && !!estimateValidationErrors.hours}
              helperText={estimateAttempted ? estimateValidationErrors.hours : undefined}
            />
          )}

          {estimateCategoryNeedsOo && (
            <>
              <TextField
                label="Monthly Business Expenses"
                required
                fullWidth
                value={estimateMonthlyExpenses}
                onChange={(event) => {
                  setEstimateMonthlyExpenses(handleCurrencyInput(event.target.value));
                  setShowEstimateProducts(false);
                  setEstimateRatesByProductId({});
                  setEstimateAmountsByProductId({});
                }}
                error={estimateAttempted && !!estimateValidationErrors.monthlyExpenses}
                helperText={estimateAttempted ? estimateValidationErrors.monthlyExpenses : undefined}
              />

              <TextField
                label="% You Are Responsible For"
                required
                fullWidth
                value={estimateResponsibilityPct}
                onChange={(event) => {
                  const digits = event.target.value.replace(/[^0-9]/g, "");
                  if (!digits) {
                    setEstimateResponsibilityPct("");
                  } else {
                    const normalized = Math.min(parseInt(digits, 10), 100);
                    setEstimateResponsibilityPct(normalized.toString());
                  }
                  setShowEstimateProducts(false);
                  setEstimateRatesByProductId({});
                  setEstimateAmountsByProductId({});
                }}
                error={estimateAttempted && !!estimateValidationErrors.responsibilityPct}
                helperText={estimateAttempted ? estimateValidationErrors.responsibilityPct : undefined}
              />
            </>
          )}

          <Button
            ref={getEstimateButtonRef}
            variant="contained"
            onClick={() => {
              void handleGetEstimate();
            }}
            disabled={estimatingQuotes}
          >
            {estimatingQuotes ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} color="inherit" />
                <span>Getting estimate...</span>
              </Stack>
            ) : (
              "Get estimate"
            )}
          </Button>

          {(estimatingQuotes || showEstimateProducts) && (
            <Stack spacing={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Available products in {COVERAGE_CATEGORY_LABELS[estimateCategory as CoverageCategory]}
              </Typography>

              {estimatingQuotes ? (
                <Stack spacing={2}>
                  {Array.from({ length: Math.max(estimateCategoryProducts.length, 2) }).map((_, index) => (
                    <Box
                      key={`estimate-skeleton-${index}`}
                      sx={{
                        bgcolor: "#f0f3f8",
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      <Skeleton variant="text" width="60%" height={28} />
                      <Skeleton variant="text" width="40%" height={20} />
                      <Skeleton variant="rounded" height={56} sx={{ mt: 1.5 }} />
                      <Skeleton variant="text" width="50%" height={24} sx={{ mt: 1 }} />
                    </Box>
                  ))}
                </Stack>
              ) : (
                estimateCategoryProducts.length === 0 ? (
                  <Alert severity="info">
                    No products are currently available for this category.
                  </Alert>
                ) : (
                  estimateCategoryProducts.map((product) => (
                    <Box
                      key={product.id}
                      sx={{
                        bgcolor: "#f0f3f8",
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {product.name}
                      </Typography>
                      {productAmounts[product.id] && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Typical range: {productAmounts[product.id]}
                        </Typography>
                      )}
                      <FormControl fullWidth sx={{ mt: 1.5 }}>
                        <InputLabel id={`${product.id}-estimate-amount-label`}>
                          Coverage Amount
                        </InputLabel>
                        <MuiSelect
                          labelId={`${product.id}-estimate-amount-label`}
                          label="Coverage Amount"
                          value={estimateAmountsByProductId[product.id] ?? 0}
                          onChange={(event) => {
                            void handleEstimateAmountChange(
                              product,
                              Number(event.target.value),
                            );
                          }}
                        >
                          <MenuItem value={0}>$0</MenuItem>
                          {product.amounts
                            .slice()
                            .sort((a, b) => a - b)
                            .map((amount) => (
                              <MenuItem key={amount} value={amount}>
                                {amount.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                  maximumFractionDigits: 0,
                                })}
                              </MenuItem>
                            ))}
                        </MuiSelect>
                      </FormControl>
                      {(estimateRatesByProductId[product.id] ?? 0) > 0 && (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="baseline"
                          sx={{ mt: 1 }}
                        >
                          <Typography variant="body1" color="text.secondary">
                            Estimated cost
                            <Box component="sup">1</Box>:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "success.main",
                              fontWeight: 600,
                              fontSize: "1rem",
                            }}
                          >
                            {formatMonthly(estimateRatesByProductId[product.id])}/mo
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  ))
                )
              )}
            </Stack>
          )}
        </Stack>
      );
    }

    return <Typography color="text.secondary">Content coming soon.</Typography>;
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleConfirmMembership} noValidate>
        <FormPageLayout
          header={
            <PageHeader
              title="Start your insurance application below."
              titleWeight={600}
              notes={
                <ScrollChipRow
                  items={[
                    {
                      label: "How does applying work?",
                      onClick: () =>
                        handleOpenDrawer("How does applying work?"),
                    },
                    {
                      label: "How much does it cost?",
                      onClick: () => handleOpenDrawer("How much does it cost?"),
                    },
                  ]}
                />
              }
            />
          }
          navigation={
            showAdditionalFields ? (
              <PageNavigation
                showBack={false}
                continueDisabled={waepaContinueDisabled}
              />
            ) : null
          }
        >
          <FormStepTransition>
            <Stack spacing={3}>
              {membershipQuestionElement}
              {showIneligibleMessage && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  Only members are eligible for coverage. Please contact your
                  association for assistance.
                </Alert>
              )}

              {showWaepaNewMemberFields && (
                <>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    Welcome! Please provide the following information to
                    complete your membership.
                  </Alert>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    {ACTIVE_CLIENT_ID === "ama" && (
                      <Box sx={{ width: { xs: "100%", md: "100px" } }}>
                        <RHFSelect
                          name="title"
                          label="Title"
                          options={TITLE_OPTIONS}
                        />
                      </Box>
                    )}
                    <Box sx={{ flex: 1 }}>
                      <RHFTextField
                        name="firstName"
                        label="First Name"
                        required
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <RHFTextField
                        name="lastName"
                        label="Last Name"
                        required
                      />
                    </Box>
                  </Stack>
                  <RHFTextField
                    name="email"
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                  <Controller
                    name="phoneNumber"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Phone Number"
                        required
                        fullWidth
                        autoComplete="tel"
                        inputProps={{ inputMode: "tel" }}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(formatUSPhone(e.target.value))
                        }
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                  <RHFSelect
                    name="waepaAttestation"
                    label="I hereby attest that I am a U.S. citizen and meet one of the following qualifications:"
                    options={WAEPA_ATTESTATION_OPTIONS}
                    required
                    useStandardLabel
                  />
                  {showWaepaEmploymentFields && (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      <Controller
                        name="waepaEmployer"
                        control={methods.control}
                        rules={{
                          required: "Please select your employing agency",
                        }}
                        render={({ field, fieldState }) => (
                          <Autocomplete
                            options={WAEPA_EMPLOYER_OPTIONS}
                            value={field.value ?? null}
                            onChange={(_, value) => field.onChange(value)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="I am employed by"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                              />
                            )}
                          />
                        )}
                      />
                      <RHFTextField
                        name="waepaStartDate"
                        label="Start Date"
                        type="date"
                        required
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>
                  )}
                  <RHFCheckbox
                    name="waepaDeclaration"
                    label="By submitting this application, I attest that the answers to the questions herein are true."
                    rules={{ required: true }}
                    required
                  />
                </>
              )}

              {showAdditionalFields && (
                <>
                  {!showWaepaNewMemberFields && (
                    <>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
                        {ACTIVE_CLIENT_ID === "ama" && (
                          <Box sx={{ width: { xs: "100%", md: "100px" } }}>
                            <RHFSelect
                              name="title"
                              label="Title"
                              options={TITLE_OPTIONS}
                            />
                          </Box>
                        )}
                        <Box sx={{ flex: 1 }}>
                          <RHFTextField
                            name="firstName"
                            label="First Name"
                            required
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <RHFTextField
                            name="lastName"
                            label="Last Name"
                            required
                          />
                        </Box>
                      </Stack>

                      <RHFTextField
                        name="email"
                        label="Email"
                        type="email"
                        required
                        autoComplete="email"
                      />

                      <Controller
                        name="phoneNumber"
                        control={methods.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Phone Number"
                            required
                            fullWidth
                            autoComplete="tel"
                            inputProps={{ inputMode: "tel" }}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(formatUSPhone(e.target.value))
                            }
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />
                    </>
                  )}
                </>
              )}
            </Stack>
          </FormStepTransition>

          <CoverageDetailsModal
            open={coverageCatalogOpen}
            onClose={() => setCoverageCatalogOpen(false)}
            coverageInfoCards={coverageInfoCards}
            productAmounts={productAmounts}
            categoryAmounts={categoryAmounts}
          />

          <QuickQuoteModal
            open={quickQuoteOpen}
            onClose={() => setQuickQuoteOpen(false)}
          />

          <SwipeableDrawer
            anchor="bottom"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onOpen={() => setDrawerOpen(true)}
          >
            <Box ref={drawerScrollRef} sx={{ p: 3, maxHeight: "90vh", overflowY: "auto" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontSize: "1.25rem" }}>
                  {drawerTitle}
                </Typography>
                <IconButton
                  onClick={() => setDrawerOpen(false)}
                  size="small"
                  sx={{ color: "text.secondary" }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              {renderDrawerContent()}
            </Box>
          </SwipeableDrawer>

          <Dialog
            open={processOpen}
            onClose={() => setProcessOpen(false)}
            aria-labelledby="process-title"
          >
            <DialogTitle id="process-title">
              About the application process
            </DialogTitle>
            <DialogContent>
              <Typography>Process modal coming soon.</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setProcessOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={aboutApplicationReviewOpen}
            onClose={() => setAboutApplicationReviewOpen(false)}
            aria-labelledby="about-application-review-title"
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle id="about-application-review-title">
              About the Application Review Process
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Typography>
                  When you apply for coverage, our underwriting team reviews
                  your application to make a decision.
                </Typography>
                <Typography>
                  Depending on the coverage you're applying for and the
                  information you provide, you may be asked to answer some
                  health-related questions. This helps us evaluate your
                  eligibility and determine the best rate for you.
                </Typography>
                <Typography>
                  The review process typically takes a few business days, but
                  with our QuickDecision<sup>SM</sup> program, many applications
                  can be approved faster without requiring a medical exam.
                </Typography>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAboutApplicationReviewOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </FormPageLayout>
      </form>
    </FormProvider>
  );
}

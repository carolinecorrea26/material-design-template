import React from "react";
import {
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  IconButton,
  Box,
  Alert,
  SwipeableDrawer,
  Button,
} from "@mui/material";
import {
  BlockOutlined,
  Close as CloseIcon,
  Add as AddIcon,
  CheckCircle,
  RemoveCircleRounded,
  PersonOutline,
  FavoriteBorder,
  ChildCare,
} from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
import ScrollChipRow from "../components/layout/ScrollChipRow";
import FormStepTransition from "../components/layout/FormStepTransition";
import PageNavigation from "../components/layout/PageNavigation";
import FormPageLayout from "../components/layout/FormPageLayout";
import { FormProvider, useForm, Controller, useWatch } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RHFTextField from "../components/form/RHFTextField";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFSelect from "../components/form/RHFSelect";
import RHFCheckbox from "../components/form/RHFCheckbox";
import DateField from "../components/form/DateField";
import {
  EligibilitySchema,
  type EligibilityForm,
  CoverageCat,
} from "../validation/eligibility";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { useScrollToFirstError } from "../hooks/useScrollToFirstError";
import { commonStyles } from "../theme/commonStyles";
import {
  getClientMembershipQuestion,
  ACTIVE_CLIENT_ID,
  getClientBranding,
  getClientCoverageCategories,
  getClientProductAmounts,
} from "../config/clients";
import { getProducts } from "../api/client";
import { COVERAGE_CARDS } from "../constants/getStartedProducts";
import { STATE_OPTIONS } from "../constants/eligibility";
import { PRODUCT_LOOKUP } from "../constants/getStartedProducts";
import { getStateFromZip } from "../utils/zipToState";
import { CoverageDetailsContent } from "../components/modals/CoverageDetailsModal";
import type { Product, CoverageCategory, Applicant } from "../types/app";

type CoverageDetailsProduct = {
  id: string;
  name: string;
  applicants: string[];
  href: string;
};

type CoverageDetailsCategory = {
  id: CoverageCategory;
  description: string;
  products: CoverageDetailsProduct[];
};

const APPLICANT_LABELS: Record<Applicant, string> = {
  self: "Self",
  spouse: "Spouse",
  child: "Child",
};

function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          bgcolor: "#dbe4f3",
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          "& svg": {
            width: "0.875em",
            height: "0.875em",
          },
        }}
      >
        {icon}
      </Box>
      <Typography sx={commonStyles.sidebarText}>{label}</Typography>
    </Stack>
  );
}

export default function Eligibility() {
  const { data, setEligibility } = useAppData();
  const { next, markComplete } = useStepper();
  const navigate = useNavigate();
  const [showIneligibleDialog, setShowIneligibleDialog] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [drawerContent, setDrawerContent] = React.useState("");
  const branding = getClientBranding();
  const clientCoverageCategories = React.useMemo(
    () => getClientCoverageCategories(),
    [],
  );
  const [productCatalog, setProductCatalog] = React.useState<Product[]>([]);
  const productAmounts = React.useMemo(() => getClientProductAmounts(), []);
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

  const getStartedSummary = data.getStarted;
  const savedGetStarted = getStartedSummary?.productSelections ?? [];

  React.useEffect(() => {
    let mounted = true;
    getProducts()
      .then((fetched) => {
        if (!mounted) return;
        if (Array.isArray(fetched) && fetched.length > 0) {
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
      `https://d160mojjx9yhiu.cloudfront.net/pdfs/4591/${brochurePrefix}-${category.toLowerCase()}-overview.pdf`,
    [brochurePrefix],
  );

  const defaultCoverageCards = React.useMemo<CoverageDetailsCategory[]>(
    () =>
      COVERAGE_CARDS.map((card) => ({
        id: card.id as CoverageCategory,
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

  const coverageCards = React.useMemo<CoverageDetailsCategory[]>(() => {
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
          description: meta?.description ?? "",
          products: categoryProducts.map((product) => ({
            id: product.id,
            name: product.name,
            applicants: product.eligibleApplicants.map(
              (applicant) => APPLICANT_LABELS[applicant] ?? applicant,
            ),
            href: getBrochureUrl(category),
          })),
        } satisfies CoverageDetailsCategory;
      })
      .filter((card): card is CoverageDetailsCategory => Boolean(card));

    return cards.length ? cards : defaultCoverageCards;
  }, [productCatalog, defaultCoverageCards, getBrochureUrl]);

  const coverageInfoCards = React.useMemo(
    () =>
      coverageCards.filter((card) =>
        clientCoverageCategories.includes(card.id),
      ),
    [clientCoverageCategories, coverageCards],
  );

  React.useEffect(() => {
    if (getStartedSummary && (savedGetStarted ?? []).length === 0) {
      navigate("/get-started", { replace: true });
    }
  }, [getStartedSummary, savedGetStarted, navigate]);

  const derivedApplicants = React.useMemo(() => {
    if (getStartedSummary?.applicants) {
      return { ...getStartedSummary.applicants, self: true };
    }
    const applicants = { self: true, spouse: false, child: false };
    savedGetStarted.forEach((productId) => {
      const config = PRODUCT_LOOKUP[productId];
      if (!config) return;
      config.applicants.forEach((app) => {
        if (app === "Self") applicants.self = true;
        if (app === "Spouse") applicants.spouse = true;
        if (app === "Child") applicants.child = true;
      });
    });
    return applicants;
  }, [getStartedSummary?.applicants, savedGetStarted]);

  const derivedSelfCoverages = React.useMemo<CoverageCat[]>(() => {
    if (getStartedSummary?.coverageByApplicant?.self) {
      return getStartedSummary.coverageByApplicant.self;
    }
    const set = new Set<CoverageCat>();
    savedGetStarted.forEach((productId) => {
      const config = PRODUCT_LOOKUP[productId];
      if (config && config.applicants.includes("Self")) {
        set.add(config.coverageCategory);
      }
    });
    return Array.from(set);
  }, [getStartedSummary?.coverageByApplicant?.self, savedGetStarted]);

  const derivedSpouseCoverages = React.useMemo<CoverageCat[]>(() => {
    if (getStartedSummary?.coverageByApplicant?.spouse) {
      return getStartedSummary.coverageByApplicant.spouse;
    }
    const set = new Set<CoverageCat>();
    savedGetStarted.forEach((productId) => {
      const config = PRODUCT_LOOKUP[productId];
      if (config && config.applicants.includes("Spouse")) {
        set.add(config.coverageCategory);
      }
    });
    return Array.from(set);
  }, [getStartedSummary?.coverageByApplicant?.spouse, savedGetStarted]);

  const methods = useForm<EligibilityForm>({
    resolver: zodResolver(EligibilitySchema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      isMember: undefined,
      title: "",
      firstName: "",
      middleInitial: "",
      lastName: "",
      suffix: "",
      birthday: "",
      gender: undefined,
      email: "",
      applicants: derivedApplicants,
      selfCoverages: derivedSelfCoverages,
      spouseIsMember: undefined,
      spouseTitle: "",
      spouseFirstName: "",
      spouseMiddleInitial: "",
      spouseLastName: "",
      spouseSuffix: "",
      spouseBirthday: "",
      spouseGender: undefined,
      spouseEmail: "",
      spouseCoverages: derivedSpouseCoverages,
      children: [],
      zipCode: data.eligibility?.zipCode ?? "",
      state: data.eligibility?.state ?? "",
      selfTobaccoLastUsed: "",
      selfTobaccoProducts: [],
      spouseTobaccoLastUsed: "",
      spouseTobaccoProducts: [],
      coverageProductSelections: savedGetStarted,
      ...data.eligibility,
    },
  });
  useScrollToFirstError(methods);

  // Scroll to top when there are errors after form submission
  React.useEffect(() => {
    if (
      methods.formState.submitCount > 0 &&
      Object.keys(methods.formState.errors).length > 0
    ) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [methods.formState.submitCount, methods.formState.errors]);

  // Get client-specific membership question configuration
  const membershipQuestion = getClientMembershipQuestion();

  const applicantsValue = useWatch({
    control: methods.control,
    name: "applicants",
  });
  const applyingSpouse = applicantsValue?.spouse ?? derivedApplicants.spouse;
  const applyingChild = applicantsValue?.child ?? derivedApplicants.child;
  const membershipValue = useWatch({
    control: methods.control,
    name: "isMember",
  });
  const zipCodeValue = useWatch({
    control: methods.control,
    name: "zipCode",
  });
  const [stateAutoFilled, setStateAutoFilled] = React.useState(false);
  const childrenValues = methods.watch("children") ?? [];
  // Check if there are any spouse-related errors
  const hasSpouseErrors = Object.keys(methods.formState.errors).some((key) =>
    key.startsWith("spouse"),
  );
  const hasChildErrors = Object.keys(methods.formState.errors).some((key) =>
    key.startsWith("children"),
  );

  // Ensure at least one child exists when child is selected
  React.useEffect(() => {
    if (!applyingChild) {
      return;
    }
    const currentChildren = methods.getValues("children");
    if (!currentChildren || currentChildren.length === 0) {
      methods.setValue("children", [
        {
          firstName: "",
          lastName: "",
          birthday: "",
          gender: undefined,
          militaryDischarge: undefined,
        },
      ]);
    }
  }, [applyingChild, methods]);

  React.useEffect(() => {
    if (membershipValue === "no") {
      setShowIneligibleDialog(true);
    }
  }, [membershipValue]);

  React.useEffect(() => {
    const stateFromZip = getStateFromZip(zipCodeValue);
    if (!stateFromZip) return;
    if (stateFromZip === methods.getValues("state")) return;

    methods.setValue("state", stateFromZip, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setStateAutoFilled(true);
    const t = setTimeout(() => setStateAutoFilled(false), 2500);
    return () => clearTimeout(t);
  }, [zipCodeValue, methods]);

  // DevTools: Fill form with test data
  React.useEffect(() => {
    const handleFillForm = () => {
      // Basic self information - set membership based on client
      const membershipValue = ACTIVE_CLIENT_ID === "ama" ? "physician" : "yes";

      const filledData: EligibilityForm = {
        isMember: membershipValue,
        firstName: "John",
        middleInitial: "A",
        lastName: "Doe",
        birthday: "1985-01-15",
        gender: "male",
        email: "john.doe@example.com",
        zipCode: "94105",
        state: "California",

        applicants: { self: true, spouse: true, child: true },
        selfCoverages: ["LI", "AD", "DI", "OO", "SH"],
        selfAvgIncome: "5000",
        selfHoursPerWeek: "40",
        selfMonthlyExpenses: "$5,000",
        selfRespPct: "100",
        smokerSelf: "yes",
        selfTobaccoLastUsed: "2020-06-15",
        selfTobaccoProducts: [
          "Betel nut",
          "Chewing tobacco",
          "Cigar",
          "Cigarettes",
          "E-Cigarettes",
          "Nicotine gum",
          "Nicotine inhaler",
          "Nicotine lozenge",
          "Nicotine patch",
          "Nasal spray",
          "Pipe",
          "Snuff",
        ],

        spouseIsMember: ACTIVE_CLIENT_ID !== "ama" ? "yes" : undefined,
        spouseFirstName: "Jane",
        spouseMiddleInitial: "B",
        spouseLastName: "Doe",
        spouseBirthday: "1987-03-22",
        spouseGender: "female",
        spouseEmail: "jane.doe@example.com",
        spouseCoverages: ["LI", "AD", "DI", "SH"],
        spouseAvgIncome: "$4,500",
        spouseHoursPerWeek: "35",
        smokerSpouse: "yes",
        spouseTobaccoLastUsed: "2019-11-08",
        spouseTobaccoProducts: [
          "Betel nut",
          "Chewing tobacco",
          "Cigar",
          "Cigarettes",
          "E-Cigarettes",
          "Nicotine gum",
          "Nicotine inhaler",
          "Nicotine lozenge",
          "Nicotine patch",
          "Nasal spray",
          "Pipe",
          "Snuff",
        ],

        children: [
          {
            firstName: "Alex",
            lastName: "Doe",
            birthday: "2015-08-10",
            gender: "male",
            militaryDischarge: "no",
          },
        ],
        coverageProductSelections: savedGetStarted,
      };

      methods.reset(filledData);
    };

    window.addEventListener("devtools:fillform", handleFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleFillForm);
  }, [methods]);

  const onSubmit: SubmitHandler<EligibilityForm> = (values) => {
    if (!data.eligibility) return;

    // Allow submission for valid membership values
    const validMembershipValues = [
      "yes",
      "physician",
      "resident",
      "student",
      "retired",
      "spouse",
    ];
    if (validMembershipValues.includes(values.isMember || "")) {
      const preservedFields: Array<keyof EligibilityForm> = [
        "gender",
        "spouseGender",
        "smokerSelf",
        "smokerSpouse",
        "selfTobaccoLastUsed",
        "selfTobaccoProducts",
        "spouseTobaccoLastUsed",
        "spouseTobaccoProducts",
        "selfAvgIncome",
        "selfHoursPerWeek",
        "selfMonthlyExpenses",
        "selfRespPct",
        "spouseAvgIncome",
        "spouseHoursPerWeek",
      ];
      const merged: EligibilityForm = {
        ...data.eligibility,
        ...values,
      };
      preservedFields.forEach((field) => {
        if (
          values[field] === undefined &&
          data.eligibility?.[field] !== undefined
        ) {
          Object.assign(merged, {
            [field]: data.eligibility[field],
          });
        }
      });
      setEligibility(merged);
      markComplete();
      next();
      navigate("/add-coverage");
    }
  };

  // Helper function to render membership question based on client config
  const renderMembershipQuestion = (
    name: string,
    question: string,
    isRequired: boolean = true,
  ) => {
    if (!membershipQuestion) {
      // Fallback to default radio question
      return (
        <RHFRadioGroup
          name={name}
          label={question}
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
          required={isRequired}
        />
      );
    }

    if (membershipQuestion.type === "radio") {
      return (
        <RHFRadioGroup
          name={name}
          label={question}
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]}
          required={isRequired}
        />
      );
    } else if (membershipQuestion.type === "select") {
      // Use spouseOptions for spouse questions, fallback to options
      const options =
        name.startsWith("spouse") && membershipQuestion.spouseOptions
          ? membershipQuestion.spouseOptions
          : membershipQuestion.options;

      if (options) {
        return (
          <RHFSelect
            name={name}
            label={question}
            options={options}
            required={isRequired}
          />
        );
      }
    }

    // Fallback
    return (
      <RHFRadioGroup
        name={name}
        label={question}
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
        required={isRequired}
      />
    );
  };

  const handleOpenDrawer = (content: string) => {
    setDrawerContent(content);
    setDrawerOpen(true);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <FormPageLayout
          header={
            <Stack spacing={2}>
              <PageHeader
                title="Check your eligibility for coverage."
                notes=""
              />
              <ScrollChipRow
                items={[
                  {
                    label: "What coverage options are available?",
                    onClick: () =>
                      handleOpenDrawer("What coverage options are available?"),
                  },
                ]}
              />
              {Object.keys(methods.formState.errors).length > 0 && (
                <Alert severity="error">
                  Help us determine your eligibility for coverage by completing
                  all required fields.
                </Alert>
              )}
            </Stack>
          }
          navigation={
            <PageNavigation
              hasUnsavedChanges={() => {
                const formValues = methods.getValues();
                const hasData =
                  formValues.firstName ||
                  formValues.lastName ||
                  formValues.email ||
                  formValues.birthday;
                return methods.formState.isDirty || !!hasData;
              }}
            />
          }
        >
          <FormStepTransition>
            <Stack spacing={4}>
              {/* Your Eligibility Section - Always visible */}
              <Stack spacing={0}>
                <SectionLabel icon={<PersonOutline />} label="Self" />
                <Stack spacing={3}>
                  <Controller
                    name="zipCode"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <RHFTextField
                        {...field}
                        label="ZIP / Postal Code"
                        required
                        inputProps={{ maxLength: 7 }}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "");
                          if (!raw) {
                            field.onChange("");
                            return;
                          }
                          const looksCanadian = /^[A-Z]/.test(raw);
                          if (looksCanadian) {
                            const formatted = raw
                              .slice(0, 6)
                              .replace(/(.{3})/, "$1 ")
                              .trim();
                            field.onChange(formatted);
                            return;
                          }
                          field.onChange(raw.slice(0, 5));
                        }}
                        onBlur={() => {
                          field.onBlur();
                          methods.trigger("zipCode");
                        }}
                        error={!!fieldState.error && fieldState.isTouched}
                        helperText={
                          fieldState.isTouched ? fieldState.error?.message : ""
                        }
                      />
                    )}
                  />
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <RHFSelect
                      name="state"
                      label="State / Province"
                      options={STATE_OPTIONS}
                      required
                    />
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mt: 0.25,
                        overflow: "hidden",
                        maxHeight: stateAutoFilled ? "24px" : "0px",
                        opacity: stateAutoFilled ? 1 : 0,
                        transform: stateAutoFilled
                          ? "translateY(0)"
                          : "translateY(-4px)",
                        transition:
                          "max-height 200ms ease, opacity 200ms ease, transform 200ms ease",
                      }}
                    >
                      <CheckCircle
                        sx={{ fontSize: "0.9rem", color: "success.main" }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: "success.main", fontWeight: 500 }}
                      >
                        Based on your ZIP / postal code
                      </Typography>
                    </Box>
                  </Box>
                  <DateField
                    name="birthday"
                    label="Birthday"
                    required
                    autoComplete="bday"
                  />
                  <Stack spacing={1}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Would you like to add dependent coverage?
                    </Typography>
                    <Stack spacing={1}>
                      <RHFCheckbox
                        name="applicants.spouse"
                        label="Spouse Coverage"
                      />
                      <RHFCheckbox
                        name="applicants.child"
                        label="Child Coverage"
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>

              {/* Spouse Section */}
              <Box
                sx={{
                  display: applyingSpouse || hasSpouseErrors ? "block" : "none",
                }}
              >
                <Stack spacing={0}>
                  <SectionLabel icon={<FavoriteBorder />} label="Spouse" />
                  <Stack spacing={3}>
                    <Alert severity="info">
                      Domestic Partnership/Civil Union is determined by State
                      Law and they will be referred to as "Spouse" throughout
                      the application.
                    </Alert>

                    <Stack spacing={3}>
                      {renderMembershipQuestion(
                        "spouseIsMember",
                        membershipQuestion?.spouseQuestion ||
                          "Is your Spouse also an active member of a State, Local, or Specialty Bar Association?",
                        false,
                      )}
                      {/* Spouse Name Fields */}
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        sx={{ mt: 1 }}
                      >
                        <Box sx={{ flex: { xs: "1", md: "1" } }}>
                          <RHFTextField
                            name="spouseFirstName"
                            label="First Name"
                            required
                          />
                        </Box>
                        <Box sx={{ flex: { xs: "1", md: "1" } }}>
                          <RHFTextField
                            name="spouseLastName"
                            label="Last Name"
                            required
                          />
                        </Box>
                      </Stack>
                      <DateField
                        name="spouseBirthday"
                        label="Birthday"
                        required
                      />{" "}
                      <RHFTextField
                        name="spouseEmail"
                        label="Email"
                        type="email"
                        required
                        autoComplete="email"
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </Box>

              {/* Child Section */}
              <Box
                sx={{
                  display: applyingChild || hasChildErrors ? "block" : "none",
                }}
              >
                <Stack spacing={0}>
                  <SectionLabel icon={<ChildCare />} label="Child(ren)" />
                  <Stack spacing={3}>
                    <Alert severity="info">
                      Only unmarried children are eligible for coverage.
                    </Alert>

                    <Stack spacing={3}>
                      {childrenValues.map((_, index) => (
                        <Box key={index} sx={commonStyles.mutedSectionPanel}>
                          <Stack spacing={2}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography
                                variant="overline"
                                sx={commonStyles.overlineLabel}
                              >
                                About Child
                              </Typography>
                              {childrenValues.length > 1 && (
                                <Button
                                  size="small"
                                  color="error"
                                  startIcon={<RemoveCircleRounded />}
                                  onClick={() => {
                                    const currentChildren =
                                      methods.getValues("children") ?? [];
                                    methods.setValue(
                                      "children",
                                      currentChildren.filter(
                                        (_, i) => i !== index,
                                      ),
                                    );
                                  }}
                                >
                                  Remove
                                </Button>
                              )}
                            </Stack>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={2}
                            >
                              <Box sx={{ flex: 1 }}>
                                <RHFTextField
                                  name={`children.${index}.firstName`}
                                  label="First Name"
                                  required
                                />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <RHFTextField
                                  name={`children.${index}.lastName`}
                                  label="Last Name"
                                  required
                                />
                              </Box>
                            </Stack>
                            <DateField
                              name={`children.${index}.birthday`}
                              label="Birthday"
                              required
                            />{" "}
                            <RHFRadioGroup
                              name={`children.${index}.gender`}
                              label="Gender"
                              options={[
                                { label: "Male", value: "male" },
                                { label: "Female", value: "female" },
                              ]}
                              required
                            />
                            <RHFRadioGroup
                              name={`children.${index}.militaryDischarge`}
                              label="Has this child been honorably discharged from active or reserve services in the Armed Forces?"
                              options={[
                                { label: "Yes", value: "yes" },
                                { label: "No", value: "no" },
                              ]}
                              required
                            />
                          </Stack>
                        </Box>
                      ))}

                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        fullWidth
                        onClick={() => {
                          const currentChildren = methods.getValues("children");
                          methods.setValue("children", [
                            ...currentChildren,
                            {
                              firstName: "",
                              lastName: "",
                              birthday: "",
                              gender: undefined,
                              militaryDischarge: undefined,
                            },
                          ]);
                        }}
                      >
                        Add Child
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </FormStepTransition>
        </FormPageLayout>
      </form>

      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {drawerContent}
          </Typography>
          {drawerContent === "What coverage options are available?" ? (
            <CoverageDetailsContent
              coverageInfoCards={coverageInfoCards}
              productAmounts={productAmounts}
              categoryAmounts={categoryAmounts}
            />
          ) : (
            <Typography color="text.secondary">Content coming soon.</Typography>
          )}
        </Box>
      </SwipeableDrawer>

      <Dialog
        open={showIneligibleDialog}
        onClose={() => setShowIneligibleDialog(false)}
        aria-labelledby="ineligible-dialog-title"
      >
        <DialogTitle
          id="ineligible-dialog-title"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BlockOutlined color="error" />
            Ineligible for Coverage
          </Box>
          <IconButton
            edge="end"
            onClick={() => setShowIneligibleDialog(false)}
            aria-label="close"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            We're sorry, but only members are eligible for coverage. If you need
            more information, please contact the Plan Administrator at the
            address below. To cancel this session, simply close this window.
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}

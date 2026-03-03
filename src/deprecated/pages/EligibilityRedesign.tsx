import React from "react";
import {
  Stack,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  IconButton,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  FormLabel,
  Card,
  CardContent,
  Chip,
  Collapse,
} from "@mui/material";
import {
  BlockOutlined,
  People,
  Person,
  ChildFriendly,
  Close as CloseIcon,
  Add as AddIcon,
  PolicyOutlined,
  VolunteerActivismRounded,
  GppGoodRounded,
  AccessibleForwardRounded,
  ApartmentRounded,
  LocalHospitalRounded,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import PageHeader from "../../components/layout/PageHeader";
import PageNavigation from "../../components/layout/PageNavigation";
import { CollapsibleSection } from "../../components/common";
import { FormProvider, useForm, Controller, useWatch } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RHFTextField from "../../components/form/RHFTextField";
import RHFRadioGroup from "../../components/form/RHFRadioGroup";
import RHFSelect from "../../components/form/RHFSelect";
import DateField from "../../components/form/DateField";
import {
  EligibilitySchema,
  type EligibilityForm,
  CoverageCat,
} from "../../validation/eligibility";
import { useAppData } from "../../state/AppDataContext";
import { useStepper } from "../../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";
import { commonStyles } from "../../theme/commonStyles";
import {
  getClientMembershipQuestion,
  ACTIVE_CLIENT_ID,
} from "../../config/clients";
import {
  SELF_COVERAGE_OPTIONS,
  SPOUSE_COVERAGE_OPTIONS,
  TITLE_OPTIONS,
  TOBACCO_PRODUCTS,
  STATE_OPTIONS,
} from "../../constants/eligibility";

const SELF_OPTS: CoverageCat[] = SELF_COVERAGE_OPTIONS;
const SPOUSE_OPTS: CoverageCat[] = SPOUSE_COVERAGE_OPTIONS;

const APPLICANT_OPTIONS = ["Self", "Spouse", "Child"] as const;

const getApplicantChipStyles = (applicant: string) => {
  switch (applicant) {
    case "Self":
      return {
        bgcolor: "rgba(25, 118, 210, 0.12)",
        color: "primary.main",
        borderColor: "rgba(25, 118, 210, 0.3)",
      };
    case "Spouse":
      return {
        bgcolor: "rgba(156, 39, 176, 0.08)",
        color: "secondary.dark",
        borderColor: "rgba(156, 39, 176, 0.25)",
      };
    case "Child":
      return {
        bgcolor: "rgba(76, 175, 80, 0.1)",
        color: "success.dark",
        borderColor: "rgba(76, 175, 80, 0.25)",
      };
    default:
      return {
        bgcolor: "background.default",
        color: "text.primary",
        borderColor: "divider",
      };
  }
};

const COVERAGE_CARDS = [
  {
    id: "LI",
    title: "Group Life Insurance",
    description:
      "Protect your family or business with level term options tailored for attorneys.",
    icon: VolunteerActivismRounded,
    products: [
      {
        id: "li-term10",
        name: "10-Year Level Term Life Insurance",
        applicants: ["Self", "Spouse"],
        monthlyEstimate: "$20–$45/mo",
        coverageHighlight: "$500K of protection",
      },
      {
        id: "li-term20",
        name: "20-Year Level Term Life Insurance",
        applicants: ["Self", "Spouse"],
        monthlyEstimate: "$32–$60/mo",
        coverageHighlight: "$1M of protection",
      },
    ],
  },
  {
    id: "AD",
    title: "Accidental Death & Dismemberment",
    description:
      "Extra protection that pays benefits for covered accidental injury or loss.",
    icon: GppGoodRounded,
    products: [
      {
        id: "li-adt",
        name: "Accidental Death & Dismemberment",
        applicants: ["Self", "Spouse", "Child"],
        monthlyEstimate: "$5–$12/mo",
        coverageHighlight: "$300K AD&D benefit",
      },
    ],
  },
  {
    id: "DI",
    title: "Group Disability Insurance",
    description:
      "Replace lost income and keep your practice running if an illness or injury sidelines you.",
    icon: AccessibleForwardRounded,
    products: [
      {
        id: "di-basic",
        name: "LTD 70% Monthly Benefit",
        applicants: ["Self", "Spouse"],
        monthlyEstimate: "$55–$110/mo",
        coverageHighlight: "70% income replacement",
      },
      {
        id: "di-student",
        name: "Resident & Fellow Disability",
        applicants: ["Self"],
        monthlyEstimate: "$28–$65/mo",
        coverageHighlight: "$5K/mo benefit",
      },
      {
        id: "di-premium",
        name: "Own-Occupation Disability",
        applicants: ["Self", "Spouse"],
        monthlyEstimate: "$80–$150/mo",
        coverageHighlight: "$12K/mo own-occ benefit",
      },
    ],
  },
  {
    id: "OO",
    title: "Office Overhead Expense",
    description:
      "Cover rent, payroll, and other business expenses during a prolonged disability.",
    icon: ApartmentRounded,
    products: [
      {
        id: "oo-10k",
        name: "$10K Monthly Expense Benefit",
        applicants: ["Self"],
        monthlyEstimate: "$65–$95/mo",
        coverageHighlight: "$10K office overhead",
      },
      {
        id: "oo-20k",
        name: "$20K Monthly Expense Benefit",
        applicants: ["Self"],
        monthlyEstimate: "$110–$160/mo",
        coverageHighlight: "$20K office overhead",
      },
    ],
  },
  {
    id: "SH",
    title: "Supplemental Health",
    description:
      "Cash benefits to offset hospital stays, critical illness, or recovery costs.",
    icon: LocalHospitalRounded,
    products: [
      {
        id: "sh-hospital",
        name: "Hospital Income Plan",
        applicants: ["Self", "Spouse", "Child"],
        monthlyEstimate: "$18–$35/mo",
        coverageHighlight: "$300/day hospital cash",
      },
      {
        id: "sh-critical",
        name: "Critical Illness Benefit",
        applicants: ["Self", "Spouse"],
        monthlyEstimate: "$22–$48/mo",
        coverageHighlight: "$50K lump sum",
      },
    ],
  },
] as const;

export default function Eligibility() {
  const { data, setEligibility } = useAppData();
  const { next, markComplete } = useStepper();
  const navigate = useNavigate();
  const [showIneligibleDialog, setShowIneligibleDialog] = React.useState(false);

  const methods = useForm<EligibilityForm>({
    resolver: zodResolver(EligibilitySchema) as any,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: data.eligibility ?? {
      isMember: undefined,
      title: "",
      firstName: "",
      middleInitial: "",
      lastName: "",
      suffix: "",
      birthday: "",
      gender: undefined,
      email: "",
      applicants: { self: false, spouse: false, child: false },
      selfCoverages: [],
      spouseIsMember: undefined,
      spouseTitle: "",
      spouseFirstName: "",
      spouseMiddleInitial: "",
      spouseLastName: "",
      spouseSuffix: "",
      spouseBirthday: "",
      spouseGender: undefined,
      spouseEmail: "",
      spouseCoverages: [],
      children: [],
      state: "",
      selfTobaccoLastUsed: "",
      selfTobaccoProducts: [],
      spouseTobaccoLastUsed: "",
      spouseTobaccoProducts: [],
      coverageProductSelections: [],
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

  const watchSelf = useWatch({
    control: methods.control,
    name: "applicants.self",
  });
  const watchSpouse = useWatch({
    control: methods.control,
    name: "applicants.spouse",
  });
  const watchChild = useWatch({
    control: methods.control,
    name: "applicants.child",
  });
  const selfCov = useWatch({
    control: methods.control,
    name: "selfCoverages",
  }) as CoverageCat[] | undefined;
  const spouseCov = useWatch({
    control: methods.control,
    name: "spouseCoverages",
  }) as CoverageCat[] | undefined;
  const membershipValue = useWatch({
    control: methods.control,
    name: "isMember",
  });
  const selfSmoker = useWatch({ control: methods.control, name: "smokerSelf" });
  const spouseSmoker = useWatch({
    control: methods.control,
    name: "smokerSpouse",
  });
  const coverageSelections = useWatch({
    control: methods.control,
    name: "coverageProductSelections",
  }) as string[] | undefined;
  const [sectionExpanded, setSectionExpanded] = React.useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    COVERAGE_CARDS.forEach((card, index) => {
      initial[card.id] = index === 0;
    });
    return initial;
  });
  const [applicantFilter, setApplicantFilter] = React.useState<string[]>([]);
  // Check if there are any spouse-related errors
  const hasSpouseErrors = Object.keys(methods.formState.errors).some((key) =>
    key.startsWith("spouse"),
  );
  const hasChildErrors = Object.keys(methods.formState.errors).some((key) =>
    key.startsWith("children"),
  );

  // Ensure at least one child exists when child is selected
  React.useEffect(() => {
    const currentChildren = methods.getValues("children");
    if (watchChild && (!currentChildren || currentChildren.length === 0)) {
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
  }, [watchChild, methods]);

  React.useEffect(() => {
    if (membershipValue === "no") {
      setShowIneligibleDialog(true);
    }
  }, [membershipValue]);

  React.useEffect(() => {
    const currentSelections = methods.getValues("coverageProductSelections");
    if (!Array.isArray(currentSelections)) {
      methods.setValue("coverageProductSelections", [], { shouldDirty: false });
    }
  }, [methods]);

  const handleToggleProduct = React.useCallback(
    (productId: string) => {
      const current = coverageSelections ?? [];
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      methods.setValue("coverageProductSelections", next, {
        shouldDirty: true,
      });
    },
    [coverageSelections, methods],
  );

  const handleToggleSection = React.useCallback((sectionId: string) => {
    setSectionExpanded((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const handleToggleApplicantFilter = React.useCallback((label: string) => {
    setApplicantFilter((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  }, []);

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
        state: "New York",

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
        coverageProductSelections: [
          "li-term10",
          "di-basic",
          "oo-10k",
          "sh-hospital",
        ],
      };

      methods.reset(filledData);
    };

    window.addEventListener("devtools:fillform", handleFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleFillForm);
  }, [methods]);

  const onSubmit: SubmitHandler<EligibilityForm> = (values) => {
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
      setEligibility(values);
      markComplete();
      next();
      navigate("/coverage");
    }
  };

  const covBox = (
    name: "selfCoverages" | "spouseCoverages",
    opts: CoverageCat[],
  ) => (
    <Controller
      name={name}
      control={methods.control}
      render={({ field }) => {
        const val = (field.value as CoverageCat[]) ?? [];
        const toggle = (code: CoverageCat) =>
          field.onChange(
            val.includes(code) ? val.filter((c) => c !== code) : [...val, code],
          );
        const labelFor = (c: CoverageCat) =>
          c === "LI"
            ? "Life Insurance"
            : c === "AD"
              ? "Accidental Death & Dismemberment"
              : c === "DI"
                ? "Disability Insurance"
                : c === "OO"
                  ? "Office Overhead Expense Insurance"
                  : "Supplemental Health Insurance";
        return (
          <Stack>
            {opts.map((opt) => (
              <FormControlLabel
                key={opt}
                control={
                  <Checkbox
                    checked={val.includes(opt)}
                    onChange={() => toggle(opt)}
                  />
                }
                label={labelFor(opt)}
              />
            ))}
          </Stack>
        );
      }}
    />
  );

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

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <PageHeader
            title="Find Your Coverage Options"
            notes="Pick the products you're interested in to see eligibility and pricing."
            icon={
              <PolicyOutlined sx={{ fontSize: 32, color: "primary.main" }} />
            }
            animatedIcon
          />

          <Stack
            spacing={1.5}
            direction={{ xs: "column", md: "row" }}
            alignItems={{ md: "center" }}
            justifyContent="flex-end"
            gap="8px"
          >
            <Typography variant="subtitle2" color="text.primary">
              Filter by:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {APPLICANT_OPTIONS.map((option) => {
                const selected = applicantFilter.includes(option);
                const styles = getApplicantChipStyles(option);
                return (
                  <Chip
                    key={option}
                    label={option}
                    clickable
                    variant={selected ? "filled" : "outlined"}
                    onClick={() => handleToggleApplicantFilter(option)}
                    sx={{
                      borderColor: styles.borderColor,
                      bgcolor: selected ? styles.bgcolor : "transparent",
                      color: selected ? styles.color : styles.color,
                      fontWeight: selected ? 600 : 400,
                    }}
                  />
                );
              })}
            </Stack>
          </Stack>

          <Card variant="outlined">
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack spacing={4}>
                {COVERAGE_CARDS.map((card, index) => {
                  const IconComponent = card.icon;
                  const isExpanded = sectionExpanded[card.id] ?? false;
                  const visibleProducts = card.products.filter((product) => {
                    return (
                      applicantFilter.length === 0 ||
                      product.applicants.some((applicant) =>
                        applicantFilter.includes(applicant),
                      )
                    );
                  });

                  if (visibleProducts.length === 0) {
                    return null;
                  }

                  return (
                    <Stack key={card.id} spacing={2.5}>
                      <Stack spacing={0.5}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            {card.title}
                          </Typography>
                          <IconButton
                            aria-label={`Toggle ${card.title}`}
                            onClick={() => handleToggleSection(card.id)}
                            size="small"
                          >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {card.description}
                        </Typography>
                      </Stack>

                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <FormGroup>
                          {visibleProducts.map((product) => {
                            const selected = (
                              coverageSelections ?? []
                            ).includes(product.id);
                            return (
                              <FormControlLabel
                                key={product.id}
                                control={
                                  <Checkbox
                                    checked={selected}
                                    onChange={() =>
                                      handleToggleProduct(product.id)
                                    }
                                  />
                                }
                                sx={{
                                  alignItems: "flex-start",
                                  m: 0,
                                  py: 1,
                                }}
                                label={
                                  <Box>
                                    <Stack
                                      direction={{ xs: "column", md: "row" }}
                                      spacing={1}
                                      alignItems={{ md: "center" }}
                                    >
                                      <Typography sx={{ fontWeight: 600 }}>
                                        {product.name}
                                      </Typography>
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        flexWrap="wrap"
                                        mt={{ xs: 0.5, md: 0 }}
                                      >
                                        {product.applicants.map((applicant) => {
                                          const chipStyles =
                                            getApplicantChipStyles(applicant);
                                          return (
                                            <Chip
                                              key={applicant}
                                              label={applicant}
                                              size="small"
                                              sx={{
                                                bgcolor: chipStyles.bgcolor,
                                                color: chipStyles.color,
                                                border: "1px solid",
                                                borderColor:
                                                  chipStyles.borderColor,
                                              }}
                                            />
                                          );
                                        })}
                                      </Stack>
                                    </Stack>
                                    {(product.coverageHighlight ||
                                      product.monthlyEstimate) && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ mt: 0.5, display: "block" }}
                                      >
                                        {product.coverageHighlight
                                          ? `${product.coverageHighlight} for ${product.monthlyEstimate}`
                                          : product.monthlyEstimate}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                            );
                          })}
                        </FormGroup>
                      </Collapse>

                      {index < COVERAGE_CARDS.length - 1 && (
                        <Box
                          sx={{
                            width: "92%",
                            mx: "auto",
                            borderTop: "1px solid",
                            borderColor: "divider",
                            opacity: 0.6,
                          }}
                        />
                      )}
                    </Stack>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>

          {Object.keys(methods.formState.errors).length > 0 && (
            <Alert severity="error">
              Help us determine your eligibility for coverage by completing all
              required fields.
            </Alert>
          )}

          {/* Page-level Error Alert */}
          {Object.keys(methods.formState.errors).length > 0 && (
            <Alert severity="error">
              Help us determine your eligibility for coverage by completing all
              required fields.
            </Alert>
          )}

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
        </Stack>
      </form>

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

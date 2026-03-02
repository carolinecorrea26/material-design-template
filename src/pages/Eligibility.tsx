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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
} from "@mui/material";
import {
  BlockOutlined,
  Close as CloseIcon,
  Add as AddIcon,
  InventoryOutlined,
  CheckCircle,
} from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
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
} from "../config/clients";
import { TOBACCO_PRODUCTS, STATE_OPTIONS } from "../constants/eligibility";
import { PRODUCT_LOOKUP } from "../constants/getStartedProducts";
import { getStateFromZip } from "../utils/zipToState";

export default function Eligibility() {
  const { data, setEligibility } = useAppData();
  const { next, markComplete } = useStepper();
  const navigate = useNavigate();
  const [showIneligibleDialog, setShowIneligibleDialog] = React.useState(false);

  const getStartedSummary = data.getStarted;
  const savedGetStarted = getStartedSummary?.productSelections ?? [];

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
      applicants: data.eligibility?.applicants ?? derivedApplicants,
      selfCoverages: data.eligibility?.selfCoverages ?? derivedSelfCoverages,
      spouseCoverages:
        data.eligibility?.spouseCoverages ?? derivedSpouseCoverages,
      coverageProductSelections:
        data.eligibility?.coverageProductSelections ?? savedGetStarted,
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

  const selfCov = derivedSelfCoverages;
  const applicantsValue = useWatch({
    control: methods.control,
    name: "applicants",
  });
  const applyingSelf = true;
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
  const selfSmoker = useWatch({ control: methods.control, name: "smokerSelf" });
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
    const digits = (zipCodeValue ?? "").replace(/\D/g, "");
    if (digits.length !== 5) return;
    const stateFromZip = getStateFromZip(digits);
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
        selfCoverages: ["LI", "DI", "OO", "SH"],
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
        spouseCoverages: ["LI", "DI", "SH"],
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
        <FormPageLayout
          header={
            <PageHeader
              title="Check eligibility for coverage"
              notes="Please provide the following information to determine your eligibility for coverage. You will see eligible coverage options on the next page."
            />
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
            {/* Page-level Error Alert */}
            {Object.keys(methods.formState.errors).length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Help us determine your eligibility for coverage by completing
                all required fields.
              </Alert>
            )}

            <Stack spacing={4}>
              {/* Your Eligibility Section - Always visible */}
              <Stack spacing={0}>
                <Stack spacing={3}>
                  <Controller
                    name="zipCode"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <RHFTextField
                        {...field}
                        label="Zip Code"
                        required
                        inputProps={{ maxLength: 5, inputMode: "numeric" }}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          field.onChange(value);
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
                      label="State"
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
                        Based on your ZIP code
                      </Typography>
                    </Box>
                  </Box>
                  <DateField
                    name="birthday"
                    label="Birthday"
                    required
                    autoComplete="bday"
                  />
                  <RHFRadioGroup
                    name="gender"
                    label="Gender"
                    options={[
                      { label: "Male", value: "male" },
                      { label: "Female", value: "female" },
                    ]}
                    required
                  />
                  <Stack spacing={1}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Dependent coverage (optional):
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
                  {/* Coverage follow-ups */}
                  {applyingSelf && (
                    <Stack spacing={2}>
                      {/* Nicotine for LI/SH */}
                      {selfCov &&
                        (selfCov.includes("LI") || selfCov.includes("SH")) && (
                          <Stack spacing={2}>
                            <RHFRadioGroup
                              name="smokerSelf"
                              label="Have you used tobacco or any nicotine substitute in any form (including nicotine patches and nicotine chewing gum)?"
                              options={[
                                { label: "Yes", value: "yes" },
                                { label: "No", value: "no" },
                              ]}
                              required
                            />

                            {/* Tobacco use details - show if yes */}
                            {selfSmoker === "yes" && (
                              <>
                                <DateField
                                  name="selfTobaccoLastUsed"
                                  label="Last Used"
                                  required
                                />

                                <Controller
                                  name="selfTobaccoProducts"
                                  control={methods.control}
                                  render={({ field, fieldState }) => (
                                    <FormControl
                                      fullWidth
                                      error={!!fieldState.error}
                                      required
                                    >
                                      <InputLabel id="self-tobacco-products-label">
                                        Product(s) Used
                                      </InputLabel>
                                      <Select
                                        {...field}
                                        labelId="self-tobacco-products-label"
                                        label="Product(s) Used"
                                        multiple
                                        value={field.value || []}
                                        renderValue={(selected) =>
                                          (selected as string[]).join(", ")
                                        }
                                      >
                                        {TOBACCO_PRODUCTS.map((product) => (
                                          <MenuItem
                                            key={product}
                                            value={product}
                                          >
                                            <Checkbox
                                              checked={
                                                field.value?.includes(
                                                  product,
                                                ) || false
                                              }
                                            />
                                            {product}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                      {fieldState.error && (
                                        <FormHelperText>
                                          {fieldState.error.message}
                                        </FormHelperText>
                                      )}
                                    </FormControl>
                                  )}
                                />
                              </>
                            )}
                          </Stack>
                        )}

                      {/* DI extras */}
                      {selfCov && selfCov.includes("DI") && (
                        <Stack spacing={2}>
                          <Controller
                            name="selfAvgIncome"
                            control={methods.control}
                            render={({ field, fieldState }) => (
                              <RHFTextField
                                name={field.name}
                                label="Average Monthly Income"
                                required
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /[^0-9]/g,
                                    "",
                                  );
                                  const formatted = value
                                    ? `$${parseInt(value).toLocaleString()}`
                                    : "";
                                  field.onChange(formatted);
                                }}
                                error={!!fieldState.error}
                                helperText={
                                  fieldState.error?.message ||
                                  "Monthly income is asked to help determine the amount of disability coverage you may qualify for."
                                }
                              />
                            )}
                          />
                          <RHFTextField
                            name="selfHoursPerWeek"
                            label="# Hours You Work/Week"
                            required
                          />
                        </Stack>
                      )}

                      {/* OO extras */}
                      {selfCov && selfCov.includes("OO") && (
                        <Stack spacing={2}>
                          <Controller
                            name="selfMonthlyExpenses"
                            control={methods.control}
                            render={({ field, fieldState }) => (
                              <RHFTextField
                                name={field.name}
                                label="Monthly Business Expenses"
                                required
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /[^0-9]/g,
                                    "",
                                  );
                                  const formatted = value
                                    ? `$${parseInt(value).toLocaleString()}`
                                    : "";
                                  field.onChange(formatted);
                                }}
                                error={!!fieldState.error}
                                helperText={
                                  fieldState.error?.message ||
                                  "Please refer to the brochure for definition"
                                }
                              />
                            )}
                          />
                          <Controller
                            name="selfRespPct"
                            control={methods.control}
                            render={({ field, fieldState }) => (
                              <RHFTextField
                                name={field.name}
                                label="% You Are Responsible For"
                                required
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /[^0-9]/g,
                                    "",
                                  );
                                  if (value) {
                                    let numValue = parseInt(value);
                                    if (numValue > 100) numValue = 100;
                                    field.onChange(numValue.toString());
                                  } else {
                                    field.onChange("");
                                  }
                                }}
                                error={!!fieldState.error}
                                helperText={
                                  fieldState.error?.message ||
                                  'If you are incorporated, a partner or a joint tenant, include only your personal share of covered overhead. "Personal share" is defined as (a) your percentage of ownership of the business, or (b) your share of the office space if a joint tenant'
                                }
                              />
                            )}
                          />
                        </Stack>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Stack>

              {/* Spouse Section */}
              <Box
                sx={{
                  display: applyingSpouse || hasSpouseErrors ? "block" : "none",
                }}
              >
                <Stack spacing={0}>
                  <Typography sx={{ ...commonStyles.sidebarText, mb: 2 }}>
                    Spouse Eligibility
                  </Typography>
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
                      <RHFRadioGroup
                        name="spouseGender"
                        label="Gender"
                        options={[
                          { label: "Male", value: "male" },
                          { label: "Female", value: "female" },
                        ]}
                        required
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
                  <Typography sx={{ ...commonStyles.sidebarText, mb: 2 }}>
                    Child Eligibility
                  </Typography>
                  <Stack spacing={3}>
                    <Alert severity="info">
                      Only unmarried children are eligible for coverage.
                    </Alert>

                    <Stack spacing={3}>
                      {childrenValues.map((_, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                          }}
                        >
                          <Stack spacing={2}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography
                                variant="subtitle1"
                                sx={commonStyles.subsectionHeadingBold}
                              >
                                Child Information
                              </Typography>
                              {childrenValues.length > 1 && (
                                <Button
                                  size="small"
                                  color="error"
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

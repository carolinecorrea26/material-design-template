import * as React from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { FavoriteBorder, PersonOutline } from "@mui/icons-material";
import FormPageLayout from "../components/layout/FormPageLayout";
import FormStepTransition from "../components/layout/FormStepTransition";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import ScrollChipRow from "../components/layout/ScrollChipRow";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFSelect from "../components/form/RHFSelect";
import RHFTextField from "../components/form/RHFTextField";
import { STATE_OPTIONS } from "../constants/eligibility";
import { useScrollToFirstError } from "../hooks/useScrollToFirstError";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { commonStyles } from "../theme/commonStyles";
import type { Applicant, CoverageCategory, SelectedItem } from "../types/app";
import { ProfileSchema, type ProfileForm } from "../validation/profile";
import { PRODUCT_LOOKUP } from "../constants/getStartedProducts";

function getCoverageCategory(productId: string): CoverageCategory | null {
  const fromLookup = PRODUCT_LOOKUP[productId]?.coverageCategory;
  if (fromLookup) {
    return fromLookup;
  }
  if (productId.startsWith("li-")) return "LI";
  if (productId.startsWith("di-")) return "DI";
  if (productId.startsWith("oo-")) return "OO";
  if (productId.startsWith("sh-")) return "SH";
  return null;
}

function hasApplicantCoverage(
  items: SelectedItem[],
  applicant: Applicant,
  categories?: CoverageCategory[],
): boolean {
  return items.some((item) => {
    if (item.applicant !== applicant) return false;
    if (!categories || categories.length === 0) return true;
    const category = getCoverageCategory(item.productId);
    return category ? categories.includes(category) : false;
  });
}

function SectionLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
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

const HEIGHT_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const totalInches = 48 + i;
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  const value = `${feet}'${inches}\"`;
  return { label: value, value };
});

const MARITAL_STATUS_OPTIONS = [
  { label: "Single", value: "single" },
  { label: "Married", value: "married" },
  { label: "Divorced", value: "divorced" },
  { label: "Widowed", value: "widowed" },
  { label: "Separated", value: "separated" },
];

const COUNTRY_OPTIONS = [
  { label: "Canada", value: "canada" },
  { label: "Mexico", value: "mexico" },
  { label: "United Kingdom", value: "uk" },
  { label: "France", value: "france" },
  { label: "Germany", value: "germany" },
  { label: "Japan", value: "japan" },
  { label: "Australia", value: "australia" },
  { label: "Other", value: "other" },
];

function getDefaultValues(existing?: ProfileForm): ProfileForm {
  const base: ProfileForm = {
    heightFt: "",
    weight: "",
    weight12MonthsAgo: "",
    ssn: "",
    membershipId: "",
    maritalStatus: "",
    hasDriversLicense: "no",
    driversLicenseNumber: "",
    driversLicenseState: "",
    residencyIntentOutsideUS: "no",
    residencyDurationMonths: "",
    residencyCountry: "",
    residencyIntentSixMonths: "no",
    residencySixMonthsCountry: "",
    physicianFirstName: "",
    physicianLastName: "",
    physicianPhoneNumber: "",
    medicalFacilityName: "",
    medicalStreetAddress: "",
    medicalAptSuite: "",
    medicalCity: "",
    medicalState: "",
    medicalZipCode: "",
    spouseHeightFt: "",
    spouseWeight: "",
    spouseWeight12MonthsAgo: "",
    spouseSsn: "",
    spouseHasDriversLicense: "no",
    spouseDriversLicenseNumber: "",
    spouseDriversLicenseState: "",
    spouseResidencyIntentOutsideUS: "no",
    spouseResidencyDurationMonths: "",
    spouseResidencyCountry: "",
    spouseResidencyIntentSixMonths: "no",
    spouseResidencySixMonthsCountry: "",
    spousePhysicianFirstName: "",
    spousePhysicianLastName: "",
    spousePhysicianPhoneNumber: "",
    spouseMedicalFacilityName: "",
    spouseMedicalStreetAddress: "",
    spouseMedicalAptSuite: "",
    spouseMedicalCity: "",
    spouseMedicalState: "",
    spouseMedicalZipCode: "",
    hasOtherLifeInsurance: "no",
    otherLifeInsuranceAmount: "",
    lifeInsuranceReplacement: "no",
    hasLifeInsurancePending: "no",
    pendingLifeInsuranceAmount: "",
    pendingLifeInsuranceCompany: "",
    hasDisabilityInsurance: "no",
    disabilityCompanies: [
      { company: "", monthlyBenefit: "", benefitPeriod: "", waitingPeriod: "" },
    ],
    disabilityReplacement: "no",
    disabilityReplacementAmount: "",
    spouseHasOtherLifeInsurance: "no",
    spouseOtherLifeInsuranceAmount: "",
    spouseLifeInsuranceReplacement: "no",
    spouseHasLifeInsurancePending: "no",
    spousePendingLifeInsuranceAmount: "",
    spousePendingLifeInsuranceCompany: "",
    spouseHasDisabilityInsurance: "no",
    spouseDisabilityCompanies: [
      { company: "", monthlyBenefit: "", benefitPeriod: "", waitingPeriod: "" },
    ],
    spouseDisabilityReplacement: "no",
    spouseDisabilityReplacementAmount: "",
    wantsToBeneficiaries: "no",
    termLifeBeneficiaryType: undefined,
    termLifeBeneficiaryDesignation: undefined,
    termLifeBeneficiaryFirstName: "",
    termLifeBeneficiaryLastName: "",
    termLifeBeneficiaryRelationship: "",
    termLifeBeneficiaryShare: "",
    termLifeTrustName: "",
    termLifeTrustDate: "",
    tenYearTermBeneficiaryType: undefined,
    tenYearTermBeneficiaryDesignation: undefined,
    tenYearTermBeneficiaryFirstName: "",
    tenYearTermBeneficiaryLastName: "",
    tenYearTermBeneficiaryRelationship: "",
    tenYearTermBeneficiaryShare: "",
    tenYearTermTrustName: "",
    tenYearTermTrustDate: "",
    twentyYearTermBeneficiaryType: undefined,
    twentyYearTermBeneficiaryDesignation: undefined,
    twentyYearTermBeneficiaryFirstName: "",
    twentyYearTermBeneficiaryLastName: "",
    twentyYearTermBeneficiaryRelationship: "",
    twentyYearTermBeneficiaryShare: "",
    twentyYearTermTrustName: "",
    twentyYearTermTrustDate: "",
    addBeneficiaryType: undefined,
    addBeneficiaryDesignation: undefined,
    addBeneficiaryFirstName: "",
    addBeneficiaryLastName: "",
    addBeneficiaryRelationship: "",
    addBeneficiaryShare: "",
    addTrustName: "",
    addTrustDate: "",
    spouseTermLifeBeneficiaryType: undefined,
    spouseTermLifeBeneficiaryDesignation: undefined,
    spouseTermLifeBeneficiaryFirstName: "",
    spouseTermLifeBeneficiaryLastName: "",
    spouseTermLifeBeneficiaryRelationship: "",
    spouseTermLifeBeneficiaryShare: "",
    spouseTermLifeTrustName: "",
    spouseTermLifeTrustDate: "",
    spouseTenYearTermBeneficiaryType: undefined,
    spouseTenYearTermBeneficiaryDesignation: undefined,
    spouseTenYearTermBeneficiaryFirstName: "",
    spouseTenYearTermBeneficiaryLastName: "",
    spouseTenYearTermBeneficiaryRelationship: "",
    spouseTenYearTermBeneficiaryShare: "",
    spouseTenYearTermTrustName: "",
    spouseTenYearTermTrustDate: "",
    spouseTwentyYearTermBeneficiaryType: undefined,
    spouseTwentyYearTermBeneficiaryDesignation: undefined,
    spouseTwentyYearTermBeneficiaryFirstName: "",
    spouseTwentyYearTermBeneficiaryLastName: "",
    spouseTwentyYearTermBeneficiaryRelationship: "",
    spouseTwentyYearTermBeneficiaryShare: "",
    spouseTwentyYearTermTrustName: "",
    spouseTwentyYearTermTrustDate: "",
    spouseAddBeneficiaryType: undefined,
    spouseAddBeneficiaryDesignation: undefined,
    spouseAddBeneficiaryFirstName: "",
    spouseAddBeneficiaryLastName: "",
    spouseAddBeneficiaryRelationship: "",
    spouseAddBeneficiaryShare: "",
    spouseAddTrustName: "",
    spouseAddTrustDate: "",
    wantsToAddPayment: "no",
    termLifePaymentMethod: undefined,
    termLifePaymentFrequency: undefined,
    tenYearTermPaymentMethod: undefined,
    tenYearTermPaymentFrequency: undefined,
    twentyYearTermPaymentMethod: undefined,
    twentyYearTermPaymentFrequency: undefined,
    addPaymentMethod: undefined,
    addPaymentFrequency: undefined,
    longTermDisabilityPaymentMethod: undefined,
    longTermDisabilityPaymentFrequency: undefined,
    midTermDisabilityPaymentMethod: undefined,
    midTermDisabilityPaymentFrequency: undefined,
    professionalOverheadPaymentMethod: undefined,
    professionalOverheadPaymentFrequency: undefined,
    criticalIllnessPaymentMethod: undefined,
    criticalIllnessPaymentFrequency: undefined,
    hospitalMoneyPaymentMethod: undefined,
    hospitalMoneyPaymentFrequency: undefined,
    routingNumber: "",
    accountNumber: "",
    nameOnAccount: "",
    bankInstitution: "",
    bankAccountConsent: false,
  };
  return { ...base, ...existing };
}

export default function PersonalInformation() {
  const { data, setProfile } = useAppData();
  const { markComplete } = useStepper();
  const navigate = useNavigate();
  const coverageItems = data.coverage ?? [];
  const [showPhysicianInfo, setShowPhysicianInfo] = React.useState(
    Boolean(
      data.profile?.physicianFirstName ||
      data.profile?.physicianLastName ||
      data.profile?.medicalFacilityName,
    ),
  );

  const spouseSelectedByApplicant =
    data.eligibility?.applicants?.spouse ?? false;
  const spouseSelectedByCoverage = hasApplicantCoverage(
    coverageItems,
    "spouse",
  );
  const showSpouseSection =
    spouseSelectedByApplicant || spouseSelectedByCoverage;

  const methods = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: getDefaultValues(data.profile),
  });

  useScrollToFirstError(methods);

  const hasDriversLicense = useWatch({
    control: methods.control,
    name: "hasDriversLicense",
  });
  const residencyIntentOutsideUS = useWatch({
    control: methods.control,
    name: "residencyIntentOutsideUS",
  });
  const residencyIntentSixMonths = useWatch({
    control: methods.control,
    name: "residencyIntentSixMonths",
  });

  const spouseHasDriversLicense = useWatch({
    control: methods.control,
    name: "spouseHasDriversLicense",
  });
  const spouseResidencyIntentOutsideUS = useWatch({
    control: methods.control,
    name: "spouseResidencyIntentOutsideUS",
  });
  const spouseResidencyIntentSixMonths = useWatch({
    control: methods.control,
    name: "spouseResidencyIntentSixMonths",
  });

  React.useEffect(() => {
    const handleFillForm = () => {
      const filled: ProfileForm = {
        ...getDefaultValues(data.profile),
        heightFt: "5'10\"",
        weight: "180",
        weight12MonthsAgo: "175",
        ssn: "123-45-6789",
        maritalStatus: "single",
        hasDriversLicense: "yes",
        driversLicenseNumber: "D1234567",
        driversLicenseState: "New York",
        residencyIntentOutsideUS: "no",
        residencyIntentSixMonths: "no",
        physicianFirstName: "John",
        physicianLastName: "Smith",
        physicianPhoneNumber: "555-123-4567",
        medicalFacilityName: "City Medical Center",
        medicalStreetAddress: "123 Main St",
        medicalAptSuite: "Suite 100",
        medicalCity: "New York",
        medicalState: "New York",
        medicalZipCode: "10001",
      };

      if (showSpouseSection) {
        filled.spouseHeightFt = "5'6\"";
        filled.spouseWeight = "140";
        filled.spouseWeight12MonthsAgo = "138";
        filled.spouseSsn = "987-65-4321";
        filled.spouseHasDriversLicense = "yes";
        filled.spouseDriversLicenseNumber = "S7654321";
        filled.spouseDriversLicenseState = "New York";
        filled.spouseResidencyIntentOutsideUS = "no";
        filled.spouseResidencyIntentSixMonths = "no";
      }

      methods.reset(filled);
      setShowPhysicianInfo(true);
    };

    window.addEventListener("devtools:fillform", handleFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleFillForm);
  }, [data.profile, methods, showSpouseSection]);

  const onSubmit = (values: ProfileForm) => {
    const merged = { ...(data.profile ?? {}), ...values } as ProfileForm;
    setProfile(merged);
    markComplete();
    navigate("/financial-information");
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <FormPageLayout
          header={
            <PageHeader
              title="Tell us about yourself so we can continue your application."
              notes={
                <ScrollChipRow
                  items={[{ label: "Why are these details required?" }]}
                />
              }
            />
          }
          navigation={
            <PageNavigation
              hasUnsavedChanges={() => methods.formState.isDirty}
            />
          }
        >
          {Object.keys(methods.formState.errors).length > 0 && (
            <Alert severity="error">
              Please complete all required fields to continue.
            </Alert>
          )}

          <FormStepTransition>
            <Stack spacing={3}>
              {/* <Alert severity="info">
                We only ask for personal information needed to evaluate the
                selected applicants and products.
              </Alert> */}

              <Stack spacing={2}>
                <SectionLabel icon={<PersonOutline />} label="Self" />
                <Button
                  variant="text"
                  onClick={() => setShowPhysicianInfo((current) => !current)}
                  sx={{
                    p: 0,
                    minHeight: 0,
                    textTransform: "none",
                    fontWeight: 500,
                    justifyContent: "flex-start",
                    textDecoration: "underline",
                    alignSelf: "flex-start",
                  }}
                >
                  {showPhysicianInfo
                    ? "Hide your physician information (optional)"
                    : "Add your physician information (optional)"}
                </Button>

                {showPhysicianInfo && (
                  <Box
                    sx={{
                      ...commonStyles.mutedSectionPanel,
                      bgcolor: "rgb(169 173 184 / 18%)",
                    }}
                  >
                    <Stack spacing={2}>
                      <Typography
                        variant="overline"
                        sx={commonStyles.overlineLabel}
                      >
                        Physician Information
                      </Typography>

                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
                        <RHFTextField
                          name="physicianFirstName"
                          label="Physician First Name"
                        />
                        <RHFTextField
                          name="physicianLastName"
                          label="Physician Last Name"
                        />
                      </Stack>

                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
                        <RHFTextField
                          name="physicianPhoneNumber"
                          label="Physician Phone Number"
                        />
                        <RHFTextField
                          name="medicalFacilityName"
                          label="Medical Facility Name"
                        />
                      </Stack>

                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
                        <Box sx={{ flex: 1 }}>
                          <RHFTextField
                            name="medicalStreetAddress"
                            label="Medical Facility Street Address"
                          />
                        </Box>
                        <Box sx={{ width: { md: "180px" } }}>
                          <RHFTextField
                            name="medicalAptSuite"
                            label="Medical Facility Apt/Suite"
                          />
                        </Box>
                      </Stack>

                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
                        <Box sx={{ flex: 1 }}>
                          <RHFTextField
                            name="medicalCity"
                            label="Medical City"
                          />
                        </Box>
                        <Box sx={{ width: { md: "180px" } }}>
                          <RHFSelect
                            name="medicalState"
                            label="Medical State"
                            options={STATE_OPTIONS}
                          />
                        </Box>
                        <Box sx={{ width: { md: "140px" } }}>
                          <RHFTextField
                            name="medicalZipCode"
                            label="Medical Zip Code"
                          />
                        </Box>
                      </Stack>
                    </Stack>
                  </Box>
                )}

                <RHFSelect
                  name="heightFt"
                  label="Height"
                  options={HEIGHT_OPTIONS}
                  required
                />
                <RHFTextField
                  name="weight"
                  label="Weight (lbs.)"
                  type="number"
                  required
                />
                <RHFTextField
                  name="weight12MonthsAgo"
                  label="Weight 12 Months Ago (lbs.)"
                  type="number"
                  required
                />
                <RHFTextField
                  name="ssn"
                  label="Social Security Number"
                  required
                  placeholder="XXX-XX-XXXX"
                />
                <RHFSelect
                  name="maritalStatus"
                  label="Marital Status"
                  options={MARITAL_STATUS_OPTIONS}
                  required
                />
                <RHFRadioGroup
                  name="hasDriversLicense"
                  label="Do you have a valid driver's license?"
                  options={[
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" },
                  ]}
                  required
                />
                {hasDriversLicense === "yes" && (
                  <Stack spacing={2}>
                    <RHFTextField
                      name="driversLicenseNumber"
                      label="Driver's License Number"
                      required
                    />
                    <RHFSelect
                      name="driversLicenseState"
                      label="Driver's License State"
                      options={STATE_OPTIONS}
                      required
                    />
                  </Stack>
                )}

                <RHFRadioGroup
                  name="residencyIntentOutsideUS"
                  label="Do you intend to live outside the United States?"
                  options={[
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" },
                  ]}
                  required
                />
                {residencyIntentOutsideUS === "yes" && (
                  <Stack spacing={2}>
                    <RHFTextField
                      name="residencyDurationMonths"
                      label="How many months?"
                      type="number"
                      required
                    />
                    <RHFSelect
                      name="residencyCountry"
                      label="Country"
                      options={COUNTRY_OPTIONS}
                      required
                    />
                  </Stack>
                )}

                <RHFRadioGroup
                  name="residencyIntentSixMonths"
                  label="Will you travel outside the U.S. for 6+ months in the next year?"
                  options={[
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" },
                  ]}
                  required
                />
                {residencyIntentSixMonths === "yes" && (
                  <RHFSelect
                    name="residencySixMonthsCountry"
                    label="Country"
                    options={COUNTRY_OPTIONS}
                    required
                  />
                )}
              </Stack>

              {showSpouseSection && (
                <Stack spacing={2}>
                  <SectionLabel icon={<FavoriteBorder />} label="Spouse" />
                  <RHFSelect
                    name="spouseHeightFt"
                    label="Spouse Height"
                    options={HEIGHT_OPTIONS}
                  />
                  <RHFTextField
                    name="spouseWeight"
                    label="Spouse Weight (lbs.)"
                    type="number"
                  />
                  <RHFTextField
                    name="spouseWeight12MonthsAgo"
                    label="Spouse Weight 12 Months Ago (lbs.)"
                    type="number"
                  />
                  <RHFTextField
                    name="spouseSsn"
                    label="Spouse Social Security Number"
                    placeholder="XXX-XX-XXXX"
                  />
                  <RHFRadioGroup
                    name="spouseHasDriversLicense"
                    label="Does your spouse have a valid driver's license?"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {spouseHasDriversLicense === "yes" && (
                    <Stack spacing={2}>
                      <RHFTextField
                        name="spouseDriversLicenseNumber"
                        label="Spouse Driver's License Number"
                      />
                      <RHFSelect
                        name="spouseDriversLicenseState"
                        label="Spouse Driver's License State"
                        options={STATE_OPTIONS}
                      />
                    </Stack>
                  )}

                  <RHFRadioGroup
                    name="spouseResidencyIntentOutsideUS"
                    label="Does your spouse intend to live outside the United States?"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {spouseResidencyIntentOutsideUS === "yes" && (
                    <Stack spacing={2}>
                      <RHFTextField
                        name="spouseResidencyDurationMonths"
                        label="How many months?"
                        type="number"
                      />
                      <RHFSelect
                        name="spouseResidencyCountry"
                        label="Country"
                        options={COUNTRY_OPTIONS}
                      />
                    </Stack>
                  )}

                  <RHFRadioGroup
                    name="spouseResidencyIntentSixMonths"
                    label="Will your spouse travel outside the U.S. for 6+ months in the next year?"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" },
                    ]}
                  />
                  {spouseResidencyIntentSixMonths === "yes" && (
                    <RHFSelect
                      name="spouseResidencySixMonthsCountry"
                      label="Country"
                      options={COUNTRY_OPTIONS}
                    />
                  )}
                </Stack>
              )}
            </Stack>
          </FormStepTransition>
        </FormPageLayout>
      </form>
    </FormProvider>
  );
}

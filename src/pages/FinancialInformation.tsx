import * as React from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  AccountBalance,
  FavoriteBorder,
  PersonOutline,
  WorkOutline,
} from "@mui/icons-material";
import FormPageLayout from "../components/layout/FormPageLayout";
import FormStepTransition from "../components/layout/FormStepTransition";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import ScrollChipRow from "../components/layout/ScrollChipRow";
import RHFCheckbox from "../components/form/RHFCheckbox";
import RHFCurrencyField from "../components/form/RHFCurrencyField";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFTextField from "../components/form/RHFTextField";
import { PRODUCT_LOOKUP } from "../constants/getStartedProducts";
import { useScrollToFirstError } from "../hooks/useScrollToFirstError";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { commonStyles } from "../theme/commonStyles";
import type { Applicant, CoverageCategory, SelectedItem } from "../types/app";
import { ProfileSchema, type ProfileForm } from "../validation/profile";

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

const YES_NO_OPTIONS = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const BONUS_TYPE_OPTIONS = [
  { label: "Annual", value: "annual" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Monthly", value: "monthly" },
];

const COMMISSION_TYPE_OPTIONS = [
  { label: "Annual", value: "annual" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Monthly", value: "monthly" },
];

function getDefaultValues(existing?: ProfileForm): ProfileForm {
  const base: ProfileForm = {
    heightFt: "5'8\"",
    weight: "170",
    weight12MonthsAgo: "168",
    ssn: "0000",
    membershipId: "",
    maritalStatus: "single",
    hasDriversLicense: "yes",
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

export default function FinancialInformation() {
  const { data, setProfile } = useAppData();
  const { markComplete } = useStepper();
  const navigate = useNavigate();
  const coverageItems = data.coverage ?? [];

  const spouseApplied =
    (data.eligibility?.applicants?.spouse ?? false) ||
    hasApplicantCoverage(coverageItems, "spouse");

  const selfHasLifeCoverage = hasApplicantCoverage(coverageItems, "self", [
    "LI",
  ]);
  const selfHasDisabilityCoverage = hasApplicantCoverage(
    coverageItems,
    "self",
    ["DI", "OO"],
  );

  const spouseHasLifeCoverage = hasApplicantCoverage(coverageItems, "spouse", [
    "LI",
  ]);
  const spouseHasDisabilityCoverage = hasApplicantCoverage(
    coverageItems,
    "spouse",
    ["DI", "OO"],
  );

  const methods = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: getDefaultValues(data.profile),
  });

  useScrollToFirstError(methods);

  const isSelfEmployed = useWatch({
    control: methods.control,
    name: "isSelfEmployed" as any,
  }) as string | undefined;
  const hasOtherLifeInsurance = useWatch({
    control: methods.control,
    name: "hasOtherLifeInsurance",
  });
  const hasLifeInsurancePending = useWatch({
    control: methods.control,
    name: "hasLifeInsurancePending",
  });
  const hasDisabilityInsurance = useWatch({
    control: methods.control,
    name: "hasDisabilityInsurance",
  });

  const spouseHasOtherLifeInsurance = useWatch({
    control: methods.control,
    name: "spouseHasOtherLifeInsurance",
  });
  const spouseHasLifeInsurancePending = useWatch({
    control: methods.control,
    name: "spouseHasLifeInsurancePending",
  });
  const spouseHasDisabilityInsurance = useWatch({
    control: methods.control,
    name: "spouseHasDisabilityInsurance",
  });

  React.useEffect(() => {
    const handleFillForm = () => {
      const filled = {
        ...getDefaultValues(data.profile),
        totalNetWorth: "500000",
        totalAnnualUnearnedIncome: "25000",
        isSelfEmployed: "yes",
        isSoleProprietor: true,
        soleProprietorGrossIncome: "200000",
        soleProprietorGrossEarnings: "150000",
        soleProprietorBusinessExpenses: "50000",
        selfEmploymentDuration: "5",
        isWorkingFromHome: "no",
        hasWorkOutsideHome: "yes",
        workDetailsExplanation: "Primary office in downtown area.",
        hasOtherLifeInsurance: selfHasLifeCoverage ? "yes" : "no",
        otherLifeInsuranceAmount: selfHasLifeCoverage ? "100000" : "",
        hasLifeInsurancePending: selfHasLifeCoverage ? "no" : "no",
        hasDisabilityInsurance: selfHasDisabilityCoverage ? "yes" : "no",
        disabilityCompanies: selfHasDisabilityCoverage
          ? [
              {
                company: "ACME Insurance",
                monthlyBenefit: "3000",
                benefitPeriod: "age65",
                waitingPeriod: "90days",
              },
            ]
          : [
              {
                company: "",
                monthlyBenefit: "",
                benefitPeriod: "",
                waitingPeriod: "",
              },
            ],
      } as any;

      if (spouseApplied) {
        filled.spouseHasOtherLifeInsurance = spouseHasLifeCoverage
          ? "yes"
          : "no";
        filled.spouseOtherLifeInsuranceAmount = spouseHasLifeCoverage
          ? "75000"
          : "";
        filled.spouseHasLifeInsurancePending = spouseHasLifeCoverage
          ? "no"
          : "no";
        filled.spouseHasDisabilityInsurance = spouseHasDisabilityCoverage
          ? "yes"
          : "no";
        filled.spouseDisabilityCompanies = spouseHasDisabilityCoverage
          ? [
              {
                company: "Beta Insurance",
                monthlyBenefit: "2500",
                benefitPeriod: "5years",
                waitingPeriod: "60days",
              },
            ]
          : [
              {
                company: "",
                monthlyBenefit: "",
                benefitPeriod: "",
                waitingPeriod: "",
              },
            ];
      }

      methods.reset(filled);
    };

    window.addEventListener("devtools:fillform", handleFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleFillForm);
  }, [
    data.profile,
    methods,
    selfHasDisabilityCoverage,
    selfHasLifeCoverage,
    spouseApplied,
    spouseHasDisabilityCoverage,
    spouseHasLifeCoverage,
  ]);

  const onSubmit = (values: ProfileForm) => {
    const requiredFields: Array<keyof ProfileForm> = [
      "totalNetWorth",
      "totalAnnualUnearnedIncome",
      "isSelfEmployed" as any,
    ];

    let hasSubmitErrors = false;
    requiredFields.forEach((fieldName) => {
      const value = values[fieldName];
      if (value === undefined || value === null || value === "") {
        hasSubmitErrors = true;
        methods.setError(fieldName, {
          type: "required",
          message: "This field is required.",
        });
      }
    });

    if (hasSubmitErrors) {
      return;
    }

    const merged = { ...(data.profile ?? {}), ...values } as ProfileForm;
    setProfile(merged);
    markComplete();
    navigate("/application-review");
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <FormPageLayout
          header={
            <PageHeader
              title="Share your financial and existing coverage details."
              notes={
                <ScrollChipRow
                  items={[{ label: "How is this information used?" }]}
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
                Sections shown below are based on which applicants are covered
                and which products were selected.
              </Alert> */}

              <Stack spacing={2}>
                <SectionLabel
                  icon={<AccountBalance />}
                  label="Financial Profile"
                />
                <RHFCurrencyField
                  name="totalNetWorth"
                  label="Total Net Worth"
                  required
                />
                <RHFCurrencyField
                  name="totalAnnualUnearnedIncome"
                  label="Total Annual Unearned Income"
                  required
                />
                <RHFRadioGroup
                  name="isSelfEmployed"
                  label="Are you self-employed?"
                  options={YES_NO_OPTIONS}
                  required
                />

                {isSelfEmployed === "yes" && (
                  <Stack spacing={2}>
                    <SectionLabel
                      icon={<WorkOutline />}
                      label="Self-Employment Details"
                    />
                    <RHFCheckbox
                      name="isSoleProprietor"
                      label="I am a sole proprietor"
                    />
                    <RHFCheckbox
                      name="isProfessionalCorp"
                      label="I am part of a professional corporation"
                    />
                    <RHFCurrencyField
                      name="soleProprietorGrossIncome"
                      label="Sole Proprietor Gross Income"
                    />
                    <RHFCurrencyField
                      name="soleProprietorGrossEarnings"
                      label="Sole Proprietor Gross Earnings"
                    />
                    <RHFCurrencyField
                      name="soleProprietorBusinessExpenses"
                      label="Sole Proprietor Business Expenses"
                    />
                    <RHFCurrencyField
                      name="professionalCorpAnnualSalary"
                      label="Professional Corporation Annual Salary"
                    />
                    <RHFCurrencyField
                      name="professionalCorpSCorpDistribution"
                      label="Professional Corporation S-Corp Distribution"
                    />
                    <RHFCurrencyField
                      name="professionalCorpDividends"
                      label="Professional Corporation Dividends"
                    />
                    <RHFCurrencyField
                      name="professionalCorpBonus"
                      label="Professional Corporation Bonus"
                    />
                    <RHFRadioGroup
                      name="professionalCorpBonusType"
                      label="Bonus Payment Frequency"
                      options={BONUS_TYPE_OPTIONS}
                    />
                    <RHFCurrencyField
                      name="professionalCorpCommission"
                      label="Professional Corporation Commission"
                    />
                    <RHFRadioGroup
                      name="professionalCorpCommissionType"
                      label="Commission Payment Frequency"
                      options={COMMISSION_TYPE_OPTIONS}
                    />
                    <RHFCurrencyField
                      name="professionalCorpBenefitsCost"
                      label="Professional Corporation Benefits Cost"
                    />
                    <RHFTextField
                      name="selfEmploymentDuration"
                      label="Years Self-Employed"
                      type="number"
                    />
                    <RHFRadioGroup
                      name="isWorkingFromHome"
                      label="Do you work from home?"
                      options={YES_NO_OPTIONS}
                    />
                    <RHFRadioGroup
                      name="hasWorkOutsideHome"
                      label="Do you have a work location outside your home?"
                      options={YES_NO_OPTIONS}
                    />
                    <RHFTextField
                      name="workDetailsExplanation"
                      label="Work Location Details"
                      multiline
                      minRows={3}
                    />
                  </Stack>
                )}
              </Stack>

              {(selfHasLifeCoverage || selfHasDisabilityCoverage) && (
                <Stack spacing={2}>
                  <SectionLabel
                    icon={<PersonOutline />}
                    label="Self - Existing Coverage"
                  />

                  {selfHasLifeCoverage && (
                    <Stack spacing={2}>
                      <RHFRadioGroup
                        name="hasOtherLifeInsurance"
                        label="Do you have other life insurance?"
                        options={YES_NO_OPTIONS}
                      />
                      {hasOtherLifeInsurance === "yes" && (
                        <RHFCurrencyField
                          name="otherLifeInsuranceAmount"
                          label="Total Existing Life Insurance Amount"
                        />
                      )}
                      <RHFRadioGroup
                        name="lifeInsuranceReplacement"
                        label="Is this application replacing other life insurance?"
                        options={YES_NO_OPTIONS}
                      />
                      <RHFRadioGroup
                        name="hasLifeInsurancePending"
                        label="Do you have pending life insurance applications?"
                        options={YES_NO_OPTIONS}
                      />
                      {hasLifeInsurancePending === "yes" && (
                        <Stack spacing={2}>
                          <RHFCurrencyField
                            name="pendingLifeInsuranceAmount"
                            label="Pending Life Insurance Amount"
                          />
                          <RHFTextField
                            name="pendingLifeInsuranceCompany"
                            label="Pending Life Insurance Company"
                          />
                        </Stack>
                      )}
                    </Stack>
                  )}

                  {selfHasDisabilityCoverage && (
                    <Stack spacing={2}>
                      <RHFRadioGroup
                        name="hasDisabilityInsurance"
                        label="Do you have disability insurance?"
                        options={YES_NO_OPTIONS}
                      />
                      {hasDisabilityInsurance === "yes" && (
                        <Stack spacing={2}>
                          <RHFTextField
                            name="disabilityCompanies.0.company"
                            label="Disability Carrier"
                          />
                          <RHFCurrencyField
                            name="disabilityCompanies.0.monthlyBenefit"
                            label="Monthly Benefit"
                          />
                          <RHFTextField
                            name="disabilityCompanies.0.benefitPeriod"
                            label="Benefit Period"
                          />
                          <RHFTextField
                            name="disabilityCompanies.0.waitingPeriod"
                            label="Waiting Period"
                          />
                        </Stack>
                      )}
                      <RHFRadioGroup
                        name="disabilityReplacement"
                        label="Is this application replacing disability insurance?"
                        options={YES_NO_OPTIONS}
                      />
                      <RHFCurrencyField
                        name="disabilityReplacementAmount"
                        label="Disability Replacement Amount"
                      />
                    </Stack>
                  )}
                </Stack>
              )}

              {spouseApplied &&
                (spouseHasLifeCoverage || spouseHasDisabilityCoverage) && (
                  <Stack spacing={2}>
                    <SectionLabel
                      icon={<FavoriteBorder />}
                      label="Spouse - Existing Coverage"
                    />

                    {spouseHasLifeCoverage && (
                      <Stack spacing={2}>
                        <RHFRadioGroup
                          name="spouseHasOtherLifeInsurance"
                          label="Does your spouse have other life insurance?"
                          options={YES_NO_OPTIONS}
                        />
                        {spouseHasOtherLifeInsurance === "yes" && (
                          <RHFCurrencyField
                            name="spouseOtherLifeInsuranceAmount"
                            label="Spouse Existing Life Insurance Amount"
                          />
                        )}
                        <RHFRadioGroup
                          name="spouseLifeInsuranceReplacement"
                          label="Is spouse coverage replacing other life insurance?"
                          options={YES_NO_OPTIONS}
                        />
                        <RHFRadioGroup
                          name="spouseHasLifeInsurancePending"
                          label="Does your spouse have pending life insurance applications?"
                          options={YES_NO_OPTIONS}
                        />
                        {spouseHasLifeInsurancePending === "yes" && (
                          <Stack spacing={2}>
                            <RHFCurrencyField
                              name="spousePendingLifeInsuranceAmount"
                              label="Spouse Pending Life Insurance Amount"
                            />
                            <RHFTextField
                              name="spousePendingLifeInsuranceCompany"
                              label="Spouse Pending Life Insurance Company"
                            />
                          </Stack>
                        )}
                      </Stack>
                    )}

                    {spouseHasDisabilityCoverage && (
                      <Stack spacing={2}>
                        <RHFRadioGroup
                          name="spouseHasDisabilityInsurance"
                          label="Does your spouse have disability insurance?"
                          options={YES_NO_OPTIONS}
                        />
                        {spouseHasDisabilityInsurance === "yes" && (
                          <Stack spacing={2}>
                            <RHFTextField
                              name="spouseDisabilityCompanies.0.company"
                              label="Spouse Disability Carrier"
                            />
                            <RHFCurrencyField
                              name="spouseDisabilityCompanies.0.monthlyBenefit"
                              label="Spouse Monthly Benefit"
                            />
                            <RHFTextField
                              name="spouseDisabilityCompanies.0.benefitPeriod"
                              label="Spouse Benefit Period"
                            />
                            <RHFTextField
                              name="spouseDisabilityCompanies.0.waitingPeriod"
                              label="Spouse Waiting Period"
                            />
                          </Stack>
                        )}
                        <RHFRadioGroup
                          name="spouseDisabilityReplacement"
                          label="Is spouse coverage replacing disability insurance?"
                          options={YES_NO_OPTIONS}
                        />
                        <RHFCurrencyField
                          name="spouseDisabilityReplacementAmount"
                          label="Spouse Disability Replacement Amount"
                        />
                      </Stack>
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

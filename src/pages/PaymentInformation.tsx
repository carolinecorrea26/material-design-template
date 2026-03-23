import * as React from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { AccountBalance, Payment, PersonOutline } from "@mui/icons-material";
import FormPageLayout from "../components/layout/FormPageLayout";
import FormStepTransition from "../components/layout/FormStepTransition";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import ScrollChipRow from "../components/layout/ScrollChipRow";
import RHFCheckbox from "../components/form/RHFCheckbox";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFTextField from "../components/form/RHFTextField";
import { useScrollToFirstError } from "../hooks/useScrollToFirstError";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { commonStyles } from "../theme/commonStyles";
import type { ProfileForm } from "../validation/profile";
import { ProfileSchema } from "../validation/profile";

type PaymentSection = {
  id: string;
  label: string;
  methodField: keyof ProfileForm;
  frequencyField: keyof ProfileForm;
};

const PAYMENT_METHOD_OPTIONS = [
  { label: "Bill me", value: "bill_me" },
  { label: "Bank account", value: "bank_account" },
];

const PAYMENT_FREQUENCY_OPTIONS = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Semiannually", value: "semiannually" },
  { label: "Annually", value: "annually" },
];

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

function mapProductToPaymentSection(productId: string): PaymentSection | null {
  if (productId === "li-term10") {
    return {
      id: "li-term10",
      label: "10-Year Level Term Life Insurance",
      methodField: "tenYearTermPaymentMethod",
      frequencyField: "tenYearTermPaymentFrequency",
    };
  }
  if (productId === "li-term20") {
    return {
      id: "li-term20",
      label: "20-Year Level Term Life Insurance",
      methodField: "twentyYearTermPaymentMethod",
      frequencyField: "twentyYearTermPaymentFrequency",
    };
  }
  if (productId === "li-adt") {
    return {
      id: "li-adt",
      label: "Accidental Death and Dismemberment",
      methodField: "addPaymentMethod",
      frequencyField: "addPaymentFrequency",
    };
  }
  if (productId === "di-basic" || productId === "di-premium") {
    return {
      id: "di-ltd",
      label: "Long-Term Disability",
      methodField: "longTermDisabilityPaymentMethod",
      frequencyField: "longTermDisabilityPaymentFrequency",
    };
  }
  if (productId === "di-student") {
    return {
      id: "di-midterm",
      label: "Mid-Term Disability",
      methodField: "midTermDisabilityPaymentMethod",
      frequencyField: "midTermDisabilityPaymentFrequency",
    };
  }
  if (productId.startsWith("oo-")) {
    return {
      id: "oo",
      label: "Professional Overhead Expense Disability",
      methodField: "professionalOverheadPaymentMethod",
      frequencyField: "professionalOverheadPaymentFrequency",
    };
  }
  if (productId === "sh-critical") {
    return {
      id: "sh-critical",
      label: "Critical Illness",
      methodField: "criticalIllnessPaymentMethod",
      frequencyField: "criticalIllnessPaymentFrequency",
    };
  }
  if (productId === "sh-hospital") {
    return {
      id: "sh-hospital",
      label: "Hospital Money",
      methodField: "hospitalMoneyPaymentMethod",
      frequencyField: "hospitalMoneyPaymentFrequency",
    };
  }
  return null;
}

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

export default function PaymentInformation() {
  const { data, setProfile } = useAppData();
  const { markComplete } = useStepper();
  const navigate = useNavigate();

  const paymentSections = React.useMemo(() => {
    const seen = new Set<string>();
    const sections: PaymentSection[] = [];
    for (const item of data.coverage ?? []) {
      if (item.applicant === "child") {
        continue;
      }
      const mapped = mapProductToPaymentSection(item.productId);
      if (!mapped || seen.has(mapped.id)) {
        continue;
      }
      seen.add(mapped.id);
      sections.push(mapped);
    }
    return sections;
  }, [data.coverage]);

  const methods = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: getDefaultValues(data.profile),
  });

  useScrollToFirstError(methods);

  const watchedMethodFields = paymentSections.map(
    (section) => section.methodField,
  );
  const methodValues = useWatch({
    control: methods.control,
    name: watchedMethodFields as any,
  }) as Array<string | undefined>;

  const requiresBankDetails = methodValues.some(
    (value) => value === "bank_account",
  );

  React.useEffect(() => {
    const handleFillForm = () => {
      const filled = {
        ...getDefaultValues(data.profile),
        wantsToAddPayment: "yes",
        bankAccountConsent: true,
        nameOnAccount: "John Doe",
        bankInstitution: "Chase Bank",
        routingNumber: "021000021",
        accountNumber: "123456789",
      } as any;

      paymentSections.forEach((section) => {
        filled[section.methodField] = "bank_account";
        filled[section.frequencyField] = "monthly";
      });

      methods.reset(filled);
    };

    window.addEventListener("devtools:fillform", handleFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleFillForm);
  }, [data.profile, methods, paymentSections]);

  const onSubmit = (values: ProfileForm) => {
    let hasSubmitErrors = false;

    paymentSections.forEach((section) => {
      const methodValue = values[section.methodField] as unknown as
        | string
        | undefined;
      const frequencyValue = values[section.frequencyField] as unknown as
        | string
        | undefined;

      if (!methodValue) {
        hasSubmitErrors = true;
        methods.setError(section.methodField, {
          type: "required",
          message: "Payment method is required.",
        });
      }

      if (!frequencyValue) {
        hasSubmitErrors = true;
        methods.setError(section.frequencyField, {
          type: "required",
          message: "Payment frequency is required.",
        });
      }
    });

    if (requiresBankDetails && !values.bankAccountConsent) {
      hasSubmitErrors = true;
      methods.setError("bankAccountConsent", {
        type: "required",
        message: "Please authorize bank account payment.",
      });
    }

    if (requiresBankDetails) {
      const bankRequiredFields: Array<keyof ProfileForm> = [
        "nameOnAccount",
        "bankInstitution",
        "routingNumber",
        "accountNumber",
      ];

      bankRequiredFields.forEach((fieldName) => {
        const value = values[fieldName] as unknown as string | undefined;
        if (!value) {
          hasSubmitErrors = true;
          methods.setError(fieldName, {
            type: "required",
            message: "This field is required.",
          });
        }
      });
    }

    if (hasSubmitErrors) {
      return;
    }

    methods.clearErrors("bankAccountConsent");
    const merged = { ...(data.profile ?? {}), ...values } as ProfileForm;
    setProfile(merged);
    markComplete();
    navigate("/receipt");
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <FormPageLayout
          header={
            <PageHeader
              title="Choose how you would like to pay for your coverage."
              notes={
                <ScrollChipRow
                  items={[{ label: "When will billing begin?" }]}
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
              <Alert severity="info">
                Payment options below are shown only for products currently
                selected for the active applicants.
              </Alert>

              <Stack spacing={2}>
                <SectionLabel
                  icon={<Payment />}
                  label="Coverage Payment Setup"
                />
                {paymentSections.length === 0 ? (
                  <Alert severity="warning">
                    No eligible products were found for payment setup.
                  </Alert>
                ) : (
                  paymentSections.map((section) => (
                    <Box
                      key={section.id}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 2,
                        backgroundColor: "background.paper",
                      }}
                    >
                      <Stack spacing={2}>
                        <SectionLabel
                          icon={<PersonOutline />}
                          label={section.label}
                        />
                        <RHFRadioGroup
                          name={section.methodField}
                          label="Payment Method"
                          options={PAYMENT_METHOD_OPTIONS}
                          required
                        />
                        <RHFRadioGroup
                          name={section.frequencyField}
                          label="Payment Frequency"
                          options={PAYMENT_FREQUENCY_OPTIONS}
                          required
                        />
                      </Stack>
                    </Box>
                  ))
                )}
              </Stack>

              {requiresBankDetails && (
                <Stack spacing={2}>
                  <SectionLabel
                    icon={<AccountBalance />}
                    label="Bank Account Details"
                  />
                  <RHFTextField
                    name="nameOnAccount"
                    label="Name on Account"
                    required
                  />
                  <RHFTextField
                    name="bankInstitution"
                    label="Bank Institution"
                    required
                  />
                  <RHFTextField
                    name="routingNumber"
                    label="Routing Number"
                    required
                    inputProps={{ inputMode: "numeric", maxLength: 9 }}
                  />
                  <RHFTextField
                    name="accountNumber"
                    label="Account Number"
                    required
                    inputProps={{ inputMode: "numeric" }}
                  />
                  <RHFCheckbox
                    name="bankAccountConsent"
                    label="I authorize recurring payments from this account."
                  />
                  {methods.formState.errors.bankAccountConsent?.message && (
                    <Typography variant="body2" color="error.main">
                      {methods.formState.errors.bankAccountConsent.message}
                    </Typography>
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

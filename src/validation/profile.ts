import { z } from "zod";

export const ProfileSchema = z.object({
  // Personal Information
  heightFt: z.string().min(1, "Height is required"),
  weight: z.string().min(1, "Weight is required"),
  weight12MonthsAgo: z.string().min(1, "Weight 12 months ago is required"),
  ssn: z.string().min(4, "Enter SSN (masked)").max(11),
  membershipId: z.string().optional(),
  maritalStatus: z.string().min(1, "Marital status is required"),
  
  // Driver's License
  hasDriversLicense: z.enum(["yes", "no"]),
  driversLicenseNumber: z.string().optional(),
  driversLicenseState: z.string().optional(),
  
  // Residency Questions
  residencyIntentOutsideUS: z.enum(["yes", "no"]),
  residencyDurationMonths: z.string().optional(),
  residencyCountry: z.string().optional(),
  residencyIntentSixMonths: z.enum(["yes", "no"]),
  residencySixMonthsCountry: z.string().optional(),
  
  // Health Care Information (optional)
  physicianFirstName: z.string().optional(),
  physicianLastName: z.string().optional(),
  physicianPhoneNumber: z.string().optional(),
  medicalFacilityName: z.string().optional(),
  medicalStreetAddress: z.string().optional(),
  medicalAptSuite: z.string().optional(),
  medicalCity: z.string().optional(),
  medicalState: z.string().optional(),
  medicalZipCode: z.string().optional(),
  
  // Spouse Personal Information (conditional)
  spouseHeightFt: z.string().optional(),
  spouseWeight: z.string().optional(),
  spouseWeight12MonthsAgo: z.string().optional(),
  spouseSsn: z.string().optional(),
  spouseHasDriversLicense: z.enum(["yes", "no"]).optional(),
  spouseDriversLicenseNumber: z.string().optional(),
  spouseDriversLicenseState: z.string().optional(),
  spouseResidencyIntentOutsideUS: z.enum(["yes", "no"]).optional(),
  spouseResidencyDurationMonths: z.string().optional(),
  spouseResidencyCountry: z.string().optional(),
  spouseResidencyIntentSixMonths: z.enum(["yes", "no"]).optional(),
  spouseResidencySixMonthsCountry: z.string().optional(),
  
  // Spouse Health Care Information (optional)
  spousePhysicianFirstName: z.string().optional(),
  spousePhysicianLastName: z.string().optional(),
  spousePhysicianPhoneNumber: z.string().optional(),
  spouseMedicalFacilityName: z.string().optional(),
  spouseMedicalStreetAddress: z.string().optional(),
  spouseMedicalAptSuite: z.string().optional(),
  spouseMedicalCity: z.string().optional(),
  spouseMedicalState: z.string().optional(),
  spouseMedicalZipCode: z.string().optional(),
  
  // Other Coverage - Self
  hasOtherLifeInsurance: z.enum(["yes", "no"]).optional(),
  otherLifeInsuranceAmount: z.string().optional(),
  lifeInsuranceReplacement: z.enum(["yes", "no"]).optional(),
  hasLifeInsurancePending: z.enum(["yes", "no"]).optional(),
  pendingLifeInsuranceAmount: z.string().optional(),
  pendingLifeInsuranceCompany: z.string().optional(),
  
  hasDisabilityInsurance: z.enum(["yes", "no"]).optional(),
  disabilityCompanies: z.array(z.object({
    company: z.string().optional(),
    monthlyBenefit: z.string().optional(),
    benefitPeriod: z.string().optional(),
    waitingPeriod: z.string().optional()
  })).optional(),
  disabilityReplacement: z.enum(["yes", "no"]).optional(),
  disabilityReplacementAmount: z.string().optional(),
  
  // Other Coverage - Spouse
  spouseHasOtherLifeInsurance: z.enum(["yes", "no"]).optional(),
  spouseOtherLifeInsuranceAmount: z.string().optional(),
  spouseLifeInsuranceReplacement: z.enum(["yes", "no"]).optional(),
  spouseHasLifeInsurancePending: z.enum(["yes", "no"]).optional(),
  spousePendingLifeInsuranceAmount: z.string().optional(),
  spousePendingLifeInsuranceCompany: z.string().optional(),
  
  spouseHasDisabilityInsurance: z.enum(["yes", "no"]).optional(),
  spouseDisabilityCompanies: z.array(z.object({
    company: z.string().optional(),
    monthlyBenefit: z.string().optional(),
    benefitPeriod: z.string().optional(),
    waitingPeriod: z.string().optional()
  })).optional(),
  spouseDisabilityReplacement: z.enum(["yes", "no"]).optional(),
  spouseDisabilityReplacementAmount: z.string().optional(),
  
  // Beneficiary Information - Self
  wantsToBeneficiaries: z.enum(["yes", "no"]).optional(),
  
  // Term Life Insurance Beneficiary
  termLifeBeneficiaryType: z.enum(["individual", "trust"]).optional(),
  termLifeBeneficiaryDesignation: z.enum(["primary", "contingent"]).optional(),
  termLifeBeneficiaryFirstName: z.string().optional(),
  termLifeBeneficiaryLastName: z.string().optional(),
  termLifeBeneficiaryRelationship: z.string().optional(),
  termLifeBeneficiaryShare: z.string().optional(),
  termLifeTrustName: z.string().optional(),
  termLifeTrustDate: z.string().optional(),
  
  // 10-Year Level Term Life Insurance Beneficiary
  tenYearTermBeneficiaryType: z.enum(["individual", "trust"]).optional(),
  tenYearTermBeneficiaryDesignation: z.enum(["primary", "contingent"]).optional(),
  tenYearTermBeneficiaryFirstName: z.string().optional(),
  tenYearTermBeneficiaryLastName: z.string().optional(),
  tenYearTermBeneficiaryRelationship: z.string().optional(),
  tenYearTermBeneficiaryShare: z.string().optional(),
  tenYearTermTrustName: z.string().optional(),
  tenYearTermTrustDate: z.string().optional(),
  
  // 20-Year Level Term Life Insurance Beneficiary
  twentyYearTermBeneficiaryType: z.enum(["individual", "trust"]).optional(),
  twentyYearTermBeneficiaryDesignation: z.enum(["primary", "contingent"]).optional(),
  twentyYearTermBeneficiaryFirstName: z.string().optional(),
  twentyYearTermBeneficiaryLastName: z.string().optional(),
  twentyYearTermBeneficiaryRelationship: z.string().optional(),
  twentyYearTermBeneficiaryShare: z.string().optional(),
  twentyYearTermTrustName: z.string().optional(),
  twentyYearTermTrustDate: z.string().optional(),
  
  // Accidental Death and Dismemberment Insurance Beneficiary
  addBeneficiaryType: z.enum(["individual", "trust"]).optional(),
  addBeneficiaryDesignation: z.enum(["primary", "contingent"]).optional(),
  addBeneficiaryFirstName: z.string().optional(),
  addBeneficiaryLastName: z.string().optional(),
  addBeneficiaryRelationship: z.string().optional(),
  addBeneficiaryShare: z.string().optional(),
  addTrustName: z.string().optional(),
  addTrustDate: z.string().optional(),
  
  // Beneficiary Information - Spouse
  
  // Spouse Term Life Insurance Beneficiary
  spouseTermLifeBeneficiaryType: z.enum(["individual", "trust"]).optional(),
  spouseTermLifeBeneficiaryDesignation: z.enum(["primary", "contingent"]).optional(),
  spouseTermLifeBeneficiaryFirstName: z.string().optional(),
  spouseTermLifeBeneficiaryLastName: z.string().optional(),
  spouseTermLifeBeneficiaryRelationship: z.string().optional(),
  spouseTermLifeBeneficiaryShare: z.string().optional(),
  spouseTermLifeTrustName: z.string().optional(),
  spouseTermLifeTrustDate: z.string().optional(),
  
  // Spouse 10-Year Level Term Life Insurance Beneficiary
  spouseTenYearTermBeneficiaryType: z.enum(["individual", "trust"]).optional(),
  spouseTenYearTermBeneficiaryDesignation: z.enum(["primary", "contingent"]).optional(),
  spouseTenYearTermBeneficiaryFirstName: z.string().optional(),
  spouseTenYearTermBeneficiaryLastName: z.string().optional(),
  spouseTenYearTermBeneficiaryRelationship: z.string().optional(),
  spouseTenYearTermBeneficiaryShare: z.string().optional(),
  spouseTenYearTermTrustName: z.string().optional(),
  spouseTenYearTermTrustDate: z.string().optional(),
  
  // Spouse 20-Year Level Term Life Insurance Beneficiary
  spouseTwentyYearTermBeneficiaryType: z.enum(["individual", "trust"]).optional(),
  spouseTwentyYearTermBeneficiaryDesignation: z.enum(["primary", "contingent"]).optional(),
  spouseTwentyYearTermBeneficiaryFirstName: z.string().optional(),
  spouseTwentyYearTermBeneficiaryLastName: z.string().optional(),
  spouseTwentyYearTermBeneficiaryRelationship: z.string().optional(),
  spouseTwentyYearTermBeneficiaryShare: z.string().optional(),
  spouseTwentyYearTermTrustName: z.string().optional(),
  spouseTwentyYearTermTrustDate: z.string().optional(),
  
  // Spouse Accidental Death and Dismemberment Insurance Beneficiary
  spouseAddBeneficiaryType: z.enum(["individual", "trust"]).optional(),
  spouseAddBeneficiaryDesignation: z.enum(["primary", "contingent"]).optional(),
  spouseAddBeneficiaryFirstName: z.string().optional(),
  spouseAddBeneficiaryLastName: z.string().optional(),
  spouseAddBeneficiaryRelationship: z.string().optional(),
  spouseAddBeneficiaryShare: z.string().optional(),
  spouseAddTrustName: z.string().optional(),
  spouseAddTrustDate: z.string().optional(),
  
  // Payment Information
  wantsToAddPayment: z.enum(["yes", "no"]).optional(),
  
  // Term Life Insurance Payment
  termLifePaymentMethod: z.enum(["bill_me", "bank_account"]).optional(),
  termLifePaymentFrequency: z.enum(["monthly", "quarterly", "semiannually", "annually"]).optional(),
  
  // 10-Year Level Term Life Insurance Payment
  tenYearTermPaymentMethod: z.enum(["bill_me", "bank_account"]).optional(),
  tenYearTermPaymentFrequency: z.enum(["monthly", "quarterly", "semiannually", "annually"]).optional(),
  
  // 20-Year Level Term Life Insurance Payment
  twentyYearTermPaymentMethod: z.enum(["bill_me", "bank_account"]).optional(),
  twentyYearTermPaymentFrequency: z.enum(["monthly", "quarterly", "semiannually", "annually"]).optional(),
  
  // Accidental Death and Dismemberment Insurance Payment
  addPaymentMethod: z.enum(["bill_me", "bank_account"]).optional(),
  addPaymentFrequency: z.enum(["monthly", "quarterly", "semiannually", "annually"]).optional(),
  
  // Long-Term Disability Plus Insurance Payment
  longTermDisabilityPaymentMethod: z.enum(["bill_me", "bank_account"]).optional(),
  longTermDisabilityPaymentFrequency: z.enum(["monthly", "quarterly", "semiannually", "annually"]).optional(),
  
  // Mid-Term Disability Insurance Payment
  midTermDisabilityPaymentMethod: z.enum(["bill_me", "bank_account"]).optional(),
  midTermDisabilityPaymentFrequency: z.enum(["monthly", "quarterly", "semiannually", "annually"]).optional(),
  
  // Professional Overhead Expense Disability Insurance Payment
  professionalOverheadPaymentMethod: z.enum(["bill_me", "bank_account"]).optional(),
  professionalOverheadPaymentFrequency: z.enum(["monthly", "quarterly", "semiannually", "annually"]).optional(),
  
  // Critical Illness Insurance Payment
  criticalIllnessPaymentMethod: z.enum(["bill_me", "bank_account"]).optional(),
  criticalIllnessPaymentFrequency: z.enum(["monthly", "quarterly", "semiannually", "annually"]).optional(),
  
  // Hospital Money Insurance Payment
  hospitalMoneyPaymentMethod: z.enum(["bill_me", "bank_account"]).optional(),
  hospitalMoneyPaymentFrequency: z.enum(["monthly", "quarterly", "semiannually", "annually"]).optional(),
  
  // Bank Account Details
  routingNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  nameOnAccount: z.string().optional(),
  bankInstitution: z.string().optional(),
  bankAccountConsent: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // If has driver's license is yes, then license number and state are required
  if (data.hasDriversLicense === "yes") {
    if (!data.driversLicenseNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Driver's license number is required",
        path: ["driversLicenseNumber"]
      });
    }
    if (!data.driversLicenseState) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Driver's license state is required",
        path: ["driversLicenseState"]
      });
    }
  }
  
  // If residency intent outside US is yes, then duration and country are required
  if (data.residencyIntentOutsideUS === "yes") {
    if (!data.residencyDurationMonths) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duration is required",
        path: ["residencyDurationMonths"]
      });
    }
    if (!data.residencyCountry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country is required",
        path: ["residencyCountry"]
      });
    }
  }
  
  // If residency intent for six months is yes, then country is required
  if (data.residencyIntentSixMonths === "yes") {
    if (!data.residencySixMonthsCountry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country is required",
        path: ["residencySixMonthsCountry"]
      });
    }
  }
});

export type ProfileForm = z.infer<typeof ProfileSchema>;

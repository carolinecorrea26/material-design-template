import * as React from "react";
import {
  Stack, Typography, Alert, Box, Card, CardContent, Button, FormLabel
} from "@mui/material";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RHFTextField from "../components/form/RHFTextField";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFSelect from "../components/form/RHFSelect";
import RHFCurrencyField from "../components/form/RHFCurrencyField";
import RHFCheckbox from "../components/form/RHFCheckbox";
import { ProfileSchema, type ProfileForm } from "../validation/profile";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { useScrollToFirstError } from "../hooks/useScrollToFirstError";
import { Person, People, FamilyRestroom, Payment } from '@mui/icons-material';
import { commonStyles } from "../theme/commonStyles";



export default function Profile() {
  const { data, setProfile } = useAppData();
  const { markComplete } = useStepper();
  const navigate = useNavigate();

  // State for showing autosave success message
  const [showAutosaveAlert, setShowAutosaveAlert] = React.useState(false);

  // Check if autosave is enabled and show alert on page load
  React.useEffect(() => {
    const autosaveEnabled = sessionStorage.getItem("nyl-autosave-enabled") === "1";
    if (autosaveEnabled) {
      setShowAutosaveAlert(true);
    }
  }, []);

  // Check if spouse was selected in eligibility
  const spouseSelected = data.eligibility?.applicants?.spouse || false;
  
  // Check coverage for QuickDecision products to determine which residency questions to show
  const hasQuickDecisionProduct = data.coverage?.some(item => {
    // For now we'll need to create a mapping since we don't have access to full product data
    // QuickDecision products typically include specific product IDs
    const quickDecisionProductIds = ['qd-term-life', 'qd-disability', 'qd-add']; // This would come from your product data
    return quickDecisionProductIds.includes(item.productId);
  });
  const hasNonQuickDecisionProduct = data.coverage?.some(item => {
    const quickDecisionProductIds = ['qd-term-life', 'qd-disability', 'qd-add']; 
    return !quickDecisionProductIds.includes(item.productId);
  });

  const methods = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: data.profile ?? {
      heightFt: "",
      weight: "",
      weight12MonthsAgo: "",
      ssn: "",
      membershipId: "",
      maritalStatus: "",
      hasDriversLicense: undefined,
      driversLicenseNumber: "",
      driversLicenseState: "",
      residencyIntentOutsideUS: undefined,
      residencyDurationMonths: "",
      residencyCountry: "",
      residencyIntentSixMonths: undefined,
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
      // Spouse fields
      spouseHeightFt: "",
      spouseWeight: "",
      spouseWeight12MonthsAgo: "",
      spouseSsn: "",
      spouseHasDriversLicense: undefined,
      spouseDriversLicenseNumber: "",
      spouseDriversLicenseState: "",
      spouseResidencyIntentOutsideUS: undefined,
      spouseResidencyDurationMonths: "",
      spouseResidencyCountry: "",
      spouseResidencyIntentSixMonths: undefined,
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
      
      // Other Coverage - Self
      hasOtherLifeInsurance: undefined,
      otherLifeInsuranceAmount: "",
      lifeInsuranceReplacement: undefined,
      hasLifeInsurancePending: undefined,
      pendingLifeInsuranceAmount: "",
      pendingLifeInsuranceCompany: "",
      
      hasDisabilityInsurance: undefined,
      disabilityCompanies: [{ company: "", monthlyBenefit: "", benefitPeriod: "", waitingPeriod: "" }],
      disabilityReplacement: undefined,
      disabilityReplacementAmount: "",
      
      // Other Coverage - Spouse
      spouseHasOtherLifeInsurance: undefined,
      spouseOtherLifeInsuranceAmount: "",
      spouseLifeInsuranceReplacement: undefined,
      spouseHasLifeInsurancePending: undefined,
      spousePendingLifeInsuranceAmount: "",
      spousePendingLifeInsuranceCompany: "",
      
      spouseHasDisabilityInsurance: undefined,
      spouseDisabilityCompanies: [{ company: "", monthlyBenefit: "", benefitPeriod: "", waitingPeriod: "" }],
      spouseDisabilityReplacement: undefined,
      spouseDisabilityReplacementAmount: "",
      
      // Beneficiary Information - Self
      wantsToBeneficiaries: undefined,
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
      
      // Beneficiary Information - Spouse
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
      
      // Payment Information
      wantsToAddPayment: undefined,
      
      // Term Life Insurance Payment
      termLifePaymentMethod: undefined,
      termLifePaymentFrequency: undefined,
      
      // 10-Year Level Term Life Insurance Payment
      tenYearTermPaymentMethod: undefined,
      tenYearTermPaymentFrequency: undefined,
      
      // 20-Year Level Term Life Insurance Payment
      twentyYearTermPaymentMethod: undefined,
      twentyYearTermPaymentFrequency: undefined,
      
      // Accidental Death and Dismemberment Insurance Payment
      addPaymentMethod: undefined,
      addPaymentFrequency: undefined,
      
      // Long-Term Disability Plus Insurance Payment
      longTermDisabilityPaymentMethod: undefined,
      longTermDisabilityPaymentFrequency: undefined,
      
      // Mid-Term Disability Insurance Payment
      midTermDisabilityPaymentMethod: undefined,
      midTermDisabilityPaymentFrequency: undefined,
      
      // Professional Overhead Expense Disability Insurance Payment
      professionalOverheadPaymentMethod: undefined,
      professionalOverheadPaymentFrequency: undefined,
      
      // Critical Illness Insurance Payment
      criticalIllnessPaymentMethod: undefined,
      criticalIllnessPaymentFrequency: undefined,
      
      // Hospital Money Insurance Payment
      hospitalMoneyPaymentMethod: undefined,
      hospitalMoneyPaymentFrequency: undefined,
      
      // Bank Account Details
      routingNumber: "",
      accountNumber: "",
      nameOnAccount: "",
      bankInstitution: "",
      bankAccountConsent: false,
      
      // Financial Information
      totalNetWorth: "",
      totalAnnualUnearnedIncome: "",
      isSelfEmployed: undefined,
      isSoleProprietor: false,
      isProfessionalCorp: false,
      soleProprietorGrossIncome: "",
      soleProprietorGrossEarnings: "",
      soleProprietorBusinessExpenses: "",
      professionalCorpAnnualSalary: "",
      professionalCorpSCorpDistribution: "",
      professionalCorpDividends: "",
      professionalCorpBonus: "",
      professionalCorpBonusType: undefined,
      professionalCorpCommission: "",
      professionalCorpCommissionType: undefined,
      professionalCorpBenefitsCost: "",
      selfEmploymentDuration: "",
      isWorkingFromHome: undefined,
      hasWorkOutsideHome: undefined,
      workDetailsExplanation: ""
    }
  });
  useScrollToFirstError(methods);

  // Watch for conditional fields
  const hasDriversLicense = useWatch({ control: methods.control, name: "hasDriversLicense" });
  const residencyIntentOutsideUS = useWatch({ control: methods.control, name: "residencyIntentOutsideUS" });
  const residencyIntentSixMonths = useWatch({ control: methods.control, name: "residencyIntentSixMonths" });
  
  // Watch for spouse conditional fields
  const spouseHasDriversLicense = useWatch({ control: methods.control, name: "spouseHasDriversLicense" });
  const spouseResidencyIntentOutsideUS = useWatch({ control: methods.control, name: "spouseResidencyIntentOutsideUS" });
  const spouseResidencyIntentSixMonths = useWatch({ control: methods.control, name: "spouseResidencyIntentSixMonths" });
  
  // Watch for beneficiary conditional fields
  const wantsToBeneficiaries = useWatch({ control: methods.control, name: "wantsToBeneficiaries" });
  const termLifeBeneficiaryType = useWatch({ control: methods.control, name: "termLifeBeneficiaryType" });
  const tenYearTermBeneficiaryType = useWatch({ control: methods.control, name: "tenYearTermBeneficiaryType" });
  const twentyYearTermBeneficiaryType = useWatch({ control: methods.control, name: "twentyYearTermBeneficiaryType" });
  const addBeneficiaryType = useWatch({ control: methods.control, name: "addBeneficiaryType" });
  
  // Watch for spouse beneficiary conditional fields
  const spouseTermLifeBeneficiaryType = useWatch({ control: methods.control, name: "spouseTermLifeBeneficiaryType" });
  const spouseTenYearTermBeneficiaryType = useWatch({ control: methods.control, name: "spouseTenYearTermBeneficiaryType" });
  const spouseTwentyYearTermBeneficiaryType = useWatch({ control: methods.control, name: "spouseTwentyYearTermBeneficiaryType" });
  const spouseAddBeneficiaryType = useWatch({ control: methods.control, name: "spouseAddBeneficiaryType" });
  
  // Watch for payment conditional fields
  const wantsToAddPayment = useWatch({ control: methods.control, name: "wantsToAddPayment" });
  const termLifePaymentMethod = useWatch({ control: methods.control, name: "termLifePaymentMethod" });
  const tenYearTermPaymentMethod = useWatch({ control: methods.control, name: "tenYearTermPaymentMethod" });
  const twentyYearTermPaymentMethod = useWatch({ control: methods.control, name: "twentyYearTermPaymentMethod" });
  const addPaymentMethod = useWatch({ control: methods.control, name: "addPaymentMethod" });
  const longTermDisabilityPaymentMethod = useWatch({ control: methods.control, name: "longTermDisabilityPaymentMethod" });
  const midTermDisabilityPaymentMethod = useWatch({ control: methods.control, name: "midTermDisabilityPaymentMethod" });
  const professionalOverheadPaymentMethod = useWatch({ control: methods.control, name: "professionalOverheadPaymentMethod" });
  const criticalIllnessPaymentMethod = useWatch({ control: methods.control, name: "criticalIllnessPaymentMethod" });
  const hospitalMoneyPaymentMethod = useWatch({ control: methods.control, name: "hospitalMoneyPaymentMethod" });
  
  // Watch for payment frequency fields
  const termLifePaymentFrequency = useWatch({ control: methods.control, name: "termLifePaymentFrequency" });
  const tenYearTermPaymentFrequency = useWatch({ control: methods.control, name: "tenYearTermPaymentFrequency" });
  const twentyYearTermPaymentFrequency = useWatch({ control: methods.control, name: "twentyYearTermPaymentFrequency" });
  const addPaymentFrequency = useWatch({ control: methods.control, name: "addPaymentFrequency" });
  const longTermDisabilityPaymentFrequency = useWatch({ control: methods.control, name: "longTermDisabilityPaymentFrequency" });
  const midTermDisabilityPaymentFrequency = useWatch({ control: methods.control, name: "midTermDisabilityPaymentFrequency" });
  const professionalOverheadPaymentFrequency = useWatch({ control: methods.control, name: "professionalOverheadPaymentFrequency" });
  const criticalIllnessPaymentFrequency = useWatch({ control: methods.control, name: "criticalIllnessPaymentFrequency" });
  const hospitalMoneyPaymentFrequency = useWatch({ control: methods.control, name: "hospitalMoneyPaymentFrequency" });
  
  // Check if any payment method requires bank account
  const needsBankAccount = [
    termLifePaymentMethod,
    tenYearTermPaymentMethod, 
    twentyYearTermPaymentMethod,
    addPaymentMethod,
    longTermDisabilityPaymentMethod,
    midTermDisabilityPaymentMethod,
    professionalOverheadPaymentMethod,
    criticalIllnessPaymentMethod,
    hospitalMoneyPaymentMethod
  ].some(method => method === "bank_account");

  // Helper function to check if estimated costs should show (both method and frequency selected)
  const shouldShowEstimatedCost = (method: string | undefined, frequency: string | undefined) => {
    return method && frequency;
  };

  // Get coverage data to determine which applicants are selected for each product
  const appData = useAppData();
  const coverageData = appData.data.coverage || [];
  
  // Helper function to get selected applicants for a product
  const getSelectedApplicants = (productId: string): string[] => {
    const selectedItems = coverageData.filter(item => item.productId === productId);
    const applicants: string[] = [];
    
    selectedItems.forEach(item => {
      if (item.applicant === 'self') applicants.push('Self');
      if (item.applicant === 'spouse') applicants.push('Spouse');
      if (item.applicant === 'child') applicants.push('Child(ren)');
    });
    
    // Remove duplicates
    return [...new Set(applicants)];
  };

  // Helper function to calculate total estimated cost
  const calculateTotalCost = (productId: string, frequency: string | undefined): number => {
    if (!frequency) return 0;
    
    const applicants = getSelectedApplicants(productId);
    let total = 0;
    
    // Sample costs for demonstration - these would come from actual data
    // Using common product IDs that might be used in the system
    const costMap: Record<string, Record<string, Record<string, number>>> = {
      'li-term': {
        monthly: { 'Self': 4.64, 'Spouse': 2.83, 'Child(ren)': 0.75 },
        quarterly: { 'Self': 13.91, 'Spouse': 8.50, 'Child(ren)': 2.25 },
        semiannually: { 'Self': 27.82, 'Spouse': 17.00, 'Child(ren)': 4.50 },
        annually: { 'Self': 55.64, 'Spouse': 34.00, 'Child(ren)': 9.00 }
      },
      'li-10yr': {
        monthly: { 'Self': 1.82, 'Spouse': 1.25, 'Child(ren)': 0.75 },
        quarterly: { 'Self': 5.46, 'Spouse': 3.75, 'Child(ren)': 2.25 },
        semiannually: { 'Self': 10.92, 'Spouse': 7.50, 'Child(ren)': 4.50 },
        annually: { 'Self': 21.84, 'Spouse': 15.00, 'Child(ren)': 9.00 }
      }
      // Other products would have $0 costs as specified in the requirement
    };
    
    applicants.forEach(applicant => {
      total += costMap[productId]?.[frequency]?.[applicant] || 0;
    });
    
    return total;
  };

  // Helper function to get individual applicant cost
  const getApplicantCost = (productId: string, frequency: string | undefined, applicant: string): number => {
    if (!frequency) return 0;
    
    const costMap: Record<string, Record<string, Record<string, number>>> = {
      'li-term': {
        monthly: { 'Self': 4.64, 'Spouse': 2.83, 'Child(ren)': 0.75 },
        quarterly: { 'Self': 13.91, 'Spouse': 8.50, 'Child(ren)': 2.25 },
        semiannually: { 'Self': 27.82, 'Spouse': 17.00, 'Child(ren)': 4.50 },
        annually: { 'Self': 55.64, 'Spouse': 34.00, 'Child(ren)': 9.00 }
      },
      'li-10yr': {
        monthly: { 'Self': 1.82, 'Spouse': 1.25, 'Child(ren)': 0.75 },
        quarterly: { 'Self': 5.46, 'Spouse': 3.75, 'Child(ren)': 2.25 },
        semiannually: { 'Self': 10.92, 'Spouse': 7.50, 'Child(ren)': 4.50 },
        annually: { 'Self': 21.84, 'Spouse': 15.00, 'Child(ren)': 9.00 }
      }
    };
    
    return costMap[productId]?.[frequency]?.[applicant] || 0;
  };

  // Component for displaying estimated costs with $0 for products without pricing
  const renderEstimatedCostSection = (productId: string, paymentMethod: string | undefined, paymentFrequency: string | undefined, hasActualCosts = false) => {
    if (!shouldShowEstimatedCost(paymentMethod, paymentFrequency)) {
      return null;
    }

    const selectedApplicants = getSelectedApplicants(productId);
    
    if (selectedApplicants.length === 0) {
      return (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
            Estimated Cost:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No applicants selected for this product
          </Typography>
        </Box>
      );
    }

    if (hasActualCosts) {
      const totalCost = calculateTotalCost(productId, paymentFrequency);
      return (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
            Estimated Cost:
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Total: ${totalCost.toFixed(2)} / {paymentFrequency}
            </Typography>
            {selectedApplicants.map(applicant => (
              <Typography key={applicant} variant="body2" color="text.secondary">
                • {applicant}: ${getApplicantCost(productId, paymentFrequency, applicant).toFixed(2)} / {paymentFrequency}
              </Typography>
            ))}
          </Stack>
        </Box>
      );
    } else {
      // For $0 products
      return (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
            Estimated Cost:
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Total: $0.00 / {paymentFrequency}
            </Typography>
            {selectedApplicants.map(applicant => (
              <Typography key={applicant} variant="body2" color="text.secondary">
                • {applicant}: $0.00 / {paymentFrequency}
              </Typography>
            ))}
          </Stack>
        </Box>
      );
    }
  };

  // DevTools: Fill form with test data
  React.useEffect(() => {
    const handleFillForm = () => {
      const filledData = {
        heightFt: "5'10\"",
        weight: "180",
        weight12MonthsAgo: "175",
        ssn: "123-45-6789",
        membershipId: "NYL123456",
        maritalStatus: "single",
        hasDriversLicense: "yes" as const,
        driversLicenseNumber: "D1234567",
        driversLicenseState: "NY",
        residencyIntentOutsideUS: "no" as const,
        residencyDurationMonths: "",
        residencyCountry: "",
        residencyIntentSixMonths: "no" as const,
        residencySixMonthsCountry: "",
        physicianFirstName: "John",
        physicianLastName: "Smith",
        physicianPhoneNumber: "555-123-4567",
        medicalFacilityName: "City Medical Center",
        medicalStreetAddress: "123 Main St",
        medicalAptSuite: "Suite 100",
        medicalCity: "New York",
        medicalState: "NY",
        medicalZipCode: "10001",
        // Spouse test data
        spouseHeightFt: spouseSelected ? "5'6\"" : undefined,
        spouseWeight: spouseSelected ? "140" : undefined,
        spouseWeight12MonthsAgo: spouseSelected ? "138" : undefined,
        spouseSsn: spouseSelected ? "987-65-4321" : undefined,
        spouseHasDriversLicense: spouseSelected ? ("yes" as const) : undefined,
        spouseDriversLicenseNumber: spouseSelected ? "S7654321" : undefined,
        spouseDriversLicenseState: spouseSelected ? "NY" : undefined,
        spouseResidencyIntentOutsideUS: spouseSelected ? ("no" as const) : undefined,
        spouseResidencyDurationMonths: spouseSelected ? "" : undefined,
        spouseResidencyCountry: spouseSelected ? "" : undefined,
        spouseResidencyIntentSixMonths: spouseSelected ? ("no" as const) : undefined,
        spouseResidencySixMonthsCountry: spouseSelected ? "" : undefined,
        spousePhysicianFirstName: spouseSelected ? "Jane" : undefined,
        spousePhysicianLastName: spouseSelected ? "Doe" : undefined,
        spousePhysicianPhoneNumber: spouseSelected ? "555-987-6543" : undefined,
        spouseMedicalFacilityName: spouseSelected ? "Metro Health Center" : undefined,
        spouseMedicalStreetAddress: spouseSelected ? "456 Oak Ave" : undefined,
        spouseMedicalAptSuite: spouseSelected ? "Suite 200" : undefined,
        spouseMedicalCity: spouseSelected ? "New York" : undefined,
        spouseMedicalState: spouseSelected ? "NY" : undefined,
        spouseMedicalZipCode: spouseSelected ? "10002" : undefined,
        
        // Other Coverage - Self test data
        hasOtherLifeInsurance: "yes" as const,
        otherLifeInsuranceAmount: "100000",
        lifeInsuranceReplacement: "no" as const,
        hasLifeInsurancePending: "no" as const,
        pendingLifeInsuranceAmount: "",
        pendingLifeInsuranceCompany: "",
        
        hasDisabilityInsurance: "yes" as const,
        disabilityCompanies: [
          { company: "ACME Insurance", monthlyBenefit: "3000", benefitPeriod: "age65", waitingPeriod: "90days" },
          { company: "XYZ Corp Benefits", monthlyBenefit: "1500", benefitPeriod: "5years", waitingPeriod: "30days" }
        ],
        disabilityReplacement: "no" as const,
        disabilityReplacementAmount: "",
        
        // Other Coverage - Spouse test data
        spouseHasOtherLifeInsurance: spouseSelected ? ("yes" as const) : undefined,
        spouseOtherLifeInsuranceAmount: spouseSelected ? "75000" : undefined,
        spouseLifeInsuranceReplacement: spouseSelected ? ("no" as const) : undefined,
        spouseHasLifeInsurancePending: spouseSelected ? ("no" as const) : undefined,
        spousePendingLifeInsuranceAmount: spouseSelected ? "" : undefined,
        spousePendingLifeInsuranceCompany: spouseSelected ? "" : undefined,
        
        spouseHasDisabilityInsurance: spouseSelected ? ("yes" as const) : undefined,
        spouseDisabilityCompanies: spouseSelected ? [
          { company: "Beta Insurance", monthlyBenefit: "2500", benefitPeriod: "5years", waitingPeriod: "60days" }
        ] : undefined,
        spouseDisabilityReplacement: spouseSelected ? ("no" as const) : undefined,
        spouseDisabilityReplacementAmount: spouseSelected ? "" : undefined,
        
        // Beneficiary Information - Self test data
        wantsToBeneficiaries: "yes" as const,
        termLifeBeneficiaryType: "individual" as const,
        termLifeBeneficiaryDesignation: "primary" as const,
        termLifeBeneficiaryFirstName: "Jane",
        termLifeBeneficiaryLastName: "Doe",
        termLifeBeneficiaryRelationship: "spouse",
        termLifeBeneficiaryShare: "100",
        tenYearTermBeneficiaryType: "individual" as const,
        tenYearTermBeneficiaryDesignation: "primary" as const,
        tenYearTermBeneficiaryFirstName: "Jane",
        tenYearTermBeneficiaryLastName: "Doe",
        tenYearTermBeneficiaryRelationship: "spouse",
        tenYearTermBeneficiaryShare: "100",
        twentyYearTermBeneficiaryType: "individual" as const,
        twentyYearTermBeneficiaryDesignation: "primary" as const,
        twentyYearTermBeneficiaryFirstName: "Jane",
        twentyYearTermBeneficiaryLastName: "Doe",
        twentyYearTermBeneficiaryRelationship: "spouse",
        twentyYearTermBeneficiaryShare: "100",
        addBeneficiaryType: "individual" as const,
        addBeneficiaryDesignation: "primary" as const,
        addBeneficiaryFirstName: "Jane",
        addBeneficiaryLastName: "Doe",
        addBeneficiaryRelationship: "spouse",
        addBeneficiaryShare: "100",
        
        // Beneficiary Information - Spouse test data
        spouseTermLifeBeneficiaryType: spouseSelected ? ("individual" as const) : undefined,
        spouseTermLifeBeneficiaryDesignation: spouseSelected ? ("primary" as const) : undefined,
        spouseTermLifeBeneficiaryFirstName: spouseSelected ? "John" : undefined,
        spouseTermLifeBeneficiaryLastName: spouseSelected ? "Doe" : undefined,
        spouseTermLifeBeneficiaryRelationship: spouseSelected ? "spouse" : undefined,
        spouseTermLifeBeneficiaryShare: spouseSelected ? "100" : undefined,
        spouseTenYearTermBeneficiaryType: spouseSelected ? ("individual" as const) : undefined,
        spouseTenYearTermBeneficiaryDesignation: spouseSelected ? ("primary" as const) : undefined,
        spouseTenYearTermBeneficiaryFirstName: spouseSelected ? "John" : undefined,
        spouseTenYearTermBeneficiaryLastName: spouseSelected ? "Doe" : undefined,
        spouseTenYearTermBeneficiaryRelationship: spouseSelected ? "spouse" : undefined,
        spouseTenYearTermBeneficiaryShare: spouseSelected ? "100" : undefined,
        spouseTwentyYearTermBeneficiaryType: spouseSelected ? ("individual" as const) : undefined,
        spouseTwentyYearTermBeneficiaryDesignation: spouseSelected ? ("primary" as const) : undefined,
        spouseTwentyYearTermBeneficiaryFirstName: spouseSelected ? "John" : undefined,
        spouseTwentyYearTermBeneficiaryLastName: spouseSelected ? "Doe" : undefined,
        spouseTwentyYearTermBeneficiaryRelationship: spouseSelected ? "spouse" : undefined,
        spouseTwentyYearTermBeneficiaryShare: spouseSelected ? "100" : undefined,
        spouseAddBeneficiaryType: spouseSelected ? ("individual" as const) : undefined,
        spouseAddBeneficiaryDesignation: spouseSelected ? ("primary" as const) : undefined,
        spouseAddBeneficiaryFirstName: spouseSelected ? "John" : undefined,
        spouseAddBeneficiaryLastName: spouseSelected ? "Doe" : undefined,
        spouseAddBeneficiaryRelationship: spouseSelected ? "spouse" : undefined,
        spouseAddBeneficiaryShare: spouseSelected ? "100" : undefined,
        
        // Payment Information
        wantsToAddPayment: "yes" as const,
        termLifePaymentMethod: "bank_account" as const,
        termLifePaymentFrequency: "monthly" as const,
        tenYearTermPaymentMethod: "bank_account" as const,
        tenYearTermPaymentFrequency: "monthly" as const,
        twentyYearTermPaymentMethod: "bank_account" as const,
        twentyYearTermPaymentFrequency: "quarterly" as const,
        addPaymentMethod: "bank_account" as const,
        addPaymentFrequency: "monthly" as const,
        longTermDisabilityPaymentMethod: "bank_account" as const,
        longTermDisabilityPaymentFrequency: "monthly" as const,
        
        // Bank Account Details
        routingNumber: "021000021",
        accountNumber: "123456789",
        nameOnAccount: "John Doe",
        bankInstitution: "Chase Bank",
        bankAccountConsent: true,
        
        // Financial Information
        totalNetWorth: "500000",
        totalAnnualUnearnedIncome: "25000",
        isSelfEmployed: "yes" as const,
        isSoleProprietor: true,
        isProfessionalCorp: false,
        soleProprietorGrossIncome: "200000",
        soleProprietorGrossEarnings: "150000",
        soleProprietorBusinessExpenses: "50000",
        selfEmploymentDuration: "5",
        isWorkingFromHome: "no" as const,
        hasWorkOutsideHome: "yes" as const,
        workDetailsExplanation: "Office location in downtown"
      };
      
      methods.reset(filledData);
    };

    window.addEventListener('devtools:fillform', handleFillForm);
    return () => window.removeEventListener('devtools:fillform', handleFillForm);
  }, [methods, spouseSelected]);

  const onSubmit = (values: ProfileForm) => {
    setProfile(values);
    markComplete();
    // next();
    navigate("/health-history");
  };

  // Height options for dropdown
  const heightOptions = [
    { label: "4'0\"", value: "4'0\"" },
    { label: "4'1\"", value: "4'1\"" },
    { label: "4'2\"", value: "4'2\"" },
    { label: "4'3\"", value: "4'3\"" },
    { label: "4'4\"", value: "4'4\"" },
    { label: "4'5\"", value: "4'5\"" },
    { label: "4'6\"", value: "4'6\"" },
    { label: "4'7\"", value: "4'7\"" },
    { label: "4'8\"", value: "4'8\"" },
    { label: "4'9\"", value: "4'9\"" },
    { label: "4'10\"", value: "4'10\"" },
    { label: "4'11\"", value: "4'11\"" },
    { label: "5'0\"", value: "5'0\"" },
    { label: "5'1\"", value: "5'1\"" },
    { label: "5'2\"", value: "5'2\"" },
    { label: "5'3\"", value: "5'3\"" },
    { label: "5'4\"", value: "5'4\"" },
    { label: "5'5\"", value: "5'5\"" },
    { label: "5'6\"", value: "5'6\"" },
    { label: "5'7\"", value: "5'7\"" },
    { label: "5'8\"", value: "5'8\"" },
    { label: "5'9\"", value: "5'9\"" },
    { label: "5'10\"", value: "5'10\"" },
    { label: "5'11\"", value: "5'11\"" },
    { label: "6'0\"", value: "6'0\"" },
    { label: "6'1\"", value: "6'1\"" },
    { label: "6'2\"", value: "6'2\"" },
    { label: "6'3\"", value: "6'3\"" },
    { label: "6'4\"", value: "6'4\"" },
    { label: "6'5\"", value: "6'5\"" },
    { label: "6'6\"", value: "6'6\"" },
    { label: "6'7\"", value: "6'7\"" },
    { label: "6'8\"", value: "6'8\"" },
  ];

  // State options
  const stateOptions = [
    { label: "Alabama", value: "AL" },
    { label: "Alaska", value: "AK" },
    { label: "Arizona", value: "AZ" },
    { label: "Arkansas", value: "AR" },
    { label: "California", value: "CA" },
    { label: "Colorado", value: "CO" },
    { label: "Connecticut", value: "CT" },
    { label: "Delaware", value: "DE" },
    { label: "Florida", value: "FL" },
    { label: "Georgia", value: "GA" },
    { label: "Hawaii", value: "HI" },
    { label: "Idaho", value: "ID" },
    { label: "Illinois", value: "IL" },
    { label: "Indiana", value: "IN" },
    { label: "Iowa", value: "IA" },
    { label: "Kansas", value: "KS" },
    { label: "Kentucky", value: "KY" },
    { label: "Louisiana", value: "LA" },
    { label: "Maine", value: "ME" },
    { label: "Maryland", value: "MD" },
    { label: "Massachusetts", value: "MA" },
    { label: "Michigan", value: "MI" },
    { label: "Minnesota", value: "MN" },
    { label: "Mississippi", value: "MS" },
    { label: "Missouri", value: "MO" },
    { label: "Montana", value: "MT" },
    { label: "Nebraska", value: "NE" },
    { label: "Nevada", value: "NV" },
    { label: "New Hampshire", value: "NH" },
    { label: "New Jersey", value: "NJ" },
    { label: "New Mexico", value: "NM" },
    { label: "New York", value: "NY" },
    { label: "North Carolina", value: "NC" },
    { label: "North Dakota", value: "ND" },
    { label: "Ohio", value: "OH" },
    { label: "Oklahoma", value: "OK" },
    { label: "Oregon", value: "OR" },
    { label: "Pennsylvania", value: "PA" },
    { label: "Rhode Island", value: "RI" },
    { label: "South Carolina", value: "SC" },
    { label: "South Dakota", value: "SD" },
    { label: "Tennessee", value: "TN" },
    { label: "Texas", value: "TX" },
    { label: "Utah", value: "UT" },
    { label: "Vermont", value: "VT" },
    { label: "Virginia", value: "VA" },
    { label: "Washington", value: "WA" },
    { label: "West Virginia", value: "WV" },
    { label: "Wisconsin", value: "WI" },
    { label: "Wyoming", value: "WY" }
  ];

  // Marital status options
  const maritalStatusOptions = [
    { label: "Single", value: "single" },
    { label: "Married", value: "married" },
    { label: "Divorced", value: "divorced" },
    { label: "Widowed", value: "widowed" },
    { label: "Separated", value: "separated" }
  ];

  // Country options (sample)
  const countryOptions = [
    { label: "Canada", value: "canada" },
    { label: "Mexico", value: "mexico" },
    { label: "United Kingdom", value: "uk" },
    { label: "France", value: "france" },
    { label: "Germany", value: "germany" },
    { label: "Japan", value: "japan" },
    { label: "Australia", value: "australia" },
    { label: "Other", value: "other" }
  ];

  // Relationship options for beneficiaries
  const relationshipOptions = [
    { label: "Spouse", value: "spouse" },
    { label: "Child", value: "child" },
    { label: "Parent", value: "parent" },
    { label: "Sibling", value: "sibling" },
    { label: "Other Relative", value: "other_relative" },
    { label: "Other", value: "other" }
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Stack spacing={4}>
          <PageHeader 
            title="Applicant Profile"
            notes="To complete your application, please provide all the necessary information below. This will help us process your application quickly and accurately."
          />

          {/* Autosave Success Alert */}
          {showAutosaveAlert && (
            <Alert 
              severity="success" 
              onClose={() => setShowAutosaveAlert(false)}
            >
              Your progress is being saved automatically.
            </Alert>
          )}

          <Stack spacing={4}>
            {/* Main Personal Information Card */}
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Category Header */}
                  <Box sx={commonStyles.coverageCategoryHeader}>
                    <Typography variant="h4" sx={commonStyles.coverageCategoryTitle}>
                      Personal Information
                    </Typography>
                  </Box>

                  <Alert severity="info">
                    We make sure your information is secure. You may find more details about your privacy and safety in the privacy notice.
                  </Alert>

                  {/* Your Personal Information Card */}
                  <Card variant="outlined" sx={commonStyles.coverageCard}>
                  <CardContent>
                    <Stack spacing={2}>
                      {/* Card Header */}
                      <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={commonStyles.iconCircle}>
                            <Person color="primary" />
                          </Box>
                          <Typography variant="h6">
                            Your Personal Information
                          </Typography>
                        </Stack>
                      </Box>
                      
                      <Stack spacing={2}>
                  {/* Height and Weight */}
                  <RHFSelect 
                    name="heightFt" 
                    label="Height (ft.)" 
                    options={heightOptions}
                    required 
                  />
                  <RHFTextField 
                    name="weight" 
                    label="Weight (lbs.)" 
                    type="number"
                    required 
                  />

                  {/* Weight 12 Months Ago */}
                  <RHFTextField 
                    name="weight12MonthsAgo" 
                    label="Weight 12 Mo. Ago" 
                    type="number"
                    required 
                  />

                  {/* Social Security Number */}
                  <RHFTextField 
                    name="ssn" 
                    label="Social Security Number" 
                    placeholder="XXX-XX-XXXX"
                    required 
                  />

                  {/* Membership ID */}
                  <RHFTextField 
                    name="membershipId" 
                    label="Membership ID" 
                  />

                  {/* Marital Status */}
                  <RHFSelect 
                    name="maritalStatus" 
                    label="Marital Status" 
                    options={maritalStatusOptions}
                    required 
                  />

                  {/* Driver's License */}
                  <RHFRadioGroup
                    name="hasDriversLicense"
                    label="Do you have a driver's license?"
                    options={[
                      { label: "Yes", value: "yes" },
                      { label: "No", value: "no" }
                    ]}
                    required
                  />

                  {hasDriversLicense === "yes" && (
                    <Stack spacing={2}>
                      <RHFTextField 
                        name="driversLicenseNumber" 
                        label="Driver's License No." 
                        required 
                      />
                      <RHFSelect 
                        name="driversLicenseState" 
                        label="State in which issued" 
                        options={stateOptions}
                        required 
                      />
                    </Stack>
                  )}

                  {/* Residency Questions - Conditional based on coverage */}
                  {hasNonQuickDecisionProduct && (
                    <>
                      <RHFRadioGroup
                        name="residencyIntentOutsideUS"
                        label="Do you intend to reside outside the U.S. or Canada in the next 12 months?"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" }
                        ]}
                        required
                      />

                      {residencyIntentOutsideUS === "yes" && (
                        <Stack spacing={2}>
                          <RHFTextField 
                            name="residencyDurationMonths" 
                            label="How Long (months)" 
                            type="number"
                            required 
                          />
                          <RHFSelect 
                            name="residencyCountry" 
                            label="Country" 
                            options={countryOptions}
                            required 
                          />
                        </Stack>
                      )}
                    </>
                  )}

                  {hasQuickDecisionProduct && (
                    <>
                      <RHFRadioGroup
                        name="residencyIntentSixMonths"
                        label="Do you intend to reside outside the U.S. or Canada for more than six months?"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" }
                        ]}
                        required
                      />

                      {residencyIntentSixMonths === "yes" && (
                        <RHFSelect 
                          name="residencySixMonthsCountry" 
                          label="Country" 
                          options={countryOptions}
                          required 
                        />
                      )}
                    </>
                  )}

                  {/* Health Care Information Subsection */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Health Care Information (optional)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Providing your physician's details will speed up processing your application by allowing us to confirm any health information, if needed.
                    </Typography>
                    
                    <Stack spacing={2}>
                      {/* Physician Name Row */}
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <RHFTextField 
                          name="physicianFirstName" 
                          label="Physician First Name" 
                        />
                        <RHFTextField 
                          name="physicianLastName" 
                          label="Physician Last Name" 
                        />
                      </Stack>

                      {/* Phone and Facility */}
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <RHFTextField 
                          name="physicianPhoneNumber" 
                          label="Physician Phone Number" 
                          type="tel"
                        />
                        <RHFTextField 
                          name="medicalFacilityName" 
                          label="Name of Medical Facility" 
                        />
                      </Stack>

                      {/* Address Row */}
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <Box sx={{ flex: 2 }}>
                          <RHFTextField 
                            name="medicalStreetAddress" 
                            label="Street Address" 
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <RHFTextField 
                            name="medicalAptSuite" 
                            label="Apt/Suite" 
                          />
                        </Box>
                      </Stack>

                      {/* City, State, Zip Row */}
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <Box sx={{ flex: 2 }}>
                          <RHFTextField 
                            name="medicalCity" 
                            label="City" 
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <RHFSelect 
                            name="medicalState" 
                            label="State" 
                            options={stateOptions}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <RHFTextField 
                            name="medicalZipCode" 
                            label="Zip Code" 
                          />
                        </Box>
                      </Stack>
                    </Stack>
                  </Box>


                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>


                  {/* Spouse Personal Information Card - Conditional */}
                  {spouseSelected && (
              <Card variant="outlined" sx={commonStyles.coverageCard}>
                <CardContent>
                  <Stack spacing={2}>
                    {/* Section Header */}
                    <Box>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={commonStyles.iconCircle}>
                          <People color="primary" />
                        </Box>
                        <Typography variant="h6">
                          Spouse Personal Information
                        </Typography>
                      </Stack>
                    </Box>
                    
                    <Stack spacing={3}>
                      {/* Height and Weight */}
                      <RHFTextField 
                        name="spouseHeightFt" 
                        label="Height (ft.)" 
                        placeholder="5'6&quot;" 
                      />
                      <RHFTextField 
                        name="spouseWeight" 
                        label="Weight (lbs.)" 
                        type="number" 
                        placeholder="140"
                      />

                      {/* Weight 12 Months Ago */}
                      <RHFTextField 
                        name="spouseWeight12MonthsAgo" 
                        label="Weight 12 Mo. Ago (lbs.)" 
                        type="number" 
                        placeholder="138"
                      />

                      {/* Social Security Number */}
                      <RHFTextField 
                        name="spouseSsn" 
                        label="Social Security Number" 
                        placeholder="xxx-xx-xxxx" 
                      />

                      {/* Driver's License Question */}
                      <RHFRadioGroup
                        name="spouseHasDriversLicense"
                        label="Do you have a valid driver's license?"
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" }
                        ]}
                      />

                      {/* Driver's License Details (conditional) */}
                      {spouseHasDriversLicense === "yes" && (
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                          <Box sx={{ flex: 2 }}>
                            <RHFTextField 
                              name="spouseDriversLicenseNumber" 
                              label="Driver's License Number" 
                              placeholder="S1234567"
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <RHFSelect 
                              name="spouseDriversLicenseState" 
                              label="State" 
                              options={stateOptions}
                            />
                          </Box>
                        </Stack>
                      )}

                      {/* Residency Questions - Conditional based on coverage */}
                      {hasNonQuickDecisionProduct && (
                        <>
                          <RHFRadioGroup
                            name="spouseResidencyIntentOutsideUS"
                            label="Do you intend to reside outside the U.S. or Canada in the next 12 months?"
                            options={[
                              { label: "Yes", value: "yes" },
                              { label: "No", value: "no" }
                            ]}
                          />

                          {spouseResidencyIntentOutsideUS === "yes" && (
                            <Stack spacing={2}>
                              <RHFTextField 
                                name="spouseResidencyDurationMonths" 
                                label="How Long (months)" 
                                type="number"
                              />
                              <RHFSelect 
                                name="spouseResidencyCountry" 
                                label="Country" 
                                options={countryOptions}
                              />
                            </Stack>
                          )}
                        </>
                      )}

                      {hasQuickDecisionProduct && (
                        <>
                          <RHFRadioGroup
                            name="spouseResidencyIntentSixMonths"
                            label="Do you intend to reside outside the U.S. or Canada for more than six months?"
                            options={[
                              { label: "Yes", value: "yes" },
                              { label: "No", value: "no" }
                            ]}
                          />

                          {spouseResidencyIntentSixMonths === "yes" && (
                            <RHFSelect 
                              name="spouseResidencySixMonthsCountry" 
                              label="Country" 
                              options={countryOptions}
                            />
                          )}
                        </>
                      )}

                      {/* Spouse Health Care Information Subsection */}
                      <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          Health Care Information (optional)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Providing your spouse's physician's details will speed up processing your application by allowing us to confirm any health information, if needed.
                        </Typography>
                        
                        <Stack spacing={2}>
                          {/* Physician Name Row */}
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <RHFTextField 
                              name="spousePhysicianFirstName" 
                              label="Physician First Name" 
                            />
                            <RHFTextField 
                              name="spousePhysicianLastName" 
                              label="Physician Last Name" 
                            />
                          </Stack>

                          {/* Phone and Facility */}
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <RHFTextField 
                              name="spousePhysicianPhoneNumber" 
                              label="Physician Phone Number" 
                              type="tel"
                            />
                            <RHFTextField 
                              name="spouseMedicalFacilityName" 
                              label="Name of Medical Facility" 
                            />
                          </Stack>

                          {/* Address Row */}
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <Box sx={{ flex: 2 }}>
                              <RHFTextField 
                                name="spouseMedicalStreetAddress" 
                                label="Street Address" 
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <RHFTextField 
                                name="spouseMedicalAptSuite" 
                                label="Apt/Suite" 
                              />
                            </Box>
                          </Stack>

                          {/* City, State, Zip Row */}
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <Box sx={{ flex: 2 }}>
                              <RHFTextField 
                                name="spouseMedicalCity" 
                                label="City" 
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <RHFSelect 
                                name="spouseMedicalState" 
                                label="State" 
                                options={stateOptions}
                              />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <RHFTextField 
                                name="spouseMedicalZipCode" 
                                label="Zip Code" 
                              />
                            </Box>
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )}
                </Stack>
              </CardContent>
            </Card>

            {/* Financial Information Card - Only show if self applies for disability with high coverage */}
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Category Header */}
                  <Box sx={commonStyles.coverageCategoryHeader}>
                    <Typography variant="h4" sx={commonStyles.coverageCategoryTitle}>
                      Financial Information
                    </Typography>
                  </Box>

                  {/* Your Financial Information Card */}
                  <Card variant="outlined" sx={commonStyles.coverageCard}>
                    <CardContent>
                      <Stack spacing={2}>
                        {/* Section Header */}
                        <Box>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={commonStyles.iconCircle}>
                              <Person color="primary" />
                            </Box>
                            <Typography variant="h6">
                              Your Financial Information
                            </Typography>
                          </Stack>
                        </Box>

                        <Stack spacing={3}>
                          {/* Total Net Worth */}
                          <Box>
                            <FormLabel required>
                              Total net worth (Liquid Assets minus Liabilities)
                            </FormLabel>
                            <RHFCurrencyField 
                              name="totalNetWorth" 
                              required 
                              fullWidth
                            />
                          </Box>

                          {/* Total Annual Unearned Income */}
                          <Box>
                            <FormLabel required>
                              Total annual unearned income (As reported to IRS – e.g. Interest, Dividends, Royalties, Rental Income etc.)
                            </FormLabel>
                            <RHFCurrencyField 
                              name="totalAnnualUnearnedIncome" 
                              required 
                              fullWidth
                            />
                          </Box>

                          {/* Self-Employed Question */}
                          <RHFRadioGroup
                            name="isSelfEmployed"
                            label="Are you self-employed?"
                            options={[
                              { label: "Yes", value: "yes" },
                              { label: "No", value: "no" }
                            ]}
                            required
                          />

                          {/* Self-Employment Sections - Only show if self-employed */}
                          {methods.watch('isSelfEmployed') === 'yes' && (
                            <>
                              {/* Sources of Income */}
                              <Box>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                  Complete all sources of income:
                                </Typography>
                                
                                <Stack spacing={2}>
                                  <RHFCheckbox 
                                    name="isSoleProprietor" 
                                    label="Sole proprietor or partner"
                                  />
                                  
                                  <RHFCheckbox 
                                    name="isProfessionalCorp" 
                                    label="Professional corporation"
                                  />
                                </Stack>
                              </Box>

                              {/* Sole Proprietor or Partner Section */}
                              {methods.watch('isSoleProprietor') && (
                                <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    Sole Proprietor or Partner
                                  </Typography>
                                  
                                  <Stack spacing={2}>
                                    <Box>
                                      <FormLabel required>
                                        Gross earned income (share of partnership income) Past 12 months or fiscal year ending
                                      </FormLabel>
                                      <RHFCurrencyField 
                                        name="soleProprietorGrossIncome" 
                                        required 
                                        fullWidth
                                      />
                                    </Box>
                                    
                                    <Box>
                                      <FormLabel required>
                                        Gross earnings before business expenses and taxes
                                      </FormLabel>
                                      <RHFCurrencyField 
                                        name="soleProprietorGrossEarnings" 
                                        required 
                                        fullWidth
                                      />
                                    </Box>
                                    
                                    <Box>
                                      <FormLabel required>
                                        Total business expenses for above period (your share)
                                      </FormLabel>
                                      <RHFCurrencyField 
                                        name="soleProprietorBusinessExpenses" 
                                        required 
                                        fullWidth
                                      />
                                    </Box>
                                    
                                    {/* Calculated Net Earned Income */}
                                    <Box>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                                        Net earned income, before personal income tax:*
                                      </Typography>
                                      <Typography variant="h6" color="primary">
                                        ${(() => {
                                          const grossEarnings = parseFloat(methods.watch('soleProprietorGrossEarnings') || '0');
                                          const businessExpenses = parseFloat(methods.watch('soleProprietorBusinessExpenses') || '0');
                                          return Math.max(0, grossEarnings - businessExpenses).toFixed(2);
                                        })()}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Box>
                              )}

                              {/* Professional Corporation Section */}
                              {methods.watch('isProfessionalCorp') && (
                                <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    Professional Corporation
                                  </Typography>
                                  
                                  <Stack spacing={2}>
                                    <Box>
                                      <FormLabel required>
                                        Annual salary drawn currently
                                      </FormLabel>
                                      <RHFCurrencyField 
                                        name="professionalCorpAnnualSalary" 
                                        required 
                                        fullWidth
                                      />
                                    </Box>
                                    
                                    <Box>
                                      <FormLabel required>
                                        Your share of S-Corp distribution, if any
                                      </FormLabel>
                                      <RHFCurrencyField 
                                        name="professionalCorpSCorpDistribution" 
                                        required 
                                        fullWidth
                                      />
                                    </Box>
                                    
                                    <Box>
                                      <FormLabel required>
                                        Your share of dividends
                                      </FormLabel>
                                      <RHFCurrencyField 
                                        name="professionalCorpDividends" 
                                        required 
                                        fullWidth
                                      />
                                    </Box>
                                    
                                    <Box>
                                      <FormLabel required>
                                        Payment of bonus
                                      </FormLabel>
                                      <RHFCurrencyField 
                                        name="professionalCorpBonus" 
                                        required 
                                        fullWidth
                                      />
                                    </Box>
                                    
                                    <RHFRadioGroup
                                      name="professionalCorpBonusType"
                                      label="Was bonus a"
                                      options={[
                                        { label: "Annual payment", value: "annual" },
                                        { label: "One-time payment", value: "onetime" }
                                      ]}
                                      required
                                    />
                                    
                                    <Box>
                                      <FormLabel required>
                                        Payment of commission
                                      </FormLabel>
                                      <RHFCurrencyField 
                                        name="professionalCorpCommission" 
                                        required 
                                        fullWidth
                                      />
                                    </Box>
                                    
                                    <RHFRadioGroup
                                      name="professionalCorpCommissionType"
                                      label="Was the commission a"
                                      options={[
                                        { label: "Annual payment", value: "annual" },
                                        { label: "One-time payment", value: "onetime" }
                                      ]}
                                      required
                                    />
                                    
                                    <Box>
                                      <FormLabel required>
                                        Annual Cost of corporate-paid benefits (e.g. Life or Health Insurance premiums, pension or profit sharing trust contributions paid on your behalf)
                                      </FormLabel>
                                      <RHFCurrencyField 
                                        name="professionalCorpBenefitsCost" 
                                        required 
                                        fullWidth
                                      />
                                    </Box>
                                    
                                    {/* Calculated Total Annual Earned Income */}
                                    <Box>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                                        Total annual earned income:*
                                      </Typography>
                                      <Typography variant="h6" color="primary">
                                        ${(() => {
                                          const salary = parseFloat(methods.watch('professionalCorpAnnualSalary') || '0');
                                          const distribution = parseFloat(methods.watch('professionalCorpSCorpDistribution') || '0');
                                          const dividends = parseFloat(methods.watch('professionalCorpDividends') || '0');
                                          const bonus = parseFloat(methods.watch('professionalCorpBonus') || '0');
                                          const commission = parseFloat(methods.watch('professionalCorpCommission') || '0');
                                          const benefits = parseFloat(methods.watch('professionalCorpBenefitsCost') || '0');
                                          return (salary + distribution + dividends + bonus + commission + benefits).toFixed(2);
                                        })()}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Box>
                              )}

                              {/* Self-Employment Details */}
                              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                  Self-Employment Details
                                </Typography>
                                
                                <Stack spacing={2}>
                                  <Box>
                                    <FormLabel required>
                                      How long have you been self-employed?
                                    </FormLabel>
                                    <RHFTextField 
                                      name="selfEmploymentDuration" 
                                      required 
                                    />
                                  </Box>
                                  
                                  <RHFRadioGroup
                                    name="isWorkingFromHome"
                                    label="Are you working out of your home?"
                                    options={[
                                      { label: "Yes", value: "yes" },
                                      { label: "No", value: "no" }
                                    ]}
                                    required
                                  />
                                  
                                  {methods.watch('isWorkingFromHome') === 'yes' && (
                                    <>
                                      <RHFRadioGroup
                                        name="hasWorkOutsideHome"
                                        label='If "Yes", is any work conducted outside of the home?'
                                        options={[
                                          { label: "Yes", value: "yes" },
                                          { label: "No", value: "no" }
                                        ]}
                                        required
                                      />
                                      
                                      <Box>
                                        <FormLabel required>
                                          Please explain and/or provide details including average number of days per week clients are seen
                                        </FormLabel>
                                        <RHFTextField 
                                          name="workDetailsExplanation" 
                                          multiline
                                          rows={3}
                                          required 
                                          fullWidth
                                        />
                                      </Box>
                                    </>
                                  )}
                                </Stack>
                              </Box>
                            </>
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </CardContent>
            </Card>

            {/* Main Other Coverage Card */}
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Category Header */}
                  <Box sx={commonStyles.coverageCategoryHeader}>
                    <Typography variant="h4" sx={commonStyles.coverageCategoryTitle}>
                      Other Coverage
                    </Typography>
                  </Box>

                  <Alert severity="info">
                    Please indicate if you currently hold an active insurance policy with any carrier, including through your employer. Other insurance you have today can impact the amount of coverage you may be approved for.
                  </Alert>

                  {/* Your Other Coverage Card */}
                  <Card variant="outlined" sx={commonStyles.coverageCard}>
                    <CardContent>
                      <Stack spacing={2}>
                        {/* Section Header */}
                        <Box>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={commonStyles.iconCircle}>
                              <Person color="primary" />
                            </Box>
                            <Typography variant="h6">
                              Your Other Coverage
                            </Typography>
                          </Stack>
                        </Box>

                        <Stack spacing={3}>
                          {/* Group Life Insurance Section */}
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Group Life Insurance
                            </Typography>
                            
                            <Stack spacing={2}>
                              <RHFRadioGroup
                                name="hasOtherLifeInsurance"
                                label="Do you have other life insurance in force?"
                                options={[
                                  { label: "Yes", value: "yes" },
                                  { label: "No", value: "no" }
                                ]}
                                required
                              />

                              <RHFRadioGroup
                                name="hasLifeInsurancePending"
                                label="Do you have other life insurance applications pending?"
                                options={[
                                  { label: "Yes", value: "yes" },
                                  { label: "No", value: "no" }
                                ]}
                                required
                              />

                              {/* Conditional fields - only show if has other life insurance */}
                              {methods.watch('hasOtherLifeInsurance') === 'yes' && (
                                <>
                                  <Box>
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                      What is the total amount in all companies? <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                                    </Typography>
                                    <RHFCurrencyField 
                                      name="otherLifeInsuranceAmount" 
                                      required 
                                      fullWidth
                                    />
                                  </Box>

                                  <RHFRadioGroup
                                    name="lifeInsuranceReplacement"
                                    label="Is the life insurance applied for intended to replace, discontinue or change an existing life insurance policy or annuity contract?"
                                    options={[
                                      { label: "Yes", value: "yes" },
                                      { label: "No", value: "no" }
                                    ]}
                                    required
                                  />
                                </>
                              )}

                              {/* Conditional fields - only show if has pending applications */}
                              {methods.watch('hasLifeInsurancePending') === 'yes' && (
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                  <RHFCurrencyField 
                                    name="pendingLifeInsuranceAmount" 
                                    label="Amount"
                                    required 
                                  />
                                  <RHFTextField 
                                    name="pendingLifeInsuranceCompany" 
                                    label="Company"
                                    placeholder="Company name"
                                    required 
                                  />
                                </Stack>
                              )}
                            </Stack>
                          </Box>

                          {/* Group Disability Insurance Section */}
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Group Disability Insurance
                            </Typography>
                            
                            <Stack spacing={2}>
                              <RHFRadioGroup
                                name="hasDisabilityInsurance"
                                label="Do you now have or are you now applying for any other insurance which provides benefits if you are unable to work because of a disability?"
                                options={[
                                  { label: "Yes", value: "yes" },
                                  { label: "No", value: "no" }
                                ]}
                                required
                              />

                              {/* Conditional fields - only show if has disability insurance */}
                              {methods.watch('hasDisabilityInsurance') === 'yes' && (
                                <>
                                  <Alert severity="info">
                                    Please indicate company name, monthly benefit amount, benefit period, and waiting period below.
                                  </Alert>

                                  {methods.watch("disabilityCompanies")?.map((_, index) => (
                                    <Box
                                      key={index}
                                      sx={{
                                        p: 2,
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1
                                      }}
                                    >
                                      <Stack spacing={2}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            Company {index + 1}
                                          </Typography>
                                          {(methods.watch("disabilityCompanies")?.length || 0) > 1 && (
                                            <Button
                                              size="small"
                                              color="error"
                                              onClick={() => {
                                                const currentCompanies = methods.getValues("disabilityCompanies") || [];
                                                methods.setValue("disabilityCompanies", currentCompanies.filter((_, i) => i !== index));
                                              }}
                                            >
                                              Remove
                                            </Button>
                                          )}
                                        </Stack>
                                        
                                        <RHFTextField 
                                          name={`disabilityCompanies.${index}.company`} 
                                          label="Company"
                                          placeholder="Company name"
                                          required 
                                        />
                                        
                                        <Box>
                                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                            Monthly Benefit Amount <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                                          </Typography>
                                          <RHFCurrencyField 
                                            name={`disabilityCompanies.${index}.monthlyBenefit`} 
                                            required 
                                            fullWidth
                                            helperText="You can find your current coverage amount in your recent statement from your carrier."
                                          />
                                        </Box>
                                        
                                        <RHFSelect 
                                          name={`disabilityCompanies.${index}.benefitPeriod`} 
                                          label="Benefit Period"
                                          options={[
                                            { label: "2 Years", value: "2years" },
                                            { label: "5 Years", value: "5years" },
                                            { label: "To Age 65", value: "age65" },
                                            { label: "To Age 67", value: "age67" },
                                            { label: "Lifetime", value: "lifetime" }
                                          ]}
                                          required 
                                        />
                                        
                                        <RHFSelect 
                                          name={`disabilityCompanies.${index}.waitingPeriod`} 
                                          label="Waiting Period"
                                          options={[
                                            { label: "0 Days", value: "0days" },
                                            { label: "30 Days", value: "30days" },
                                            { label: "60 Days", value: "60days" },
                                            { label: "90 Days", value: "90days" },
                                            { label: "180 Days", value: "180days" },
                                            { label: "365 Days", value: "365days" }
                                          ]}
                                          required 
                                        />
                                      </Stack>
                                    </Box>
                                  ))}

                                  <Button
                                    variant="outlined"
                                    onClick={() => {
                                      const currentCompanies = methods.getValues("disabilityCompanies") || [];
                                      methods.setValue("disabilityCompanies", [...currentCompanies, { company: "", monthlyBenefit: "", benefitPeriod: "", waitingPeriod: "" }]);
                                    }}
                                    sx={{ alignSelf: 'flex-start' }}
                                  >
                                    Add Another Company
                                  </Button>

                                  <RHFRadioGroup
                                    name="disabilityReplacement"
                                    label="Will this disability coverage replace any other company's coverage?"
                                    options={[
                                      { label: "Yes", value: "yes" },
                                      { label: "No", value: "no" }
                                    ]}
                                    required
                                  />

                                  {methods.watch('disabilityReplacement') === 'yes' && (
                                    <Box>
                                      <FormLabel required>
                                        How much will be replaced?
                                      </FormLabel>
                                      <RHFCurrencyField 
                                        name="disabilityReplacementAmount" 
                                        required 
                                        fullWidth
                                      />
                                    </Box>
                                  )}
                                </>
                              )}
                            </Stack>
                          </Box>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Spouse Other Coverage Card - Conditional */}
                  {spouseSelected && (
                    <Card variant="outlined" sx={commonStyles.coverageCard}>
                      <CardContent>
                        <Stack spacing={2}>
                          {/* Section Header */}
                          <Box>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box sx={commonStyles.iconCircle}>
                                <People color="primary" />
                              </Box>
                              <Typography variant="h6">
                                Spouse Other Coverage
                              </Typography>
                            </Stack>
                          </Box>

                          <Stack spacing={3}>
                            {/* Spouse Group Life Insurance Section */}
                            <Box>
                              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                Group Life Insurance
                              </Typography>
                              
                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="spouseHasOtherLifeInsurance"
                                  label="Does your spouse have other life insurance in force?"
                                  options={[
                                    { label: "Yes", value: "yes" },
                                    { label: "No", value: "no" }
                                  ]}
                                />

                                <RHFRadioGroup
                                  name="spouseHasLifeInsurancePending"
                                  label="Does your spouse have other life insurance applications pending?"
                                  options={[
                                    { label: "Yes", value: "yes" },
                                    { label: "No", value: "no" }
                                  ]}
                                />

                                {/* Conditional fields - only show if spouse has other life insurance */}
                                {methods.watch('spouseHasOtherLifeInsurance') === 'yes' && (
                                  <>
                                    <Box>
                                      <FormLabel required>
                                        What is the total amount in all companies?
                                      </FormLabel>
                                      <RHFCurrencyField 
                                        name="spouseOtherLifeInsuranceAmount" 
                                      />
                                    </Box>

                                    <RHFRadioGroup
                                      name="spouseLifeInsuranceReplacement"
                                      label="Is the life insurance applied for intended to replace, discontinue or change an existing life insurance policy or annuity contract?"
                                      options={[
                                        { label: "Yes", value: "yes" },
                                        { label: "No", value: "no" }
                                      ]}
                                    />
                                  </>
                                )}

                                {/* Conditional fields - only show if spouse has pending applications */}
                                {methods.watch('spouseHasLifeInsurancePending') === 'yes' && (
                                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                    <RHFCurrencyField 
                                      name="spousePendingLifeInsuranceAmount" 
                                      label="Amount"
                                    />
                                    <RHFTextField 
                                      name="spousePendingLifeInsuranceCompany" 
                                      label="Company"
                                      placeholder="Company name"
                                    />
                                  </Stack>
                                )}
                              </Stack>
                            </Box>

                            {/* Spouse Group Disability Insurance Section */}
                            <Box>
                              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                Group Disability Insurance
                              </Typography>
                              
                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="spouseHasDisabilityInsurance"
                                  label="Does your spouse now have or are they now applying for any other insurance which provides benefits if they are unable to work because of a disability?"
                                  options={[
                                    { label: "Yes", value: "yes" },
                                    { label: "No", value: "no" }
                                  ]}
                                />

                                {/* Conditional fields - only show if spouse has disability insurance */}
                                {methods.watch('spouseHasDisabilityInsurance') === 'yes' && (
                                  <>
                                    <Alert severity="info">
                                      Please indicate company name, monthly benefit amount, benefit period, and waiting period below.
                                    </Alert>

                                    {methods.watch("spouseDisabilityCompanies")?.map((_, index) => (
                                      <Box
                                        key={index}
                                        sx={{
                                          p: 2,
                                          border: 1,
                                          borderColor: 'divider',
                                          borderRadius: 1
                                        }}
                                      >
                                        <Stack spacing={2}>
                                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                              Company {index + 1}
                                            </Typography>
                                            {(methods.watch("spouseDisabilityCompanies")?.length || 0) > 1 && (
                                              <Button
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                  const currentCompanies = methods.getValues("spouseDisabilityCompanies") || [];
                                                  methods.setValue("spouseDisabilityCompanies", currentCompanies.filter((_, i) => i !== index));
                                                }}
                                              >
                                                Remove
                                              </Button>
                                            )}
                                          </Stack>
                                          
                                          <RHFTextField 
                                            name={`spouseDisabilityCompanies.${index}.company`} 
                                            label="Company"
                                            placeholder="Company name"
                                          />
                                          
                                          <Box>
                                            <FormLabel required>
                                              Monthly Benefit Amount
                                            </FormLabel>
                                            <RHFCurrencyField 
                                              name={`spouseDisabilityCompanies.${index}.monthlyBenefit`} 
                                              helperText="You can find your current coverage amount in your recent statement from your carrier."
                                            />
                                          </Box>
                                          
                                          <RHFSelect 
                                            name={`spouseDisabilityCompanies.${index}.benefitPeriod`} 
                                            label="Benefit Period"
                                            options={[
                                              { label: "2 Years", value: "2years" },
                                              { label: "5 Years", value: "5years" },
                                              { label: "To Age 65", value: "age65" },
                                              { label: "To Age 67", value: "age67" },
                                              { label: "Lifetime", value: "lifetime" }
                                            ]}
                                          />
                                          
                                          <RHFSelect 
                                            name={`spouseDisabilityCompanies.${index}.waitingPeriod`} 
                                            label="Waiting Period"
                                            options={[
                                              { label: "0 Days", value: "0days" },
                                              { label: "30 Days", value: "30days" },
                                              { label: "60 Days", value: "60days" },
                                              { label: "90 Days", value: "90days" },
                                              { label: "180 Days", value: "180days" },
                                              { label: "365 Days", value: "365days" }
                                            ]}
                                          />
                                        </Stack>
                                      </Box>
                                    ))}

                                    <Button
                                      variant="outlined"
                                      onClick={() => {
                                        const currentCompanies = methods.getValues("spouseDisabilityCompanies") || [];
                                        methods.setValue("spouseDisabilityCompanies", [...currentCompanies, { company: "", monthlyBenefit: "", benefitPeriod: "", waitingPeriod: "" }]);
                                      }}
                                      sx={{ alignSelf: 'flex-start' }}
                                    >
                                      Add Another Company
                                    </Button>

                                    <RHFRadioGroup
                                      name="spouseDisabilityReplacement"
                                      label="Will this disability coverage replace any other company's coverage?"
                                      options={[
                                        { label: "Yes", value: "yes" },
                                        { label: "No", value: "no" }
                                      ]}
                                    />

                                    {methods.watch('spouseDisabilityReplacement') === 'yes' && (
                                      <Box>
                                        <FormLabel required>
                                          How much will be replaced?
                                        </FormLabel>
                                        <RHFCurrencyField 
                                          name="spouseDisabilityReplacementAmount" 
                                        />
                                      </Box>
                                    )}
                                  </>
                                )}
                              </Stack>
                            </Box>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          {/* Main Beneficiary Information Card */}
          <Card sx={commonStyles.categoryCard}>
            <CardContent>
              <Stack spacing={2}>
                {/* Category Header */}
                <Box sx={commonStyles.coverageCategoryHeader}>
                  <Typography variant="h4" sx={commonStyles.coverageCategoryTitle}>
                    Beneficiary Information
                  </Typography>
                </Box>

                <Alert severity="info">
                  A beneficiary can be a person or a trust. If naming more than one person as beneficiary, the percentage of death proceeds to be distributed to each must total 100%. If naming a trust as beneficiary, 100% of proceeds will be paid to the trust.
                  A primary beneficiary is a designated individual who would receive the proceeds of the policy first. A contingent beneficiary is a designated individual who would receive the proceeds of the policy if the primary beneficiary is unable to receive them.
                  You may add up to ten primary and ten contingent beneficiaries online. If no beneficiary is named, proceeds will be paid in accord with policy provisions. If you wish to add beneficiary information at a later time, or need to add more, please contact the plan administrator at (800) 621-8981.
                  Note: The beneficiary for dependent Child(ren) coverage is the Member.
                </Alert>

                <RHFRadioGroup
                  name="wantsToBeneficiaries"
                  label="Do you want to add beneficiary(ies)?"
                  options={[
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" }
                  ]}
                  required
                />

                {wantsToBeneficiaries === "yes" && (
                  <>
                    {/* Your Beneficiary Card */}
                    <Card variant="outlined" sx={commonStyles.coverageCard}>
                      <CardContent>
                        <Stack spacing={2}>
                          {/* Section Header */}
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Person color="primary" />
                              <Typography variant="h6">
                                Your Beneficiary
                              </Typography>
                            </Stack>
                          </Box>

                          <Stack spacing={3}>
                            {/* Term Life Insurance Section */}
                            <Box>
                              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                Term Life Insurance
                              </Typography>
                              
                              <Alert severity="info" sx={{ mb: 2 }}>
                                I make the following beneficiary designation with respect to all life insurance under this insurance plan and, if I am already covered under the plan, I hereby revoke any prior beneficiary designation.
                              </Alert>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="termLifeBeneficiaryType"
                                  label="Choose Beneficiary"
                                  options={[
                                    { label: "Individual", value: "individual" },
                                    { label: "Trust", value: "trust" }
                                  ]}
                                  required
                                />

                                {termLifeBeneficiaryType && (
                                  <>
                                    <RHFRadioGroup
                                      name="termLifeBeneficiaryDesignation"
                                      label="Beneficiary Type"
                                      options={[
                                        { label: "Primary", value: "primary" },
                                        { label: "Contingent", value: "contingent" }
                                      ]}
                                      required
                                    />

                                    {termLifeBeneficiaryType === "individual" && (
                                      <Stack spacing={2}>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                          <RHFTextField 
                                            name="termLifeBeneficiaryFirstName" 
                                            label="First Name" 
                                            required
                                          />
                                          <RHFTextField 
                                            name="termLifeBeneficiaryLastName" 
                                            label="Last Name" 
                                            required
                                          />
                                        </Stack>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                          <RHFSelect 
                                            name="termLifeBeneficiaryRelationship" 
                                            label="Relationship" 
                                            options={relationshipOptions}
                                            required
                                          />
                                          <RHFTextField 
                                            name="termLifeBeneficiaryShare" 
                                            label="% Share" 
                                            type="number"
                                            required
                                          />
                                        </Stack>
                                      </Stack>
                                    )}

                                    {termLifeBeneficiaryType === "trust" && (
                                      <Stack spacing={2}>
                                        <RHFTextField 
                                          name="termLifeTrustName" 
                                          label="Name of Trust" 
                                          required
                                        />
                                        <RHFTextField 
                                          name="termLifeTrustDate" 
                                          label="Date of Trust (mm/dd/yyyy)" 
                                          placeholder="mm/dd/yyyy"
                                          required
                                        />
                                      </Stack>
                                    )}
                                  </>
                                )}
                              </Stack>
                            </Box>

                            {/* 10-Year Level Term Life Insurance Section */}
                            <Box>
                              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                10-Year Level Term Life Insurance
                              </Typography>
                              
                              <Alert severity="info" sx={{ mb: 2 }}>
                                I make the following beneficiary designation with respect to new insurance issued on the basis of this application. If you currently have insurance and wish to change your beneficiary, contact the Plan Administrator for the proper form.
                              </Alert>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="tenYearTermBeneficiaryType"
                                  label="Choose Beneficiary"
                                  options={[
                                    { label: "Individual", value: "individual" },
                                    { label: "Trust", value: "trust" }
                                  ]}
                                  required
                                />

                                {tenYearTermBeneficiaryType && (
                                  <>
                                    <RHFRadioGroup
                                      name="tenYearTermBeneficiaryDesignation"
                                      label="Beneficiary Type"
                                      options={[
                                        { label: "Primary", value: "primary" },
                                        { label: "Contingent", value: "contingent" }
                                      ]}
                                      required
                                    />

                                    {tenYearTermBeneficiaryType === "individual" && (
                                      <Stack spacing={2}>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                          <RHFTextField 
                                            name="tenYearTermBeneficiaryFirstName" 
                                            label="First Name" 
                                            required
                                          />
                                          <RHFTextField 
                                            name="tenYearTermBeneficiaryLastName" 
                                            label="Last Name" 
                                            required
                                          />
                                        </Stack>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                          <RHFSelect 
                                            name="tenYearTermBeneficiaryRelationship" 
                                            label="Relationship" 
                                            options={relationshipOptions}
                                            required
                                          />
                                          <RHFTextField 
                                            name="tenYearTermBeneficiaryShare" 
                                            label="% Share" 
                                            type="number"
                                            required
                                          />
                                        </Stack>
                                      </Stack>
                                    )}

                                    {tenYearTermBeneficiaryType === "trust" && (
                                      <Stack spacing={2}>
                                        <RHFTextField 
                                          name="tenYearTermTrustName" 
                                          label="Name of Trust" 
                                          required
                                        />
                                        <RHFTextField 
                                          name="tenYearTermTrustDate" 
                                          label="Date of Trust (mm/dd/yyyy)" 
                                          placeholder="mm/dd/yyyy"
                                          required
                                        />
                                      </Stack>
                                    )}
                                  </>
                                )}
                              </Stack>
                            </Box>

                            {/* 20-Year Level Term Life Insurance Section */}
                            <Box>
                              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                20-Year Level Term Life Insurance
                              </Typography>
                              
                              <Alert severity="info" sx={{ mb: 2 }}>
                                I make the following beneficiary designation with respect to new insurance issued on the basis of this application. If you currently have insurance and wish to change your beneficiary, contact the Plan Administrator for the proper form.
                              </Alert>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="twentyYearTermBeneficiaryType"
                                  label="Choose Beneficiary"
                                  options={[
                                    { label: "Individual", value: "individual" },
                                    { label: "Trust", value: "trust" }
                                  ]}
                                  required
                                />

                                {twentyYearTermBeneficiaryType && (
                                  <>
                                    <RHFRadioGroup
                                      name="twentyYearTermBeneficiaryDesignation"
                                      label="Beneficiary Type"
                                      options={[
                                        { label: "Primary", value: "primary" },
                                        { label: "Contingent", value: "contingent" }
                                      ]}
                                      required
                                    />

                                    {twentyYearTermBeneficiaryType === "individual" && (
                                      <Stack spacing={2}>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                          <RHFTextField 
                                            name="twentyYearTermBeneficiaryFirstName" 
                                            label="First Name" 
                                            required
                                          />
                                          <RHFTextField 
                                            name="twentyYearTermBeneficiaryLastName" 
                                            label="Last Name" 
                                            required
                                          />
                                        </Stack>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                          <RHFSelect 
                                            name="twentyYearTermBeneficiaryRelationship" 
                                            label="Relationship" 
                                            options={relationshipOptions}
                                            required
                                          />
                                          <RHFTextField 
                                            name="twentyYearTermBeneficiaryShare" 
                                            label="% Share" 
                                            type="number"
                                            required
                                          />
                                        </Stack>
                                      </Stack>
                                    )}

                                    {twentyYearTermBeneficiaryType === "trust" && (
                                      <Stack spacing={2}>
                                        <RHFTextField 
                                          name="twentyYearTermTrustName" 
                                          label="Name of Trust" 
                                          required
                                        />
                                        <RHFTextField 
                                          name="twentyYearTermTrustDate" 
                                          label="Date of Trust (mm/dd/yyyy)" 
                                          placeholder="mm/dd/yyyy"
                                          required
                                        />
                                      </Stack>
                                    )}
                                  </>
                                )}
                              </Stack>
                            </Box>

                            {/* Accidental Death and Dismemberment Insurance Section */}
                            <Box>
                              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                Accidental Death and Dismemberment Insurance
                              </Typography>
                              
                              <Alert severity="info" sx={{ mb: 2 }}>
                                I make the following beneficiary designation with respect to all life insurance under this insurance plan and, if I am already covered under the plan, I hereby revoke any prior beneficiary designation.
                              </Alert>

                              <Stack spacing={2}>
                                <RHFRadioGroup
                                  name="addBeneficiaryType"
                                  label="Choose Beneficiary"
                                  options={[
                                    { label: "Individual", value: "individual" },
                                    { label: "Trust", value: "trust" }
                                  ]}
                                  required
                                />

                                {addBeneficiaryType && (
                                  <RHFRadioGroup
                                    name="addBeneficiaryDesignation"
                                    label="Beneficiary Type"
                                    options={[
                                      { label: "Primary", value: "primary" },
                                      { label: "Contingent", value: "contingent" }
                                    ]}
                                    required
                                  />
                                )}

                                {addBeneficiaryType === "individual" && (
                                  <Stack spacing={2}>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                      <RHFTextField 
                                        name="addBeneficiaryFirstName" 
                                        label="First Name" 
                                        required
                                      />
                                      <RHFTextField 
                                        name="addBeneficiaryLastName" 
                                        label="Last Name" 
                                        required
                                      />
                                    </Stack>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                      <RHFSelect 
                                        name="addBeneficiaryRelationship" 
                                        label="Relationship" 
                                        options={relationshipOptions}
                                        required
                                      />
                                      <RHFTextField 
                                        name="addBeneficiaryShare" 
                                        label="% Share" 
                                        type="number"
                                        required
                                      />
                                    </Stack>
                                  </Stack>
                                )}

                                {addBeneficiaryType === "trust" && (
                                  <Stack spacing={2}>
                                    <RHFTextField 
                                      name="addTrustName" 
                                      label="Name of Trust" 
                                      required
                                    />
                                    <RHFTextField 
                                      name="addTrustDate" 
                                      label="Date of Trust (mm/dd/yyyy)" 
                                      placeholder="mm/dd/yyyy"
                                      required
                                    />
                                  </Stack>
                                )}
                              </Stack>
                            </Box>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Spouse Beneficiary Card - Conditional */}
                    {spouseSelected && (
                      <Card variant="outlined" sx={commonStyles.coverageCard}>
                        <CardContent>
                          <Stack spacing={2}>
                            {/* Section Header */}
                            <Box>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <People color="primary" />
                                <Typography variant="h6">
                                  Spouse Beneficiary
                                </Typography>
                              </Stack>
                            </Box>

                            <Stack spacing={3}>
                                {/* Spouse Term Life Insurance Section */}
                                <Box>
                                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    Term Life Insurance
                                  </Typography>
                                  
                                  <Alert severity="info" sx={{ mb: 2 }}>
                                    I make the following beneficiary designation with respect to all life insurance under this insurance plan and, if I am already covered under the plan, I hereby revoke any prior beneficiary designation.
                                  </Alert>

                                  <Stack spacing={2}>
                                    <RHFRadioGroup
                                      name="spouseTermLifeBeneficiaryType"
                                      label="Choose Beneficiary"
                                      options={[
                                        { label: "Individual", value: "individual" },
                                        { label: "Trust", value: "trust" }
                                      ]}
                                    />

                                    {spouseTermLifeBeneficiaryType && (
                                      <>
                                        <RHFRadioGroup
                                          name="spouseTermLifeBeneficiaryDesignation"
                                          label="Beneficiary Type"
                                          options={[
                                            { label: "Primary", value: "primary" },
                                            { label: "Contingent", value: "contingent" }
                                          ]}
                                        />

                                        {spouseTermLifeBeneficiaryType === "individual" && (
                                          <Stack spacing={2}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                              <RHFTextField 
                                                name="spouseTermLifeBeneficiaryFirstName" 
                                                label="First Name" 
                                              />
                                              <RHFTextField 
                                                name="spouseTermLifeBeneficiaryLastName" 
                                                label="Last Name" 
                                              />
                                            </Stack>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                              <RHFSelect 
                                                name="spouseTermLifeBeneficiaryRelationship" 
                                                label="Relationship" 
                                                options={relationshipOptions}
                                              />
                                              <RHFTextField 
                                                name="spouseTermLifeBeneficiaryShare" 
                                                label="% Share" 
                                                type="number"
                                              />
                                            </Stack>
                                          </Stack>
                                        )}

                                        {spouseTermLifeBeneficiaryType === "trust" && (
                                          <Stack spacing={2}>
                                            <RHFTextField 
                                              name="spouseTermLifeTrustName" 
                                              label="Name of Trust" 
                                            />
                                            <RHFTextField 
                                              name="spouseTermLifeTrustDate" 
                                              label="Date of Trust (mm/dd/yyyy)" 
                                              placeholder="mm/dd/yyyy"
                                            />
                                          </Stack>
                                        )}
                                      </>
                                    )}
                                  </Stack>
                                </Box>

                                {/* Spouse 10-Year Level Term Life Insurance Section */}
                                <Box>
                                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    10-Year Level Term Life Insurance
                                  </Typography>
                                  
                                  <Alert severity="info" sx={{ mb: 2 }}>
                                    I make the following beneficiary designation with respect to new insurance issued on the basis of this application. If you currently have insurance and wish to change your beneficiary, contact the Plan Administrator for the proper form.
                                  </Alert>

                                  <Stack spacing={2}>
                                    <RHFRadioGroup
                                      name="spouseTenYearTermBeneficiaryType"
                                      label="Choose Beneficiary"
                                      options={[
                                        { label: "Individual", value: "individual" },
                                        { label: "Trust", value: "trust" }
                                      ]}
                                    />

                                    {spouseTenYearTermBeneficiaryType && (
                                      <>
                                        <RHFRadioGroup
                                          name="spouseTenYearTermBeneficiaryDesignation"
                                          label="Beneficiary Type"
                                          options={[
                                            { label: "Primary", value: "primary" },
                                            { label: "Contingent", value: "contingent" }
                                          ]}
                                        />

                                        {spouseTenYearTermBeneficiaryType === "individual" && (
                                          <Stack spacing={2}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                              <RHFTextField 
                                                name="spouseTenYearTermBeneficiaryFirstName" 
                                                label="First Name" 
                                              />
                                              <RHFTextField 
                                                name="spouseTenYearTermBeneficiaryLastName" 
                                                label="Last Name" 
                                              />
                                            </Stack>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                              <RHFSelect 
                                                name="spouseTenYearTermBeneficiaryRelationship" 
                                                label="Relationship" 
                                                options={relationshipOptions}
                                              />
                                              <RHFTextField 
                                                name="spouseTenYearTermBeneficiaryShare" 
                                                label="% Share" 
                                                type="number"
                                              />
                                            </Stack>
                                          </Stack>
                                        )}

                                        {spouseTenYearTermBeneficiaryType === "trust" && (
                                          <Stack spacing={2}>
                                            <RHFTextField 
                                              name="spouseTenYearTermTrustName" 
                                              label="Name of Trust" 
                                            />
                                            <RHFTextField 
                                              name="spouseTenYearTermTrustDate" 
                                              label="Date of Trust (mm/dd/yyyy)" 
                                              placeholder="mm/dd/yyyy"
                                            />
                                          </Stack>
                                        )}
                                      </>
                                    )}
                                  </Stack>
                                </Box>

                                {/* Spouse 20-Year Level Term Life Insurance Section */}
                                <Box>
                                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    20-Year Level Term Life Insurance
                                  </Typography>
                                  
                                  <Alert severity="info" sx={{ mb: 2 }}>
                                    I make the following beneficiary designation with respect to new insurance issued on the basis of this application. If you currently have insurance and wish to change your beneficiary, contact the Plan Administrator for the proper form.
                                  </Alert>

                                  <Stack spacing={2}>
                                    <RHFRadioGroup
                                      name="spouseTwentyYearTermBeneficiaryType"
                                      label="Choose Beneficiary"
                                      options={[
                                        { label: "Individual", value: "individual" },
                                        { label: "Trust", value: "trust" }
                                      ]}
                                    />

                                    {spouseTwentyYearTermBeneficiaryType && (
                                      <>
                                        <RHFRadioGroup
                                          name="spouseTwentyYearTermBeneficiaryDesignation"
                                          label="Beneficiary Type"
                                          options={[
                                            { label: "Primary", value: "primary" },
                                            { label: "Contingent", value: "contingent" }
                                          ]}
                                        />

                                        {spouseTwentyYearTermBeneficiaryType === "individual" && (
                                          <Stack spacing={2}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                              <RHFTextField 
                                                name="spouseTwentyYearTermBeneficiaryFirstName" 
                                                label="First Name" 
                                              />
                                              <RHFTextField 
                                                name="spouseTwentyYearTermBeneficiaryLastName" 
                                                label="Last Name" 
                                              />
                                            </Stack>
                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                              <RHFSelect 
                                                name="spouseTwentyYearTermBeneficiaryRelationship" 
                                                label="Relationship" 
                                                options={relationshipOptions}
                                              />
                                              <RHFTextField 
                                                name="spouseTwentyYearTermBeneficiaryShare" 
                                                label="% Share" 
                                                type="number"
                                              />
                                            </Stack>
                                          </Stack>
                                        )}

                                        {spouseTwentyYearTermBeneficiaryType === "trust" && (
                                          <Stack spacing={2}>
                                            <RHFTextField 
                                              name="spouseTwentyYearTermTrustName" 
                                              label="Name of Trust" 
                                            />
                                            <RHFTextField 
                                              name="spouseTwentyYearTermTrustDate" 
                                              label="Date of Trust (mm/dd/yyyy)" 
                                              placeholder="mm/dd/yyyy"
                                            />
                                          </Stack>
                                        )}
                                      </>
                                    )}
                                  </Stack>
                                </Box>

                                {/* Spouse Accidental Death and Dismemberment Insurance Section */}
                                <Box>
                                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    Accidental Death and Dismemberment Insurance
                                  </Typography>
                                  
                                  <Alert severity="info" sx={{ mb: 2 }}>
                                    I make the following beneficiary designation with respect to all life insurance under this insurance plan and, if I am already covered under the plan, I hereby revoke any prior beneficiary designation.
                                  </Alert>

                                  <Stack spacing={2}>
                                    <RHFRadioGroup
                                      name="spouseAddBeneficiaryType"
                                      label="Choose Beneficiary"
                                      options={[
                                        { label: "Individual", value: "individual" },
                                        { label: "Trust", value: "trust" }
                                      ]}
                                    />

                                    {spouseAddBeneficiaryType && (
                                      <RHFRadioGroup
                                        name="spouseAddBeneficiaryDesignation"
                                        label="Beneficiary Type"
                                        options={[
                                          { label: "Primary", value: "primary" },
                                          { label: "Contingent", value: "contingent" }
                                        ]}
                                      />
                                    )}

                                    {spouseAddBeneficiaryType === "individual" && (
                                      <Stack spacing={2}>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                          <RHFTextField 
                                            name="spouseAddBeneficiaryFirstName" 
                                            label="First Name" 
                                          />
                                          <RHFTextField 
                                            name="spouseAddBeneficiaryLastName" 
                                            label="Last Name" 
                                          />
                                        </Stack>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                          <RHFSelect 
                                            name="spouseAddBeneficiaryRelationship" 
                                            label="Relationship" 
                                            options={relationshipOptions}
                                          />
                                          <RHFTextField 
                                            name="spouseAddBeneficiaryShare" 
                                            label="% Share" 
                                            type="number"
                                          />
                                        </Stack>
                                      </Stack>
                                    )}

                                    {spouseAddBeneficiaryType === "trust" && (
                                      <Stack spacing={2}>
                                        <RHFTextField 
                                          name="spouseAddTrustName" 
                                          label="Name of Trust" 
                                        />
                                        <RHFTextField 
                                          name="spouseAddTrustDate" 
                                          label="Date of Trust (mm/dd/yyyy)" 
                                          placeholder="mm/dd/yyyy"
                                        />
                                      </Stack>
                                    )}
                                  </Stack>
                                </Box>
                              </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Main Payment Information Card */}
          <Card sx={commonStyles.categoryCard}>
            <CardContent>
              <Stack spacing={2}>
                {/* Category Header */}
                <Box sx={commonStyles.coverageCategoryHeader}>
                  <Typography variant="h4" sx={commonStyles.coverageCategoryTitle}>
                    Payment Information
                  </Typography>
                </Box>

                <Alert severity="info">
                  Please indicate how you would like to pay for this insurance. You won't be billed until underwriting and review are approved for coverage. We make sure your payment is secure. You may find more details about your privacy and safety in the privacy notice.
                </Alert>

                <RHFRadioGroup
                  name="wantsToAddPayment"
                  label="Do you want to add payment information now?"
                  options={[
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" }
                  ]}
                  required
                />

                {wantsToAddPayment === "yes" && (
                  <Card variant="outlined" sx={commonStyles.coverageCard}>
                    <CardContent>
                      <Stack spacing={2}>
                        {/* Section Header */}
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Payment color="primary" />
                            <Typography variant="h6">
                              Your Payment
                            </Typography>
                          </Stack>
                        </Box>

                        <Stack spacing={3}>
                          {/* Term Life Insurance Payment */}
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Term Life Insurance
                            </Typography>
                            
                            <Stack spacing={2}>
                              <RHFRadioGroup
                                name="termLifePaymentMethod"
                                label="Select new payment method"
                                options={[
                                  { label: "Bill Me", value: "bill_me" },
                                  { label: "Bank Account", value: "bank_account" }
                                ]}
                                required
                              />

                              <RHFSelect 
                                name="termLifePaymentFrequency" 
                                label="Payment Frequency" 
                                options={[
                                  { label: "Monthly", value: "monthly" },
                                  { label: "Quarterly", value: "quarterly" },
                                  { label: "Semiannually", value: "semiannually" },
                                  { label: "Annually", value: "annually" }
                                ]}
                                required
                              />

                              {renderEstimatedCostSection('li-term', termLifePaymentMethod, termLifePaymentFrequency, true)}
                            </Stack>
                          </Box>

                          {/* 10-Year Level Term Life Insurance Payment */}
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              10-Year Level Term Life Insurance
                            </Typography>
                            
                            <Stack spacing={2}>
                              <RHFRadioGroup
                                name="tenYearTermPaymentMethod"
                                label="Select new payment method"
                                options={[
                                  { label: "Bill Me", value: "bill_me" },
                                  { label: "Bank Account", value: "bank_account" }
                                ]}
                                required
                              />

                              <RHFSelect 
                                name="tenYearTermPaymentFrequency" 
                                label="Payment Frequency" 
                                options={[
                                  { label: "Monthly", value: "monthly" },
                                  { label: "Quarterly", value: "quarterly" },
                                  { label: "Semiannually", value: "semiannually" },
                                  { label: "Annually", value: "annually" }
                                ]}
                                required
                              />

                              {renderEstimatedCostSection('li-10yr', tenYearTermPaymentMethod, tenYearTermPaymentFrequency, true)}
                            </Stack>
                          </Box>

                          {/* 20-Year Level Term Life Insurance Payment */}
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              20-Year Level Term Life Insurance
                            </Typography>
                            
                            <Stack spacing={2}>
                              <RHFRadioGroup
                                name="twentyYearTermPaymentMethod"
                                label="Select new payment method"
                                options={[
                                  { label: "Bill Me", value: "bill_me" },
                                  { label: "Bank Account", value: "bank_account" }
                                ]}
                                required
                              />

                              <RHFSelect 
                                name="twentyYearTermPaymentFrequency" 
                                label="Payment Frequency" 
                                options={[
                                  { label: "Monthly", value: "monthly" },
                                  { label: "Quarterly", value: "quarterly" },
                                  { label: "Semiannually", value: "semiannually" },
                                  { label: "Annually", value: "annually" }
                                ]}
                                required
                              />

                              {renderEstimatedCostSection('li-20yr', twentyYearTermPaymentMethod, twentyYearTermPaymentFrequency, false)}
                            </Stack>
                          </Box>

                          {/* Accidental Death and Dismemberment Insurance Payment */}
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Accidental Death and Dismemberment Insurance
                            </Typography>
                            
                            <Stack spacing={2}>
                              <RHFRadioGroup
                                name="addPaymentMethod"
                                label="Select new payment method"
                                options={[
                                  { label: "Bill Me", value: "bill_me" },
                                  { label: "Bank Account", value: "bank_account" }
                                ]}
                                required
                              />

                              <RHFSelect 
                                name="addPaymentFrequency" 
                                label="Payment Frequency" 
                                options={[
                                  { label: "Monthly", value: "monthly" },
                                  { label: "Quarterly", value: "quarterly" },
                                  { label: "Semiannually", value: "semiannually" },
                                  { label: "Annually", value: "annually" }
                                ]}
                                required
                              />

                              {renderEstimatedCostSection('li-premier-accident', addPaymentMethod, addPaymentFrequency, false)}
                            </Stack>
                          </Box>

                          {/* Long-Term Disability Plus Insurance Payment */}
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Long-Term Disability Plus Insurance
                            </Typography>
                            
                            <Stack spacing={2}>
                              <RHFRadioGroup
                                name="longTermDisabilityPaymentMethod"
                                label="Select new payment method"
                                options={[
                                  { label: "Bill Me", value: "bill_me" },
                                  { label: "Bank Account", value: "bank_account" }
                                ]}
                                required
                              />

                              <RHFSelect 
                                name="longTermDisabilityPaymentFrequency" 
                                label="Payment Frequency" 
                                options={[
                                  { label: "Monthly", value: "monthly" },
                                  { label: "Quarterly", value: "quarterly" },
                                  { label: "Semiannually", value: "semiannually" },
                                  { label: "Annually", value: "annually" }
                                ]}
                                required
                              />

                              {renderEstimatedCostSection('di-level-rated', longTermDisabilityPaymentMethod, longTermDisabilityPaymentFrequency, false)}
                            </Stack>
                          </Box>

                          {/* Mid-Term Disability Insurance Payment */}
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Mid-Term Disability Insurance
                            </Typography>
                            
                            <Stack spacing={2}>
                              <RHFRadioGroup
                                name="midTermDisabilityPaymentMethod"
                                label="Select new payment method"
                                options={[
                                  { label: "Bill Me", value: "bill_me" },
                                  { label: "Bank Account", value: "bank_account" }
                                ]}
                                required
                              />

                              <RHFSelect 
                                name="midTermDisabilityPaymentFrequency" 
                                label="Payment Frequency" 
                                options={[
                                  { label: "Monthly", value: "monthly" },
                                  { label: "Quarterly", value: "quarterly" },
                                  { label: "Semiannually", value: "semiannually" },
                                  { label: "Annually", value: "annually" }
                                ]}
                                required
                              />

                              {renderEstimatedCostSection('di-step-rated', midTermDisabilityPaymentMethod, midTermDisabilityPaymentFrequency, false)}
                            </Stack>
                          </Box>

                          {/* Professional Overhead Expense Disability Insurance Payment */}
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Professional Overhead Expense Disability Insurance
                            </Typography>
                            
                            <Stack spacing={2}>
                              <RHFRadioGroup
                                name="professionalOverheadPaymentMethod"
                                label="Select new payment method"
                                options={[
                                  { label: "Bill Me", value: "bill_me" },
                                  { label: "Bank Account", value: "bank_account" }
                                ]}
                                required
                              />

                              <RHFSelect 
                                name="professionalOverheadPaymentFrequency" 
                                label="Payment Frequency" 
                                options={[
                                  { label: "Monthly", value: "monthly" },
                                  { label: "Quarterly", value: "quarterly" },
                                  { label: "Semiannually", value: "semiannually" },
                                  { label: "Annually", value: "annually" }
                                ]}
                                required
                              />

                              {renderEstimatedCostSection('oo-office-overhead', professionalOverheadPaymentMethod, professionalOverheadPaymentFrequency, false)}
                            </Stack>
                          </Box>

                          {/* Critical Illness Insurance Payment */}
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Critical Illness Insurance
                            </Typography>
                            
                            <Stack spacing={2}>
                              <RHFRadioGroup
                                name="criticalIllnessPaymentMethod"
                                label="Select new payment method"
                                options={[
                                  { label: "Bill Me", value: "bill_me" },
                                  { label: "Bank Account", value: "bank_account" }
                                ]}
                                required
                              />

                              <RHFSelect 
                                name="criticalIllnessPaymentFrequency" 
                                label="Payment Frequency" 
                                options={[
                                  { label: "Monthly", value: "monthly" },
                                  { label: "Quarterly", value: "quarterly" },
                                  { label: "Semiannually", value: "semiannually" },
                                  { label: "Annually", value: "annually" }
                                ]}
                                required
                              />

                              {renderEstimatedCostSection('sh-critical-illness', criticalIllnessPaymentMethod, criticalIllnessPaymentFrequency, false)}
                            </Stack>
                          </Box>

                          {/* Hospital Money Insurance Payment */}
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                              Hospital Money Insurance
                            </Typography>
                            
                            <Stack spacing={2}>
                              <RHFRadioGroup
                                name="hospitalMoneyPaymentMethod"
                                label="Select new payment method"
                                options={[
                                  { label: "Bill Me", value: "bill_me" },
                                  { label: "Bank Account", value: "bank_account" }
                                ]}
                                required
                              />

                              <RHFSelect 
                                name="hospitalMoneyPaymentFrequency" 
                                label="Payment Frequency" 
                                options={[
                                  { label: "Monthly", value: "monthly" },
                                  { label: "Quarterly", value: "quarterly" },
                                  { label: "Semiannually", value: "semiannually" },
                                  { label: "Annually", value: "annually" }
                                ]}
                                required
                              />

                              {renderEstimatedCostSection('sh-hospital-income', hospitalMoneyPaymentMethod, hospitalMoneyPaymentFrequency, false)}
                            </Stack>
                          </Box>

                          {/* Bank Account Details - Show if any payment method is bank account */}
                          {needsBankAccount && (
                            <Box>
                              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                Bank Account Details
                              </Typography>
                              
                              <Stack spacing={2}>
                                <RHFTextField 
                                  name="routingNumber" 
                                  label="Routing Number" 
                                  type="number"
                                  required
                                />

                                <RHFTextField 
                                  name="accountNumber" 
                                  label="Account Number" 
                                  type="number"
                                  required
                                />

                                <RHFTextField 
                                  name="nameOnAccount" 
                                  label="Name on Account" 
                                  required
                                />

                                <RHFTextField 
                                  name="bankInstitution" 
                                  label="Bank/Institution" 
                                  required
                                />

                                <Box sx={{ mt: 3 }}>
                                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    Bank Account Information
                                  </Typography>
                                  
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    "Based on the billing frequency which I selected above, I request and authorize American Bar Endowment Plan Administrator to make withdrawals against the account specified above or any other account subsequently identified by me, and each bank to process those withdrawals as if I had signed them, for the purpose of collecting premium contributions due under each insurance plan indicated as AutoPay(ETF) in this Application Form."
                                  </Typography>

                                  <RHFCheckbox
                                    name="bankAccountConsent"
                                    label="I have reviewed the information above and consent to the terms by checking this box."
                                  />
                                </Box>
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </CardContent>
          </Card>

          <PageNavigation />
        </Stack>
      </form>
    </FormProvider>
  );
}

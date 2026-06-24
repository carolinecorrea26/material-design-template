import type { PageId } from "../../types";
import { getResolvedFormFlow } from "../../config/formFlow";
import { getClientPageFields } from "../../config/clientFields/getClientPageFields";
import { getActiveClientCoverages } from "../../config/client/getActiveClientCoverages";
import type { ApplicationFormValues } from "../../app/ApplicationFormContext";

/**
 * Generate default/sample values for all fields up to and including a specific page
 */
export function generateFormDataUpToPage(
  targetPageId: PageId,
): ApplicationFormValues {
  const values: ApplicationFormValues = {};

  // Use the resolved form flow to find the target page
  const resolvedFlow = getResolvedFormFlow();
  const targetIndex = resolvedFlow.indexOf(targetPageId as PageId);
  if (targetIndex === -1) return values;

  // Iterate through all pages up to and including the target page
  for (let i = 0; i <= targetIndex; i++) {
    const pageId = resolvedFlow[i] as PageId;
    const fields = getClientPageFields(pageId, values);

    for (const field of fields) {
      if (values[field.id] !== undefined) continue; // Skip if already set

      // Generate default value based on field type and input type
      values[field.id] = getDefaultValueForField(field);
    }
  }

  const coverageIndex = resolvedFlow.indexOf("coverage");
  const paymentIndex = resolvedFlow.indexOf("payment");
  const shouldSeedCoverageData = targetIndex >= coverageIndex;
  const shouldSeedPaymentData = targetIndex >= paymentIndex;

  // Add special handling for coverage-dependent fields
  if (shouldSeedCoverageData) {
    // Ensure coverage selections exist
    if (!values.coverageSelections) {
      const coverages = getActiveClientCoverages();
      values.coverageSelections = coverages.slice(0, 2).map((c) => c.id);
    }

    // Generate coverage amounts and payment methods/frequencies
    const coverageSelections = Array.isArray(values.coverageSelections)
      ? values.coverageSelections
      : [];

    // Ensure productApplicants are set for each selected coverage
    if (!values.productApplicants) {
      const productApplicants: Record<string, string[]> = {};
      for (const coverageId of coverageSelections) {
        productApplicants[coverageId] = ["member"];
      }
      values.productApplicants = productApplicants;
    }

    if (!values.coverageAmounts) {
      values.coverageAmounts = {};
    }

    const coverageAmounts =
      typeof values.coverageAmounts === "object" &&
      !Array.isArray(values.coverageAmounts)
        ? values.coverageAmounts
        : {};

    // Set amounts and payment info for each coverage
    for (let i = 0; i < coverageSelections.length; i++) {
      const coverageId = coverageSelections[i];
      const memberKey = `${coverageId}:member`;

      if (!(memberKey in coverageAmounts)) {
        (coverageAmounts as Record<string, number>)[memberKey] = 100000;
      }

      // Only set spouse amounts if spouse is selected for this coverage
      const productApplicants = values.productApplicants as
        | Record<string, string[]>
        | undefined;
      const applicants = productApplicants?.[coverageId];
      if (applicants && applicants.includes("spouse")) {
        const spouseKey = `${coverageId}:spouse`;
        if (!(spouseKey in coverageAmounts)) {
          (coverageAmounts as Record<string, number>)[spouseKey] = 50000;
        }
      }

      if (shouldSeedPaymentData) {
        // Set payment method and frequency for each coverage
        // First coverage uses bank-account, others use bill-me
        const methodKey = `payment-method:${coverageId}`;
        const frequencyKey = `payment-frequency:${coverageId}`;

        if (!(methodKey in values)) {
          values[methodKey] = i === 0 ? "bank-account" : "bill-me";
        }

        if (!(frequencyKey in values)) {
          values[frequencyKey] = "monthly";
        }
      }
    }

    if (shouldSeedPaymentData) {
      // Add bank account details if not already set
      if (!values["payment-routing-number"]) {
        values["payment-routing-number"] = "021000021";
      }

      if (!values["payment-account-number"]) {
        values["payment-account-number"] = "123456789";
      }

      if (!values["payment-account-type"]) {
        values["payment-account-type"] = "checking";
      }

      if (!values["bank-authorization"]) {
        values["bank-authorization"] = true;
      }
    }

    values.coverageAmounts = coverageAmounts;
  }

  return values;
}

/**
 * Generate a default value for a single field based on its ID and type
 */
function getDefaultValueForField(field: {
  id: string;
  inputType?: string;
  options?: Array<{ value: string }>;
}): string | string[] | boolean | number {
  const { id: fieldId, inputType, options } = field;

  // Boolean fields (radio/checkbox)
  if (
    fieldId === "membership" ||
    fieldId === "has-other-life-insurance" ||
    fieldId === "is-replacing-life-insurance" ||
    fieldId === "has-pending-life-insurance-applications" ||
    fieldId === "has-spouse-life-insurance" ||
    fieldId === "is-replacing-spouse-life-insurance" ||
    fieldId === "has-pending-spouse-life-insurance-applications" ||
    fieldId === "smoker" ||
    fieldId === "spouse-smoker" ||
    fieldId === "has-drivers-license" ||
    fieldId === "spouse-has-drivers-license" ||
    fieldId === "intend-live-outside-us" ||
    fieldId === "spouse-intend-live-outside-us" ||
    fieldId === "travel-outside-us-six-months" ||
    fieldId === "spouse-travel-outside-us-six-months" ||
    fieldId === "business-address-same-as-home"
  ) {
    return "yes";
  }

  // Checkbox group fields (like dependents)
  if (inputType === "checkbox-group") {
    return [];
  }

  if (inputType === "multi-select") {
    return options?.[0]?.value ? [options[0].value] : [];
  }

  // Date fields
  if (inputType === "date") {
    if (fieldId === "birth-date" || fieldId === "spouse-birth-date") {
      // Default to age 35
      const now = new Date();
      const birthDate = new Date(now.getFullYear() - 35, 0, 15);
      return birthDate.toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  }

  // Name fields
  if (
    fieldId === "first-name" ||
    fieldId === "spouse-first-name" ||
    fieldId === "physician-first-name"
  ) {
    if (fieldId === "spouse-first-name") return "Jane";
    if (fieldId === "physician-first-name") return "John";
    return "John";
  }

  if (
    fieldId === "last-name" ||
    fieldId === "spouse-last-name" ||
    fieldId === "physician-last-name"
  ) {
    if (fieldId === "spouse-last-name") return "Smith";
    if (fieldId === "physician-last-name") return "Doe";
    return "Smith";
  }

  // Email
  if (fieldId === "email" || fieldId === "spouse-email") {
    if (fieldId === "spouse-email") return "jane.smith@example.com";
    return "john.smith@example.com";
  }

  // Phone numbers
  if (
    fieldId === "phone" ||
    fieldId === "business-phone" ||
    fieldId === "spouse-phone" ||
    fieldId === "physician-phone"
  ) {
    return "(555) 123-4567";
  }

  // Address fields
  if (fieldId === "street-address" || fieldId === "business-street-address") {
    return "123 Main Street";
  }

  if (fieldId === "apt-suite" || fieldId === "business-apt-suite") {
    return "Apt 4B";
  }

  if (
    fieldId === "city" ||
    fieldId === "business-city" ||
    fieldId === "medical-city"
  ) {
    return "New York";
  }

  if (
    fieldId === "state" ||
    fieldId === "business-state" ||
    fieldId === "medical-state"
  ) {
    return "NY";
  }

  if (
    fieldId === "zip-code" ||
    fieldId === "business-zip-code" ||
    fieldId === "medical-zip-code"
  ) {
    return "10001";
  }

  if (fieldId === "zip-postal-code") {
    return "10001";
  }

  // State/Province dropdown
  if (fieldId === "state-province") {
    return "NY";
  }

  // Business fields
  if (fieldId === "business-name") {
    return "ABC Corporation";
  }

  if (fieldId === "business-type") {
    return "corporation";
  }

  // Medical fields
  if (fieldId === "medical-facility-name") {
    return "General Hospital";
  }

  if (fieldId === "medical-facility-street-address") {
    return "456 Hospital Ave";
  }

  if (fieldId === "medical-facility-apt-suite") {
    return "";
  }

  // Health/Personal fields
  if (fieldId === "height-feet") {
    return "5";
  }

  if (fieldId === "height-inches") {
    return "10";
  }

  if (fieldId === "spouse-height-feet") {
    return "5";
  }

  if (fieldId === "spouse-height-inches") {
    return "6";
  }

  if (
    fieldId === "weight-lbs" ||
    fieldId === "weight-12-months-ago-lbs" ||
    fieldId === "spouse-weight-lbs" ||
    fieldId === "spouse-weight-12-months-ago-lbs"
  ) {
    return "170";
  }

  // Gender
  if (fieldId === "gender") {
    return "male";
  }

  if (fieldId === "spouse-gender") {
    return "female";
  }

  // Tobacco
  if (
    fieldId === "tobacco-last-used" ||
    fieldId === "spouse-tobacco-last-used"
  ) {
    return "more-than-12-months";
  }

  // Income fields
  if (
    fieldId === "average-monthly-income" ||
    fieldId === "spouse-average-monthly-income"
  ) {
    return "5000";
  }

  if (
    fieldId === "hours-worked-per-week" ||
    fieldId === "spouse-hours-worked-per-week"
  ) {
    return "40";
  }

  // Business expense fields
  if (fieldId === "monthly-business-expenses") {
    return "2000";
  }

  if (fieldId === "business-expense-responsibility") {
    return "50";
  }

  // SSN
  if (
    fieldId === "social-security-number" ||
    fieldId === "spouse-social-security-number"
  ) {
    return "123456789";
  }

  // Marital status
  if (fieldId === "marital-status") {
    return "married";
  }

  // Driver's license
  if (
    fieldId === "drivers-license-number" ||
    fieldId === "spouse-drivers-license-number"
  ) {
    return "D123456789";
  }

  if (
    fieldId === "drivers-license-state" ||
    fieldId === "spouse-drivers-license-state"
  ) {
    return "NY";
  }

  // International travel
  if (
    fieldId === "outside-us-months" ||
    fieldId === "spouse-outside-us-months"
  ) {
    return "1";
  }

  if (
    fieldId === "outside-us-country" ||
    fieldId === "spouse-outside-us-country" ||
    fieldId === "travel-outside-us-country" ||
    fieldId === "spouse-travel-outside-us-country"
  ) {
    return "canada";
  }

  // Correspondence
  if (fieldId === "correspondence-to") {
    return "home";
  }

  // Existing life insurance
  if (
    fieldId === "existing-life-insurance-amount" ||
    fieldId === "spouse-existing-life-insurance-amount"
  ) {
    return "100000";
  }

  // Pending life insurance
  if (
    fieldId === "pending-life-insurance-amount" ||
    fieldId === "spouse-pending-life-insurance-amount"
  ) {
    return "50000";
  }

  if (
    fieldId === "pending-life-insurance-company" ||
    fieldId === "spouse-pending-life-insurance-company"
  ) {
    return "Insurance Corp";
  }

  // Title
  if (fieldId === "title") {
    return "mr";
  }

  // Dropdown/select fields default to first option value
  if (inputType === "dropdown") {
    return "yes";
  }

  // Default text/input values
  return "";
}

// Shared by the page renderer and the Library inspection inventory.
import type { FieldDefinition } from "./types";

export const paymentMethodOptions = [
  { value: "bill-me", label: "Bill me" },
  { value: "bank-account", label: "Bank account" },
] as const;

export const paymentFrequencyOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semiannually", label: "Semiannually" },
  { value: "annually", label: "Annually" },
] as const;

export const PAYMENT_INFO_OPT_IN_FIELD_ID = "payment-information-opt-in";

export const paymentInfoOptInField: FieldDefinition = {
  id: PAYMENT_INFO_OPT_IN_FIELD_ID,
  label: "Do you want to add payment information?",
  inputType: "radio",
  required: true,
  options: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ],
};

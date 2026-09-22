// ---------------------------------------------------------------------------
// Error messages data
//
// Extracted from src/pages/InformationArchitecture.tsx (Validation section).
// ---------------------------------------------------------------------------

// Grouping key for each error message, ordered to match how pages are
// actually encountered while moving through the app: pre-application
// (global rules, Home, Resume) followed by the application form flow order.
export type ErrorMessagePageKey =
  | "global"
  | "home"
  | "resume"
  | "membership"
  | "eligibility"
  | "coverage"
  | "beneficiary"
  | "payment";

export const errorMessagePageOrder: { key: ErrorMessagePageKey; label: string }[] = [
  { key: "global", label: "Global (all pages)" },
  { key: "home", label: "Home / Quick Quote" },
  { key: "resume", label: "Resume Flow" },
  { key: "membership", label: "Membership" },
  { key: "eligibility", label: "Eligibility" },
  { key: "coverage", label: "Coverage" },
  { key: "beneficiary", label: "Beneficiary" },
  { key: "payment", label: "Payment" },
];

export type ErrorMessageEntry = {
  page: ErrorMessagePageKey;
  level: "Page" | "Field";
  trigger: string;
  message: string;
};

export const errorMessages: ErrorMessageEntry[] = [
  {
    page: "global",
    level: "Field",
    trigger:
      "A required text/select/dropdown/radio/date field is left blank on submit.",
    message: "{Field label} is required.",
  },
  {
    page: "global",
    level: "Field",
    trigger: "A required checkbox is left unchecked on submit.",
    message: "{Field label} is required.",
  },
  {
    page: "global",
    level: "Field",
    trigger:
      "A required checkbox-group or multi-select field has no options selected on submit.",
    message: "Select at least one option.",
  },
  {
    page: "global",
    level: "Field",
    trigger:
      "A ZIP/postal-code field (id includes 'zip' or autoComplete='postal-code') has fewer than 5 characters entered.",
    message: "Enter a valid ZIP / Postal Code.",
  },
  {
    page: "global",
    level: "Field",
    trigger: "A field with format='email' fails the email pattern check.",
    message: "Enter a valid email address.",
  },
  {
    page: "global",
    level: "Field",
    trigger:
      "A field with format='phone' does not resolve to exactly 10 digits.",
    message: "Enter a valid 10-digit phone number.",
  },
  {
    page: "global",
    level: "Field",
    trigger: "A field with format='ssn' does not resolve to exactly 9 digits.",
    message: "Enter a valid 9-digit SSN.",
  },
  {
    page: "global",
    level: "Field",
    trigger: "A field with format='percent' has more than 3 digits entered.",
    message: "Enter a percent value with up to 3 digits.",
  },
  {
    page: "global",
    level: "Field",
    trigger:
      "A field with format='month-year' does not resolve to exactly 6 digits (MM/YYYY).",
    message: "Enter a valid month and year (MM/YYYY).",
  },
  {
    page: "global",
    level: "Field",
    trigger:
      "A field with inputType='number' contains non-digit characters.",
    message: "Enter numbers only.",
  },
  {
    page: "global",
    level: "Field",
    trigger:
      "A phone-format field's paired Mobile/Home/Business type selector is left unselected on submit.",
    message: "Phone Type is required",
  },
  {
    page: "global",
    level: "Page",
    trigger:
      "Next/submit is clicked on any FormRoutePage-driven page while one or more field-level validation errors remain; focus/scroll moves to the first invalid field.",
    message: "Please correct the errors below before continuing.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: selected category requires gender and it is left blank.",
    message: "Gender is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: selected category requires a tobacco-use answer and it is left blank.",
    message: "Do you use nicotine products? is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: DI/OO category requires average monthly income and it is left blank.",
    message: "Average monthly income is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: selected category requires hours worked per week and it is left blank.",
    message: "Hours worked per week is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: OO category requires monthly business expenses and it is left blank.",
    message: "Monthly business expenses is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: OO category requires a business-expense responsibility percentage and it is left blank.",
    message: "Responsibility percentage is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger: "Inline quote tool on Home: date of birth is left blank.",
    message: "Date of birth is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger:
      "Inline quote tool on Home: date of birth is entered but is not a complete MM/DD/YYYY date.",
    message: "Enter a complete date (MM/DD/YYYY).",
  },
  {
    page: "home",
    level: "Field",
    trigger: "Inline quote tool on Home: ZIP/postal code is left blank.",
    message: "ZIP / postal code is required.",
  },
  {
    page: "home",
    level: "Field",
    trigger: "Inline quote tool on Home: state is left blank.",
    message: "State is required.",
  },
  {
    page: "home",
    level: "Page",
    trigger:
      "Inline quote tool on Home: the age calculated from date of birth is 80 or older.",
    message:
      "We're sorry, but coverage is not available for applicants age 80 or older.",
  },
  {
    page: "resume",
    level: "Field",
    trigger: "The Resume (email entry) form is submitted with a blank email field.",
    message: "Enter your email address.",
  },
  {
    page: "resume",
    level: "Page",
    trigger:
      "The magic-link countdown reaches zero before the emailed secure link is used. Shown with a resend-link action.",
    message: "Your secure link has expired.",
  },
  {
    page: "resume",
    level: "Field",
    trigger: "The Resume Code form is submitted with a blank verification-code field.",
    message: "Enter your verification code.",
  },
  {
    page: "resume",
    level: "Page",
    trigger:
      "The verification-code countdown reaches zero before the code is entered. Shown with a resend-code action.",
    message: "Your verification code has expired.",
  },
  {
    page: "membership",
    level: "Page",
    trigger:
      "Client is not AMA or WAEPA and the member answers 'No' to the membership question; Next is also disabled for this state.",
    message:
      "We're sorry, but only members are eligible to apply for this coverage.",
  },
  {
    page: "membership",
    level: "Page",
    trigger:
      "WAEPA client, membership qualification answered as 'Spouse of an Associate Member'.",
    message:
      "To apply as an Associate Member, please include your spouse's current WAEPA membership information.",
  },
  {
    page: "membership",
    level: "Page",
    trigger:
      "WAEPA client, membership qualification answered as 'Child of an Associate Member'.",
    message:
      "To apply as an Associate Member, please include your parent's current WAEPA membership information.",
  },
  {
    page: "membership",
    level: "Page",
    trigger: "AMA client, membership answered as 'Spouse of a physician'.",
    message:
      "To apply as a spouse of a physician, please include the physician's information below.",
  },
  {
    page: "eligibility",
    level: "Page",
    trigger:
      "Next is clicked with Child selected as a dependent but zero child records have been added via the DynamicList modal.",
    message: "Please add at least one child or remove child from dependents.",
  },
  {
    page: "eligibility",
    level: "Page",
    trigger:
      "Next is clicked with Spouse selected as a dependent but no spouse first or last name has been entered.",
    message:
      "Please add spouse details or remove spouse from dependents.",
  },
  {
    page: "eligibility",
    level: "Page",
    trigger:
      "Submitted eligibility values match a configured TPA member record and identity verification has not yet completed. No visible message is shown — navigation is silently blocked (a zero-width space is returned as the validation error) while the MemberVerification modal opens; submission auto-resumes when the modal closes.",
    message: "​ (invisible — blocks navigation without displaying text)",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "'See my coverage options' or Next is clicked with zero coverage categories selected.",
    message: "Please select at least one coverage category.",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "'See my coverage options' is clicked while a category-level question (tobacco use, income, hours) fails validation.",
    message: "Please correct the errors below before continuing.",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "Next is clicked with one or more categories selected but no product/coverage chosen.",
    message: "Please select at least one coverage to continue.",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "Next is clicked and a selected product has no applicant (member/spouse/child) checked.",
    message: "Please select at least one applicant for each selected product.",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "Next is clicked and no benefit amount greater than $0 is set for any selected product/applicant.",
    message: "Select at least one benefit amount before continuing.",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "Next is clicked with selected coverage applying only to spouse and/or child, no member selection. A confirmation dialog is shown (not a blocking validation error); Continue proceeds, Cancel stays on Coverage.",
    message:
      "To apply for dependent coverage, the member must be insured with this group coverage.",
  },
  {
    page: "coverage",
    level: "Page",
    trigger:
      "Based on the answered category questions, the applicant is ineligible for every available coverage option in the catalog.",
    message:
      "You are not eligible for any coverage options — Based on your answers, you are not currently eligible for any available coverage. Please contact us for assistance.",
  },
  {
    page: "coverage",
    level: "Field",
    trigger:
      "A selected product's benefit amount dropdown is set to $0 for an applicant.",
    message:
      "You have selected $0 for this coverage. This means you are not applying for this product. Please ensure your selections look correct.",
  },
  {
    page: "beneficiary",
    level: "Page",
    trigger:
      "Next is clicked and an applicable member/spouse Life or AD product has zero beneficiary records.",
    message: "Please add beneficiary information before continuing.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "Save is clicked in the Add/Edit Beneficiary modal when the target designation (Primary or Contingent) already has 10 records for that product.",
    message:
      "You have reached the maximum of 10 {designation} beneficiaries for this product.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "Save is clicked for an Individual beneficiary with a blank, zero, or negative % share.",
    message: "Enter a valid share percentage greater than 0.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "Save is clicked for an Individual beneficiary whose % share exceeds the unassigned percentage remaining for that designation.",
    message: "Share exceeds available unassigned percentage ({unassigned}%).",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "The Add/Edit modal is opened for a designation (Primary/Contingent) that has already reached 10 records.",
    message:
      "No more {designation} beneficiaries can be added online.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "Individual type is selected in the modal but 0% unassigned share remains for that designation (and no Trust is already designated).",
    message: "No more individuals can be added — 0% unassigned share remaining.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "Individual type is selected in the modal but a Trust already occupies that designation.",
    message:
      "A trust has already been designated as {designation} beneficiary. Individuals cannot be added for this designation.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger: "Trust type is selected in the modal but a Trust already exists for that designation.",
    message: "Only one trust can be designated per {designation} beneficiary.",
  },
  {
    page: "beneficiary",
    level: "Field",
    trigger:
      "Trust type is selected in the modal but an Individual already occupies that designation.",
    message:
      "An individual has already been designated as {designation} beneficiary. A trust cannot be added for this designation.",
  },
  {
    page: "payment",
    level: "Page",
    trigger:
      "Next is clicked and an applicable product is missing a payment method or payment frequency.",
    message:
      "Please add payment information for all applicable products before continuing.",
  },
];

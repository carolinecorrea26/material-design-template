import type { FieldDefinition, FieldId } from "./types";

const usStateOptions = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AB", label: "Alberta" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "BC", label: "British Columbia" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "GU", label: "Guam" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MB", label: "Manitoba" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NB", label: "New Brunswick" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NU", label: "Nunavut" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "ON", label: "Ontario" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "PR", label: "Puerto Rico" },
  { value: "QC", label: "Quebec" },
  { value: "RI", label: "Rhode Island" },
  { value: "SK", label: "Saskatchewan" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VI", label: "Virgin Islands" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "YT", label: "Yukon Territory" },
];

const countryOptions = [
  { value: "canada", label: "Canada" },
  { value: "mexico", label: "Mexico" },
  { value: "united-kingdom", label: "United Kingdom" },
  { value: "france", label: "France" },
  { value: "germany", label: "Germany" },
  { value: "japan", label: "Japan" },
  { value: "australia", label: "Australia" },
  { value: "other", label: "Other" },
];

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const paymentFrequencyOptions = [
  { value: "annual", label: "Annual" },
  { value: "quarterly", label: "Quarterly" },
  { value: "monthly", label: "Monthly" },
];

export const fieldCatalog: Record<FieldId, FieldDefinition> = {
  membership: {
    id: "membership",
    label: "Are you currently a member?",
    inputType: "radio",
    required: true,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },

  title: {
    id: "title",
    label: "Title",
    inputType: "dropdown",
    placeholder: "Select",
    options: [
      { value: "mr", label: "Mr." },
      { value: "mrs", label: "Mrs." },
      { value: "ms", label: "Ms." },
      { value: "dr", label: "Dr." },
    ],
  },

  "first-name": {
    id: "first-name",
    label: "First Name",
    inputType: "text",
    required: true,
    autoComplete: "given-name",
  },

  "last-name": {
    id: "last-name",
    label: "Last Name",
    inputType: "text",
    required: true,
    autoComplete: "family-name",
  },

  email: {
    id: "email",
    label: "Email",
    inputType: "text",
    required: true,
    format: "email",
    autoComplete: "email",
    inputMode: "email",
  },

  phone: {
    id: "phone",
    label: "Phone Number",
    inputType: "text",
    required: true,
    format: "phone",
    autoComplete: "tel",
    inputMode: "tel",
  },

  "phone-type": {
    id: "phone-type",
    label: "Phone Type",
    inputType: "dropdown",
    required: true,
    options: [
      { value: "mobile", label: "Mobile" },
      { value: "home", label: "Home" },
      { value: "business", label: "Business" },
    ],
  },

  "zip-postal-code": {
    id: "zip-postal-code",
    label: "Zip / Postal Code",
    inputType: "text",
    required: true,
    autoComplete: "postal-code",
    inputMode: "numeric",
  },

  "state-province": {
    id: "state-province",
    label: "State / Province",
    inputType: "dropdown",
    required: true,
    placeholder: "Select",
    options: usStateOptions,
  },

  "birth-date": {
    id: "birth-date",
    label: "Date of Birth",
    inputType: "date",
    required: true,
  },

  dependents: {
    id: "dependents",
    label: "Would you like to add dependent coverage?",
    inputType: "checkbox-group",
    options: [
      { value: "spouse", label: "Spouse" },
      { value: "child", label: "Child" },
    ],
  },

  "spouse-first-name": {
    id: "spouse-first-name",
    label: "First Name",
    inputType: "text",
    required: true,
    autoComplete: "given-name",
  },

  "spouse-last-name": {
    id: "spouse-last-name",
    label: "Last Name",
    inputType: "text",
    required: true,
    autoComplete: "family-name",
  },

  "spouse-birth-date": {
    id: "spouse-birth-date",
    label: "Date of Birth",
    inputType: "date",
    required: true,
  },

  "child-first-name": {
    id: "child-first-name",
    label: "First Name",
    inputType: "text",
    required: true,
    autoComplete: "given-name",
  },

  "child-last-name": {
    id: "child-last-name",
    label: "Last Name",
    inputType: "text",
    required: true,
    autoComplete: "family-name",
  },

  "child-birth-date": {
    id: "child-birth-date",
    label: "Date of Birth",
    inputType: "date",
    required: true,
  },

  "child-gender": {
    id: "child-gender",
    label: "Gender",
    inputType: "radio",
    required: true,
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
    ],
  },

  gender: {
    id: "gender",
    label: "Gender",
    inputType: "radio",
    required: true,
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
    ],
  },

  smoker: {
    id: "smoker",
    label:
      "Have you used tobacco or any nicotine substitute in any form (including nicotine patches and nicotine chewing gum)?",
    inputType: "radio",
    required: true,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },

  "tobacco-last-used": {
    id: "tobacco-last-used",
    label: "Last Used",
    inputType: "date",
    required: true,
  },

  "tobacco-products": {
    id: "tobacco-products",
    label: "Product(s) Used",
    inputType: "multi-select",
    required: true,
    options: [
      { value: "Cigarettes", label: "Cigarettes" },
      { value: "Cigars", label: "Cigars" },
      { value: "Pipe", label: "Pipe" },
      { value: "Chewing Tobacco", label: "Chewing Tobacco" },
      { value: "Snuff", label: "Snuff" },
      { value: "Nicotine Gum", label: "Nicotine Gum" },
      { value: "Nicotine Patch", label: "Nicotine Patch" },
      { value: "Other", label: "Other" },
    ],
  },

  "average-monthly-income": {
    id: "average-monthly-income",
    label: "Average Monthly Income",
    inputType: "text",
    format: "currency",
    required: true,
    inputMode: "numeric",
  },

  "hours-worked-per-week": {
    id: "hours-worked-per-week",
    label: "# Hours You Work/Week",
    inputType: "number",
    required: true,
    inputMode: "numeric",
  },

  "monthly-business-expenses": {
    id: "monthly-business-expenses",
    label: "Monthly Business Expenses",
    inputType: "text",
    format: "currency",
    required: true,
    inputMode: "numeric",
  },

  "business-expense-responsibility": {
    id: "business-expense-responsibility",
    label: "% You Are Responsible For",
    inputType: "text",
    format: "percent",
    required: true,
    inputMode: "numeric",
  },

  "spouse-gender": {
    id: "spouse-gender",
    label: "Gender",
    inputType: "radio",
    required: true,
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
    ],
  },

  "spouse-smoker": {
    id: "spouse-smoker",
    label:
      "Have you used tobacco or any nicotine substitute in any form (including nicotine patches and nicotine chewing gum)?",
    inputType: "radio",
    required: true,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },

  "spouse-tobacco-last-used": {
    id: "spouse-tobacco-last-used",
    label: "Last Used",
    inputType: "date",
    required: true,
  },

  "spouse-tobacco-products": {
    id: "spouse-tobacco-products",
    label: "Product(s) Used",
    inputType: "multi-select",
    required: true,
    options: [
      { value: "Cigarettes", label: "Cigarettes" },
      { value: "Cigars", label: "Cigars" },
      { value: "Pipe", label: "Pipe" },
      { value: "Chewing Tobacco", label: "Chewing Tobacco" },
      { value: "Snuff", label: "Snuff" },
      { value: "Nicotine Gum", label: "Nicotine Gum" },
      { value: "Nicotine Patch", label: "Nicotine Patch" },
      { value: "Other", label: "Other" },
    ],
  },

  "spouse-average-monthly-income": {
    id: "spouse-average-monthly-income",
    label: "Average Monthly Income",
    inputType: "text",
    format: "currency",
    required: true,
    inputMode: "numeric",
  },

  "spouse-hours-worked-per-week": {
    id: "spouse-hours-worked-per-week",
    label: "# Hours You Work/Week",
    inputType: "number",
    required: true,
    inputMode: "numeric",
  },

  "spouse-phone": {
    id: "spouse-phone",
    label: "Phone Number",
    inputType: "text",
    required: true,
    format: "phone",
    autoComplete: "tel",
    inputMode: "tel",
    phoneTypeFieldId: "spouse-phone-type",
  },

  "spouse-phone-type": {
    id: "spouse-phone-type",
    label: "Phone Type",
    inputType: "dropdown",
    required: true,
    options: [
      { value: "mobile", label: "Mobile" },
      { value: "home", label: "Home" },
      { value: "business", label: "Business" },
    ],
  },

  "spouse-email": {
    id: "spouse-email",
    label: "Email",
    inputType: "text",
    required: true,
    format: "email",
    autoComplete: "email",
    inputMode: "email",
  },

  "street-address": {
    id: "street-address",
    label: "Street Address",
    inputType: "text",
    required: true,
    autoComplete: "street-address",
  },

  "apt-suite": {
    id: "apt-suite",
    label: "Apt/Suite",
    inputType: "text",
    required: false,
    autoComplete: "address-line2",
  },

  city: {
    id: "city",
    label: "City",
    inputType: "text",
    required: true,
    autoComplete: "address-level2",
  },

  state: {
    id: "state",
    label: "State",
    inputType: "dropdown",
    required: true,
    placeholder: "Select",
    options: usStateOptions,
    disabled: true,
  },

  "zip-code": {
    id: "zip-code",
    label: "Zip / Postal Code",
    inputType: "text",
    required: true,
    inputMode: "numeric",
    autoComplete: "postal-code",
    disabled: true,
  },

  "correspondence-to": {
    id: "correspondence-to",
    label: "Send Correspondence To",
    inputType: "radio",
    required: true,
    options: [
      { value: "residential", label: "Residential Address" },
      { value: "business", label: "Business Address" },
    ],
  },

  "business-name": {
    id: "business-name",
    label: "Name of Business or Employer",
    inputType: "text",
    required: true,
    autoComplete: "organization",
  },

  "business-type": {
    id: "business-type",
    label: "Type of Business",
    inputType: "radio",
    required: true,
    options: [
      { value: "sole-proprietor", label: "Sole Proprietor" },
      { value: "corporation", label: "Corporation" },
      { value: "partnership", label: "Partnership" },
    ],
  },

  "business-address-same-as-home": {
    id: "business-address-same-as-home",
    label: "Business address is the same as home address",
    inputType: "checkbox",
    required: false,
  },

  "business-street-address": {
    id: "business-street-address",
    label: "Business Street Address",
    inputType: "text",
    required: true,
    autoComplete: "street-address",
  },

  "business-apt-suite": {
    id: "business-apt-suite",
    label: "Apt/Suite",
    inputType: "text",
    required: false,
    autoComplete: "address-line2",
  },

  "business-city": {
    id: "business-city",
    label: "City",
    inputType: "text",
    required: true,
    autoComplete: "address-level2",
  },

  "business-state": {
    id: "business-state",
    label: "State",
    inputType: "dropdown",
    required: true,
    placeholder: "Select",
    options: usStateOptions,
  },

  "business-zip-code": {
    id: "business-zip-code",
    label: "Zip Code",
    inputType: "text",
    required: true,
    inputMode: "numeric",
    autoComplete: "postal-code",
  },

  "business-phone": {
    id: "business-phone",
    label: "Business Phone Number",
    inputType: "text",
    required: false,
    format: "phone",
    inputMode: "tel",
    autoComplete: "tel",
  },

  "physician-first-name": {
    id: "physician-first-name",
    label: "Physician First Name",
    inputType: "text",
    autoComplete: "off",
  },

  "physician-last-name": {
    id: "physician-last-name",
    label: "Physician Last Name",
    inputType: "text",
    autoComplete: "off",
  },

  "physician-phone": {
    id: "physician-phone",
    label: "Physician Phone Number",
    inputType: "text",
    format: "phone",
    inputMode: "tel",
    autoComplete: "off",
    showPhoneTypeSelector: false,
  },

  "medical-facility-name": {
    id: "medical-facility-name",
    label: "Medical Facility Name",
    inputType: "text",
    autoComplete: "organization",
  },

  "medical-facility-street-address": {
    id: "medical-facility-street-address",
    label: "Street Address",
    inputType: "text",
    autoComplete: "street-address",
  },

  "medical-facility-apt-suite": {
    id: "medical-facility-apt-suite",
    label: "Apt/Suite",
    inputType: "text",
    autoComplete: "address-line2",
  },

  "medical-city": {
    id: "medical-city",
    label: "City",
    inputType: "text",
    autoComplete: "address-level2",
  },

  "medical-state": {
    id: "medical-state",
    label: "State",
    inputType: "dropdown",
    placeholder: "Select",
    options: usStateOptions,
  },

  "medical-zip-code": {
    id: "medical-zip-code",
    label: "Zip Code",
    inputType: "text",
    inputMode: "numeric",
    autoComplete: "postal-code",
  },

  "height-feet": {
    id: "height-feet",
    label: "Height (ft)",
    inputType: "dropdown",
    options: [
      { value: "4", label: "4'" },
      { value: "5", label: "5'" },
      { value: "6", label: "6'" },
      { value: "7", label: "7'" },
    ],
  },

  "height-inches": {
    id: "height-inches",
    label: "Inches",
    inputType: "number",
    inputMode: "numeric",
  },

  "weight-lbs": {
    id: "weight-lbs",
    label: "Weight (lbs.)",
    inputType: "number",
    inputMode: "numeric",
  },

  "weight-12-months-ago-lbs": {
    id: "weight-12-months-ago-lbs",
    label: "Weight 12 Months Ago (lbs.)",
    inputType: "number",
    inputMode: "numeric",
  },

  "social-security-number": {
    id: "social-security-number",
    label: "Social Security Number",
    inputType: "text",
    placeholder: "XXX-XX-XXXX",
    format: "ssn",
    inputMode: "numeric",
    autoComplete: "off",
  },

  "marital-status": {
    id: "marital-status",
    label: "Marital Status",
    inputType: "dropdown",
    placeholder: "Select",
    options: [
      { value: "single", label: "Single" },
      { value: "married", label: "Married" },
      { value: "divorced", label: "Divorced" },
      { value: "widowed", label: "Widowed" },
      { value: "separated", label: "Separated" },
    ],
  },

  "has-drivers-license": {
    id: "has-drivers-license",
    label: "Do you have a valid driver's license?",
    inputType: "radio",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },

  "drivers-license-number": {
    id: "drivers-license-number",
    label: "Driver's License Number",
    inputType: "text",
    autoComplete: "off",
  },

  "drivers-license-state": {
    id: "drivers-license-state",
    label: "Driver's License State",
    inputType: "dropdown",
    placeholder: "Select",
    options: usStateOptions,
  },

  "intend-live-outside-us": {
    id: "intend-live-outside-us",
    label: "Do you intend to live outside the United States?",
    inputType: "radio",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },

  "outside-us-months": {
    id: "outside-us-months",
    label: "How many months?",
    inputType: "number",
    inputMode: "numeric",
  },

  "outside-us-country": {
    id: "outside-us-country",
    label: "Country",
    inputType: "dropdown",
    placeholder: "Select",
    options: countryOptions,
  },

  "travel-outside-us-six-months": {
    id: "travel-outside-us-six-months",
    label: "Will you travel outside the U.S. for 6+ months in the next year?",
    inputType: "radio",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },

  "travel-outside-us-country": {
    id: "travel-outside-us-country",
    label: "Country",
    inputType: "dropdown",
    placeholder: "Select",
    options: countryOptions,
  },

  "spouse-height-feet": {
    id: "spouse-height-feet",
    label: "Height (ft)",
    inputType: "dropdown",
    options: [
      { value: "4", label: "4'" },
      { value: "5", label: "5'" },
      { value: "6", label: "6'" },
      { value: "7", label: "7'" },
    ],
  },

  "spouse-height-inches": {
    id: "spouse-height-inches",
    label: "Inches",
    inputType: "number",
    inputMode: "numeric",
  },

  "spouse-weight-lbs": {
    id: "spouse-weight-lbs",
    label: "Weight (lbs.)",
    inputType: "number",
    inputMode: "numeric",
  },

  "spouse-weight-12-months-ago-lbs": {
    id: "spouse-weight-12-months-ago-lbs",
    label: "Weight 12 Months Ago (lbs.)",
    inputType: "number",
    inputMode: "numeric",
  },

  "spouse-social-security-number": {
    id: "spouse-social-security-number",
    label: "Social Security Number",
    inputType: "text",
    placeholder: "XXX-XX-XXXX",
    format: "ssn",
    inputMode: "numeric",
    autoComplete: "off",
  },

  "spouse-has-drivers-license": {
    id: "spouse-has-drivers-license",
    label: "Does your spouse have a valid driver's license?",
    inputType: "radio",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },

  "spouse-drivers-license-number": {
    id: "spouse-drivers-license-number",
    label: "Spouse Driver's License Number",
    inputType: "text",
    autoComplete: "off",
  },

  "spouse-drivers-license-state": {
    id: "spouse-drivers-license-state",
    label: "Spouse Driver's License State",
    inputType: "dropdown",
    placeholder: "Select",
    options: usStateOptions,
  },

  "spouse-intend-live-outside-us": {
    id: "spouse-intend-live-outside-us",
    label: "Does your spouse intend to live outside the United States?",
    inputType: "radio",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },

  "spouse-outside-us-months": {
    id: "spouse-outside-us-months",
    label: "How many months?",
    inputType: "number",
    inputMode: "numeric",
  },

  "spouse-outside-us-country": {
    id: "spouse-outside-us-country",
    label: "Country",
    inputType: "dropdown",
    placeholder: "Select",
    options: countryOptions,
  },

  "spouse-travel-outside-us-six-months": {
    id: "spouse-travel-outside-us-six-months",
    label:
      "Will your spouse travel outside the U.S. for 6+ months in the next year?",
    inputType: "radio",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },

  "spouse-travel-outside-us-country": {
    id: "spouse-travel-outside-us-country",
    label: "Country",
    inputType: "dropdown",
    placeholder: "Select",
    options: countryOptions,
  },

  "has-other-life-insurance": {
    id: "has-other-life-insurance",
    label: "Do you have other life insurance in force?",
    tooltip:
      'If you have life insurance in-force with New York Life or another carrier, select "Yes"',
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "existing-life-insurance-amount": {
    id: "existing-life-insurance-amount",
    label: "What is the total amount in all companies?",
    tooltip:
      "You can find your current coverage amount in your recent statement from your carrier.",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "is-replacing-life-insurance": {
    id: "is-replacing-life-insurance",
    label:
      "Is the life insurance applied for intended to replace, discontinue or change an existing life insurance policy or annuity contract?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "has-pending-life-insurance-applications": {
    id: "has-pending-life-insurance-applications",
    label: "Do you have other life insurance applications pending?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "pending-life-insurance-amount": {
    id: "pending-life-insurance-amount",
    label: "Amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "floating",
  },

  "pending-life-insurance-company": {
    id: "pending-life-insurance-company",
    label: "Company",
    inputType: "text",
    labelVariant: "floating",
  },

  "has-disability-insurance": {
    id: "has-disability-insurance",
    label:
      "Do you now have or are you now applying for any other insurance which provides benefits if you are unable to work because of a disability?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "disability-carrier": {
    id: "disability-carrier",
    label: "Disability Carrier",
    inputType: "text",
    labelVariant: "standard",
  },

  "disability-monthly-benefit": {
    id: "disability-monthly-benefit",
    label: "Monthly Benefit",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "disability-benefit-period": {
    id: "disability-benefit-period",
    label: "Benefit Period",
    inputType: "text",
    labelVariant: "standard",
  },

  "disability-waiting-period": {
    id: "disability-waiting-period",
    label: "Waiting Period",
    inputType: "text",
    labelVariant: "standard",
  },

  "is-replacing-disability-insurance": {
    id: "is-replacing-disability-insurance",
    label:
      "Will this disability coverage replace any other company's coverage?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "disability-replacement-amount": {
    id: "disability-replacement-amount",
    label: "Replacing Amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "floating",
  },

  "total-net-worth": {
    id: "total-net-worth",
    label: "Total Net Worth",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "total-annual-unearned-income": {
    id: "total-annual-unearned-income",
    label: "Total Annual Unearned Income",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "is-self-employed": {
    id: "is-self-employed",
    label: "Are you self-employed?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "is-sole-proprietor": {
    id: "is-sole-proprietor",
    label: "I am a sole proprietor",
    inputType: "checkbox",
  },

  "is-professional-corporation": {
    id: "is-professional-corporation",
    label: "I am part of a professional corporation",
    inputType: "checkbox",
  },

  "sole-proprietor-gross-income": {
    id: "sole-proprietor-gross-income",
    label: "Sole Proprietor Gross Income",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "sole-proprietor-gross-earnings": {
    id: "sole-proprietor-gross-earnings",
    label: "Sole Proprietor Gross Earnings",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "sole-proprietor-business-expenses": {
    id: "sole-proprietor-business-expenses",
    label: "Sole Proprietor Business Expenses",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "professional-corporation-annual-salary": {
    id: "professional-corporation-annual-salary",
    label: "Professional Corporation Annual Salary",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "professional-corporation-s-corp-distribution": {
    id: "professional-corporation-s-corp-distribution",
    label: "Professional Corporation S-Corp Distribution",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "professional-corporation-dividends": {
    id: "professional-corporation-dividends",
    label: "Professional Corporation Dividends",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "professional-corporation-bonus": {
    id: "professional-corporation-bonus",
    label: "Professional Corporation Bonus",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "bonus-payment-frequency": {
    id: "bonus-payment-frequency",
    label: "Bonus Payment Frequency",
    inputType: "radio",
    options: paymentFrequencyOptions,
    labelVariant: "standard",
  },

  "professional-corporation-commission": {
    id: "professional-corporation-commission",
    label: "Professional Corporation Commission",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "commission-payment-frequency": {
    id: "commission-payment-frequency",
    label: "Commission Payment Frequency",
    inputType: "radio",
    options: paymentFrequencyOptions,
    labelVariant: "standard",
  },

  "professional-corporation-benefits-cost": {
    id: "professional-corporation-benefits-cost",
    label: "Professional Corporation Benefits Cost",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "years-self-employed": {
    id: "years-self-employed",
    label: "Years Self-Employed",
    inputType: "number",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "work-from-home": {
    id: "work-from-home",
    label: "Do you work from home?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "has-work-location-outside-home": {
    id: "has-work-location-outside-home",
    label: "Do you have a work location outside your home?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "work-location-details": {
    id: "work-location-details",
    label: "Work Location Details",
    inputType: "text",
    labelVariant: "standard",
    multiline: true,
    minRows: 4,
  },

  "spouse-has-other-life-insurance": {
    id: "spouse-has-other-life-insurance",
    label: "Does your spouse have other life insurance in force?",
    tooltip:
      'If your spouse has life insurance in-force with New York Life or another carrier, select "Yes"',
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "spouse-existing-life-insurance-amount": {
    id: "spouse-existing-life-insurance-amount",
    label: "What is the total amount in all companies?",
    tooltip:
      "You can find your current coverage amount in your recent statement from your carrier.",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "spouse-is-replacing-life-insurance": {
    id: "spouse-is-replacing-life-insurance",
    label:
      "Is the life insurance applied for intended to replace, discontinue or change an existing life insurance policy or annuity contract?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "spouse-has-pending-life-insurance-applications": {
    id: "spouse-has-pending-life-insurance-applications",
    label: "Do you have other life insurance applications pending?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "spouse-pending-life-insurance-amount": {
    id: "spouse-pending-life-insurance-amount",
    label: "Amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "floating",
  },

  "spouse-pending-life-insurance-company": {
    id: "spouse-pending-life-insurance-company",
    label: "Company",
    inputType: "text",
    labelVariant: "floating",
  },

  "spouse-has-disability-insurance": {
    id: "spouse-has-disability-insurance",
    label:
      "Do you now have or are you now applying for any other insurance which provides benefits if you are unable to work because of a disability?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "spouse-disability-carrier": {
    id: "spouse-disability-carrier",
    label: "Spouse Disability Carrier",
    inputType: "text",
    labelVariant: "standard",
  },

  "spouse-monthly-benefit": {
    id: "spouse-monthly-benefit",
    label: "Spouse Monthly Benefit",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
  },

  "spouse-benefit-period": {
    id: "spouse-benefit-period",
    label: "Spouse Benefit Period",
    inputType: "text",
    labelVariant: "standard",
  },

  "spouse-waiting-period": {
    id: "spouse-waiting-period",
    label: "Spouse Waiting Period",
    inputType: "text",
    labelVariant: "standard",
  },

  "spouse-is-replacing-disability-insurance": {
    id: "spouse-is-replacing-disability-insurance",
    label:
      "Will this disability coverage replace any other company's coverage?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
  },

  "spouse-disability-replacement-amount": {
    id: "spouse-disability-replacement-amount",
    label: "Replacing Amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "floating",
  },

  "bank-name-on-account": {
    id: "bank-name-on-account",
    label: "Name on Account",
    inputType: "text",
    required: true,
  },

  "bank-institution": {
    id: "bank-institution",
    label: "Bank Institution",
    inputType: "text",
    required: true,
  },

  "bank-routing-number": {
    id: "bank-routing-number",
    label: "Routing Number",
    inputType: "number",
    required: true,
    inputMode: "numeric",
  },

  "bank-account-number": {
    id: "bank-account-number",
    label: "Account Number",
    inputType: "number",
    required: true,
    inputMode: "numeric",
  },

  "bank-authorization": {
    id: "bank-authorization",
    label: "I authorize recurring payments from this bank account.",
    inputType: "checkbox",
    required: true,
  },

  "review-self-consent": {
    id: "review-self-consent",
    label:
      "I confirm that I have reviewed and understand the above material. I consent to the use of electronic signature and delivery of electronic records.",
    inputType: "checkbox",
    required: true,
  },

  "review-spouse-consent": {
    id: "review-spouse-consent",
    label:
      "I confirm that I have reviewed and understand the above material. I consent to the use of electronic signature and delivery of electronic records.",
    inputType: "checkbox",
    required: true,
  },

  "advisor-flow-type": {
    id: "advisor-flow-type",
    label: "Application Type",
    inputType: "text",
  },

  "advisor-email": {
    id: "advisor-email",
    label: "Advisor Email",
    inputType: "text",
    required: true,
    format: "email",
    autoComplete: "email",
    inputMode: "email",
  },

  "advisor-phone": {
    id: "advisor-phone",
    label: "Advisor Phone Number",
    inputType: "text",
    required: true,
    format: "phone",
    autoComplete: "tel",
    inputMode: "tel",
    showPhoneTypeSelector: false,
  },

  "advisor-code": {
    id: "advisor-code",
    label: "Advisor Code",
    inputType: "text",
    required: true,
  },

  "applicant-email": {
    id: "applicant-email",
    label: "Applicant Email",
    inputType: "text",
    required: true,
    format: "email",
    autoComplete: "email",
    inputMode: "email",
    helperText: "Enter the applicant email used to start the application.",
  },
};

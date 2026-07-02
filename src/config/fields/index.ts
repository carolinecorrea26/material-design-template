import type { FieldDefinition, FieldId } from "./types";
import { waepaFederalAgencyOptions } from "./waepaFederalAgencyOptions";

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

  "waepa-declaration": {
    id: "waepa-declaration",
    inputType: "checkbox",
    label:
      "By submitting this application, I attest that the answers to the questions herein are true.",
    required: true,
  },

  "waepa-attestation": {
    id: "waepa-attestation",
    inputType: "dropdown",
    labelVariant: "standard",
    label:
      "I hereby attest that I am a U.S. citizen and meet one of the following qualifications:",
    placeholder: "Select one",
    required: true,
    options: [
      {
        label:
          "I am a civilian federal employee of the U.S. government actively at work",
        value: "federal-active",
      },
      {
        label: "I am a retired civilian federal annuitant",
        value: "federal-annuitant",
      },
      {
        label: "I am a former federal employee",
        value: "former-federal",
      },
      {
        label:
          "I am a spouse of a WAEPA member and want to apply as an Associate member",
        value: "spouse-associate",
      },
      {
        label:
          "I am an adult child of a WAEPA member and want to apply as an Associate member",
        value: "child-associate",
      },
    ],
  },

  "waepa-employer": {
    id: "waepa-employer",
    inputType: "searchable-select",
    label: "I am employed by",
    placeholder: "Search or select agency",
    required: true,
    options: waepaFederalAgencyOptions,
  },

  "waepa-start-date": {
    id: "waepa-start-date",
    inputType: "date",
    label: "Start Date",
    required: true,
  },

  "waepa-retired-employer": {
    id: "waepa-retired-employer",
    inputType: "searchable-select",
    label: "I was employed by",
    placeholder: "Search or select agency",
    required: true,
    options: waepaFederalAgencyOptions,
  },

  "waepa-retirement-date": {
    id: "waepa-retirement-date",
    inputType: "date",
    label: "Retirement Date",
    required: true,
  },

  "waepa-member-first-name": {
    id: "waepa-member-first-name",
    label: "Member First Name",
    inputType: "text",
    required: true,
    autoComplete: "given-name",
  },

  "waepa-member-last-name": {
    id: "waepa-member-last-name",
    label: "Member Last Name",
    inputType: "text",
    required: true,
    autoComplete: "family-name",
  },

  "waepa-member-id": {
    id: "waepa-member-id",
    label: "WAEPA Member ID",
    inputType: "text",
    required: false,
  },

  "avma-vet-college": {
    id: "avma-vet-college",
    label: "What veterinary college did you attend?",
    // labelVariant: "standard",
    inputType: "text",
    required: true,
  },

  "avma-graduation-year": {
    id: "avma-graduation-year",
    label: "Year of Graduation",
    inputType: "text",
    required: true,
    placeholder: "YYYY",
    inputMode: "numeric",
  },

  "avma-occupation": {
    id: "avma-occupation",
    label: "Occupation",
    inputType: "text",
    required: true,
    helperText:
      "Please specify type of practice or other occupation if not practicing.",
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

  "spouse-membership": {
    id: "spouse-membership",
    label: "Is your spouse also an active member?",
    inputType: "radio",
    required: true,
    options: yesNoOptions,
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
    autoComplete: "address-level1",
  },

  "zip-code": {
    id: "zip-code",
    label: "Zip / Postal Code",
    inputType: "text",
    required: true,
    inputMode: "numeric",
    autoComplete: "postal-code",
  },

  "correspondence-to": {
    id: "correspondence-to",
    label: "Where should we send correspondence regarding your application?",
    inputType: "radio",
    required: true,
    options: [
      { value: "residential", label: "Home Address" },
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
    label: "Height (Feet)",
    inputType: "number",
    inputMode: "numeric",
    required: true,
  },

  "height-inches": {
    id: "height-inches",
    label: "Inches",
    inputType: "number",
    inputMode: "numeric",
    required: true,
  },

  "weight-lbs": {
    id: "weight-lbs",
    label: "Weight (lbs.)",
    inputType: "number",
    inputMode: "numeric",
    required: true,
  },

  "weight-12-months-ago-lbs": {
    id: "weight-12-months-ago-lbs",
    label: "Weight 12 Mos. Ago",
    inputType: "number",
    inputMode: "numeric",
    required: true,
  },

  "social-security-number": {
    id: "social-security-number",
    label: "Social Security Number",
    inputType: "text",
    placeholder: "XXX-XX-XXXX",
    format: "ssn",
    inputMode: "numeric",
    autoComplete: "off",
    required: true,
  },

  "marital-status": {
    id: "marital-status",
    label: "Marital Status",
    inputType: "dropdown",
    placeholder: "Select",
    required: true,
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
    required: true,
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
    required: true,
  },

  "drivers-license-state": {
    id: "drivers-license-state",
    label: "Driver's License State",
    inputType: "dropdown",
    placeholder: "Select",
    required: true,
    options: usStateOptions,
  },

  "intend-live-outside-us": {
    id: "intend-live-outside-us",
    label: "Do you intend to live outside the United States?",
    inputType: "radio",
    required: true,
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
    required: true,
  },

  "outside-us-country": {
    id: "outside-us-country",
    label: "Country",
    inputType: "dropdown",
    placeholder: "Select",
    required: true,
    options: countryOptions,
  },

  "travel-outside-us-six-months": {
    id: "travel-outside-us-six-months",
    label: "Will you travel outside the U.S. for 6+ months in the next year?",
    inputType: "radio",
    required: true,
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
    required: true,
    options: countryOptions,
  },

  "spouse-height-feet": {
    id: "spouse-height-feet",
    label: "Height (Feet)",
    inputType: "number",
    inputMode: "numeric",
    required: true,
  },

  "spouse-height-inches": {
    id: "spouse-height-inches",
    label: "Inches",
    inputType: "number",
    inputMode: "numeric",
    required: true,
  },

  "spouse-weight-lbs": {
    id: "spouse-weight-lbs",
    label: "Weight (lbs.)",
    inputType: "number",
    inputMode: "numeric",
    required: true,
  },

  "spouse-weight-12-months-ago-lbs": {
    id: "spouse-weight-12-months-ago-lbs",
    label: "Weight 12 Mos. Ago",
    inputType: "number",
    inputMode: "numeric",
    required: true,
  },

  "spouse-social-security-number": {
    id: "spouse-social-security-number",
    label: "Social Security Number",
    inputType: "text",
    placeholder: "XXX-XX-XXXX",
    format: "ssn",
    inputMode: "numeric",
    autoComplete: "off",
    required: true,
  },

  "spouse-has-drivers-license": {
    id: "spouse-has-drivers-license",
    label: "Does your spouse have a valid driver's license?",
    inputType: "radio",
    required: true,
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
    required: true,
  },

  "spouse-drivers-license-state": {
    id: "spouse-drivers-license-state",
    label: "Spouse Driver's License State",
    inputType: "dropdown",
    placeholder: "Select",
    required: true,
    options: usStateOptions,
  },

  "spouse-intend-live-outside-us": {
    id: "spouse-intend-live-outside-us",
    label:
      "Does your spouse intend to reside outside the U.S. or Canada within the next 12 months?",
    inputType: "radio",
    required: true,
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
    required: true,
  },

  "spouse-outside-us-country": {
    id: "spouse-outside-us-country",
    label: "Country",
    inputType: "dropdown",
    placeholder: "Select",
    required: true,
    options: countryOptions,
  },

  "spouse-travel-outside-us-six-months": {
    id: "spouse-travel-outside-us-six-months",
    label:
      "Does your spouse intend to travel outside the U.S. or Canada within the next 12 months?",
    inputType: "radio",
    required: true,
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
    required: true,
    options: countryOptions,
  },

  "spouse-physician-first-name": {
    id: "spouse-physician-first-name",
    label: "Physician First Name",
    inputType: "text",
    autoComplete: "off",
  },

  "spouse-physician-last-name": {
    id: "spouse-physician-last-name",
    label: "Physician Last Name",
    inputType: "text",
    autoComplete: "off",
  },

  "spouse-physician-phone": {
    id: "spouse-physician-phone",
    label: "Physician Phone Number",
    inputType: "text",
    format: "phone",
    inputMode: "tel",
    autoComplete: "off",
    showPhoneTypeSelector: false,
  },

  "spouse-medical-facility-name": {
    id: "spouse-medical-facility-name",
    label: "Medical Facility Name",
    inputType: "text",
    autoComplete: "organization",
  },

  "spouse-medical-facility-street-address": {
    id: "spouse-medical-facility-street-address",
    label: "Street Address",
    inputType: "text",
    autoComplete: "street-address",
  },

  "spouse-medical-facility-apt-suite": {
    id: "spouse-medical-facility-apt-suite",
    label: "Apt/Suite",
    inputType: "text",
    autoComplete: "address-line2",
  },

  "spouse-medical-city": {
    id: "spouse-medical-city",
    label: "City",
    inputType: "text",
    autoComplete: "address-level2",
  },

  "spouse-medical-state": {
    id: "spouse-medical-state",
    label: "State",
    inputType: "dropdown",
    placeholder: "Select",
    options: usStateOptions,
  },

  "spouse-medical-zip-code": {
    id: "spouse-medical-zip-code",
    label: "Zip Code",
    inputType: "text",
    inputMode: "numeric",
    autoComplete: "postal-code",
  },

  "has-other-life-insurance": {
    id: "has-other-life-insurance",
    label: "Do you have other life insurance in force?",
    helperText:
      'If you have life insurance in-force with New York Life or another carrier, select "Yes"',
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "existing-life-insurance-amount": {
    id: "existing-life-insurance-amount",
    label: "Total life insurance amount",
    helperText:
      "You can find your current coverage amount in your recent statement from your carrier.",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "is-replacing-life-insurance": {
    id: "is-replacing-life-insurance",
    label:
      "Is the life insurance applied for intended to replace, discontinue, or change an existing life insurance policy or annuity contract?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "has-pending-life-insurance-applications": {
    id: "has-pending-life-insurance-applications",
    label: "Do you have other life insurance applications pending?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "pending-life-insurance-amount": {
    id: "pending-life-insurance-amount",
    label: "Amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "floating",
    required: true,
  },

  "pending-life-insurance-company": {
    id: "pending-life-insurance-company",
    label: "Company",
    inputType: "text",
    labelVariant: "floating",
    required: true,
  },

  "has-disability-insurance": {
    id: "has-disability-insurance",
    label:
      "Do you now have or are you now applying for any other insurance which provides benefits if you are unable to work because of a disability?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "disability-carrier": {
    id: "disability-carrier",
    label: "Company",
    inputType: "text",
    labelVariant: "standard",
    required: true,
  },

  "disability-monthly-benefit": {
    id: "disability-monthly-benefit",
    label: "Monthly benefit amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "disability-benefit-period": {
    id: "disability-benefit-period",
    label: "Benefit period",
    inputType: "text",
    labelVariant: "standard",
    required: true,
  },

  "disability-waiting-period": {
    id: "disability-waiting-period",
    label: "Waiting period",
    inputType: "text",
    labelVariant: "standard",
    required: true,
  },

  "is-replacing-disability-insurance": {
    id: "is-replacing-disability-insurance",
    label:
      "Will this disability coverage replace any other company's coverage?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "disability-replacement-amount": {
    id: "disability-replacement-amount",
    label: "Replacement amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "floating",
    required: true,
  },

  "total-net-worth": {
    id: "total-net-worth",
    label: "Total net worth (Assets minus liabilities)",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "total-annual-unearned-income": {
    id: "total-annual-unearned-income",
    label: "Total annual unearned income",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "is-self-employed": {
    id: "is-self-employed",
    label: "Are you self-employed?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "is-sole-proprietor": {
    id: "is-sole-proprietor",
    label: "Sole Proprietor or Partner",
    inputType: "checkbox",
  },

  "is-professional-corporation": {
    id: "is-professional-corporation",
    label: "Professional Corporation",
    inputType: "checkbox",
  },

  "sole-proprietor-gross-income": {
    id: "sole-proprietor-gross-income",
    label: "Annual gross revenue",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "sole-proprietor-gross-earnings": {
    id: "sole-proprietor-gross-earnings",
    label: "Annual net income after business expenses",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "sole-proprietor-business-expenses": {
    id: "sole-proprietor-business-expenses",
    label: "Business expenses",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "professional-corporation-annual-salary": {
    id: "professional-corporation-annual-salary",
    label: "Annual salary",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "professional-corporation-s-corp-distribution": {
    id: "professional-corporation-s-corp-distribution",
    label: "S-Corp distribution",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "professional-corporation-dividends": {
    id: "professional-corporation-dividends",
    label: "Dividends",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "professional-corporation-bonus": {
    id: "professional-corporation-bonus",
    label: "Bonus amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "bonus-payment-frequency": {
    id: "bonus-payment-frequency",
    label: "Bonus payment frequency",
    inputType: "radio",
    options: paymentFrequencyOptions,
    labelVariant: "standard",
    required: true,
  },

  "professional-corporation-commission": {
    id: "professional-corporation-commission",
    label: "Commission amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "commission-payment-frequency": {
    id: "commission-payment-frequency",
    label: "Commission payment frequency",
    inputType: "radio",
    options: paymentFrequencyOptions,
    labelVariant: "standard",
    required: true,
  },

  "professional-corporation-benefits-cost": {
    id: "professional-corporation-benefits-cost",
    label: "Employer-paid benefits cost",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "years-self-employed": {
    id: "years-self-employed",
    label: "Years self-employed",
    inputType: "number",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "work-from-home": {
    id: "work-from-home",
    label: "Do you work from home?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "has-work-location-outside-home": {
    id: "has-work-location-outside-home",
    label: "Do you have a work location outside your home?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "work-location-details": {
    id: "work-location-details",
    label: "Please explain where you work outside your home",
    inputType: "text",
    labelVariant: "standard",
    multiline: true,
    minRows: 4,
    required: true,
  },

  "spouse-has-other-life-insurance": {
    id: "spouse-has-other-life-insurance",
    label: "Does your spouse have other life insurance in force?",
    helperText:
      'If your spouse has life insurance in-force with New York Life or another carrier, select "Yes"',
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "spouse-existing-life-insurance-amount": {
    id: "spouse-existing-life-insurance-amount",
    label: "Total life insurance amount",
    helperText:
      "You can find your current coverage amount in your recent statement from your carrier.",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "spouse-is-replacing-life-insurance": {
    id: "spouse-is-replacing-life-insurance",
    label:
      "Is the life insurance applied for intended to replace, discontinue, or change an existing life insurance policy or annuity contract?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "spouse-has-pending-life-insurance-applications": {
    id: "spouse-has-pending-life-insurance-applications",
    label: "Does your spouse have other life insurance applications pending?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "spouse-pending-life-insurance-amount": {
    id: "spouse-pending-life-insurance-amount",
    label: "Amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "floating",
    required: true,
  },

  "spouse-pending-life-insurance-company": {
    id: "spouse-pending-life-insurance-company",
    label: "Company",
    inputType: "text",
    labelVariant: "floating",
    required: true,
  },

  "spouse-has-disability-insurance": {
    id: "spouse-has-disability-insurance",
    label:
      "Does your spouse now have or is your spouse now applying for any other insurance which provides benefits if they are unable to work because of a disability?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "spouse-disability-carrier": {
    id: "spouse-disability-carrier",
    label: "Company",
    inputType: "text",
    labelVariant: "standard",
    required: true,
  },

  "spouse-monthly-benefit": {
    id: "spouse-monthly-benefit",
    label: "Monthly benefit amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "standard",
    required: true,
  },

  "spouse-benefit-period": {
    id: "spouse-benefit-period",
    label: "Benefit period",
    inputType: "text",
    labelVariant: "standard",
    required: true,
  },

  "spouse-waiting-period": {
    id: "spouse-waiting-period",
    label: "Waiting period",
    inputType: "text",
    labelVariant: "standard",
    required: true,
  },

  "spouse-is-replacing-disability-insurance": {
    id: "spouse-is-replacing-disability-insurance",
    label:
      "Will this disability coverage replace any other company's coverage?",
    inputType: "radio",
    options: yesNoOptions,
    labelVariant: "standard",
    required: true,
  },

  "spouse-disability-replacement-amount": {
    id: "spouse-disability-replacement-amount",
    label: "Replacement amount",
    inputType: "text",
    format: "currency",
    inputMode: "numeric",
    labelVariant: "floating",
    required: true,
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

    label: "Email",
    inputType: "text",
    required: true,
    format: "email",
    autoComplete: "email",
    inputMode: "email",
    // helperText:
    //   "Receives status updates and verifies your identity when resuming a saved application.",
  },

  "advisor-phone": {
    id: "advisor-phone",

    label: "Phone Number",
    inputType: "text",
    required: true,
    format: "phone",
    autoComplete: "tel",
    inputMode: "tel",
    showPhoneTypeSelector: false,
    // helperText: "Verifies your identity when resuming a saved application.",
  },

  "advisor-code": {
    id: "advisor-code",
    label: "Code",
    inputType: "text",
    required: true,
    // helperText: "Your assigned advisor code.",
  },

  "applicant-email": {
    id: "applicant-email",
    label: "Applicant Email",
    inputType: "text",
    required: true,
    format: "email",
    autoComplete: "email",
    inputMode: "email",
    helperText: "The applicant's email that was used to begin the application.",
  },

  "resume-email": {
    id: "resume-email",
    label: "Email",
    inputType: "text",
    required: true,
    format: "email",
    autoComplete: "email",
    inputMode: "email",
  },

  "resume-security-code": {
    id: "resume-security-code",
    label: "Security Code",
    inputType: "text",
    required: true,
    inputMode: "numeric",
  },
};

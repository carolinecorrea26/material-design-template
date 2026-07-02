import type { ClientConfig } from "./types";

export const avmaClient: ClientConfig = {
  id: "avma",
  branding: {
    name: "American Veterinary Medical Association",
    acronym: "AVMA",
    logo: "/client/avma/logo.png",
    logoAlt: "AVMA Logo",
  },
  support: {
    phone: "8002287548",
    phoneDisplay: "(800) 228-7548",
    email: "support@avmainsuranceservices.com",
    website: "https://AVMAInsuranceServices.com",
    address: {
      street: "1200 E. Glen Avenue",
      city: "Peoria Heights",
      state: "Illinois",
      zip: "61616",
    },
  },
  pages: {
    excluded: [],
    optional: ["beneficiary", "payment"],
  },
  coverages: {
    categories: ["LI", "AD", "DI", "OO", "SH"],
    enabled: [
      "li-group-term",
      "li-10yr",
      "li-20yr",
      "li-50plus",
      "li-add",
      "di-ltd",
      "di-short-term",
      "di-ltd-plus",
      "li-term",
      "oo-professional",
      "sh-hospital-income",
      "sh-critical-illness",
    ],
    ranges: {
      "li-group-term": { min: 50000, max: 500000 },
      "li-10yr": { min: 50000, max: 500000 },
      "li-20yr": { min: 50000, max: 1000000 },
      "li-50plus": { min: 25000, max: 300000 },
      "li-add": { min: 50000, max: 1000000 },
      "di-ltd": { min: 1000, max: 10000 },
      "di-short-term": { min: 500, max: 5000 },
      "di-ltd-plus": { min: 500, max: 3000 },
      "li-term": { min: 25000, max: 250000 },
      "oo-professional": { min: 1000, max: 10000 },
      "sh-hospital-income": { min: 500, max: 3000 },
      "sh-critical-illness": { min: 10000, max: 75000 },
    },
    overrides: {
      "li-group-term": {
        name: "Family Group Life Insurance",
        featured: true,
        underwritingType: "QD",
        applicantNotes: {
          member:
            "New applicants must apply for a minimum of $100,000 in Family Group Life (FGL) coverage. Lower benefit amounts are available to existing FGL insureds only.",
        },
      },
      "li-10yr": {
        name: "10-Year Level Term Life Insurance",
        underwritingType: "QD",
      },
      "li-20yr": {
        name: "20-Year Level Term Life Insurance",
        underwritingType: "QD",
      },
      "li-50plus": {
        name: "45+ Term Life Advanced Insurance",
        underwritingType: "GI",
      },
      "li-add": {
        name: "Large Scale Accidental Death and Dismemberment Insurance",
        underwritingType: "NA",
      },
      "di-ltd": {
        name: "Long-Term Disability Insurance",
        applicants: ["member", "spouse"],
        waitingPeriodOptions: [
          { label: "90 days", value: "90", days: 90 },
          { label: "180 days", value: "180", days: 180 },
        ],
        applicantNotes: {
          member:
            "Your cost is based on your age when coverage is approved. Renewal charges do not increase with age.",
        },
      },
      "di-short-term": {
        name: "Short-Term Disability Insurance",
        applicants: ["member"],
        waitingPeriodOptions: [
          { label: "30 days", value: "30", days: 30 },
          { label: "60 days", value: "60", days: 60 },
        ],
      },
      "di-ltd-plus": {
        name: "Student Loan Disability Insurance (Supplemental Disability)",
        applicants: ["member"],
        waitingPeriodOptions: [
          { label: "90 days", value: "90", days: 90 },
          { label: "180 days", value: "180", days: 180 },
        ],
        applicantNotes: {
          member:
            "All applicants are required to provide written details of each student loan by downloading and completing the loan information form (https://avmainsuranceservices.com/Downloads/AVMA/Applications/AVMA-SC-APP-LOAN-FORM.pdf). Proof of monthly loan repayment obligation (financial statement) is required for all outstanding student loans as described on the form and in the coverage brochure.",
        },
      },
      "li-term": {
        name: "Basic Protection Package",
        categoryId: "DI",
        applicantNotes: {
          member:
            "To add this package, you must apply now, or already be insured, for a minimum of $1,000 in Long-Term Disability Insurance through AVMA LIFE.",
        },
      },
      "oo-professional": {
        name: "Professional Overhead Expense Insurance",
        waitingPeriodOptions: [
          { label: "30 days", value: "30", days: 30 },
          { label: "60 days", value: "60", days: 60 },
          { label: "90 days", value: "90", days: 90 },
        ],
        maxBenefitPeriodOptions: [
          { label: "12 months", value: "12" },
          { label: "24 months", value: "24" },
        ],
        applicantNotes: {
          member:
            'The maximum monthly benefit available through New York Life is based on your attained age on the effective date after New York Life approves your request for coverage: $45,000 for members under age 50; $30,000 for members age 50 through age 59; and $10,000 for members age 60 through age 69. The maximum monthly benefit shown below is the lesser of the policy maximum or the maximum available based on your personal share of eligible expenses. (See coverage details for a listing of eligible expenses.) "Personal share" is defined as (a) your percentage of ownership of the business, or (b) your share of the office space if a joint tenant. Benefits payable from this coverage will not exceed the lesser of the average eligible expenses incurred or the monthly benefit level in force.',
        },
      },
      "sh-hospital-income": {
        name: "Hospital Indemnity Insurance",
        productWarning: {
          severity: "warning",
          title:
            "THIS COVERAGE IS A SUPPLEMENT TO HEALTH INSURANCE AND IS NOT A SUBSTITUTE FOR MAJOR MEDICAL COVERAGE.",
          message:
            "Daily Benefits for hospitalizations due to pregnancy, childbirth, or related medical condition (except complications of pregnancy), will not be payable unless such confinement begins after the proposed insured has been continuously insured for 12 months.",
        },
        productContent: [
          { type: "heading", text: "IMPORTANT: This is a fixed indemnity policy," },
          { type: "heading", text: "NOT health insurance" },
          {
            type: "paragraph",
            text: "This fixed indemnity policy may pay you a limited dollar amount if you're sick or hospitalized. You're still responsible for paying the cost of your care.",
          },
          {
            type: "list",
            items: [
              "The payment you get isn't based on the size of your medical bill.",
              "There might be a limit on how much this policy will pay each year.",
              "This policy isn't a substitute for comprehensive health insurance.",
              "Since this policy isn't health insurance, it doesn't have to include most Federal consumer protections that apply to health insurance.",
            ],
          },
          {
            type: "section",
            heading: "Looking for comprehensive health insurance?",
            body: [
              "Visit HealthCare.gov or call 1-800-318-2596 (TTY: 1-855-889-4325) to find health coverage options.",
              "To find out if you can get health insurance through your job, or a family member's job, contact the employer.",
            ],
          },
          {
            type: "section",
            heading: "Questions about this policy?",
            body: [
              "For questions or complaints about this policy, contact your State Department of Insurance. Find their number on the National Association of Insurance Commissioners' website (naic.org) under \"Insurance Departments.\"",
              "If you have this policy through your job, or a family member's job, contact the employer.",
            ],
          },
        ],
      },
      "sh-critical-illness": {
        name: "Critical Illness Insurance",
      },
    },
    descriptions: {
      "li-group-term":
        "Annually renewable coverage designed to provide protection for both you and your family.",
      "li-10yr":
        "This coverage helps you plan today for the next decade, with no scheduled increases in premium for the initial 10 years of coverage.",
      "li-20yr":
        "A good fit for those in their 30s and 40s with premiums that are expected to remain level for the initial 20 years you are insured.",
      "li-add":
        "Life after a terrible accident is never easy, but its aftermath can be a little more manageable with the right amount of financial protection. This coverage can help you and your family with financial support if you suffer a loss resulting from a covered accident.",
      "di-ltd":
        "Protection for your income if you are disabled from a covered accident or illness.",
      "di-short-term":
        "Disabilities that last less than six months can cause a severe financial hardship. This coverage can protect you for up to six months if you are out of work due to a covered disability. Includes coverage for disabilities resulting from routine pregnancy and delivery after you have been continuously insured for 12 months.",
      "di-ltd-plus":
        "Can help you pay for your student loans if you suffer a covered disability. Payments are made directly to you.",
      "li-term":
        "This package includes: Decreasing Term Life Insurance, Accidental Death & Dismemberment Insurance, and Rabies Prophylaxis Benefits.",
      "oo-professional":
        "As a veterinarian, you may elect to own your own business or work independently. This coverage can help keep your business open while you are unable to work due to a covered disability.",
      "sh-hospital-income":
        "Helps provide extra financial support if you're hospitalized due to a covered illness or injury.",
    },
  },
  fields: {},
  features: {
    homePageVariant: "welcome-back",
  },
  coverageQuestions: {
    always: [
      "selfCoverageQuestions",
      "selfCoverageTobacco",
      "selfCoverageWorkIncome",
      "spouseCoverageQuestions",
      "spouseCoverageTobacco",
      "spouseCoverageWorkIncome",
    ],
    OO: ["selfCoverageBusinessExpenses", "selfCoverageOfficeEmployees"],
  },
  licenseInfo: [
    "Arkansas Insurance License: #1322",
    "California Insurance License: #0F76076",
  ],
};

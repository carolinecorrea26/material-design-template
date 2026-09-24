import type { ClientConfig } from "./types";
import { rangeAssignments } from "../coverages/amounts";

const chatUrl =
  "https://app.five9.com/clients/consoles/ChatConsole/index.html?title=Chat&tenant=Pearl%20Insurance&profiles=ASCE%20-%20Current%2CASCE%20-%20New%20or%20Additional&showProfiles=true&autostart=true&profileLabel=Are%20you%20looking%20for%20help%20with%20Current%20or%20New%2FAdditional%20coverage%3F&theme=default-theme.css&surveyOptions=%7B%22showComment%22%3Afalse%2C%22requireComment%22%3Afalse%7D&fields=%7B%22name%22%3A%7B%22value%22%3A%22Chat%20User%22%2C%22show%22%3Afalse%2C%22label%22%3A%22Name%22%7D%2C%22email%22%3A%7B%22value%22%3A%22%22%2C%22show%22%3Atrue%2C%22label%22%3A%22Email%22%7D%2C%22Chat.First_Name%22%3A%7B%22value%22%3A%22%22%2C%22show%22%3Atrue%2C%22label%22%3A%22First%20Name%22%2C%22required%22%3Atrue%7D%2C%22Chat.Last_Name%22%3A%7B%22value%22%3A%22%22%2C%22show%22%3Atrue%2C%22label%22%3A%22Last%20Name%22%2C%22required%22%3Atrue%7D%2C%22UserLocale%22%3A%7B%22value%22%3A%22en%22%2C%22show%22%3Afalse%7D%7D&playSoundOnMessage=true&allowCustomerToControlSoundPlay=false&showEmailButton=false&hideDuringAfterHours=true&useBusinessHours=false&showPrintButton=true&allowUsabilityMenu=false&enableCallback=false&allowRequestLiveAgent=false&namespace=asceinsurance.com&ga=G-XYD9Q953HL";

export const asceClient: ClientConfig = {
  id: "asce",
  theme: { type: "preset", preset: "default" },
  branding: {
    name: "American Society of Civil Engineers",
    acronym: "ASCE",
    logo: "/client/asce/logo.png",
    logoAlt: "American Society of Civil Engineers logo",
  },
  support: {
    phone: "8885547255",
    phoneDisplay: "888.554.7255",
    phoneHours: "M-F 8:00am-5:00pm CST",
    email: "customerservice@asceinsurance.com",
    website: "asceinsurance.com",
    address: {
      organization: "Pearl Insurance",
      street: "1200 E. Glen Avenue",
      city: "Peoria Heights",
      state: "Illinois",
      zip: "61616",
    },
  },
  pages: {
    requirements: {
      beneficiary: "required",
      payment: "required",
    },
  },
  applicantClassifications: [
    { id: "associate-member", label: "Associate Member", applicantType: "member" },
    { id: "retired-member", label: "Retired Member", applicantType: "member" },
  ],
  coverages: {
    categories: ["LI", "AD", "DI"],
    enabled: ["li-term", "li-10yr", "li-20yr", "li-add", "di-ltd"],
    coverageAmounts: {
      "li-term": rangeAssignments({
        member: [0, 1000000, 10000],
        spouse: [0, 1000000, 10000],
        child: [10000, 10000, 1],
      }),
      "li-10yr": rangeAssignments({
        member: [100000, 2000000, 10000],
        spouse: [100000, 2000000, 10000],
        child: [10000, 10000, 1],
      }),
      "li-20yr": rangeAssignments({
        member: [100000, 2000000, 10000],
        spouse: [100000, 2000000, 10000],
        child: [10000, 10000, 1],
      }),
      "li-add": rangeAssignments({
        member: [50000, 500000, 10000],
        spouse: [50000, 250000, 10000],
        child: [10000, 10000, 1],
      }),
      "di-ltd": rangeAssignments({
        member: [150, 8550, 50],
        spouse: [500, 500, 1],
      }),
    },
    overrides: {
      "li-term": {
        name: "Group Term Life Insurance",
        gNumber: { primary: "G-10500-1" },
        planCode: { primary: "101" },
        brochureUrl:
          "https://asceinsurance.com/Downloads/ASCE/brochures/ASCE-Term-Life-Brochure.pdf",
        underwritingType: "QD",
        applicants: ["member", "spouse", "child"],
        riders: [
          {
            id: "cir",
            name: "Chronic Illness Rider (CIR)",
            description:
              "Chronic illness coverage from $50,000 to $1,000,000 for members and $25,000 to $1,000,000 for spouses.",
            hasAmount: true,
            coverageAmounts: rangeAssignments({
              member: [50000, 1000000, 10000],
              spouse: [25000, 1000000, 10000],
            }),
            applicants: ["member", "spouse"],
            premiumFactor: 0.05,
          },
        ],
      },
      "li-10yr": {
        name: "Group 10-Year Level Term Life Insurance",
        gNumber: { primary: "G-29137-0" },
        planCode: { primary: "102" },
        brochureUrl:
          "https://asceinsurance.com/Downloads/ASCE/brochures/ASCE-10-or-20-Year-Level-Term-Life-Brochure.pdf",
        underwritingType: "QD",
        applicants: ["member", "spouse", "child"],
      },
      "li-20yr": {
        name: "Group 20-Year Level Term Life Insurance",
        gNumber: { primary: "G-29253-0" },
        planCode: { primary: "121" },
        brochureUrl:
          "https://asceinsurance.com/Downloads/ASCE/brochures/ASCE-10-or-20-Year-Level-Term-Life-Brochure.pdf",
        underwritingType: "QD",
        applicants: ["member", "spouse", "child"],
      },
      "li-add": {
        name: "High-Limit Death and Dismemberment Insurance",
        brochureUrl:
          "https://asceinsurance.com/Downloads/ASCE/brochures/ASCE-HLA-Brochure.pdf",
        underwritingType: "GI",
        applicants: ["member", "spouse", "child"],
      },
      "di-ltd": {
        name: "Group Disability Income Insurance",
        brochureUrl:
          "https://asceinsurance.com/Downloads/ASCE/brochures/ASCE-DI-Brochure.pdf",
        // ASCE's "UW" designation maps to the prototype's full-underwriting type.
        underwritingType: "FUW",
        applicants: ["member", "spouse"],
        waitingPeriodOptionsByApplicant: {
          member: [
            { label: "30 days", value: "30", days: 30 },
            { label: "90 days", value: "90", days: 90 },
            { label: "180 days", value: "180", days: 180 },
            { label: "365 days", value: "365", days: 365 },
          ],
          spouse: [{ label: "30 days", value: "30", days: 30 }],
        },
        maxBenefitPeriodOptionsByApplicant: {
          member: [
            { label: "Option A: Five-Year Plan", value: "five-year" },
            { label: "Option B: Career Plan", value: "career" },
          ],
          spouse: [{ label: "2 years", value: "spouse-two-years" }],
        },
        applicantNotes: {
          member:
            "Waiting period options: 30, 90, 180, or 365 days. Benefit options: Option A (Five-Year Plan) or Option B (Career Plan).",
          spouse:
            "Spouse coverage is $500 with a 30-day waiting period and a 2-year benefit option.",
        },
      },
    },
  },
  fields: {
    coverage: {
      hidden: ["average-employees-6-months"],
    },
  },
  features: {
    chat: true,
    chatUrl,
  },
  licenseInfo: [
    "CA Agency License # 0F76076",
    "AR Agency License # 100106280",
  ],
};

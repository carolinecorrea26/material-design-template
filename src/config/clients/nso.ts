import type { ClientConfig } from "./types";

export const nsoClient: ClientConfig = {
  id: "nso",
  themeColor: "teal",
  branding: {
    name: "Nurses Services Organization",
    acronym: "NSO",
    logo: "/client/nso/logo.png",
    logoAlt: "NSO Logo",
  },
  support: {
    phone: "8005417644",
    phoneDisplay: "(800) 541-7644",
    phoneHours: "M-F 7:30am–4:00pm CT",
    email: "service@nso.com",
    website: "www.nso.com",
    address: {
      street: "1100 Virginia Drive, Suite 250",
      city: "Fort Washington",
      state: "Pennsylvania",
      zip: "19034",
    },
  },
  pages: {
    requirements: {
      beneficiary: "required",
      payment: "required",
    },
  },
  coverages: {
    categories: ["LI", "AD", "DI"],
    enabled: ["li-term", "li-10yr", "li-20yr", "li-50plus", "li-add", "di-ltd"],
    ranges: {
      "li-term": { min: 50000, max: 500000 },
      "li-10yr": { min: 50000, max: 500000 },
      "li-20yr": { min: 50000, max: 1000000 },
      "li-50plus": { min: 25000, max: 250000 },
      "li-add": { min: 25000, max: 500000 },
      "di-ltd": { min: 1000, max: 5000 },
    },
    overrides: {
      "li-term": {
        featured: true,
        underwritingType: "QD",
      },
      "li-10yr": {
        underwritingType: "QD",
      },
      "li-20yr": {
        underwritingType: "QD",
      },
      "di-ltd": {
        applicants: ["member", "spouse"],
        waitingPeriodOptions: [
          { label: "90 days", value: "90", days: 90 },
          { label: "180 days", value: "180", days: 180 },
        ],
      },
    },
  },
  fields: {
    coverage: {
      hidden: ["average-employees-6-months"],
    },
  },
  features: {
    homePageVariant: "welcome-back",
  },
  licenseInfo: [
    "CA Insurance License: #OH62489",
    "AR Insurance License: #94726",
  ],
};

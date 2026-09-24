import type { ClientConfig } from "./types";
import { rangeAssignments } from "../coverages/amounts";

export const nsoClient: ClientConfig = {
  id: "nso",
  theme: { type: "preset", preset: "teal" },
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
    coverageAmounts: {
      "li-term": rangeAssignments({ member: [50000, 500000] }),
      "li-10yr": rangeAssignments({ member: [50000, 500000] }),
      "li-20yr": rangeAssignments({ member: [50000, 1000000] }),
      "li-50plus": rangeAssignments({ member: [25000, 250000] }),
      "li-add": rangeAssignments({ member: [25000, 500000] }),
      "di-ltd": rangeAssignments({ member: [1000, 5000] }),
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

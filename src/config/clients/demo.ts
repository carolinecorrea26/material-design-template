import type { ClientConfig } from "./types";
import { rangeAssignments } from "../coverages/amounts";

export const demoClient: ClientConfig = {
  id: "demo",
  theme: { type: "preset", preset: "default" },
  branding: {
    name: "Demo Client",
    acronym: "DEMO",
    logo: "/client/demo/logo.svg",
    logoAlt: "Demo Client logo",
  },
  support: {
    phone: "800-000-0000",
    phoneDisplay: "800-000-0000",
    phoneHours: "Mon–Fri, 8am–6pm ET",
    email: "support@demo.com",
    website: "www.demo.com",
    address: {
      street: "123 Demo Street",
      city: "Demo City",
      state: "Demo State",
      zip: "00000",
    },
  },
  pages: {
    requirements: {
      beneficiary: "required",
      payment: "required",
    },
  },
  coverages: {
    categories: ["LI", "AD", "DI", "OO", "SH"],
    enabled: [
      "li-term",
      "li-10yr",
      "li-20yr",
      "li-50plus",
      "li-add",
      "di-ltd-plus",
      "di-ltd",
      "di-mtd",
      "oo-professional",
      "sh-critical-illness",
      "sh-hospital-money",
    ],
    coverageAmounts: {
      "li-term": rangeAssignments({ member: [50000, 500000] }),
      "li-10yr": rangeAssignments({ member: [50000, 500000] }),
      "li-20yr": rangeAssignments({ member: [50000, 1000000] }),
      "li-50plus": rangeAssignments({ member: [50000, 500000] }),
      "li-add": rangeAssignments({ member: [25000, 500000] }),
      "di-ltd-plus": rangeAssignments({ member: [1000, 5000] }),
      "di-ltd": rangeAssignments({ member: [1000, 5000] }),
      "di-mtd": rangeAssignments({ member: [1000, 4000] }),
      "oo-professional": rangeAssignments({ member: [500, 3000] }),
      "sh-critical-illness": rangeAssignments({ member: [10000, 50000] }),
      "sh-hospital-money": rangeAssignments({ member: [100, 500] }),
    },
    overrides: {
      "li-term": {
        featured: true,
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
    chatUrl: "https://example.com/chat",
    scheduleUrl: "https://calendly.com/example/30min",
    homePageVariant: "hero-image",
  },
  licenseInfo: [
    "CA Insurance License: #OH62489",
    "AR Insurance License: #94726",
  ],
};

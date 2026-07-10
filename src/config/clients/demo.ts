import type { ClientConfig } from "./types";

export const demoClient: ClientConfig = {
  id: "demo",
  themeColor: "default",
  branding: {
    name: "Demo Client",
    acronym: "DEMO",
    logo: "/client/demo/logo.svg",
    logoAlt: "Demo Client logo",
  },
  support: {
    phone: "800-000-0000",
    phoneDisplay: "800-000-0000",
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
    excluded: [],
    optional: ["beneficiary", "payment"],
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
    ranges: {
      "li-term": { min: 50000, max: 500000 },
      "li-10yr": { min: 50000, max: 500000 },
      "li-20yr": { min: 50000, max: 1000000 },
      "li-50plus": { min: 50000, max: 500000 },
      "li-add": { min: 25000, max: 500000 },
      "di-ltd-plus": { min: 1000, max: 5000 },
      "di-ltd": { min: 1000, max: 5000 },
      "di-mtd": { min: 1000, max: 4000 },
      "oo-professional": { min: 500, max: 3000 },
      "sh-critical-illness": { min: 10000, max: 50000 },
      "sh-hospital-money": { min: 100, max: 500 },
    },
    overrides: {
      "li-term": {
        featured: true,
      },
    },
  },
  fields: {},
  features: {
    chat: true,
    homePageVariant: "hero-image",
  },
  licenseInfo: [
    "CA Insurance License: #OH62489",
    "AR Insurance License: #94726",
  ],
};

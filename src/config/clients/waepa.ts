import type { ClientConfig } from "./types";

export const waepaClient: ClientConfig = {
  id: "waepa",
  branding: {
    name: "Worldwide Assurance for Employees of Public Agencies",
    acronym: "WAEPA",
    logo: "/client/waepa/logo.png",
    logoAlt: "WAEPA Logo",
  },
  support: {
    phone: "8003683484",
    phoneDisplay: "800-368-3484",
    phoneHours: "M-Th 8:30am - 6:30pm, F 8:30am - 5:00pm, ET",
    email: "support@waepa.org",
    website: "waepa.org",
    address: {
      street: "2806 N. Parham Road, Suite 200",
      city: "Richmond",
      state: "Virginia",
      zip: "23294",
    },
  },
  pages: {
    excluded: [],
    optional: ["beneficiary", "payment"],
  },
  coverages: {
    categories: ["LI", "DI"],
    enabled: ["li-group-term", "di-short-term"],
    ranges: {
      "li-group-term": { min: 50000, max: 500000 },
      "di-short-term": { min: 1000, max: 4000 },
    },
    overrides: {
      "li-group-term": {
        featured: true,
      },
    },
    allCategoriesExpanded: true,
  },
  fields: {},
  content: {},
};

import type { FooterContent } from "../types";

export const footerDefaults: FooterContent = {
  administeredByLabel: "Administered By:",
  underwrittenBy: {
    label: "Underwritten By:",
    name: "New York Life Insurance Company",
    policyForm: "on Policy Form GMR",
    address: "51 Madison Avenue\nNew York, New York 10010",
  },
  ratings: [
    { grade: "A++", source: "A.M. Best" },
    { grade: "AAA", source: "Fitch Ratings" },
    { grade: "Aa1", source: "Moody's Investors Service" },
    { grade: "AA+", source: "Standard & Poor's" },
  ],
  ratingsAsOf: "1 Third Party Rating Reports as of 09/30/2025.",
  legal: [
    "New York Life Insurance Company is licensed/authorized to transact business in all of the 50 United States, the District of Columbia, Puerto Rico and Canada. However, not all group policies it underwrites are available in all jurisdictions. Please check the Coverage detail sections for current availability. New York Life Insurance Company's state of domicile is New York, and NAIC ID is #66915.",
    "NEW YORK LIFE and the NEW YORK LIFE Box Logo are trademarks of New York Life Insurance Company.",
  ],
  links: {
    termsOfUse: "NYL Terms of Use",
    privacyNotice: "NYL Privacy Notice",
  },
};

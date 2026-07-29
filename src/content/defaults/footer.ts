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

  // ── Global legal documents ─────────────────────────────────────────────────
  // These are New York Life documents; they are not client-configurable.

  termsOfUseContent: {
    title: "New York Life Terms of Use",
    sections: [
      {
        type: "paragraph",
        text: "If you are applying online, you are applying for insurance coverage using electronic processes that include the use of electronic records and electronic signatures. New York Life is required by law to provide you with certain disclosures and information regarding your insurance application. Upon your consent, these notices will be delivered electronically.",
      },
      {
        type: "paragraph",
        text: "Please print or download New York Life's Online Privacy Notice and retain it for your records. Your consent also permits the use of electronic records and electronic signatures throughout your application.",
      },
      {
        type: "paragraph",
        text: "If you do not consent to electronic delivery of these disclosures, New York Life cannot continue processing your electronic application. A paper application may be required instead.",
      },
      {
        type: "paragraph",
        text: "This notice contains important information regarding your consent to the use of electronic signatures and records. Please read it carefully before continuing.",
      },
      {
        type: "paragraph",
        text: "By electronically signing your application, you consent to the use of electronic transactions, electronic signatures, and electronic delivery of records related to your insurance application. You also agree that any consent or agreement transmitted through this website is legally binding and has the same legal effect as your handwritten signature.",
      },
      {
        type: "paragraph",
        text: "Your consent applies to:",
      },
      {
        type: "list",
        items: [
          "Information required to complete your insurance application.",
          "Your insurance application.",
          "Associated notices, disclosures, and supporting documents.",
        ],
      },
      {
        type: "paragraph",
        text: "You may withdraw your consent at any time. However, withdrawing consent will prevent New York Life from continuing to process your electronic application. You may instead submit a paper application through your plan administrator.",
      },
      {
        type: "heading",
        level: 2,
        text: "System Requirements",
      },
      {
        type: "list",
        items: [
          "128-bit SSL encryption.",
          "Screen resolution of 1280 × 800 or higher.",
          "A current version of Google Chrome. Other browsers may not be fully supported.",
        ],
      },
    ],
    revision: "November 1, 2011",
  },

  privacyNoticeContent: {
    title: "New York Life Privacy Notice",
    sections: [
      {
        type: "heading",
        level: 2,
        text: "Our Information Practices",
      },
      {
        type: "paragraph",
        text: "This Privacy Notice applies to information collected in connection with financial products and services provided by members of the New York Life Family of Companies that are subject to the Gramm-Leach-Bliley Act.",
      },
      {
        type: "heading",
        level: 2,
        text: "Information We Collect",
      },
      {
        type: "list",
        items: [
          "Information provided on applications and forms.",
          "Transaction information.",
          "Publicly available information.",
          "Website and cookie information.",
          "Consumer reporting information.",
          "Health information collected with authorization.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Safeguarding Your Information",
      },
      {
        type: "paragraph",
        text: "We maintain physical, electronic, and procedural safeguards designed to protect confidential information and comply with applicable regulations.",
      },
      {
        type: "heading",
        level: 2,
        text: "How We Use Information",
      },
      {
        type: "paragraph",
        text: "Information may be shared as permitted by law for normal business administration and servicing.",
      },
      {
        type: "list",
        items: [
          "Within the New York Life Family of Companies.",
          "With service providers performing business functions.",
          "When required by law.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Privacy Notice Distribution",
      },
      {
        type: "paragraph",
        text: "This Privacy Notice was last updated in January 2026.",
      },
      {
        type: "address",
        lines: [
          "Group Membership Compliance Officer",
          "New York Life Insurance Company",
          "44 South Broadway",
          "White Plains, NY 10601",
        ],
      },
      {
        type: "paragraph",
        text: "Phone: (866) 891-0631 Ext. 3004595",
      },
      {
        type: "heading",
        level: 2,
        text: "New York Life Family of Companies",
      },
      {
        type: "paragraph",
        text: "The New York Life Family of Companies includes New York Life Insurance Company and numerous affiliated insurance, investment, and asset management companies.",
      },
      {
        type: "note",
        text: "Form 22294-CA (January 2026) · © 2026 New York Life Insurance Company",
      },
    ],
  },
};

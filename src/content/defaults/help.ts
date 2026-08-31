import type { HelpContent } from "../types";

export const helpDefaults: HelpContent = {
  howApplyingWorks: {
    intro:
      "This online experience is designed to help you complete your application quickly and easily.",
    steps: [
      {
        title: "Apply online",
        body: "Complete our online application to apply for coverage that fits your needs. You'll be able to review your options and see your estimated cost.",
      },
      {
        title: "Answer health questions",
        body: "Many types of insurance require health information to provide a decision on your application. We may ask health questions on your application or a representative of New York Life or their medical service provider may contact you to collect your health history. If needed, we will schedule a medical exam at no cost to you and at a time and place convenient to you.",
      },
      {
        title: "Get a decision",
        body: "Decisions are made after all information is received and reviewed by New York Life. If approved, you will receive a certificate of insurance and have a 30-day no-obligation free look.",
      },
    ],
    subDrawerTitles: {
      applicationReview: "Application review process",
      quickDecision: "QuickDecision",
    },
  },
  applicationReview: {
    title: "About the application review process",
    intro:
      "During the application review process, also known as underwriting, our team will review your application to provide a decision on your application.",
    whatToExpectTitle: "What to expect",
    whatToExpectItems: [
      "A medical service provider may contact you to confirm details about your health.",
      "A medical exam may be scheduled if needed at no cost to you and at a time and place convenient to you.",
      "We may also request additional information, such as prescription history, financial information, medical records from your physician(s), and/or medical claims history.",
      "Any forms needing your signature will be sent securely via DocuSign.",
    ],
    closingNote:
      "The review process typically takes a few business days, but with QuickDecision, many applications can get a real-time decision, often without requiring a medical exam.",
  },
  groupInsurance: {
    intro:
      "With group insurance through {{associationName}}, eligible applicants can take advantage of specially negotiated rates made available through the group.",
    exploreTitle: "Explore available group insurance options",
    exploreItems: [
      "Group rates may be available to eligible applicants through their association or sponsoring organization.",
      "Because eligibility and coverage needs can vary, the application helps confirm which products, coverage amounts, and rates are available for each applicant.",
      "Availability and rates may vary based on state, eligibility, underwriting requirements, coverage selected, and other application details.",
    ],
  },
  coverageOptions: {
    intro:
      "Review the coverage categories available and the products offered within each category.",
  },
  beneficiary: {
    whatIs: {
      paragraphs: [
        "A beneficiary is the person, people, or trust you choose to receive the money from your policy when you pass away.",
        "This can be a family member, friend, or trust, and you can update your beneficiary choices if your situation changes.",
        "A primary beneficiary is the person or entity who would receive the policy proceeds first.",
        "A contingent beneficiary would receive the policy proceeds if the primary beneficiary is unable to receive them.",
        "You may add up to ten primary and ten contingent beneficiaries online. If no beneficiary is named, proceeds will be paid according to the policy provisions.",
        "For dependent child coverage, the beneficiary is the member.",
      ],
    },
    percentageShare: {
      paragraphs: [
        "The percentage share determines how much of the policy payout each beneficiary will receive.",
        "You assign a percentage to each individual beneficiary, and the percentages for that designation must add up to 100%.",
        "For example, if one beneficiary is assigned 60% and another is assigned 40%, they would receive those portions of the total benefit.",
        "If you name a trust as beneficiary, 100% of the proceeds will be paid to the trust.",
      ],
    },
  },
  whyAsked: {
    intro:
      "We understand these questions can feel personal. Here's how this information is used in your application.",
    sections: [
      {
        title: "Determining your coverage options",
        description:
          "Your answers help us identify the coverage types and amounts available to you. Different products have different eligibility requirements, and this information ensures we show you the right options.",
      },
      {
        title: "Calculating your estimated cost",
        description:
          "Health and lifestyle information is used to calculate personalized premium estimates. The more accurate your answers, the more accurate your quoted rate will be.",
      },
      {
        title: "Your information is protected",
        description:
          "All information you provide is transmitted securely and used only for the purpose of evaluating your application. It is never sold or shared for marketing purposes.",
      },
    ],
  },
  paymentHandling: {
    intro:
      "We take the security of your payment information seriously. Here's how we handle it throughout the application process.",
    sections: [
      {
        title: "You will not be charged yet.",
        description:
          "Your payment information is collected as part of the application but you will not be charged until and unless you are approved for coverage. No money leaves your account during the application process.",
      },
      {
        title: "Stored securely",
        description:
          "All payment data is encrypted in transit and at rest using industry-standard security protocols. Your information is stored in PCI-compliant systems and is never accessible in plain text.",
      },
      {
        title: "How payment is processed",
        description:
          "If your application is approved, payment will be processed according to the frequency you select (monthly, quarterly, semiannually, or annually). You'll receive confirmation before any charge is made.",
      },
      {
        title: "Cancellation & data purge",
        description:
          "You can cancel your application at any time before approval with no obligation. All payment and application information is purged from our systems 10 days after submission if no action is taken or the application is not approved.",
      },
    ],
  },
  quickDecision: {
    titlePrefix: "What is",
    intro:
      "helps speed up your application by using your answers to health questions along with securely accessed data, such as prescription history, medical claims, driving records, and prior insurance activity. In many cases, this means no medical exams or lab tests are needed.",
    whatToExpectTitle: "What to expect",
    whatToExpectItems: [
      "Most decisions are made quickly.",
      "Some applications may need additional review.",
      "If so, an underwriter may contact you for more information.",
    ],
    importantToKnowTitle: "Important to know",
    importantToKnowItems: [
      "Approval depends on confirming your group status and eligibility for the coverage amount selected.",
      "may not be available for all products or in all states/territories.",
    ],
  },
  coveragePortfolio: {
    title: "Coverage portfolio",
    intro:
      "The following coverage is currently in force based on your membership record.",
  },
};

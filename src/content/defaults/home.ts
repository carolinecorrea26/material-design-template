import type { HomeContent } from "../types";

export const homeDefaults: HomeContent = {
  hero: {
    tagline: "Simple • Secure • Member-only rates",
    title: "Safeguard your financial future",
    description:
      "Coverage designed exclusively for {{clientName}} members. Get started today!",
    welcomeBackTitle: "Welcome!",
    welcomeBackDescription:
      "Continue your saved application or begin a new one below.",
    ctaLabel: "Begin application",
    secondaryCtaLabel: "Learn more",
    resumePrompt: "Already started an application?",
    resumeLinkLabel: "Continue here",
  },
  howApplyingWorks: {
    title: "How does applying work?",
    description: "Three simple steps from application to coverage.",
  },
  applyingSteps: [
    {
      title: "Apply online in minutes",
      body: "Complete our online application to apply for coverage that fits your needs. Review your options and see your estimated cost.",
      imageSrc: "/1-apply.svg",
      imageAlt: "Apply online",
    },
    {
      title: "Answer health questions",
      body: "Some coverages require health information. We may ask questions during the application, or a representative may follow up to collect your health history. If a medical exam is needed, it's scheduled at no cost to you.",
      imageSrc: "/2-medical.svg",
      imageAlt: "Answer health questions",
    },
    {
      title: "Get your decision",
      body: "Once all information is received and reviewed, you'll get a decision from New York Life. If approved, you'll receive a certificate of insurance with a 30-day free look period.",
      imageSrc: "/3-decision.svg",
      imageAlt: "Get your decision",
    },
  ],
  coverageOptions: {
    title: "Your coverage options",
    description: "Learn more about the coverage available to you.",
  },
  nylCredentials: {
    name: "New York Life Insurance Company",
    tagline: "A trusted name for over 180 years",
    description:
      "At the heart of New York Life is a commitment to be there for customers when they need us, whether today or decades into the future. As of today, New York Life has received the highest financial strength ratings currently awarded to any U.S. life insurer. For our customers, that means promises kept, and peace of mind for the millions of families and businesses who rely on us.",
    ratingsNote: "Third Party Rating Reports as of 09/30/2025.",
    ratings: [
      { grade: "A++", source: "A.M. Best" },
      { grade: "AAA", source: "Fitch Ratings" },
      { grade: "Aa1", source: "Moody's Investors Service" },
      { grade: "AA+", source: "Standard & Poor's" },
    ],
  },
  quoteSection: {
    title: "Get an instant quote",
    description: "Find a premium and amount that's a good fit for you.",
  },
  reviewProcessLinkLabel: "Learn more about the review process.",
  quickDecisionAvailableSuffix:
    " is available, you may get a faster decision with no medical exam.",
  noCoverageCategoriesMessage:
    "No coverage categories are currently available for this site.",
  availableForLabel: "Available for:",
};

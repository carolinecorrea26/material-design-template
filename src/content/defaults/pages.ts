import type { PagesContent } from "../types";

/**
 * Default page titles and subheads.
 * The {{clientAcronym}} placeholder is replaced at runtime with the active client's acronym.
 */
export const pagesDefaults: Partial<PagesContent> = {
  home: { title: "Home", navTitle: "Home" },
  membership: {
    title:
      "Starting your application for {{clientAcronym}}-sponsored insurance",
    subhead:
      "This application is for {{clientAcronym}}-sponsored group insurance.",
    navTitle: "Membership",
  },
  eligibility: {
    title: "Check your eligibility",
    subhead:
      "Answer a few questions to confirm which coverage options are available to you.",
    navTitle: "Check eligibility",
  },
  coverage: {
    title: "Your coverage options",
    subhead: "Explore and customize the coverage options available to you.",
    navTitle: "Choose coverage",
  },
  beneficiary: {
    title: "Add your beneficiaries",
    subhead: "Tell us who should receive benefits if a claim is paid.",
    navTitle: "Beneficiary",
  },
  contact: {
    title: "Your preferred contact",
    subhead: "Provide the best way for us to reach you about your application.",
    navTitle: "Contact",
  },
  review: {
    title: "Review your application",
    subhead: "Check your answers before submitting your application.",
    navTitle: "Review",
  },
  docusign: {
    title: "Review and sign your application.",
    subhead: "Review and sign your application documents electronically.",
    navTitle: "E-sign",
  },
  "health-si": {
    title:
      "Please answer the following health questions to the best of your ability.",
    subhead: "Answer health questions required for your selected coverage.",
    navTitle: "Health",
  },
  "health-qd": {
    title: "About your health",
    subhead: "Answer health questions required for your selected coverage.",
    navTitle: "Health",
  },
  "health-di": {
    title: "About your health",
    subhead: "Answer health questions required for your selected coverage.",
    navTitle: "Health",
  },
  "health-cir": {
    title: "About your health",
    subhead: "Answer health questions required for your selected coverage.",
    navTitle: "Health",
  },
  payment: {
    title: "Choose your payment method",
    subhead: "Select how you would like to pay for your coverage.",
    navTitle: "Payment",
  },
  receipt: {
    title: "Your application has been submitted!",
    subhead:
      "Your application has been received, and we'll guide you through any next steps.",
    navTitle: "Receipt",
  },
  resume: {
    title: "Already started an application?",
    subhead: "Enter your information to continue a saved application.",
    navTitle: "Resume application",
  },
  "advisor-login": {
    title: "Welcome!",
    subhead: "Start or continue an application below.",
    navTitle: "Advisor login",
  },
  "advisor-send-confirmation": {
    title: "Application sent successfully!",
    subhead:
      "The applicant can now review, sign, and submit their application.",
    navTitle: "Sent confirmation",
  },
  "mock-email-preview": {
    title: "Mock Email Preview",
    navTitle: "Mock email preview",
  },
  "information-architecture": {
    title: "Information Architecture",
    navTitle: "Information architecture",
  },
  profile: {
    title: "About you",
    subhead:
      "Share the personal and financial details needed to complete your application.",
    navTitle: "Profile",
  },
};

import type { PagesContent } from "../types";

/**
 * Default page titles and subheads.
 * The {{clientAcronym}} placeholder is replaced at runtime with the active client's acronym.
 */
export const pagesDefaults: Partial<PagesContent> = {
  home: { title: "Home", navTitle: "Home" },
  membership: {
    title: "Applying for {{clientAcronym}}-sponsored insurance",
    subhead:
      "This is an online application for insurance. It only takes a minute to get started, and we'll guide you through each step.",
    navTitle: "Membership",
  },
  eligibility: {
    title: "Confirm your eligibility",
    subhead:
      "Answer a few questions to check eligibility and see your coverage options.",
    navTitle: "Eligibility",
  },
  coverage: {
    title: "Your coverage options",
    subhead: "Explore and customize the coverage options available to you.",
    navTitle: "Coverage",
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
    title: "Continue saved application",
    subhead:
      "Before proceeding, we need to confirm your identity. Please enter your email and we'll send a secure link for verification.",
    navTitle: "Resume application",
  },
  "resume-code": {
    title: "Enter security code",
    subhead:
      "Enter the security code sent to your phone number that was used to begin an application.",
    navTitle: "Security code",
  },
  "advisor-login": {
    title: "Advisor Portal",
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

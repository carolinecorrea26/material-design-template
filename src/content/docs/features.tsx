import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { getPagePath } from "../../config/pages";

export type FeatureEntry = {
  id: string;
  name: string;
  /** What the feature does and what triggers it — written as a production requirement, not prototype-implementation notes. */
  description: ReactNode;
  /** Where the feature lives in the app and how it affects the applicant-facing flow. */
  impactedAreas: ReactNode;
};

export const featuresData: FeatureEntry[] = [
  {
    id: "feature-health-flows",
    name: "Online medical questions + instant decisions",
    description:
      "Presents health questions on the pages that require them, based on the coverage and underwriting type selected, and returns an instant decision immediately after: Conditionally Approved, Unable to Offer, or Sent for Review. Simplified Issue and Tele-Supplemental (Life and Disability) present questions directly in the application; QuickDecision hands the applicant to a separate underwriting system to answer questions; Guaranteed Issue and non-underwritten products require none. Fully underwritten and Tele-Supplemental applications are always sent for review, even after answering questions online.",
    impactedAreas:
      "Health question pages (Simplified Issue, Tele-Supplemental Life/Disability, QuickDecision, Chronic Illness Rider) and the Receipt page — determines what health questions an applicant sees and what decision they receive immediately after submitting.",
  },
  {
    id: "feature-instant-quote",
    name: "Instant quote",
    description:
      "Lets a prospective or in-progress applicant estimate their premium and coverage amount using a few basic details (date of birth, gender, tobacco use, state, ZIP), without starting or committing to a full application.",
    impactedAreas:
      "Landing page (primary entry point) and page-helper shortcuts during the application, which reopen the same estimate without losing progress.",
  },
  {
    id: "feature-ecart",
    name: "E-cart",
    description:
      "Shows the applicant a running summary of every coverage product they've selected, with a per-product cost breakdown and running total, so they always know what they're applying for and what it costs.",
    impactedAreas:
      "Persistent header icon with a selection-count badge, shown on every application page except Home and after final submission, plus an inline summary on the Coverage page.",
  },
  {
    id: "feature-rate-toggle",
    name: "Monthly/annual rate toggle",
    description:
      "Lets an applicant switch a displayed estimated premium between a monthly amount and an annual amount, so they can compare cost the way that's meaningful to them.",
    impactedAreas:
      "Coverage cart and quote tools — affects how an estimated cost is displayed; does not change the actual payment frequency, which is chosen separately on the Payment page.",
  },
  {
    id: "feature-coverage-brochure",
    name: "Coverage brochure panel",
    description:
      "Shows a brief description, amount range, and eligibility (who it's available for) for each coverage category and product, with access to the full brochure/certificate for more detail, plus a QuickDecision callout for products eligible for an instant decision.",
    impactedAreas:
      "Landing page (\"Your coverage options\") and the application menu's \"About Coverage\" option — lets prospective and in-progress applicants explore what's available without starting or interrupting an application.",
  },
  {
    id: "feature-coverage-portfolio",
    name: "Coverage portfolio",
    description:
      "Shows an applicant a summary of their existing in-force coverage, grouped by covered person, once their membership has been verified — so they can see what they already have before deciding what else to apply for.",
    impactedAreas: "Coverage page, available after eligibility/membership verification succeeds.",
  },
  {
    id: "feature-page-helpers",
    name: "Page helpers",
    description:
      "Gives applicants quick access to contextual help — such as cost estimates, coverage explanations, or process questions — directly from the page they're on, without leaving the application or losing progress.",
    impactedAreas:
      "Membership, Eligibility, Coverage, Beneficiary, Health, and Payment pages — reduces drop-off caused by needing outside information to answer a question.",
  },
  {
    id: "feature-advisor-flow",
    name: "Advisor-led application",
    description:
      "Lets a licensed advisor start or continue an application on behalf of an applicant, complete the portions they're permitted to fill in, and hand the application to the applicant to review, complete any remaining sensitive information, and sign.",
    impactedAreas:
      "Advisor login and hand-off pages, plus Profile and Review, which branch depending on whether an advisor or the applicant is completing them — supports an assisted sales channel alongside direct self-service applications.",
  },
  {
    id: "feature-abandoned-leads",
    name: "Abandoned leads",
    description:
      "Identifies applicants who start an application but don't complete it, so they can be followed up with and given the opportunity to finish.",
    impactedAreas:
      "Applies across the entire application flow — surfaces incomplete applications for outreach rather than losing them silently.",
  },
  {
    id: "feature-autosave",
    name: "Autosaved application",
    description:
      "Saves an applicant's progress automatically after they submit the first page of the application, so they don't lose their work if they leave and come back.",
    impactedAreas:
      "Applies from the first application page onward — removes the need for an applicant to complete an application in one sitting.",
  },
  {
    id: "feature-reminder-emails",
    name: "Reminder emails",
    description:
      "Sends the applicant email reminders throughout the application process — confirming that progress has been saved, and prompting them to return and finish if their application is left incomplete.",
    impactedAreas: (
      <>
        Sent after key milestones such as progress being saved and applications left pending
        completion — keeps applicants engaged and reduces abandonment. See{" "}
        <RouterLink to={getPagePath("mock-email-preview")}>Mock Email Preview</RouterLink> for
        example email content.
      </>
    ),
  },
  {
    id: "feature-resume",
    name: "Resume with MFA",
    description:
      "Lets an applicant return to and continue a previously started application by verifying their identity with their email and phone number.",
    impactedAreas:
      "Resume entry and verification pages — lets an applicant safely pick up an incomplete application from a new session.",
  },
  {
    id: "feature-tpa-integration",
    name: "TPA integration",
    description:
      "Matches an applicant against their organization's member roster to verify eligibility and membership, streamlining the application and unlocking access to their existing coverage information.",
    impactedAreas:
      "Eligibility (verification step) and Coverage (unlocks the coverage portfolio) — reduces manual eligibility entry for members whose group maintains a roster.",
  },
  {
    id: "feature-financial-questionnaire",
    name: "Online financial questionnaire",
    description:
      "Collects additional income and net-worth information from an applicant when their requested Disability coverage amount is large enough to require closer underwriting review.",
    impactedAreas:
      "Profile page — appears only for applicants requesting higher Disability coverage amounts, with additional self-employment detail collected when applicable.",
  },
  {
    id: "feature-online-payment",
    name: "Optional online payment",
    description:
      "Lets an applicant provide payment information as part of the application, or skip it, depending on what's configured for their organization. When collected, payment isn't charged unless and until the application is approved.",
    impactedAreas:
      "Payment page — can be configured as required, optional, or excluded per client, changing whether and how payment is collected during the application.",
  },
  {
    id: "feature-online-beneficiary",
    name: "Optional online beneficiary",
    description:
      "Lets an applicant designate who should receive benefits for the Life/Accidental Death coverage they've selected, or skip it, depending on what's configured for their organization. Supports multiple primary and contingent beneficiaries, individuals or trusts.",
    impactedAreas:
      "Beneficiary page — appears only for applicable Life/AD products, and can be configured as required, optional, or excluded per client.",
  },
];

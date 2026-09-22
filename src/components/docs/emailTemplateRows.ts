import type { MockEmailType } from "../../utils/mockEmail";

export type EmailFlowId = "Consumer" | "Advisor" | "Resume";

export type EmailTemplateRow = {
  id: string;
  flow: EmailFlowId;
  type: MockEmailType;
  title: string;
  description: string;
  whenSent: string;
  notes: string;
  /** True when this email includes the "Questions? We're here to help" contact box, i.e. is affected by ClientConfig.emailSupport. */
  usesSupportBox: boolean;
};

/**
 * Every mock email across the consumer, advisor, and resume flows, in one flat
 * list — the Flow column differentiates them instead of separate per-flow
 * tables. Shared by GlobalEmailTemplatesPanel and ClientEmailTemplatesPanel.
 */
export const emailTemplateRows: EmailTemplateRow[] = [
  {
    id: "consumer-autosave",
    flow: "Consumer",
    type: "autosave",
    title: "Application autosaved",
    description:
      "Lets the applicant know their in-progress application has been saved automatically.",
    whenSent: "Sent as soon as the Membership page is successfully submitted.",
    notes: "—",
    usesSupportBox: true,
  },
  {
    id: "consumer-pending",
    flow: "Consumer",
    type: "pending-reminder",
    title: "Application pending",
    description:
      "Reminds the applicant to finish an application that's still in progress.",
    whenSent:
      "Sent on days 3, 5, 7, and 9 if the application is still incomplete (the Receipt page hasn't been reached).",
    notes: "—",
    usesSupportBox: true,
  },
  {
    id: "consumer-deleted",
    flow: "Consumer",
    type: "purge-reminder",
    title: "Application deleted",
    description:
      "Notifies the applicant that their saved application has expired and been deleted.",
    whenSent:
      "Sent on day 10 if the application was still incomplete — it expires and is deleted 10 days after it was started.",
    notes: "—",
    usesSupportBox: true,
  },
  {
    id: "consumer-submitted",
    flow: "Consumer",
    type: "receipt",
    title: "Application submitted",
    description:
      "Confirms the applicant's application was submitted successfully, with coverage decisions and a confirmation number.",
    whenSent:
      "Sent when the application is submitted successfully (the Receipt page is reached).",
    notes:
      "Applications that include separate application types submitted together will have a separate email and confirmation number sent per application type.",
    usesSupportBox: true,
  },
  {
    id: "advisor-sent-advisor",
    flow: "Advisor",
    type: "advisor-sent-for-signature",
    title: "Application sent [advisor]",
    description:
      "Notifies the advisor that an application has been sent to the applicant for signature.",
    whenSent:
      "Sent when the advisor confirms the “Send to applicant” dialog (the advisor Send Confirmation page is reached).",
    notes: "—",
    usesSupportBox: false,
  },
  {
    id: "advisor-sent-applicant",
    flow: "Advisor",
    type: "advisor-sent-to-applicant",
    title: "Application sent [applicant]",
    description:
      "Lets the applicant know their advisor has prepared their application and it's ready to complete and sign.",
    whenSent:
      "Sent when the advisor confirms the “Send to applicant” dialog (the advisor Send Confirmation page is reached).",
    notes:
      "Sent to the applicant, not the advisor — modeled on the Application autosaved email, with the support box showing the advisor's contact instead of the client's.",
    usesSupportBox: true,
  },
  {
    id: "advisor-pending-advisor",
    flow: "Advisor",
    type: "advisor-pending-reminder",
    title: "Application pending [advisor]",
    description:
      "Reminds the advisor that an application is still awaiting the applicant's signature.",
    whenSent:
      "Sent on days 3, 5, 7, and 9 if the application is still incomplete (the Receipt page hasn't been reached).",
    notes: "—",
    usesSupportBox: false,
  },
  {
    id: "advisor-edit-advisor",
    flow: "Advisor",
    type: "advisor-edit-request",
    title: "Application edit request [advisor]",
    description:
      "Notifies the advisor that the applicant requested an edit to the application.",
    whenSent:
      "Sent when the applicant confirms the Application Edit Confirmation step.",
    notes: "—",
    usesSupportBox: false,
  },
  {
    id: "advisor-submitted-advisor",
    flow: "Advisor",
    type: "advisor-application-complete",
    title: "Application submitted [advisor]",
    description:
      "Notifies the advisor that the applicant's application was submitted.",
    whenSent:
      "Sent when the application is submitted successfully (the Receipt page is reached).",
    notes: "—",
    usesSupportBox: false,
  },
  {
    id: "resume-request",
    flow: "Resume",
    type: "resume-magic-link",
    title: "Application resume request",
    description:
      "Sends a one-time link so someone can verify their email and continue an in-progress application.",
    whenSent:
      "Sent when the application ID entered on the Resume page is matched to the email submitted.",
    notes: "—",
    usesSupportBox: false,
  },
];

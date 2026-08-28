import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import { getActiveClient } from "../config/client/getActiveClient";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import theme from "../app/theme";
import {
  getCoverageAmountRequested,
  getDecisionStatus,
  getOrderedDecisionEntries,
  getQdDecisionResult,
  formatCurrencyAmount,
  APPLICANT_LABELS,
  type SelectedCoverageEntry,
} from "./coverageDecisions";

type MockEmailType =
  | "autosave"
  | "receipt"
  | "resume-magic-link"
  | "pending-reminder"
  | "purge-reminder"
  | "advisor-sent-for-signature"
  | "advisor-pending-reminder"
  | "advisor-edit-request"
  | "advisor-application-complete";

export type MockEmailPreview = {
  id: string;
  type: MockEmailType;
  clientId: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  createdAt: string;
  html: string;
};

export type MockEmailAudience = "applicant" | "advisor";

const MOCK_EMAIL_PREVIEWS_KEY = "mockEmail:previews";
const MOCK_EMAIL_PREVIEWS_CHANGED_EVENT = "mockEmail:previewsChanged";
const MOCK_APPLICANT_FIRST_NAME = "Caroline";
const MOCK_APPLICANT_LAST_NAME = "Correa";
const MOCK_APPLICANT_EMAIL = "returning.user@example.com";
const MOCK_ADVISOR_EMAIL = "advisor@example.com";
const MOCK_FROM_EMAIL = "gmad_tpa_portal@ntlab.newyorklife.com";

function getStringValue(values: ApplicationFormValues, fieldId: string) {
  const value = values[fieldId];
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMockDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatMockDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getDisplayName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Applicant";
}

function getNormalizedWebsiteUrl(website?: string) {
  const fallbackUrl =
    "https://redesignv2--material-design-template.netlify.app";

  if (!website) return fallbackUrl;

  const trimmedWebsite = website.trim().replace(/\/$/, "");
  if (!trimmedWebsite) return fallbackUrl;

  return trimmedWebsite.startsWith("http")
    ? trimmedWebsite
    : `https://${trimmedWebsite}`;
}

function getResumeUrl(clientId: string) {
  return new URL(`/resume?client=${clientId}`, window.location.origin).toString();
}

function getResumeDisplayUrl(clientAcronym: string) {
  return `${clientAcronym.toLowerCase()}.nylinsure.com/resume`;
}

function getClientEmailPayload() {
  const client = getActiveClient();
  const startUrl = getNormalizedWebsiteUrl(client.support.website);

  return {
    clientId: client.id,
    associationName: client.branding.name,
    clientAcronym: client.branding.acronym,
    tpaName: client.branding.name,
    tpaPhone: client.support.phoneDisplay || client.support.phone || "",
    tpaEmail: client.support.email || "",
    clientLogo: client.branding.logo,
    clientLogoAlt: client.branding.logoAlt,
    startUrl,
    resumeUrl: getResumeUrl(client.id),
    resumeDisplayUrl: getResumeDisplayUrl(client.branding.acronym),
    resumeMagicLinkUrl: `${startUrl}/resume-method`,
  };
}

function getApplicationEmailPayload(values: ApplicationFormValues) {
  return {
    ...getClientEmailPayload(),
    toEmail: getStringValue(values, "email"),
    firstName: getStringValue(values, "first-name"),
    lastName: getStringValue(values, "last-name"),
  };
}

function getInsuranceAdministratorFromName(
  _payload: ReturnType<typeof getClientEmailPayload>,
) {
  return "Insurance Administrator";
}

function getAdvisorNotificationsFromName(
  _payload: ReturnType<typeof getClientEmailPayload>,
) {
  return "Insurance Administrator";
}

function hasRecipientEmail(values: ApplicationFormValues) {
  return Boolean(getStringValue(values, "email"));
}

function getStoredMockEmails(): MockEmailPreview[] {
  try {
    const rawValue = window.localStorage.getItem(MOCK_EMAIL_PREVIEWS_KEY);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function notifyMockEmailPreviewsChanged() {
  window.dispatchEvent(new Event(MOCK_EMAIL_PREVIEWS_CHANGED_EVENT));
}

function saveMockEmailPreview(emailPreview: MockEmailPreview) {
  const existingPreviews = getStoredMockEmails();

  const nextPreviews = [
    emailPreview,
    ...existingPreviews.filter((preview) => preview.id !== emailPreview.id),
  ];

  window.localStorage.setItem(
    MOCK_EMAIL_PREVIEWS_KEY,
    JSON.stringify(nextPreviews),
  );

  notifyMockEmailPreviewsChanged();
}

function getGeneratedMockEmailId(type: MockEmailType) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getBaseEmailHtml(options: { title: string; bodyHtml: string }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(options.title)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>

  <body style="margin:0; padding:0; background-color:#eef2f7; font-family:Arial, Helvetica, sans-serif; color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#eef2f7; margin:0; padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; background-color:#ffffff; border-radius:28px; overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0; color:#111827; font-size:16px; line-height:1.55;">
                ${options.bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function getButtonHtml(label: string, href: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;">
    <tr>
      <td align="center" style="border-radius:999px; background-color:#006fff;">
        <a href="${escapeHtml(href)}" style="display:inline-block; padding:17px 28px; color:#ffffff; font-size:16px; line-height:1; font-weight:700; text-decoration:none; border-radius:999px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function getTelHref(phone: string) {
  return phone.replace(/\D/g, "");
}

function getVerifyIdentityNoticeHtml() {
  return `<p style="margin:0 0 16px; font-size:14px; line-height:1.5; color:#374151;">
    To access your application information, you will be asked to verify your identity using the email and phone number provided in your application.
  </p>`;
}

function getDecisionStatusColors(statusLabel: string) {
  if (statusLabel === "Conditionally approved") {
    return { background: "rgba(0, 148, 101, 0.08)", color: "#007a53" };
  }

  if (statusLabel === "Sent for review") {
    return { background: "rgba(6, 104, 255, 0.08)", color: "#006fff" };
  }

  return { background: "rgba(255, 152, 0, 0.08)", color: "#b26a00" };
}

function getDecisionBoxHtml(
  entry: SelectedCoverageEntry,
  decisionIndex: number,
  values: ApplicationFormValues,
) {
  const decisionResult = getQdDecisionResult(
    values,
    entry.coverageId,
    entry.applicant,
    decisionIndex,
  );

  const status = getDecisionStatus({
    underwritingType: entry.coverage.underwritingType,
    decisionResult,
  });

  const colors = getDecisionStatusColors(status.label);
  const applicantLabel = APPLICANT_LABELS[entry.applicant];

  const amountRequested = getCoverageAmountRequested(
    values,
    entry.coverageId,
    entry.applicant,
  );

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px; border:1px solid #d1d5db; border-radius:14px;">
    <tr>
      <td style="padding:16px 18px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-size:15px; font-weight:700; color:#111827;">
              ${escapeHtml(entry.coverage.name)}
            </td>
            <td align="right" style="white-space:nowrap;">
              <span style="display:inline-block; padding:3px 10px; border-radius:999px; background-color:${colors.background}; color:${colors.color}; font-size:12px; font-weight:700;">
                ${escapeHtml(status.label)}
              </span>
            </td>
          </tr>
        </table>

        <p style="margin:8px 0 10px; font-size:13px; line-height:1.4; color:#6b7280;">
          ${escapeHtml(applicantLabel)} coverage${
            amountRequested
              ? ` &middot; Requested: ${escapeHtml(formatCurrencyAmount(amountRequested))}`
              : ""
          }
        </p>

        <p style="margin:0; font-size:13px; line-height:1.5; color:#374151;">
          ${escapeHtml(status.description)}
        </p>
      </td>
    </tr>
  </table>`;
}

function getDecisionBoxesHtml(values: ApplicationFormValues) {
  const coverages = getActiveClientCoverages();
  const entries = getOrderedDecisionEntries(values, coverages);

  if (entries.length === 0) return "";

  return `<p style="margin:0 0 4px; font-size:18px; line-height:1.3; font-weight:700; color:#111827;">
      Coverage decisions
    </p>
    <p style="margin:0 0 16px; font-size:14px; line-height:1.5; color:#6b7280;">
      Review the current status for each coverage you applied for.
    </p>
    ${entries.map((entry, index) => getDecisionBoxHtml(entry, index, values)).join("")}`;
}

function getSupportHtml(tpaName: string, tpaPhone: string, tpaEmail: string) {
  const phoneHref = getTelHref(tpaPhone);

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 0; background-color:${theme.palette.support.main}; border:1px solid ${theme.palette.support.border}; border-radius:16px;">
    <tr>
      <td style="padding:22px 22px 20px; color:#12233d;">
        <p style="margin:0 0 18px; color:#071b3a; font-size:18px; line-height:1.25; font-weight:700;">
          Questions? We’re here to help.
        </p>

        <p style="margin:0 0 14px; color:#12233d; font-size:16px; line-height:1.45; font-weight:400;">
          ${escapeHtml(tpaName)} Insurance Administrator
        </p>

        <p style="margin:0 0 12px; color:#12233d; font-size:16px; line-height:1.45; font-weight:700;">
          Call:
          <a href="tel:${escapeHtml(phoneHref)}" style="color:#006fff; font-weight:700; text-decoration:none;">
            ${escapeHtml(tpaPhone)}
          </a>
        </p>

        <p style="margin:0; color:#12233d; font-size:16px; line-height:1.45; font-weight:700;">
          Email:
          <a href="mailto:${escapeHtml(tpaEmail)}" style="color:#006fff; font-weight:700; text-decoration:none;">
            ${escapeHtml(tpaEmail)}
          </a>
        </p>
      </td>
    </tr>
  </table>`;
}

function getNoticeHtml(title: string, body: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0 0; background-color:${theme.palette.notice.main}; border:1px solid ${theme.palette.notice.border}; border-radius:16px;">
    <tr>
      <td style="padding:22px 22px 20px; color:#7a2e0c;">
        <p style="margin:0 0 18px; color:#7a2e0c; font-size:18px; line-height:1.25; font-weight:700;">
          ${escapeHtml(title)}
        </p>

        <p style="margin:0; color:#7a2e0c; font-size:16px; line-height:1.55;">
          ${escapeHtml(body)}
        </p>
      </td>
    </tr>
  </table>`;
}

function getNylFooterHtml() {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 0; border-top:1px solid #d1d5db; padding-top:18px;">
    <tr>
      <td style="padding-top:18px; vertical-align:top; width:50px;">
        <img src="/logo.svg" alt="New York Life" width="50" height="50" style="display:block; width:50px; height:50px; border:0; outline:none; text-decoration:none; border-radius:2px;" />
      </td>
      <td style="padding-top:18px; padding-left:14px; vertical-align:top;">
        <p style="margin:0 0 4px; font-size:11px; line-height:1.4; font-weight:700; color:#111827;">Underwritten By:</p>
        <p style="margin:0 0 4px; font-size:11px; line-height:1.4; color:#111827;">New York Life Insurance Company</p>
        <p style="margin:0 0 4px; font-size:11px; line-height:1.4; color:#111827;">51 Madison Avenue New York, New York 10010</p>
        <p style="margin:0; font-size:10px; line-height:1.4; color:#6b7280;">NEW YORK LIFE and the NEW YORK LIFE Box Logo are trademarks of New York Life Insurance Company.</p>
      </td>
    </tr>
  </table>`;
}

function getNoReplyHtml() {
  return `${getNylFooterHtml()}
  <div style="margin:18px 0 24px; padding-top:14px;">
    <p style="margin:0; color:#6b7280; font-size:13px; line-height:1.45;">
      Please note: This is an automated message. Replies to this email are not monitored.
    </p>
  </div>`;
}

function getAdvisorStatusIconSvg(statusLabel: string) {
  const isComplete =
    statusLabel === "Submitted" || statusLabel === "Application submitted";
  const color = isComplete ? "#109a17" : "#0768ff";

  if (statusLabel === "Submitted" || statusLabel === "Application submitted") {
    return `<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" style="display:block; fill:${color}; flex:0 0 auto;">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.59L6.35 12.35l1.41-1.41 2.83 2.83 5.66-5.66 1.41 1.41-7.07 7.07z"></path>
    </svg>`;
  }

  if (
    statusLabel === "Sent for signature" ||
    statusLabel === "Application sent for signature"
  ) {
    return `<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" style="display:block; fill:${color}; flex:0 0 auto;">
    <path d="m3.4 20.4 17.45-7.48c.81-.35.81-1.49 0-1.84L3.4 3.6c-.66-.29-1.39.2-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91"></path>
  </svg>`;
  }

  if (
    statusLabel === "Edit requested" ||
    statusLabel === "Application edit requested"
  ) {
    return `<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" style="display:block; fill:${color}; flex:0 0 auto;">
  <path d="m17.58 6.25 1.77 1.77-4.84 4.84c-.09.09-.22.14-.35.14H13.1c-.28 0-.5-.22-.5-.5v-1.06c0-.13.05-.26.15-.35zm3.27-.44-1.06-1.06c-.2-.2-.51-.2-.71 0l-.85.85L20 7.37l.85-.85c.2-.2.2-.52 0-.71M20 18c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1s.45-1 1-1h1v-7c0-2.79 1.91-5.14 4.5-5.8v-.7c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v.7c.82.21 1.57.59 2.21 1.09l-4.52 4.52c-.38.38-.59.88-.59 1.41V13c0 1.1.9 2 2 2h1.77c.53 0 1.04-.21 1.41-.59L18 12.2V17h1c.55 0 1 .45 1 1m-10 2h4c0 1.1-.9 2-2 2s-2-.9-2-2"></path>
</svg>`;
  }

  if (
    statusLabel === "Waiting for signature" ||
    statusLabel === "Application still pending signature"
  ) {
    return `<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" style="display:block; fill:${color}; flex:0 0 auto;">
    <path d="m15.1 19.37 1 1.74c-.96.44-2.01.73-3.1.84v-2.02c.74-.09 1.44-.28 2.1-.56M4.07 13H2.05c.11 1.1.4 2.14.84 3.1l1.74-1c-.28-.66-.47-1.36-.56-2.1M15.1 4.63l1-1.74c-.96-.44-2-.73-3.1-.84v2.02c.74.09 1.44.28 2.1.56M19.93 11h2.02c-.11-1.1-.4-2.14-.84-3.1l-1.74 1c.28.66.47 1.36.56 2.1M8.9 19.37l-1 1.74c.96.44 2.01.73 3.1.84v-2.02c-.74-.09-1.44-.28-2.1-.56M11 4.07V2.05c-1.1.11-2.14.4-3.1.84l1 1.74c.66-.28 1.36-.47 2.1-.56m7.36 3.1 1.74-1.01c-.63-.87-1.4-1.64-2.27-2.27l-1.01 1.74c.59.45 1.1.96 1.54 1.54M4.63 8.9l-1.74-1c-.44.96-.73 2-.84 3.1h2.02c.09-.74.28-1.44.56-2.1m15.3 4.1c-.09.74-.28 1.44-.56 2.1l1.74 1c.44-.96.73-2.01.84-3.1zm-3.1 5.36 1.01 1.74c.87-.63 1.64-1.4 2.27-2.27l-1.74-1.01c-.45.59-.96 1.1-1.54 1.54M7.17 5.64l-1-1.75c-.88.64-1.64 1.4-2.27 2.28l1.74 1.01c.44-.59.95-1.1 1.53-1.54M5.64 16.83l-1.74 1c.63.87 1.4 1.64 2.27 2.27l1.01-1.74c-.59-.44-1.1-.95-1.54-1.53M12 7c-.55 0-1 .45-1 1v3.59c0 .53.21 1.04.59 1.41l3 3c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41l-3-3V8c0-.55-.45-1-1-1"></path>
  </svg>`;
  }

  return `<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" style="display:block; fill:${color}; flex:0 0 auto;">
    <path d="M12 2C6.48 2 2 6.48 2 12h-2l3 3.01L6 12H4c0-4.42 3.58-8 8-8 2.21 0 4.21.9 5.66 2.34l1.41-1.41C17.26 3.12 14.76 2 12 2zm8.49 3.51-6.15 6.15-2.83-2.83L10.1 10.24l4.24 4.24 7.56-7.56-1.41-1.41zM20 12c0 4.42-3.58 8-8 8-2.21 0-4.21-.9-5.66-2.34l-1.41 1.41C6.74 20.88 9.24 22 12 22c5.52 0 10-4.48 10-10h2l-3-3.01L18 12h2z"></path>
  </svg>`;
}

function buildAutosaveEmailHtml(
  payload: ReturnType<typeof getApplicationEmailPayload>,
) {
  const fullName = escapeHtml(
    getDisplayName(MOCK_APPLICANT_FIRST_NAME, MOCK_APPLICANT_LAST_NAME),
  );
  const saveDate = new Date();
  const purgeDate = addDays(saveDate, 9);

  return getBaseEmailHtml({
    title: "Your insurance application is being saved",
    bodyHtml: `
      <p style="margin:0 0 24px; font-size:16px; line-height:1.55;">
        Dear ${fullName},
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        Your insurance application through <strong>${escapeHtml(
          payload.associationName,
        )}</strong> has been automatically saved so you don’t lose your progress.
      </p>

      <p style="margin:0 0 28px; font-size:16px; line-height:1.55;">
        You can return to complete your application within the next <strong>10 calendar days.</strong>
      </p>

      ${getVerifyIdentityNoticeHtml()}

      ${getButtonHtml("Continue my application", payload.resumeUrl)}

      <p style="margin:0 0 10px; color:#374151; font-size:15px; line-height:1.5;">
        Or copy and paste this website address into your browser:
      </p>

      <p style="margin:0 0 28px; font-size:15px; line-height:1.5; color:#006fff; word-break:break-all;">
        <a href="${escapeHtml(payload.resumeUrl)}" style="color:#006fff; text-decoration:none;">
          ${escapeHtml(payload.resumeDisplayUrl)}
        </a>
      </p>

      <p style="margin:0; font-size:16px; line-height:1.55;">
        We look forward to serving your insurance needs.
      </p>

      ${getSupportHtml(payload.tpaName, payload.tpaPhone, payload.tpaEmail)}
      ${getNoticeHtml(
        "Your application will be saved for 10 days.",
        `For your security, your saved application will be deleted on ${formatMockDate(purgeDate)} . After that, you’ll need to begin a new application.`,
      )}
      ${getNoReplyHtml()}
    `,
  });
}
function buildReceiptEmailHtml(
  payload: ReturnType<typeof getApplicationEmailPayload>,
  confirmationNumber: string,
  values: ApplicationFormValues,
) {
  const fullName = escapeHtml(
    getDisplayName(MOCK_APPLICANT_FIRST_NAME, MOCK_APPLICANT_LAST_NAME),
  );

  return getBaseEmailHtml({
    title: "Thank you! We’ve received your insurance request",
    bodyHtml: `
      <p style="margin:0 0 24px; font-size:16px; line-height:1.55;">
        Dear ${fullName},
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        Your insurance application through <strong>${escapeHtml(
          payload.associationName,
        )}</strong> has been received and we’ve begun processing your application.
      </p>

      <p style="margin:0 0 24px; font-size:16px; line-height:1.55;">
        If you have any questions, please use the contact information below and refer to your confirmation number: <strong>${escapeHtml(confirmationNumber)}</strong>
      </p>

      ${getDecisionBoxesHtml(values)}

      ${getSupportHtml(payload.tpaName, payload.tpaPhone, payload.tpaEmail)}
      ${getNoReplyHtml()}
    `,
  });
}
function buildResumeMagicLinkEmailHtml() {
  const payload = getClientEmailPayload();

  return getBaseEmailHtml({
    title: "Your requested link to continue your application",
    bodyHtml: `
      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        A request has been made to return to an insurance application in progress through <strong>${escapeHtml(
          payload.associationName,
        )}</strong>. Click the link below to continue to your application.
      </p>

      ${getButtonHtml("Verify my email", payload.resumeMagicLinkUrl)}

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        This link will expire in <strong>10 minutes.</strong>
      </p>

      <p style="margin:0 0 8px; font-size:16px; line-height:1.55; font-weight:700;">
        Didn’t request a link?
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        If you did not request a link, you may ignore this message. Access to application information will only be granted with verification.
      </p>

      ${getNoReplyHtml()}
    `,
  });
}
function buildPendingReminderEmailHtml() {
  const payload = getClientEmailPayload();
  const startDate = new Date();
  const purgeDate = addDays(startDate, 9);

  return getBaseEmailHtml({
    title: "Your insurance application is ready to be completed",
    bodyHtml: `
      <p style="margin:0 0 24px; font-size:16px; line-height:1.55;">
        Dear ${escapeHtml(
          getDisplayName(MOCK_APPLICANT_FIRST_NAME, MOCK_APPLICANT_LAST_NAME),
        )},
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        We noticed you haven’t finished your <strong>${escapeHtml(
          payload.associationName,
        )}</strong> insurance application. Good news—your progress has been saved.
      </p>

      ${getVerifyIdentityNoticeHtml()}

      ${getButtonHtml("Continue my application", payload.resumeUrl)}

      <p style="margin:0 0 10px; color:#374151; font-size:15px; line-height:1.5;">
        Or copy and paste this website address into your browser:
      </p>

      <p style="margin:0 0 28px; font-size:15px; line-height:1.5; color:#006fff; word-break:break-all;">
        <a href="${escapeHtml(payload.resumeUrl)}" style="color:#006fff; text-decoration:none;">
          ${escapeHtml(payload.resumeDisplayUrl)}
        </a>
      </p>

      <p style="margin:0; font-size:16px; line-height:1.55;">
        We look forward to serving your insurance needs.
      </p>

      ${getSupportHtml(payload.tpaName, payload.tpaPhone, payload.tpaEmail)}
      ${getNoticeHtml(
        "Your application will be saved for 10 days.",
        `For your security, your saved application will be deleted on ${formatMockDate(
          purgeDate,
        )} . After that, you’ll need to begin a new application.`,
      )}
      ${getNoReplyHtml()}
    `,
  });
}
function buildPurgeReminderEmailHtml() {
  const payload = getClientEmailPayload();

  return getBaseEmailHtml({
    title: "Your insurance application progress",
    bodyHtml: `
      <p style="margin:0 0 24px; font-size:16px; line-height:1.55;">
        Dear ${escapeHtml(
          getDisplayName(MOCK_APPLICANT_FIRST_NAME, MOCK_APPLICANT_LAST_NAME),
        )},
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        Your insurance application through <strong>${escapeHtml(
          payload.associationName,
        )}</strong> has expired and has been securely deleted in accordance with our data retention policy. Application data is saved for you for 10 days to complete until it is deleted.
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        If you’d still like to apply, you can start a new application.
      </p>

      ${getButtonHtml("Start my application", payload.startUrl)}

      <p style="margin:0 0 10px; color:#374151; font-size:15px; line-height:1.5;">
        Or copy and paste this website address into your browser:
      </p>

      <p style="margin:0 0 28px; font-size:15px; line-height:1.5; color:#006fff; word-break:break-all;">
        <a href="${escapeHtml(payload.startUrl)}" style="color:#006fff; text-decoration:none;">
          ${escapeHtml(payload.startUrl)}
        </a>
      </p>

      <p style="margin:0 0 20px; font-size:16px; line-height:1.55;">
        If you have questions about your insurance options, we’re happy to help and provide additional information.
      </p>

      <p style="margin:0; font-size:16px; line-height:1.55;">
        We look forward to serving your insurance needs.
      </p>

      ${getSupportHtml(payload.tpaName, payload.tpaPhone, payload.tpaEmail)}

      <div style="margin:20px 0; border-top:1px dashed #d1d5db;"></div>

      ${getNoReplyHtml()}
    `,
  });
}
function buildAdvisorEmailHtml(options: {
  title: string;
  message: string;
  statusLabel: string;
  includeEditRequested?: boolean;
  includeSubmissionDate?: boolean;
  payload: ReturnType<typeof getClientEmailPayload>;
}) {
  const today = new Date();
  const sentDate = addDays(today, -3);
  const purgeDate = addDays(sentDate, 9);
  const editRequestDate = addDays(today, -1);

  const details = [
    [
      "Applicant name",
      `${MOCK_APPLICANT_FIRST_NAME} ${MOCK_APPLICANT_LAST_NAME}`,
    ],
    ["Applicant email", MOCK_APPLICANT_EMAIL],
    ["Sent for signature", formatMockDateTime(sentDate)],
    ...(options.includeSubmissionDate
      ? [["Submitted", formatMockDateTime(today)]]
      : [["Scheduled for deletion", formatMockDateTime(purgeDate)]]),
    ...(options.includeEditRequested
      ? [["Edit requested", formatMockDateTime(editRequestDate)]]
      : []),
  ];

  const detailRows = details
    .map(
      ([label, value]) => `<tr>
        <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; color:#4b5563; font-size:13px; font-weight:700; width:38%;">
          ${escapeHtml(label)}
        </td>
        <td style="padding:12px 14px; border-bottom:1px solid #e5e7eb; color:#111827; font-size:13px;">
          ${escapeHtml(value)}
        </td>
      </tr>`,
    )
    .join("");

  return getBaseEmailHtml({
    title: options.title,
    bodyHtml: `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d1d5db; border-radius:14px; overflow:hidden;">
        <tr>
          <td colspan="2" style="padding:12px 14px; background-color:#f5f5f5; color:#111827; font-size:13px; font-weight:700; border-bottom:1px solid #d1d5db;">
            Association: ${escapeHtml(options.payload.associationName)}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:12px 14px; background-color:#f5f5f5; color:#111827; font-size:14px; font-weight:700; border-bottom:1px solid #d1d5db;">
            <span style="display:inline-flex; align-items:center; gap:8px;">
              ${getAdvisorStatusIconSvg(options.statusLabel)}
              <span>${escapeHtml(options.statusLabel)}</span>
            </span>
          </td>
        </tr>
        ${detailRows}
      </table>

      <p style="margin:20px 0 0; font-size:14px; line-height:1.55; color:#111827;">
        Access the ${escapeHtml(options.payload.clientAcronym)} Advisor Portal to start a new application or take action on an application in progress:
        <a href="${escapeHtml(options.payload.resumeUrl)}" style="color:#006fff; text-decoration:none;">
          ${escapeHtml(options.payload.resumeDisplayUrl)}
        </a>
      </p>

      ${getNoReplyHtml()}
    `,
  });
}

function getAlwaysVisibleMockEmails(): MockEmailPreview[] {
  const payload = getClientEmailPayload();
  const now = new Date().toISOString();

  const sampleApplicantPayload = {
    ...payload,
    toEmail: MOCK_APPLICANT_EMAIL,
    firstName: MOCK_APPLICANT_FIRST_NAME,
    lastName: MOCK_APPLICANT_LAST_NAME,
  };

  const sampleReceiptValues: ApplicationFormValues = {
    coverageSelections: getActiveClientCoverages().map((coverage) => coverage.id),
  };

  return [
    {
      id: "sample-autosave",
      type: "autosave",
      clientId: payload.clientId,
      fromName: getInsuranceAdministratorFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_APPLICANT_EMAIL,
      subject: "Your insurance application is being saved",
      createdAt: now,
      html: buildAutosaveEmailHtml(sampleApplicantPayload),
    },
    {
      id: "sample-pending-reminder",
      type: "pending-reminder",
      clientId: payload.clientId,
      fromName: getInsuranceAdministratorFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_APPLICANT_EMAIL,
      subject: "Your insurance application is ready to be completed",
      createdAt: now,
      html: buildPendingReminderEmailHtml(),
    },
    {
      id: "sample-purge-reminder",
      type: "purge-reminder",
      clientId: payload.clientId,
      fromName: getInsuranceAdministratorFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_APPLICANT_EMAIL,
      subject: "Your insurance application progress",
      createdAt: now,
      html: buildPurgeReminderEmailHtml(),
    },
    {
      id: "sample-receipt",
      type: "receipt",
      clientId: payload.clientId,
      fromName: getInsuranceAdministratorFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_APPLICANT_EMAIL,
      subject: "Thank you! We\u2019ve received your insurance request",
      createdAt: now,
      html: buildReceiptEmailHtml(
        sampleApplicantPayload,
        "CONF-2026-001234",
        sampleReceiptValues,
      ),
    },
    {
      id: "sample-resume-magic-link",
      type: "resume-magic-link",
      clientId: payload.clientId,
      fromName: getInsuranceAdministratorFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_APPLICANT_EMAIL,
      subject: "Your requested link to continue your application",
      createdAt: now,
      html: buildResumeMagicLinkEmailHtml(),
    },
    {
      id: "advisor-sent-for-signature",
      type: "advisor-sent-for-signature",
      clientId: payload.clientId,
      fromName: getAdvisorNotificationsFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_ADVISOR_EMAIL,
      subject: "Application sent for signature",
      createdAt: now,
      html: buildAdvisorEmailHtml({
        title: "Application sent for signature",
        message: "This application has been sent for signature:",
        statusLabel: "Application sent for signature",
        payload,
      }),
    },
    {
      id: "advisor-pending-reminder",
      type: "advisor-pending-reminder",
      clientId: payload.clientId,
      fromName: getAdvisorNotificationsFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_ADVISOR_EMAIL,
      subject: "Application still pending signature",
      createdAt: now,
      html: buildAdvisorEmailHtml({
        title: "Application still pending signature",
        message: "This application has an update:",
        statusLabel: "Application still pending signature",
        payload,
      }),
    },
    {
      id: "advisor-edit-request",
      type: "advisor-edit-request",
      clientId: payload.clientId,
      fromName: getAdvisorNotificationsFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_ADVISOR_EMAIL,
      subject: "Application edit request",
      createdAt: now,
      html: buildAdvisorEmailHtml({
        title: "Application edit request",
        message: "This application has an update:",
        statusLabel: "Application edit requested",
        includeEditRequested: true,
        payload,
      }),
    },
    {
      id: "advisor-application-complete",
      type: "advisor-application-complete",
      clientId: payload.clientId,
      fromName: getAdvisorNotificationsFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_ADVISOR_EMAIL,
      subject: "Application submitted",
      createdAt: now,
      html: buildAdvisorEmailHtml({
        title: "Application submitted",
        message: "This application has an update:",
        statusLabel: "Application submitted",
        includeSubmissionDate: true,
        payload,
      }),
    },
  ];
}

export function readMockEmailPreviews() {
  const activeClientId = getClientEmailPayload().clientId;
  const storedPreviews = getStoredMockEmails().filter(
    (storedPreview) => storedPreview.clientId === activeClientId,
  );
  const alwaysVisiblePreviews = getAlwaysVisibleMockEmails();

  return [
    ...storedPreviews,
    ...alwaysVisiblePreviews.filter(
      (alwaysVisiblePreview) =>
        !storedPreviews.some(
          (storedPreview) => storedPreview.id === alwaysVisiblePreview.id,
        ),
    ),
  ];
}

export function getMockEmailAudience(
  preview: MockEmailPreview,
): MockEmailAudience {
  return preview.type.startsWith("advisor-") ? "advisor" : "applicant";
}

export function subscribeToMockEmailPreviews(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === MOCK_EMAIL_PREVIEWS_KEY) {
      onStoreChange();
    }
  }

  window.addEventListener(MOCK_EMAIL_PREVIEWS_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(
      MOCK_EMAIL_PREVIEWS_CHANGED_EVENT,
      onStoreChange,
    );
    window.removeEventListener("storage", handleStorage);
  };
}

export function clearMockEmailPreviews() {
  window.localStorage.removeItem(MOCK_EMAIL_PREVIEWS_KEY);
  notifyMockEmailPreviewsChanged();
}

export async function sendAutosaveMockEmail(values: ApplicationFormValues) {
  if (!hasRecipientEmail(values)) return;

  const payload = getApplicationEmailPayload(values);

  saveMockEmailPreview({
    id: getGeneratedMockEmailId("autosave"),
    type: "autosave",
    clientId: payload.clientId,
    fromName: getInsuranceAdministratorFromName(payload),
    fromEmail: MOCK_FROM_EMAIL,
    toEmail: payload.toEmail,
    subject: "Your insurance application is being saved",
    createdAt: new Date().toISOString(),
    html: buildAutosaveEmailHtml(payload),
  });
}

export async function sendReceiptMockEmail(
  values: ApplicationFormValues,
  confirmationNumber: string,
) {
  if (!hasRecipientEmail(values)) return;

  const payload = getApplicationEmailPayload(values);

  saveMockEmailPreview({
    id: getGeneratedMockEmailId("receipt"),
    type: "receipt",
    clientId: payload.clientId,
    fromName: getInsuranceAdministratorFromName(payload),
    fromEmail: MOCK_FROM_EMAIL,
    toEmail: payload.toEmail,
    subject: "Thank you! We\u2019ve received your insurance request",
    createdAt: new Date().toISOString(),
    html: buildReceiptEmailHtml(payload, confirmationNumber, values),
  });
}

export async function sendResumeMagicLinkMockEmail(emailAddress: string) {
  const trimmedEmailAddress = emailAddress.trim();
  if (!trimmedEmailAddress) return;

  const payload = getClientEmailPayload();

  saveMockEmailPreview({
    id: getGeneratedMockEmailId("resume-magic-link"),
    type: "resume-magic-link",
    clientId: payload.clientId,
    fromName: getInsuranceAdministratorFromName(payload),
    fromEmail: MOCK_FROM_EMAIL,
    toEmail: trimmedEmailAddress,
    subject: "Your requested link to continue your application",
    createdAt: new Date().toISOString(),
    html: buildResumeMagicLinkEmailHtml(),
  });
}

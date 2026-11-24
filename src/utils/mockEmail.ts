import { emailExampleTimeline, type EmailExampleKind } from '../domain/emailExampleTimeline';
import { emailBodyCss, emailTypography } from './emailTypography';
import { getPagePath } from '../config/pages';
import controlPresentation from '../../requirements/global/presentation-tokens.json';
const actionPresentation = controlPresentation.controls;
import insurer from '../../requirements/global/content/insurer.json';
import { buildContent } from '../content';
import { requirementText } from '../domain/requirementContent';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider } from '@mui/material/styles';
import { emailAlertPresentation, emailAlertTitleStyle } from './emailAlertPresentation';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import { Alert, AlertTitle } from '@mui/material';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import EditNotificationsRounded from '@mui/icons-material/EditNotificationsRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import { getResumePolicy } from '../config/resumePolicy';
import PendingActionsRounded from '@mui/icons-material/PendingActionsRounded';
import SiteSupport from '../components/layout/SiteSupport';
import ReceiptCoverageDecision from '../components/receipt/ReceiptCoverageDecision';
import { getClientCoverages } from '../config/client/getActiveClientCoverages';
import { getEffectiveSiteConfig } from '../repositories/sites';
import { getPrototypeLibrary, type PrototypeLibrary } from '../domain/prototypeLibrary';
import { receiptDecisionPresentation } from '../domain/receiptPresentation';
import { orderCoveragePresentation } from '../domain/coveragePresentation';
import { getOrderedDecisionEntries } from './coverageDecisions';
import advisorExample from '../../requirements/global/prototype-fixtures/advisor.json';
import emailExampleMetadata from '../../requirements/global/prototype-fixtures/email-metadata.json';
import receiptEmailExample from '../../requirements/global/prototype-fixtures/receipt-email.json';
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import { applicantRecovery, readSavedApplication } from '../services/applicantSaveService';
import { applicationSupportReference } from '../domain/applicationSupportReference';
import { resolveSiteSupportContact, resolveApplicationSupportReference } from '../data/siteSupport';
import theme from "../app/theme";
import {
  getActiveSite,
  getClientForSite,
  getSiteIdForClientAlias,
  resolveActiveAssociationFromApplication,
  resolveEffectiveBranding,
  resolveSiteSupport,
  type SiteId,
} from "../data";
import type { ClientId } from "../types";
export type MockEmailType =
  | "autosave"
  | "receipt"
  | "resume-magic-link"
  | "pending-reminder"
  | "purge-reminder"
  | "advisor-sent-for-signature"
  | "advisor-sent-to-applicant"
  | "advisor-pending-reminder"
  | "advisor-edit-request"
  | "advisor-application-complete"
  | "advisor-purge-reminder"
  | "advisor-applicant-purge-reminder";

export type MockEmailPreview = {
  id: string;
  type: MockEmailType;
  clientId: string;
  siteId: SiteId;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  createdAt: string;
  html: string;
};

const MOCK_EMAIL_PREVIEWS_KEY = "mockEmail:previews";
const MOCK_EMAIL_PREVIEWS_CHANGED_EVENT = "mockEmail:previewsChanged";
const MOCK_APPLICANT_FIRST_NAME = receiptEmailExample.application['first-name'];
const MOCK_APPLICANT_LAST_NAME = receiptEmailExample.application['last-name'];
const MOCK_APPLICANT_EMAIL = receiptEmailExample.application.email;
const MOCK_ADVISOR_EMAIL = advisorExample.email;
const MOCK_FROM_EMAIL = emailExampleMetadata.senderEmail;

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


function getDisplayName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || requirementText('email.applicant-fallback');
}

function getNormalizedWebsiteUrl(siteId: SiteId, website?: string) {
  const fallback = new URL(getPagePath('home'), window.location.origin);
  fallback.searchParams.set('site', siteId);
  const fallbackUrl = fallback.toString();

  if (!website) return fallbackUrl;

  const trimmedWebsite = website.trim().replace(/\/$/, "");
  if (!trimmedWebsite) return fallbackUrl;

  return trimmedWebsite.startsWith("http")
    ? trimmedWebsite
    : `https://${trimmedWebsite}`;
}

function getResumeUrl(siteId: SiteId) {
  const saved = import.meta.env.VITE_MOCK_PLATFORM_ENABLED ? readSavedApplication(siteId) : null;
  const query = new URLSearchParams({ site: siteId, ...(saved ? { applicationId: saved.applicationId } : {}) });
  return new URL(`${getPagePath('resume')}?${query}`, window.location.origin).toString();
}

function getResumeDisplayUrl(clientAcronym: string) {
  return `${clientAcronym.toLowerCase()}.${emailExampleMetadata.resumeDisplayDomain}${getPagePath('resume')}`;
}

function getClientEmailPayload(
  siteId: SiteId = getActiveSite().id,
  values: ApplicationFormValues = {},
  example?: EmailExampleKind,
  library?: PrototypeLibrary,
) {
  const client = library?.clientIdentity ?? getClientForSite(siteId)!;
  const association = resolveActiveAssociationFromApplication(
    siteId,
    values,
  ).association;
  const branding = library?.client.branding ?? resolveEffectiveBranding({
    siteId,
    associationId: association?.id,
  });
  const support = library?.client.support ?? resolveSiteSupport(siteId);
  const startUrl = getNormalizedWebsiteUrl(siteId, support.website);
  const contact = resolveSiteSupportContact(siteId, library);

  return {
    clientId: client.id,
    siteId,
    applicationValues: values,
    expiresAt: example ? emailExampleTimeline(example, getResumePolicy().retentionDays).expiresAt : readSavedApplication(siteId)?.expiresAt,
    associationId: association?.id,
    associationName: association?.name ?? client.name,
    clientAcronym: client.acronym,
    tpaName: contact.name,
    tpaAcronym: contact.acronym,
    tpaPhone: contact.phone,
    tpaEmail: contact.email,
    tpaWebsite: contact.website,
    hideSupportContact: contact.hideInEmail,
    supportReference: resolveApplicationSupportReference(siteId, { confirmationId: getStringValue(values, 'mock-submission-id') }),
    clientLogo: branding.logo,
    clientLogoAlt: branding.logoAlt,
    startUrl,
    resumeUrl: getResumeUrl(siteId),
    resumeDisplayUrl: getResumeDisplayUrl(client.acronym),
    // Static examples are request links, never executable unauthenticated recovery.
    resumeMagicLinkUrl: getResumeUrl(siteId),
  };
}

function getApplicationEmailPayload(values: ApplicationFormValues, siteId?: SiteId) {
  return {
    ...getClientEmailPayload(siteId, values),
    toEmail: getStringValue(values, "email"),
    firstName: getStringValue(values, "first-name"),
    lastName: getStringValue(values, "last-name"),
  };
}

function getInsuranceAdministratorFromName(
  _payload: ReturnType<typeof getClientEmailPayload>,
) {
  return buildContent(_payload.siteId).shared.emailSenderName;
}

function getAdvisorNotificationsFromName(
  _payload: ReturnType<typeof getClientEmailPayload>,
) {
  return buildContent(_payload.siteId).shared.emailSenderName;
}

function hasRecipientEmail(values: ApplicationFormValues) {
  return Boolean(getStringValue(values, "email"));
}

function getStoredMockEmails(): MockEmailPreview[] {
  try {
    const rawValue = window.localStorage.getItem(MOCK_EMAIL_PREVIEWS_KEY);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsedValue)) return [];
    return parsedValue.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const preview = value as Partial<MockEmailPreview>;
      if (typeof preview.siteId === "string") {
        return [preview as MockEmailPreview];
      }
      if (typeof preview.clientId !== "string") return [];
      return [
        {
          ...preview,
          siteId: getSiteIdForClientAlias(preview.clientId as ClientId),
        } as MockEmailPreview,
      ];
    });
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

  <body style="margin:0; padding:0; background-color:#eef2f7; ${emailBodyCss} color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="${emailBodyCss} background-color:#eef2f7; margin:0; padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="${emailBodyCss} max-width:600px; background-color:#ffffff; border-radius:28px; overflow:hidden;">
            <tr>
              <td style="${emailBodyCss} padding:32px 32px 0; color:#111827;">
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

function getApplicantSalutationHtml(payload: ReturnType<typeof getClientEmailPayload>) {
  const applicant = getDisplayName(getStringValue(payload.applicationValues, 'first-name'), getStringValue(payload.applicationValues, 'last-name'));
  const copy = buildContent(payload.siteId).shared;
  return `<p style="${emailBodyCss} margin:0 0 24px;">${escapeHtml(requirementText('salutation', { applicant }, { salutation: copy.emailSalutation }))}</p>`;
}

function advisorEmailText(payload: ReturnType<typeof getClientEmailPayload>, key: string) {
  const value = buildContent(payload.siteId).shared.emailAdvisor[key.replaceAll('.', '-')];
  return requirementText('value', { clientAcronym: payload.clientAcronym }, { value });
}

function emailDeadline(payload: ReturnType<typeof getClientEmailPayload>) {
  const date = new Date(payload.expiresAt ?? NaN);
  return Number.isFinite(date.getTime()) ? date : null;
}

function emailMessageVariables(payload: ReturnType<typeof getClientEmailPayload>): Record<string, string> {
  const policy = getResumePolicy();
  const deadline = emailDeadline(payload);
  return { associationName: payload.associationName, retentionDays: String(policy.retentionDays), linkMinutes: String(policy.linkValiditySeconds / 60), purgeDate: deadline ? formatMockDate(deadline) : '' };
}

function emailMessageTemplate(payload: ReturnType<typeof getClientEmailPayload>, key: string) {
  const value = buildContent(payload.siteId).shared.emailMessages[key.replaceAll('.', '-')];
  if (typeof value !== 'string') throw new Error(`Missing email message: ${key}`);
  return value;
}

function emailMessageText(payload: ReturnType<typeof getClientEmailPayload>, key: string) {
  return requirementText('value', emailMessageVariables(payload), { value: emailMessageTemplate(payload, key) });
}

/** Escaped text with optional emphasis on supplied variables; JSON never supplies HTML. */
function emailMessageHtml(payload: ReturnType<typeof getClientEmailPayload>, key: string, bold: string[] = []) {
  const variables = emailMessageVariables(payload);
  return emailMessageTemplate(payload, key).split(/(\{\{\w+\}\})/g).map(part => {
    const token = /^\{\{(\w+)\}\}$/.exec(part)?.[1];
    if (!token) return escapeHtml(part);
    if (!(token in variables)) throw new Error(`Missing email variable: ${token}`);
    const value = escapeHtml(variables[token]);
    return bold.includes(token) ? `<strong>${value}</strong>` : value;
  }).join('');
}

function getRetentionNoticeHtml(payload: ReturnType<typeof getClientEmailPayload>) {
  if (!emailDeadline(payload)) return '';
  return getNoticeHtml(emailMessageText(payload, 'common.retention-title'), emailMessageText(payload, 'common.retention-description'));
}

function getButtonHtml(label: string, href: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="${emailBodyCss} margin:28px 0;">
    <tr>
      <td align="center" style="${emailBodyCss} border-radius:999px; background-color:#006fff;">
        <a href="${escapeHtml(href)}" style="${emailBodyCss} display:inline-block; padding:17px 28px; color:#ffffff; line-height:1; font-weight:${actionPresentation.fontWeight}; text-decoration:none; border-radius:999px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function getVerifyIdentityNoticeHtml(payload: ReturnType<typeof getClientEmailPayload>) {
  return `<p style="${emailBodyCss} margin:0 0 16px; color:#374151;">${emailMessageHtml(payload, 'common.identity-notice')}</p>`;
}

function getSupportHtml(payload: ReturnType<typeof getClientEmailPayload>, reference = payload.supportReference) {
  return renderToStaticMarkup(createElement(ThemeProvider, { theme }, createElement(SiteSupport, {
    siteId: payload.siteId,
    presentation: 'email',
    contact: { name: payload.tpaName, acronym: payload.tpaAcronym, phone: payload.tpaPhone, email: payload.tpaEmail, website: payload.tpaWebsite, hideInEmail: payload.hideSupportContact },
    ...(reference?.kind === 'application' ? { applicationId: reference.id } : { confirmationId: reference?.id }),
  })));
}

function getNoticeHtml(title: string, body: string) {
  const presentation = emailAlertPresentation(theme, 'warning');
  return renderToStaticMarkup(createElement(ThemeProvider, { theme },
    createElement(Alert, {
      severity: 'warning', ...presentation,
      style: { ...presentation.style, marginTop: 20 },
      icon: createElement(WarningAmberRounded, { style: { width: 22, height: 22, fill: 'currentColor' } }),
    },
      createElement(AlertTitle, { style: emailAlertTitleStyle(theme) }, title), body,
    ),
  ));
}

function getNylFooterHtml(siteId: SiteId) {
  const footer = buildContent(siteId).footer;
  const logo = insurer['insurer.logo'];
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-family:${emailTypography.fontFamily}; margin:28px 0 0; border-top:1px solid #d1d5db; padding-top:18px;">
    <tr>
      <td style="font-family:${emailTypography.fontFamily}; padding-top:18px; vertical-align:top; width:50px;">
        <img src="${escapeHtml(logo.src)}" alt="${escapeHtml(logo.alt)}" width="50" height="50" style="font-family:${emailTypography.fontFamily}; display:block; width:50px; height:50px; border:0; outline:none; text-decoration:none; border-radius:2px;" />
      </td>
      <td style="font-family:${emailTypography.fontFamily}; padding-top:18px; padding-left:14px; vertical-align:top;">
        <p style="font-family:${emailTypography.fontFamily}; margin:0 0 4px; font-size:${emailTypography.footer.fontSize}px; line-height:1.4; font-weight:700; color:#111827;">${escapeHtml(footer.underwrittenBy.label)}</p>
        <p style="font-family:${emailTypography.fontFamily}; margin:0 0 4px; font-size:${emailTypography.footer.fontSize}px; line-height:1.4; color:#111827;">${escapeHtml(footer.underwrittenBy.name)}</p>
        <p style="font-family:${emailTypography.fontFamily}; margin:0 0 4px; font-size:${emailTypography.footer.fontSize}px; line-height:1.4; color:#111827;">${escapeHtml(footer.underwrittenBy.address).replaceAll("\n", "<br />")}</p>
        <p style="font-family:${emailTypography.fontFamily}; margin:0; font-size:${emailTypography.footer.legalFontSize}px; line-height:1.4; color:#6b7280;">${escapeHtml(footer.legal[1])}</p>
      </td>
    </tr>
  </table>`;
}

function getNoReplyHtml(siteId: SiteId) {
  return `<footer data-email-footer>${getNylFooterHtml(siteId)}
  <div style="font-family:${emailTypography.fontFamily}; margin:18px 0 24px; padding-top:14px;">
    <p style="font-family:${emailTypography.fontFamily}; margin:0; color:#6b7280; font-size:${emailTypography.footer.noReplyFontSize}px; line-height:1.45;">
      ${escapeHtml(buildContent(siteId).shared.emailMessages['footer-no-reply'])}
    </p>
  </div></footer>`;
}

type AdvisorEmailStatus = 'submitted' | 'sent-for-signature' | 'edit-requested' | 'pending-signature' | 'deleted';
function getAdvisorStatusIconHtml(status: AdvisorEmailStatus) {
  const isComplete = status === 'submitted';
  const Icon = { submitted: CheckCircleRounded, 'sent-for-signature': SendRounded, 'edit-requested': EditNotificationsRounded, 'pending-signature': PendingActionsRounded, deleted: DeleteOutlineRounded }[status];
  return renderToStaticMarkup(createElement(Icon, {
    'aria-hidden': true,
    style: { display: 'block', width: 22, height: 22, fill: 'currentColor', flex: '0 0 auto', color: isComplete ? theme.palette.success.main : theme.palette.primary.main },
  }));
}

function buildSavedApplicationEmailHtml(payload: ReturnType<typeof getApplicationEmailPayload>, kind: 'autosave' | 'invitation' | 'pending') {
  return getBaseEmailHtml({
    title: emailMessageText(payload, `${kind}.subject`),
    bodyHtml: `
      ${getApplicantSalutationHtml(payload)}
      <p style="${emailBodyCss} margin:0 0 20px;">${emailMessageHtml(payload, `${kind}.intro`, ['associationName'])}</p>
      ${kind !== 'pending' && emailDeadline(payload) ? `<p style="${emailBodyCss} margin:0 0 28px;">${emailMessageHtml(payload, `${kind}.deadline`, ['purgeDate'])}</p>` : ''}
      ${getVerifyIdentityNoticeHtml(payload)}
      ${getButtonHtml(emailMessageText(payload, 'common.continue-label'), payload.resumeUrl)}
      <p style="${emailBodyCss} margin:0 0 10px; color:#374151;">${emailMessageHtml(payload, 'common.copy-address')}</p>
      <p style="${emailBodyCss} margin:0 0 28px; word-break:break-all;"><a href="${escapeHtml(payload.resumeUrl)}" style="font-weight:${actionPresentation.fontWeight}; color:${theme.palette.primary.main}; text-decoration:${actionPresentation.linkDecoration};">${escapeHtml(payload.resumeDisplayUrl)}</a></p>
      <p style="${emailBodyCss} margin:0;">${emailMessageHtml(payload, 'common.closing')}</p>
      ${payload.hideSupportContact ? '' : getSupportHtml(payload)}
      ${getRetentionNoticeHtml(payload)}
      ${getNoReplyHtml(payload.siteId)}
    `,
  });
}

function buildAutosaveEmailHtml(payload: ReturnType<typeof getApplicationEmailPayload>) {
  return buildSavedApplicationEmailHtml(payload, 'autosave');
}
function buildApplicationSentToApplicantEmailHtml(payload: ReturnType<typeof getApplicationEmailPayload>) {
  return buildSavedApplicationEmailHtml(payload, 'invitation');
}

function receiptEmailContent(siteId: SiteId) { return buildContent(siteId).receipt.email; }

function buildReceiptEmailHtml(payload: ReturnType<typeof getApplicationEmailPayload>, confirmationNumber: string, library: PrototypeLibrary | null = getPrototypeLibrary(payload.siteId)) {
  const content = library?.content ?? buildContent(payload.siteId);
  const copy = content.receipt.email;
  const text = (key: keyof typeof copy) => escapeHtml(requirementText(key, { associationName: payload.associationName, tpaAcronym: payload.tpaAcronym }, { ...copy }));
  const configuration = library?.client ?? getEffectiveSiteConfig(payload.siteId);
  const products = orderCoveragePresentation(library?.products ?? getClientCoverages(configuration), configuration.coverages).products;
  const entries = getOrderedDecisionEntries(payload.applicationValues, products, library);
  const summary = renderToStaticMarkup(createElement(ThemeProvider, { theme },
    createElement('section', { 'aria-label': content.receipt.coverageDecisions.title }, entries.length ? entries.map(entry => {
      return createElement(ReceiptCoverageDecision, {
        key: `${entry.coverageId}:${entry.applicant}`, presentation: 'email', productName: entry.coverage.name,
        ...receiptDecisionPresentation(entry, payload.applicationValues, content.receipt),
        applicant: entry.applicant, applicantLabel: content.shared.applicantLabels[entry.applicant],
        showApplicant: entries.some(item => item.applicant !== 'member'),
      });
    }) : createElement('p', null, content.receipt.coverageDecisions.noSelectionsMessage)),
  ));
  return getBaseEmailHtml({
    title: copy.title,
    bodyHtml: `
      ${getApplicantSalutationHtml(payload)}
      <p style="margin:0 0 20px;">${text('intro')}</p>
      <p style="margin:0 0 16px;">${text('summary')}</p>
      ${summary}
      <p style="margin:24px 0 16px;">${text('closing')}</p>
      <p style="${emailBodyCss} margin:0 0 24px;">${text('signature')}</p>
      ${payload.hideSupportContact ? "" : getSupportHtml(payload, applicationSupportReference({ confirmationId: confirmationNumber }) ?? payload.supportReference)}
      ${getNoReplyHtml(payload.siteId)}
    `,
  });
}

function buildResumeMagicLinkEmailHtml(siteId?: SiteId, values: ApplicationFormValues = {}, recipient: 'Applicant' | 'Advisor' = 'Applicant') {
  const payload = getClientEmailPayload(siteId, values);
  return getBaseEmailHtml({
    title: emailMessageText(payload, 'resume.subject'),
    bodyHtml: `
      ${recipient === 'Applicant' ? getApplicantSalutationHtml(payload) : ''}
      <p style="${emailBodyCss} margin:0 0 20px;">${emailMessageHtml(payload, 'resume.intro', ['associationName'])}</p>
      ${getButtonHtml(emailMessageText(payload, 'resume.verify-label'), payload.resumeMagicLinkUrl)}
      <p style="${emailBodyCss} margin:0 0 20px;">${emailMessageHtml(payload, 'resume.expiry', ['linkMinutes'])}</p>
      <p style="${emailBodyCss} margin:0 0 8px; font-weight:700;">${emailMessageHtml(payload, 'resume.not-requested-title')}</p>
      <p style="${emailBodyCss} margin:0 0 20px;">${emailMessageHtml(payload, 'resume.not-requested-description')}</p>
      ${getNoReplyHtml(payload.siteId)}
    `,
  });
}
function buildPendingReminderEmailHtml(siteId?: SiteId) {
  const payload = getApplicationEmailPayload(receiptEmailExample.application, siteId);
  payload.expiresAt = emailExampleTimeline('pending', getResumePolicy().retentionDays).expiresAt;
  return buildSavedApplicationEmailHtml(payload, 'pending');
}

function buildPurgeReminderEmailHtml(siteId?: SiteId, advisorPrepared = false) {
  const payload = getClientEmailPayload(siteId, { ...receiptEmailExample.application, ...(advisorPrepared ? { 'advisor-email': advisorExample.email } : {}) });
  const copy = buildContent(payload.siteId).shared.emailPurge;
  const rawText = (key: string) => requirementText(key, { associationName: payload.associationName, retentionDays: String(getResumePolicy().retentionDays) }, copy);
  const text = (key: string) => escapeHtml(rawText(key));
  const advisorEmail = getStringValue(payload.applicationValues, 'advisor-email');
  const nextSteps = advisorPrepared ? `
    <p style="${emailBodyCss} margin:0 0 20px;">${text('advisor-next-step')}</p>
    ${advisorEmail ? `<p style="${emailBodyCss} margin:0 0 20px;"><a href="mailto:${escapeHtml(advisorEmail)}" style="color:${theme.palette.primary.main}; font-weight:${actionPresentation.fontWeight}; text-decoration:${actionPresentation.linkDecoration};">${text('advisor-contact-label')}</a></p>` : ''}
  ` : `
    <p style="${emailBodyCss} margin:0 0 20px;">${text('start-new')}</p>
    ${getButtonHtml(rawText('apply-label'), payload.startUrl)}
    <p style="${emailBodyCss} margin:0 0 10px;">${text('copy-address')}</p>
    <p style="${emailBodyCss} margin:0 0 28px;"><a href="${escapeHtml(payload.startUrl)}" style="color:${theme.palette.primary.main}; font-weight:${actionPresentation.fontWeight}; text-decoration:${actionPresentation.linkDecoration};">${escapeHtml(payload.startUrl)}</a></p>
    <p style="${emailBodyCss} margin:0 0 20px;">${text('questions')}</p>
    <p style="${emailBodyCss} margin:0;">${text('closing')}</p>
    ${payload.hideSupportContact ? '' : getSupportHtml(payload)}
  `;
  return getBaseEmailHtml({
    title: copy.subject,
    bodyHtml: `${getApplicantSalutationHtml(payload)}
      <p style="${emailBodyCss} margin:0 0 20px;">${text('intro')}</p>
      ${nextSteps}
      ${getNoReplyHtml(payload.siteId)}`,
  });
}

function buildAdvisorEmailHtml(options: {
  title: string;
  status: AdvisorEmailStatus;
  includeEditRequested?: boolean;
  includeSubmissionDate?: boolean;
  payload: ReturnType<typeof getClientEmailPayload>;
}) {
  const today = new Date();
  const isDeleted = options.status === 'deleted';
  const timeline = emailExampleTimeline(isDeleted ? 'deleted' : 'advisor', getResumePolicy().retentionDays, today.getTime());
  const sentDate = new Date(timeline.sentAt);
  const purgeDate = new Date(timeline.deletedAt ?? timeline.expiresAt);
  const editRequestDate = new Date(timeline.editRequestedAt);
  const text = (key: string) => advisorEmailText(options.payload, key);
  const details = [
    [text('association'), options.payload.associationName],
    [text('applicant-name'), getDisplayName(getStringValue(options.payload.applicationValues, 'first-name'), getStringValue(options.payload.applicationValues, 'last-name'))],
    [text('applicant-email'), MOCK_APPLICANT_EMAIL],
    [text('sent-for-signature'), formatMockDateTime(sentDate)],
    ...(isDeleted ? [[text('deleted'), formatMockDateTime(purgeDate)]] : options.includeSubmissionDate ? [[text('submitted'), formatMockDateTime(today)]] : [[text('scheduled-for-deletion'), formatMockDateTime(purgeDate)]]),
    ...(options.includeEditRequested ? [[text('edit-requested'), formatMockDateTime(editRequestDate)]] : []),
  ];
  const lines = details.map(([label, value]) => `<p style="${emailBodyCss} margin:0 0 12px;"><strong>${escapeHtml(label)}</strong>: ${escapeHtml(value)}</p>`).join('');
  const loginUrl = new URL(getPagePath('advisor-login'), window.location.origin);
  loginUrl.searchParams.set('site', options.payload.siteId);
  return getBaseEmailHtml({
    title: options.title,
    bodyHtml: `
      <p style="${emailBodyCss} display:flex; align-items:center; gap:8px; margin:0 0 24px; font-weight:700;">
        ${getAdvisorStatusIconHtml(options.status)} ${escapeHtml(text(`status.${options.status}`))}
      </p>
      ${isDeleted ? `<p style="${emailBodyCss} margin:0 0 20px;">${escapeHtml(text('purged-message'))}</p>` : ''}
      <section aria-label="${escapeHtml(options.title)}">${lines}</section>
      <p style="${emailBodyCss} margin:24px 0 12px;">${escapeHtml(text('portal-intro'))}</p>
      <p style="${emailBodyCss} margin:0 0 24px;"><a href="${escapeHtml(loginUrl.toString())}" style="color:${theme.palette.primary.main}; font-weight:${actionPresentation.fontWeight}; text-decoration:${actionPresentation.linkDecoration};">${escapeHtml(text('portal-link'))}</a></p>
      ${getNoReplyHtml(options.payload.siteId)}
    `,
  });
}

function getAlwaysVisibleMockEmails(siteId: SiteId = getActiveSite().id, library?: PrototypeLibrary): MockEmailPreview[] {
  const payload = getClientEmailPayload(siteId, receiptEmailExample.application, 'autosave', library);
  const now = new Date().toISOString();

  const sampleApplicantPayload = {
    ...payload,
    toEmail: MOCK_APPLICANT_EMAIL,
    firstName: MOCK_APPLICANT_FIRST_NAME,
    lastName: MOCK_APPLICANT_LAST_NAME,
  };

  const advisorApplicationPayload = { ...sampleApplicantPayload, ...getClientEmailPayload(siteId, receiptEmailExample.application, 'advisor', library) };

  return [
    {
      id: "sample-autosave",
      type: "autosave",
      clientId: payload.clientId,
      siteId: payload.siteId,
      fromName: getInsuranceAdministratorFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_APPLICANT_EMAIL,
      subject: emailMessageText(payload, 'autosave.subject'),
      createdAt: now,
      html: buildAutosaveEmailHtml(sampleApplicantPayload),
    },
    {
      id: "sample-pending-reminder",
      type: "pending-reminder",
      clientId: payload.clientId,
      siteId: payload.siteId,
      fromName: getInsuranceAdministratorFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_APPLICANT_EMAIL,
      subject: emailMessageText(payload, 'pending.subject'),
      createdAt: now,
      html: buildPendingReminderEmailHtml(siteId),
    },
    {
      id: "sample-purge-reminder",
      type: "purge-reminder",
      clientId: payload.clientId,
      siteId: payload.siteId,
      fromName: getInsuranceAdministratorFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_APPLICANT_EMAIL,
      subject: buildContent(payload.siteId).shared.emailPurge.subject,
      createdAt: now,
      html: buildPurgeReminderEmailHtml(siteId),
    },
    {
      id: "sample-receipt",
      type: "receipt",
      clientId: payload.clientId,
      siteId: payload.siteId,
      fromName: getInsuranceAdministratorFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_APPLICANT_EMAIL,
      subject: receiptEmailContent(payload.siteId).subject,
      createdAt: now,
      html: buildReceiptEmailHtml(
        sampleApplicantPayload,
        emailExampleMetadata.receiptConfirmationNumber,
        library,
      ),
    },
    {
      id: "sample-resume-magic-link",
      type: "resume-magic-link",
      clientId: payload.clientId,
      siteId: payload.siteId,
      fromName: getInsuranceAdministratorFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_APPLICANT_EMAIL,
      subject: emailMessageText(payload, 'resume.subject'),
      createdAt: now,
      html: buildResumeMagicLinkEmailHtml(siteId, receiptEmailExample.application),
    },
    {
      id: "advisor-sent-for-signature",
      type: "advisor-sent-for-signature",
      clientId: payload.clientId,
      siteId: payload.siteId,
      fromName: getAdvisorNotificationsFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_ADVISOR_EMAIL,
      subject: advisorEmailText(payload, 'status.sent-for-signature'),
      createdAt: now,
      html: buildAdvisorEmailHtml({
        title: advisorEmailText(payload, 'status.sent-for-signature'),
        status: 'sent-for-signature',
        payload: advisorApplicationPayload,
      }),
    },
    {
      id: "advisor-sent-to-applicant",
      type: "advisor-sent-to-applicant",
      clientId: payload.clientId,
      siteId: payload.siteId,
      fromName: getInsuranceAdministratorFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_APPLICANT_EMAIL,
      subject: emailMessageText(payload, 'invitation.subject'),
      createdAt: now,
      html: buildApplicationSentToApplicantEmailHtml(advisorApplicationPayload),
    },
    {
      id: "advisor-pending-reminder",
      type: "advisor-pending-reminder",
      clientId: payload.clientId,
      siteId: payload.siteId,
      fromName: getAdvisorNotificationsFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_ADVISOR_EMAIL,
      subject: advisorEmailText(payload, 'status.pending-signature'),
      createdAt: now,
      html: buildAdvisorEmailHtml({
        title: advisorEmailText(payload, 'status.pending-signature'),
        status: 'pending-signature',
        payload: advisorApplicationPayload,
      }),
    },
    {
      id: "advisor-edit-request",
      type: "advisor-edit-request",
      clientId: payload.clientId,
      siteId: payload.siteId,
      fromName: getAdvisorNotificationsFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_ADVISOR_EMAIL,
      subject: advisorEmailText(payload, 'edit-request-subject'),
      createdAt: now,
      html: buildAdvisorEmailHtml({
        title: advisorEmailText(payload, 'edit-request-subject'),
        status: 'edit-requested',
        includeEditRequested: true,
        payload: advisorApplicationPayload,
      }),
    },
    {
      id: "advisor-application-complete",
      type: "advisor-application-complete",
      clientId: payload.clientId,
      siteId: payload.siteId,
      fromName: getAdvisorNotificationsFromName(payload),
      fromEmail: MOCK_FROM_EMAIL,
      toEmail: MOCK_ADVISOR_EMAIL,
      subject: advisorEmailText(payload, 'status.submitted'),
      createdAt: now,
      html: buildAdvisorEmailHtml({
        title: advisorEmailText(payload, 'status.submitted'),
        status: 'submitted',
        includeSubmissionDate: true,
        payload: advisorApplicationPayload,
      }),
    },
    {
      id: 'advisor-purge-reminder', type: 'advisor-purge-reminder', clientId: payload.clientId, siteId: payload.siteId,
      fromName: getAdvisorNotificationsFromName(payload), fromEmail: MOCK_FROM_EMAIL, toEmail: MOCK_ADVISOR_EMAIL,
      subject: advisorEmailText(payload, 'status.deleted'), createdAt: now,
      html: buildAdvisorEmailHtml({ title: advisorEmailText(payload, 'status.deleted'), status: 'deleted', payload: advisorApplicationPayload }),
    },
    {
      id: 'advisor-applicant-purge-reminder', type: 'advisor-applicant-purge-reminder', clientId: payload.clientId, siteId: payload.siteId,
      fromName: getInsuranceAdministratorFromName(payload), fromEmail: MOCK_FROM_EMAIL, toEmail: MOCK_APPLICANT_EMAIL,
      subject: buildContent(payload.siteId).shared.emailPurge.subject, createdAt: now,
      html: buildPurgeReminderEmailHtml(siteId, true),
    },
  ];
}

/** Canonical synthetic messages for read-only demonstrations; never reads sent mail. */
export function getMockEmailSamples(siteId: SiteId, options?: { resumeRecipient?: 'Applicant' | 'Advisor'; library?: PrototypeLibrary }) {
  return getAlwaysVisibleMockEmails(siteId, options?.library).map(message => message.type === 'resume-magic-link' && options?.resumeRecipient === 'Advisor'
    ? { ...message, toEmail: MOCK_ADVISOR_EMAIL, html: buildResumeMagicLinkEmailHtml(siteId, receiptEmailExample.application, 'Advisor') }
    : message);
}

export function readMockEmailPreviews(siteId: SiteId = getActiveSite().id) {
  const storedPreviews = getStoredMockEmails().filter(
    (storedPreview) => storedPreview.siteId === siteId,
  );
  const alwaysVisiblePreviews = getAlwaysVisibleMockEmails(siteId);

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
    siteId: payload.siteId,
    fromName: getInsuranceAdministratorFromName(payload),
    fromEmail: MOCK_FROM_EMAIL,
    toEmail: payload.toEmail,
    subject: emailMessageText(payload, 'autosave.subject'),
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
    siteId: payload.siteId,
    fromName: getInsuranceAdministratorFromName(payload),
    fromEmail: MOCK_FROM_EMAIL,
    toEmail: payload.toEmail,
    subject: receiptEmailContent(payload.siteId).subject,
    createdAt: new Date().toISOString(),
    html: buildReceiptEmailHtml(payload, confirmationNumber),
  });
}

export async function sendResumeMagicLinkMockEmail(emailAddress: string) {
  const trimmedEmailAddress = emailAddress.trim();
  if (!trimmedEmailAddress) return;

  const payload = getClientEmailPayload();
  if (import.meta.env.VITE_MOCK_PLATFORM_ENABLED) {
    const application = readSavedApplication(payload.siteId);
    if (!application) throw new Error('Select a saved application reference before requesting recovery.');
    await applicantRecovery.request(application.applicationId, payload.siteId, trimmedEmailAddress);
    return;
  }

  saveMockEmailPreview({
    id: getGeneratedMockEmailId("resume-magic-link"),
    type: "resume-magic-link",
    clientId: payload.clientId,
    siteId: payload.siteId,
    fromName: getInsuranceAdministratorFromName(payload),
    fromEmail: MOCK_FROM_EMAIL,
    toEmail: trimmedEmailAddress,
    subject: emailMessageText(payload, 'resume.subject'),
    createdAt: new Date().toISOString(),
    html: buildResumeMagicLinkEmailHtml(),
  });
}

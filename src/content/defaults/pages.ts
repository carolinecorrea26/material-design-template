import { requirementText } from '../../domain/requirementContent';
import applicationContent from '../../../requirements/global/content/application.json';
import coverageContent from '../../../requirements/global/content/coverage.json';
import beneficiaryContent from '../../../requirements/global/content/beneficiary.json';
import contactContent from '../../../requirements/global/content/contact.json';
import eligibilityContent from '../../../requirements/global/content/eligibility.json';
import membershipContent from '../../../requirements/global/content/membership.json';
import homeContent from '../../../requirements/global/content/home.json';
import healthContent from "../../../requirements/global/content/health.json";
import paymentContent from "../../../requirements/global/content/payment.json";
import reviewContent from "../../../requirements/global/content/review.json";
import profileContent from '../../../requirements/global/content/profile.json';
import advisorLoginContent from '../../../requirements/global/content/advisor-login.json';
import confirmationContent from '../../../requirements/global/content/confirmations.json';
import receiptContent from '../../../requirements/global/content/receipt.json';
import recoveryContent from '../../../requirements/global/content/recovery.json';
import resumeContent from '../../../requirements/global/content/resume.json';
import type { PagesContent } from "../types";

/**
 * Default page titles and subheads.
 * The {{clientAcronym}} placeholder is replaced at runtime with the active client's acronym.
 */
export const pagesDefaults: Partial<PagesContent> = {
  maintenance: {
    title: recoveryContent['recovery.maintenance.title'],
    subhead: recoveryContent['recovery.maintenance.message'],
    recoveryGuidance: recoveryContent['recovery.maintenance.guidance'],
    navTitle: recoveryContent['recovery.maintenance.title'],
  },
  home: { title: homeContent['home.title'], navTitle: homeContent['home.title'] },
  membership: {
    title: membershipContent['membership.title'],
    subhead: membershipContent['membership.subhead'],
    navTitle: membershipContent['membership.breadcrumb'],
    infoNote: membershipContent['membership.page-note'],
    messages: {
      notMemberHeading: membershipContent['membership.not-member.heading'],
      notMemberBody: membershipContent['membership.not-member.body'],
      notMemberContact: membershipContent['membership.not-member.website'],
    },
  },
  eligibility: {
    title: eligibilityContent['eligibility.title'],
    subhead: eligibilityContent['eligibility.subhead'],
    navTitle: eligibilityContent['eligibility.breadcrumb'],
    sectionNotes: {
      selfEligibility: eligibilityContent['eligibility.note.self'],
      spouseSection: eligibilityContent['eligibility.note.spouse'],
      childSection: eligibilityContent['eligibility.note.children'],
    },
  },
  coverage: {
    title: coverageContent['coverage.title'],
    subhead: coverageContent['coverage.subhead'],
    navTitle: coverageContent['coverage.breadcrumb'],
  },
  beneficiary: {
    title: beneficiaryContent['beneficiary.title'],
    subhead: beneficiaryContent['beneficiary.subhead'],
    navTitle: beneficiaryContent['beneficiary.breadcrumb'],
  },
  contact: {
    title: contactContent['contact.title'],
    subhead: contactContent['contact.subhead'],
    navTitle: contactContent['contact.breadcrumb'],
    messages: { businessHeading: contactContent['contact.section.business'] },
  },
  review: {
    title: reviewContent["page.review.title"],
    subhead: reviewContent["page.review.subhead"],
    navTitle: reviewContent["page.review.nav-title"],
  },
  docusign: {
    title: applicationContent['page.docusign.title'],
    subhead: applicationContent['page.docusign.subhead'],
    navTitle: applicationContent['page.docusign.nav-title'],
  },
  "health-si": {
    title: healthContent['page.health-si.title'],
    subhead: healthContent['page.health-si.subhead'],
    navTitle: requirementText("page.health-si.nav-title"),
  },
  "health-tele": {
    title: healthContent['page.health-tele.title'],
    subhead: healthContent['page.health-tele.subhead'],
    navTitle: requirementText("page.health-tele.nav-title"),
  },
  "health-qd": {
    title: applicationContent['page.health-qd.title'],
    subhead: applicationContent['page.health-qd.subhead'],
    navTitle: requirementText("page.health-qd.nav-title"),
  },
  "health-di-supp": {
    title: healthContent['page.health-di-supp.title'],
    subhead: healthContent['page.health-di-supp.subhead'],
    navTitle: requirementText("page.health-di-supp.nav-title"),
  },
  "health-cir": {
    title: healthContent['page.health-cir.title'],
    subhead: healthContent['page.health-cir.subhead'],
    navTitle: requirementText("page.health-cir.nav-title"),
  },
  payment: {
    title: paymentContent["page.payment.title"],
    subhead: paymentContent["page.payment.subhead"],
    navTitle: paymentContent["page.payment.nav-title"],
  },
  receipt: {
    title: receiptContent['page.receipt.title'],
    subhead: receiptContent['page.receipt.subhead'],
    navTitle: receiptContent['page.receipt.nav-title'],
  },
  resume: {
    title: resumeContent['page.resume.title'],
    subhead: resumeContent['page.resume.subhead'],
    navTitle: resumeContent['page.resume.nav-title'],
  },
  "resume-method": {
    title: resumeContent['page.resume-method.title'],
    subhead: resumeContent['page.resume-method.subhead'],
    navTitle: resumeContent['page.resume-method.nav-title'],
  },
  "resume-code": {
    title: resumeContent['page.resume-code.title'],
    subhead: resumeContent['page.resume-code.subhead'],
    navTitle: resumeContent['page.resume-code.nav-title'],
  },
  "advisor-login": {
    title: advisorLoginContent['page.advisor-login.title'],
    subhead: advisorLoginContent['page.advisor-login.subhead'],
    navTitle: advisorLoginContent['page.advisor-login.nav-title'],
    sectionNotes: {
      advisorLoginNew: advisorLoginContent['page.advisor-login.section-notes.advisor-login-new'],
      advisorLoginSaved: advisorLoginContent['page.advisor-login.section-notes.advisor-login-saved'],
    },
  },
  "advisor-send-confirmation": {
    title: confirmationContent['confirmation.advisor.title'],
    subhead: confirmationContent['confirmation.advisor.subhead'],
    navTitle: confirmationContent['confirmation.advisor.nav-title'],
  },
  "application-edit-confirmation": {
    title: confirmationContent['confirmation.edit.title'],
    subhead: confirmationContent['confirmation.edit.subhead'],
    navTitle: confirmationContent['confirmation.edit.nav-title'],
  },
  "mock-email-preview": {
    title: applicationContent['page.mock-email-preview.title'],
    navTitle: applicationContent['page.mock-email-preview.nav-title'],
  },
  "site-details": {
    title: applicationContent['page.site-details.title'],
    navTitle: applicationContent['page.site-details.nav-title'],
  },
  "design-system": {
    title: applicationContent['page.design-system.title'],
    navTitle: applicationContent['page.design-system.nav-title'],
  },
  "portal-admin": {
    title: applicationContent['page.portal-admin.title'],
    navTitle: applicationContent['page.portal-admin.nav-title'],
  },
  cms: {
    title: applicationContent['page.cms.title'],
    navTitle: applicationContent['page.cms.nav-title'],
  },
  "portal-template-project": {
    title: applicationContent['page.portal-template-project.title'],
    navTitle: applicationContent['page.portal-template-project.nav-title'],
  },
  "portal-requirements-project": {
    title: applicationContent['page.portal-requirements-project.title'],
    navTitle: applicationContent['page.portal-requirements-project.nav-title'],
  },
  profile: {
    title: profileContent['page.profile.title'],
    subhead: profileContent['page.profile.subhead'],
    navTitle: profileContent['page.profile.nav-title'],
    sectionNotes: { profileFinancialSelf: profileContent['profile.other-coverage-note'], profileFinancialSpouse: profileContent['profile.other-coverage-note'] },
  },
};

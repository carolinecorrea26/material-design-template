import type { ComponentType } from "react";
import type { PageId } from "../types";
import ErrorPage from "../pages/ErrorPage";
import AdvisorLogin from "../pages/AdvisorLogin";
import AdvisorSendConfirmation from "../pages/AdvisorSendConfirmation";
import ApplicationEditConfirmation from "../pages/ApplicationEditConfirmation";
import Beneficiary from "../pages/Beneficiary";
import Contact from "../pages/Contact";
import Coverage from "../pages/Coverage";
import DocuSign from "../pages/DocuSign";
import Eligibility from "../pages/Eligibility";
import HealthCir from "../pages/HealthCir";
import HealthDiSupp from "../pages/HealthDiSupp";
import HealthQd from "../pages/HealthQd";
import HealthSi from "../pages/HealthSi";
import HealthTele from "../pages/HealthTele";
import Home from "../pages/Home";
import Membership from "../pages/Membership";
import Payment from "../pages/Payment";
import Profile from "../pages/Profile";
import Receipt from "../pages/Receipt";
import Resume from "../pages/Resume";
import ResumeCode from "../pages/ResumeCode";
import ResumeMethod from "../pages/ResumeMethod";
import Review from "../pages/Review";
export const applicationPageComponents: Partial<Record<PageId, ComponentType>> = {
  home: Home,
  membership: Membership,
  eligibility: Eligibility,
  coverage: Coverage,
  beneficiary: Beneficiary,
  contact: Contact,
  profile: Profile,
  review: Review,
  docusign: DocuSign,
  "health-si": HealthSi,
  "health-tele": HealthTele,
  "health-qd": HealthQd,
  "health-di-supp": HealthDiSupp,
  "health-cir": HealthCir,
  payment: Payment,
  receipt: Receipt,
  resume: Resume,
  "resume-method": ResumeMethod,
  "resume-code": ResumeCode,
  "error-400": () => <ErrorPage status={400} />,
  "error-404": () => <ErrorPage status={404} />,
  "error-500": () => <ErrorPage status={500} />,
  "session-expired": () => <ErrorPage status="session-expired" />,
  "technical-error": () => <ErrorPage status="technical-error" />,
  maintenance: () => <ErrorPage status="maintenance" />,
  "advisor-login": AdvisorLogin,
  "advisor-send-confirmation": AdvisorSendConfirmation,
  "application-edit-confirmation": ApplicationEditConfirmation,
};

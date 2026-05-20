import type { ComponentType } from "react";
import { routedPages } from "./routedPages";
import Home from "../pages/Home";
import Membership from "../pages/Membership";
import Eligibility from "../pages/Eligibility";
import Coverage from "../pages/Coverage";
import CoverageQuestions from "../pages/CoverageQuestions";
import CoverageOptions from "../pages/CoverageOptions";
import Beneficiary from "../pages/Beneficiary";
import Contact from "../pages/Contact";
import Personal from "../pages/Personal";
import Financial from "../pages/Financial";
import Review from "../pages/Review";
import DocuSign from "../pages/DocuSign";
import HealthSi from "../pages/HealthSi";
import HealthQd from "../pages/HealthQd";
import HealthDi from "../pages/HealthDi";
import HealthCir from "../pages/HealthCir";
import Payment from "../pages/Payment";
import Receipt from "../pages/Receipt";
import Resume from "../pages/Resume";
import AdvisorLogin from "../pages/AdvisorLogin";
import AdvisorSendConfirmation from "../pages/AdvisorSendConfirmation";
import MockEmailPreview from "../pages/MockEmailPreview";
import InformationArchitecture from "../pages/InformationArchitecture";

type RoutedPageId = (typeof routedPages)[number];

export const pageComponents: Record<RoutedPageId, ComponentType> = {
  home: Home,
  membership: Membership,
  eligibility: Eligibility,
  coverage: Coverage,
  "coverage-questions": CoverageQuestions,
  "coverage-options": CoverageOptions,
  beneficiary: Beneficiary,
  contact: Contact,
  personal: Personal,
  financial: Financial,
  review: Review,
  docusign: DocuSign,
  "health-si": HealthSi,
  "health-qd": HealthQd,
  "health-di": HealthDi,
  "health-cir": HealthCir,
  payment: Payment,
  receipt: Receipt,
  resume: Resume,
  "advisor-login": AdvisorLogin,
  "advisor-send-confirmation": AdvisorSendConfirmation,
  "mock-email-preview": MockEmailPreview,
  "information-architecture": InformationArchitecture,
};

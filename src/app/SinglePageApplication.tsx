import SinglePageSections from "../components/layout/SinglePageSections";
import Membership from "../pages/Membership";
import Eligibility from "../pages/Eligibility";
import Coverage from "../pages/Coverage";
import Beneficiary from "../pages/Beneficiary";
import Contact from "../pages/Contact";
import Profile from "../pages/Profile";
import Review from "../pages/Review";
import HealthSi from "../pages/HealthSi";
import HealthLi from "../pages/HealthLi";
import HealthQd from "../pages/HealthQd";
import HealthDi from "../pages/HealthDi";
import HealthCir from "../pages/HealthCir";
import Payment from "../pages/Payment";
import DocuSign from "../pages/DocuSign";
import Receipt from "../pages/Receipt";
import type { PageId } from "../types";

const sectionComponents = {
  membership: Membership, eligibility: Eligibility, coverage: Coverage,
  beneficiary: Beneficiary, contact: Contact, profile: Profile, review: Review,
  "health-si": HealthSi, "health-li": HealthLi, "health-qd": HealthQd,
  "health-di": HealthDi, "health-cir": HealthCir, payment: Payment,
  docusign: DocuSign, receipt: Receipt,
};

export default function SinglePageApplication({ initialPageId }: { initialPageId?: PageId }) {
  return <SinglePageSections initialPageId={initialPageId} renderPage={pageId => {
    const Component = sectionComponents[pageId as keyof typeof sectionComponents];
    return Component ? <Component key={pageId} /> : null;
  }} />;
}

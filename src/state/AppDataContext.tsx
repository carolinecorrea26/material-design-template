import * as React from "react";
import type { EligibilityForm, CoverageCat } from "../validation/eligibility";
import type { ApplicantType } from "../constants/getStartedProducts";
import type { ContactForm } from "../validation/contact";
import type { ProfileForm } from "../validation/profile";
import type { HealthHistoryForm } from "../validation/healthHistory";
import type { SelectedItem } from "../types/app";

type ApplicantFlags = {
  self: boolean;
  spouse: boolean;
  child: boolean;
};

type CoverageSummary = {
  self: CoverageCat[];
  spouse: CoverageCat[];
  child: CoverageCat[];
};

type GetStartedData = {
  productSelections: string[];
  productApplicantSelections: Record<string, ApplicantType[]>;
  applicants: ApplicantFlags;
  coverageByApplicant: CoverageSummary;
  updatedAt: string;
};

type ConsentForm = {
  readAndSign?: boolean;
  electronicConsent: boolean;
  spouseElectronicConsent?: boolean;
  authorizationConsent?: boolean;
  dividendsConsent: boolean;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
};

type MembershipForm = {
  memberType: "current" | "new";
  attestationCheckbox?: boolean;
  qualification?: string;
  phoneNumber?: string;
  phoneType?: "home" | "business" | "mobile";
  email?: string;
};

type AppData = {
  isAdvisorFlow?: boolean;
  getStarted?: GetStartedData;
  membership?: MembershipForm;
  eligibility?: EligibilityForm;
  coverage?: SelectedItem[];
  contact?: ContactForm;
  profile?: ProfileForm;
  healthHistory?: HealthHistoryForm;
  consent?: ConsentForm;
};

type Ctx = {
  data: AppData;
  setIsAdvisorFlow: (v: boolean) => void;
  setGetStarted: (v: GetStartedData) => void;
  setMembership: (v: MembershipForm) => void;
  setEligibility: (v: EligibilityForm) => void;
  setCoverage: (v: SelectedItem[]) => void;
  setContact: (v: ContactForm) => void;
  setProfile: (v: ProfileForm) => void;
  setHealthHistory: (v: HealthHistoryForm) => void;
  setConsent: (v: ConsentForm) => void;
  resetAppData: () => void;
};

const Ctx = React.createContext<Ctx | undefined>(undefined);
const STORAGE_KEY = "nyl-appdata-v1";
const AUTOSAVE_FLAG = "nyl-autosave-enabled";

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<AppData>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const setIsAdvisorFlow = (v: boolean) =>
    setData((d) => ({ ...d, isAdvisorFlow: v }));
  const setGetStarted = (v: GetStartedData) =>
    setData((d) => ({ ...d, getStarted: v }));
  const setMembership = (v: MembershipForm) =>
    setData((d) => ({ ...d, membership: v }));
  const setEligibility = (v: EligibilityForm) =>
    setData((d) => ({ ...d, eligibility: v }));
  const setCoverage = (v: SelectedItem[]) =>
    setData((d) => ({ ...d, coverage: v }));
  const setContact = (v: ContactForm) => setData((d) => ({ ...d, contact: v }));
  const setProfile = (v: ProfileForm) => setData((d) => ({ ...d, profile: v }));
  const setHealthHistory = (v: HealthHistoryForm) =>
    setData((d) => ({ ...d, healthHistory: v }));
  const setConsent = (v: ConsentForm) => setData((d) => ({ ...d, consent: v }));
  const resetAppData = () => {
    setData({});
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(AUTOSAVE_FLAG);
  };

  React.useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  return (
    <Ctx.Provider
      value={{
        data,
        setIsAdvisorFlow,
        setGetStarted,
        setMembership,
        setEligibility,
        setCoverage,
        setContact,
        setProfile,
        setHealthHistory,
        setConsent,
        resetAppData,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAppData() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

// Called by Contact submit to enable autosave (doc rule)
export function enableAutosave() {
  sessionStorage.setItem(AUTOSAVE_FLAG, "1");
}

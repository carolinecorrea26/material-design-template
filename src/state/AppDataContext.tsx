import * as React from "react";
import type { EligibilityForm } from "../validation/eligibility";
import type { ContactForm } from "../validation/contact";
import type { ProfileForm } from "../validation/profile";
import type { HealthHistoryForm } from "../validation/healthHistory";
import type { SelectedItem } from "../types/app";

type ConsentForm = {
  electronicConsent: boolean;
  spouseElectronicConsent?: boolean;
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
  setMembership: (v: MembershipForm) => void;
  setEligibility: (v: EligibilityForm) => void;
  setCoverage: (v: SelectedItem[]) => void;
  setContact: (v: ContactForm) => void;
  setProfile: (v: ProfileForm) => void;
  setHealthHistory: (v: HealthHistoryForm) => void;
  setConsent: (v: ConsentForm) => void;
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

  const setIsAdvisorFlow = (v: boolean) => setData(d => ({ ...d, isAdvisorFlow: v }));
  const setMembership = (v: MembershipForm) => setData(d => ({ ...d, membership: v }));
  const setEligibility = (v: EligibilityForm) => setData(d => ({ ...d, eligibility: v }));
  const setCoverage = (v: SelectedItem[]) => setData(d => ({ ...d, coverage: v }));
  const setContact = (v: ContactForm) => setData(d => ({ ...d, contact: v }));
  const setProfile = (v: ProfileForm) => setData(d => ({ ...d, profile: v }));
  const setHealthHistory = (v: HealthHistoryForm) => setData(d => ({ ...d, healthHistory: v }));
  const setConsent = (v: ConsentForm) => setData(d => ({ ...d, consent: v }));

  // only autosave after Contact submit, per doc
  React.useEffect(() => {
    const enabled = sessionStorage.getItem(AUTOSAVE_FLAG) === "1";
    if (enabled) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  return <Ctx.Provider value={{ data, setIsAdvisorFlow, setMembership, setEligibility, setCoverage, setContact, setProfile, setHealthHistory, setConsent }}>{children}</Ctx.Provider>;
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

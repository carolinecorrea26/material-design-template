export type ApplicationSessionState = {
  reviewSubmitted: boolean;
  advisorApplicantFlow: boolean;
};

const STORAGE_KEYS = {
  reviewSubmitted: "reviewSubmitted",
  advisorApplicantFlow: "advisorApplicantFlow",
} as const;

function readFlag(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]) {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(key) === "true";
}

function writeFlag(
  key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS],
  enabled: boolean,
) {
  if (typeof window === "undefined") return;

  if (enabled) {
    window.sessionStorage.setItem(key, "true");
  } else {
    window.sessionStorage.removeItem(key);
  }
}

/** Persistence adapter for transient application-flow state. */
export const applicationSessionStorage = {
  read(): ApplicationSessionState {
    return {
      reviewSubmitted: readFlag(STORAGE_KEYS.reviewSubmitted),
      advisorApplicantFlow: readFlag(STORAGE_KEYS.advisorApplicantFlow),
    };
  },
  writeReviewSubmitted(enabled: boolean) {
    writeFlag(STORAGE_KEYS.reviewSubmitted, enabled);
  },
  writeAdvisorApplicantFlow(enabled: boolean) {
    writeFlag(STORAGE_KEYS.advisorApplicantFlow, enabled);
  },
  clear() {
    writeFlag(STORAGE_KEYS.reviewSubmitted, false);
    writeFlag(STORAGE_KEYS.advisorApplicantFlow, false);
  },
};

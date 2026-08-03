import type { SharedContent } from "../types";
import {
  applicantLabels,
  applicantSectionTitles,
} from "../../config/formSectionTitle";

export const sharedDefaults: SharedContent = {
  applicantLabels: { ...applicantLabels },
  applicantSectionTitles: { ...applicantSectionTitles },
  cookieBanner: {
    message:
      "New York Life uses cookies to enhance your experience and analyze site performance. By continuing, you agree to our use of cookies.",
    learnMoreLabel: "Privacy Notice",
    learnMoreHref: "https://www.newyorklife.com/privacy",
  },
};

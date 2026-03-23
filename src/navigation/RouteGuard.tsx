import * as React from "react";
import { Navigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";

type Gate =
  | "eligibility"
  | "coverage"
  | "contact"
  | "personal"
  | "financial"
  | "review"
  | "health"
  | "payment"
  | "docusign";

export default function RouteGuard({
  require,
  children,
}: {
  require: Gate;
  children: React.ReactNode;
}) {
  const { data } = useAppData();

  const hasEligibility = !!data.eligibility && !!data.eligibility.state;
  const hasCoverageSelections =
    Array.isArray(data.eligibility?.coverageProductSelections) &&
    data.eligibility.coverageProductSelections.length > 0;
  const hasCoverageQuotes =
    Array.isArray(data.coverage) && data.coverage.length > 0;
  const hasCoverage = hasCoverageSelections || hasCoverageQuotes;
  const hasContact = !!data.contact;
  const hasProfile = !!data.profile;
  const hasConsent =
    !!data.consent?.readAndSign &&
    !!data.consent?.electronicConsent &&
    !!data.consent?.authorizationConsent &&
    !!data.consent?.dividendsConsent;

  // Until Preview/Consent pages are implemented, treat them as requiring the prior step
  const ok =
    require === "eligibility"
      ? true
      : require === "coverage"
        ? hasEligibility
        : require === "contact"
          ? hasCoverage
          : require === "personal"
            ? hasContact
            : require === "financial"
              ? hasProfile
              : require === "review"
                ? hasProfile
                : require === "health"
                  ? hasProfile && hasConsent
                  : require === "payment"
                    ? hasProfile && hasConsent
                    : require === "docusign"
                      ? hasProfile && hasConsent
                      : false;

  if (!ok) {
    // Redirect to the earliest unmet step
    if (!hasEligibility) return <Navigate to="/eligibility" replace />;
    if (!hasCoverage) return <Navigate to="/coverage-options" replace />;
    if (!hasContact) return <Navigate to="/contact" replace />;
    if (!hasProfile) return <Navigate to="/personal-information" replace />;
    if (!hasConsent) return <Navigate to="/application-review" replace />;
    return <Navigate to="/docusign" replace />;
  }

  return <>{children}</>;
}

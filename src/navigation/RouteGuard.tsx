import * as React from "react";
import { Navigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";

type Gate =
  | "eligibility"
  | "coverage"
  | "contact"
  | "profile"
  | "preview"
  | "consent"
  | "docusign";

export default function RouteGuard({
  require,
  children
}: {
  require: Gate;
  children: React.ReactNode;
}) {
  const { data } = useAppData();

  const hasEligibility = !!data.eligibility && !!data.eligibility.state;
  const hasCoverage = Array.isArray(data.coverage) && data.coverage.length > 0;
  const hasContact = !!data.contact;
  const hasProfile = !!data.profile;
  const hasConsent = !!data.consent;

  // Until Preview/Consent pages are implemented, treat them as requiring the prior step
  const ok =
    require === "eligibility" ? true :
    require === "coverage"    ? hasEligibility :
    require === "contact"     ? hasCoverage :
    require === "profile"     ? hasContact :
    require === "preview"     ? hasProfile :
    require === "consent"     ? hasProfile :
    require === "docusign"    ? hasConsent :
    false;

  if (!ok) {
    // Redirect to the earliest unmet step
    if (!hasEligibility) return <Navigate to="/eligibility" replace />;
    if (!hasCoverage)    return <Navigate to="/coverage" replace />;
    if (!hasContact)     return <Navigate to="/contact" replace />;
    if (!hasProfile)     return <Navigate to="/profile" replace />;
    if (!hasConsent)     return <Navigate to="/consent" replace />;
    return <Navigate to="/preview" replace />;
  }

  return <>{children}</>;
}

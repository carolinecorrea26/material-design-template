import { eligibilityIneligibilityMessage } from "../domain/applicantExperience";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { useEffect, useRef, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import FormRoutePage from "../app/RoutePage";
import EligibilitySections from "../app/sections/ConfiguredEligibilitySections";
import MemberVerification from "../components/verification/MemberVerification";
import { lookupPrototypeTpa, resolveTpaOutcome, tpaOutcomeValues, type TpaResolution } from "../domain/tpaIntegration";
import {
  deriveStateProvinceFromZipOrPostalCode,
} from "../utils/zipToStateProvince";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { getActiveClient } from "../config/client/getActiveClient";

export default function Eligibility() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setPageValues } = useApplicationForm();
  const client = getActiveClient();

  const resumeLoadedFromRouteState = Boolean(
    (location.state as { resumeLoaded?: boolean } | null)?.resumeLoaded,
  );

  const [showResumeLoadedSnackbar, setShowResumeLoadedSnackbar] = useState(
    resumeLoadedFromRouteState,
  );

  const [memberVerificationOpen, setMemberVerificationOpen] = useState(false);
  // Track the lookup inputs so changes require a fresh verification attempt.
  const tpaCompletedRef = useRef<string | null>(null);
  const tpaMemberRef = useRef<TpaResolution>({ existingMember: false, activeCoverage: false });
  // Ref to the hidden form submit button so we can trigger it after modal close.
  const formSubmitRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!resumeLoadedFromRouteState) return;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, navigate, resumeLoadedFromRouteState]);

  function handleModalClose(verified: boolean) {
    setPageValues(tpaOutcomeValues(tpaMemberRef.current, resolveTpaOutcome(client, tpaMemberRef.current, verified)));
    setMemberVerificationOpen(false);
    // Programmatically re-submit the form now that the modal is done.
    // validate() will pass this time because tpaCompletedRef.current is true.
    requestAnimationFrame(() => {
      formSubmitRef.current?.click();
    });
  }

  return (
    <>
      <FormRoutePage
        pageId="eligibility"
        disableNextButton={values => !!eligibilityIneligibilityMessage(client.applicantExperience, values)}
        validate={(nextValues) => {
          const disqualification = eligibilityIneligibilityMessage(client.applicantExperience, nextValues);
          if (disqualification) return disqualification;
          if (client.applicantExperience?.eligibleStatesOnly && !deriveStateProvinceFromZipOrPostalCode(String(nextValues["zip-postal-code"] ?? ""), getClientPageFields("eligibility").find(f => f.id === "state-province")?.options ?? [])) return "The state for this ZIP / Postal Code may not be eligible for coverage.";
          const dependents = Array.isArray(nextValues.dependents)
            ? nextValues.dependents
            : [];

          if (dependents.includes("child") && client.applicantExperience?.childEligibility?.mode !== "notice-only") {
            const children = Array.isArray(nextValues.children)
              ? nextValues.children
              : [];
            if (children.length === 0) {
              return "Please add at least one child or remove child from dependents.";
            }
          }

          if (dependents.includes("spouse")) {
            const spouseFirstName = String(
              nextValues["spouse-first-name"] ?? "",
            ).trim();
            const spouseLastName = String(
              nextValues["spouse-last-name"] ?? "",
            ).trim();
            if (!spouseFirstName && !spouseLastName) {
              return "Please add spouse details or remove spouse from dependents.";
            }
          }

          const member = lookupPrototypeTpa(client, nextValues);
          const outcome = resolveTpaOutcome(client, member);
          const lookupKey = JSON.stringify([client.id, client.tpaIntegration, member,
            (client.tpaIntegration?.lookupFields ?? ["first-name", "last-name", "birth-date", ...Object.keys(client.features?.memberVerificationMatchFacts ?? {})]).map(field => nextValues[field])]);
          if (outcome.verifyIdentity && tpaCompletedRef.current !== lookupKey) {
            tpaMemberRef.current = member;
            tpaCompletedRef.current = lookupKey;
            setPageValues(tpaOutcomeValues(member, resolveTpaOutcome(client, member, false)));
            setMemberVerificationOpen(true);
            return "\u200b";
          }
          if (!outcome.verifyIdentity) setPageValues(tpaOutcomeValues(member, outcome));

          return undefined;
        }}
      >
        {(props) => (
          <>
            {eligibilityIneligibilityMessage(client.applicantExperience, props.watchedValues) && <Alert severity="error" sx={{ mb: 2 }}>{eligibilityIneligibilityMessage(client.applicantExperience, props.watchedValues)}</Alert>}
            <EligibilitySections {...props} />
            {/* Hidden submit trigger used by handleModalClose */}
            <button
              ref={formSubmitRef}
              type="submit"
              form={`eligibility-form`}
              style={{ display: "none" }}
              aria-hidden="true"
            />
          </>
        )}
      </FormRoutePage>

      <MemberVerification
        open={memberVerificationOpen}
        onClose={handleModalClose}
      />

      <Snackbar
        open={showResumeLoadedSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowResumeLoadedSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowResumeLoadedSnackbar(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Saved application loaded successfully.
        </Alert>
      </Snackbar>
    </>
  );
}

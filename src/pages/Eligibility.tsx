import { requirementValidationMessage } from "../domain/requirementValidations";
import { eligibilityIneligibilityMessage } from "../domain/applicantExperience";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { useRef, useState } from "react";
import FormRoutePage from "../app/RoutePage";
import EligibilitySections from "../app/sections/ConfiguredEligibilitySections";
import MemberVerification from "../components/verification/MemberVerification";
import VerificationAddress from "../components/verification/VerificationAddress";
import { resolveMappedFields } from "../domain/requirementFields";
import { getActiveSite } from "../data";
import { lookupPrototypeTpa, resolveTpaOutcome, tpaOutcomeValues, type TpaResolution } from "../domain/tpaIntegration";
import { useApplicationForm, type ApplicationFormValues } from "../app/ApplicationFormContext";
import { getActiveClient } from "../config/client/getActiveClient";

export default function Eligibility() {
  const { setPageValues } = useApplicationForm();
  const client = getActiveClient();

  const [memberVerificationOpen, setMemberVerificationOpen] = useState(false);
  const [verificationAddressValues, setVerificationAddressValues] = useState<ApplicationFormValues | null>(null);
  // Track the lookup inputs so changes require a fresh verification attempt.
  const tpaCompletedRef = useRef<string | null>(null);
  const tpaPendingRef = useRef<string | null>(null);
  const tpaMemberRef = useRef<TpaResolution>({ existingMember: false, activeCoverage: false });
  // Ref to the hidden form submit button so we can trigger it after modal close.
  const formSubmitRef = useRef<HTMLButtonElement | null>(null);

  function handleModalClose(verified: boolean) {
    tpaCompletedRef.current = tpaPendingRef.current;
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
        validate={(nextValues) => {
          const disqualification = eligibilityIneligibilityMessage(client.applicantExperience, nextValues);
          if (disqualification) return requirementValidationMessage('applicant-ineligible');
          if (client.applicantExperience?.eligibleStatesOnly && !getClientPageFields("eligibility").find(f => f.id === "state-province")?.options?.some(option => option.value === nextValues['state-province'])) return requirementValidationMessage('eligible-state-required');
          const dependents = Array.isArray(nextValues.dependents)
            ? nextValues.dependents
            : [];

          if (dependents.includes("child") && client.applicantExperience?.childEligibility?.mode !== "notice-only") {
            const children = Array.isArray(nextValues.children)
              ? nextValues.children
              : [];
            if (children.length === 0) {
              return requirementValidationMessage('child-required');
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
              return requirementValidationMessage('spouse-details-required');
            }
          }

          return undefined;
        }}
        onBeforeNext={({ values: nextValues }) => {
          const member = lookupPrototypeTpa(client, nextValues);
          const outcome = resolveTpaOutcome(client, member);
          const lookupKey = JSON.stringify([client.id, client.tpaIntegration, member,
            (client.tpaIntegration?.lookupFields ?? ["first-name", "last-name", "birth-date", ...Object.keys(client.features?.memberVerificationMatchFacts ?? {})]).map(field => nextValues[field])]);
          if (outcome.verifyIdentity && tpaCompletedRef.current !== lookupKey) {
            tpaMemberRef.current = member;
            tpaPendingRef.current = lookupKey;
            setPageValues(tpaOutcomeValues(member, resolveTpaOutcome(client, member, false)));
            if (client.tpaIntegration?.requireAddressBeforeVerification) {
              setVerificationAddressValues({
                ...nextValues,
                state: nextValues.state ?? nextValues["state-province"],
                "zip-code": nextValues["zip-code"] ?? nextValues["zip-postal-code"],
              });
            } else setMemberVerificationOpen(true);
            return false;
          }
          if (!outcome.verifyIdentity) setPageValues(tpaOutcomeValues(member, outcome));

          return true;
        }}
      >
        {(props) => (
          <>
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

      {verificationAddressValues && <VerificationAddress
        fields={resolveMappedFields({ component: "verification-address" }, { siteId: getActiveSite().id, page: "eligibility" })}
        values={verificationAddressValues}
        onContinue={address => {
          setPageValues(address);
          setVerificationAddressValues(null);
          setMemberVerificationOpen(true);
        }}
        onClose={() => setVerificationAddressValues(null)}
      />}
      <MemberVerification
        open={memberVerificationOpen}
        onClose={handleModalClose}
      />

    </>
  );
}

import ProfileSections from "../components/profile/ProfileSections";
import { getActiveClient } from "../config/client/getActiveClient";
import { buildSelectedCoverageEntries } from "../utils/coverageDecisions";
import { requiresFinancialQuestionnaire } from "../domain/financialQuestionnaire";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { useMemo, useRef, useState } from "react";
import FormRoutePage, {
  isSectionVisible,
  type BeforeNextContext,
} from "../app/RoutePage";
import { shouldShowApplicantLabel } from "../utils/applicantVisibility";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { useApplicationForm } from "../app/ApplicationFormContext";
import SendApplicationDialog from "../components/layout/SendApplicationDialog";
import {
  getApplicantEmail,
  getApplicantName,
} from "../utils/applicantIdentity";
import { getContent } from "../content";

const sendToApplicantContent = getContent().dialogs.sendApplication.sendToApplicant;

function getStoredCoverageAmounts(values: Record<string, unknown>) {
  if (
    values.coverageAmounts != null &&
    typeof values.coverageAmounts === "object" &&
    !Array.isArray(values.coverageAmounts)
  ) {
    return values.coverageAmounts as Record<string, number>;
  }
  return {};
}

function toNumericAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeApplicantId(rawApplicantId: string) {
  if (rawApplicantId === "self") return "member";
  return rawApplicantId;
}

export default function Profile() {
  const { values } = useApplicationForm();
  const coverages = useMemo(() => getActiveClientCoverages(), []);

  // Advisor flow: show send-application dialog before navigating after Profile.
  // advisor-flow-type is set in ApplicationFormContext when an advisor logs in.
  const isAdvisorFlow = Boolean(values["advisor-flow-type"]);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const pendingContinueRef = useRef<(() => void) | null>(null);

  const applicantName = getApplicantName(values);
  const applicantEmail = getApplicantEmail(values);

  function handleSendConfirm() {
    setSendDialogOpen(false);
    const continueNavigation = pendingContinueRef.current;
    pendingContinueRef.current = null;
    continueNavigation?.();
  }

  function handleSendCancel() {
    setSendDialogOpen(false);
    pendingContinueRef.current = null;
  }

  function handleBeforeNext({ continueNavigation }: BeforeNextContext) {
    if (!isAdvisorFlow) {
      return true;
    }

    pendingContinueRef.current = continueNavigation;
    setSendDialogOpen(true);
    return false;
  }

  return (
    <>
      <FormRoutePage pageId="profile" onBeforeNext={handleBeforeNext}
        resolveNextPageId={isAdvisorFlow ? () => "advisor-send-confirmation" : undefined}>
        {({ control, errors, watchedValues, allFields, pageSections }) => {
          const selectedCoverageIds = Array.isArray(
            watchedValues["coverageSelections"],
          )
            ? watchedValues["coverageSelections"]
            : [];
          const selectedCoverageIdSet = new Set(selectedCoverageIds);

          // Determine which coverage types the member/spouse have
          const storedAmounts = getStoredCoverageAmounts(watchedValues);
          const selectedCoverages = coverages.filter((c) =>
            selectedCoverageIdSet.has(c.id),
          );
          const coverageIdSet = new Set(coverages.map((c) => c.id));
          const selectedCoveragesById = new Map(
            selectedCoverages.map((c) => [c.id, c]),
          );

          function parseCoverageAmountKey(key: string) {
            const [firstPart, secondPart] = key.split(":").map((p) => p.trim());
            if (!firstPart || !secondPart) return null;
            if (coverageIdSet.has(firstPart))
              return {
                coverageId: firstPart,
                applicant: normalizeApplicantId(secondPart),
              };
            if (coverageIdSet.has(secondPart))
              return {
                coverageId: secondPart,
                applicant: normalizeApplicantId(firstPart),
              };
            return null;
          }

          function hasCoverage(
            applicantId: "member" | "spouse",
            categoryId: "LI" | "DI",
            minimumAmount = 0,
          ) {
            return Object.entries(storedAmounts).some(([key, rawAmount]) => {
              const parsedKey = parseCoverageAmountKey(key);
              if (!parsedKey) return false;
              if (parsedKey.applicant !== applicantId) return false;
              if (
                selectedCoverageIdSet.size > 0 &&
                !selectedCoverageIdSet.has(parsedKey.coverageId)
              )
                return false;
              const coverage = selectedCoveragesById.get(parsedKey.coverageId);
              if (!coverage || coverage.categoryId !== categoryId) return false;
              return toNumericAmount(rawAmount) > minimumAmount;
            });
          }

          const selfHasLife = hasCoverage("member", "LI");
          const selfHasDisability = hasCoverage("member", "DI");
          const spouseHasLife = hasCoverage("spouse", "LI");
          const spouseHasDisability = hasCoverage("spouse", "DI");
          const activeMemberProducts = new Set(buildSelectedCoverageEntries(watchedValues, coverages).filter(entry => entry.applicant === "member").map(entry => entry.coverageId));
          const selectedMemberProducts = new Set(Object.entries(storedAmounts).flatMap(([key, amount]) => {
            const parsed = parseCoverageAmountKey(key);
            return parsed?.applicant === "member" && activeMemberProducts.has(parsed.coverageId) && selectedCoverageIdSet.has(parsed.coverageId) && toNumericAmount(amount) > 0 ? [parsed.coverageId] : [];
          }));
          const financialQuestionnaireRequired = requiresFinancialQuestionnaire(
            getPrototypeLibrary()?.site.configuration.products ?? [], selectedMemberProducts,
            Object.fromEntries(Object.entries(storedAmounts).flatMap(([key, amount]) => { const parsed = parseCoverageAmountKey(key); return parsed?.applicant === "member" ? [[parsed.coverageId, amount]] : []; })),
            getPrototypeLibrary()?.site.configuration.financialQuestionnairePolicies ?? [],
          );

          const library = getPrototypeLibrary();
          return <ProfileSections control={control} errors={errors} watchedValues={watchedValues} allFields={allFields}
            pageSections={pageSections.filter(section => isSectionVisible(section, watchedValues) && (section.id !== "profileFinancialQuestionnaireSelf" || financialQuestionnaireRequired))}
            selfHasLife={selfHasLife} selfHasDisability={selfHasDisability} spouseHasLife={spouseHasLife} spouseHasDisability={spouseHasDisability}
            applicantLabels={getActiveClient().applicantLabels}
            showApplicantLabels={{ self: shouldShowApplicantLabel("self", watchedValues), spouse: shouldShowApplicantLabel("spouse", watchedValues) }}
            lifeReplacementNotice={library?.client.applicantExperience?.profile?.lifeReplacementNotice}
            disabilityCollections={{ self: library?.fieldCollections.selfDisabilityCompanies, spouse: library?.fieldCollections.spouseDisabilityCompanies }} />;

        }}
      </FormRoutePage>

      {isAdvisorFlow && (
        <SendApplicationDialog
          open={sendDialogOpen}
          onClose={handleSendCancel}
          onConfirm={handleSendConfirm}
          title={sendToApplicantContent.title}
          introText={sendToApplicantContent.introText}
          recipientName={applicantName}
          recipientEmail={applicantEmail}
          recipientLabel="applicant"
        />
      )}
    </>
  );
}

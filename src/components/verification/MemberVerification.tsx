import AppModal from "../layout/AppModal";
import verificationFixture from "../../../requirements/global/prototype-fixtures/verification.json";
import { requirementText, requirementTextList } from "../../domain/requirementContent";
import { getSurfaceFields } from "../../config/fields/storedSurfaces";
import { getPrototypeLibrary } from '../../domain/prototypeLibrary';
import type { FieldDefinition } from '../../domain/fields';
import { useState } from "react";
import { useForm } from "react-hook-form";
import FieldRenderer from "../forms/FieldRenderer";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import {
  Box,
  Button,
  Divider,
  MobileStepper,
  Stack,
  Typography,
} from "@mui/material";

// ---------------------------------------------------------------------------
// Dummy LexisNexis-style security questions
// ---------------------------------------------------------------------------



const NONE_ANSWER = verificationFixture.failureAnswer;
type VerificationPresentation = { method: FieldDefinition; questions: FieldDefinition[] };
export function verificationPresentation(library = getPrototypeLibrary()): VerificationPresentation {
  if (!library) throw new Error('Missing fresh-start verification presentation');
  const method = getSurfaceFields('verificationControls', library).find(field => field.id === 'verification-method');
  const questions = getSurfaceFields('verificationQuestions', library);
  if (!method || !questions.length) throw new Error('Missing fresh-start verification fields');
  return { method, questions };
}

// ---------------------------------------------------------------------------
// Sub-step 0: method selection
// ---------------------------------------------------------------------------

type VerificationMethod = "text" | "voice" | "security-questions" | "skip";

function MethodStep({
  onNext, field,
}: {
  onNext: (method: VerificationMethod) => void;
  field: FieldDefinition;
}) {
  const form = useForm<Record<string, string | boolean | string[]>>({
    defaultValues: { [field.id]: "" },
  });
  const method = String(form.watch(field.id) ?? "");

  return (
    <Stack spacing={3}>
      <Typography variant="body1">
        {requirementText("eligibility.verification.method-intro")}
      </Typography>
      <FieldRenderer field={field} control={form.control} errors={form.formState.errors} />
      {["text", "voice"].includes(method) && (
        <Typography variant="caption" color="text.secondary">{requirementText("eligibility.verification.code-notice", { phone: verificationFixture.maskedPhone })}</Typography>
      )}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          disabled={!method}
          onClick={() => method && onNext(method as VerificationMethod)}
        >
          {requirementText("eligibility.verification.next")}
        </Button>
      </Box>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Sub-step 1: security questions
// ---------------------------------------------------------------------------

function SecurityQuestionsStep({
  onNext, questions,
}: {
  onNext: (passed: boolean) => void;
  questions: FieldDefinition[];
}) {
  const form = useForm<Record<string, string | boolean | string[]>>({
    defaultValues: Object.fromEntries(questions.map(question => [question.id, ""])),
  });
  const answers = form.watch();

  const allAnswered = questions.every((q) => !q.required || q.options?.some(option => option.value === answers[q.id]));

  function handleNext() {
    const failed = questions.some(
      (q) => answers[q.id] === NONE_ANSWER,
    );
    onNext(!failed);
  }

  return (
    <Stack spacing={3}>
      <Typography variant="body1">
        {requirementText("eligibility.verification.questions-intro")}
      </Typography>
      {questions.map((q) => (
        <Box key={q.id}>
          <FieldRenderer field={q} control={form.control} errors={form.formState.errors} />
          <Divider sx={{ mt: 2 }} />
        </Box>
      ))}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          disabled={!allAnswered}
          onClick={handleNext}
        >
          {requirementText("eligibility.verification.next")}
        </Button>
      </Box>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Sub-step 2: result
// ---------------------------------------------------------------------------

function ResultStep({
  passed,
  onClose,
}: {
  passed: boolean;
  onClose: () => void;
}) {
  return (
    <Stack spacing={3} alignItems="center" sx={{ py: 2, textAlign: "center" }}>
      {passed ? (
        <>
          <CheckCircleRoundedIcon
            sx={{ fontSize: 64, color: "success.main" }}
          />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {requirementText("eligibility.verification.success.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {requirementText("eligibility.verification.success.body")}
          </Typography>
          <Button variant="contained" onClick={onClose}>
            {requirementText("eligibility.verification.continue")}
          </Button>
        </>
      ) : (
        <>
          <CancelRoundedIcon sx={{ fontSize: 64, color: "error.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {requirementText("eligibility.verification.failure.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {requirementText("eligibility.verification.failure.body")}
          </Typography>
          <Button variant="contained" onClick={onClose}>
            {requirementText("eligibility.verification.continue")}
          </Button>
        </>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type MemberVerificationProps = {
  open: boolean;
  onClose: (verified: boolean) => void;
  presentation?: VerificationPresentation;
};

export default function MemberVerification({
  open,
  onClose, presentation: suppliedPresentation,
}: MemberVerificationProps) {

  // Steps: 0 = method selection, 1 = security questions (or skip), 2 = result
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<VerificationMethod | null>(null);
  const [verificationPassed, setVerificationPassed] = useState<boolean | null>(
    null,
  );

  function handleMethodNext(selected: VerificationMethod) {
    setMethod(selected);
    if (selected === "security-questions") {
      setStep(1);
    } else {
      // text / voice / skip — skip straight to result (passed = true for skip/code flows)
      setVerificationPassed(selected !== "skip" ? true : null);
      setStep(2);
    }
  }

  function handleQuestionsNext(passed: boolean) {
    setVerificationPassed(passed);
    setStep(2);
  }

  function handleClose() {
    onClose(verificationPassed === true);
    // Reset after close animation
    setTimeout(() => {
      setStep(0);
      setMethod(null);
      setVerificationPassed(null);
    }, 300);
  }

  const stepLabels = requirementTextList('eligibility.verification.steps');
  const presentation = suppliedPresentation ?? (open ? verificationPresentation() : undefined);
  if (!presentation) return null;
  // For non-security-question flows the stepper still shows 3 dots but we skip
  // directly to step 2 without rendering step 1 content.

  return (
    <AppModal open={open} onClose={handleClose} maxWidth={560} minHeight="auto"
      title={requirementText("eligibility.verification.title")} closeLabel={requirementText("eligibility.verification.close")}
      headerContent={      <MobileStepper
        role="group"
        aria-label={stepLabels[step]}
        variant="dots"
        steps={stepLabels.length}
        position="static"
        activeStep={step}
        nextButton={null}
        backButton={null}
        sx={{
          justifyContent: "center",
          bgcolor: "transparent",
          pb: 1.5,
          pt: 0.5,
          "& .MuiMobileStepper-dot": { mx: 0.5 },
        }}
      />}>
        {step === 0 && <MethodStep field={presentation.method} onNext={handleMethodNext} />}
        {step === 1 && method === "security-questions" && (
          <SecurityQuestionsStep questions={presentation.questions} onNext={handleQuestionsNext} />
        )}
        {step === 2 && (
          <ResultStep
            passed={verificationPassed === true}
            onClose={handleClose}
          />
        )}
    </AppModal>
  );
}

// ---------------------------------------------------------------------------
// TPA trigger detection
// ---------------------------------------------------------------------------

/** Match the configured prototype verification facts without Site identity. */
export function isTpaMemberMatch(
  expectedFacts: Record<string, string> | undefined,
  values: Record<string, unknown>,
): boolean {
  return !!expectedFacts && Object.keys(expectedFacts).length > 0 && Object.entries(expectedFacts).every(
    ([field, expected]) => String(values[field] ?? "").trim().toLowerCase() === expected.trim().toLowerCase(),
  );

}

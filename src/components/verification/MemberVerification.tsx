import { getSurfaceField, getSurfaceFields } from "../../config/fields/storedSurfaces";
import { useState } from "react";
import { useForm } from "react-hook-form";
import FieldRenderer from "../forms/FieldRenderer";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MobileStepper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

// ---------------------------------------------------------------------------
// Dummy LexisNexis-style security questions
// ---------------------------------------------------------------------------



const NONE_ANSWER = "None of the answers apply to me";

// ---------------------------------------------------------------------------
// Sub-step 0: method selection
// ---------------------------------------------------------------------------

type VerificationMethod = "text" | "voice" | "security-questions" | "skip";

function MethodStep({
  onNext,
}: {
  onNext: (method: VerificationMethod) => void;
}) {
  const field = getSurfaceField("verificationControls", "verification-method")!;
  const form = useForm<Record<string, string | boolean | string[]>>({
    defaultValues: { [field.id]: "" },
  });
  const method = String(form.watch(field.id) ?? "");

  return (
    <Stack spacing={3}>
      <Typography variant="body1">
        We need to verify your identity before proceeding. Please choose how you
        would like to complete verification.
      </Typography>
      <FieldRenderer field={field} control={form.control} errors={form.formState.errors} />
      {["text", "voice"].includes(method) && (
        <Typography variant="caption" color="text.secondary">Code will be sent to ••••••1111.</Typography>
      )}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          disabled={!method}
          onClick={() => method && onNext(method as VerificationMethod)}
        >
          Next
        </Button>
      </Box>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Sub-step 1: security questions
// ---------------------------------------------------------------------------

function SecurityQuestionsStep({
  onNext,
}: {
  onNext: (passed: boolean) => void;
}) {
  const questions = getSurfaceFields("verificationQuestions");
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
        Please answer the following questions to verify your identity.
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
          Next
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
            Member verification successful
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your identity has been verified. You can now continue with your
            application.
          </Typography>
          <Button variant="contained" onClick={onClose}>
            Continue
          </Button>
        </>
      ) : (
        <>
          <CancelRoundedIcon sx={{ fontSize: 64, color: "error.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Member verification unsuccessful
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We were unable to verify your identity based on the answers
            provided. You may continue your application without verification.
          </Typography>
          <Button variant="contained" onClick={onClose}>
            Continue
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
};

export default function MemberVerification({
  open,
  onClose,
}: MemberVerificationProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

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

  const stepLabels = ["Choose method", "Answer questions", "Result"];
  // For non-security-question flows the stepper still shows 3 dots but we skip
  // directly to step 2 without rendering step 1 content.

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      fullScreen={!isDesktop}
      PaperProps={{
        sx: isDesktop ? { maxWidth: 560, minHeight: "auto" } : {},
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          pb: 1,
        }}
      >
        <Typography component="span" variant="h5">Member verification</Typography>
        <IconButton onClick={handleClose} aria-label="Close" size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      {/* Dot stepper */}
      <MobileStepper
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
      />

      <DialogContent dividers>
        {step === 0 && <MethodStep onNext={handleMethodNext} />}
        {step === 1 && method === "security-questions" && (
          <SecurityQuestionsStep onNext={handleQuestionsNext} />
        )}
        {step === 2 && (
          <ResultStep
            passed={verificationPassed === true}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
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

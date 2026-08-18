import { useState } from "react";
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
  FormControl,
  FormControlLabel,
  IconButton,
  MobileStepper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

// ---------------------------------------------------------------------------
// Dummy LexisNexis-style security questions
// ---------------------------------------------------------------------------

const SECURITY_QUESTIONS: {
  id: string;
  question: string;
  options: string[];
}[] = [
  {
    id: "sq-1",
    question: "In what city were you living in 2005?",
    options: [
      "Albany",
      "Rochester",
      "Syracuse",
      "Buffalo",
      "None of the answers apply to me",
    ],
  },
  {
    id: "sq-2",
    question: "What kind of car did you own in 2007?",
    options: [
      "Honda Civic",
      "Toyota Camry",
      "Ford Focus",
      "Chevrolet Malibu",
      "None of the answers apply to me",
    ],
  },
  {
    id: "sq-3",
    question: "Which of the following have you been associated with?",
    options: [
      "Oak Street",
      "Maple Avenue",
      "Cedar Lane",
      "Elm Drive",
      "None of the answers apply to me",
    ],
  },
];

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
  const [method, setMethod] = useState<VerificationMethod | "">("");

  return (
    <Stack spacing={3}>
      <Typography variant="body1">
        We need to verify your identity before proceeding. Please choose how you
        would like to complete verification.
      </Typography>
      <FormControl>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Choose how to provide verification
        </Typography>
        <RadioGroup
          value={method}
          onChange={(e) => setMethod(e.target.value as VerificationMethod)}
        >
          <FormControlLabel
            value="text"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Send text code
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  to ••••••1111
                </Typography>
              </Box>
            }
            sx={{ mb: 1 }}
          />
          <FormControlLabel
            value="voice"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Send voice code
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  to ••••••1111
                </Typography>
              </Box>
            }
            sx={{ mb: 1 }}
          />
          <FormControlLabel
            value="security-questions"
            control={<Radio />}
            label={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Answer security questions
              </Typography>
            }
            sx={{ mb: 1 }}
          />
          <FormControlLabel
            value="skip"
            control={<Radio />}
            label={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Proceed without member verification
              </Typography>
            }
          />
        </RadioGroup>
      </FormControl>
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
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const allAnswered = SECURITY_QUESTIONS.every((q) => answers[q.id]);

  function handleNext() {
    const failed = SECURITY_QUESTIONS.some(
      (q) => answers[q.id] === NONE_ANSWER,
    );
    onNext(!failed);
  }

  return (
    <Stack spacing={3}>
      <Typography variant="body1">
        Please answer the following questions to verify your identity.
      </Typography>
      {SECURITY_QUESTIONS.map((q) => (
        <Box key={q.id}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {q.question}
          </Typography>
          <FormControl fullWidth>
            <RadioGroup
              value={answers[q.id] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
              }
            >
              {q.options.map((opt) => (
                <FormControlLabel
                  key={opt}
                  value={opt}
                  control={<Radio size="small" />}
                  label={
                    <Typography
                      variant="body2"
                      color={opt === NONE_ANSWER ? "text.secondary" : undefined}
                    >
                      {opt}
                    </Typography>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>
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
        <Typography variant="h5">Member verification</Typography>
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

/**
 * Returns true when the submitted eligibility values match the dummy TPA
 * member record (ABE client, Caroline Correa, DOB 08/26/1990, state NY).
 */
export function isTpaMemberMatch(
  clientId: string,
  values: Record<string, unknown>,
): boolean {
  if (clientId !== "abe") return false;

  const firstName = String(values["first-name"] ?? "")
    .trim()
    .toLowerCase();
  const lastName = String(values["last-name"] ?? "")
    .trim()
    .toLowerCase();
  const dob = String(values["birth-date"] ?? "").trim();
  const state = String(values["state-province"] ?? "")
    .trim()
    .toUpperCase();

  return (
    firstName === "caroline" &&
    lastName === "correa" &&
    dob === "1990-08-26" &&
    state === "NY"
  );
}

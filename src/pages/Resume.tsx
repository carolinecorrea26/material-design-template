import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { getActiveClient } from "../client/getActiveClient";
import { getPagePath, getPageTitle } from "../config/pages";
import FormPage from "../components/form/FormPage";
import {
  useApplicationForm,
  type ApplicationFormValues,
} from "../state/ApplicationFormContext";
import type { ClientId } from "../types/client";

type ResumeStep = 1 | 2 | 3;
type DeliveryMethod = "text-message" | "phone-call";

const RESUME_LINK_URL =
  "http://redesignv2--material-design-template.netlify.app/resume?resumeFlow=code-preference";

const MOCK_SAVED_APPLICATIONS: Record<string, ApplicationFormValues> = {
  "returning.user@example.com": {
    membership: "yes",
    "first-name": "Taylor",
    "last-name": "Morgan",
    "email-address": "returning.user@example.com",
    "phone-number": "(555) 555-0133",
  },
};

function getMembershipPrefill(clientId: ClientId): string {
  if (clientId === "ama") return "physician";
  if (clientId === "waepa") return "current";
  return "yes";
}

function getSavedApplicationForEmail(
  emailAddress: string,
  clientId: ClientId,
): ApplicationFormValues {
  const normalizedEmail = emailAddress.trim().toLowerCase();
  const savedValues = MOCK_SAVED_APPLICATIONS[normalizedEmail] ?? {
    "first-name": "Taylor",
    "last-name": "Morgan",
    "email-address": normalizedEmail,
    "phone-number": "(555) 555-0133",
  };

  return {
    ...savedValues,
    membership: getMembershipPrefill(clientId),
  };
}

function sendResumeLinkEmail(emailAddress: string) {
  const subject = encodeURIComponent("Resume your application");
  const body = encodeURIComponent(
    `Resume your application here: ${RESUME_LINK_URL}`,
  );

  window.location.href = `mailto:${encodeURIComponent(emailAddress)}?subject=${subject}&body=${body}`;
}

export default function Resume() {
  const location = useLocation();
  const navigate = useNavigate();
  const client = getActiveClient();
  const { setPageValues } = useApplicationForm();

  const shouldOpenCodePreferenceModal =
    new URLSearchParams(location.search).get("resumeFlow") ===
    "code-preference";

  const [isModalOpen, setIsModalOpen] = useState(shouldOpenCodePreferenceModal);
  const [step, setStep] = useState<ResumeStep>(2);

  const [emailAddress, setEmailAddress] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showEmailSentMessage, setShowEmailSentMessage] = useState(false);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | "">("");
  const [deliveryMethodError, setDeliveryMethodError] = useState<string | null>(
    null,
  );

  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeError, setPhoneCodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const mailtoTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (mailtoTimeoutRef.current !== null) {
        window.clearTimeout(mailtoTimeoutRef.current);
      }
    };
  }, []);

  function closeModalToResumePage() {
    setIsModalOpen(false);
    setStep(2);
    setDeliveryMethodError(null);
    setPhoneCodeError(null);
    navigate(getPagePath("resume"), { replace: true });
  }

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emailAddress.trim()) {
      setEmailError("Enter your email address.");
      return;
    }

    setEmailError(null);
    if (mailtoTimeoutRef.current !== null) {
      window.clearTimeout(mailtoTimeoutRef.current);
    }

    mailtoTimeoutRef.current = window.setTimeout(() => {
      sendResumeLinkEmail(emailAddress.trim());
    }, 10000);
    setShowEmailSentMessage(true);
  }

  function handleBackToEmailStep() {
    closeModalToResumePage();
  }

  function handleBackToDeliveryMethod() {
    setStep(2);
    setPhoneCodeError(null);
  }

  function handleDeliveryContinue() {
    if (!deliveryMethod) {
      setDeliveryMethodError("Select how to receive your phone code.");
      return;
    }

    setDeliveryMethodError(null);
    setStep(3);
  }

  function handleVerifySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!phoneCode.trim()) {
      setPhoneCodeError("Enter your phone code.");
      return;
    }

    setPhoneCodeError(null);
    setIsVerifying(true);

    window.setTimeout(() => {
      const savedApplication = getSavedApplicationForEmail(
        emailAddress,
        client.id,
      );

      setPageValues(savedApplication);
      setIsVerifying(false);
      setIsModalOpen(false);

      navigate(getPagePath("eligibility"), {
        state: { resumeLoaded: true },
      });
    }, 700);
  }

  return (
    <>
      <FormPage title={getPageTitle("resume")}>
        <Box component="form" onSubmit={handleEmailSubmit} noValidate>
          {/* <Typography variant="body1" sx={{ color: "text.secondary", mb: 2 }}>
            A secure link will be sent to your email to allow you to resume your
            application.
          </Typography> */}
          <TextField
            fullWidth
            label="Email address"
            type="email"
            value={emailAddress}
            onChange={(event) => {
              setEmailAddress(event.target.value);
              if (showEmailSentMessage) {
                setShowEmailSentMessage(false);
              }
            }}
            error={Boolean(emailError)}
            helperText={emailError ?? undefined}
          />
          {showEmailSentMessage ? (
            <Alert severity="success" sx={{ mt: 1.5, mb: 2 }}>
              A secure link has been sent to your email. Please click the link
              in the email to resume your application.
            </Alert>
          ) : null}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button type="submit" variant="contained">
              Next
            </Button>
          </Box>
        </Box>
      </FormPage>

      <Dialog
        open={isModalOpen}
        onClose={closeModalToResumePage}
        fullWidth
        maxWidth="sm"
      >
        {step === 2 ? (
          <>
            <DialogTitle>
              How would you like to receive your phone verification code?
            </DialogTitle>
            <DialogContent>
              <FormControl
                component="fieldset"
                error={Boolean(deliveryMethodError)}
                fullWidth
              >
                <FormLabel>Send code by:</FormLabel>
                <RadioGroup
                  value={deliveryMethod}
                  onChange={(event) => {
                    setDeliveryMethod(event.target.value as DeliveryMethod);
                  }}
                >
                  <FormControlLabel
                    value="text-message"
                    control={<Radio />}
                    label="Text message"
                  />
                  <FormControlLabel
                    value="phone-call"
                    control={<Radio />}
                    label="Phone call"
                  />
                </RadioGroup>
              </FormControl>

              {deliveryMethodError ? (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 1, display: "block" }}
                >
                  {deliveryMethodError}
                </Typography>
              ) : null}

              <DialogActions sx={{ px: 0, pb: 0, pt: 3 }}>
                <Button variant="text" onClick={handleBackToEmailStep}>
                  Back
                </Button>
                <Button variant="contained" onClick={handleDeliveryContinue}>
                  Next
                </Button>
              </DialogActions>
            </DialogContent>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <DialogTitle>Please enter the code sent to your phone.</DialogTitle>
            <DialogContent>
              <Box component="form" onSubmit={handleVerifySubmit} noValidate>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Phone code"
                  type="number"
                  value={phoneCode}
                  onChange={(event) => setPhoneCode(event.target.value)}
                  error={Boolean(phoneCodeError)}
                  helperText={phoneCodeError ?? " "}
                />

                <DialogActions sx={{ px: 0, pb: 0, pt: 3 }}>
                  <Button variant="text" onClick={handleBackToDeliveryMethod}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isVerifying}
                  >
                    {isVerifying ? "Verifying..." : "Next"}
                  </Button>
                </DialogActions>
              </Box>
            </DialogContent>
          </>
        ) : null}
      </Dialog>
    </>
  );
}

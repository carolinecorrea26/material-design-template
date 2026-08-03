import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import MailLockRounded from "@mui/icons-material/MailLockRounded";
import { useNavigate } from "react-router-dom";
import PageTitle from "../components/layout/Title";
import PageCard from "../components/layout/PageCard";
import { getPageSubhead, getPageTitle } from "../config/pages";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { sendResumeMagicLinkMockEmail } from "../utils/mockEmail";
import { formatCountdown } from "../utils/formatCountdown";

export default function Resume() {
  const navigate = useNavigate();
  const fields = getClientPageFields("resume");
  const emailField = fields.find((field) => field.id === "resume-email");

  const [emailAddress, setEmailAddress] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!emailSent) {
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((previousSeconds) => {
        if (previousSeconds <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }

          return 0;
        }

        return previousSeconds - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [emailSent]);

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmailAddress = emailAddress.trim();

    if (!trimmedEmailAddress) {
      setEmailError("Enter your email address.");
      return;
    }

    setEmailError(null);
    setIsEmailSending(true);

    window.setTimeout(() => {
      void sendResumeMagicLinkMockEmail(trimmedEmailAddress);

      setIsEmailSending(false);
      setSecondsLeft(600);
      setEmailSent(true);
    }, 1500);
  }

  function handleResendLink() {
    setEmailSent(false);
    setSecondsLeft(600);
  }

  return (
    <Stack
      spacing={2}
      sx={{
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 600 }}>
        <PageCard
          sx={{
            px: { xs: 2, sm: 4 },
            py: 6,
          }}
        >
          <Box sx={{ mb: 2 }}>
            <PageTitle
              title={getPageTitle("resume")}
              subhead={getPageSubhead("resume")}
              onBack={() => navigate(-1)}
            />
          </Box>

          {isEmailSending ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 4,
              }}
            >
              <Stack spacing={2} alignItems="center">
                <CircularProgress size={40} thickness={4} />

                <Typography variant="body2" color="text.secondary">
                  Sending secure link…
                </Typography>
              </Stack>
            </Box>
          ) : emailSent ? (
            <Stack spacing={2} sx={{ py: 1 }}>
              {secondsLeft === 0 ? (
                <Alert severity="error">
                  Your secure link has expired.{" "}
                  <Link
                    href="#"
                    underline="hover"
                    onClick={(event) => {
                      event.preventDefault();
                      handleResendLink();
                    }}
                    sx={{
                      fontSize: "inherit",
                      verticalAlign: "baseline",
                    }}
                  >
                    Resend link
                  </Link>
                </Alert>
              ) : (
                <Alert severity="success" icon={<MailLockRounded />}>
                  A secure link has been sent to{" "}
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {emailAddress}
                  </Box>
                  . Open your email and click the link to continue.
                </Alert>
              )}

              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 0.5 }}
              >
                <Typography
                  variant="body2"
                  color={secondsLeft === 0 ? "error" : "text.secondary"}
                  sx={{ fontSize: "0.8125rem" }}
                >
                  {secondsLeft === 0 ? (
                    "Link expired"
                  ) : (
                    <>
                      Link expires in{" "}
                      <Box component="span" sx={{ fontWeight: 700 }}>
                        {formatCountdown(secondsLeft)}
                      </Box>
                    </>
                  )}
                </Typography>

                <Button
                  variant="text"
                  size="small"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={handleResendLink}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.8125rem",
                  }}
                >
                  Resend link
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Box
              component="form"
              onSubmit={handleEmailSubmit}
              noValidate
              sx={{ py: 1 }}
            >
              <TextField
                fullWidth
                label={emailField?.label}
                type="email"
                required={emailField?.required}
                value={emailAddress}
                onChange={(event) => {
                  setEmailAddress(event.target.value);

                  if (emailError) {
                    setEmailError(null);
                  }
                }}
                error={Boolean(emailError)}
                helperText={emailError ?? emailField?.helperText}
                sx={{ mb: 3 }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </PageCard>
      </Box>
    </Stack>
  );
}

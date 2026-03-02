import * as React from "react";
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Alert,
  Box,
  Button,
  Link,
} from "@mui/material";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import RHFTextField from "../components/form/RHFTextField";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { commonStyles } from "../theme/commonStyles";
import { useNavigate } from "react-router-dom";

const ResumeEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const ResumePhoneSchema = z.object({
  verificationMethod: z.enum(["sms", "voice"], {
    required_error: "Please select a verification method",
  }),
});

const ResumeCodeSchema = z.object({
  phoneCode: z
    .string()
    .min(1, "Phone code is required")
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

type ResumeEmailForm = z.infer<typeof ResumeEmailSchema>;
type ResumePhoneForm = z.infer<typeof ResumePhoneSchema>;
type ResumeCodeForm = z.infer<typeof ResumeCodeSchema>;

export default function Resume() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<
    "email" | "confirmation" | "phone" | "code"
  >("email");

  const emailMethods = useForm<ResumeEmailForm>({
    resolver: zodResolver(ResumeEmailSchema),
    defaultValues: {
      email: "",
    },
  });

  const phoneMethods = useForm<ResumePhoneForm>({
    resolver: zodResolver(ResumePhoneSchema),
    defaultValues: {
      verificationMethod: undefined,
    },
  });

  const codeMethods = useForm<ResumeCodeForm>({
    resolver: zodResolver(ResumeCodeSchema),
    mode: "onSubmit",
    defaultValues: {
      phoneCode: "",
    },
  });

  const onEmailSubmit = (data: ResumeEmailForm) => {
    setStep("confirmation");
  };

  const onPhoneSubmit = (data: ResumePhoneForm) => {
    setStep("code");
  };

  const onCodeSubmit = (data: ResumeCodeForm) => {};

  const handleResendCode = () => {};

  const handleBackFromConfirmation = () => {
    setStep("email");
  };

  const handleNextDev = () => {
    setStep("phone");
  };

  const handleBackFromPhone = () => {
    setStep("confirmation");
  };

  const handleBackFromCode = () => {
    setStep("phone");
  };

  // Phone code verification step
  if (step === "code") {
    return (
      <FormProvider {...codeMethods}>
        <form onSubmit={codeMethods.handleSubmit(onCodeSubmit)} noValidate>
          <Stack spacing={4}>
            <PageHeader
              title="Resume Application"
              notes="To continue your application, follow the steps below. Make sure you have access to your email and phone—these will help us confirm it's you."
            />

            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={3}>
                  {/* Section Header */}
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Confirm Phone Code
                  </Typography>

                  <Alert severity="info" sx={commonStyles.infoAlert}>
                    <Typography variant="body2">
                      We've sent a 6-digit code to ()-1234 via the method you
                      selected. Enter the code below to securely resume your
                      application.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      If you didn't receive the code, you can go back and choose
                      a different delivery method or resend it.
                    </Typography>
                  </Alert>

                  <RHFTextField
                    name="phoneCode"
                    label="Phone Code"
                    placeholder="000000"
                    required
                    fullWidth
                    inputProps={{ maxLength: 6 }}
                  />

                  <Link
                    component="button"
                    type="button"
                    onClick={handleResendCode}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Resend Code
                  </Link>
                </Stack>
              </CardContent>
            </Card>

            <Stack
              direction="row"
              justifyContent="space-between"
              sx={commonStyles.pageNavigation}
            >
              <div>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleBackFromCode}
                >
                  Back
                </Button>
              </div>
              <div>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => codeMethods.handleSubmit(onCodeSubmit)()}
                >
                  Next
                </Button>
              </div>
            </Stack>
          </Stack>
        </form>
      </FormProvider>
    );
  }

  // Phone verification step
  if (step === "phone") {
    return (
      <FormProvider {...phoneMethods}>
        <form onSubmit={phoneMethods.handleSubmit(onPhoneSubmit)} noValidate>
          <Stack spacing={4}>
            <PageHeader
              title="Resume Application"
              notes="To continue your application, follow the steps below. Make sure you have access to your email and phone—these will help us confirm it's you."
            />

            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={3}>
                  {/* Section Header */}
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Verify Phone Number
                  </Typography>

                  <Alert severity="info" sx={commonStyles.infoAlert}>
                    Now we need to confirm your phone number. Choose how you'd
                    like to receive your verification code at{" "}
                    <strong>(***)***-1234</strong>.
                  </Alert>

                  <RHFRadioGroup
                    name="verificationMethod"
                    label="Please select a verification method:"
                    options={[
                      { label: "SMS Text Message", value: "sms" },
                      { label: "Voice Call", value: "voice" },
                    ]}
                    required
                  />
                </Stack>
              </CardContent>
            </Card>

            <PageNavigation
              showBack={false}
              onContinue={() => phoneMethods.handleSubmit(onPhoneSubmit)()}
              continueText="Next"
            />
          </Stack>
        </form>
      </FormProvider>
    );
  }

  // Email confirmation step
  if (step === "confirmation") {
    return (
      <Stack spacing={4}>
        <PageHeader
          title="A secure link has been sent."
          notes="If the email address provided is associated with an application, a secure link will be on its way shortly. Please check your inbox and your spam/junk folder just in case."
        />

        <Card sx={commonStyles.categoryCard}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="body1">
                If the message doesn't arrive within a few minutes, you can
                return to the previous page and request a new link. Just keep in
                mind that repeated requests in a short period may require a
                brief wait before trying again.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Stack
          direction="row"
          justifyContent="space-between"
          sx={commonStyles.pageNavigation}
        >
          <div>
            <Button
              variant="outlined"
              size="large"
              onClick={handleBackFromConfirmation}
            >
              Back
            </Button>
          </div>
          <div>
            <Button variant="contained" size="large" onClick={handleNextDev}>
              Next - Dev
            </Button>
          </div>
        </Stack>
      </Stack>
    );
  }

  // Initial email entry step
  return (
    <FormProvider {...emailMethods}>
      <form onSubmit={emailMethods.handleSubmit(onEmailSubmit)} noValidate>
        <Stack spacing={4}>
          <PageHeader
            title="Resume Application"
            notes="To continue your application, follow the steps below. Make sure you have access to your email and phone—these will help us confirm it's you."
          />

          <Card sx={commonStyles.categoryCard}>
            <CardContent>
              <Stack spacing={3}>
                {/* Section Header */}
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Verify Email Address
                </Typography>

                <Alert severity="info" sx={commonStyles.infoAlert}>
                  Please enter the email you used to begin your application.
                  We'll send a secure link to that address so you can pick up
                  where you left off.
                </Alert>

                <RHFTextField
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>

          <PageNavigation showBack={false} continueText="Next" />
        </Stack>
      </form>
    </FormProvider>
  );
}

import * as React from "react";
import { Stack, Card, CardContent, Typography, Alert } from "@mui/material";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import RHFTextField from "../components/form/RHFTextField";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFCheckbox from "../components/form/RHFCheckbox";
import RHFSelect from "../components/form/RHFSelect";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { commonStyles } from "../theme/commonStyles";
import { getClientConfig } from "../config/clients";

const MembershipSchema = z.object({
  memberType: z.enum(["current", "new"], {
    required_error: "Please select a member type"
  }),
  attestationCheckbox: z.boolean().optional(),
  qualification: z.string().optional(),
  phoneNumber: z.string().optional(),
  phoneType: z.enum(["home", "business", "mobile"]).optional(),
  email: z.string().optional(),
}).refine((data) => {
  if (data.memberType === "new") {
    return !!(
      data.attestationCheckbox === true && 
      data.qualification && 
      data.phoneNumber && 
      data.phoneType && 
      data.email && 
      z.string().email().safeParse(data.email).success
    );
  }
  return true;
}, {
  message: "All fields are required for new members",
  path: ["attestationCheckbox"]
});

type MembershipForm = z.infer<typeof MembershipSchema>;

export default function Membership() {
  const { data, setMembership } = useAppData();
  const { markComplete } = useStepper();
  const navigate = useNavigate();
  const clientConfig = getClientConfig();

  const methods = useForm<MembershipForm>({
    resolver: zodResolver(MembershipSchema),
    defaultValues: data.membership || {
      memberType: undefined,
      attestationCheckbox: false,
      qualification: "",
      phoneNumber: "",
      phoneType: undefined,
      email: ""
    },
    mode: "onSubmit"
  });

  const memberType = methods.watch("memberType");
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  // DevTools: Fill form with test data
  React.useEffect(() => {
    const handleFillForm = () => {
      const filledData: MembershipForm = {
        memberType: "new",
        attestationCheckbox: true,
        qualification: "Active member in good standing",
        phoneNumber: "555-123-4567",
        phoneType: "mobile",
        email: "member@example.com"
      };
      
      methods.reset(filledData);
    };

    window.addEventListener('devtools:fillform', handleFillForm);
    return () => window.removeEventListener('devtools:fillform', handleFillForm);
  }, [methods]);

  const onSubmit = (formData: MembershipForm) => {
    console.log("Membership submitted:", formData);
    setMembership(formData);
    markComplete();
    navigate("/eligibility");
  };

  const handleContinue = () => {
    setSubmitAttempted(true);
    methods.handleSubmit(onSubmit)();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Stack spacing={4}>
          <PageHeader 
            title={`${clientConfig.branding.acronym} Membership`}
            notes={`This coverage is exclusive for ${clientConfig.branding.acronym} members. The application takes approximately 30 minutes to complete.`}
          />

          {submitAttempted && Object.keys(methods.formState.errors).length > 0 && (
            <Alert severity="error">
              Please complete all required fields to continue.
            </Alert>
          )}

          {/* STATE 1 - Member Type Selection */}
          <Card sx={commonStyles.categoryCard}>
            <CardContent>
              <RHFRadioGroup
                name="memberType"
                label="Are you a current member, or are you becoming a new member?"
                options={[
                  { label: "Current Member", value: "current" },
                  { label: "New Member", value: "new" }
                ]}
                required
              />
            </CardContent>
          </Card>

          {/* STATE 2 - New Member Form (shown only when "New Member" is selected) */}
          {memberType === "new" && (
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={3}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Membership Form
                  </Typography>

                  <Alert severity="info" sx={commonStyles.infoAlert}>
                    Applying for coverage will make you a member. Please provide the following information to complete your membership.
                  </Alert>

                  <RHFCheckbox
                    name="attestationCheckbox"
                    label="By submitting this application, I attest that the answers to the questions herein are true."
                  />

                  <RHFSelect
                    name="qualification"
                    label="I hereby attest that I am a U.S. citizen and meet one of the following qualifications:"
                    options={[
                      { label: "I am a civilian federal employee of the U.S. government actively at work", value: "civilian_employee" },
                      { label: "I am a retired civilian federal annuitant", value: "retired_annuitant" },
                      { label: "I am a former federal employee", value: "former_employee" }
                    ]}
                    required
                    useStandardLabel
                  />

                  <RHFTextField
                    name="phoneNumber"
                    label="Primary Phone Number"
                    required
                    fullWidth
                    placeholder="(555) 555-5555"
                  />

                  <RHFRadioGroup
                    name="phoneType"
                    label="Phone Type"
                    options={[
                      { label: "Home", value: "home" },
                      { label: "Business", value: "business" },
                      { label: "Mobile", value: "mobile" }
                    ]}
                    required
                  />

                  <RHFTextField
                    name="email"
                    label="Email"
                    type="email"
                    required
                    fullWidth
                    placeholder="you@example.com"
                    helperText="Provide a valid email address where you can receive important updates about your application."
                  />
                </Stack>
              </CardContent>
            </Card>
          )}

          <PageNavigation 
            backPath="/"
            onContinue={handleContinue}
            continueText="Next"
          />
        </Stack>
      </form>
    </FormProvider>
  );
}

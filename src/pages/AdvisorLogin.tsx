import * as React from "react";
import { Card, CardContent, Stack, Typography, Button } from "@mui/material";
import PageHeader from "../components/layout/PageHeader";
import RHFTextField from "../components/form/RHFTextField";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { commonStyles } from "../theme/commonStyles";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";

const AdvisorLoginSchema = z.discriminatedUnion("appType", [
  z.object({
    appType: z.literal("new"),
    advisorEmail: z
      .string()
      .min(1, "Advisor email is required")
      .email("Please enter a valid email address"),
    advisorPhone: z.string().min(1, "Advisor phone number is required"),
    advisorCode: z.string().min(1, "Advisor code is required"),
    applicantEmail: z.string().optional(),
  }),
  z.object({
    appType: z.literal("saved"),
    advisorEmail: z.string().optional(),
    advisorPhone: z.string().optional(),
    advisorCode: z.string().optional(),
    applicantEmail: z
      .string()
      .min(1, "Applicant's email is required")
      .email("Please enter a valid email address"),
  }),
]);

type AdvisorLoginForm = z.infer<typeof AdvisorLoginSchema>;

export default function AdvisorLogin() {
  const navigate = useNavigate();
  const { setIsAdvisorFlow } = useAppData();

  const methods = useForm<AdvisorLoginForm>({
    resolver: zodResolver(AdvisorLoginSchema),
    defaultValues: {
      appType: "new",
      advisorEmail: "",
      advisorPhone: "",
      advisorCode: "",
      applicantEmail: "",
    },
  });

  const appType = methods.watch("appType");

  const onSubmit = (data: AdvisorLoginForm) => {
    // Set advisor flow flag
    setIsAdvisorFlow(true);
    navigate("/eligibility");
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Stack spacing={4} sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
          <PageHeader
            title="Welcome!"
            notes="Start a new application or continue a saved application below."
          />

          <Card sx={commonStyles.categoryCard}>
            <CardContent>
              <Stack spacing={3}>
                <RHFRadioGroup
                  name="appType"
                  label=""
                  options={[
                    { label: "New App", value: "new" },
                    { label: "Saved App", value: "saved" },
                  ]}
                  row
                />

                {appType === "new" ? (
                  <>
                    <RHFTextField
                      name="advisorEmail"
                      label="Advisor Email"
                      type="email"
                      required
                      fullWidth
                    />

                    <RHFTextField
                      name="advisorPhone"
                      label="Advisor Phone Number"
                      type="tel"
                      required
                      fullWidth
                    />

                    <RHFTextField
                      name="advisorCode"
                      label="Advisor Code"
                      required
                      fullWidth
                    />
                  </>
                ) : (
                  <RHFTextField
                    name="applicantEmail"
                    label="Applicant's Email"
                    type="email"
                    required
                    fullWidth
                  />
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                >
                  Go
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </form>
    </FormProvider>
  );
}

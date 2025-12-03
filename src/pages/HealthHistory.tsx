import { 
  Stack, Card, CardContent, Box, Typography, FormLabel
} from "@mui/material";
import * as React from "react";
import { HealthAndSafety } from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFTextField from "../components/form/RHFTextField";
import { HealthHistorySchema, type HealthHistoryForm } from "../validation/healthHistory";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { useScrollToFirstError } from "../hooks/useScrollToFirstError";
import { commonStyles } from "../theme/commonStyles";

const healthQuestions = [
  {
    id: 1,
    question: "Are you currently confined to a hospital, nursing home, psychiatric facility, incarcerated in a prison/correctional facility, currently on parole or currently receiving home health care/assisted living care?"
  },
  {
    id: 2,
    question: "During the last five years, have you ever been declined, postponed, or offered rated life or health insurance or been denied a reinstatement, reissue or renewal for life or health insurance, or are you currently receiving disability benefits?"
  },
  {
    id: 3,
    question: "Are you currently undergoing a medical evaluation for any condition not yet given a diagnosis?"
  },
  {
    id: 4,
    question: "In the last five years, have you been convicted of a felony; been charged or convicted with assault; been charged with operating a vehicle while under the influence of alcohol or drugs; been charged three or more times with a moving violation; currently have a revoked or suspended license; or currently on parole or incarcerated in a correctional institution?"
  },
  {
    id: 5,
    question: "During the last five years, has any person to be insured been medically diagnosed by a licensed member of the medical profession with HIV or AIDS, or tested positive for Human Immunodeficiency Virus (HIV)?"
  },
  {
    id: 6,
    question: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for heart disease, a heart attack, chest pains, irregular heartbeat, arrhythmia, open heart surgery, defibrillator or a pacemaker?"
  },
  {
    id: 7,
    question: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for diabetes, a stroke (CVA), a transient ischemic attack (TIA), aneurysm or kidney disease?"
  },
  {
    id: 8,
    question: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for depression, anxiety, mental disorder, suicide attempt(s), drug use or treatment, or alcohol abuse or treatment?"
  },
  {
    id: 9,
    question: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for cirrhosis, hepatitis, Lou Gehrig's Disease/ALS or other neuro-muscular, paralysis or seizure disorder?"
  },
  {
    id: 10,
    question: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for cancer (except basal cell or squamous cell skin cancer), tumors, cysts, masses or growths of any type, lymphoma, any blood disorder, except HIV, or connective tissue disorder?"
  },
  {
    id: 11,
    question: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for Crohn's disease, disorder of pancreas, disorder of the immune system, except HIV?"
  },
  {
    id: 12,
    question: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for hypertension, elevated cholesterol, respiratory disease or disorder, or sleep apnea?"
  },
  {
    id: 13,
    question: "During the last five years have you been medically diagnosed by a licensed member of the medical profession as having or been treated for anemia, colitis or arthritis?"
  },
  {
    id: 14,
    question: "During the past five years, have you flown an airplane (other than scheduled commercial or corporate aviation); engaged in any of the following: sky sports, underwater sports, climbing sports, motor sports, in any type vehicle, or any extreme sport (bungee jumping, cave exploration, heliskiing, rodeo riding, etc)?"
  },
  {
    id: 15,
    question: "Have any of your siblings or either of your parents been diagnosed with or died from cancer or cardiovascular disease prior to age 60?"
  }
];

export default function HealthHistory() {
  const { data, setHealthHistory } = useAppData();
  const { markComplete } = useStepper();
  const navigate = useNavigate();

  const methods = useForm<HealthHistoryForm>({
    resolver: zodResolver(HealthHistorySchema),
    defaultValues: {
      question1Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question2Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question3Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question4Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question5Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question6Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question7Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question8Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question9Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question10Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question11Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question12Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question13Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question14Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" },
      question15Details: { onsetDate: "", conditionDetails: "", physicianInfo: "" }
    }
  });

  const onSubmit = (formData: HealthHistoryForm) => {
    console.log("Health history submitted:", formData);
    setHealthHistory(formData);
    navigate("/preview");
  };

  useScrollToFirstError(methods);

  // DevTools: Fill form with test data
  React.useEffect(() => {
    const handleFillForm = () => {
      const filledData: Partial<HealthHistoryForm> = {
        question1: "no",
        question2: "no",
        question3: "no",
        question4: "no",
        question5: "no",
        question6: "yes",
        question6Details: {
          onsetDate: "2020-01-15",
          conditionDetails: "Diagnosed with hypertension, currently managing with medication",
          physicianInfo: "Dr. Smith, Cardiology Associates, 555-1234"
        },
        question7: "no",
        question8: "no",
        question9: "no",
        question10: "no",
        question11: "no",
        question12: "yes",
        question12Details: {
          onsetDate: "2019-06-20",
          conditionDetails: "Elevated cholesterol, controlled with diet and medication",
          physicianInfo: "Dr. Johnson, Family Medicine Center, 555-5678"
        },
        question13: "no",
        question14: "no",
        question15: "no"
      };
      
      methods.reset(filledData as HealthHistoryForm);
    };

    window.addEventListener('devtools:fillform', handleFillForm);
    return () => window.removeEventListener('devtools:fillform', handleFillForm);
  }, [methods]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Stack spacing={4}>
          <PageHeader 
            title="Health History"
            notes="Providing complete details will help speed up the processing of your application."
          />

          <Stack spacing={4}>
            {/* Main Health History Card */}
            <Card sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Category Header */}
                  <Box sx={commonStyles.coverageCategoryHeader}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <HealthAndSafety color="primary" />
                      <Typography variant="h4" sx={commonStyles.coverageCategoryTitle}>
                        Your Health History
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Health Questions */}
                  <Stack spacing={3}>
                    {healthQuestions.map((q) => {
                      const questionKey = `question${q.id}` as keyof HealthHistoryForm;
                      const detailsKey = `question${q.id}Details` as keyof HealthHistoryForm;
                      const answer = methods.watch(questionKey);

                      return (
                        <Card key={q.id} variant="outlined" sx={commonStyles.coverageCard}>
                          <CardContent>
                            <Stack spacing={3}>
                              <FormLabel required>
                                {q.id}. {q.question}
                              </FormLabel>

                              <RHFRadioGroup
                                name={questionKey}
                                label=""
                                options={[
                                  { label: "Yes", value: "yes" },
                                  { label: "No", value: "no" }
                                ]}
                              />

                              {answer === "yes" && (
                                <Box sx={{ pl: 3, borderLeft: 3, borderColor: 'primary.main' }}>
                                  <Stack spacing={3}>
                                    <Box>
                                      <FormLabel required>
                                        Month/Year of Onset
                                      </FormLabel>
                                      <RHFTextField
                                        name={`${detailsKey}.onsetDate`}
                                        placeholder="MM/YYYY"
                                        fullWidth
                                        inputProps={{ 
                                          maxLength: 7,
                                          pattern: "(0[1-9]|1[0-2])/[0-9]{4}"
                                        }}
                                      />
                                    </Box>

                                    <Box>
                                      <FormLabel required>
                                        Condition/Medication & Details (Medical Advice Given, Treatment, Results, Date Recovered)
                                      </FormLabel>
                                      <RHFTextField
                                        name={`${detailsKey}.conditionDetails`}
                                        multiline
                                        rows={4}
                                        fullWidth
                                        sx={{
                                          '& .MuiInputBase-root': {
                                            resize: 'both',
                                            overflow: 'auto'
                                          }
                                        }}
                                      />
                                    </Box>

                                    <Box>
                                      <FormLabel required>
                                        Name and Address of Each Physician, Practitioner, and Hospital
                                      </FormLabel>
                                      <RHFTextField
                                        name={`${detailsKey}.physicianInfo`}
                                        multiline
                                        rows={4}
                                        fullWidth
                                        sx={{
                                          '& .MuiInputBase-root': {
                                            resize: 'both',
                                            overflow: 'auto'
                                          }
                                        }}
                                      />
                                    </Box>
                                  </Stack>
                                </Box>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <PageNavigation backPath="/profile" />
        </Stack>
      </form>
    </FormProvider>
  );
}

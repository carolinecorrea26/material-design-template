import * as React from "react";
import {
  Stack,
  Typography,
  Card,
  CardContent,
  Box,
  TextField,
  IconButton,
  Alert,
} from "@mui/material";
import { Print as PrintIcon } from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import FormStepTransition from "../components/layout/FormStepTransition";
import FormPageLayout from "../components/layout/FormPageLayout";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { commonStyles } from "../theme/commonStyles";
import CheckboxField from "../components/form/CheckboxField";

export default function ConsentNew() {
  const { data, setConsent } = useAppData();
  const { markComplete } = useStepper();
  const navigate = useNavigate();

  const spouseSelected = data.eligibility?.applicants?.spouse || false;

  const [electronicConsent, setElectronicConsent] = React.useState(
    data.consent?.electronicConsent || false,
  );
  const [spouseElectronicConsent, setSpouseElectronicConsent] = React.useState(
    data.consent?.spouseElectronicConsent || false,
  );
  const [dividendsConsent, setDividendsConsent] = React.useState(
    data.consent?.dividendsConsent || false,
  );
  const [firstName, setFirstName] = React.useState(
    data.consent?.firstName || "",
  );
  const [lastName, setLastName] = React.useState(data.consent?.lastName || "");
  const [dateOfBirth, setDateOfBirth] = React.useState(
    data.consent?.dateOfBirth || "",
  );
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    const handleFillForm = () => {
      setElectronicConsent(true);
      if (spouseSelected) {
        setSpouseElectronicConsent(true);
      }
      setDividendsConsent(true);
      setFirstName("John");
      setLastName("Doe");
      setDateOfBirth("1980-01-15");
    };

    window.addEventListener("devtools:fillform", handleFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleFillForm);
  }, [spouseSelected]);

  const handleContinue = () => {
    setSubmitAttempted(true);

    const errors: string[] = [];
    if (!electronicConsent) errors.push("Electronic consent required");
    if (spouseSelected && !spouseElectronicConsent)
      errors.push("Spouse electronic consent required");
    if (!dividendsConsent)
      errors.push("Assignment of Dividends consent required");

    if (errors.length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setConsent({
      electronicConsent,
      spouseElectronicConsent,
      dividendsConsent,
      firstName,
      lastName,
      dateOfBirth,
    });

    markComplete();
    navigate("/docusign");
  };

  const hasErrors =
    submitAttempted &&
    (!electronicConsent ||
      (spouseSelected && !spouseElectronicConsent) ||
      !dividendsConsent);

  return (
    <FormPageLayout
      header={
        <PageHeader
          title="Authorize Application"
          notes="Please read carefully and provide your consent to continue."
        />
      }
      navigation={
        <PageNavigation onContinue={handleContinue} continueText="Continue" />
      }
    >
      <FormStepTransition>
        {hasErrors && (
          <Alert severity="error">
            Please complete all required consents to continue.
          </Alert>
        )}

        <Card sx={commonStyles.categoryCard}>
          <CardContent>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={commonStyles.coverageCategoryHeader}>
                  <Typography
                    variant="h5"
                    sx={commonStyles.coverageCategoryTitle}
                  >
                    Read & Sign
                  </Typography>
                </Box>
                <IconButton
                  onClick={handlePrint}
                  size="small"
                  aria-label="Print Read & Sign"
                >
                  <PrintIcon />
                </IconButton>
              </Box>

              <Box sx={commonStyles.infoPanel}>
                <Stack spacing={2}>
                  <Typography variant="h6" paragraph>
                    Please read carefully the statements below.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    I understand that payment for premium collected or submitted
                    before the insurance does not mean that my coverage is in
                    force before the effective date as specified by New York
                    Life.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>AUTHORIZATION:</strong> I authorize any licensed
                    physician, practitioner, hospital, clinic, pharmacy,
                    pharmacy benefit manager or provider, medically related
                    facility, consumer reporting agency or insurance company,
                    the Medical Information Bureau, Inc. (MIB), or other
                    organization, institution or person that has any records or
                    knowledge of me or my health to give to New York Life or its
                    reinsurers any such information.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>FRAUD NOTICE:</strong> Any person who knowingly
                    presents false information in an application for insurance
                    is guilty of a crime and may be subject to fines and
                    confinement in prison.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>CONSENT:</strong> In applying for this group
                    insurance, I request the insurance indicated and authorize
                    deduction from my earnings or direct billing for the
                    required contributions.
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={commonStyles.categoryCard}>
          <CardContent>
            <Stack spacing={2}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h5" sx={commonStyles.sectionHeadingText}>
                  Electronic Consent
                </Typography>
                <IconButton
                  onClick={handlePrint}
                  size="small"
                  aria-label="Print Electronic Consent"
                >
                  <PrintIcon />
                </IconButton>
              </Box>

              <Box
                sx={{
                  ...commonStyles.infoPanel,
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                <Stack spacing={3}>
                  <Typography variant="body2" paragraph>
                    By clicking "Continue" you consent to receive required
                    documents electronically and to execute the application
                    forms via electronic means.
                  </Typography>
                </Stack>
              </Box>

              <CheckboxField
                checked={electronicConsent}
                onChange={setElectronicConsent}
                label={
                  <Typography variant="body2" component="span">
                    I consent to electronic delivery and signature.
                    <Box component="span" sx={{ color: "error.main" }}>
                      *
                    </Box>
                  </Typography>
                }
              />
            </Stack>
          </CardContent>
        </Card>

        {spouseSelected && (
          <Card sx={commonStyles.categoryCard}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h5" sx={commonStyles.sectionHeadingText}>
                  Spouse Authorization
                </Typography>
                <CheckboxField
                  checked={spouseElectronicConsent}
                  onChange={setSpouseElectronicConsent}
                  label={
                    <Typography variant="body2" component="span">
                      I consent to electronic delivery and signature for my
                      spouse.
                      <Box component="span" sx={{ color: "error.main" }}>
                        *
                      </Box>
                    </Typography>
                  }
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        <Card sx={commonStyles.categoryCard}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5" sx={commonStyles.sectionHeadingText}>
                Assignment of Dividends to ABE
              </Typography>
              <Typography variant="body2" paragraph>
                I understand and agree to the Assignment of Dividends to ABE as
                described above.
              </Typography>
              <CheckboxField
                checked={dividendsConsent}
                onChange={setDividendsConsent}
                label={
                  <Typography variant="body2" component="span">
                    I agree to the Assignment of Dividends.
                    <Box component="span" sx={{ color: "error.main" }}>
                      *
                    </Box>
                  </Typography>
                }
              />
            </Stack>
          </CardContent>
        </Card>

        <Card sx={commonStyles.categoryCard}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5" sx={commonStyles.sectionHeadingText}>
                Signature
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Date of Birth"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  fullWidth
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </FormStepTransition>
    </FormPageLayout>
  );
}

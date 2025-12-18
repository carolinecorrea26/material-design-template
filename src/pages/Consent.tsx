import * as React from "react";
import {
  Stack,
  Typography,
  Card,
  CardContent,
  Box,
  FormControlLabel,
  Checkbox,
  TextField,
  IconButton,
  Alert,
} from "@mui/material";
import { Print as PrintIcon, Security } from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { commonStyles } from "../theme/commonStyles";

export default function Consent() {
  const { data, setConsent } = useAppData();
  const { next, markComplete } = useStepper();
  const navigate = useNavigate();

  const spouseSelected = data.eligibility?.applicants?.spouse || false;

  const [electronicConsent, setElectronicConsent] = React.useState(data.consent?.electronicConsent || false);
  const [spouseElectronicConsent, setSpouseElectronicConsent] = React.useState(data.consent?.spouseElectronicConsent || false);
  const [dividendsConsent, setDividendsConsent] = React.useState(data.consent?.dividendsConsent || false);
  const [firstName, setFirstName] = React.useState(data.consent?.firstName || "");
  const [lastName, setLastName] = React.useState(data.consent?.lastName || "");
  const [dateOfBirth, setDateOfBirth] = React.useState(data.consent?.dateOfBirth || "");
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleContinue = () => {
    setSubmitAttempted(true);

    // Validation
    const errors: string[] = [];
    if (!electronicConsent) errors.push("Electronic consent required");
    if (spouseSelected && !spouseElectronicConsent) errors.push("Spouse electronic consent required");
    if (!dividendsConsent) errors.push("Assignment of Dividends consent required");

    if (errors.length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Save data
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

  const hasErrors = submitAttempted && (!electronicConsent || (spouseSelected && !spouseElectronicConsent) || !dividendsConsent);

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Authorize Application"
        notes="Please read carefully and provide your consent to continue."
      />

      {hasErrors && (
        <Alert severity="error">
          Please complete all required consents to continue.
        </Alert>
      )}

      {/* Read & Sign Section */}
      <Card sx={commonStyles.categoryCard}>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={commonStyles.coverageCategoryHeader}>
                <Typography variant="h5" sx={commonStyles.coverageCategoryTitle}>
                  Read & Sign
                </Typography>
              </Box>
              <IconButton onClick={handlePrint} size="small" aria-label="Print Read & Sign">
                <PrintIcon />
              </IconButton>
            </Box>

            {/* White card container for Read & Sign content */}
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                p: { xs: 2, sm: 3 },
                bgcolor: "background.default",
              }}
            >
              <Stack spacing={2}>
                <Typography variant="h6" paragraph>
                  Please read carefully the statements below.
                </Typography>

                <Typography variant="body2" paragraph>
                  I understand that payment for premium collected or submitted before the insurance does not mean that my coverage is in force before the effective date as specified by New York Life.
                </Typography>

                <Typography variant="body2" paragraph>
                  I understand that New York Life has the right to require evidence of insurability if necessary. If it is necessary, an exam, tests or other evidence will be arranged by New York Life. New York Life is not required to provide coverage for me or any person for whom I am applying if New York Life determines that the person does not meet New York Life's underwriting requirements, or makes a misrepresentation on this application.
                </Typography>

                <Typography variant="body2" paragraph>
                  <strong>AUTHORIZATION:</strong> I authorize any licensed physician, practitioner, hospital, clinic, pharmacy, pharmacy benefit manager or provider, medically related facility, consumer reporting agency or insurance company, the Medical Information Bureau, Inc. (MIB), or other organization, institution or person that has any records or knowledge of me or my health to give to New York Life or its reinsurers any such information. This includes information about drugs, alcoholism or mental illness (excluding psychotherapy notes). I authorize New York Life or its reinsurers to release any information it has about me to the MIB. I authorize New York Life or its reinsurers to release any information it has about me to other insurance companies to whom I have applied or may apply.
                </Typography>

                <Typography variant="body2" paragraph>
                  A photocopy of this authorization will be as valid as the original. This AUTHORIZATION may be used for a period of 24 months from the date of signing. I understand that I have the right to revoke this AUTHORIZATION at any time by contacting New York Life in writing. Such revocation will not affect any action that New York Life has taken in reliance on this authorization.
                </Typography>

                <Typography variant="body2" paragraph>
                  <strong>FRAUD NOTICE:</strong> Any person who knowingly presents a false or fraudulent claim for payment of a loss or benefit or knowingly presents false information in an application for insurance is guilty of a crime and may be subject to fines and confinement in prison.
                </Typography>

                <Typography variant="body2" paragraph>
                  <strong>CONSENT:</strong> In applying for this group insurance, I request the insurance indicated and authorize deduction from my earnings or direct billing for the required contributions, if any. I certify that all statements on this application are true and complete to the best of my knowledge and belief and are correctly recorded. I understand that any incorrect statements or failure to disclose information could void my coverage.
                </Typography>

                <Typography variant="body2" paragraph>
                  <strong>ENDORSEMENT:</strong> I understand that any insurance applied for is subject to the terms of the policy issued to the American Bar Endowment.
                </Typography>

                <Typography variant="body2" paragraph>
                  <strong>For All Supplemental Health Products Applied For:</strong>
                  <br />
                  I HEREBY ATTEST THAT I AM PURCHASING THIS POLICY AS A SUPPLEMENT TO MY HEALTH COVERAGE, WHICH MEETS THE FEDERAL REQUIREMENT OF MINIMUM ESSENTIAL COVERAGE.
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Electronic Consent Section */}
      <Card sx={commonStyles.categoryCard}>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Electronic Consent
              </Typography>
              <IconButton onClick={handlePrint} size="small" aria-label="Print Electronic Consent">
                <PrintIcon />
              </IconButton>
            </Box>

            {/* Scrollable content box with fixed height */}
            <Box
              sx={{
                maxHeight: "400px",
                overflowY: "auto",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                p: { xs: 2, sm: 3 },
                bgcolor: "background.default",
              }}
            >
              <Stack spacing={3}>
                {/* Title Block */}
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    NEW YORK LIFE INSURANCE COMPANY
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Customer Electronic Consent and Disclosure (the "Consent")
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 1 }}>
                    IMPORTANT NOTICE - PLEASE READ CAREFULLY
                  </Typography>
                </Box>

                {/* Section 1: Purpose */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    What is the purpose of this Consent?
                  </Typography>
                  <Typography variant="body2" paragraph>
                    You are applying for insurance coverage from New York Life Insurance Company ("New York Life") and wish to electronically sign the application forms and receive related communications electronically.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    By clicking "Submit" below and applying your electronic signature, you consent: (a) to receive "Required Documents" (defined below) electronically; (b) to execute the application forms via electronic means; and (c) to agree to all the terms and conditions of this Consent.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    If you do not agree to this Consent, you must not click Submit and instead may request a paper application from the Administrator.
                  </Typography>
                </Box>

                {/* Section 2: Scope */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    What does the Consent cover once I click "Submit" and apply my electronic signature?
                  </Typography>
                  <Box component="ol" sx={{ pl: 3 }}>
                    <Typography component="li" variant="body2" paragraph>
                      You agree to execute via electronic means any documents required in connection with the application forms.
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      You agree that clicking "Submit" and applying your electronic signature has the same legal effect as signing documents on paper by hand.
                    </Typography>
                    <Typography component="li" variant="body2" paragraph>
                      You agree to receive via electronic means:
                      <Box component="ul" sx={{ pl: 3, mt: 1 }}>
                        <Typography component="li" variant="body2">
                          Application forms,
                        </Typography>
                        <Typography component="li" variant="body2">
                          <a href="/documents/important-notice.pdf" target="_blank" rel="noopener noreferrer">Important Notice</a> (PDF),
                        </Typography>
                        <Typography component="li" variant="body2">
                          <a href="#" onClick={(e) => { e.preventDefault(); /* Open privacy modal */ }}>New York Life Online Privacy Notice</a>.
                        </Typography>
                      </Box>
                    </Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Note: Even with your consent, New York Life may choose to deliver documents on paper at its discretion.
                  </Typography>
                </Box>

                {/* Section 3: Paper Copies */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    May I obtain paper copies of the Required Documents and the Consent?
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Yes. You may request paper copies at any time, at no cost, by contacting:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Email: <a href="mailto:GMAD_DocumentRequest@newyorklife.com">GMAD_DocumentRequest@newyorklife.com</a>
                    <br />
                    Phone: (914) 846-3017
                  </Typography>
                </Box>

                {/* Section 4: Keeping Copies */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Should I maintain copies of the Required Documents received by electronic means?
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Yes. We encourage you to print or save the Required Documents for your records. If you have trouble printing or saving documents, please contact us at:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Email: <a href="mailto:GMAD_DocumentRequest@newyorklife.com">GMAD_DocumentRequest@newyorklife.com</a>
                    <br />
                    Phone: (914) 846-3017
                  </Typography>
                </Box>

                {/* Section 5: Format */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    In what form will I receive Required Documents by electronic means?
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Documents are provided in PDF format. You must have Adobe Acrobat Reader to view PDFs. You can download it for free at{" "}
                    <a href="https://get.adobe.com/reader/" target="_blank" rel="noopener noreferrer">
                      get.adobe.com/reader
                    </a>.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    By clicking "Submit", you acknowledge that you can access PDF documents on your device.
                  </Typography>
                </Box>

                {/* Section 6: How Documents Are Delivered */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    How will I receive Required Documents by electronic means?
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Documents are available via links on this website and in this notice. You can view, download, and print them.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    The Required Documents include:
                  </Typography>
                  <Box component="ul" sx={{ pl: 3 }}>
                    <Typography component="li" variant="body2">
                      <a href="/documents/important-notice.pdf" target="_blank" rel="noopener noreferrer">Important Notice</a> (PDF)
                    </Typography>
                    <Typography component="li" variant="body2">
                      <a href="#" onClick={(e) => { e.preventDefault(); /* Open privacy modal */ }}>New York Life Online Privacy Notice</a>
                    </Typography>
                  </Box>
                </Box>

                {/* Section 7: Duration */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    How long will this Consent remain in effect?
                  </Typography>
                  <Typography variant="body2" paragraph>
                    This Consent becomes effective when you click "Submit" and remains in effect until you withdraw consent OR the Insurance Certificate is issued.
                  </Typography>
                </Box>

                {/* Section 8: Withdrawal */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    What if I change my mind?
                  </Typography>
                  <Typography variant="body2" paragraph>
                    You may withdraw your consent to do business electronically at any time before the Insurance Certificate is issued by providing written withdrawal to New York Life.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Withdrawal terminates this Consent and your application as of the date you sign the withdrawal, subject to any prior actions taken. If the certificate was already issued, you must follow the surrender or cancellation rules in the contract.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    There is no charge to withdraw consent.
                  </Typography>
                </Box>

                {/* Section 9: Contact Info Changes */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    What if my contact information changes?
                  </Typography>
                  <Typography variant="body2" paragraph>
                    You must keep New York Life informed of any changes to your email address. Please contact:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Email: <a href="mailto:GMAD_DocumentRequest@newyorklife.com">GMAD_DocumentRequest@newyorklife.com</a>
                    <br />
                    Phone: (914) 846-3017
                  </Typography>
                </Box>

                {/* Section 10: Hardware/Software Requirements */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Are there any hardware or software requirements to do business electronically with New York Life?
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Yes. You will need:
                  </Typography>
                  <Box component="ul" sx={{ pl: 3 }}>
                    <Typography component="li" variant="body2">
                      A personal computer or mobile device
                    </Typography>
                    <Typography component="li" variant="body2">
                      A modern web browser (e.g., Microsoft Edge, Google Chrome, Mozilla Firefox, or equivalent)
                    </Typography>
                    <Typography component="li" variant="body2">
                      Email software and internet access
                    </Typography>
                    <Typography component="li" variant="body2">
                      Ability to view PDFs via Adobe Acrobat Reader
                    </Typography>
                    <Typography component="li" variant="body2">
                      Ability to save documents or print them (printer connection)
                    </Typography>
                  </Box>
                  <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                    Note: ISP and data charges are your responsibility.
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Footer Code */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2, fontSize: "0.75rem", color: "text.secondary" }}>
              <Typography variant="caption">GMA-EC</Typography>
              <Typography variant="caption">1/1/18 ed.</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Your Authorization Section */}
      <Card sx={commonStyles.categoryCard}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Your Authorization
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={electronicConsent}
                  onChange={(e) => setElectronicConsent(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2" component="span">
                  I confirm that I have reviewed and understand the above material. I consent to the use of electronic signature and delivery of electronic records.{' '}
                  <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
              }
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Spouse Authorization Section */}
      {spouseSelected && (
        <Card sx={commonStyles.categoryCard}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Spouse Authorization
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={spouseElectronicConsent}
                    onChange={(e) => setSpouseElectronicConsent(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2" component="span">
                    I confirm that I have reviewed and understand the above material. I consent to the use of electronic signature and delivery of electronic records.{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </Typography>
                }
              />
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Assignment of Dividends Section */}
      <Card sx={commonStyles.categoryCard}>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Assignment of Dividends to ABE
              </Typography>
              <IconButton onClick={handlePrint} size="small" aria-label="Print Assignment of Dividends">
                <PrintIcon />
              </IconButton>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              How your Assignment of Dividends to ABE works — The Unique Charitable Giving Feature of ABE-Sponsored Insurance
            </Typography>

            <Typography variant="body2" paragraph>
              Founded by the ABA in 1942, the American Bar Endowment (ABE) is a 501(c)(3) tax-exempt public charity. ABE fulfills its charitable mission of improving the administration of justice and the professional lives of lawyers by making annual grants to support law-related research, public service, and educational programs and projects, including those conducted by the American Bar Association's Fund for Justice and Education (FJE) and the American Bar Foundation (ABF). ABE also makes Opportunity Grants to support boots-on-the-ground efforts to increase the availability of legal services to underserved communities. ABE maintains a Legal Legacy Fund for the support of its grantmaking programs.
            </Typography>

            <Typography variant="body2" paragraph>
              By participating in ABE's group insurance program, designed for and available only to practicing lawyers and their families, you can contribute to these efforts. By enrolling in ABE-sponsored insurance programs, you allow the ABE to direct dividends payable on the group policies for ABE to use for its grantmaking purposes. ABE uses part of your annual dividends payment on the group policies for ABE to use for its charitable purpose. Dividends and distributions to ABE are tax-deductible to the insurer to the fullest extent permitted by law.
            </Typography>

            <Typography variant="body2" paragraph>
              The dividend donations to ABE make a difference. Tax laws allow charitable deductions to strengthen the ABE's charitable programs and initiatives like the Legal Legacy Fund.
            </Typography>

            <Typography variant="body2" paragraph>
              When you enroll, dividends allocated on your behalf are paid to ABE, and you are eligible to claim the deduction on your federal income taxes. ABE's use of dividends ensures that your charitable contribution aligns with your service and the work done by the ABA to strengthen justice access.
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
              Products eligible for dividends:
            </Typography>

            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body2">
                Group Term Life Insurance
              </Typography>
              <Typography component="li" variant="body2">
                10-Year Level Term Life Insurance
              </Typography>
              <Typography component="li" variant="body2">
                20-Year Level Term Life Insurance
              </Typography>
              <Typography component="li" variant="body2">
                Accidental Death & Dismemberment Insurance
              </Typography>
              <Typography component="li" variant="body2">
                Long-Term Disability Insurance
              </Typography>
              <Typography component="li" variant="body2">
                Short-Term Disability Insurance
              </Typography>
              <Typography component="li" variant="body2">
                Office Overhead Expense Insurance
              </Typography>
              <Typography component="li" variant="body2">
                Critical Illness Insurance
              </Typography>
              <Typography component="li" variant="body2">
                Hospital Money Insurance
              </Typography>
              <Typography component="li" variant="body2">
                And any other group products listed in the policy supplement
              </Typography>
            </Box>

            <Typography variant="body2" paragraph sx={{ mt: 2 }}>
              <strong>ELECTION:</strong> You elect that dividends on your certificate be assigned to ABE unless you opt out. You may change your election at any time by contacting ABE.
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={dividendsConsent}
                  onChange={(e) => setDividendsConsent(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2" component="span">
                  I understand and agree to the Assignment of Dividends to ABE as described above.{' '}
                  <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                </Typography>
              }
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Signature Section */}
      <Card sx={commonStyles.categoryCard}>
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
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
                label="Date of Birth (mm/dd/yyyy)"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="mm/dd/yyyy"
                fullWidth
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <PageNavigation onContinue={handleContinue} />
    </Stack>
  );
}


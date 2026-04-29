import ReportRoundedIcon from "@mui/icons-material/ReportRounded";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FormRoutePage from "../components/form/FormRoutePage";
import ApplicantSection from "../components/form/ApplicantSection";
import {
  isApplicantApplying,
  shouldShowApplicantLabel,
} from "../components/form/applicantVisibility";
import { SECTION_SURFACE_BG } from "../components/form/sectionStyles";
import FieldRenderer from "../components/form/FieldRenderer";
import type { PageId } from "../types/page";
import { getActiveClientCoverages } from "../client/getActiveClientCoverages";
import { fieldCatalog } from "../config/fields";
import ReviewPreviewSection from "../components/form/ReviewPreviewSection";

const reviewCards: Array<{
  pageId: PageId;
  title: string;
  showSelfLabel?: boolean;
}> = [
  { pageId: "membership", title: "Membership" },
  { pageId: "eligibility", title: "Eligibility" },
  { pageId: "coverage", title: "Coverage", showSelfLabel: false },
  { pageId: "coverage-questions", title: "Coverage Questions" },
  { pageId: "coverage-options", title: "Coverage Options" },
  { pageId: "beneficiary", title: "Beneficiary" },
  { pageId: "contact", title: "Contact" },
  { pageId: "personal", title: "Personal" },
  { pageId: "financial", title: "Financial" },
];

const reviewFieldBlocklist = new Set<string>([
  "coverageSelections",
  "coverageAmounts",
  "coverageRiders",
  "coverageRiderAmounts",
  "coverageWaitingPeriods",
  "coverageMaxBenefitPeriods",
  "children",
  "beneficiaries",
  "selfDisabilityCompanies",
  "spouseDisabilityCompanies",
  "review-self-consent",
  "review-spouse-consent",
]);

const subQuestionFieldIds = new Set([
  "tobacco-last-used",
  "tobacco-products",
  "spouse-tobacco-last-used",
  "spouse-tobacco-products",
]);

const readAndSignContent = `Please read carefully the statements below.
I understand that payment of a premium contribution for insurance does not mean that there is any coverage in force before the effective date as specified by New York Life.

I understand that New York Life has the right to require additional information and, if necessary, an examination by a physician. I ask New York Life to rely on all such statements made on this form, and any supplements to it, while considering this request. I also understand that the coverage afforded will be in consideration of the answers and statements set forth above.

AUTHORIZATION: I authorize physicians, practitioners, hospitals, clinics or medically related facilities, pharmacies, pharmacy benefit managers, laboratories, insurance companies, MIB, LLC ("MIB"), medical information retrieval services, electronic health record companies or health care information technology companies to release to New York Life Insurance Company or New York Life Insurance and Annuity Corporation (collectively "New York Life"), its reinsurers, or the plan administrator at New York Life's expense, whether in electronic or paper form, information they may have about my physical or mental health, my prescription drug history, diagnostic testing and copies of my drug and alcohol records, including my records relating to substance abuse education, prevention, training, treatment, rehabilitation or research. This also may include information on the diagnosis, treatment, and testing results related to HIV, AIDS, and sexually transmitted diseases, unless otherwise restricted by state law. Mental health professionals may provide their records, excluding psychotherapy notes, of my diagnosis, functional status, treatment plan, symptoms, prognosis, progress to date, medication prescription and monitoring, and clinical test results for the purpose of evaluating my application for insurance. This includes protected health information and any health information I have previously requested be withheld from further disclosure, and including my history, their findings, diagnoses and treatment.

MIB, other insurance companies, any employers, financial institutions, and consumer reporting agencies may provide to New York Life at New York Life's expense data about: my driving record; my financial information; any criminal activity; hazardous sport or aviation activity; use of alcohol or drugs; any claim of eligibility for disability income benefits; other applications for insurance; and other policies of insurance. New York Life may obtain an investigative consumer report about me.

A photocopy of this AUTHORIZATION and request form shall be as valid as the original. My authorized agent or representative, or I may request a copy of this AUTHORIZATION. This AUTHORIZATION may be used for a period of 24 months from the date signed, unless sooner revoked as stated in the Important Notice. The AUTHORIZATION may be revoked at any time by sending written notice to New York Life. My revocation will not be effective to the extent that New York Life or any other person already has disclosed or collected information or taken other action in reliance on it, or to the extent that New York Life has a legal right to contest a claim under an insurance certificate or the certificate itself.

I understand and agree that:

New York Life may use the information obtained by this AUTHORIZATION to determine my eligibility for insurance, to evaluate a claim for benefits, to contest coverage, or for reinsurance or other insurance purposes, including development of new products and services.
To obtain the data described above, New York Life may give my personal information to the above persons or organizations.
New York Life may give data collected about me to: its subsidiaries; affiliates; parent company; agents and their staffs; organizations that perform business functions for it; reinsurers, and others as permitted or required by law.
The medical information New York Life obtains through this AUTHORIZATION may no longer be subject to federal laws and regulations that apply to an individual's protected health information (the Health Insurance Portability and Accountability Act (HIPAA) Privacy Rule). The information New York Life obtains through this AUTHORIZATION may become subject to further disclosure.
Authorizing the disclosure of this health information is voluntary.
I can refuse to sign this AUTHORIZATION. However, failure to execute this AUTHORIZATION may result in New York Life being unable to collect information relating to me and result in denial of my application for insurance.

FRAUD NOTICE: Any person who knowingly and with intent to defraud any insurance company or other person files an application for insurance or statement of claim containing any materially false information or conceals for the purpose of misleading, information concerning any fact material thereto commits a fraudulent insurance act, which may be a crime and may subject such person to criminal and civil penalties.

CONSENT: By signing and dating this application, I request the insurance applied for (for myself and/or my dependents); I attest that the information provided in my application is true and complete to the best of my knowledge and belief and that I, and any other person proposed for insurance, has read the Fraud Notice (if any) above and the IMPORTANT NOTICE , including how my/our information is exchanged with MIB; and I, and any other person proposed for insurance, consents to authorize the disclosure of information, to and from the providers noted in the IMPORTANT NOTICE, including making a brief report of my/our protected health information to MIB.


DIVIDEND:
I further understand and agree that any dividend apportioned to the group policy may be retained by the American Bar Endowment to support its charitable mission supporting law-related education, research, and public service projects and programs unless such dividends are claimed by me (or the certificate owner) pursuant to the procedures described in the plan brochures, on the back of the ABE premium notices, and in the plan description material on the ABE website. (Notice of the approximate percentage of premium available, if any, for contribution or refund will be published in the December/January issue of the ABA Journal and on ABE's website in October.) The Internal Revenue Service has ruled that members who donate their dividends to ABE are eligible for a charitable contribution deduction on their individual income tax returns to the fullest extent permitted by law.`;

const electronicConsentContent = `NEW YORK LIFE INSURANCE COMPANY

Customer Electronic Consent and Disclosure
(the "Consent")

IMPORTANT NOTICE - PLEASE READ CAREFULLY

What is the purpose of this Consent?

You are applying for insurance coverage from New York Life Insurance Company ("New York Life") and have expressed your desire to electronically sign the application Forms for the insurance certificate (the "Insurance Certificate") and electronically receive communications related to the application for the Insurance Certificate. To conduct this business electronically, you must provide New York Life and its authorized designees with your consent. By clicking the "Submit" button below, and applying your electronic signature, you will be providing New York Life and its authorized designees, with your consent:

(a) to have the Required Documents described in this Consent delivered to you electronically;

(b) to execute via electronic means the application Forms that are described in this Consent; and

(c) to agree to all of the terms and conditions set forth below in this Consent.

If you do not want to have the Required Documents delivered to you electronically, if you do not want to execute via electronic means the Application Forms, and/or if you do not agree with all of the terms and conditions of this Consent, you may not conduct business electronically with New York Life, and you must not click the submit link below. In this event you may contact the Administrator below to request a paper application.

What does the Consent cover once I click "Sign" and apply my electronic signature?

The Consent covers your agreement to all of the terms and conditions of the Consent, including your agreement to:

1. execute via electronic means any documents that New York Life requires to be signed in connection with the application process for this Insurance Certificate (the "application Forms");

2. be bound with the same force and effect as if you had affixed your signature on paper, by hand, when you click "Submit" and apply your electronic signature or otherwise apply your electronic signature to the application Forms;

3. receive via electronic means the application Forms, Important Notice and New York Life Online Privacy Notice that New York Life is required to deliver and/or make available to you, in writing, in connection with the Insurance Certificate (the "Required Documents").

Even though you have provided New York Life with the Consent, New York Life may, at its option, deliver the Required Documents to you on paper.

May I obtain paper copies of the Required Documents and the Consent?

Yes. You may obtain paper copies of any of the Required Documents and/or the Consent at any time and without charge by contacting New York Life at GMAD_DocumentRequest@newyorklife.com or (914) 846-3017.


Should I maintain copies of the Required Documents received by electronic means?

Yes. You agree to print or save the Required Documents and to keep printed or electronic copies of them for your records. If you have any trouble with printing or saving, you should contact New York Life at GMAD_DocumentRequest@newyorklife.com or (914) 846-3017.

In what form will I receive Required Documents by electronic means?

Required Documents will be provided in Portable Document Format (PDF). I agree that I must have Adobe Acrobat viewer software installed on my personal computer in order to view these Required Documents. I agree that if I do not have the ability to access and retain PDF documents, I should not click the "Submit" button. By clicking the "Submit" button, I acknowledge that I can access the Required Documents on my personal computer in PDF Form.

How will I receive Required Documents by electronic means?

There are links to the notices and documents on this website and in this notice. Click on the linked text to open the document. Upon selecting the link, you will be able to view, download, and/or print all the Required Documents pertaining to your application. For reference, these required documents are:
Important Notice
New York Life Online Privacy Notice

How long will this Consent remain in effect?

This Consent shall become effective once you click the "Submit" button below and shall remain in effect until you withdraw your consent (as described in the next section) or the Insurance Certificate is issued.

What if I change my mind?

You may only withdraw your consent to do business electronically before the Insurance Certificate is issued. If you would like to do so, you must provide New York Life with a written withdrawal of your consent to do business electronically. This will terminate the Consent and your Insurance Certificate application as of the date you sign your withdrawal, subject to any action New York Life took before recording the withdrawal. If we issue the Insurance Certificate before we record your withdrawal, and you wish to cancel this Insurance Certificate thereafter, you must exercise your right to surrender the Insurance Certificate according to its terms. There is no charge to withdraw your consent.

What if my contact information changes?

You must keep New York Life informed of any changes to your e-mail address. You may inform New York Life of any such changes by contacting New York Life at GMAD_DocumentRequest@newyorklife.com or (914) 846-3017.

Are there any hardware or software requirements to do business electronically with New York Life?

Yes. To do business electronically with New York Life and to access and retain the Required Documents sent or made available to you electronically by New York Life requires that you have a personal computer or mobile device with appropriate browser software, such as Microsoft Internet Explorer, Mozilla Firefox, or equivalent, and email software as well as communications access to the Internet. You must ensure that the mobile device that you are using to view or electronically sign the application Forms allows you to access all associated content. This access may incur charges from Internet Service Providers and telephone or cable companies. These costs are your responsibility. In order to view certain Required Documents in the Portable Document Format (PDF), you must have Adobe Acrobat viewer software. This software is available for download, free of charge, from the Adobe Web site (www.adobe.com). You must have the ability to save the Required Documents to a storage device for later reference or have a connection between your computer or mobile device and a printer so you can print out the Required Documents.

GMA-EC
1/1/18 ed.`;

export default function Review() {
  const navigate = useNavigate();

  function printSection() {
    window.print();
  }

  return (
    <FormRoutePage
      pageId="review"
      devFillFields={(currentValues) => [
        fieldCatalog["review-self-consent"],
        ...(isApplicantApplying("spouse", currentValues)
          ? [fieldCatalog["review-spouse-consent"]]
          : []),
      ]}
    >
      {({ control, errors, watchedValues }) => {
        const values = watchedValues as Record<string, unknown>;
        const hasSpouse = isApplicantApplying("spouse", values);

        const selectedCoverageIds = Array.isArray(values.coverageSelections)
          ? values.coverageSelections
          : [];
        const selectedCoverageIdSet = new Set(
          selectedCoverageIds.map((id) => String(id)),
        );
        const selectedCoverages = getActiveClientCoverages().filter(
          (coverage) => selectedCoverageIdSet.has(coverage.id),
        );
        const showHealthQuestionsNote = selectedCoverages.some(
          (coverage) => coverage.underwritingType === "FUW",
        );

        function openEdit(pageId: PageId) {
          navigate(`/${pageId}`);
        }

        return (
          <Stack spacing={2.5}>
            <Alert
              severity="info"
              icon={<ReportRoundedIcon fontSize="large" />}
            >
              <Stack spacing={1.5}>
                <Typography variant="body2" fontWeight={600}>
                  Important information about your application and next steps:
                </Typography>

                <Box
                  component="ul"
                  sx={{ m: 0, pl: 3, "& li + li": { mt: 1.5 } }}
                >
                  <li>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Check your information
                      </Typography>
                      <Typography variant="body2">
                        Make any edits now—changes can't be made after this
                        step.
                      </Typography>
                    </Box>
                  </li>

                  <li>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Review and authorize
                      </Typography>
                      <Typography variant="body2">
                        Read the consent information carefully and provide your
                        consent to continue.
                      </Typography>
                    </Box>
                  </li>

                  {showHealthQuestionsNote ? (
                    <li>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Answer health questions
                        </Typography>
                        <Typography variant="body2">
                          Based on your coverage, you'll answer a short set of
                          health questions in the next step. This only takes a
                          few minutes.
                        </Typography>
                      </Box>
                    </li>
                  ) : null}
                </Box>
              </Stack>
            </Alert>

            <ReviewPreviewSection
              values={values}
              hasSpouse={hasSpouse}
              reviewCards={reviewCards}
              reviewFieldBlocklist={reviewFieldBlocklist}
              subQuestionFieldIds={subQuestionFieldIds}
              onEdit={openEdit}
            />

            <Box>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 700, textAlign: "center" }}
              >
                Read & Sign
              </Typography>
              <Box
                sx={{
                  overflowY: "auto",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  borderRadius: 1,
                  p: 1.5,
                  backgroundColor: SECTION_SURFACE_BG,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-wrap",
                    fontSize: "0.8125rem",
                    lineHeight: 1.5,
                  }}
                >
                  {readAndSignContent}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <Button
                  startIcon={<PrintOutlinedIcon />}
                  onClick={printSection}
                >
                  Print
                </Button>
              </Box>
            </Box>

            <Box>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 700, textAlign: "center" }}
              >
                Electronic Consent
              </Typography>
              <Box
                sx={{
                  maxHeight: 200,
                  overflowY: "auto",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  borderRadius: 1,
                  p: 1.5,
                  backgroundColor: SECTION_SURFACE_BG,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-wrap",
                    fontSize: "0.8125rem",
                    lineHeight: 1.5,
                  }}
                >
                  {electronicConsentContent}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <Button
                  startIcon={<PrintOutlinedIcon />}
                  onClick={printSection}
                >
                  Print
                </Button>
              </Box>
            </Box>

            <Stack spacing={1.5}>
              <ApplicantSection
                applicant="self"
                showLabel={shouldShowApplicantLabel("self", values, "review")}
              >
                <FieldRenderer
                  field={fieldCatalog["review-self-consent"]}
                  control={control}
                  errors={errors}
                />
              </ApplicantSection>

              {hasSpouse ? (
                <ApplicantSection applicant="spouse" showLabel>
                  <FieldRenderer
                    field={fieldCatalog["review-spouse-consent"]}
                    control={control}
                    errors={errors}
                  />
                </ApplicantSection>
              ) : null}
            </Stack>
          </Stack>
        );
      }}
    </FormRoutePage>
  );
}

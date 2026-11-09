import { requirementText } from "../../domain/requirementContent";
import type { ReactNode } from "react";
import { Alert, Box, List, ListItem, Stack, Typography } from "@mui/material";
import ReportRoundedIcon from "@mui/icons-material/ReportRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import type { FormRouteRenderProps } from "../../app/RoutePage";
import type { ReviewContent } from "../../content/types";
import type { ClientApplicantLabels } from "../../config/clients/types";
import type { FieldDefinition } from "../../config/fields/types";
import type { resolveReviewExperience } from "../../config/reviewExperience";
import ApplicantSectionDivider from "../layout/ApplicantSectionDivider";
import FieldRenderer from "../forms/FieldRenderer";
import ReviewStatement from "../forms/ReviewStatement";
import LegalReviewSection from "../content/LegalReviewSection";

type ReviewBlock = ReturnType<typeof resolveReviewExperience>["blocks"][number];
export type ReviewSectionsProps = Pick<FormRouteRenderProps, "control" | "errors"> & {
  reviewContent: ReviewContent; documentPreview: ReactNode;
  isAdvisorApplicantFlow: boolean; showHealthQuestionsNote: boolean; remainingSteps?: string[];
  readAndSignText: string; beforeConsentNotices: ReviewBlock[]; blocks: ReviewBlock[];
  selfConsentField: FieldDefinition; spouseConsentField?: FieldDefinition; additionalFields: FieldDefinition[];
  applicantLabels?: ClientApplicantLabels; showSelfLabel: boolean;
  onPrint: () => void;
};

/** Review composition receives resolved copy, fields, applicant state and document content; the page owns policy and routing. */
export default function ReviewSections({ control, errors, reviewContent, documentPreview,
  isAdvisorApplicantFlow, showHealthQuestionsNote, remainingSteps, readAndSignText, beforeConsentNotices, blocks,
  selfConsentField, spouseConsentField, additionalFields, applicantLabels, showSelfLabel, onPrint }: ReviewSectionsProps) {
  return (
  <Stack spacing={2.5}>
    {isAdvisorApplicantFlow ? (
      <>
        <Alert
          severity="info"
          icon={<InfoRoundedIcon fontSize="large" />}
        >
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              {requirementText("application.ui.your-advisor-has-completed-this-section-of-the-application")}</Typography>
            <Typography variant="body2">
              {requirementText("application.ui.review-the-information-below-if-anything-needs-to-be-corrected-click-the-edit")}</Typography>
          </Stack>
        </Alert>

        <Alert
          severity="warning"
          icon={<ReportRoundedIcon fontSize="medium" />}
          sx={{ py: 0.75 }}
        >
          <Typography variant="body2">
            {requirementText("application.ui.steps-completed-by-your-advisor-getting-started-coverage-and-profile-are-locke")}</Typography>
        </Alert>
      </>
    ) : null}
    <Alert severity="info" role="status" icon={<InfoRoundedIcon />}>
      <Typography variant="subtitle2">{requirementText("application.ui.you-re-entering-the-final-stages-of-your-application")}</Typography>
      <Typography variant="body2">{requirementText("application.ui.check-your-application-below-and-provide-your-consent-after-this-page-you-ll-c")}</Typography>
      <Box component="ol" sx={{ my: 1, pl: 2.5 }}>{(remainingSteps ?? [...(showHealthQuestionsNote ? ['Health questions'] : []), 'Payment', 'Sign with DocuSign']).map(step => <li key={step}>{step}</li>)}</Box>
      <Typography variant="body2">{requirementText("application.ui.your-application-is-submitted-after-you-complete-the-remaining-steps")}</Typography>
    </Alert>
    <Box component="section" aria-labelledby="application-preview-heading">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box><Typography id="application-preview-heading" component="h2" variant="h5">{requirementText("application.ui.preview-your-application")}</Typography><Typography variant="body2" color="text.secondary">{requirementText("application.ui.check-your-answers-and-use-edit-to-make-corrections-before-continuing")}</Typography></Box>

      </Stack>
      {documentPreview}
    </Box>
    <Box component="section" aria-labelledby="application-consent-heading">
    <Typography id="application-consent-heading" component="h2" variant="h5" sx={{ mb: 1 }}>{requirementText("application.ui.read-and-consent")}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{requirementText("application.ui.read-the-statements-and-electronic-consent-below-then-confirm-your-agreement-t")}</Typography>

    <Stack spacing={3}>
    <LegalReviewSection id="read-and-sign" title={reviewContent.readAndSignTitle} onPrint={onPrint}>
        <ReviewStatement notices={beforeConsentNotices} text={readAndSignText} />
        {blocks.map(block => (
          <Stack key={block.key} spacing={2} sx={{ mt: 2 }} data-review-block={block.key}>
            {block.fields.length > 0 && <Typography variant="subtitle2" fontWeight={700}>{block.title}</Typography>}
            {block.paragraphs.map((paragraph, index) => <Typography key={index} variant="body2" sx={{ whiteSpace: "pre-wrap", ...(block.fontSizePt ? { fontSize: `${block.fontSizePt}pt` } : {}), ...(block.emphasis === "bold" ? { fontWeight: 700 } : {}) }}>{paragraph}</Typography>)}
            {block.listItems && <List component="ul" sx={{ listStyleType: "disc", pl: 3, py: 0 }}>{block.listItems.map((item, index) => <ListItem key={index} component="li" sx={{ display: "list-item", p: 0, mb: 1 }}><Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{item}</Typography></ListItem>)}</List>}
            {block.afterList?.map((paragraph, index) => <Typography key={index} variant="body2">{paragraph}</Typography>)}
            {block.fields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />)}
          </Stack>
        ))}
    </LegalReviewSection>

    <LegalReviewSection id="electronic-consent" title={reviewContent.electronicConsentTitle} onPrint={onPrint}>
        <Typography
          variant="caption"
          sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}
        >
          {reviewContent.electronicConsentContent}
        </Typography>
    </LegalReviewSection>

    <Stack spacing={1.5}>
      <ApplicantSectionDivider
        applicant="self" labels={applicantLabels}
        showLabel={showSelfLabel}
      >
        <FieldRenderer
          field={selfConsentField}
          control={control}
          errors={errors}
        />
      </ApplicantSectionDivider>

      {spouseConsentField ? (
        <ApplicantSectionDivider applicant="spouse" labels={applicantLabels} showLabel>
          <FieldRenderer
            field={spouseConsentField}
            control={control}
            errors={errors}
          />
        </ApplicantSectionDivider>
      ) : null}
    </Stack>
    {additionalFields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />)}
    </Stack>
    </Box>

  </Stack>
  );
}

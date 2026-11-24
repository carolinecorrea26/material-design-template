import AppModal from '../layout/AppModal';
import LegalDocList from '../content/LegalDocList';
import PrintAction from '../content/PrintAction';
import { requirementText } from "../../domain/requirementContent";
import { useState, type ReactNode } from "react";
import { Alert, Box, Link, List, ListItem, Stack, Typography } from "@mui/material";
import FieldGrid from '../layout/FieldGrid';

import type { FormRouteRenderProps } from "../../app/RoutePage";
import type { LegalDocContent, ReviewContent } from "../../content/types";
import type { ClientApplicantLabels } from "../../config/clients/types";
import type { FieldDefinition } from "../../config/fields/types";
import type { resolveReviewExperience } from "../../config/reviewExperience";
import ApplicantSectionDivider from "../layout/ApplicantSectionDivider";
import FieldRenderer from "../forms/FieldRenderer";
import ReviewStatement from "../forms/ReviewStatement";
import LegalReviewSection from "../content/LegalReviewSection";

type ReviewBlock = ReturnType<typeof resolveReviewExperience>["blocks"][number];
export type ReviewSectionsProps = Pick<FormRouteRenderProps, "control" | "errors"> & {
  legalSections: ReturnType<typeof resolveReviewExperience>['legalSections'];
  legalDocuments?: ReturnType<typeof resolveReviewExperience>["legalDocuments"];
  reviewContent: ReviewContent; documentPreview: ReactNode;
  isAdvisorApplicantFlow: boolean; remainingSteps: string[];
  readAndSignText: string; beforeConsentNotices: ReviewBlock[]; blocks: ReviewBlock[];
  selfConsentField: FieldDefinition; spouseConsentField?: FieldDefinition; additionalFields: FieldDefinition[];
  applicantLabels?: ClientApplicantLabels; showSelfLabel: boolean;
  onPrint?: () => void;
};

/** Review composition receives resolved copy, fields, applicant state and document content; the page owns policy and routing. */
export default function ReviewSections({ control, errors, reviewContent, documentPreview, legalSections,
  isAdvisorApplicantFlow, remainingSteps, readAndSignText, beforeConsentNotices, blocks,
  selfConsentField, spouseConsentField, additionalFields, applicantLabels, showSelfLabel, onPrint, legalDocuments = [] }: ReviewSectionsProps) {
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState<LegalDocContent>();
  function renderLegalText(text: string, section: 'read-and-sign' | 'electronic-consent' = 'read-and-sign'): ReactNode {
    let nodes: ReactNode[] = [text];
    for (const link of legalDocuments.filter(link => link.section === section)) {
      nodes = nodes.flatMap<ReactNode>((node, index) => typeof node === 'string' ? node.split(link.text).flatMap<ReactNode>((part, occurrence) => [occurrence > 0 ? <Link key={`${link.text}-${index}-${occurrence}`} href="#review-legal-document" variant="inherit" onClick={event => { event.preventDefault(); setActiveDocument(link.document); setNoticeOpen(true); }}>{link.text}</Link> : null, part]) : [node]);
    }
    return nodes;
  }
  const renderBlock = (block: ReviewBlock) => {
    const textStyle = { whiteSpace: 'pre-wrap', ...(block.fontSizePt ? { fontSize: `${block.fontSizePt}pt` } : {}), ...(block.emphasis === 'bold' ? { fontWeight: 700 } : {}) };
    const body = <Stack key={block.key} spacing={2} sx={{ mt: 2 }} data-review-block={block.key}>
      {block.fields.length > 0 && <Typography variant="subtitle2" fontWeight={700}>{block.title}</Typography>}
      {block.paragraphs.map((paragraph, index) => <Typography key={index} variant="body2" sx={textStyle}>{renderLegalText(paragraph)}</Typography>)}
      {block.listItems && <List component="ul" sx={{ listStyleType: 'disc', pl: 3, py: 0 }}>{block.listItems.map((item, index) => <ListItem key={index} component="li" sx={{ display: 'list-item', p: 0, mb: 1 }}><Typography variant="body2" sx={textStyle}>{renderLegalText(item)}</Typography></ListItem>)}</List>}
      {block.afterList?.map((paragraph, index) => <Typography key={index} variant="body2" sx={textStyle}>{renderLegalText(paragraph)}</Typography>)}
      {block.fields.length > 0 && <FieldGrid>{block.fields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />)}</FieldGrid>}
    </Stack>;
    return block.appearance === 'info' ? <Alert key={block.key} severity="info">{body}</Alert> : body;
  };
  const blocksAt = (placement: ReviewBlock['placement']) => blocks.filter(block => block.placement === placement).map(renderBlock);
  return (
  <><Stack spacing={2.5}>
    {blocksAt("before-review")}
    {isAdvisorApplicantFlow ? (
        <Alert severity="info">
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              {requirementText("application.ui.your-advisor-has-completed-this-section-of-the-application")}</Typography>
            <Typography variant="body2">
              {requirementText("application.ui.review-the-information-below-if-anything-needs-to-be-corrected-click-the-edit")}</Typography>
          </Stack>
        </Alert>
    ) : null}
    <Alert severity="warning">
      <Typography variant="subtitle2">{requirementText("application.ui.you-re-entering-the-final-stages-of-your-application")}</Typography>
      <Typography variant="body2">{requirementText("application.ui.check-your-application-below-and-provide-your-consent-after-this-page-you-ll-c")}</Typography>
      <Box component="ol" sx={{ my: 1, pl: 2.5 }}>{remainingSteps.map(step => <li key={step}>{step}</li>)}</Box>
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
    <LegalReviewSection id="read-and-sign" title={reviewContent.readAndSignTitle} maxHeight={legalSections['read-and-sign'].maxHeight ?? undefined} onPrint={onPrint}>
        <ReviewStatement notices={beforeConsentNotices} renderNotice={renderBlock} renderText={renderLegalText} text={readAndSignText} />
        {blocks.filter(block => !block.placement || block.placement === "read-and-sign-appendix").map(renderBlock)}
    </LegalReviewSection>

    <LegalReviewSection id="electronic-consent" title={reviewContent.electronicConsentTitle} maxHeight={legalSections['electronic-consent'].maxHeight ?? undefined} onPrint={onPrint}>
        <Typography
          variant="caption"
          sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}
        >
          {renderLegalText(reviewContent.electronicConsentContent, "electronic-consent")}
        </Typography>
    </LegalReviewSection>

    {blocksAt("after-electronic-consent")}
    {blocksAt("before-signature")}
    <Stack spacing={1.5}>
      <ApplicantSectionDivider
        applicant="self" labels={applicantLabels}
        showLabel={showSelfLabel}
      >
        {blocksAt("before-member-signature")}
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
    {additionalFields.length > 0 && <FieldGrid>{additionalFields.map(field => <FieldRenderer key={field.id} field={field} control={control} errors={errors} />)}</FieldGrid>}
    </Stack>
    </Box>

  </Stack>
  {activeDocument && <AppModal open={noticeOpen} onClose={() => setNoticeOpen(false)} title={activeDocument.title} maxWidth={700}
    footerActions={<PrintAction targetId="review-legal-document-content" onPrint={onPrint} />}
    actions={[{ label: requirementText('review.important-notice.close'), onClick: () => setNoticeOpen(false), variant: 'contained' }]}>
    <Box id="review-legal-document-content" aria-label={activeDocument.title}><LegalDocList doc={activeDocument} /></Box>
  </AppModal>}
  </>
  );
}

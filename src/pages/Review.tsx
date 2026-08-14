import { useState } from "react";
import ReportRoundedIcon from "@mui/icons-material/ReportRounded";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FormRoutePage from "../app/RoutePage";
import ApplicantSectionDivider from "../components/layout/ApplicantSectionDivider";
import {
  isApplicantApplying,
  shouldShowApplicantLabel,
} from "../utils/applicantVisibility";
import { SECTION_SURFACE_BG } from "../app/theme";
import FieldRenderer from "../components/forms/FieldRenderer";
import type { PageId } from "../types";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { fieldCatalog } from "../config/fields";
import ApplicationDocumentPreview from "../components/content/ApplicationDocumentPreview";
import { getContent } from "../content";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import ConfirmationDialog from "../components/layout/ConfirmationDialog";
import { useReviewSubmitted } from "../app/useReviewSubmitted";

const reviewContent = getContent().review;

export default function Review() {
  const navigate = useNavigate();
  const { isReviewSubmitted } = useReviewSubmitted();
  const [editTargetPageId, setEditTargetPageId] = useState<PageId | null>(null);

  function printSection() {
    window.print();
  }

  function handleEditConfirm() {
    if (editTargetPageId) {
      navigate(`/${editTargetPageId}`);
    }
    setEditTargetPageId(null);
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
        const values = watchedValues as ApplicationFormValues;
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
          setEditTargetPageId(pageId);
        }

        return (
          <Stack spacing={2.5}>
            <Alert
              severity="warning"
              icon={<ReportRoundedIcon fontSize="large" />}
            >
              <Stack spacing={1.5}>
                <Typography variant="body2" fontWeight={600}>
                  {reviewContent.alertTitle}
                </Typography>

                <Box
                  component="ul"
                  sx={{ m: 0, pl: 3, "& li + li": { mt: 1.5 } }}
                >
                  {reviewContent.alertItems.map((item) => (
                    <li key={item.title}>
                      <Box>
                        <Typography variant="subtitle2">
                          {item.title}
                        </Typography>
                        <Typography variant="body2">
                          {item.description}
                        </Typography>
                      </Box>
                    </li>
                  ))}

                  {showHealthQuestionsNote ? (
                    <li>
                      <Box>
                        <Typography variant="subtitle2">
                          {reviewContent.healthQuestionsNote.title}
                        </Typography>
                        <Typography variant="body2">
                          {reviewContent.healthQuestionsNote.description}
                        </Typography>
                      </Box>
                    </li>
                  ) : null}
                </Box>
              </Stack>
            </Alert>

            <ApplicationDocumentPreview
              values={values}
              signatureName=""
              signedDate=""
              currentDate={new Intl.DateTimeFormat("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              }).format(new Date())}
              onEditSection={isReviewSubmitted ? undefined : openEdit}
              hideSignature
            />

            <ConfirmationDialog
              open={editTargetPageId !== null}
              onClose={() => setEditTargetPageId(null)}
              title="Edit your application"
              message="To edit your application, you will be sent back to the page where that information is collected. Do you want to go to this page to make edits?"
              confirmLabel="Yes"
              cancelLabel="Cancel"
              onConfirm={handleEditConfirm}
            />

            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ mb: 1, textAlign: "center" }}
              >
                {reviewContent.readAndSignTitle}
              </Typography>
              <Box
                sx={{
                  overflowY: "auto",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1.5,
                  backgroundColor: SECTION_SURFACE_BG,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}
                >
                  {reviewContent.readAndSignContent}
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
                fontWeight={700}
                sx={{ mb: 1, textAlign: "center" }}
              >
                {reviewContent.electronicConsentTitle}
              </Typography>
              <Box
                sx={{
                  maxHeight: 200,
                  overflowY: "auto",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1.5,
                  backgroundColor: SECTION_SURFACE_BG,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}
                >
                  {reviewContent.electronicConsentContent}
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
              <ApplicantSectionDivider
                applicant="self"
                showLabel={shouldShowApplicantLabel("self", values)}
              >
                <FieldRenderer
                  field={fieldCatalog["review-self-consent"]}
                  control={control}
                  errors={errors}
                />
              </ApplicantSectionDivider>

              {hasSpouse ? (
                <ApplicantSectionDivider applicant="spouse" showLabel>
                  <FieldRenderer
                    field={fieldCatalog["review-spouse-consent"]}
                    control={control}
                    errors={errors}
                  />
                </ApplicantSectionDivider>
              ) : null}
            </Stack>
          </Stack>
        );
      }}
    </FormRoutePage>
  );
}

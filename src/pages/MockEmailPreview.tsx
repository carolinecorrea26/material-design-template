import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Box,
  Collapse,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DraftsRoundedIcon from "@mui/icons-material/DraftsRounded";
import {
  getMockEmailAudience,
  readMockEmailPreviews,
  subscribeToMockEmailPreviews,
  type MockEmailAudience,
  type MockEmailPreview as MockEmailPreviewData,
} from "../utils/mockEmail";

function formatPreviewDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

const emailSections: Array<{
  audience: MockEmailAudience;
  title: string;
  description: string;
}> = [
  {
    audience: "applicant",
    title: "Consumer Flow Emails",
    description:
      "Emails sent to applicants throughout the application flow.",
  },
  {
    audience: "advisor",
    title: "Advisor Flow Emails",
    description:
      "Emails sent to advisors about applications they've submitted.",
  },
];

function EmailInboxTable({
  audienceLabel,
  previews,
  expandedEmailId,
  onToggle,
}: {
  audienceLabel: string;
  previews: MockEmailPreviewData[];
  expandedEmailId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <TableContainer>
      <Table aria-label={`${audienceLabel} mock email inbox`}>
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell sx={{ fontWeight: 800 }}>Subject</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>From</TableCell>
            <TableCell align="right" sx={{ fontWeight: 800 }}>
              Date
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {previews.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3}>
                <Stack
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    justifyContent: "center",
                    py: 8,
                    color: "text.secondary",
                  }}
                >
                  <DraftsRoundedIcon fontSize="large" />

                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    No {audienceLabel} emails yet
                  </Typography>

                  <Typography variant="body2">
                    Start the application flow to generate email previews.
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
          ) : (
            previews.map((preview) => {
              const isExpanded = expandedEmailId === preview.id;

              return (
                <Fragment key={preview.id}>
                  <TableRow
                    hover
                    onClick={() => onToggle(preview.id)}
                    sx={{
                      cursor: "pointer",
                      bgcolor: isExpanded ? "action.hover" : "inherit",
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {preview.subject}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {preview.fromName}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          {preview.fromEmail}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        {formatPreviewDate(preview.createdAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell
                      colSpan={3}
                      sx={{
                        p: 0,
                        borderBottom: isExpanded ? "1px solid" : 0,
                        borderColor: "divider",
                      }}
                    >
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box
                          sx={{
                            p: { xs: 2, md: 3 },
                            bgcolor: "white",
                          }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 0,
                              overflow: "hidden",
                              bgcolor: "background.paper",
                            }}
                          >
                            <Box sx={{ p: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {preview.subject}
                              </Typography>

                              <Typography
                                variant="body2"
                                sx={{
                                  color: "text.secondary",
                                  mt: 0.5,
                                }}
                              >
                                From: {preview.fromName} &lt;
                                {preview.fromEmail}&gt;
                              </Typography>

                              <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                              >
                                To: {preview.toEmail}
                              </Typography>

                              <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                              >
                                Date: {formatPreviewDate(preview.createdAt)}
                              </Typography>
                            </Box>

                            <Divider />

                            <Box
                              component="iframe"
                              title={`${preview.subject} email preview`}
                              srcDoc={preview.html}
                              sx={{
                                display: "block",
                                width: "100%",
                                minHeight: { xs: 760, md: 900 },
                                border: 0,
                                bgcolor: "white",
                              }}
                            />
                          </Paper>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function MockEmailPreview() {
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<MockEmailPreviewData[]>(() =>
    readMockEmailPreviews(),
  );

  useEffect(() => {
    return subscribeToMockEmailPreviews(() => {
      setPreviews(readMockEmailPreviews());
    });
  }, []);

  const previewsBySection = useMemo(() => {
    return emailSections.map((section) => ({
      ...section,
      previews: previews.filter(
        (preview) => getMockEmailAudience(preview) === section.audience,
      ),
    }));
  }, [previews]);

  function handleToggle(id: string) {
    setExpandedEmailId((current) => (current === id ? null : id));
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1180,
        mx: "auto",
        py: { xs: 2, md: 4 },
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
            Email Templates
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: "text.secondary", mt: 1, maxWidth: 720 }}
          >
            Mock emails generated during testing will appear here automatically.
          </Typography>
        </Box>

        {previewsBySection.map((section) => (
          <Paper
            key={section.audience}
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              overflow: "hidden",
              backgroundColor: "background.paper",
            }}
          >
            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: "#ebebed",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {section.title} ({section.previews.length})
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.25 }}
              >
                {section.description}
              </Typography>
            </Box>

            <EmailInboxTable
              audienceLabel={section.audience}
              previews={section.previews}
              expandedEmailId={expandedEmailId}
              onToggle={handleToggle}
            />
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

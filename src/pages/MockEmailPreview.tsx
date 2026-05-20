import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Box,
  Collapse,
  Divider,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import DraftsRoundedIcon from "@mui/icons-material/DraftsRounded";
import {
  getMockEmailAudience,
  readMockEmailPreviews,
  subscribeToMockEmailPreviews,
  type MockEmailAudience,
  type MockEmailPreview,
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

const inboxTabs: Array<{
  value: MockEmailAudience;
  label: string;
}> = [
  {
    value: "applicant",
    label: "Applicant",
  },
  {
    value: "advisor",
    label: "Advisor",
  },
];

export default function MockEmailPreview() {
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MockEmailAudience>("applicant");
  const [previews, setPreviews] = useState<MockEmailPreview[]>(() =>
    readMockEmailPreviews(),
  );

  useEffect(() => {
    return subscribeToMockEmailPreviews(() => {
      setPreviews(readMockEmailPreviews());
    });
  }, []);

  const inboxCounts = useMemo(() => {
    return previews.reduce<Record<MockEmailAudience, number>>(
      (counts, preview) => {
        const audience = getMockEmailAudience(preview);
        counts[audience] += 1;
        return counts;
      },
      {
        applicant: 0,
        advisor: 0,
      },
    );
  }, [previews]);

  const visiblePreviews = useMemo(() => {
    return previews.filter(
      (preview) => getMockEmailAudience(preview) === activeTab,
    );
  }, [activeTab, previews]);

  function handleTabChange(
    _: React.SyntheticEvent,
    nextTab: MockEmailAudience,
  ) {
    setActiveTab(nextTab);
    setExpandedEmailId(null);
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

        <Paper
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: "background.paper",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="Mock email inbox tabs"
            sx={{
              px: { xs: 1, sm: 2 },
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "#ebebed",
            }}
          >
            {inboxTabs.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={`${tab.label} (${inboxCounts[tab.value]})`}
                sx={{ fontWeight: 800 }}
              />
            ))}
          </Tabs>

          <TableContainer>
            <Table aria-label={`${activeTab} mock email inbox`}>
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
                {visiblePreviews.length === 0 ? (
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
                          No {activeTab} emails yet
                        </Typography>

                        <Typography variant="body2">
                          Start the application flow to generate email previews.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  visiblePreviews.map((preview: MockEmailPreview) => {
                    const isExpanded = expandedEmailId === preview.id;

                    return (
                      <Fragment key={preview.id}>
                        <TableRow
                          hover
                          onClick={() =>
                            setExpandedEmailId(isExpanded ? null : preview.id)
                          }
                          sx={{
                            cursor: "pointer",
                            bgcolor: isExpanded ? "action.hover" : "inherit",
                          }}
                        >
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              {preview.subject}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Stack spacing={0.25}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 800 }}
                              >
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
                            <Collapse
                              in={isExpanded}
                              timeout="auto"
                              unmountOnExit
                            >
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
                                    <Typography
                                      variant="h6"
                                      sx={{ fontWeight: 800 }}
                                    >
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
                                      Date:{" "}
                                      {formatPreviewDate(preview.createdAt)}
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
        </Paper>
      </Stack>
    </Box>
  );
}

import { Box, Divider, IconButton, Stack, Typography } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { getActiveClient } from "../../config/client/getActiveClient";
import type { ApplicationFormValues } from "../../app/ApplicationFormContext";
import type { PageId } from "../../types";

import { buildDocumentSections, documentPages } from './applicationDocumentSections';

type ApplicationDocumentPreviewProps = {
  values: ApplicationFormValues;
  signatureName: string;
  signedDate: string;
  currentDate: string;
  onEditSection?: (pageId: PageId) => void;
  hideSignature?: boolean;
};

function chunkSections<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

const PLACEHOLDER = "—";

function renderEntryValue(value: string) {
  return value || PLACEHOLDER;
}

export default function ApplicationDocumentPreview({
  values,
  signatureName,
  signedDate,
  currentDate,
  onEditSection,
  hideSignature,
}: ApplicationDocumentPreviewProps) {
  const client = getActiveClient();
  const sections = buildDocumentSections(values);
  const pages = chunkSections(sections, 3);

  // Map section titles back to page IDs for edit buttons
  const sectionTitleToPageId = new Map(
    documentPages.map((p) => [p.title, p.pageId]),
  );

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "#f3f4f6",
        p: { xs: 1.5, md: 2.5 },
        maxHeight: { xs: "56vh", lg: "72vh" },
        overflowY: "auto",
      }}
    >
      <Stack spacing={2.5}>
        {pages.map((pageSections, pageIndex) => (
          <Box
            key={`page-${pageIndex + 1}`}
            sx={{
              backgroundColor: "background.paper",
              border: "1px solid rgba(15, 23, 42, 0.12)",
              borderRadius: 1,
              px: { xs: 2, md: 4 },
              py: { xs: 2.5, md: 4 },
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Stack spacing={3}>
              {pageIndex === 0 ? (
                <Stack spacing={1.5}>
                  <Typography variant="overline">
                    Application Preview
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <div>
                      <Typography variant="h5">
                        {client.branding.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Insurance Application Review Copy
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body2" color="text.secondary">
                        Prepared on {currentDate}
                      </Typography>
                    </div>
                  </Stack>
                  <Divider />
                </Stack>
              ) : null}

              {pageSections.map((section) => {
                const sectionPageId = sectionTitleToPageId.get(section.title);
                return (
                  <Stack key={section.title} spacing={1.5}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {section.title}
                      </Typography>
                      {onEditSection &&
                        sectionPageId &&
                        sectionPageId !== "review" && (
                          <IconButton
                            size="small"
                            onClick={() => onEditSection(sectionPageId)}
                            aria-label={`Edit ${section.title}`}
                            sx={{ color: "primary.main" }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        )}
                    </Stack>

                    {section.groups.map((group, groupIndex) => (
                      <Stack
                        key={`${section.title}-${group.title ?? groupIndex}`}
                        spacing={1}
                      >
                        {group.title ? (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {group.title}
                          </Typography>
                        ) : null}

                        <Stack spacing={0.75}>
                          {group.entries.map((entry, entryIndex) => (
                            <Stack
                              key={`${section.title}-${group.title ?? "group"}-${entry.label}-${entryIndex}`}
                              direction={{ xs: "column", sm: "row" }}
                              spacing={0.75}
                              justifyContent="space-between"
                              sx={{
                                py: 0.75,
                                borderBottom:
                                  "1px dotted rgba(15, 23, 42, 0.16)",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ width: { sm: "42%" }, flexShrink: 0 }}
                              >
                                {entry.label}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  textAlign: { sm: "right" },
                                  wordBreak: "break-word",
                                }}
                              >
                                {renderEntryValue(entry.value)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                );
              })}

              {pageIndex === pages.length - 1 && !hideSignature ? (
                <Stack spacing={1.25} sx={{ pt: 1.5 }}>
                  <Divider />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Signature
                  </Typography>
                  <Box
                    sx={{
                      border: "1px solid rgba(15, 23, 42, 0.16)",
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="caption" color="text.secondary">
                        Electronic signature
                      </Typography>
                      <Typography
                        sx={{
                          minHeight: 44,
                          fontSize: "2rem",
                          lineHeight: 1.1,
                          fontFamily:
                            '"Brush Script MT", "Segoe Script", cursive',
                          color: signatureName.trim()
                            ? "text.primary"
                            : "text.disabled",
                        }}
                      >
                        {signatureName.trim() || PLACEHOLDER}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Signed date: {signedDate || PLACEHOLDER}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              ) : null}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import type { ClientId } from "../../types";
import AppModal from "../layout/AppModal";
import ClientNote, { CLIENT_HIGHLIGHT_BG } from "./ClientNote";
import ResponsiveTableContainer from "./ResponsiveTableContainer";
import {
  readMockEmailPreviews,
  subscribeToMockEmailPreviews,
  type MockEmailPreview as MockEmailPreviewData,
} from "../../utils/mockEmail";
import { emailTemplateRows, type EmailTemplateRow } from "./emailTemplateRows";
import ResizableHeaderCell from "./ResizableHeaderCell";
import SearchField from "./SearchField";
import useResizableColumns from "./useResizableColumns";

type ModalView = "mockup" | "html";
type EmailTypeFilter = "All" | EmailTemplateRow["flow"];

const ALL_EMAIL_TYPES: EmailTypeFilter = "All";

const FLOW_CHIP_COLOR = {
  Consumer: "primary",
  Advisor: "secondary",
  Resume: "success",
} as const;

/**
 * Flow / Email / Description / When sent / Notes table for the mock email
 * catalog, resolved against a given client (the "demo" placeholder client for
 * the Global tab, or a real client for the Client tab). The Email column
 * opens a modal with a mockup + raw HTML preview, shared by both panels.
 */
export default function EmailTemplatesTable({
  clientId,
  highlightedIds,
  overrideNote,
}: {
  clientId: ClientId;
  /** Row ids to render with the client-override yellow highlight. */
  highlightedIds?: Set<string>;
  /** Chip label shown under the email name for highlighted rows. */
  overrideNote?: string;
}) {
  const [openRow, setOpenRow] = useState<EmailTemplateRow | null>(null);
  const [modalView, setModalView] = useState<ModalView>("mockup");
  const [search, setSearch] = useState("");
  const [emailType, setEmailType] = useState<EmailTypeFilter>(ALL_EMAIL_TYPES);
  const [previews, setPreviews] = useState<MockEmailPreviewData[]>(() =>
    readMockEmailPreviews(clientId),
  );
  const { widths, resize } = useResizableColumns({
    flow: 120,
    email: 230,
    description: 320,
    whenSent: 360,
    notes: 360,
  });

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return emailTemplateRows.filter((row) => {
      if (emailType !== ALL_EMAIL_TYPES && row.flow !== emailType) return false;
      if (!query) return true;
      return `${row.flow} ${row.title} ${row.description} ${row.whenSent} ${row.notes}`
        .toLowerCase()
        .includes(query);
    });
  }, [emailType, search]);

  useEffect(() => {
    setPreviews(readMockEmailPreviews(clientId));
  }, [clientId]);

  useEffect(() => {
    return subscribeToMockEmailPreviews(() => {
      setPreviews(readMockEmailPreviews(clientId));
    });
  }, [clientId]);

  const openPreview = useMemo(
    () =>
      openRow
        ? previews.find((preview) => preview.type === openRow.type) ?? null
        : null,
    [openRow, previews],
  );

  function handleOpenRow(row: EmailTemplateRow) {
    setOpenRow(row);
    setModalView("mockup");
  }

  return (
    <>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <SearchField value={search} onChange={setSearch} placeholder="Search email templates…" />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="email-type-filter-label">Email type</InputLabel>
            <Select
              labelId="email-type-filter-label"
              label="Email type"
              value={emailType}
              onChange={(event) => setEmailType(event.target.value as EmailTypeFilter)}
            >
              <MenuItem value={ALL_EMAIL_TYPES}>All email types</MenuItem>
              {Object.keys(FLOW_CHIP_COLOR).map((flow) => (
                <MenuItem key={flow} value={flow}>
                  {flow}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <ResponsiveTableContainer>
          <Table
            size="small"
            aria-label="Email templates"
            sx={{ tableLayout: "fixed", width: "max-content" }}
          >
            <colgroup>
              <col style={{ width: widths.flow }} />
              <col style={{ width: widths.email }} />
              <col style={{ width: widths.description }} />
              <col style={{ width: widths.whenSent }} />
              <col style={{ width: widths.notes }} />
            </colgroup>
            <TableHead>
              <TableRow>
                <ResizableHeaderCell
                  width={widths.flow}
                  onResize={(value) => resize("flow", value)}
                >
                  Type
                </ResizableHeaderCell>
                <ResizableHeaderCell
                  width={widths.email}
                  onResize={(value) => resize("email", value)}
                >
                  Email
                </ResizableHeaderCell>
                <ResizableHeaderCell
                  width={widths.description}
                  onResize={(value) => resize("description", value)}
                >
                  Description
                </ResizableHeaderCell>
                <ResizableHeaderCell
                  width={widths.whenSent}
                  onResize={(value) => resize("whenSent", value)}
                >
                  When sent
                </ResizableHeaderCell>
                <ResizableHeaderCell
                  width={widths.notes}
                  onResize={(value) => resize("notes", value)}
                >
                  Notes
                </ResizableHeaderCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredRows.map((row) => {
              const highlighted = highlightedIds?.has(row.id) ?? false;

              return (
                <TableRow
                  key={row.id}
                  hover
                  sx={highlighted ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}
                >
                  <TableCell sx={{ whiteSpace: "normal !important", verticalAlign: "top" }}>
                    <Chip
                      label={row.flow}
                      size="small"
                      color={FLOW_CHIP_COLOR[row.flow]}
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>

                  <TableCell sx={{ whiteSpace: "normal !important", verticalAlign: "top" }}>
                    <Link
                      component="button"
                      type="button"
                      underline="hover"
                      onClick={() => handleOpenRow(row)}
                      sx={{ fontWeight: 700, textAlign: "left" }}
                    >
                      {row.title}
                    </Link>
                    {highlighted && overrideNote && (
                      <Box sx={{ mt: 0.5 }}>
                        <ClientNote label={overrideNote} />
                      </Box>
                    )}
                  </TableCell>

                  <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important" }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {row.description}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important" }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {row.whenSent}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important" }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {row.notes}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
              })}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No email templates match these filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ResponsiveTableContainer>

        <Typography variant="caption" color="text.secondary">
          Showing {filteredRows.length} of {emailTemplateRows.length} email templates.
        </Typography>
      </Stack>

      <AppModal
        open={Boolean(openRow)}
        onClose={() => setOpenRow(null)}
        title={openRow?.title ?? ""}
        maxWidth={860}
      >
        {openPreview && (
          <Stack spacing={2}>
            <Tabs
              value={modalView}
              onChange={(_, value: ModalView) => setModalView(value)}
              sx={{ borderBottom: "1px solid", borderColor: "divider" }}
            >
              <Tab value="mockup" label="Mockup" />
              <Tab value="html" label="HTML" />
            </Tabs>

            {modalView === "mockup" ? (
              <Box
                component="iframe"
                title={`${openPreview.subject} email preview`}
                srcDoc={openPreview.html}
                sx={{
                  display: "block",
                  width: "100%",
                  minHeight: { xs: 640, md: 760 },
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "white",
                }}
              />
            ) : (
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "#f5f5f5",
                  color: "#111827",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: { xs: 640, md: 760 },
                  overflow: "auto",
                }}
              >
                {openPreview.html}
              </Box>
            )}
          </Stack>
        )}
      </AppModal>
    </>
  );
}

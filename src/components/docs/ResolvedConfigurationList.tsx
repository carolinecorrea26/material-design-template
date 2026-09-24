import { useMemo, useState } from "react";
import { Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import ResponsiveTableContainer from "./ResponsiveTableContainer";
import ResizableHeaderCell from "./ResizableHeaderCell";
import SearchField from "./SearchField";
import PageFilterSelect, { ALL_PAGES } from "./PageFilterSelect";
import useResizableColumns from "./useResizableColumns";
import { CLIENT_HIGHLIGHT_BG, CLIENT_HIGHLIGHT_BORDER } from "./ClientNote";
import type { ResolvedConfiguration } from "../../config/resolvers";
import TruncatedString from "./TruncatedString";
import { getSiteDetailsPageOrder } from "../../config/resolvers";
import { getConfigurationRequirement } from "../../content/docs/configurations";

/** Renders an unknown resolved config value (primitive/array/object) as a compact, readable string. */
function formatConfigValue(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value || "—";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => !(v === undefined || v === null || (Array.isArray(v) && v.length === 0)),
    );
    if (entries.length === 0) return "—";
    return entries
      .map(([key, v]) => `${key}: ${Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join("; ");
  }
  return String(value);
}

/**
 * Default → Effective → Status table for resolved configuration settings,
 * ordered by their owning page and then by source order. Overridden rows are
 * highlighted; inherited rows render in muted text so overrides read as the
 * exception, not the norm.
 */
export default function ResolvedConfigurationList({
  rows,
}: {
  rows: ResolvedConfiguration[];
}) {
  const [filter, setFilter] = useState("");
  const [pageFilter, setPageFilter] = useState(ALL_PAGES);
  const { widths, resize } = useResizableColumns({
    configurationId: 220,
    page: 160,
    setting: 200,
    description: 300,
    defaultValue: 200,
    requirement: 130,
    effective: 200,
    status: 110,
  });

  const pageOrder = getSiteDetailsPageOrder();
  const orderedRows = rows
    .map((row, originalIndex) => ({ row, originalIndex }))
    .sort((a, b) => {
      const pageRank = (pageId: string) => {
        if (pageId === "global") return pageOrder.length;
        const index = pageOrder.findIndex((id) => id === pageId);
        return index === -1 ? pageOrder.length - 1 : index;
      };
      return pageRank(a.row.page.id) - pageRank(b.row.page.id) || a.originalIndex - b.originalIndex;
    })
    .map(({ row }) => row);
  const pageOptions = Array.from(
    new Map(
      orderedRows.map((row) => [
        row.page.id,
        { value: row.page.id, label: row.page.label },
      ]),
    ).values(),
  );

  const filteredRows = useMemo(() => {
    const lc = filter.toLowerCase();
    return orderedRows.filter(
      (row) =>
        (pageFilter === ALL_PAGES || row.page.id === pageFilter) &&
        (!lc ||
          `${row.configurationId} ${row.page.label} ${row.label} ${row.key} ${row.global.description}`
            .toLowerCase()
            .includes(lc)),
    );
  }, [orderedRows, filter, pageFilter]);

  if (rows.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <SearchField value={filter} onChange={setFilter} placeholder="Search configuration…" />
        <PageFilterSelect value={pageFilter} onChange={setPageFilter} options={pageOptions} />
      </Stack>
      <ResponsiveTableContainer>
        <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
          <colgroup>
            <col style={{ width: widths.configurationId }} />
            <col style={{ width: widths.page }} />
            <col style={{ width: widths.setting }} />
            <col style={{ width: widths.description }} />
            <col style={{ width: widths.defaultValue }} />
            <col style={{ width: widths.requirement }} />
            <col style={{ width: widths.effective }} />
            <col style={{ width: widths.status }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <ResizableHeaderCell
                width={widths.configurationId}
                onResize={(w) => resize("configurationId", w)}
              >
                Configuration ID
              </ResizableHeaderCell>
              <ResizableHeaderCell width={widths.page} onResize={(w) => resize("page", w)}>
                Page
              </ResizableHeaderCell>
              <ResizableHeaderCell width={widths.setting} onResize={(w) => resize("setting", w)}>
                Setting
              </ResizableHeaderCell>
              <ResizableHeaderCell width={widths.description} onResize={(w) => resize("description", w)}>
                Description
              </ResizableHeaderCell>
              <ResizableHeaderCell width={widths.defaultValue} onResize={(w) => resize("defaultValue", w)}>
                Default value
              </ResizableHeaderCell>
              <ResizableHeaderCell width={widths.requirement} onResize={(w) => resize("requirement", w)}>
                Setup
              </ResizableHeaderCell>
              <ResizableHeaderCell width={widths.effective} onResize={(w) => resize("effective", w)}>
                Effective
              </ResizableHeaderCell>
              <ResizableHeaderCell width={widths.status} onResize={(w) => resize("status", w)}>
                Status
              </ResizableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row) => {
              const overridden = row.status === "overridden";
              return (
                <TableRow key={row.configurationId} sx={overridden ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}>
                  <TableCell sx={{ verticalAlign: "top", fontFamily: "monospace", fontSize: "0.75rem" }}>
                    {row.configurationId}
                  </TableCell>
                  <TableCell
                    sx={{
                      verticalAlign: "top",
                      fontSize: "0.8125rem",
                      whiteSpace: "normal !important",
                    }}
                  >
                    {row.page.label}
                  </TableCell>
                  <TableCell
                    sx={{
                      verticalAlign: "top",
                      whiteSpace: "normal !important",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
                      {row.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ fontFamily: "monospace", display: "block", mt: 0.25 }}
                    >
                      {row.key}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      verticalAlign: "top",
                      whiteSpace: "normal !important",
                      color: "text.secondary",
                    }}
                  >
                    <TruncatedString value={row.global.description} threshold={180} />
                  </TableCell>
                  <TableCell
                    sx={{
                      verticalAlign: "top",
                      whiteSpace: "normal !important",
                    }}
                  >
                    <TruncatedString
                      value={row.global.defaultDisplay}
                      threshold={150}
                    />
                  </TableCell>
                  <TableCell sx={{ verticalAlign: "top" }}>
                    <Chip
                      label={getConfigurationRequirement({ name: row.key })}
                      size="small"
                      color={getConfigurationRequirement({ name: row.key }) === "Required" ? "warning" : "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      verticalAlign: "top",
                      whiteSpace: "normal !important",
                      fontWeight: overridden ? 700 : 400,
                      color: overridden ? "text.primary" : "text.secondary",
                    }}
                  >
                    <TruncatedString value={formatConfigValue(row.effective)} threshold={150} />
                  </TableCell>
                  <TableCell
                    sx={{
                      verticalAlign: "top",
                    }}
                  >
                    <Chip
                      label={overridden ? "Overridden" : "Inherited"}
                      size="small"
                      variant={overridden ? "filled" : "outlined"}
                      sx={
                        overridden
                          ? {
                              bgcolor: CLIENT_HIGHLIGHT_BG,
                              borderColor: CLIENT_HIGHLIGHT_BORDER,
                              color: "#5c4a00",
                              border: "1px solid",
                              fontWeight: 600,
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ResponsiveTableContainer>
      {filteredRows.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No configuration settings match “{filter}”.
        </Typography>
      )}
    </Stack>
  );
}

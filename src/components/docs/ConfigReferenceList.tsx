import { useMemo, useState } from "react";
import { Box, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import ResponsiveTableContainer from "./ResponsiveTableContainer";
import ResizableHeaderCell from "./ResizableHeaderCell";
import SearchField from "./SearchField";
import useResizableColumns from "./useResizableColumns";

import TruncatedString from "./TruncatedString";
import {
  getConfigurationDefaultDisplay,
  getConfigurationPage,
  type ConfigRow,
} from "../../content/docs/configurations";
import { getSiteDetailsPageOrder } from "../../config/resolvers";

/**
 * Renders configuration rows as a flat, searchable, resizable-column table.
 * Rows are assigned to a page (or Global) and follow the canonical Site
 * Details page order. Repeated page values remain visible so filtering never
 * leaves a row dependent on a preceding visual group.
 */
export default function ConfigReferenceList({
  rows: allRows,
  groups,
  compact = false,
  showDefaults = false,
}: {
  rows: ConfigRow[];
  groups?: string[];
  /** Render only Area / Configuration / Description columns (drops Source, Scope, and Used-in, and the code-style name line). */
  compact?: boolean;
  /** Add a user-facing template default column to the compact reference. */
  showDefaults?: boolean;
}) {
  const [filter, setFilter] = useState("");
  const { widths, resize } = useResizableColumns({
    page: 160,
    configuration: 200,
    description: 300,
    defaultValue: 220,
    source: 200,
    scope: 150,
    usedIn: 160,
  });

  const filteredRows = groups ? allRows.filter((c) => groups.includes(c.group)) : allRows;

  const pageOrder = getSiteDetailsPageOrder();
  const orderedRows = filteredRows
    .map((row, originalIndex) => ({ row, originalIndex }))
    .sort((a, b) => {
      const pageA = getConfigurationPage(a.row).id;
      const pageB = getConfigurationPage(b.row).id;
      const rankA = pageA === "global" ? pageOrder.length : pageOrder.findIndex((id) => id === pageA);
      const rankB = pageB === "global" ? pageOrder.length : pageOrder.findIndex((id) => id === pageB);
      const normalizedRankA = rankA < 0 ? pageOrder.length - 1 : rankA;
      const normalizedRankB = rankB < 0 ? pageOrder.length - 1 : rankB;
      return normalizedRankA - normalizedRankB || a.originalIndex - b.originalIndex;
    })
    .map(({ row }) => row);

  const rows = useMemo(() => {
    if (!filter) return orderedRows;
    const lc = filter.toLowerCase();
    return orderedRows.filter((r) =>
      `${r.group} ${r.label} ${r.name} ${r.description} ${r.sourcePath} ${r.scope} ${r.usedIn}`
        .toLowerCase()
        .includes(lc),
    );
  }, [orderedRows, filter]);

  if (orderedRows.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      {!compact && (
        <Typography variant="body2" color="text.secondary">
          Scope is standardized to two values: <strong>Global</strong> for template-wide settings and{" "}
          <strong>Client Configurable</strong> for settings that may vary by client.
        </Typography>
      )}
      <SearchField value={filter} onChange={setFilter} placeholder="Filter configuration…" />
      <ResponsiveTableContainer>
        <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
          <colgroup>
            <col style={{ width: widths.page }} />
            <col style={{ width: widths.configuration }} />
            <col style={{ width: widths.description }} />
            {showDefaults && <col style={{ width: widths.defaultValue }} />}
            {!compact && (
              <>
                <col style={{ width: widths.source }} />
                <col style={{ width: widths.scope }} />
                <col style={{ width: widths.usedIn }} />
              </>
            )}
          </colgroup>
          <TableHead>
            <TableRow>
              <ResizableHeaderCell width={widths.page} onResize={(w) => resize("page", w)}>
                Page
              </ResizableHeaderCell>
              <ResizableHeaderCell
                width={widths.configuration}
                onResize={(w) => resize("configuration", w)}
              >
                Configuration
              </ResizableHeaderCell>
              <ResizableHeaderCell
                width={widths.description}
                onResize={(w) => resize("description", w)}
              >
                Description
              </ResizableHeaderCell>
              {showDefaults && (
                <ResizableHeaderCell
                  width={widths.defaultValue}
                  onResize={(w) => resize("defaultValue", w)}
                >
                  Default value
                </ResizableHeaderCell>
              )}
              {!compact && (
                <>
                  <ResizableHeaderCell width={widths.source} onResize={(w) => resize("source", w)}>
                    Source
                  </ResizableHeaderCell>
                  <ResizableHeaderCell
                    width={widths.scope}
                    onResize={(w) => resize("scope", w)}
                  >
                    Scope
                  </ResizableHeaderCell>
                  <ResizableHeaderCell width={widths.usedIn} onResize={(w) => resize("usedIn", w)}>
                    Used in
                  </ResizableHeaderCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((config) => {
              return (
                <TableRow
                  key={config.label + config.name}
                >
                  <TableCell
                    sx={{
                      verticalAlign: "top",
                      fontSize: "0.8125rem",
                      whiteSpace: "normal !important",
                    }}
                  >
                    <Chip label={getConfigurationPage(config).label} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell
                    sx={{
                      verticalAlign: "top",
                      whiteSpace: "normal !important",
                    }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
                        {config.label}
                      </Typography>
                      {config.sourcePath.startsWith("Planned") && (
                        <Chip label="Planned" size="small" variant="outlined" />
                      )}
                    </Stack>
                    {!compact && (
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{
                          fontFamily: "monospace",
                          display: "block",
                          mt: 0.25,
                          lineHeight: 1.4,
                          whiteSpace: "normal",
                        }}
                      >
                        {config.name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell
                    sx={{
                      whiteSpace: "normal !important",
                      verticalAlign: "top",
                    }}
                  >
                    <TruncatedString value={config.description} threshold={160} />
                  </TableCell>
                  {showDefaults && (
                    <TableCell
                      sx={{
                        whiteSpace: "normal !important",
                        verticalAlign: "top",
                      }}
                    >
                      <TruncatedString value={getConfigurationDefaultDisplay(config)} threshold={180} />
                    </TableCell>
                  )}
                  {!compact && (
                    <>
                      <TableCell
                        sx={{
                          verticalAlign: "top",
                          whiteSpace: "normal !important",
                        }}
                      >
                        <TruncatedString value={config.sourcePath} threshold={140} />
                      </TableCell>
                      <TableCell
                        sx={{
                          whiteSpace: "normal !important",
                          verticalAlign: "top",
                        }}
                      >
                        <Chip label={config.scope} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell
                        sx={{
                          whiteSpace: "normal !important",
                          verticalAlign: "top",
                        }}
                      >
                        <TruncatedString value={config.usedIn} threshold={140} />
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ResponsiveTableContainer>
      {rows.length === 0 && (
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No configuration options match “{filter}”.
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

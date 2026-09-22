import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ResponsiveTableContainer from "./ResponsiveTableContainer";
import ResizableHeaderCell from "./ResizableHeaderCell";
import SearchField from "./SearchField";
import useResizableColumns from "./useResizableColumns";
import { CLIENT_HIGHLIGHT_BG } from "./ClientNote";

export type RuleRow = {
  area: string;
  rule: string;
  behavior: string;
  ref: string;
};

/**
 * Renders the given rule rows, searchable and with resizable columns, as a
 * group of area-grouped accordions, or (with `flat`) as a single table with
 * an Area column shown once per group change. The caller owns the
 * section's title/count header (e.g. via SubsectionHeader) — this component
 * renders table content only.
 *
 * If `areas` is omitted, every area present in `rows` is shown (grouped);
 * otherwise only rows whose `area` is included in `areas` are shown.
 */
export default function RuleReferenceList({
  rows: allRows,
  areas,
  flat = false,
  highlightAll = false,
}: {
  rows: RuleRow[];
  areas?: string[];
  /** Render as a single flat table (Area column shown once per group) instead of area-grouped accordions. */
  flat?: boolean;
  /** Highlight every row, used when the entire table represents non-default client rules. */
  highlightAll?: boolean;
}) {
  const [filter, setFilter] = useState("");
  const { widths, resize } = useResizableColumns({
    area: 160,
    rule: 180,
    behavior: 300,
    ref: 220,
  });

  const areaRows = areas ? allRows.filter((r) => areas.includes(r.area)) : allRows;
  const rows = useMemo(() => {
    if (!filter) return areaRows;
    const lc = filter.toLowerCase();
    return areaRows.filter((r) =>
      `${r.area} ${r.rule} ${r.behavior} ${r.ref}`.toLowerCase().includes(lc),
    );
  }, [areaRows, filter]);

  if (areaRows.length === 0) return null;

  if (flat) {
    return (
      <Stack spacing={1.5}>
        <SearchField value={filter} onChange={setFilter} placeholder="Filter rules…" />
        <ResponsiveTableContainer>
          <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
            <colgroup>
              <col style={{ width: widths.area }} />
              <col style={{ width: widths.rule }} />
              <col style={{ width: widths.behavior }} />
              <col style={{ width: widths.ref }} />
            </colgroup>
            <TableHead>
              <TableRow>
                <ResizableHeaderCell width={widths.area} onResize={(w) => resize("area", w)}>
                  Area
                </ResizableHeaderCell>
                <ResizableHeaderCell width={widths.rule} onResize={(w) => resize("rule", w)}>
                  Rule
                </ResizableHeaderCell>
                <ResizableHeaderCell width={widths.behavior} onResize={(w) => resize("behavior", w)}>
                  Behavior
                </ResizableHeaderCell>
                <ResizableHeaderCell width={widths.ref} onResize={(w) => resize("ref", w)}>
                  Implementation Reference
                </ResizableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => {
                const showArea = i === 0 || rows[i - 1].area !== row.area;
                return (
                  <TableRow key={i} sx={highlightAll ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}>
                    <TableCell
                      sx={{
                        verticalAlign: "top",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        color: showArea ? "text.primary" : "transparent",
                        whiteSpace: "normal !important",
                        borderTop: showArea && i !== 0 ? "2px solid" : undefined,
                        borderTopColor: showArea && i !== 0 ? "divider" : undefined,
                      }}
                    >
                      {row.area}
                    </TableCell>
                    <TableCell
                      sx={{
                        verticalAlign: "top",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        whiteSpace: "normal !important",
                        borderTop: showArea && i !== 0 ? "2px solid" : undefined,
                        borderTopColor: showArea && i !== 0 ? "divider" : undefined,
                      }}
                    >
                      {row.rule}
                    </TableCell>
                    <TableCell
                      sx={{
                        verticalAlign: "top",
                        fontSize: "0.8125rem",
                        whiteSpace: "normal !important",
                        borderTop: showArea && i !== 0 ? "2px solid" : undefined,
                        borderTopColor: showArea && i !== 0 ? "divider" : undefined,
                      }}
                    >
                      {row.behavior}
                    </TableCell>
                    <TableCell
                      sx={{
                        verticalAlign: "top",
                        borderTop: showArea && i !== 0 ? "2px solid" : undefined,
                        borderTopColor: showArea && i !== 0 ? "divider" : undefined,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap", display: "block" }}
                      >
                        {row.ref}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ResponsiveTableContainer>
        {rows.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No rules match “{filter}”.
          </Typography>
        )}
      </Stack>
    );
  }

  const groupOrder: string[] = [];
  const grouped: Record<string, RuleRow[]> = {};
  for (const r of rows) {
    if (!grouped[r.area]) {
      groupOrder.push(r.area);
      grouped[r.area] = [];
    }
    grouped[r.area].push(r);
  }

  return (
    <Stack spacing={1.5}>
      <SearchField value={filter} onChange={setFilter} placeholder="Filter rules…" />
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No rules match “{filter}”.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {groupOrder.map((area) => (
            <Accordion
              key={area}
              disableGutters
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "12px !important",
                overflow: "hidden",
                boxShadow: "none",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreRoundedIcon />}
                sx={{
                  px: 2,
                  py: 0.75,
                  minHeight: 44,
                  backgroundColor: "background.subtle",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {area}
                  </Typography>
                  <Chip label={grouped[area].length} size="small" sx={{ height: 18, fontSize: "0.7rem" }} />
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <ResponsiveTableContainer>
                  <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
                    <colgroup>
                      <col style={{ width: widths.rule }} />
                      <col style={{ width: widths.behavior }} />
                      <col style={{ width: widths.ref }} />
                    </colgroup>
                    <TableHead>
                      <TableRow>
                        <ResizableHeaderCell width={widths.rule} onResize={(w) => resize("rule", w)}>
                          Rule
                        </ResizableHeaderCell>
                        <ResizableHeaderCell
                          width={widths.behavior}
                          onResize={(w) => resize("behavior", w)}
                        >
                          Behavior
                        </ResizableHeaderCell>
                        <ResizableHeaderCell width={widths.ref} onResize={(w) => resize("ref", w)}>
                          Implementation Reference
                        </ResizableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {grouped[area].map((row, i) => (
                        <TableRow key={i}>
                          <TableCell
                            sx={{ verticalAlign: "top", fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "normal !important" }}
                          >
                            {row.rule}
                          </TableCell>
                          <TableCell
                            sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "normal !important" }}
                          >
                            {row.behavior}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: "top" }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap", display: "block" }}
                            >
                              {row.ref}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

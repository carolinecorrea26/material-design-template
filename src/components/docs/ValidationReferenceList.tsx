import { useMemo, useState } from "react";
import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { errorMessages, errorMessagePageOrder } from "../../content/docs/errorMessages";
import SearchField from "./SearchField";
import PageFilterSelect, { ALL_PAGES } from "./PageFilterSelect";
import ResponsiveTableContainer from "./ResponsiveTableContainer";
import ResizableHeaderCell from "./ResizableHeaderCell";
import SubsectionHeader from "./SubsectionHeader";
import TruncatedString from "./TruncatedString";
import useResizableColumns from "./useResizableColumns";
import { getSiteDetailsPageOrder } from "../../config/resolvers";

export default function ValidationReferenceList({
  includedPageIds,
}: {
  includedPageIds?: ReadonlySet<string>;
}) {
  const [filter, setFilter] = useState("");
  const [pageFilter, setPageFilter] = useState(ALL_PAGES);
  const { widths, resize } = useResizableColumns({ page: 140, trigger: 300, message: 240 });

  const { pageLabel, pageRows, fieldRows } = useMemo(() => {
    const canonicalOrder = getSiteDetailsPageOrder();
    const order = Object.fromEntries(
      errorMessagePageOrder.map((page) => [
        page.key,
        page.key === "global" ? canonicalOrder.length : canonicalOrder.indexOf(page.key),
      ]),
    );
    const labels = Object.fromEntries(errorMessagePageOrder.map((page) => [page.key, page.label]));
    const rowsFor = (level: "Page" | "Field") =>
      errorMessages
        .map((row, originalIndex) => ({ ...row, originalIndex }))
        .filter(
          (row) =>
            row.level === level && (!includedPageIds || includedPageIds.has(row.page)),
        )
        .sort(
          (a, b) =>
            (order[a.page] ?? Number.MAX_SAFE_INTEGER) -
              (order[b.page] ?? Number.MAX_SAFE_INTEGER) ||
            a.originalIndex - b.originalIndex,
        );
    return { pageLabel: labels, pageRows: rowsFor("Page"), fieldRows: rowsFor("Field") };
  }, [includedPageIds]);

  const pageOptions = useMemo(() => {
    const availablePages = new Set([...pageRows, ...fieldRows].map((row) => row.page));
    return errorMessagePageOrder
      .filter((page) => availablePages.has(page.key))
      .sort((a, b) => {
        const order = getSiteDetailsPageOrder();
        const rank = (key: string) =>
          key === "global" ? order.length : order.findIndex((pageId) => pageId === key);
        return rank(a.key) - rank(b.key);
      })
      .map((page) => ({ value: page.key, label: page.label }));
  }, [fieldRows, pageRows]);

  const filterRows = (rows: typeof pageRows) => {
    if (!filter) return rows;
    const query = filter.toLowerCase();
    return rows.filter(
      (row) =>
        (pageFilter === ALL_PAGES || row.page === pageFilter) &&
        (!query ||
          `${pageLabel[row.page]} ${row.trigger} ${row.message}`
            .toLowerCase()
            .includes(query)),
    );
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <SearchField
          value={filter}
          onChange={setFilter}
          placeholder="Search validation messages…"
        />
        <PageFilterSelect value={pageFilter} onChange={setPageFilter} options={pageOptions} />
      </Stack>
      <Stack spacing={3}>
        {[
          { title: "Page-level errors", rows: filterRows(pageRows) },
          { title: "Field-level errors", rows: filterRows(fieldRows) },
        ].map(({ title, rows }) => (
          <Box key={title}>
            <SubsectionHeader title={title} variant="subtitle1" count={rows.length} />
            <ResponsiveTableContainer>
              <Table size="small" sx={{ tableLayout: "fixed", width: "max-content" }}>
                <colgroup>
                  <col style={{ width: widths.page }} />
                  <col style={{ width: widths.trigger }} />
                  <col style={{ width: widths.message }} />
                </colgroup>
                <TableHead>
                  <TableRow>
                    <ResizableHeaderCell width={widths.page} onResize={(w) => resize("page", w)}>
                      Page
                    </ResizableHeaderCell>
                    <ResizableHeaderCell width={widths.trigger} onResize={(w) => resize("trigger", w)}>
                      Trigger
                    </ResizableHeaderCell>
                    <ResizableHeaderCell width={widths.message} onResize={(w) => resize("message", w)}>
                      Message
                    </ResizableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.level}-${row.page}-${row.originalIndex}`}>
                      <TableCell sx={{ verticalAlign: "top", fontWeight: 700, fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                        {pageLabel[row.page]}
                      </TableCell>
                      <TableCell sx={{ verticalAlign: "top", fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                        <TruncatedString value={row.trigger} threshold={160} />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: "top", fontWeight: 600, fontSize: "0.8125rem", whiteSpace: "normal !important" }}>
                        <TruncatedString value={row.message} threshold={160} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTableContainer>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

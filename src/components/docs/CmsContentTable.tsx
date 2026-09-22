import { useMemo, useState } from "react";
import {
  Chip,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { CmsEntry } from "../../content/docs/cmsEntries";
import { getStorybookStoryUrl } from "../../config/storybook";
import ResponsiveTableContainer from "./ResponsiveTableContainer";
import SearchField from "./SearchField";
import TruncatedString from "./TruncatedString";
import { CLIENT_HIGHLIGHT_BG } from "./ClientNote";

export type CmsTableRow = {
  entry: CmsEntry;
  value: string;
  overridden: boolean;
};

const ALL = "All";

export default function CmsContentTable({ rows }: { rows: CmsTableRow[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [pageFilter, setPageFilter] = useState<string>(ALL);
  const [componentTypeFilter, setComponentTypeFilter] = useState<string>(ALL);
  const [componentFilter, setComponentFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);

  const typeOptions = useMemo(
    () => [ALL, ...Array.from(new Set(rows.map((r) => r.entry.type))).sort()],
    [rows],
  );
  const pageOptions = useMemo(
    () => [ALL, ...Array.from(new Set(rows.map((r) => r.entry.page)))],
    [rows],
  );
  const componentOptions = useMemo(
    () => [ALL, ...Array.from(new Set(rows.map((r) => r.entry.component))).sort()],
    [rows],
  );
  const componentTypeOptions = useMemo(
    () => [ALL, ...Array.from(new Set(rows.map((r) => r.entry.componentType)))],
    [rows],
  );
  const statusOptions = useMemo(
    () => [ALL, ...Array.from(new Set(rows.map((r) => r.entry.status))).sort()],
    [rows],
  );

  const filteredRows = useMemo(() => {
    const lc = search.trim().toLowerCase();
    return rows.filter(({ entry, value }) => {
      if (typeFilter !== ALL && entry.type !== typeFilter) return false;
      if (pageFilter !== ALL && entry.page !== pageFilter) return false;
      if (componentTypeFilter !== ALL && entry.componentType !== componentTypeFilter) return false;
      if (componentFilter !== ALL && entry.component !== componentFilter) return false;
      if (statusFilter !== ALL && entry.status !== statusFilter) return false;
      if (
        lc &&
        !`${value} ${entry.page} ${entry.componentType} ${entry.component}`.toLowerCase().includes(lc)
      ) return false;
      return true;
    });
  }, [
    rows,
    search,
    typeFilter,
    pageFilter,
    componentTypeFilter,
    componentFilter,
    statusFilter,
  ]);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexWrap: "wrap" }}>
        <SearchField value={search} onChange={setSearch} placeholder="Search content…" />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {typeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Page</InputLabel>
          <Select
            label="Page"
            value={pageFilter}
            onChange={(e) => setPageFilter(e.target.value)}
          >
            {pageOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Component Type</InputLabel>
          <Select
            label="Component Type"
            value={componentTypeFilter}
            onChange={(e) => setComponentTypeFilter(e.target.value)}
          >
            {componentTypeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Component</InputLabel>
          <Select
            label="Component"
            value={componentFilter}
            onChange={(e) => setComponentFilter(e.target.value)}
          >
            {componentOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <ResponsiveTableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 340, fontWeight: 600 }}>Content</TableCell>
              <TableCell sx={{ minWidth: 90, fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ minWidth: 150, fontWeight: 600 }}>Page</TableCell>
              <TableCell sx={{ minWidth: 210, fontWeight: 600 }}>Component Type</TableCell>
              <TableCell sx={{ minWidth: 260, fontWeight: 600 }}>Component</TableCell>
              <TableCell sx={{ minWidth: 110, fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ minWidth: 120, fontWeight: 600 }}>Last Modified</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map(({ entry, value, overridden }) => (
              <TableRow key={entry.id} sx={overridden ? { bgcolor: CLIENT_HIGHLIGHT_BG } : undefined}>
                <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important" }}>
                  <TruncatedString value={value} />
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>
                  <Chip label={entry.type} size="small" />
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>
                  <Chip label={entry.page} size="small" variant="outlined" />
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>{entry.componentType}</TableCell>
                <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal !important" }}>
                  <Link
                    href={getStorybookStoryUrl(entry.storybookId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="none"
                    aria-label={`${entry.component} — open Storybook documentation`}
                  >
                  <Chip
                    label={entry.component}
                    size="small"
                    variant="outlined"
                    color="primary"
                    clickable
                    sx={{
                      height: "auto",
                      maxWidth: 320,
                      "& .MuiChip-label": {
                        display: "block",
                        py: 0.4,
                        whiteSpace: "normal",
                      },
                    }}
                  />
                  </Link>
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>
                  <Chip label={entry.status} size="small" color="success" variant="outlined" />
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>{entry.lastModified ?? "—"}</TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No content matches these filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ResponsiveTableContainer>

      <Typography variant="caption" color="text.secondary">
        Showing {filteredRows.length} of {rows.length} content items.
      </Typography>
    </Stack>
  );
}

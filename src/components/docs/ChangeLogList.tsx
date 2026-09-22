import { useState } from "react";
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { ChangeLogEntry } from "../../content/docs/changeLog";

function ChangeLogRow({ entry }: { entry: ChangeLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = `${entry.id}-details`;

  return (
    <>
      <TableRow hover sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell sx={{ width: 40, pr: 0 }}>
          <IconButton
            size="small"
            aria-label={expanded ? `Hide details for ${entry.id}` : `Show details for ${entry.id}`}
            aria-expanded={expanded}
            aria-controls={detailsId}
            onClick={() => setExpanded((v) => !v)}
          >
            <ExpandMoreRoundedIcon
              fontSize="small"
              sx={{
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "transform 0.15s ease-in-out",
              }}
            />
          </IconButton>
        </TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <Chip label={entry.id} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} />
        </TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <Typography variant="caption" color="text.secondary">
            {entry.date}
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: "nowrap" }}>
          <Chip label={entry.area} size="small" />
        </TableCell>
        <TableCell sx={{ whiteSpace: "normal", minWidth: 240 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {entry.summary}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} sx={{ p: 0, borderBottom: expanded ? undefined : "unset" }}>
          <Collapse in={expanded} id={detailsId}>
            <Box sx={{ p: 2, bgcolor: "background.subtle" }}>
              <Typography variant="body2" color="text.secondary">
                {entry.details}
              </Typography>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function ChangeLogList({ entries }: { entries: ChangeLogEntry[] }) {
  return (
    <TableContainer sx={{ maxHeight: 420 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 40 }} />
            <TableCell>ID</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Area</TableCell>
            <TableCell>Summary</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => (
            <ChangeLogRow key={entry.id} entry={entry} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

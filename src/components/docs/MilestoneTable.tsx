import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import MilestoneStatusChip from "./MilestoneStatusChip";
import type { ProjectMilestone } from "../../content/docs/portalProject";

export default function MilestoneTable({ milestones }: { milestones: ProjectMilestone[] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Milestone</TableCell>
          <TableCell>Target</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {milestones.map((milestone) => (
          <TableRow key={milestone.id}>
            <TableCell sx={{ verticalAlign: "top" }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {milestone.name}
              </Typography>
              {milestone.notes?.map((note, i) => (
                <Typography
                  key={i}
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.25 }}
                >
                  • {note}
                </Typography>
              ))}
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap", verticalAlign: "top" }}>
              {milestone.targetDate}
            </TableCell>
            <TableCell sx={{ verticalAlign: "top" }}>
              <MilestoneStatusChip status={milestone.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

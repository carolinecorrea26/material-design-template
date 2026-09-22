import { Alert, Box, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import ChangeLogList from "../components/docs/ChangeLogList";
import MilestoneTable from "../components/docs/MilestoneTable";
import ProjectDetailPage, { type RequirementsTab } from "../components/docs/ProjectDetailPage";
import { changeLog } from "../content/docs/changeLog";
import { templateChanges } from "../content/docs/templateChanges";
import {
  migrationCandidateCriteria,
  migrationCandidateSites,
  portalProjectSummaries,
  portalTemplateDependencies,
  portalTemplateTimeline,
} from "../content/docs/portalProject";

const project = portalProjectSummaries.find((p) => p.id === "portal-template-project")!;

const migrationScheduleMilestoneIds = [
  "migrate-client-site-uat",
  "verify-client-site-uat",
  "production-launch",
  "migrate-all-clients",
];

const migrationScheduleMilestones = portalTemplateTimeline.filter((m) =>
  migrationScheduleMilestoneIds.includes(m.id),
);

const requirementsTabs: RequirementsTab[] = [
  {
    id: "change-log",
    label: "Change Log",
    content: <ChangeLogList entries={changeLog} />,
  },
  {
    id: "template-changes",
    label: "Template Changes",
    content: (
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Area</TableCell>
            <TableCell>Current template</TableCell>
            <TableCell>New template</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {templateChanges.map((row) => (
            <TableRow key={row.area}>
              <TableCell sx={{ fontWeight: 700, verticalAlign: "top" }}>{row.area}</TableCell>
              <TableCell sx={{ whiteSpace: "normal", verticalAlign: "top" }}>{row.current}</TableCell>
              <TableCell sx={{ whiteSpace: "normal", verticalAlign: "top" }}>{row.next}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ),
  },
  {
    id: "migration-schedule",
    label: "Migration Schedule",
    content: (
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Migration candidate criteria
          </Typography>
          <Stack spacing={0.5}>
            {migrationCandidateCriteria.map((c, i) => (
              <Typography key={i} variant="body2" color="text.secondary">
                • {c}
              </Typography>
            ))}
          </Stack>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Possible candidates: {migrationCandidateSites.join(", ")}
          </Typography>
        </Box>
        <Divider />
        <MilestoneTable milestones={migrationScheduleMilestones} />
      </Stack>
    ),
  },
  {
    id: "feedback",
    label: "Feedback",
    content: (
      <Alert severity="info">
        No structured project feedback is recorded in this repository yet.
      </Alert>
    ),
  },
  {
    id: "future-initiatives",
    label: "Future Initiatives",
    content: (
      <Stack spacing={2}>
        <MilestoneTable milestones={portalTemplateDependencies} />
        <Typography variant="caption" color="text.secondary">
          Also see the "Migration of all client sites" milestone under Timeline / Milestones —
          full rollout to all client sites is planned future work once the base template and
          first client migration are verified.
        </Typography>
      </Stack>
    ),
  },
];

const timelineContent = (
  <Stack spacing={2}>
    <MilestoneTable milestones={portalTemplateTimeline} />
    <Divider />
    <Typography variant="subtitle2">Dependency projects</Typography>
    <MilestoneTable milestones={portalTemplateDependencies} />
  </Stack>
);

export default function PortalTemplateProject() {
  return (
    <ProjectDetailPage
      project={project}
      requirementsTabs={requirementsTabs}
      timelineContent={timelineContent}
    />
  );
}

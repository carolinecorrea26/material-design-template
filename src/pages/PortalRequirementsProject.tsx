import { Alert } from "@mui/material";
import ProjectDetailPage, { type RequirementsTab } from "../components/docs/ProjectDetailPage";
import { portalProjectSummaries } from "../content/docs/portalProject";

const project = portalProjectSummaries.find((p) => p.id === "portal-requirements-project")!;

const requirementsTabs: RequirementsTab[] = [
  {
    id: "resources",
    label: "Resources",
    content: (
      <Alert severity="info">
        No authoritative resources for the Portal Requirements Project exist in this repository
        yet. This structure is ready for future content.
      </Alert>
    ),
  },
];

const timelineContent = (
  <Alert severity="info">No milestones are tracked for this project yet.</Alert>
);

export default function PortalRequirementsProject() {
  return (
    <ProjectDetailPage
      project={project}
      requirementsTabs={requirementsTabs}
      timelineContent={timelineContent}
    />
  );
}

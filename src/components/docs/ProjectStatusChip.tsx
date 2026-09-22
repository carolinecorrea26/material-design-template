import { Chip } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PendingRoundedIcon from "@mui/icons-material/PendingRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import PauseCircleOutlineRoundedIcon from "@mui/icons-material/PauseCircleOutlineRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import type { ProjectStatus } from "../../content/docs/portalProject";

const projectStatusDisplay: Record<
  ProjectStatus,
  {
    label: string;
    color: "success" | "warning" | "error" | "default";
    Icon: typeof CheckCircleRoundedIcon;
  }
> = {
  "not-started": { label: "Not started", color: "default", Icon: RadioButtonUncheckedRoundedIcon },
  "in-progress": { label: "In progress", color: "warning", Icon: PendingRoundedIcon },
  "on-hold": { label: "On hold", color: "default", Icon: PauseCircleOutlineRoundedIcon },
  completed: { label: "Completed", color: "success", Icon: CheckCircleRoundedIcon },
  cancelled: { label: "Cancelled", color: "error", Icon: CancelRoundedIcon },
  delayed: { label: "Delayed", color: "error", Icon: ReportProblemRoundedIcon },
};

export default function ProjectStatusChip({ status }: { status: ProjectStatus }) {
  const { label, color, Icon } = projectStatusDisplay[status];
  return (
    <Chip icon={<Icon fontSize="small" />} label={label} color={color} size="small" variant="outlined" />
  );
}

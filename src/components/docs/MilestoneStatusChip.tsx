import { Chip } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PendingRoundedIcon from "@mui/icons-material/PendingRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import type { MilestoneStatus } from "../../content/docs/portalProject";

const milestoneStatusDisplay: Record<
  MilestoneStatus,
  { label: string; color: "success" | "warning" | "default"; Icon: typeof CheckCircleRoundedIcon }
> = {
  complete: { label: "Complete", color: "success", Icon: CheckCircleRoundedIcon },
  "in-progress": { label: "In progress", color: "warning", Icon: PendingRoundedIcon },
  planned: { label: "Planned", color: "default", Icon: ScheduleRoundedIcon },
};

export default function MilestoneStatusChip({ status }: { status: MilestoneStatus }) {
  const { label, color, Icon } = milestoneStatusDisplay[status];
  return (
    <Chip icon={<Icon fontSize="small" />} label={label} color={color} size="small" variant="outlined" />
  );
}

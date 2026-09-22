import CloudRoundedIcon from "@mui/icons-material/CloudRounded";
import FlowNodeShell from "./FlowNodeShell";
import type { FlowNodeComponentProps } from "./types";

export default function ExternalFlowNode({ data }: FlowNodeComponentProps) {
  return (
    <FlowNodeShell
      label={data.label}
      description={data.description}
      icon={<CloudRoundedIcon fontSize="small" />}
      accentColor="text.secondary"
      dashed
    />
  );
}

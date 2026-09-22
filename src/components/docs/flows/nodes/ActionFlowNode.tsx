import TouchAppRoundedIcon from "@mui/icons-material/TouchAppRounded";
import FlowNodeShell from "./FlowNodeShell";
import type { FlowNodeComponentProps } from "./types";

export default function ActionFlowNode({ data }: FlowNodeComponentProps) {
  return (
    <FlowNodeShell
      label={data.label}
      description={data.description}
      icon={<TouchAppRoundedIcon fontSize="small" />}
      accentColor="info.main"
    />
  );
}

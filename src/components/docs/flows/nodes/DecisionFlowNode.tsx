import CallSplitRoundedIcon from "@mui/icons-material/CallSplitRounded";
import FlowNodeShell from "./FlowNodeShell";
import type { FlowNodeComponentProps } from "./types";

export default function DecisionFlowNode({ data }: FlowNodeComponentProps) {
  return (
    <FlowNodeShell
      label={data.label}
      description={data.description}
      icon={<CallSplitRoundedIcon fontSize="small" />}
      accentColor="warning.main"
    />
  );
}

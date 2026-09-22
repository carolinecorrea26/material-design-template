import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import FlowNodeShell from "./FlowNodeShell";
import type { FlowNodeComponentProps } from "./types";

export default function SummaryFlowNode({ data }: FlowNodeComponentProps) {
  return (
    <FlowNodeShell
      label={data.label}
      description={data.description}
      icon={<LayersRoundedIcon fontSize="small" />}
      accentColor="grey.600"
      dashed
    />
  );
}

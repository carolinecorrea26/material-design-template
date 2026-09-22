import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import FlowNodeShell from "./FlowNodeShell";
import type { FlowNodeComponentProps } from "./types";

export default function StartEndFlowNode({ data }: FlowNodeComponentProps) {
  const isStart = data.kind === "start";

  return (
    <FlowNodeShell
      label={data.label}
      description={data.description}
      icon={
        isStart ? (
          <PlayArrowRoundedIcon fontSize="small" />
        ) : (
          <FlagRoundedIcon fontSize="small" />
        )
      }
      accentColor={isStart ? "success.main" : "secondary.main"}
    />
  );
}

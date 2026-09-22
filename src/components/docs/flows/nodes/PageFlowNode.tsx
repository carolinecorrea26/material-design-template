import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FlowNodeShell from "./FlowNodeShell";
import { navigateToPageAnchor } from "./navigateToPageAnchor";
import type { FlowNodeComponentProps } from "./types";

export default function PageFlowNode({ data }: FlowNodeComponentProps) {
  const { label, description, pageId } = data;

  return (
    <FlowNodeShell
      label={label}
      description={description}
      icon={<DescriptionRoundedIcon fontSize="small" />}
      accentColor="primary.main"
      href={pageId ? `#page-${pageId}` : undefined}
      onNavigate={pageId ? () => navigateToPageAnchor(pageId) : undefined}
    />
  );
}

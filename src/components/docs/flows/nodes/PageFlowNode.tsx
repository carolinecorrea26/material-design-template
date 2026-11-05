import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FlowNodeShell from "./FlowNodeShell";
import { navigateToPageAnchor } from "./navigateToPageAnchor";
import type { FlowNodeComponentProps } from "./types";
import { useLocation, useNavigate } from "react-router-dom";
import { libraryHref } from "../../../../pages/admin/library/LibraryLink";

export default function PageFlowNode({ data }: FlowNodeComponentProps) {
  const { label, description, pageId } = data;
  const location = useLocation();
  const navigate = useNavigate();
  const pageHref = pageId && location.pathname.startsWith("/admin-center/library")
    ? libraryHref("pages", new URLSearchParams(location.search), { q: pageId }) : undefined;

  return (
    <FlowNodeShell
      layoutHeight={data.layoutHeight as number | undefined}
      label={label}
      description={description}
      icon={<DescriptionRoundedIcon fontSize="small" />}
      accentColor="primary.main"
      href={pageHref ?? (pageId ? `#page-${pageId}` : undefined)}
      onNavigate={pageHref ? () => navigate(pageHref) : pageId ? () => navigateToPageAnchor(pageId) : undefined}
    />
  );
}

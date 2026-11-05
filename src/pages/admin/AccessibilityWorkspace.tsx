import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import LibrarySiteSelector, { useLibrarySelection } from "./library/LibrarySiteSelector";
import AccessibilityLibrary from "./library/AccessibilityLibrary";

export default function AccessibilityWorkspace() {
  const [selection, setSelection] = useLibrarySelection();
  return <Workspace>
    <WorkspaceHeader title="Accessibility" description="Siteimprove tracking setup and prototype accessibility concerns." actions={<Button component={RouterLink} to={`/admin-center/library/accessibility?${new URLSearchParams({ site: selection })}`} variant="outlined">Open Library accessibility</Button>} />
    <LibrarySiteSelector siteId={selection} onChange={setSelection} />
    <AccessibilityLibrary siteKey={selection} />
  </Workspace>;
}

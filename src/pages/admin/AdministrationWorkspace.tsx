import { Alert, Paper, Stack, Typography } from "@mui/material";
import { permissions } from "../../admin/access";
import { Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";

const sections = ["Internal Users", "Roles", "Permissions", "Access Scope", "Integrations", "System Settings"];

export default function AdministrationWorkspace() {
  return <Workspace><WorkspaceHeader title="Administration" description="Internal platform administration boundary." /><Alert severity="info">External TPA user administration is intentionally a distinct future concept and is not mixed into this internal UI.</Alert><Stack sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 1.5 }}>{sections.map((section) => <Paper key={section} variant="outlined" sx={{ p: 2 }}><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{section}</Typography><Typography variant="caption" color="text.secondary">{section === "Permissions" ? `${permissions.length} prototype permission keys centralized` : "Future administration workspace"}</Typography></Paper>)}</Stack></Workspace>;
}

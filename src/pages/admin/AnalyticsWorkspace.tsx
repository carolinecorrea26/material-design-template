import { List, ListItem, ListItemText } from "@mui/material";
import { PlaceholderPanel, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";

export default function AnalyticsWorkspace() {
  return <Workspace><WorkspaceHeader title="Analytics" description="Structured boundary for future operational reporting backed by real data sources." /><PlaceholderPanel><List dense>{["Application metrics", "Site metrics", "Change metrics", "Release metrics", "Client reporting", "Operational trends"].map((item) => <ListItem key={item}><ListItemText primary={item} secondary="Data source and reporting definition required" /></ListItem>)}</List></PlaceholderPanel></Workspace>;
}

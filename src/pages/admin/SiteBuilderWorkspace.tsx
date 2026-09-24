import { Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { siteBuilderDrafts } from "../../admin/domain";
import { Section, Workspace, WorkspaceHeader } from "../../components/admin/AdminPrimitives";
import ResponsiveTableContainer from "../../components/docs/ResponsiveTableContainer";

const steps = ["Organization", "Site Information", "Eligibility", "Coverage", "Products", "Riders", "Configuration", "Rules", "Content", "Emails", "Branding", "Documents", "Review"];

export default function SiteBuilderWorkspace() {
  return <Workspace><WorkspaceHeader title="Site Builder" description="Draft queue for future site provisioning using the canonical Site and client configuration model." />
    <ResponsiveTableContainer><Table size="small"><TableHead><TableRow><TableCell>Draft</TableCell><TableCell>Client</TableCell><TableCell>Proposed site</TableCell><TableCell>Owner</TableCell><TableCell>Progress</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{siteBuilderDrafts.map((draft) => <TableRow key={draft.id}><TableCell>{draft.id}</TableCell><TableCell>{draft.client}</TableCell><TableCell>{draft.proposedSite}</TableCell><TableCell>{draft.owner}</TableCell><TableCell>{draft.progress}</TableCell><TableCell><Chip size="small" label={draft.status} variant="outlined" /></TableCell></TableRow>)}</TableBody></Table></ResponsiveTableContainer>
    <Section title="Future builder flow" description="Each stage will write to the same canonical portal model consumed by Site Details."><Paper variant="outlined" sx={{ p: 2 }}><Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">{steps.map((step, index) => <Stack key={step} direction="row" alignItems="center" gap={1}><Chip label={`${index + 1}. ${step}`} size="small" />{index < steps.length - 1 && <Typography color="text.secondary">→</Typography>}</Stack>)}</Stack></Paper></Section>
  </Workspace>;
}

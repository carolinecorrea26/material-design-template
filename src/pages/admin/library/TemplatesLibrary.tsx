import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useLibraryCatalog } from "./LibraryCatalogContext";
import { getSitePrototypeUrl } from "../../../config/sitePrototype";
import { useLibrarySelection } from "./LibrarySiteSelector";

const templates = [
  { key: "multi", name: "Multi-page", description: "A guided application with a dedicated page for each stage and progress navigation between steps.", available: true },
  { key: "single", name: "Single-page", description: "One continuous application with sections that open as the applicant moves through the form.", available: true },
];

function TemplateSnapshot({ type, name }: { type: string; name: string }) {
  return <Box component="svg" viewBox="0 0 420 250" role="img" aria-label={`${name} layout preview`} sx={{ display: "block", width: "100%", bgcolor: "#eef2f6" }}>
    <rect x="18" y="14" width="384" height="222" rx="8" fill="white" />
    <rect x="18" y="14" width="384" height="32" rx="8" fill="#143c55" />
    <rect x="32" y="25" width="75" height="8" rx="3" fill="#fff" />
    {type === "multi" ? <>
      {[0, 1, 2, 3].map(i => <g key={i}><circle cx={70 + i * 92} cy="67" r="8" fill={i === 0 ? "#0b7d87" : "#dae4ec"} /><rect x={48 + i * 92} y="82" width="44" height="4" rx="2" fill="#aabcc8" /></g>)}
      <rect x="68" y="108" width="155" height="9" rx="3" fill="#143c55" />
      {[0, 1].map(i => <g key={i}><rect x="68" y={134 + i * 37} width="66" height="4" rx="2" fill="#94a9b8" /><rect x="68" y={145 + i * 37} width="282" height="22" rx="4" fill="#f2f5f8" stroke="#cfdae3" /></g>)}
      <rect x="276" y="210" width="74" height="14" rx="4" fill="#0b7d87" />
    </> : type === "single" ? <>
      <rect x="52" y="61" width="152" height="9" rx="3" fill="#143c55" />
      {[0, 1, 2].map(i => <g key={i}><rect x="52" y={[84, 166, 203][i]} width="316" height={i === 0 ? 74 : 25} rx="5" fill={i === 0 ? "#e5f3f3" : "#f2f5f8"} stroke="#cfdae3" /><rect x="66" y={[96, 178, 215][i]} width="126" height="5" rx="2" fill="#143c55" /></g>)}
      <rect x="66" y="114" width="288" height="18" rx="3" fill="white" /><rect x="278" y="139" width="76" height="10" rx="4" fill="#0b7d87" />
    </> : <><path d="M180 80h46l-24 38h31l-61 65 17-48h-28z" fill="#bdcbd5" /><text x="210" y="208" textAnchor="middle" fontSize="14" fill="#627988">Planned</text></>}
  </Box>;
}

export default function TemplatesLibrary() {
  const [selection] = useLibrarySelection();
  const catalog = useLibraryCatalog();
  const selectedTemplate = selection === "all" ? null : catalog.data.sites.find(site => site.key === selection)?.templateType;
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 3 }}>
    {templates.filter(template => selectedTemplate === null || template.key === selectedTemplate).map(template => <Card key={template.key} variant="outlined" sx={{ display: "flex", flexDirection: "column" }}>
      <TemplateSnapshot type={template.key} name={template.name} />
      <CardContent sx={{ display: "flex", flexDirection: "column", flex: 1, gap: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between"><Typography variant="h6" component="h3">{template.name}</Typography><Chip size="small" label={template.available ? selectedTemplate ? "Effective template" : "Available" : "Planned"} /></Stack>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{template.description}</Typography>
        {template.available && <Button variant="outlined" href={`${getSitePrototypeUrl(selection === "all" ? "demo" : selection)}&template=${template.key}`} target="_blank" rel="noopener noreferrer">Open template preview</Button>}
      </CardContent>
    </Card>)}
  </Box>;
}

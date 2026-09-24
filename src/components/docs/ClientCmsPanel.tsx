import { useCallback, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  clientEntities,
  getSiteIdForLegacyClient,
  getSitesForClient,
  type Client,
  type Site,
} from "../../data";
import { cmsEntries } from "../../content/docs/cmsEntries";
import CmsContentTable from "./CmsContentTable";
import { CLIENT_HIGHLIGHT_BG, CLIENT_HIGHLIGHT_BORDER } from "./ClientNote";

const DEFAULT_SITE_ID = getSiteIdForLegacyClient("demo");

export default function ClientCmsPanel() {
  const [selectedClient, setSelectedClient] = useState<Client>(() => clientEntities.find((client) => client.id === "demo")!);
  const [selectedSiteId, setSelectedSiteId] = useState(DEFAULT_SITE_ID);

  const handleClientChange = useCallback((nextClient: Client | null) => {
    if (!nextClient) return;
    setSelectedClient(nextClient);
    setSelectedSiteId(getSitesForClient(nextClient.id)[0].id);
  }, []);

  const handleSiteChange = useCallback((nextSite: Site | null) => {
    if (!nextSite) return;
    setSelectedSiteId(nextSite.id);
  }, []);

  const rows = useMemo(
    () =>
      cmsEntries.flatMap((entry) => {
        const value = entry.effectiveValue(selectedSiteId);
        return value === "—"
          ? []
          : [{ entry, value, overridden: entry.overridden(selectedSiteId) }];
      }),
    [selectedSiteId],
  );

  const overrideCount = rows.filter((r) => r.overridden).length;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Client Content
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 920 }}>
          The fully resolved content for one client's site — global defaults, with that client's
          overrides applied. Content that differs from the global default is highlighted{" "}
          <Box
            component="span"
            sx={{
              bgcolor: CLIENT_HIGHLIGHT_BG,
              border: "1px solid",
              borderColor: CLIENT_HIGHLIGHT_BORDER,
              borderRadius: 0.5,
              px: 0.5,
            }}
          >
            in yellow
          </Box>
          .
        </Typography>
      </Box>

      <Card
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "24px",
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
        }}
      >
        <CardContent>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
            Select a client
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Choose which client — and, for clients with more than one active site, which site —
            to view.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
            <Autocomplete
              options={clientEntities}
              value={selectedClient}
              onChange={(_, value) => handleClientChange(value)}
              disableClearable
              getOptionLabel={(option) => `${option.acronym} - ${option.name}`}
              getOptionKey={(option) => option.id}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              sx={{ flex: 1, maxWidth: 420 }}
              renderInput={(params) => (
                <TextField {...params} label="Client" placeholder="Search clients…" />
              )}
            />
            <Autocomplete
              options={getSitesForClient(selectedClient.id)}
              value={getSitesForClient(selectedClient.id).find((s) => s.id === selectedSiteId) ?? getSitesForClient(selectedClient.id)[0]}
              onChange={(_, value) => handleSiteChange(value)}
              disableClearable
              disabled={getSitesForClient(selectedClient.id).length <= 1}
              getOptionLabel={(option) => option.name}
              getOptionKey={(option) => option.id}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              sx={{ flex: 1, maxWidth: 320 }}
              renderInput={(params) => <TextField {...params} label="Site" />}
            />
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "24px",
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 3 },
            py: 1.5,
            backgroundColor: "background.subtle",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
              Content
            </Typography>
            <Chip label={rows.length} size="small" />
            {overrideCount > 0 && (
              <Chip
                label={`${overrideCount} client override${overrideCount === 1 ? "" : "s"}`}
                size="small"
                sx={{
                  bgcolor: CLIENT_HIGHLIGHT_BG,
                  borderColor: CLIENT_HIGHLIGHT_BORDER,
                  color: "#5c4a00",
                  border: "1px solid",
                  fontWeight: 600,
                }}
              />
            )}
          </Stack>
        </Box>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <CmsContentTable rows={rows} />
        </Box>
      </Box>
    </Stack>
  );
}

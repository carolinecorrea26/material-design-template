import { useCallback, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  clientEntities,
  getLegacyClientConfigForSite,
  getSiteIdForLegacyClient,
  getSitesForClient,
  type Client,
  type Site,
} from "../../data";
import EmailTemplatesTable from "./EmailTemplatesTable";
import { ClientEmailConfigurationTable } from "./EmailConfigurationTable";
import { emailTemplateRows } from "./emailTemplateRows";
import { CLIENT_HIGHLIGHT_BG, CLIENT_HIGHLIGHT_BORDER } from "./ClientNote";
import SectionTabs from "./SectionTabs";

const DEFAULT_SITE_ID = getSiteIdForLegacyClient("demo");

export default function ClientEmailTemplatesPanel() {
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

  const activeClient = getLegacyClientConfigForSite(selectedSiteId);
  const emailOverridden = Boolean(
    activeClient.emailSupport?.hideContactBox ||
      activeClient.emailSupport?.supportOverride ||
      activeClient.emailSupport?.contactOverride,
  );

  const highlightedIds = useMemo(
    () =>
      emailOverridden
        ? new Set(emailTemplateRows.filter((row) => row.usesSupportBox).map((row) => row.id))
        : new Set<string>(),
    [emailOverridden],
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Client Email Templates
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 920 }}>
          The resolved emails for one client — the global templates with that client's email
          configuration applied. Rows affected by a client override are highlighted{" "}
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

      <SectionTabs
        tabs={[
          { id: "client-email-templates-subsection", label: "Templates" },
          { id: "client-email-configuration-subsection", label: "Configuration Options" },
        ]}
        defaultTabId="client-email-templates-subsection"
      >
        <Box id="client-email-templates-subsection">
          <EmailTemplatesTable
            siteId={selectedSiteId}
            highlightedIds={highlightedIds}
            overrideNote={emailOverridden ? "Email configuration overridden" : undefined}
          />
        </Box>

        <Box id="client-email-configuration-subsection">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 920 }}>
            This client's effective email configuration. Values that differ from the global default
            or use a client override are highlighted in yellow.
          </Typography>
          <ClientEmailConfigurationTable siteId={selectedSiteId} />
        </Box>
      </SectionTabs>
    </Stack>
  );
}

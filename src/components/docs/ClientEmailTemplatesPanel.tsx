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
import type { ClientId } from "../../types";
import { clients } from "../../config/clients";
import { clientGroups, getClientGroupForSiteId, type ClientGroup } from "../../config/clients/clientGroups";
import EmailTemplatesTable from "./EmailTemplatesTable";
import { ClientEmailConfigurationTable } from "./EmailConfigurationTable";
import { emailTemplateRows } from "./emailTemplateRows";
import { CLIENT_HIGHLIGHT_BG, CLIENT_HIGHLIGHT_BORDER } from "./ClientNote";
import SectionTabs from "./SectionTabs";

const DEFAULT_CLIENT_ID: ClientId = "demo";

export default function ClientEmailTemplatesPanel() {
  const [selectedGroup, setSelectedGroup] = useState<ClientGroup>(() =>
    getClientGroupForSiteId(DEFAULT_CLIENT_ID),
  );
  const [selectedSiteId, setSelectedSiteId] = useState<ClientId>(DEFAULT_CLIENT_ID);

  const handleGroupChange = useCallback((nextGroup: ClientGroup | null) => {
    if (!nextGroup) return;
    setSelectedGroup(nextGroup);
    setSelectedSiteId(nextGroup.sites[0].id);
  }, []);

  const handleSiteChange = useCallback((nextSite: ClientId | null) => {
    if (!nextSite) return;
    setSelectedSiteId(nextSite);
  }, []);

  const activeClient = clients[selectedSiteId];
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
              options={clientGroups}
              value={selectedGroup}
              onChange={(_, value) => handleGroupChange(value)}
              disableClearable
              getOptionLabel={(option) => `${option.branding.acronym} - ${option.branding.name}`}
              getOptionKey={(option) => option.groupId}
              isOptionEqualToValue={(option, value) => option.groupId === value.groupId}
              sx={{ flex: 1, maxWidth: 420 }}
              renderInput={(params) => (
                <TextField {...params} label="Client" placeholder="Search clients…" />
              )}
            />
            <Autocomplete
              options={selectedGroup.sites}
              value={selectedGroup.sites.find((s) => s.id === selectedSiteId) ?? selectedGroup.sites[0]}
              onChange={(_, value) => handleSiteChange(value?.id ?? null)}
              disableClearable
              disabled={selectedGroup.sites.length <= 1}
              getOptionLabel={(option) => option.siteLabel ?? "Default"}
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
            clientId={selectedSiteId}
            highlightedIds={highlightedIds}
            overrideNote={emailOverridden ? "Email configuration overridden" : undefined}
          />
        </Box>

        <Box id="client-email-configuration-subsection">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 920 }}>
            This client's effective email configuration. Values that differ from the global default
            or use a client override are highlighted in yellow.
          </Typography>
          <ClientEmailConfigurationTable clientId={selectedSiteId} />
        </Box>
      </SectionTabs>
    </Stack>
  );
}

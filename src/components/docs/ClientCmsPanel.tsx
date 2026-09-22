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
import type { ClientId } from "../../types";
import { clientGroups, getClientGroupForSiteId, type ClientGroup } from "../../config/clients/clientGroups";
import { cmsEntries } from "../../content/docs/cmsEntries";
import CmsContentTable from "./CmsContentTable";
import { CLIENT_HIGHLIGHT_BG, CLIENT_HIGHLIGHT_BORDER } from "./ClientNote";

const DEFAULT_CLIENT_ID: ClientId = "demo";

export default function ClientCmsPanel() {
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

  const rows = useMemo(
    () =>
      cmsEntries.map((entry) => ({
        entry,
        value: entry.effectiveValue(selectedSiteId),
        overridden: entry.overridden(selectedSiteId),
      })),
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

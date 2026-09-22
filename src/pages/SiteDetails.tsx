import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import GlobalSiteDetailsPanel from "../components/docs/GlobalSiteDetailsPanel";
import ClientSiteDetailsPanel from "../components/docs/ClientSiteDetailsPanel";

const TAB_GLOBAL = 0;
const TAB_CLIENT = 1;

export default function SiteDetails() {
  const [tab, setTab] = useState(() =>
    new URLSearchParams(window.location.search).has("client") ? TAB_CLIENT : TAB_GLOBAL,
  );
  const pendingAnchorRef = useRef<string | null>(null);

  useEffect(() => {
    if (tab !== TAB_GLOBAL || !pendingAnchorRef.current) return;
    const anchorId = pendingAnchorRef.current;
    pendingAnchorRef.current = null;
    document.getElementById(anchorId)?.scrollIntoView({ block: "start" });
  }, [tab]);

  const navigateToGlobal = useCallback((anchorId?: string) => {
    pendingAnchorRef.current = anchorId ?? null;
    if (anchorId) {
      window.history.replaceState(null, "", `#${anchorId}`);
    }
    setTab(TAB_GLOBAL);
  }, []);

  const navigateToClient = useCallback(() => setTab(TAB_CLIENT), []);

  return (
    <Box
      sx={{
        py: { xs: 3, md: 5 },
        px: { xs: 2, md: 4 },
        width: "100vw",
        maxWidth: "100vw",
        ml: "calc(-50vw + 50%)",
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
            Site Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The global template — or, scoped to one client, that client's site configuration and
            how it differs from the global template.
          </Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Tab value={TAB_GLOBAL} label="Global Site Details" />
          <Tab value={TAB_CLIENT} label="Client Site Details" />
        </Tabs>

        {tab === TAB_GLOBAL ? (
          <GlobalSiteDetailsPanel onNavigateToClientTab={navigateToClient} />
        ) : (
          <ClientSiteDetailsPanel onNavigateToGlobal={navigateToGlobal} />
        )}
      </Stack>
    </Box>
  );
}

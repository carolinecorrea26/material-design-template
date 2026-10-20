import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import GlobalSiteDetailsPanel from "../../../components/docs/GlobalSiteDetailsPanel";
import ClientSiteDetailsPanel from "../../../components/docs/ClientSiteDetailsPanel";

const GLOBAL = "global";
const CLIENT = "client";

export default function SiteDetailsLibrary() {
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).has("site") ? CLIENT : GLOBAL);
  const pendingAnchorRef = useRef<string | null>(null);

  useEffect(() => {
    if (tab !== GLOBAL || !pendingAnchorRef.current) return;
    const anchorId = pendingAnchorRef.current;
    pendingAnchorRef.current = null;
    document.getElementById(anchorId)?.scrollIntoView({ block: "start" });
  }, [tab]);

  const navigateToGlobal = useCallback((anchorId?: string) => {
    pendingAnchorRef.current = anchorId ?? null;
    if (anchorId) window.history.replaceState(null, "", `#${anchorId}`);
    setTab(GLOBAL);
  }, []);

  return <Stack spacing={3}>
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 1000 }}>
        The complete Site Details reference is available here without leaving Admin Center. Use the
        focused Library domains when you need a cross-Site catalog; use this view for the original
        cohesive global-to-effective workflow and interactive previews.
      </Typography>
    </Box>
    <Tabs value={tab} onChange={(_, value: string) => setTab(value)} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tab value={GLOBAL} label="Global Site Details" />
      <Tab value={CLIENT} label="Client Site Details" />
    </Tabs>
    {tab === GLOBAL
      ? <GlobalSiteDetailsPanel onNavigateToClientTab={() => setTab(CLIENT)} />
      : <ClientSiteDetailsPanel onNavigateToGlobal={navigateToGlobal} />}
  </Stack>;
}

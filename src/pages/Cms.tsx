import { useState } from "react";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import GlobalCmsPanel from "../components/docs/GlobalCmsPanel";
import ClientCmsPanel from "../components/docs/ClientCmsPanel";

const TAB_GLOBAL = 0;
const TAB_CLIENT = 1;

export default function Cms() {
  const [tab, setTab] = useState(() =>
    new URLSearchParams(window.location.search).has("client") ? TAB_CLIENT : TAB_GLOBAL,
  );

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
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
            CMS
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 920 }}>
            Content management reference — the global template's managed content, or, scoped to
            one client, that client's resolved content and how it differs from the global
            template. Read-only in this prototype.
          </Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Tab value={TAB_GLOBAL} label="Global Content" />
          <Tab value={TAB_CLIENT} label="Client Content" />
        </Tabs>

        {tab === TAB_GLOBAL ? <GlobalCmsPanel /> : <ClientCmsPanel />}
      </Stack>
    </Box>
  );
}

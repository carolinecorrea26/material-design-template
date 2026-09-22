import { useState } from "react";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import GlobalEmailTemplatesPanel from "../components/docs/GlobalEmailTemplatesPanel";
import ClientEmailTemplatesPanel from "../components/docs/ClientEmailTemplatesPanel";

const TAB_GLOBAL = 0;
const TAB_CLIENT = 1;

export default function MockEmailPreview() {
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
            Email Templates
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 920 }}>
            Preview the mock emails used throughout the consumer, advisor, and resume flows — the
            global template, or, scoped to one client, that client's resolved support-contact
            configuration. Read-only in this prototype.
          </Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Tab value={TAB_GLOBAL} label="Global Email Templates" />
          <Tab value={TAB_CLIENT} label="Client Email Templates" />
        </Tabs>

        {tab === TAB_GLOBAL ? <GlobalEmailTemplatesPanel /> : <ClientEmailTemplatesPanel />}
      </Stack>
    </Box>
  );
}

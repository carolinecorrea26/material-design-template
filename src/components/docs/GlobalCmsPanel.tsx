import { useMemo } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { cmsEntries } from "../../content/docs/cmsEntries";
import CmsContentTable from "./CmsContentTable";

export default function GlobalCmsPanel() {
  const rows = useMemo(
    () => cmsEntries.map((entry) => ({ entry, value: entry.globalValue, overridden: false })),
    [],
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Global Content
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 920 }}>
          The template's baseline content — every piece of managed copy, imagery, and
          document/link content before any client-specific overrides are applied. For a given
          client's resolved content, see the <strong>Client Content</strong> tab.
        </Typography>
      </Box>

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
          </Stack>
        </Box>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <CmsContentTable rows={rows} />
        </Box>
      </Box>
    </Stack>
  );
}

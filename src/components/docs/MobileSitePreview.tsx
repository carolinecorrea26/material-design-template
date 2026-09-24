import { useMemo } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { getPagePath } from "../../config/pages";
import type { ClientId } from "../../types";

export function getClientPrototypeUrl(clientId: ClientId): string {
  const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  const homePath = getPagePath("home").replace(/^\/+/, "");
  const url = new URL(homePath, appBaseUrl);
  url.searchParams.set("client", clientId);
  return url.toString();
}

export default function MobileSitePreview({
  clientId,
  clientName,
}: {
  clientId: ClientId;
  clientName: string;
}) {
  const previewUrl = useMemo(() => getClientPrototypeUrl(clientId), [clientId]);

  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: 420,
        flexShrink: 0,
        borderRadius: 3,
        bgcolor: "background.paper",
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
          Site Preview
        </Typography>
        <Box
          sx={{
            width: "100%",
            maxWidth: 390,
            mx: "auto",
            p: { xs: 0.75, sm: 1 },
            boxSizing: "border-box",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
            bgcolor: "grey.200",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
          }}
        >
          <Box
            key={previewUrl}
            component="iframe"
            src={previewUrl}
            title={`${clientName} interactive mobile site preview`}
            sx={{
              display: "block",
              width: "100%",
              height: { xs: 600, sm: 720 },
              border: 0,
              borderRadius: 3,
              bgcolor: "background.paper",
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

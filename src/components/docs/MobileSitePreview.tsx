import { useMemo } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { getPagePath } from "../../config/pages";
import type { SiteId } from "../../data";
import MobilePreviewFrame from "../ui/MobilePreviewFrame";

export function getSitePrototypeUrl(siteId: SiteId): string {
  const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  const homePath = getPagePath("home").replace(/^\/+/, "");
  const url = new URL(homePath, appBaseUrl);
  url.searchParams.set("site", siteId);
  return url.toString();
}

export default function MobileSitePreview({
  siteId,
  clientName,
}: {
  siteId: SiteId;
  clientName: string;
}) {
  const previewUrl = useMemo(() => getSitePrototypeUrl(siteId), [siteId]);

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
        <MobilePreviewFrame
          maxWidth={390}
          viewportHeight={{ xs: 600, sm: 720 }}
          showDeviceChrome={false}
        >
          <Box
            key={previewUrl}
            component="iframe"
            src={previewUrl}
            title={`${clientName} interactive mobile site preview`}
            sx={{
              display: "block",
              width: "100%",
              height: "100%",
              border: 0,
              bgcolor: "background.paper",
            }}
          />
        </MobilePreviewFrame>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Box, Stack, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import TabletMacRoundedIcon from "@mui/icons-material/TabletMacRounded";
import DesktopWindowsRoundedIcon from "@mui/icons-material/DesktopWindowsRounded";
import { getSitePrototypeUrl } from "../../config/sitePrototype";
import type { SiteId } from "../../data";

const viewports = {
  mobile: { width: 390, height: 720, icon: PhoneIphoneRoundedIcon },
  tablet: { width: 768, height: 900, icon: TabletMacRoundedIcon },
  desktop: { width: 1280, height: 800, icon: DesktopWindowsRoundedIcon },
};
export default function SitePreview({ siteId, clientName, homePath }: { siteId: SiteId; clientName: string; homePath?: string }) {
  const [viewport, setViewport] = useState<keyof typeof viewports>("mobile");
  return <Stack spacing={2} sx={{ minWidth: 0 }}>
    <ToggleButtonGroup exclusive size="small" value={viewport} onChange={(_, value: keyof typeof viewports | null) => value && setViewport(value)} aria-label="Preview viewport">
      {Object.entries(viewports).map(([id, { icon: Icon }]) => <ToggleButton key={id} value={id} aria-label={id[0].toUpperCase() + id.slice(1)}><Tooltip title={id[0].toUpperCase() + id.slice(1)}><Icon fontSize="small" /></Tooltip></ToggleButton>)}
    </ToggleButtonGroup>
    <Box sx={{ overflowX: "auto", maxWidth: "100%", bgcolor: "action.hover", p: 2 }}>
      <iframe src={getSitePrototypeUrl(siteId, homePath)} title={`${clientName} interactive site preview`} width={viewports[viewport].width} height={viewports[viewport].height} style={{ display: "block", border: 0, background: "white", marginInline: "auto" }} />
    </Box>
  </Stack>;
}

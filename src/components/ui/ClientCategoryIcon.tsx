import { useContext, useState } from "react";
import type { ComponentType } from "react";
import { alpha, Box, type SvgIconProps, type Theme } from "@mui/material";
import { ClientIconContext } from "./ClientIconContext";
import { getActiveClient } from "../../config/client/getActiveClient";
import type { CoverageCategoryId } from "../../domain/coverage";

/** Shared category badge appearance for stock icons and client artwork. */
const categoryBadgeSx = (theme: Theme) => ({
  backgroundColor: "#fff",
  border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
  borderRadius: "50%",
  padding: "2px",
  boxSizing: "border-box",
});

export function clientCategoryIcon(category: CoverageCategoryId, Fallback: ComponentType<SvgIconProps>) {
  function ClientCategoryIcon(props: SvgIconProps) {
    const branding = useContext(ClientIconContext) ?? getActiveClient().branding;
    const source = branding.icons?.categories?.[category];
    const [failed, setFailed] = useState<string>();
    const { sx, titleAccess, fontSize = "medium" } = props;
    const badgeSx = [...(Array.isArray(sx) ? sx : sx ? [sx] : []), categoryBadgeSx];
    if (!source || source === failed) return <Fallback {...props} sx={badgeSx} />;
    const size = { inherit: "inherit", small: "1.25rem", medium: "1.5rem", large: "2.1875rem" }[fontSize];
    return <Box component="img" src={source} alt={titleAccess ?? `${category} coverage`} onError={() => setFailed(source)} sx={[{ width: "1em", height: "1em", fontSize: size, objectFit: "contain", flexShrink: 0 }, ...badgeSx]} />;
  }
  return ClientCategoryIcon;
}

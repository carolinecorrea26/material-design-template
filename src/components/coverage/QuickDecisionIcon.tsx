import { useContext, useState } from "react";
import OfflineBoltRoundedIcon from "@mui/icons-material/OfflineBoltRounded";
import { Box, type SvgIconProps } from "@mui/material";
import { ClientIconContext } from "../content/ClientIconContext";

/** Client branding can replace QD artwork; other clients retain the shared mark. */
export default function QuickDecisionIcon(props: SvgIconProps) {
  const previewBranding = useContext(ClientIconContext);
  const source = previewBranding?.icons?.quickDecision;
  const [failedSource, setFailedSource] = useState<string>();
  if (!source || source === failedSource) return <OfflineBoltRoundedIcon {...props} />;
  const { sx, titleAccess, fontSize = "medium" } = props;
  const size = { inherit: "inherit", small: "1.25rem", medium: "1.5rem", large: "2.1875rem" }[fontSize];
  return <Box
    component="img"
    src={source}
    alt={titleAccess ?? "QuickDecision"}
    onError={() => setFailedSource(source)}
    sx={[{ display: "inline-block", width: "1em", height: "1em", fontSize: size, objectFit: "contain", flexShrink: 0, verticalAlign: "middle" }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
  />;
}

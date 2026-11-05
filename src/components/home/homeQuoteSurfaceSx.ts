import { alpha, lighten, type Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";
import { SURFACE_SX } from "../../config/constants";

export const homeQuoteSurfaceSx = (theme: Theme) => ({
  ...(SURFACE_SX as SystemStyleObject<Theme>),
  width: "100%",
  borderColor: alpha(theme.palette.primary.main, 0.14),
  background: `linear-gradient(135deg, ${lighten(theme.palette.primary.main, 0.92)} 0%, ${theme.palette.background.paper} 52%, ${lighten(theme.palette.primary.main, 0.96)} 100%)`,
});

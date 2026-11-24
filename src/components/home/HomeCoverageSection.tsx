import { Stack, Typography, type SxProps, type Theme } from "@mui/material";
import type { SiteContent } from "../../content/types";
import { resolveBrandingTemplate } from "../../content";
import type { ClientConfig } from "../../config/clients/types";
import CoverageOptionsPanel from "../coverage/CoverageOptionsPanel";

export default function HomeCoverageSection({ content, branding, sx, coverageOptions }: { content: SiteContent; branding: ClientConfig["branding"]; sx?: SxProps<Theme>; coverageOptions: Omit<import("react").ComponentProps<typeof CoverageOptionsPanel>, "variant" | "content"> }) {
  return (
          <Stack spacing={2.5} sx={sx}>
            <Stack spacing={1} sx={{ textAlign: { xs: "center", md: "left" } }}>
              <Typography variant="h2">
                {content.home.coverageOptions.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {resolveBrandingTemplate(content.home.coverageOptions.description, branding)}
              </Typography>
            </Stack>

            <CoverageOptionsPanel {...coverageOptions} content={content} variant="page" animateQuickDecision />
          </Stack>
  );
}


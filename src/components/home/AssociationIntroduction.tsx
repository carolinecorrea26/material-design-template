import { Box, Stack, Typography } from "@mui/material";
import type { SiteContent } from "../../content/types";
import type { ClientConfig } from "../../config/clients/types";

export default function AssociationIntroduction({ content, effectiveBranding }: { content: SiteContent; effectiveBranding: ClientConfig["branding"] }) {
  if (!content.home.clientSection) return null;
  return (
                <Stack spacing={2}>
                  <Stack direction="column" spacing={2} alignItems="start">
                    <Box
                      component="img"
                      src={effectiveBranding.logo}
                      alt={effectiveBranding.logoAlt}
                      sx={{
                        display: "block",
                        height: 30,
                        width: "auto",
                        objectFit: "contain",
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body1" color="text.secondary">
                      {content.home.clientSection.tagline}
                    </Typography>
                  </Stack>

                  <Stack spacing={1.25}>
                    {content.home.clientSection.paragraphs.map(
                      (paragraph, i) => (
                        <Typography key={i} variant="body2">
                          {paragraph}
                        </Typography>
                      ),
                    )}
                  </Stack>
                </Stack>
  );
}


import { Box, Stack, Typography } from "@mui/material";
import type { SiteContent } from "../../content/types";

export default function UnderwriterCredentials({ content }: { content: SiteContent }) {
  return (
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    component="img"
                    src="/logo.svg"
                    alt="New York Life Logo"
                    sx={{
                      display: "block",
                      height: 40,
                      width: "auto",
                      objectFit: "contain",
                      flexShrink: 0,
                    }}
                  />
                  <Stack spacing={0.25}>
                    <Typography variant="h5">
                      {content.home.nylCredentials.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {content.home.nylCredentials.tagline}
                    </Typography>
                  </Stack>
                </Stack>

                <Stack spacing={1.25}>
                  <Typography variant="body2">
                    {content.home.nylCredentials.description}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  spacing={2}
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ rowGap: 1 }}
                >
                  {content.home.nylCredentials.ratings.map(
                    ({ grade, source }) => (
                      <Stack
                        key={grade + source}
                        direction="row"
                        spacing={0.75}
                        alignItems="baseline"
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: "primary.main" }}
                        >
                          {grade}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {source}
                        </Typography>
                      </Stack>
                    ),
                  )}
                </Stack>

                <Typography variant="caption" color="text.secondary">
                  <Box
                    component="sup"
                    sx={{ fontSize: "0.85em", lineHeight: 1 }}
                  >
                    1
                  </Box>
                  {content.home.nylCredentials.ratingsNote}
                </Typography>
              </Stack>
  );
}

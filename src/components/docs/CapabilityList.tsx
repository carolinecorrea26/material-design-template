import { Box, Card, CardContent, Chip, Link, Stack, Typography } from "@mui/material";
import { capabilitiesData } from "../../content/docs/capabilities";
import { featuresData } from "../../content/docs/features";

/**
 * Renders capabilities as high-level orientation cards — a summary, a
 * compact "Related" caption naming the finer-grained features.tsx rows it
 * groups (names only, not their full description/impactedAreas — that
 * detail stays in features.tsx so this list doesn't become a second Features
 * table), and "See also" links into the Application/Configuration/Behavior
 * documentation this capability actually depends on.
 */
export default function CapabilityList() {
  return (
    <Stack spacing={2}>
      {capabilitiesData.map((capability) => {
        const relatedNames = capability.relatedFeatureIds
          .map((id) => featuresData.find((f) => f.id === id)?.name)
          .filter((name): name is string => Boolean(name));

        return (
          <Card key={capability.id} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {capability.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {capability.summary}
              </Typography>
              {relatedNames.length > 0 && (
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ display: "block", mt: 1 }}
                >
                  Related: {relatedNames.join(", ")}
                </Typography>
              )}
              {capability.seeAlso.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
                    {capability.seeAlso.map((link) => (
                      <Chip
                        key={link.href + link.label}
                        component={Link}
                        href={link.href}
                        clickable
                        size="small"
                        variant="outlined"
                        label={link.label}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}

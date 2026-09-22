import { Box, Chip, Link, Paper, Stack, Typography } from "@mui/material";
import { CLIENT_HIGHLIGHT_BG, CLIENT_HIGHLIGHT_BORDER } from "./ClientNote";
import type { OverrideSummaryDomain } from "../../config/resolvers";

/**
 * "What differs from the Global Template" digest — one compact block per
 * domain (Pages/Fields/Coverage/Configuration/URL Parameters), each linking
 * down to its full detail in Effective Site rather than reproducing it here.
 * Domains with no overrides still render, with a muted count, so the
 * digest reads as complete rather than as a curated list of problems.
 */
export default function OverridesSummary({ domains }: { domains: OverrideSummaryDomain[] }) {
  const totalOverridden = domains.reduce((sum, d) => sum + d.overriddenCount, 0);

  if (totalOverridden === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        This client has no overrides — every page, field, coverage, and configuration option
        currently matches the Global Template.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {domains.map((domain) => (
        <Paper
          key={domain.id}
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
            ...(domain.overriddenCount > 0
              ? { bgcolor: CLIENT_HIGHLIGHT_BG, borderColor: CLIENT_HIGHLIGHT_BORDER }
              : {}),
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            useFlexGap
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {domain.label}
              </Typography>
              <Chip
                label={`${domain.overriddenCount} of ${domain.totalCount} overridden`}
                size="small"
                variant={domain.overriddenCount > 0 ? "filled" : "outlined"}
                sx={
                  domain.overriddenCount > 0
                    ? {
                        bgcolor: CLIENT_HIGHLIGHT_BG,
                        borderColor: CLIENT_HIGHLIGHT_BORDER,
                        color: "#5c4a00",
                        border: "1px solid",
                        fontWeight: 600,
                      }
                    : undefined
                }
              />
            </Stack>
            {domain.overriddenCount > 0 && (
              <Link href={`#${domain.anchor}`} variant="body2">
                View in Effective Site →
              </Link>
            )}
          </Stack>
          {domain.overriddenCount > 0 && (
            <Stack spacing={0.75} sx={{ mt: 1.5 }}>
              {domain.items.map((item) => (
                <Box
                  key={item.id}
                  sx={{ display: "flex", gap: 1, alignItems: "baseline", flexWrap: "wrap" }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 200 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.detail}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      ))}
    </Stack>
  );
}

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { getActiveClient } from "../client/getActiveClient";
import { getPagePath } from "../config/pages";

export default function Home() {
  const client = getActiveClient();

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 4, md: 8 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 720,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,248,255,0.98) 100%)",
          border: "1px solid rgba(7, 104, 255, 0.12)",
          borderRadius: 4,
          boxShadow: "0 20px 50px rgba(52, 59, 72, 0.08)",
          px: { xs: 3, sm: 5, md: 7 },
          py: { xs: 4, sm: 5, md: 6 },
        }}
      >
        <Stack spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Box
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              backgroundColor: "rgba(7, 104, 255, 0.08)",
              color: "primary.main",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Online application
          </Box>

          <Stack spacing={1.5} sx={{ textAlign: { xs: "left", sm: "center" } }}>
            <Typography variant="h1">Apply for coverage</Typography>
            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                maxWidth: 560,
              }}
            >
              Start your {client.branding.name} application in a few guided
              steps.
            </Typography>
          </Stack>

          <Button
            component={RouterLink}
            to={getPagePath("membership")}
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{ px: 3.5, py: 1.25 }}
          >
            Apply
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

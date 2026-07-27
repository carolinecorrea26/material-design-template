import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import FormRoutePage from "../app/RoutePage";

export default function HealthQd() {
  return (
    <FormRoutePage pageId="health-qd">
      {() => (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 6,
            px: 3,
          }}
        >
          <Stack spacing={3} alignItems="center" sx={{ maxWidth: 400 }}>
            <CircularProgress size={48} thickness={4} />
            <Stack spacing={1} alignItems="center">
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <OfflineBoltIcon color="success" sx={{ fontSize: "1.4rem" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  QuickDecision<sup style={{ fontSize: "0.6em" }}>SM</sup>
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", lineHeight: 1.6 }}
              >
                You are about to be taken to a new page to answer health
                questions online for QuickDecision
                <sup style={{ fontSize: "0.6em" }}>SM</sup>. Please do not close
                this window.
              </Typography>
            </Stack>
          </Stack>
        </Box>
      )}
    </FormRoutePage>
  );
}

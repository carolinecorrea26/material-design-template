import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import FormRoutePage from "../app/RoutePage";
import { getContent } from "../content";

export default function DocuSign() {
  const content = getContent().statusMessages.docusign;
  return (
    <FormRoutePage pageId="docusign" formMaxWidth={1200}>
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
              <img
                src="/docusign.png"
                alt="DocuSign"
                style={{ height: "1.4rem", width: "auto" }}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {content.heading}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", lineHeight: 1.6 }}
            >
              {content.body}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </FormRoutePage>
  );
}

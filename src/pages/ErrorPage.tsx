import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import FormShell from "../components/layout/FormShell";
import { getPagePath } from "../config/pages";
import { useApplicationForm } from "../app/ApplicationFormContext";
import { useApplicationSession } from "../app/ApplicationSessionContext";
import { resolveSiteId } from "../data/activeSite";

export default function ErrorPage({ status = 404 }: { status?: 404 | 500 }) {
  const { resetValues } = useApplicationForm();
  const { resetApplicationSession } = useApplicationSession();
  const search = new URLSearchParams({ site: resolveSiteId() }).toString();
  const title = status === 404 ? "Page not found" : "Something went wrong";
  return <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
    <PageShell title={title} maxWidth={600} noTitle>
      <FormShell sx={{ p: { xs: 3, sm: 5 } }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Typography variant="overline" color="text.secondary">Error {status}</Typography>
          <Typography component="h1" variant="h4">{title}</Typography>
          <Typography color="text.secondary">{status === 404 ? "The page you’re looking for may have moved or is no longer available." : "We’re unable to load this page right now. Please try again later."}</Typography>
          <Stack spacing={1.5} sx={{ width: "100%" }}>
            <Button component={RouterLink} to={`${getPagePath("resume")}?${search}`} variant="contained" size="large">Resume application</Button>
            <Button component={RouterLink} to={`${getPagePath("home")}?${search}`} variant="outlined" size="large" onClick={() => { resetValues(); resetApplicationSession(); }}>Start new application</Button>
          </Stack>
        </Stack>
      </FormShell>
    </PageShell>
  </Box>;
}

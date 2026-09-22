import { Box, Stack, Typography } from "@mui/material";
import type { ClientId } from "../../types";
import EmailTemplatesTable from "./EmailTemplatesTable";
import { GlobalEmailConfigurationTable } from "./EmailConfigurationTable";
import SectionTabs from "./SectionTabs";

/** Generic placeholder client used to render Global tab previews, so they're not tied to any real client's branding/support info. */
const GLOBAL_EMAIL_CLIENT_ID: ClientId = "demo";

export default function GlobalEmailTemplatesPanel() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Global Email Templates
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 920 }}>
          The template's baseline transactional emails across the consumer, advisor, and resume
          flows, previewed with generic placeholder branding. For a given client's resolved
          emails, see the <strong>Client Email Templates</strong> tab.
        </Typography>
      </Box>

      <SectionTabs
        tabs={[
          { id: "global-email-templates-subsection", label: "Templates" },
          { id: "global-email-configuration-subsection", label: "Configuration Options" },
        ]}
        defaultTabId="global-email-templates-subsection"
      >
        <Box id="global-email-templates-subsection">
          <EmailTemplatesTable clientId={GLOBAL_EMAIL_CLIENT_ID} />
        </Box>

        <Box id="global-email-configuration-subsection">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 920 }}>
            Global configuration options for the "Questions?" contact box. Client-specific values
            and overrides are shown only on the Client Email Templates tab.
          </Typography>
          <GlobalEmailConfigurationTable />
        </Box>
      </SectionTabs>
    </Stack>
  );
}

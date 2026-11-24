import { useInterfaceText } from '../content/useInterfaceText';
import { alpha } from '@mui/material/styles';
import AppModal from "./AppModal";
import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Typography,
} from "@mui/material";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import type { ClientConfig } from "../../config/clients/types";

type ClientHelpBannerProps = {
  client: ClientConfig;
};

export default function ClientHelpBanner({ client }: ClientHelpBannerProps) {
  const text = useInterfaceText();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const { phoneHours } = client.support;
  const { phone, phoneDisplay } = client.support.helpPhone ?? client.support;
  const { chat, chatUrl, scheduleUrl, linkUrl, linkLabel } =
    client.features ?? {};

  if (!phone) return null;

  const handleChat = () => {
    if (chatUrl) window.open(chatUrl, "ClientChat", "width=400,height=600,scrollbars=yes");
  };

  return (
    <>
      <Box
        sx={{
          width: "100vw",
          position: "relative",
          left: "50%",
          right: "50%",
          ml: "-50vw",
          mr: "-50vw",
          bgcolor: "primary.dark",
        }}
      >
        <Box
          sx={{
            maxWidth: "100%",
            mx: "auto",
            px: 2,
            py: 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          {/* Call button + hours */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Button
              className="ClientHelpBanner-action"
              variant="outlined"
              size="small"
              href={`tel:${phone}`}
              startIcon={<PhoneRoundedIcon />}
            >
              {text('help-call', { phone: phoneDisplay || phone })}
            </Button>
            {phoneHours && (
              <Typography
                variant="caption"
                sx={theme => ({ color: alpha(theme.palette.getContrastText(theme.palette.primary.dark), 0.85), whiteSpace: "nowrap" })}
              >
                {phoneHours}
              </Typography>
            )}
          </Box>

          {chat && chatUrl && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={theme => ({ borderColor: alpha(theme.palette.getContrastText(theme.palette.primary.dark), 0.3) })}
              />
              <Button
                className="ClientHelpBanner-action"
                variant="outlined"
                size="small"
                onClick={handleChat}
                startIcon={<ChatBubbleOutlineRoundedIcon />}
              >
                {text('help-chat')}
              </Button>
            </>
          )}

          {linkUrl && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={theme => ({ borderColor: alpha(theme.palette.getContrastText(theme.palette.primary.dark), 0.3) })}
              />
              <Button
                className="ClientHelpBanner-action"
                variant="outlined"
                size="small"
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {linkLabel || text('help-link', { acronym: client.branding.acronym })}
              </Button>
            </>
          )}

          {scheduleUrl && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={theme => ({ borderColor: alpha(theme.palette.getContrastText(theme.palette.primary.dark), 0.3) })}
              />
              <Button
                className="ClientHelpBanner-action"
                variant="outlined"
                size="small"
                onClick={() => setScheduleOpen(true)}
                startIcon={<CalendarMonthRoundedIcon />}
              >
                {text('help-schedule')}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Schedule modal with Calendly embed */}
      <AppModal open={scheduleOpen} onClose={() => setScheduleOpen(false)}
        title={<Typography component="span" variant="h6">{text('help-schedule-title')}</Typography>} closeLabel={text('help-schedule-close')}
        maxWidth={600} minHeight="auto" fullScreenOnMobile={false} contentDividers={false}>
          <Box
            component="iframe"
            src={scheduleUrl}
            title={text('help-schedule')}
            sx={{ width: "100%", height: 500, border: "none" }}
          />
      </AppModal>
    </>
  );
}

import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import type { ClientConfig } from "../../config/clients/types";

type ClientHelpBannerProps = {
  client: ClientConfig;
};

export default function ClientHelpBanner({ client }: ClientHelpBannerProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const { phone, phoneDisplay, phoneHours } = client.support;
  const { chat, chatUrl, scheduleUrl, linkUrl, linkLabel } =
    client.features ?? {};

  if (!phone) return null;

  const handleChat = () => {
    const url = chatUrl || "https://example.com/chat";
    window.open(url, "ClientChat", "width=400,height=600,scrollbars=yes");
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              href={`tel:${phone}`}
              startIcon={<PhoneIcon />}
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.6)",
                "&:hover": {
                  borderColor: "#fff",
                  bgcolor: "rgba(255,255,255,0.08)",
                },
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
              }}
            >
              Call for help {phoneDisplay || phone}
            </Button>
            {phoneHours && (
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}
              >
                {phoneHours}
              </Typography>
            )}
          </Box>

          {chat && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: "rgba(255,255,255,0.3)" }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleChat}
                startIcon={<ChatBubbleOutlineIcon />}
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.6)",
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                Chat now
              </Button>
            </>
          )}

          {linkUrl && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: "rgba(255,255,255,0.3)" }}
              />
              <Button
                variant="outlined"
                size="small"
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.6)",
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                {linkLabel || `${client.branding.acronym} help`}
              </Button>
            </>
          )}

          {scheduleUrl && (
            <>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: "rgba(255,255,255,0.3)" }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => setScheduleOpen(true)}
                startIcon={<CalendarMonthIcon />}
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.6)",
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                Schedule a call
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Schedule modal with Calendly embed */}
      <Dialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Schedule a Call
          <IconButton onClick={() => setScheduleOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            component="iframe"
            src={scheduleUrl}
            title="Schedule a call"
            sx={{ width: "100%", height: 500, border: "none" }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

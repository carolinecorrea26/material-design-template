import {
  Box,
  Button,
  Drawer,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import AppDrawer from "../layout/AppDrawer";
import HowApplyingWorksPanel from "../ui/HowApplyingWorksPanel";
import CoverageOptionsPanel from "../ui/CoverageOptionsPanel";
import CoverageNeedsCalculator from "../forms/CoverageNeedsCalculator";
import QuickDecisionDrawerContent, {
  QuickDecisionMark,
} from "../content/QuickDecisionExplainer";
import { useState } from "react";
import type { ClientConfig } from "../../config/clients/types";
import { router } from "../../app/router";
import { APP_MENU_SECTION_TITLE_SX } from "../../app/theme";

type AppMenuProps = {
  open: boolean;
  onClose: () => void;
  client: ClientConfig;
};

export default function AppMenu({ open, onClose, client }: AppMenuProps) {
  const [isHowApplyingWorksOpen, setIsHowApplyingWorksOpen] = useState(false);
  const [isCoverageDrawerOpen, setIsCoverageDrawerOpen] = useState(false);
  const [isNeedsCalcOpen, setIsNeedsCalcOpen] = useState(false);
  const [isQuickDecisionOpen, setIsQuickDecisionOpen] = useState(false);

  const phone = client.support.phone;

  function handleNavigate(path: string) {
    onClose();
    void router.navigate(path);
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "80vw", sm: 420 },
            maxWidth: "100%",
            p: 2,
          },
        }}
      >
        <Stack spacing={2} sx={{ height: "100%" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Menu
            </Typography>
            <IconButton
              aria-label="Close application navigation menu"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Continue saved application */}
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: "background.subtle" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={APP_MENU_SECTION_TITLE_SX}>
                Continue Saved Application
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                You can continue your saved application below. Applications are
                only saved for 10 days from starting.
              </Typography>
            </Stack>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => handleNavigate("/resume")}
              sx={{ margin: "1.25rem 0" }}
            >
              Continue Application
            </Button>
          </Box>

          {/* Application tools */}
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: "background.subtle" }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={APP_MENU_SECTION_TITLE_SX}>
                Application Tools
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    onClose();
                    setIsHowApplyingWorksOpen(true);
                  }}
                  sx={{
                    flexDirection: "row",
                    textTransform: "none",
                    py: 1.5,
                    px: 2,
                    gap: 1.5,
                    borderRadius: 2,
                    justifyContent: "flex-start",
                  }}
                >
                  <ListAltRoundedIcon />
                  <Typography variant="body2" fontWeight={600}>
                    How Applying Works
                  </Typography>
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    onClose();
                    setIsCoverageDrawerOpen(true);
                  }}
                  sx={{
                    flexDirection: "row",
                    textTransform: "none",
                    py: 1.5,
                    px: 2,
                    gap: 1.5,
                    borderRadius: 2,
                    justifyContent: "flex-start",
                  }}
                >
                  <PrivacyTipIcon />
                  <Typography variant="body2" fontWeight={600}>
                    About Coverage
                  </Typography>
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    onClose();
                    setIsQuickDecisionOpen(true);
                  }}
                  sx={{
                    flexDirection: "row",
                    textTransform: "none",
                    py: 1.5,
                    px: 2,
                    gap: 1.5,
                    borderRadius: 2,
                    justifyContent: "flex-start",
                  }}
                >
                  <OfflineBoltIcon color="success" />
                  <Typography variant="body2" fontWeight={600}>
                    About <QuickDecisionMark />
                  </Typography>
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    onClose();
                    setIsNeedsCalcOpen(true);
                  }}
                  sx={{
                    flexDirection: "row",
                    textTransform: "none",
                    py: 1.5,
                    px: 2,
                    gap: 1.5,
                    borderRadius: 2,
                    justifyContent: "flex-start",
                  }}
                >
                  <CalculateRoundedIcon />
                  <Typography variant="body2" fontWeight={600}>
                    Needs Calculator
                  </Typography>
                </Button>
              </Stack>
            </Stack>
          </Box>

          {/* Contact */}
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: "background.subtle" }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" sx={APP_MENU_SECTION_TITLE_SX}>
                Contact Us
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">{client.branding.name}</Typography>
                {client.support.website && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LanguageOutlinedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                    <Link
                      href={`https://${client.support.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      variant="body2"
                    >
                      {client.support.website}
                    </Link>
                  </Stack>
                )}
                {client.support.email && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmailOutlinedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                    <Link
                      href={`mailto:${client.support.email}`}
                      underline="hover"
                      variant="body2"
                    >
                      {client.support.email}
                    </Link>
                  </Stack>
                )}
                {phone && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneOutlinedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                    <Link
                      href={`tel:${phone}`}
                      underline="hover"
                      variant="body2"
                    >
                      {client.support.phoneDisplay ?? phone}
                    </Link>
                  </Stack>
                )}
                {client.support.phoneHours && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTimeOutlinedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {client.support.phoneHours}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ mt: "auto" }} />
        </Stack>
      </Drawer>

      <AppDrawer
        open={isHowApplyingWorksOpen}
        title="How does applying work?"
        onClose={() => setIsHowApplyingWorksOpen(false)}
      >
        <HowApplyingWorksPanel variant="drawer" />
      </AppDrawer>

      <AppDrawer
        open={isCoverageDrawerOpen}
        title="What are my coverage options?"
        onClose={() => setIsCoverageDrawerOpen(false)}
      >
        <CoverageOptionsPanel variant="drawer" />
      </AppDrawer>

      <AppDrawer
        open={isNeedsCalcOpen}
        title="How much coverage do I need?"
        onClose={() => setIsNeedsCalcOpen(false)}
      >
        <CoverageNeedsCalculator />
      </AppDrawer>

      <AppDrawer
        open={isQuickDecisionOpen}
        title={
          <>
            What is <QuickDecisionMark />?
          </>
        }
        onClose={() => setIsQuickDecisionOpen(false)}
      >
        <QuickDecisionDrawerContent />
      </AppDrawer>
    </>
  );
}

import { getPagePath } from "../../config/pages";
import { menuTools } from "../../content/interactionLabels";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PrivacyTipRoundedIcon from "@mui/icons-material/PrivacyTipRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import CalculateRoundedIcon from "@mui/icons-material/CalculateRounded";
import QuickDecisionIcon from "../coverage/QuickDecisionIcon";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import AppDrawer from "../layout/AppDrawer";
import HowApplyingWorksPanel from "../home/HowApplyingWorksPanel";
import CoverageOptionsPanel from "../../app/sections/ConfiguredCoverageOptionsPanel";
import CoverageNeedsCalculator from "../../app/sections/ConfiguredCoverageNeedsCalculator";
import QuickDecisionDrawerContent, {
  QuickDecisionMark,
} from "../content/QuickDecisionExplainer";
import { useId, useState } from "react";
import type { ClientConfig } from "../../config/clients/types";
import { router } from "../../app/router";

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
  const menuTitleId = useId();

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
        slotProps={{ paper: { "aria-labelledby": menuTitleId } }}
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
            <Typography variant="subtitle1" fontWeight={700} id={menuTitleId}>
              Menu
            </Typography>
            <IconButton
              aria-label="Close application navigation menu"
              onClick={onClose}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          {/* Continue saved application */}
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: "background.default" }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.primary">
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
              onClick={() => handleNavigate(getPagePath("resume"))}
              sx={{ margin: "1.25rem 0" }}
            >
              Continue Application
            </Button>
          </Box>

          {/* Application tools */}
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: "background.default" }}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="text.primary">
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
                    {menuTools["how-applying-works"].label}
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
                  <PrivacyTipRoundedIcon />
                  <Typography variant="body2" fontWeight={600}>
                    {menuTools["about-coverage"].label}
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
                  <QuickDecisionIcon color="success" />
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
                    {menuTools["coverage-needs"].label}
                  </Typography>
                </Button>
              </Stack>
            </Stack>
          </Box>

          {/* Contact */}
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: "background.default" }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.primary">
                Contact Us
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">{client.branding.name}</Typography>
                {client.support.website && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LanguageRoundedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                    <Link
                      href={`https://${client.support.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                    >
                      {client.support.website}
                    </Link>
                  </Stack>
                )}
                {client.support.email && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmailRoundedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                    <Link
                      href={`mailto:${client.support.email}`}
                      variant="body2"
                    >
                      {client.support.email}
                    </Link>
                  </Stack>
                )}
                {phone && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PhoneRoundedIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                    <Link
                      href={`tel:${phone}`}
                      variant="body2"
                    >
                      {client.support.phoneDisplay ?? phone}
                    </Link>
                  </Stack>
                )}
                {client.support.phoneHours && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTimeRoundedIcon
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
        title={menuTools["how-applying-works"].title}
        onClose={() => setIsHowApplyingWorksOpen(false)}
      >
        <HowApplyingWorksPanel variant="drawer" />
      </AppDrawer>

      <AppDrawer
        open={isCoverageDrawerOpen}
        title={menuTools["about-coverage"].title}
        onClose={() => setIsCoverageDrawerOpen(false)}
      >
        <CoverageOptionsPanel variant="drawer" />
      </AppDrawer>

      <AppDrawer
        open={isNeedsCalcOpen}
        title={menuTools["coverage-needs"].title}
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

import * as React from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { Check, Settings, SwapHoriz } from "@mui/icons-material";
import { clients } from "../config/clients";
import { getActiveClient } from "../client/getActiveClient";
import type { ClientId } from "../types/client";
import {
  useApplicationForm,
  STORAGE_KEY,
} from "../state/ApplicationFormContext";
import type { ProgressVariant } from "../types/progress";
import { pages, getPagePath } from "../config/pages";
import type { PageId } from "../types/page";
import { formFlow } from "../config/formFlow";
import { generateFormDataUpToPage } from "./utils/generateFormData";
import { router } from "../app/router";

const CLIENT_QUERY_PARAM = "client";

const FORM_PAGE_PATHS = new Set([
  "/membership",
  "/eligibility",
  "/coverage",
  "/coverage-questions",
  "/coverage-options",
  "/beneficiary",
  "/contact",
  "/personal",
  "/financial",
  "/review",
  "/docusign",
  "/health-si",
  "/health-qd",
  "/health-di",
  "/health-cir",
  "/payment",
]);

const PROGRESS_VARIANT_STORAGE_KEY = "devtools:progressVariant";

function getStoredProgressVariant(): ProgressVariant {
  const stored = window.sessionStorage.getItem(PROGRESS_VARIANT_STORAGE_KEY);
  if (stored === "bar") return "bar";
  if (stored === "stepper") return "stepper";
  return "vertical-stepper";
}

function setStoredProgressVariant(variant: ProgressVariant) {
  window.sessionStorage.setItem(PROGRESS_VARIANT_STORAGE_KEY, variant);
  window.dispatchEvent(
    new CustomEvent("devtools:progressvariantchange", {
      detail: variant,
    }),
  );
}

function switchClient(clientId: ClientId) {
  const url = new URL(window.location.href);
  url.searchParams.set(CLIENT_QUERY_PARAM, clientId);
  window.sessionStorage.setItem("activeClientId", clientId);
  window.location.replace(url.toString());
}

function clearClientOverride() {
  const url = new URL(window.location.href);
  url.searchParams.delete(CLIENT_QUERY_PARAM);
  window.sessionStorage.removeItem("activeClientId");
  window.location.replace(url.toString());
}

const DEVMODE_STORAGE_KEY = "devtools:devMode";

function getIsDevMode(): boolean {
  const urlHasDevMode = new URLSearchParams(window.location.search).has(
    "devMode",
  );
  if (urlHasDevMode) {
    window.sessionStorage.setItem(DEVMODE_STORAGE_KEY, "true");
    return true;
  }
  return window.sessionStorage.getItem(DEVMODE_STORAGE_KEY) === "true";
}

export default function DevTools() {
  const isDevMode = getIsDevMode();
  const { resetValues } = useApplicationForm();
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [jumpPageAnchorEl, setJumpPageAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const [progressVariant, setProgressVariant] = React.useState<ProgressVariant>(
    getStoredProgressVariant(),
  );

  const currentClient = getActiveClient();
  const isFormPage = FORM_PAGE_PATHS.has(window.location.pathname);
  const hasUrlOverride = new URLSearchParams(window.location.search).has(
    "client",
  );

  const handleResetApp = () => {
    resetValues();
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.location.replace(`/?reset=${Date.now()}`);
  };

  const handleFillOutPage = () => {
    window.dispatchEvent(new CustomEvent("devtools:fillform"));
  };

  const handleProgressVariantChange = (variant: ProgressVariant) => {
    setProgressVariant(variant);
    setStoredProgressVariant(variant);
  };

  const handleJumpToPage = (pageId: PageId) => {
    // Generate form data up to this page
    const formData = generateFormDataUpToPage(pageId);

    // Write directly to sessionStorage before navigating — React state updates
    // (and their effects) don't flush synchronously before window.location.href.
    const current = JSON.parse(
      window.sessionStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as typeof formData;
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, ...formData }),
    );

    // Close the menu
    setJumpPageAnchorEl(null);

    // Navigate to the page
    const pagePath = getPagePath(pageId);
    void router.navigate(pagePath);
  };

  if (!isDevMode) return null;

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          right: open ? 320 : 0,
          top: "50%",
          transform: "translateY(-50%)",
          bgcolor: "grey.100",
          color: "text.primary",
          borderRadius: "8px 0 0 8px",
          padding: "12px 8px",
          zIndex: 1300,
          transition: "right 0.3s ease",
          "&:hover": { bgcolor: "grey.200" },
        }}
      >
        <Settings />
      </IconButton>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: 320,
            bgcolor: "grey.50",
            color: "text.primary",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            variant="h6"
            sx={{ color: "primary.main", fontWeight: 600, mb: 2 }}
          >
            Dev Tools
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", mb: 1, display: "block" }}
              >
                CLIENT
              </Typography>

              <Chip
                label={currentClient.branding.name}
                size="small"
                color={hasUrlOverride ? "primary" : "default"}
                variant={hasUrlOverride ? "filled" : "outlined"}
                icon={<SwapHoriz />}
                onClick={(event) => setAnchorEl(event.currentTarget)}
                sx={{ cursor: "pointer" }}
              />

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Switch Client
                  </Typography>
                </Box>

                <Divider />

                {Object.entries(clients).map(([id, client]) => (
                  <MenuItem
                    key={id}
                    onClick={() => {
                      setAnchorEl(null);
                      if (id !== currentClient.id) {
                        switchClient(id as ClientId);
                      }
                    }}
                    selected={currentClient.id === id}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        width: "100%",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          {client.branding.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {id}
                        </Typography>
                      </Box>
                      {currentClient.id === id ? (
                        <Check fontSize="small" color="primary" />
                      ) : null}
                    </Box>
                  </MenuItem>
                ))}

                {hasUrlOverride && <Divider />}
                {hasUrlOverride && (
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      clearClientOverride();
                    }}
                  >
                    <Typography variant="body2" color="error">
                      Clear Override
                    </Typography>
                  </MenuItem>
                )}
              </Menu>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", mb: 1, display: "block" }}
              >
                FORM ACTIONS
              </Typography>

              <Stack spacing={1}>
                <Button
                  onClick={(e) => setJumpPageAnchorEl(e.currentTarget)}
                  fullWidth
                  variant="outlined"
                  sx={{ justifyContent: "flex-start" }}
                >
                  Jump to Page
                </Button>

                <Menu
                  anchorEl={jumpPageAnchorEl}
                  open={Boolean(jumpPageAnchorEl)}
                  onClose={() => setJumpPageAnchorEl(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Form Pages
                    </Typography>
                  </Box>
                  <Divider />
                  {pages
                    .filter(
                      (page) =>
                        page.type === "form" &&
                        formFlow.includes(page.id as PageId),
                    )
                    .map((page) => (
                      <MenuItem
                        key={page.id}
                        onClick={() => handleJumpToPage(page.id as PageId)}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <Typography variant="body2">{page.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {page.id}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                </Menu>

                {isFormPage ? (
                  <Button
                    onClick={handleFillOutPage}
                    fullWidth
                    variant="outlined"
                    sx={{ justifyContent: "flex-start" }}
                  >
                    Fill Out Page
                  </Button>
                ) : null}

                <Button
                  onClick={handleResetApp}
                  fullWidth
                  variant="outlined"
                  sx={{ justifyContent: "flex-start" }}
                >
                  Reset App
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", mb: 1, display: "block" }}
              >
                PROGRESS
              </Typography>

              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant={progressVariant === "bar" ? "contained" : "outlined"}
                  onClick={() => handleProgressVariantChange("bar")}
                  sx={{ justifyContent: "flex-start" }}
                >
                  Progress Bar
                </Button>

                <Button
                  fullWidth
                  variant={
                    progressVariant === "stepper" ? "contained" : "outlined"
                  }
                  onClick={() => handleProgressVariantChange("stepper")}
                  sx={{ justifyContent: "flex-start" }}
                >
                  Horizontal Stepper
                </Button>

                <Button
                  fullWidth
                  variant={
                    progressVariant === "vertical-stepper"
                      ? "contained"
                      : "outlined"
                  }
                  onClick={() =>
                    handleProgressVariantChange("vertical-stepper")
                  }
                  sx={{ justifyContent: "flex-start" }}
                >
                  Vertical Stepper
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}

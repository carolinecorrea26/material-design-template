import { completePrototypeQdOutcomes } from '../domain/prototypeQdOutcomes';
import { getIsDevMode, DEV_MODE_STORAGE_KEY } from './devMode';
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
  TextField,
  Alert,
} from "@mui/material";
import { CheckRounded, SettingsRounded, SwapHorizRounded } from "@mui/icons-material";
import {
  getActiveSite,
  getHostingAssociationForSite,
  siteEntities,
  type SiteId,
} from "../data";
import {
  type ApplicationFormValues,
  useApplicationForm,

} from "../app/ApplicationFormContext";
import { getConfiguredPages, getPagePath, getPageTitle } from "../config/pages";
import type { PageId } from "../types";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { getResolvedFormFlow } from "../config/formFlow";
import { buildPrototypeScenario, prototypeScenarios, scenarioProducts, type PrototypeScenarioId } from './utils/prototypeScenarios';
import { getPrototypeLibrary } from '../domain/prototypeLibrary';
import { useApplicationSession } from '../app/ApplicationSessionContext';
import { shouldSkipPage } from '../config/formFlow';
import { router } from "../app/router";

const SITE_QUERY_PARAM = "site";

function switchSite(siteId: SiteId) {
  const url = new URL(window.location.href);
  url.searchParams.set(SITE_QUERY_PARAM, siteId);
  url.searchParams.delete("client");
  window.sessionStorage.setItem("activeSiteId", siteId);
  window.sessionStorage.removeItem("activeClientId");
  window.location.replace(url.toString());
}

function clearSiteOverride() {
  const url = new URL(window.location.href);
  url.searchParams.delete(SITE_QUERY_PARAM);
  url.searchParams.delete("client");
  window.sessionStorage.removeItem("activeSiteId");
  window.sessionStorage.removeItem("activeClientId");
  window.location.replace(url.toString());
}



export default function DevTools() {
  const isDevMode = getIsDevMode();
  const { values, resetValues, setPageValues } = useApplicationForm();
  const { resetApplicationSession } = useApplicationSession();
  const [scenario, setScenario] = React.useState<PrototypeScenarioId>('member');
  const [productKey, setProductKey] = React.useState('');
  const [scenarioError, setScenarioError] = React.useState('');
  const library = getPrototypeLibrary();
  const products = library ? scenarioProducts(library, scenario) : [];
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [jumpPageAnchorEl, setJumpPageAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const currentSite = getActiveSite();
  const currentClient = getHostingAssociationForSite(currentSite.id)!;
  const isFormPage = getConfiguredPages().some(page => page.path === window.location.pathname && page.type === 'form');
  const hasUrlOverride = new URLSearchParams(window.location.search).has(
    SITE_QUERY_PARAM,
  );

  const handleResetApp = () => {
    const siteId = window.sessionStorage.getItem("activeSiteId");
    const devMode = window.sessionStorage.getItem(DEV_MODE_STORAGE_KEY);
    resetValues();
    window.sessionStorage.clear();
    window.localStorage.clear();
    if (siteId) window.sessionStorage.setItem("activeSiteId", siteId);
    if (devMode) window.sessionStorage.setItem(DEV_MODE_STORAGE_KEY, devMode);
    const url = new URL("/", window.location.origin);
    url.searchParams.set("reset", String(Date.now()));
    if (siteId) url.searchParams.set(SITE_QUERY_PARAM, siteId);
    if (devMode === "true") url.searchParams.set("dev", "true");
    window.location.replace(url.toString());
  };

  const handleFillOutPage = () => {
    window.dispatchEvent(new CustomEvent("devtools:fillform"));
  };

  const handleResetPage = () => {
    const currentPage = getConfiguredPages().find((p) => p.path === window.location.pathname);
    if (!currentPage) return;

    const current = values;

    const pageFieldIds = new Set(
      getClientPageFields(
        currentPage.id as PageId,
        current as Parameters<typeof getClientPageFields>[1],
      ).map((f) => f.id),
    );

    const nextValues = Object.fromEntries(
      Object.entries(current).filter(([key]) => !pageFieldIds.has(key)),
    ) as ApplicationFormValues;

    resetValues();
    setPageValues(nextValues);
  };

  const handleJumpToPage = (pageId: PageId) => {
    if (!library) return;
    try {
      let nextValues = buildPrototypeScenario(library, scenario, productKey);
      const flow = getResolvedFormFlow();
      if (pageId === 'receipt') nextValues = completePrototypeQdOutcomes(nextValues, products);
      else for (const completed of flow.slice(0, flow.indexOf(pageId))) nextValues = completePrototypeQdOutcomes(nextValues, products, completed);
      if (pageId !== 'receipt' && shouldSkipPage(pageId, nextValues)) throw new Error('This page does not participate in the selected scenario. Choose another product or scenario.');
      resetValues();
      resetApplicationSession();
      setPageValues(nextValues);
      setScenarioError('');
      setJumpPageAnchorEl(null);
      void router.navigate({ pathname: getPagePath(pageId), search: window.location.search });
    } catch (error) { setScenarioError(error instanceof Error ? error.message : String(error)); }
  };
  const handleSubmitFullApplication = () => handleJumpToPage('receipt');

  if (!isDevMode) return null;

  return (
    <>
      <IconButton
        aria-label="Open Dev Tools"
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
        <SettingsRounded />
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
                SITE
              </Typography>

              <Chip
                label={`${currentClient.acronym} — ${currentSite.name}`}
                size="small"
                color={hasUrlOverride ? "primary" : "default"}
                variant={hasUrlOverride ? "filled" : "outlined"}
                icon={<SwapHorizRounded />}
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
                    Switch Site
                  </Typography>
                </Box>

                <Divider />

                {siteEntities.map((site) => {
                  const client = getHostingAssociationForSite(site.id)!;
                  return (
                  <MenuItem
                    key={site.id}
                    onClick={() => {
                      setAnchorEl(null);
                      if (site.id !== currentSite.id) {
                        switchSite(site.id);
                      }
                    }}
                    selected={currentSite.id === site.id}
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
                          {client.name} — {site.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {site.id}
                        </Typography>
                      </Box>
                      {currentSite.id === site.id ? (
                        <CheckRounded fontSize="small" color="primary" />
                      ) : null}
                    </Box>
                  </MenuItem>
                  );
                })}

                {hasUrlOverride && <Divider />}
                {hasUrlOverride && (
                  <MenuItem
                    onClick={() => {
                      setAnchorEl(null);
                      clearSiteOverride();
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
                <TextField select label="Scenario" value={scenario} onChange={event => { setScenario(event.target.value as PrototypeScenarioId); setProductKey(''); setScenarioError(''); }}>
                  {prototypeScenarios.filter(row => !library || scenarioProducts(library, row.id).length > 0).map(row => <MenuItem key={row.id} value={row.id}>{row.label}</MenuItem>)}
                </TextField>
                <TextField select label="Product" value={products.some(product => product.id === productKey) ? productKey : products[0]?.id ?? ''} onChange={event => setProductKey(event.target.value)} disabled={!products.length}>
                  {products.map(product => <MenuItem key={product.id} value={product.id}>{product.name}</MenuItem>)}
                </TextField>
                {scenarioError && <Alert severity="error">{scenarioError}</Alert>}
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
                  {getConfiguredPages()
                    .filter(
                      (page) =>
                        page.type === "form" &&
                        getResolvedFormFlow().includes(page.id as PageId),
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
                          <Typography variant="body2">
                            {getPageTitle(page.id as PageId)}
                          </Typography>
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

                {isFormPage ? (
                  <Button
                    onClick={handleResetPage}
                    fullWidth
                    variant="outlined"
                    color="warning"
                    sx={{ justifyContent: "flex-start" }}
                  >
                    Reset Page
                  </Button>
                ) : null}

                <Button
                  onClick={handleSubmitFullApplication}
                  fullWidth
                  variant="outlined"
                  color="success"
                  sx={{ justifyContent: "flex-start" }}
                >
                  Submit Full Application
                </Button>

                <Button
                  onClick={handleResetApp}
                  fullWidth
                  variant="outlined"
                  color="warning"
                  sx={{ justifyContent: "flex-start" }}
                >
                  Reset App
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}

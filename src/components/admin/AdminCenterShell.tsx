import { useAccount } from '../../admin/AccountContext';
import MockAdminGate from "./MockAdminGate";
import { useMemo, useRef, useState } from "react";
import { Link as RouterLink, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Alert,
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { visibleAdminNavigation } from "../../admin/navigation";
import { internalPersonas, type Persona } from "../../admin/access";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "../../app/theme";
import { getActiveClient } from "../../config/client/getActiveClient";

export type AdminCenterContext = { persona: Persona };
const expandedRailWidth = 228;

function AdminCenterContent() {
  const location = useLocation();
  const account = useAccount();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('adminRailCollapsed') === 'true');
  const dragStart = useRef<number | null>(null);
  const railWidth = collapsed ? 64 : expandedRailWidth;
  const adminNavigation = visibleAdminNavigation();
  const setRailCollapsed = (value: boolean) => { setCollapsed(value); localStorage.setItem('adminRailCollapsed', String(value)); };
  const persona = { ...internalPersonas[0], permissions: account?.status.canEdit === false ? internalPersonas[0].permissions.filter(permission => permission.endsWith('.read')) : internalPersonas[0].permissions };

  if (!location.pathname.startsWith("/admin-center/library")) {
    return <Navigate to={`/admin-center/library${location.search}`} replace />;
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar sx={{ minHeight: { xs: 64, md: 68 }, gap: { xs: 1, sm: 2 } }}>
          <Box sx={{ width: { md: expandedRailWidth - 24 }, flexShrink: 0, display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box component="img" src="/logo.svg" alt="New York Life" sx={{ width: 40, height: 40, flexShrink: 0 }} />
            <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1.2 }}>
              GMAD Portal
            </Typography>
            <Typography variant="caption" color="text.secondary">Administration Center</Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", alignItems: "stretch" }}>
        <Box
          component="nav"
          aria-label="Admin Center"
          sx={{
            width: railWidth,
            flexShrink: 0,
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            position: "sticky", top: 68, height: "calc(100vh - 68px)", overflow: "hidden", transition: "width 160ms ease",
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
            minHeight: "calc(100vh - 68px)",
            py: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', px: 1 }}>
            <IconButton size="small" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setRailCollapsed(!collapsed)}><Typography aria-hidden="true">{collapsed ? '›' : '‹'}</Typography></IconButton>
          </Box>
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {adminNavigation.map((group, groupIndex) => (
            <Box key={group.label}>
              {groupIndex > 0 && <Divider sx={{ my: 1 }} />}
              <Typography variant="overline" color="text.secondary" sx={{ display: collapsed ? "none" : "block", px: 2.25, fontSize: "0.65rem", fontWeight: 800 }}>
                {group.label}
              </Typography>
              <List dense disablePadding>
                {group.items.map((item) => {
                  const selected = item.path === "/admin-center"
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);
                  return (
                    <Tooltip key={item.path} title={collapsed ? item.label : ""} placement="right"><ListItemButton aria-label={item.label} component={item.external ? "a" : RouterLink} {...(item.external ? { href: item.path, target: "_blank", rel: "noopener noreferrer" } : { to: item.path })} selected={selected} sx={{ mx: 1, borderRadius: 1.5, px: collapsed ? 1.5 : 2 }}>
                      <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34 }}><item.icon fontSize="small" /></ListItemIcon>
                      {!collapsed && <ListItemText primary={item.label} slotProps={{ primary: { variant: "body2", fontWeight: selected ? 700 : 500 } }} />}
                    </ListItemButton></Tooltip>
                  );
                })}
              </List>
            </Box>
          ))}
          </Box>
          <Box role="separator" aria-label="Resize sidebar" aria-orientation="vertical" aria-valuemin={64} aria-valuemax={228} aria-valuenow={railWidth} tabIndex={0}
            onKeyDown={event => { if (event.key === 'ArrowLeft') setRailCollapsed(true); if (event.key === 'ArrowRight') setRailCollapsed(false); }}
            onPointerDown={event => { dragStart.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerMove={event => { if (dragStart.current !== null) { const delta = event.clientX - dragStart.current; if (Math.abs(delta) > 36) { setRailCollapsed(delta < 0); dragStart.current = event.clientX; } } }}
            onPointerUp={() => { dragStart.current = null; }} onPointerCancel={() => { dragStart.current = null; }}
            sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 7, cursor: 'ew-resize', touchAction: 'none', '&:hover, &:focus-visible': { bgcolor: 'primary.light' } }} />
        </Box>

        <Box component="main" sx={{ minWidth: 0, flex: 1 }}>
          {import.meta.env.VITE_STANDALONE_HTML && <Alert severity="info">Local prototype. Demo changes stay in this browser. Shared accounts, publishing, and external resources require their online services.</Alert>}
          <Box sx={{ display: { xs: "flex", md: "none" }, overflowX: "auto", bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 1 }}>
            {adminNavigation.flatMap((group) => group.items).map((item) => (
              <ListItemButton key={item.path} component={item.external ? "a" : RouterLink} {...(item.external ? { href: item.path, target: "_blank", rel: "noopener noreferrer" } : { to: item.path })} selected={location.pathname === item.path} sx={{ minWidth: "max-content" }}>
                <ListItemText primary={item.label} slotProps={{ primary: { variant: "caption", fontWeight: 700 } }} />
              </ListItemButton>
            ))}
          </Box>
          <Outlet context={{ persona } satisfies AdminCenterContext} />
        </Box>
      </Box>
    </Box>
  );
}

export default function AdminCenterShell() {
  // Applicant single-page breakpoints must not change the administration layout.
  const adminTheme = useMemo(() => createAppTheme(getActiveClient().theme), []);
  return <ThemeProvider theme={adminTheme}>
    {import.meta.env.VITE_MOCK_PLATFORM_ENABLED ? <MockAdminGate><AdminCenterContent /></MockAdminGate> : <AdminCenterContent />}
  </ThemeProvider>;
}

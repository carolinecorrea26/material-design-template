import { useMemo, useState } from "react";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { adminNavigation } from "../../admin/navigation";
import { internalPersonas, type Persona } from "../../admin/access";

export type AdminCenterContext = { persona: Persona };
const railWidth = 228;

export default function AdminCenterShell() {
  const location = useLocation();
  const [personaId, setPersonaId] = useState("portal-admin");
  const persona = useMemo(
    () => internalPersonas.find((entry) => entry.id === personaId) ?? internalPersonas[0],
    [personaId],
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Toolbar sx={{ minHeight: { xs: 64, md: 68 }, gap: 2 }}>
          <Box sx={{ width: { md: railWidth - 24 }, flexShrink: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1.2 }}>
              Admin Center
            </Typography>
            <Typography variant="caption" color="text.secondary">Internal operations</Typography>
          </Box>
          <TextField
            size="small"
            placeholder="Search sites, changes, releases…"
            aria-label="Global search"
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
            sx={{ display: { xs: "none", md: "block" }, width: "min(440px, 35vw)" }}
          />
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", lg: "block" } }}>View as</Typography>
            <FormControl size="small" sx={{ minWidth: { xs: 150, sm: 190 } }}>
              <InputLabel id="internal-persona-label">Internal persona</InputLabel>
              <Select
                labelId="internal-persona-label"
                value={personaId}
                label="Internal persona"
                onChange={(event) => setPersonaId(event.target.value)}
              >
                {internalPersonas.map((entry) => <MenuItem key={entry.id} value={entry.id}>{entry.label}</MenuItem>)}
              </Select>
            </FormControl>
            <Tooltip title="Notifications (future)"><span><IconButton disabled aria-label="Notifications"><NotificationsNoneRoundedIcon /></IconButton></span></Tooltip>
            <Tooltip title={persona.label}><IconButton aria-label={`Current persona: ${persona.label}`}><AccountCircleOutlinedIcon /></IconButton></Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", alignItems: "stretch" }}>
        <Box
          component="nav"
          aria-label="Admin Center"
          sx={{
            width: railWidth,
            flexShrink: 0,
            display: { xs: "none", md: "block" },
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
            minHeight: "calc(100vh - 68px)",
            py: 1.5,
          }}
        >
          {adminNavigation.map((group, groupIndex) => (
            <Box key={group.label}>
              {groupIndex > 0 && <Divider sx={{ my: 1 }} />}
              <Typography variant="overline" color="text.secondary" sx={{ px: 2.25, fontSize: "0.65rem", fontWeight: 800 }}>
                {group.label}
              </Typography>
              <List dense disablePadding>
                {group.items.map((item) => {
                  const selected = item.path === "/admin-center"
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);
                  return (
                    <ListItemButton key={item.path} component={RouterLink} to={item.path} selected={selected} sx={{ mx: 1, borderRadius: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 34 }}><item.icon fontSize="small" /></ListItemIcon>
                      <ListItemText primary={item.label} slotProps={{ primary: { variant: "body2", fontWeight: selected ? 700 : 500 } }} />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          ))}
        </Box>

        <Box component="main" sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: { xs: "flex", md: "none" }, overflowX: "auto", bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 1 }}>
            {adminNavigation.flatMap((group) => group.items).map((item) => (
              <ListItemButton key={item.path} component={RouterLink} to={item.path} selected={location.pathname === item.path} sx={{ minWidth: "max-content" }}>
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

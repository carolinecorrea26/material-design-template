import { useState } from "react";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import { Box, Card, CardActionArea, Stack, Tab, Tabs, Typography } from "@mui/material";
import { getStorybookUrl } from "../config/storybook";
import ThemeConfigurationPreview from "../components/docs/ThemeConfigurationPreview";

type DesignSystemTab = "storybook" | "theme";

export default function DesignSystem() {
  const [activeTab, setActiveTab] = useState<DesignSystemTab>("storybook");
  return <Box sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, md: 4 }, width: "100vw", maxWidth: "100vw", ml: "calc(-50vw + 50%)", boxSizing: "border-box" }}>
    <Stack spacing={3} sx={{ maxWidth: 1600, mx: "auto" }}>
      <Box><Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>Design System</Typography><Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 900 }}>Open the visual component documentation in Storybook or preview approved and custom Client theme colors against the demo application.</Typography></Box>
      <Tabs value={activeTab} onChange={(_, value: DesignSystemTab) => setActiveTab(value)} aria-label="Design system sections" sx={{ borderBottom: 1, borderColor: "divider" }}><Tab value="storybook" label="Storybook" /><Tab value="theme" label="Theme Configuration" /></Tabs>
      {activeTab === "storybook" ? <Card variant="outlined" sx={{ maxWidth: 900 }}><CardActionArea component="a" href={getStorybookUrl()} target="_blank" rel="noopener noreferrer" sx={{ p: { xs: 3, md: 5 } }}><Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ sm: "center" }}><Box sx={{ width: 88, height: 88, borderRadius: 4, bgcolor: "background.default", color: "primary.main", display: "grid", placeItems: "center", flexShrink: 0 }}><AutoStoriesRoundedIcon sx={{ fontSize: 46 }} /></Box><Box sx={{ flex: 1 }}><Typography variant="h4" component="h2">Explore components in Storybook</Typography><Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>Storybook demonstrates reusable components and their states. Portal Library owns design foundations, branding guidelines, accessibility guidance and site requirements.</Typography><Typography variant="subtitle2" color="primary" sx={{ mt: 2, display: "flex", alignItems: "center", gap: 0.75 }}>Open Storybook <LaunchRoundedIcon fontSize="small" /></Typography></Box></Stack></CardActionArea></Card> : <ThemeConfigurationPreview />}
    </Stack>
  </Box>;
}

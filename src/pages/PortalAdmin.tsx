import { useState } from "react";
import type { ComponentType } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import ProjectStatusChip from "../components/docs/ProjectStatusChip";
import { getPagePath } from "../config/pages";
import {
  portalProjectSummaries,
  type ProjectStatus,
  type ProjectSummary,
} from "../content/docs/portalProject";
import {
  getAssociationsForClient,
  getClientsForTpa,
  getSitesForClient,
  tpaEntities,
} from "../data";
import ResponsiveTableContainer from "../components/docs/ResponsiveTableContainer";

type PortalTab = "information" | "projects";

type PortalInfoCard = {
  id: string;
  title: string;
  description: string;
  Icon: ComponentType<{ color?: "primary" }>;
  path: string;
};

const portalInfoCards: PortalInfoCard[] = [
  {
    id: "site-features",
    title: "Site Features",
    description: "Supported site capabilities, configuration options, and related documentation.",
    Icon: ExtensionRoundedIcon,
    path: getPagePath("site-features"),
  },
  {
    id: "site-details",
    title: "Site Details",
    description: "Pages, fields, flows, rules, and global/client configuration.",
    Icon: AccountTreeRoundedIcon,
    path: getPagePath("site-details"),
  },
  {
    id: "design-system",
    title: "Design System",
    description: "Storybook documentation and interactive client theme previews.",
    Icon: PaletteRoundedIcon,
    path: getPagePath("design-system"),
  },
  {
    id: "cms",
    title: "CMS",
    description: "Content management reference for global defaults and client overrides.",
    Icon: ArticleRoundedIcon,
    path: getPagePath("cms"),
  },
  {
    id: "email-templates",
    title: "Email Templates",
    description: "Consumer and advisor email templates, flows, and configuration.",
    Icon: EmailOutlinedIcon,
    path: getPagePath("mock-email-preview"),
  },
];

const projectPageIds: Record<string, "portal-template-project" | "portal-requirements-project"> = {
  "portal-template-project": "portal-template-project",
  "portal-requirements-project": "portal-requirements-project",
};

const kanbanColumns: { status: ProjectStatus; label: string }[] = [
  { status: "completed", label: "Completed" },
  { status: "in-progress", label: "In Progress" },
  { status: "not-started", label: "Not Started" },
];

function ProjectCard({ project }: { project: ProjectSummary }) {
  const pageId = projectPageIds[project.id];
  const path = pageId ? getPagePath(pageId) : undefined;

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardActionArea {...(path ? { component: RouterLink, to: path } : {})}>
        <CardContent>
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
                <FolderRoundedIcon color="primary" fontSize="small" sx={{ mt: 0.25 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {project.name}
                </Typography>
              </Stack>
              <ProjectStatusChip status={project.status} />
            </Stack>

            <Typography variant="caption" color="text.secondary">
              {project.description}
            </Typography>

            {project.targetDate && (
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Target: {project.targetDate}
              </Typography>
            )}

            {path && (
              <Typography
                variant="caption"
                color="primary"
                sx={{ display: "flex", alignItems: "center", gap: 0.5, fontWeight: 700 }}
              >
                View project resources <LaunchRoundedIcon fontSize="inherit" />
              </Typography>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function PortalAdmin() {
  const [activeTab, setActiveTab] = useState<PortalTab>("information");

  return (
    <Box
      sx={{
        py: { xs: 3, md: 5 },
        px: { xs: 2, md: 4 },
        width: "100vw",
        maxWidth: "100vw",
        ml: "calc(-50vw + 50%)",
        boxSizing: "border-box",
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "flex-start" }} justifyContent="space-between">
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
                Portal Admin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Documentation and administration hub for the Portal template.
              </Typography>
            </Box>
            <Button component={RouterLink} to="/admin-center" variant="contained" endIcon={<ArrowForwardRoundedIcon />}>
              Explore New Admin Center
            </Button>
          </Stack>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, value: PortalTab) => setActiveTab(value)}
          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Tab value="information" label="Portal Information" />
          <Tab value="projects" label="Portal Projects" />
        </Tabs>

        {activeTab === "information" && (
          <Stack spacing={3}>
            <Box
              component="section"
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(5, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {portalInfoCards.map((card) => (
              <Card key={card.id} variant="outlined" sx={{ borderRadius: 3 }}>
                <CardActionArea component={RouterLink} to={card.path} sx={{ height: "100%" }}>
                  <CardContent>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <card.Icon color="primary" />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {card.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {card.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75, fontWeight: 700 }}
                        >
                          Open <ArrowForwardRoundedIcon fontSize="inherit" />
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
              ))}
            </Box>

            <Box component="section">
              <Typography variant="h5" component="h2" sx={{ fontWeight: 800, mb: 0.5 }}>
                TPA → Client → Site hierarchy
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Canonical administration identities. Provisional compatibility TPAs are clearly
                marked until authoritative TPA records are supplied.
              </Typography>
              <ResponsiveTableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>TPA ID</TableCell>
                      <TableCell>TPA Name</TableCell>
                      <TableCell>Acronym</TableCell>
                      <TableCell>Client Count</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Clients / Sites / Associations</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tpaEntities.map((tpa) => {
                      const clients = getClientsForTpa(tpa.id);
                      return (
                        <TableRow key={tpa.id}>
                          <TableCell sx={{ fontFamily: "monospace" }}>{tpa.id}</TableCell>
                          <TableCell>{tpa.name}</TableCell>
                          <TableCell>{tpa.acronym ?? "—"}</TableCell>
                          <TableCell>{clients.length}</TableCell>
                          <TableCell>
                            {[tpa.support?.contactName, tpa.support?.email, tpa.support?.phoneDisplay]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </TableCell>
                          <TableCell>
                            {clients.map((client) =>
                              `${client.acronym}: ${getSitesForClient(client.id).length} site(s), ${getAssociationsForClient(client.id).length} association(s)`,
                            ).join("; ")}
                          </TableCell>
                          <TableCell>{tpa.provisional ? "Provisional" : "Confirmed"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ResponsiveTableContainer>
            </Box>
          </Stack>
        )}

        {activeTab === "projects" && (
          <Box
            component="section"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" },
              gap: 2,
              alignItems: "start",
            }}
          >
            {kanbanColumns.map((column) => {
              const projects = portalProjectSummaries.filter((project) => project.status === column.status);
              return (
                <Box
                  key={column.status}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "action.hover",
                    minHeight: 220,
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {column.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {projects.length}
                      </Typography>
                    </Stack>
                    {projects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                    {projects.length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        No projects.
                      </Typography>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        )}
      </Stack>
    </Box>
  );
}

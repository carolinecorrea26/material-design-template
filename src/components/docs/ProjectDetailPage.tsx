import { useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import DocsSidebarNav from "./DocsSidebarNav";
import ProjectCompletionRing from "./ProjectCompletionRing";
import ProjectStatusChip from "./ProjectStatusChip";
import { getProjectCompletion, type ProjectSummary } from "../../content/docs/portalProject";

export type RequirementsTab = {
  id: string;
  label: string;
  content: ReactNode;
};

type ProjectDetailPageProps = {
  project: ProjectSummary;
  requirementsTabs: RequirementsTab[];
  timelineContent: ReactNode;
};

const toc = [
  { id: "overview-section", label: "Overview" },
  { id: "requirements-section", label: "Requirements" },
  { id: "timeline-section", label: "Timeline / Milestones" },
];

function SectionBlock({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Accordion
      id={id}
      defaultExpanded
      disableGutters
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "24px !important",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRoundedIcon />}
        sx={{
          px: { xs: 2, md: 3 },
          py: 1,
          backgroundColor: "background.subtle",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>{children}</AccordionDetails>
    </Accordion>
  );
}

export default function ProjectDetailPage({
  project,
  requirementsTabs,
  timelineContent,
}: ProjectDetailPageProps) {
  const completion = getProjectCompletion(project.milestones);
  const [activeTab, setActiveTab] = useState(0);
  const currentTab = requirementsTabs[activeTab] ?? requirementsTabs[0];

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
          <Chip
            label="Internal prototype documentation"
            color="error"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <FolderRoundedIcon color="primary" />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
              {project.name}
            </Typography>
            <ProjectStatusChip status={project.status} />
          </Stack>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 920 }}>
            {project.description}
          </Typography>
          {project.targetDate && (
            <Typography variant="body2" sx={{ fontWeight: 700, mt: 1 }}>
              Target: {project.targetDate}
            </Typography>
          )}
        </Box>

        <Card
          id="table-of-contents"
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "24px",
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
            display: { xs: "block", md: "none" },
          }}
        >
          <CardContent>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
              Table of contents
            </Typography>
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={{ mt: 2 }}>
              {toc.map((item) => (
                <Chip
                  key={item.id}
                  component="a"
                  href={`#${item.id}`}
                  clickable
                  label={item.label}
                  variant="outlined"
                />
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
          <DocsSidebarNav items={toc} />
          <Stack spacing={3} sx={{ flex: 1, minWidth: 0 }}>
            <SectionBlock id="overview-section" title="Overview">
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={3}
                alignItems={{ sm: "center" }}
              >
                <ProjectCompletionRing percent={completion?.percent ?? null} />
                <Box>
                  {completion ? (
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        {completion.completed} of {completion.total} milestones complete
                      </Typography>
                      {completion.nextMilestone && (
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          Next: {completion.nextMilestone.name} — {completion.nextMilestone.targetDate}
                        </Typography>
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No tasks tracked yet.
                    </Typography>
                  )}
                </Box>
              </Stack>
            </SectionBlock>

            <SectionBlock id="requirements-section" title="Requirements">
              <Stack spacing={2}>
                <Tabs
                  value={activeTab}
                  onChange={(_, value) => setActiveTab(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="Requirements subsections"
                  sx={{ borderBottom: "1px solid", borderColor: "divider" }}
                >
                  {requirementsTabs.map((tab, index) => (
                    <Tab
                      key={tab.id}
                      label={tab.label}
                      id={`requirements-tab-${tab.id}`}
                      aria-controls={`requirements-tabpanel-${tab.id}`}
                      value={index}
                    />
                  ))}
                </Tabs>
                {currentTab && (
                  <Box
                    role="tabpanel"
                    id={`requirements-tabpanel-${currentTab.id}`}
                    aria-labelledby={`requirements-tab-${currentTab.id}`}
                  >
                    {currentTab.content}
                  </Box>
                )}
              </Stack>
            </SectionBlock>

            <SectionBlock id="timeline-section" title="Timeline / Milestones">
              {timelineContent}
            </SectionBlock>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

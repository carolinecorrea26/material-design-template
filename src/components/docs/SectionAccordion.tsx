import type { ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { CLIENT_HIGHLIGHT_BG, CLIENT_HIGHLIGHT_BORDER } from "./ClientNote";

export default function SectionAccordion({
  id,
  title,
  description,
  count,
  overrideCount,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  count?: number;
  /** Number of rows/items in this section that differ for the active client — rendered as a yellow chip. */
  overrideCount?: number;
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
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            {count != null && <Chip label={count} size="small" />}
            {overrideCount != null && overrideCount > 0 && (
              <Chip
                label={`${overrideCount} client override${overrideCount === 1 ? "" : "s"}`}
                size="small"
                sx={{
                  bgcolor: CLIENT_HIGHLIGHT_BG,
                  borderColor: CLIENT_HIGHLIGHT_BORDER,
                  color: "#5c4a00",
                  border: "1px solid",
                  fontWeight: 600,
                }}
              />
            )}
          </Stack>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: { xs: 2, md: 3 } }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

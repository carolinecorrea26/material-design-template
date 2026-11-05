import { useId, useState } from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import QuickDecisionIcon from "../coverage/QuickDecisionIcon";
import QuickDecisionDrawerContent, {
  InlineDrawerLink,
  QuickDecisionMark,
} from "./QuickDecisionExplainer";

/**
 * Reusable QuickDecision info panel shown on the Coverage page,
 * landing page coverage options section, and app menu coverage drawer.
 */
export default function QuickDecisionInfoBox() {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  const toggleExpanded = () => setExpanded((prev) => !prev);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        p: 2,
        mb: 2,
        borderRadius: 2,
        bgcolor: (t) => alpha(t.palette.success.main, 0.08),
      }}
    >
      <QuickDecisionIcon color="success" sx={{ mt: 0.25, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          <Typography
            component="span"
            variant="body2"
            sx={{ fontWeight: 700, color: "success.main" }}
          >
            <QuickDecisionMark />
          </Typography>{" "}
          available! Get a decision instantly or within a few days without a
          medical exam.{" "}
          <InlineDrawerLink
            aria-expanded={expanded}
            aria-controls={contentId}
            onClick={toggleExpanded}
          >
            {expanded ? "Show less" : "Show more"}
          </InlineDrawerLink>
        </Typography>

        {expanded && (
          <Box id={contentId} sx={{ mt: 1.5 }}>
            <QuickDecisionDrawerContent plainMark />
          </Box>
        )}
      </Box>
    </Box>
  );
}

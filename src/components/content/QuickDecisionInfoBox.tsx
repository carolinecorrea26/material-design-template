import { useState } from "react";
import { Box, Typography } from "@mui/material";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import QuickDecisionDrawerContent, {
  QuickDecisionMark,
} from "./QuickDecisionExplainer";

/**
 * Reusable QuickDecision info panel shown on the Coverage page,
 * landing page coverage options section, and app menu coverage drawer.
 */
export default function QuickDecisionInfoBox() {
  const [expanded, setExpanded] = useState(false);

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
        backgroundColor: "success.light",
        bgcolor: (t) => `${t.palette.success.main}14`,
      }}
    >
      <OfflineBoltIcon color="success" sx={{ mt: 0.25, flexShrink: 0 }} />
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
          <Typography
            component="span"
            role="button"
            tabIndex={0}
            onClick={toggleExpanded}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleExpanded();
              }
            }}
            sx={{
              color: "primary.main",
              textDecoration: "underline",
              textUnderlineOffset: "0.12em",
              cursor: "pointer",
              font: "inherit",
              lineHeight: "inherit",
            }}
          >
            {expanded ? "Show less" : "Show more"}
          </Typography>
        </Typography>

        {expanded && (
          <Box sx={{ mt: 1.5 }}>
            <QuickDecisionDrawerContent plainMark />
          </Box>
        )}
      </Box>
    </Box>
  );
}

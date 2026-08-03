import { Box, Typography } from "@mui/material";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import { QuickDecisionMark } from "./QuickDecisionExplainer";

type QuickDecisionInfoBoxProps = {
  onLearnMore?: () => void;
};

/**
 * Reusable QuickDecision info panel shown on the Coverage page,
 * landing page coverage options section, and app menu coverage drawer.
 */
export default function QuickDecisionInfoBox({
  onLearnMore,
}: QuickDecisionInfoBoxProps) {
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
      <Typography variant="body2" color="text.secondary">
        <Typography
          component="span"
          variant="body2"
          sx={{ fontWeight: 700, color: "success.main" }}
        >
          <QuickDecisionMark />
        </Typography>{" "}
        helps many applicants receive a decision instantly or within a few days
        without a medical exam. This starts with health questions you answer
        online to reduce time needed with phone calls or other follow up.{" "}
        {onLearnMore && (
          <Typography
            component="span"
            role="button"
            tabIndex={0}
            onClick={onLearnMore}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onLearnMore();
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
            Learn more about this process.
          </Typography>
        )}
      </Typography>
    </Box>
  );
}

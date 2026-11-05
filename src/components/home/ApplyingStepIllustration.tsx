import { Box } from "@mui/material";
import apply from "../../assets/applying/apply.svg?raw";
import health from "../../assets/applying/health.svg?raw";
import decision from "../../assets/applying/decision.svg?raw";

const illustrations = { apply, health, decision };
/** Trusted bundled vector artwork inherits the active application/preview palette. */
export default function ApplyingStepIllustration({ image, label }: { image: keyof typeof illustrations; label: string }) {
  return <Box role="img" aria-label={label} data-illustration={image} dangerouslySetInnerHTML={{ __html: illustrations[image] }} sx={theme => ({
    width: 160, maxWidth: "100%", height: 120, justifySelf: "center",
    "--illustration-primary": theme.palette.primary.main,
    "--illustration-error": theme.palette.error.main,
    "& svg": { display: "block", width: "100%", height: "100%" },
  })} />;
}

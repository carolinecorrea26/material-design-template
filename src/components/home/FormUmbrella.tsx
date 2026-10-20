import { Box } from "@mui/material";
import { keyframes, lighten } from "@mui/material/styles";

const blink = keyframes`
  0%, 30%, 32%, 78%, 80%, 100% { transform: scaleY(1); }
  31%, 79% { transform: scaleY(0.08); }
`;

/** A stationary canopy and long pole reveal a cat's tail at the page bottom. */
export default function FormUmbrella() {
  return (
    <Box aria-hidden="true" data-umbrella-scene sx={{
      position: "absolute", top: "calc(50vh - 80px)", bottom: 0, right: 0,
      width: "clamp(200px, calc((100vw - 800px) / 2), 380px)",
      pointerEvents: "none", display: "none", color: "primary.main",
      flexDirection: "column", alignItems: "center",
      // Single-page forms use mobile theme breakpoints even on desktop.
      "@media (min-width: 1200px)": { display: "flex" },
    }}>
      <Box component="svg" data-held-umbrella viewBox="0 0 400 210" sx={{ width: "100%", flexShrink: 0, display: "block" }}>
        <path d="M200 12V210" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <Box component="path" d="M20 180C76-28 324-28 380 180Z" sx={theme => ({ fill: lighten(theme.palette.primary.main, 0.78) })} />
        <Box component="path" d="M20 180H380L355 188H45Z" sx={theme => ({ fill: lighten(theme.palette.primary.main, 0.6) })} />
      </Box>
      <Box data-umbrella-pole sx={{ width: "2%", flex: 1, minHeight: "60vh", bgcolor: "primary.main", mt: "-1px", mb: "-1px" }} />
      <Box component="svg" data-umbrella-cat viewBox="0 100 200 75" sx={{ width: "100%", flexShrink: 0, display: "block", color: "primary.dark", fill: "currentColor" }}>
        <path d="M100 100C100 120 140 112 140 138C140 157 130 168 111 168" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <g transform="translate(67 112) scale(0.35)">
          <path d="M49 180V140C49 110 65 94 92 94C119 94 135 110 135 140V180Z" />
          <circle cx="49" cy="172" r="8" />
          <circle cx="135" cy="172" r="8" />
          <path d="M58 71L56 29L82 47L105 47L128 29L129 73Z" />
          <ellipse cx="93" cy="76" rx="38" ry="35" />
          <Box component="path" d="M63 77C63 60 81 61 93 77C105 61 123 60 123 77C123 96 109 104 93 104C77 104 63 96 63 77Z" sx={theme => ({ fill: lighten(theme.palette.primary.main, 0.78) })} />
          <Box component="g" sx={{
            transformBox: "fill-box", transformOrigin: "center",
            animation: `${blink} 14s ease-in-out infinite`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}>
            <circle cx="78" cy="79" r="2.3" />
            <circle cx="108" cy="79" r="2.3" />
          </Box>
          <path d="M88 85Q93 82 98 85L93 90Z" />
          <path d="M93 89V93M84 93Q88 99 93 93Q98 99 102 93" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </Box>
    </Box>
  );
}

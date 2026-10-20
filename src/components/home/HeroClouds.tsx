import { useState } from "react";
import { Box } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";

const drift = keyframes`
  0% { left: 0%; transform: translateX(-100%); }
  100% { left: 100%; transform: translateX(0%); }
`;
const rainfall = keyframes`
  0% { transform: translateY(0); opacity: 0; }
  12%, 75% { opacity: 1; }
  100% { transform: translateY(440px); opacity: 0; }
`;

const cloudSizes = [300, 190, 380, 240];

/** Each cloud carries its own rain and crosses the viewport before reversing. */
export default function HeroClouds() {
  const [clouds] = useState(() => cloudSizes.map((width, index) => ({
    width,
    top: [16, 0, 65, 155][index],
    duration: 85 + Math.random() * 55,
    phase: [0.22, 0.72, 1.42, 1.82][index],
    drops: Array.from({ length: 9 }, () => ({
      left: 8 + Math.random() * 84,
      duration: 4 + Math.random() * 3,
      delay: -Math.random() * 7,
      height: 4 + Math.random() * 3,
    })),
  })));

  return (
    <Box aria-hidden="true" data-hero-weather sx={{
      position: "absolute", top: 0, zIndex: -1, left: "50%", width: "100vw", height: 760,
      transform: "translateX(-50%)", overflow: "hidden", pointerEvents: "none",
      color: "primary.main",
    }}>
      {clouds.map((cloud, index) => (
        <Box key={index} data-hero-cloud sx={{
          position: "absolute", width: cloud.width, top: cloud.top,
          animation: `${drift} ${cloud.duration}s ease-in-out ${-cloud.duration * cloud.phase}s infinite alternate`,
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none", left: `${[3, 72, 38, 87][index]}%`, transform: "translateX(-50%)",
          },
        }}>
          <Box component="svg" viewBox="0 0 600 245" sx={theme => ({
            display: "block", width: "100%", position: "relative", zIndex: 1,
            fill: index === 1 ? "currentColor" : "#f0f1f3",
            stroke: alpha(theme.palette.text.primary, 0.35), strokeWidth: 0.8,
          })}>
            <path stroke="none" d="M20 228C25 151 82 106 157 114C231 0 373 0 448 116C524 111 573 161 580 228Z" />
            <path fill="none" d="M32 220C37 143 94 98 169 106C243 -8 385 -8 460 108C536 103 585 153 592 220" />
          </Box>
          <Box sx={{ position: "absolute", top: "91%", left: "8%", width: "84%" }}>
            {cloud.drops.map((drop, dropIndex) => (
              <Box key={dropIndex} sx={theme => ({
                position: "absolute", top: 0, zIndex: -1, left: `${drop.left}%`,
                width: "1px", height: drop.height, borderRadius: "1px",
                bgcolor: alpha(theme.palette.primary.main, 0.12), opacity: 0,
                animation: `${rainfall} ${drop.duration}s linear ${drop.delay}s infinite`,
                "@media (prefers-reduced-motion: reduce)": { animation: "none" },
              })} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

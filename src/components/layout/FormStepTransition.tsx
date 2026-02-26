import * as React from "react";
import { Box } from "@mui/material";
import { useLocation } from "react-router-dom";

interface FormStepTransitionProps {
  children: React.ReactNode;
  triggerKey?: string | number;
}

export default function FormStepTransition({
  children,
  triggerKey,
}: FormStepTransitionProps) {
  const location = useLocation();
  const key = `${location.pathname}-${triggerKey ?? "base"}`;

  return (
    <Box
      key={key}
      sx={{
        animation: "formStepTransition 220ms ease-out",
        transformOrigin: "top center",
        "@keyframes formStepTransition": {
          from: {
            opacity: 0,
            transform: "scale(0.98) translateY(8px)",
          },
          to: {
            opacity: 1,
            transform: "scale(1) translateY(0)",
          },
        },
      }}
    >
      {children}
    </Box>
  );
}

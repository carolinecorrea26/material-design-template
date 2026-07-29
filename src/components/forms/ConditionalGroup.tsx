import type { ReactNode } from "react";
import { Box } from "@mui/material";

type ConditionalGroupProps = {
  children: ReactNode;
};

/**
 * ConditionalGroup renders a left-bordered, indented container that visually
 * groups follow-up questions which are conditional on a prior answer.
 *
 * This is a pure visual wrapper — the parent is responsible for deciding
 * when to render it. It does not own show/hide logic.
 */
export default function ConditionalGroup({ children }: ConditionalGroupProps) {
  return (
    <Box
      sx={{
        ml: 1,
        mt: 1,
        px: 2,
        py: 0,
        borderLeft: "4px solid",
        borderLeftColor: "primary.main",
      }}
    >
      {children}
    </Box>
  );
}

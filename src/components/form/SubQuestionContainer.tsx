import type { ReactNode } from "react";
import { Box } from "@mui/material";

type SubQuestionContainerProps = {
  children: ReactNode;
};

export default function SubQuestionContainer({
  children,
}: SubQuestionContainerProps) {
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

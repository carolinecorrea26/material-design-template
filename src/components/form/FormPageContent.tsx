import type { ReactNode } from "react";
import { Box } from "@mui/material";

type FormPageContentProps = {
  children: ReactNode;
};

export default function FormPageContent({ children }: FormPageContentProps) {
  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: "#f5f6fa",
        borderRadius: 1.5,
        px: { xs: 2, sm: 3 },
        py: 3,
        boxShadow: "none",
      }}
    >
      {children}
    </Box>
  );
}

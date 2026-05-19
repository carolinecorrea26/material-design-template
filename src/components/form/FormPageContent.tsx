import type { ReactNode } from "react";
import { Box } from "@mui/material";

type FormPageContentProps = {
  children: ReactNode;
  noContainer?: boolean;
};

export default function FormPageContent({
  children,
  noContainer,
}: FormPageContentProps) {
  if (noContainer) {
    return <Box sx={{ width: "100%" }}>{children}</Box>;
  }

  return (
    <Box
      sx={{
        width: "100%",
        border: "1px solid",
        borderColor: "rgba(7, 104, 255, 0.14)",
        borderRadius: "32px",
        background:
          "linear-gradient(135deg, #f4f8ff 0%, #ffffff 52%, #f7fbff 100%)",
        boxShadow: "0 18px 40px rgba(52, 59, 72, 0.06)",
        px: { xs: 2, sm: 3 },
        py: 3,
      }}
    >
      {children}
    </Box>
  );
}

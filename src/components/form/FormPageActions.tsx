import type { ReactNode } from "react";
import { Box, Stack } from "@mui/material";

type FormPageActionsProps = {
  children: ReactNode;
};

export default function FormPageActions({ children }: FormPageActionsProps) {
  return (
    <Box>
      <Stack
        direction="row"
        spacing={1.5}
        justifyContent="flex-end"
        alignItems="center"
      >
        {children}
      </Stack>
    </Box>
  );
}

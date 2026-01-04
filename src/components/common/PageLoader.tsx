import * as React from "react";
import { Backdrop, CircularProgress, Box } from "@mui/material";

interface PageLoaderProps {
  open: boolean;
}

export function PageLoader({ open }: PageLoaderProps) {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.modal + 1,
        bgcolor: 'rgba(255, 255, 255, 0.9)'
      }}
      open={open}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    </Backdrop>
  );
}

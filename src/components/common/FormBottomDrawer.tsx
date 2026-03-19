import * as React from "react";
import {
  Box,
  IconButton,
  SwipeableDrawer,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

interface FormBottomDrawerProps {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  onOpen?: () => void;
  children: React.ReactNode;
  contentRef?: React.Ref<HTMLDivElement>;
  contentSx?: SxProps<Theme>;
}

export default function FormBottomDrawer({
  open,
  title,
  onClose,
  onOpen,
  children,
  contentRef,
  contentSx,
}: FormBottomDrawerProps) {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen ?? (() => {})}
    >
      <Box
        ref={contentRef}
        sx={{
          p: 3,
          maxHeight: "90vh",
          overflowY: "auto",
          ...contentSx,
        }}
      >
        <Box
          sx={{
            maxWidth: "750px",
            width: "100%",
            mx: "auto",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontSize: "1.25rem" }}>
              {title}
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: "text.secondary" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          {children}
        </Box>
      </Box>
    </SwipeableDrawer>
  );
}

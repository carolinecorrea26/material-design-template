import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";

type FormHelpDrawerProps = {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

export default function FormHelpDrawer({
  open,
  title,
  onClose,
  children,
}: FormHelpDrawerProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const anchor = isDesktop ? "right" : "bottom";

  return (
    <Drawer anchor={anchor} open={open} onClose={onClose}>
      <Box
        role="presentation"
        sx={{
          width:
            anchor === "right" ? { xs: "100vw", sm: 420, md: 480 } : "100%",
          height: anchor === "bottom" ? "75vh" : "100%",
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
          borderTopLeftRadius: anchor === "bottom" ? 12 : 0,
          borderTopRightRadius: anchor === "bottom" ? 12 : 0,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{
            px: 3,
            py: 2,
            // borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "white",
          }}
        >
          <Typography variant="h6">{title}</Typography>

          <IconButton onClick={onClose} aria-label="Close help drawer">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Box
          sx={{
            px: 3,
            pb: 3,
            pt: 1,
            overflowY: "auto",
            flex: 1,
            bgcolor: "white",
          }}
        >
          {children}
        </Box>
      </Box>
    </Drawer>
  );
}

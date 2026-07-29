import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Drawer,
  IconButton,
  Stack,
  SwipeableDrawer,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";

type AppDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** Optional title shown in the standard drawer header with a close button.
   *  Omit when the content manages its own header. */
  title?: ReactNode;
  /** Use SwipeableDrawer on mobile (recommended for user-initiated drawers). */
  swipeable?: boolean;
  children: ReactNode;
};

export default function AppDrawer({
  open,
  onClose,
  title,
  swipeable = false,
  children,
}: AppDrawerProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const anchor = isDesktop ? "right" : "bottom";

  const content = (
    <Box
      role="presentation"
      sx={{
        width: anchor === "right" ? { xs: "100vw", sm: 420, md: 480 } : "100%",
        height: anchor === "bottom" ? "75vh" : "100%",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        borderTopLeftRadius: anchor === "bottom" ? 12 : 0,
        borderTopRightRadius: anchor === "bottom" ? 12 : 0,
      }}
    >
      {title != null && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ px: 3, py: 2, borderColor: "divider", bgcolor: "white" }}
        >
          {typeof title === "string" ? (
            <Typography variant="h6">{title}</Typography>
          ) : (
            title
          )}
          <IconButton onClick={onClose} aria-label="Close drawer">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      )}
      <Box sx={{ px: 3, pb: 3, pt: title != null ? 1 : 3, overflowY: "auto", flex: 1, bgcolor: "white" }}>
        {children}
      </Box>
    </Box>
  );

  if (!isDesktop && swipeable) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        sx={{ "& .MuiDrawer-paper": { borderTopLeftRadius: 16, borderTopRightRadius: 16 } }}
      >
        {content}
      </SwipeableDrawer>
    );
  }

  return (
    <Drawer anchor={anchor} open={open} onClose={onClose}>
      {content}
    </Drawer>
  );
}

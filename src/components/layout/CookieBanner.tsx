import { Alert, Box, IconButton, Link, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { getContent } from "../../content";

type CookieBannerProps = {
  onClose: () => void;
};

export default function CookieBanner({ onClose }: CookieBannerProps) {
  const { message, learnMoreLabel, learnMoreHref } =
    getContent().shared.cookieBanner;

  return (
    <Alert
      severity="info"
      icon={false}
      sx={{
        borderRadius: 3,
        bgcolor: "rgb(37 43 56)",
        color: "common.white",
        position: "fixed",
        bottom: { xs: 16, sm: 16 },
        left: { xs: 16, sm: "auto" },
        right: { xs: 16, sm: 16 },
        zIndex: 1200,
        py: 2,
        px: 2,
        width: { xs: "auto", sm: "100%" },
        maxWidth: 510,
        boxShadow: 6,
        display: "flex",
        alignItems: "flex-start",
        "& .MuiAlert-message": {
          width: "100%",
          p: 0,
          fontSize: "0.875rem",
          display: "block",
        },
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            minWidth: 0,
            width: "100%",
          }}
        >
          <Box
            component="img"
            src="/logo.svg"
            alt="New York Life Logo"
            sx={{
              height: 48,
              width: "auto",
              flexShrink: 0,
              alignSelf: "flex-start",
              mt: 0.25,
            }}
          />

          <Typography
            variant="body2"
            sx={{
              flex: 1,
              minWidth: 0,
              color: "common.white",
              lineHeight: 1.5,
              textAlign: "justify",
            }}
          >
            {message}{" "}
            <Link
              href={learnMoreHref}
              target="_blank"
              rel="noreferrer"
              underline="always"
              color="inherit"
              sx={{ fontWeight: 500 }}
            >
              {learnMoreLabel}
            </Link>
          </Typography>

          <IconButton
            onClick={onClose}
            aria-label="Close cookie banner"
            size="small"
            sx={{
              color: "common.white",
              p: 0.5,
              flexShrink: 0,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Alert>
  );
}

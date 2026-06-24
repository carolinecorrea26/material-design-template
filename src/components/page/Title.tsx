import { Box, IconButton, Stack, Typography } from "@mui/material";
import ArrowBackIosRoundedIcon from "@mui/icons-material/ArrowBackIosRounded";
import type { ReactNode } from "react";

type FormPageTitleProps = {
  title: ReactNode;
  subhead?: ReactNode;
  onBack?: () => void;
};

export default function FormPageTitle({
  title,
  subhead,
  onBack,
}: FormPageTitleProps) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        {onBack && (
          <IconButton
            onClick={onBack}
            aria-label="Go back"
            sx={{ color: "#8fa1b9", ml: "-8px !important", p: 0.75 }}
          >
            <ArrowBackIosRoundedIcon sx={{ fontSize: "1rem" }} />
          </IconButton>
        )}
        <Typography variant="formPageTitle">{title}</Typography>
      </Stack>
      {subhead ? (
        <Typography component="p" variant="subtitle2">
          {subhead}
        </Typography>
      ) : null}
    </Box>
  );
}

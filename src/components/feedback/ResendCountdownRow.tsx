import { Box, Button, Stack, Typography } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { formatCountdown } from "../../utils/formatCountdown";

type ResendCountdownRowProps = {
  secondsLeft: number;
  kind: "link" | "code";
  onResend: () => void;
};

export default function ResendCountdownRow({
  secondsLeft,
  kind,
  onResend,
}: ResendCountdownRowProps) {
  const label = kind === "link" ? "Link" : "Code";
  return (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      justifyContent="space-between"
      sx={{ px: 0.5 }}
    >
      <Typography
        variant="body2"
        color={secondsLeft === 0 ? "error" : "text.secondary"}
        sx={{ fontSize: "0.8125rem" }}
      >
        {secondsLeft === 0 ? (
          `${label} expired`
        ) : (
          <>
            {label} expires in {" "}
            <Box component="span" sx={{ fontWeight: 700 }}>
              {formatCountdown(secondsLeft)}
            </Box>
          </>
        )}
      </Typography>
      <Button
        variant="text"
        size="small"
        startIcon={<RefreshRoundedIcon />}
        onClick={onResend}
        sx={{ textTransform: "none", fontSize: "0.8125rem" }}
      >
        Resend {kind}
      </Button>
    </Stack>
  );
}

import { requirementText } from "../../domain/requirementContent";
import { Box, Button, Stack, Typography } from "@mui/material";
import LoopRoundedIcon from "@mui/icons-material/LoopRounded";
import { formatCountdown } from "../../utils/formatCountdown";

type ResendCountdownRowProps = {
  secondsLeft: number;
  kind: "link" | "code";
  onResend: () => void;
  disabled?: boolean;
};

export default function ResendCountdownRow({
  secondsLeft,
  kind,
  onResend,
  disabled = false,
}: ResendCountdownRowProps) {
  const label = requirementText(kind === "link" ? "resume.feedback.link" : "resume.feedback.code");
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
      >
        {secondsLeft === 0 ? (
          requirementText('resume.feedback.expired', { kind: label })
        ) : (
          <>
            {requirementText('resume.feedback.expires-in', { kind: label })}
            <Box component="span" sx={{ fontWeight: 700 }}>
              {formatCountdown(secondsLeft)}
            </Box>
          </>
        )}
      </Typography>
      <Button
        variant="text"
        size="small"
        startIcon={<LoopRoundedIcon />}
        onClick={onResend}
        disabled={disabled}
      >
        {requirementText(kind === 'link' ? 'resume.feedback.resend-link' : 'resume.feedback.resend-code')}
      </Button>
    </Stack>
  );
}

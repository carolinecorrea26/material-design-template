import { useEffect, useState, type ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import MobilePreviewFrame from "../ui/MobilePreviewFrame";

export const APPLICATION_PREVIEW_STEPS = [
  "coverage",
  "health",
  "receipt",
] as const;

const APPLICATION_PREVIEW_SCENE_DURATION_MS = 4500;

export type ApplicationPreviewStep =
  (typeof APPLICATION_PREVIEW_STEPS)[number];

export type ApplicationPreviewProps = {
  activeStep: ApplicationPreviewStep;
  reducedMotion?: boolean;
};

export function useApplicationPreviewStep({
  reducedMotion,
  enabled = true,
}: {
  reducedMotion: boolean;
  enabled?: boolean;
}): ApplicationPreviewStep {
  const [activeStep, setActiveStep] =
    useState<ApplicationPreviewStep>("coverage");

  useEffect(() => {
    if (!enabled || reducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveStep((currentStep) => {
        const currentIndex = APPLICATION_PREVIEW_STEPS.indexOf(currentStep);
        return APPLICATION_PREVIEW_STEPS[
          (currentIndex + 1) % APPLICATION_PREVIEW_STEPS.length
        ];
      });
    }, APPLICATION_PREVIEW_SCENE_DURATION_MS);

    return () => window.clearInterval(timer);
  }, [enabled, reducedMotion]);

  return reducedMotion ? "coverage" : activeStep;
}

const sceneIn = keyframes`
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
`;

const reveal = keyframes`
  0%, 22% { opacity: 0; transform: translateY(5px); }
  38%, 100% { opacity: 1; transform: translateY(0); }
`;

function ProgressHeader({ current }: { current: number }) {
  return (
    <Stack spacing={0.75}>
      <Stack direction="row" justifyContent="space-between">
        <Typography sx={{ fontSize: 9, fontWeight: 800, color: "primary.main" }}>
          APPLICATION
        </Typography>
        <Typography sx={{ fontSize: 9, color: "text.secondary" }}>
          Step {current} of 3
        </Typography>
      </Stack>
      <Stack direction="row" spacing={0.5}>
        {[1, 2, 3].map((step) => (
          <Box
            key={step}
            sx={{
              height: 3,
              flex: 1,
              borderRadius: 99,
              bgcolor: step <= current ? "primary.main" : "divider",
            }}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function ChoicePill({
  children,
  selected = false,
  delay = 0,
  reducedMotion = false,
}: {
  children: ReactNode;
  selected?: boolean;
  delay?: number;
  reducedMotion?: boolean;
}) {
  return (
    <Box
      sx={(theme) => ({
        px: 1,
        py: 0.7,
        border: "1px solid",
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: 1.25,
        bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : "transparent",
        color: selected ? "primary.dark" : "text.secondary",
        fontSize: 10,
        lineHeight: 1,
        fontWeight: selected ? 800 : 600,
        opacity: reducedMotion || !selected ? 1 : 0,
        animation:
          !reducedMotion && selected
            ? `${reveal} 700ms ease-out ${delay}ms forwards`
            : "none",
      })}
    >
      {children}
    </Box>
  );
}

function CoverageScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Stack spacing={2}>
      <ProgressHeader current={1} />
      <Box>
        <Typography sx={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>
          Choose your coverage
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 10.5, color: "text.secondary" }}>
          Select an option that fits your needs.
        </Typography>
      </Box>
      <Box
        sx={(theme) => ({
          p: 1.5,
          border: "1px solid",
          borderColor: "primary.main",
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.045),
          boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.08)}`,
          opacity: reducedMotion ? 1 : 0,
          animation: reducedMotion
            ? "none"
            : `${reveal} 700ms ease-out 250ms forwards`,
        })}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.25,
              display: "grid",
              placeItems: "center",
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <FavoriteBorderRoundedIcon sx={{ fontSize: 16 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 800 }}>
              Life Insurance
            </Typography>
            <Typography sx={{ fontSize: 9.5, color: "text.secondary" }}>
              Applicant: You
            </Typography>
          </Box>
          <CheckRoundedIcon sx={{ fontSize: 17, color: "primary.main" }} />
        </Stack>
      </Box>
      <Box>
        <Typography sx={{ mb: 0.75, fontSize: 10, fontWeight: 700 }}>
          Coverage amount
        </Typography>
        <Stack direction="row" spacing={0.75}>
          <ChoicePill>$100K</ChoicePill>
          <ChoicePill selected delay={650} reducedMotion={reducedMotion}>
            $250K
          </ChoicePill>
          <ChoicePill>$500K</ChoicePill>
        </Stack>
      </Box>
      <Box
        sx={(theme) => ({
          p: 1.5,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          opacity: reducedMotion ? 1 : 0,
          animation: reducedMotion
            ? "none"
            : `${reveal} 700ms ease-out 1000ms forwards`,
        })}
      >
        <Typography sx={{ fontSize: 9.5, color: "text.secondary" }}>
          Estimated monthly premium
        </Typography>
        <Typography sx={{ mt: 0.25, fontSize: 18, fontWeight: 800, color: "primary.dark" }}>
          $24.60
          <Box component="span" sx={{ fontSize: 9.5, fontWeight: 500 }}>
            {" "}/ month
          </Box>
        </Typography>
      </Box>
    </Stack>
  );
}

function Question({
  children,
  delay,
  reducedMotion,
}: {
  children: ReactNode;
  delay: number;
  reducedMotion: boolean;
}) {
  return (
    <Box>
      <Typography sx={{ mb: 1, fontSize: 11, fontWeight: 700, lineHeight: 1.35 }}>
        {children}
      </Typography>
      <Stack direction="row" spacing={0.75}>
        <ChoicePill selected delay={delay} reducedMotion={reducedMotion}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CheckRoundedIcon sx={{ fontSize: 12 }} /> No
          </Stack>
        </ChoicePill>
        <ChoicePill>Yes</ChoicePill>
      </Stack>
    </Box>
  );
}

function HealthScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Stack spacing={2.25}>
      <ProgressHeader current={2} />
      <Box>
        <Typography sx={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>
          A few questions about your health
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 10.5, color: "text.secondary" }}>
          Your answers help us review your application.
        </Typography>
      </Box>
      <Question delay={350} reducedMotion={reducedMotion}>
        Have you been diagnosed with a serious medical condition?
      </Question>
      <Box sx={{ height: 1, bgcolor: "divider" }} />
      <Question delay={900} reducedMotion={reducedMotion}>
        Are you currently taking prescription medication?
      </Question>
      <Box
        sx={(theme) => ({
          mt: 0.5,
          height: 30,
          display: "grid",
          placeItems: "center",
          borderRadius: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: "primary.dark",
          fontSize: 10,
          fontWeight: 800,
        })}
      >
        Continue
      </Box>
    </Stack>
  );
}

function ReceiptScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Stack spacing={2.2} alignItems="center" sx={{ pt: 2.5, textAlign: "center" }}>
      <Box
        sx={(theme) => ({
          width: 58,
          height: 58,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          bgcolor: alpha(theme.palette.success.main, 0.12),
          color: "success.main",
          transform: reducedMotion ? "scale(1)" : "scale(0.65)",
          opacity: reducedMotion ? 1 : 0,
          animation: reducedMotion
            ? "none"
            : `${reveal} 650ms ease-out 180ms forwards`,
        })}
      >
        <CheckRoundedIcon sx={{ fontSize: 34 }} />
      </Box>
      <Box>
        <Typography sx={{ fontSize: 18, fontWeight: 800 }}>
          Application submitted
        </Typography>
        <Typography sx={{ mt: 0.75, fontSize: 10.5, color: "text.secondary", lineHeight: 1.45 }}>
          Thanks! We received your application and will keep you updated as it is reviewed.
        </Typography>
      </Box>
      <Box
        sx={{
          width: "100%",
          p: 1.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          textAlign: "left",
        }}
      >
        <Typography sx={{ fontSize: 9, color: "text.secondary" }}>
          Confirmation number
        </Typography>
        <Typography sx={{ mt: 0.25, fontSize: 12, fontWeight: 800 }}>
          NYL-482731
        </Typography>
      </Box>
      <Box
        sx={(theme) => ({
          width: "100%",
          p: 1.5,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.07),
          textAlign: "left",
          opacity: reducedMotion ? 1 : 0,
          animation: reducedMotion
            ? "none"
            : `${reveal} 700ms ease-out 750ms forwards`,
        })}
      >
        <Typography sx={{ fontSize: 10, fontWeight: 800, color: "primary.dark" }}>
          What happens next?
        </Typography>
        <Typography sx={{ mt: 0.4, fontSize: 9.5, color: "text.secondary", lineHeight: 1.4 }}>
          Watch your email for status updates and any next steps.
        </Typography>
      </Box>
    </Stack>
  );
}

export default function ApplicationPreview({
  activeStep,
  reducedMotion = false,
}: ApplicationPreviewProps) {
  return (
    <Box aria-hidden="true" sx={{ width: "100%", maxWidth: 300, mx: "auto" }}>
      <MobilePreviewFrame
        maxWidth={300}
        viewportHeight={450}
        frameColor="text.primary"
      >
        <Box
          key={activeStep}
          sx={{
            height: "100%",
            boxSizing: "border-box",
            px: 2.25,
            pt: 3.25,
            pb: 2,
            animation: reducedMotion ? "none" : `${sceneIn} 420ms ease-out`,
          }}
        >
          {activeStep === "coverage" && <CoverageScene reducedMotion={reducedMotion} />}
          {activeStep === "health" && <HealthScene reducedMotion={reducedMotion} />}
          {activeStep === "receipt" && <ReceiptScene reducedMotion={reducedMotion} />}
        </Box>
      </MobilePreviewFrame>
    </Box>
  );
}

export function AnimatedApplicationPreview({
  reducedMotion = false,
}: {
  reducedMotion?: boolean;
}) {
  const activeStep = useApplicationPreviewStep({ reducedMotion });

  return (
    <ApplicationPreview
      activeStep={activeStep}
      reducedMotion={reducedMotion}
    />
  );
}

import { useState, type ReactNode } from "react";
import { Box, Stack, Typography, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AppDrawer from "../layout/AppDrawer";
import QuickDecisionDrawerContent, {
  InlineDrawerLink,
  QuickDecisionMark,
} from "../content/QuickDecisionExplainer";
import { ApplicationReviewDrawerContent } from "../../content/helpContent";
import { getContent } from "../../content";
import ApplicationPreview, {
  APPLICATION_PREVIEW_STEPS,
  useApplicationPreviewStep,
} from "../home/ApplicationPreview";

const content = getContent();

type SubDrawerId = "application-review" | "quick-decision" | null;

export type HowApplyingWorksPanelProps = {
  variant: "page" | "drawer";
  onOpenApplicationReview?: () => void;
  onOpenQuickDecision?: () => void;
};

export default function HowApplyingWorksPanel({
  variant,
  onOpenApplicationReview,
  onOpenQuickDecision,
}: HowApplyingWorksPanelProps) {
  const [subDrawer, setSubDrawer] = useState<SubDrawerId>(null);
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
    { noSsr: true },
  );
  const applyingSteps = content.home.applyingSteps;
  const isDrawer = variant === "drawer";
  const displayedPreviewStep = useApplicationPreviewStep({
    reducedMotion: prefersReducedMotion,
    enabled: !isDrawer,
  });

  const openApplicationReview =
    variant === "drawer"
      ? () => setSubDrawer("application-review")
      : onOpenApplicationReview;
  const openQuickDecision =
    variant === "drawer"
      ? () => setSubDrawer("quick-decision")
      : onOpenQuickDecision;

  function stepBodyExtra(index: number): ReactNode {
    if (index === 1 && openApplicationReview) {
      return (
        <>
          {" "}
          <InlineDrawerLink onClick={openApplicationReview}>
            {content.home.reviewProcessLinkLabel}
          </InlineDrawerLink>
        </>
      );
    }

    if (index === 2 && openQuickDecision) {
      return (
        <>
          {" "}
          When{" "}
          <InlineDrawerLink onClick={openQuickDecision}>
            <QuickDecisionMark />
          </InlineDrawerLink>
          {content.home.quickDecisionAvailableSuffix}
        </>
      );
    }

    return null;
  }

  return (
    <>
      <Stack
        spacing={4}
        sx={(theme) => ({
          p: isDrawer ? 0 : { xs: 3, sm: 4, md: 5 },
          borderRadius: isDrawer ? 0 : 3,
          bgcolor: isDrawer
            ? "transparent"
            : alpha(theme.palette.success.main, 0.065),
        })}
      >
        {variant === "page" ? (
          <Stack spacing={1} sx={{ textAlign: { xs: "center", md: "left" } }}>
            <Typography variant="h2">
              {content.home.howApplyingWorks.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {content.home.howApplyingWorks.description}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {content.help.howApplyingWorks.intro}
          </Typography>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: isDrawer
              ? "1fr"
              : { xs: "1fr", md: "minmax(0, 1fr) minmax(280px, 380px)" },
            gap: isDrawer ? 0 : { xs: 5, md: 7 },
            alignItems: "center",
          }}
        >
          <Stack
            spacing={isDrawer ? 4 : 1.5}
            sx={{ order: 1 }}
          >
            {applyingSteps.map((step, index) => {
              const isActive =
                !isDrawer &&
                APPLICATION_PREVIEW_STEPS[index] === displayedPreviewStep;

              return (
                <Box
                  key={index}
                  sx={(theme) => ({
                    px: isDrawer ? 1.5 : 2,
                    py: isDrawer ? 0 : 1.75,
                    borderLeft: isDrawer ? 0 : "3px solid",
                    borderColor: isActive ? "primary.main" : "transparent",
                    borderRadius: isDrawer ? 0 : "0 12px 12px 0",
                    bgcolor: isActive
                      ? alpha(theme.palette.primary.main, 0.055)
                      : "transparent",
                    transition: prefersReducedMotion
                      ? "none"
                      : "background-color 240ms ease, border-color 240ms ease",
                  })}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        aria-hidden="true"
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          bgcolor: isActive ? "primary.main" : "background.iconBadge",
                          color: isActive ? "primary.contrastText" : "text.primary",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          flexShrink: 0,
                          transition: prefersReducedMotion
                            ? "none"
                            : "background-color 240ms ease, color 240ms ease",
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography
                        variant={isDrawer ? "h5" : "h4"}
                        color={isActive ? "primary.dark" : "text.primary"}
                      >
                        {step.title}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ pl: isDrawer ? 0 : 5.5 }}
                    >
                      {step.body}
                      {stepBodyExtra(index)}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          {!isDrawer && (
            <Box sx={{ order: 2 }}>
              <ApplicationPreview
                activeStep={displayedPreviewStep}
                reducedMotion={prefersReducedMotion}
              />
            </Box>
          )}
        </Box>
      </Stack>

      {variant === "drawer" && (
        <AppDrawer
          open={subDrawer !== null}
          title={
            subDrawer === "application-review"
              ? content.help.howApplyingWorks.subDrawerTitles.applicationReview
              : content.help.howApplyingWorks.subDrawerTitles.quickDecision
          }
          onClose={() => setSubDrawer(null)}
        >
          {subDrawer === "application-review" ? (
            <ApplicationReviewDrawerContent
              onOpenQuickDecision={() => setSubDrawer("quick-decision")}
            />
          ) : (
            <QuickDecisionDrawerContent />
          )}
        </AppDrawer>
      )}
    </>
  );
}

import { useState, type ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import AppDrawer from "../layout/AppDrawer";
import QuickDecisionDrawerContent, {
  InlineDrawerLink,
  QuickDecisionMark,
} from "../content/QuickDecisionExplainer";
import { ApplicationReviewDrawerContent } from "../../content/helpContent";
import { getContent } from "../../content";

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
  const applyingSteps = content.home.applyingSteps;
  const isDrawer = variant === "drawer";

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
      <Stack spacing={4}>
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

        <Stack spacing={6}>
          {applyingSteps.map((step, index) => (
            <Box
              key={index}
              sx={{
                padding: isDrawer ? "0 1.5rem" : { xs: "0 1.5rem", md: "0 2rem" },
              }}
            >
              <Stack
                direction={isDrawer ? "column" : { xs: "column", sm: "row" }}
                spacing={isDrawer ? 3 : { xs: 3, sm: 5 }}
                alignItems={
                  isDrawer ? "flex-start" : { xs: "flex-start", sm: "center" }
                }
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    alignSelf: isDrawer ? "center" : { xs: "center", sm: "auto" },
                  }}
                >
                  <Box
                    component="img"
                    src={step.imageSrc}
                    alt={step.imageAlt}
                    sx={{
                      display: "block",
                      width: isDrawer
                        ? "96px"
                        : { xs: "120px", sm: "100px", md: "120px" },
                      height: isDrawer
                        ? "96px"
                        : { xs: "120px", sm: "100px", md: "120px" },
                      objectFit: "contain",
                    }}
                  />
                </Box>

                <Box sx={{ width: "100%" }}>
                  <Stack spacing={1}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      justifyContent={
                        isDrawer ? "center" : { xs: "center", sm: "flex-start" }
                      }
                    >
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant={isDrawer ? "h5" : "h4"}>
                        {step.title}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        textAlign: isDrawer
                          ? "justify"
                          : { xs: "justify", sm: "left" },
                      }}
                    >
                      {step.body}
                      {stepBodyExtra(index)}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
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

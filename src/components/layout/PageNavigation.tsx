import {
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
} from "@mui/material";
import { Cached } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import * as React from "react";
import { PAGES } from "../../config/pages";
import { commonStyles } from "../../theme/commonStyles";
import { useLayout } from "../../state/LayoutContext";
import { useSinglePageLayout } from "../../deprecated/layouts/SinglePageLayout";
import { getClientFeatures } from "../../config/clients";
import { usePageLoading } from "../../state/PageLoadingContext";

interface PageNavigationProps {
  /**
   * If true, shows the back button.
   * @default true
   */
  showBack?: boolean;
  /**
   * Handler for when back is clicked.
   * If provided, overrides default back navigation.
   */
  onBack?: () => void;
  /**
   * If true, shows the continue button.
   * @default true
   */
  showContinue?: boolean;
  /**
   * Custom text for the continue button
   * @default "Continue"
   */
  continueText?: string;
  /**
   * If true, disables the continue button.
   */
  continueDisabled?: boolean;
  /**
   * Handler for when continue is clicked.
   * If not provided, the continue button will be type="submit"
   */
  onContinue?: () => void;
  /**
   * Explicit back path. If not provided, will be determined from page order
   */
  backPath?: string;
  /**
   * Function to check if form has unsaved changes
   * If returns true, will show confirmation dialog before navigating back
   */
  hasUnsavedChanges?: () => boolean;
}

export default function PageNavigation({
  showBack = true,
  onBack,
  showContinue = true,
  continueText = "Continue",
  continueDisabled = false,
  onContinue,
  backPath,
  hasUnsavedChanges,
}: PageNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { layoutMode } = useLayout();
  const singlePageContext = useSinglePageLayout();
  const features = getClientFeatures();
  const { isPageLoading } = usePageLoading();
  const [showBackConfirmDialog, setShowBackConfirmDialog] =
    React.useState(false);

  // Filter application pages based on client configuration
  const applicationPages = PAGES.filter((p) => {
    if (p.section !== "application") return false;

    // Filter out membership page if not enabled for this client
    if (p.path === "/membership" && !features.showMembershipPage) {
      return false;
    }

    return true;
  });

  // Find the current page in the flow
  const currentPath = location.pathname;
  const currentIndex = applicationPages.findIndex(
    (p) => p.path === currentPath,
  );

  // In single-page mode, use the context pageIndex; otherwise use currentIndex
  const effectiveIndex =
    singlePageContext.isSinglePage && singlePageContext.pageIndex !== undefined
      ? singlePageContext.pageIndex
      : currentIndex;

  // In single-page mode, hide back button on first page (index 0)
  const isFirstPage = effectiveIndex === 0;
  const shouldShowBack =
    showBack && !(layoutMode === "single-page" && isFirstPage);

  // Determine back path if not explicitly provided
  const defaultBackPath =
    effectiveIndex > 0 ? applicationPages[effectiveIndex - 1].path : "/";
  const nextPage =
    effectiveIndex >= 0 && effectiveIndex < applicationPages.length - 1
      ? applicationPages[effectiveIndex + 1]
      : undefined;
  const effectiveContinueText = nextPage
    ? `Next up: ${nextPage.title}`
    : continueText;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    // Check if there are unsaved changes
    if (hasUnsavedChanges) {
      const hasChanges = hasUnsavedChanges();
      if (hasChanges) {
        setShowBackConfirmDialog(true);
        return;
      }
    }
    sessionStorage.setItem("nyl-last-nav", "back");
    navigate(backPath ?? defaultBackPath);
  };

  const handleConfirmBack = () => {
    setShowBackConfirmDialog(false);
    sessionStorage.setItem("nyl-last-nav", "back");
    navigate(backPath ?? defaultBackPath);
  };

  const handleCancelBack = () => {
    setShowBackConfirmDialog(false);
  };

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        className="page-navigation"
        sx={commonStyles.pageNavigation}
      >
        <div>
          {shouldShowBack && (
            <Button
              variant="outlined"
              onClick={handleBack}
              size="large"
              disabled={isPageLoading}
            >
              Back
            </Button>
          )}
        </div>
        <div>
          {showContinue && (
            <Button
              variant="contained"
              size="large"
              disabled={isPageLoading || continueDisabled}
              sx={{ fontWeight: 600 }}
              {...(onContinue ? { onClick: onContinue } : { type: "submit" })}
            >
              {isPageLoading ? (
                <Box
                  component="span"
                  sx={{ display: "inline-flex", alignItems: "center" }}
                >
                  <Cached
                    sx={{
                      fontSize: "1rem",
                      animation: "spin 1.2s linear infinite",
                      "@keyframes spin": {
                        from: { transform: "rotate(0deg)" },
                        to: { transform: "rotate(360deg)" },
                      },
                    }}
                  />
                </Box>
              ) : (
                effectiveContinueText
              )}
            </Button>
          )}
        </div>
      </Stack>

      {/* Back Confirmation Dialog */}
      <Dialog
        open={showBackConfirmDialog}
        onClose={handleCancelBack}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Important Notice</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Navigating to the previous page will result in losing your current
            progress on this page. Are you sure you would like to continue?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelBack} variant="outlined">
            Stay on This Page
          </Button>
          <Button
            onClick={handleConfirmBack}
            variant="contained"
            color="primary"
          >
            Go to Previous Page
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

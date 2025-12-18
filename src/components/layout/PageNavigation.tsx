import { Stack, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { PAGES } from "../../config/pages";
import { commonStyles } from "../../theme/commonStyles";
import { useLayout } from "../../state/LayoutContext";
import { useSinglePageLayout } from "../../layouts/SinglePageLayout";
import { getClientFeatures } from "../../config/clients";

interface PageNavigationProps {
  /**
   * If true, shows the back button.
   * @default true
   */
  showBack?: boolean;
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
   * Handler for when continue is clicked.
   * If not provided, the continue button will be type="submit"
   */
  onContinue?: () => void;
  /**
   * Explicit back path. If not provided, will be determined from page order
   */
  backPath?: string;
}

export default function PageNavigation({ 
  showBack = true, 
  showContinue = true,
  continueText = "Next",
  onContinue,
  backPath
}: PageNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { layoutMode } = useLayout();
  const singlePageContext = useSinglePageLayout();
  const features = getClientFeatures();
  
  // Filter application pages based on client configuration
  const applicationPages = PAGES.filter(p => {
    if (p.section !== "application") return false;
    
    // Filter out membership page if not enabled for this client
    if (p.path === "/membership" && !features.showMembershipPage) {
      return false;
    }
    
    return true;
  });
  
  // Find the current page in the flow
  const currentPath = location.pathname;
  const currentIndex = applicationPages.findIndex(p => p.path === currentPath);
  
  // In single-page mode, use the context pageIndex; otherwise use currentIndex
  const effectiveIndex = singlePageContext.isSinglePage && singlePageContext.pageIndex !== undefined
    ? singlePageContext.pageIndex
    : currentIndex;
  
  // In single-page mode, hide back button on first page (index 0)
  const isFirstPage = effectiveIndex === 0;
  const shouldShowBack = showBack && !(layoutMode === 'single-page' && isFirstPage);
  
  // Determine back path if not explicitly provided
  const defaultBackPath = effectiveIndex > 0 
    ? applicationPages[effectiveIndex - 1].path 
    : "/";
  
  const handleBack = () => {
    navigate(backPath ?? defaultBackPath);
  };

  return (
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
            {...(onContinue 
              ? { onClick: onContinue } 
              : { type: "submit" }
            )}
          >
            {continueText}
          </Button>
        )}
      </div>
    </Stack>
  );
}
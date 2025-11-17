import { Stack, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { PAGES } from "../../config/pages";
import { commonStyles } from "../../theme/commonStyles";

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
  continueText = "Continue",
  onContinue,
  backPath
}: PageNavigationProps) {
  const navigate = useNavigate();
  const applicationPages = PAGES.filter(p => p.section === "application");
  
  // Find the current page in the flow
  const currentPath = window.location.pathname;
  const currentIndex = applicationPages.findIndex(p => p.path === currentPath);
  
  // Determine back path if not explicitly provided
  const defaultBackPath = currentIndex > 0 
    ? applicationPages[currentIndex - 1].path 
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
        {showBack && (
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
import { requirementText } from "../../domain/requirementContent";
import { Box, Button } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

type PageNavProps = {
  /** The form id this submit button targets. */
  formId: string;
  /** When true, shows a spinner and disables the button. */
  isTransitioning?: boolean;
  /** When true, disables the button (validation not met, loading, etc.). */
  disabled?: boolean;
  /** Label for the primary action button. Defaults to "Next". */
  nextLabel?: string;
};

/**
 * PageActions renders the primary page navigation action (Next / Submit).
 * It sits at the bottom of PageCard, below the form body.
 *
 * Back navigation is handled by PageHeader (via the onBack prop on PageTitle)
 * so PageActions only owns the forward action.
 */
export default function PageNav({
  formId,
  isTransitioning = false,
  disabled = false,
  nextLabel = requirementText("navigation.next"),
}: PageNavProps) {
  return (
    <Box sx={{ mt: "2rem", mb: "1rem" }}>
      <Button
        data-analytics-navigation="next"
        type="submit"
        form={formId}
        variant="contained"
        size="large"
        fullWidth
        disabled={disabled || isTransitioning}
        loading={isTransitioning}
        aria-label={isTransitioning ? requirementText("navigation.submitting", { label: nextLabel }) : undefined}
        endIcon={<ArrowForwardRoundedIcon />}
      >
        {nextLabel}
      </Button>
    </Box>
  );
}

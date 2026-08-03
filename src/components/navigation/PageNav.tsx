import { Box, Button, CircularProgress } from "@mui/material";
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
  nextLabel = "Next",
}: PageNavProps) {
  return (
    <Box sx={{ mt: "2rem", mb: "1rem" }}>
      <Button
        type="submit"
        form={formId}
        variant="contained"
        size="large"
        fullWidth
        disabled={isTransitioning || disabled}
        endIcon={!isTransitioning ? <ArrowForwardRoundedIcon /> : undefined}
        sx={(theme) => ({
          "&.Mui-disabled": {
            color: theme.palette.primary.contrastText,
            backgroundColor: theme.palette.primary.main,
            boxShadow: `0 8px 18px ${theme.palette.primary.main}3d`,
            opacity: 1,
          },
        })}
      >
        {isTransitioning ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          nextLabel
        )}
      </Button>
    </Box>
  );
}

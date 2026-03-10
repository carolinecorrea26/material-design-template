import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Common reusable style objects to avoid inline sx props
 * These can be imported and used across components for consistency
 */

export const commonStyles = {
  // ==========================================
  // LAYOUT & FLEXBOX UTILITIES
  // ==========================================

  flexCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as SxProps<Theme>,

  flexRow: {
    display: "flex",
    alignItems: "center",
    gap: 1,
  } as SxProps<Theme>,

  flexColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  } as SxProps<Theme>,

  flexGrow: {
    flex: 1,
  } as SxProps<Theme>,

  // ==========================================
  // SPACING UTILITIES
  // ==========================================

  noVerticalMargin: {
    my: 0,
  } as SxProps<Theme>,

  marginBottomSmall: {
    mb: 0.5,
  } as SxProps<Theme>,

  marginBottom: {
    mb: 1,
  } as SxProps<Theme>,

  marginBottom2: {
    mb: 2,
  } as SxProps<Theme>,

  marginBottom3: {
    mb: 3,
  } as SxProps<Theme>,

  marginTop2: {
    mt: 2,
  } as SxProps<Theme>,

  marginTop4: {
    mt: 4,
  } as SxProps<Theme>,

  paddingTop3: {
    pt: 3,
  } as SxProps<Theme>,

  dividerSpacing: {
    my: 1,
  } as SxProps<Theme>,

  // ==========================================
  // TYPOGRAPHY UTILITIES
  // ==========================================

  fontWeightBold: {
    fontWeight: 500,
  } as SxProps<Theme>,

  textCenter: {
    textAlign: "center",
  } as SxProps<Theme>,

  maxWidthText: {
    maxWidth: "80ch",
    textAlign: "center",
  } as SxProps<Theme>,

  sectionTitle: {} as SxProps<Theme>,

  sectionHeadingText: {
    fontWeight: 600,
  } as SxProps<Theme>,

  // Step number circle for landing page
  stepNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    bgcolor: "primary.main",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    flexShrink: 0,
  } as SxProps<Theme>,

  // Icon circle background for self/spouse/child icons
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    bgcolor: "rgba(25, 118, 210, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  } as SxProps<Theme>,

  // Typography hierarchy for form pages
  pageTitle: {
    variant: "h2" as const,
    component: "h1" as const,
    sx: { textAlign: "center" },
  } as SxProps<Theme>,

  coverageCategoryTitle: {
    variant: "h4" as const,
    fontWeight: 600,
  } as SxProps<Theme>,

  productSectionTitle: {
    variant: "h4" as const,
  } as SxProps<Theme>,

  applicantSectionTitle: {
    variant: "h6" as const,
  } as SxProps<Theme>,

  productTitle: {
    fontWeight: 600,
    mb: 1,
  } as SxProps<Theme>,

  overlineLabel: {
    display: "block",
    fontWeight: 700,
    fontSize: "0.7rem",
    color: "text.secondary",
    letterSpacing: 1,
    textTransform: "uppercase",
  } as SxProps<Theme>,

  // ==========================================
  // CARD & CONTAINER UTILITIES
  // ==========================================

  paperBox: {
    p: { xs: 2, sm: 3 },
    bgcolor: "background.paper",
    borderRadius: 1.5,
    boxShadow: 2,
  } as SxProps<Theme>,

  borderedBox: {
    border: 1,
    borderColor: "divider",
    borderRadius: 2,
    p: 2,
  } as SxProps<Theme>,

  mutedSectionPanel: {
    p: 2,
    borderRadius: 1,
    bgcolor: "rgb(169 173 184 / 10%)",
  } as SxProps<Theme>,

  infoPanel: {
    border: 1,
    borderColor: "divider",
    borderRadius: 1,
    p: { xs: 2, sm: 3 },
    bgcolor: "background.default",
  } as SxProps<Theme>,

  coverageCard: {
    mb: 2,
  } as SxProps<Theme>,

  categoryCard: {
    overflow: "hidden",
    bgcolor: "white",
  } as SxProps<Theme>,

  // ==========================================
  // IMAGE & ICON UTILITIES
  // ==========================================

  logo: {
    height: 32,
    width: "auto",
    display: "inline-block",
  } as SxProps<Theme>,

  // ==========================================
  // CHIP UTILITIES
  // ==========================================

  iconOnlyChip: {
    "& .MuiChip-icon": {
      margin: 0,
      color: "success.main",
    },
    "& .MuiChip-label": {
      padding: 0,
    },
    paddingLeft: "6px",
    paddingRight: "6px",
    bgcolor: "#e7f5e7",
  } as SxProps<Theme>,

  quickDecisionChip: {
    bgcolor: "#e8f5e8",
    "& .MuiChip-icon": {
      color: "success.main",
    },
  } as SxProps<Theme>,

  // ==========================================
  // LIST UTILITIES
  // ==========================================

  nestedListItem: {
    pl: 4,
  } as SxProps<Theme>,

  // ==========================================
  // FOOTER/HEADER UTILITIES
  // ==========================================

  footer: {
    py: { xs: 4, sm: 4 },
    mt: 4,
    bgcolor: "#f2f4f8",
    borderTop: "none",
    color: "#798293",
  } as SxProps<Theme>,

  sectionHeader: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    mb: 1,
  } as SxProps<Theme>,

  // ==========================================
  // INTERACTIVE UTILITIES
  // ==========================================

  clickable: {
    cursor: "pointer",
  } as SxProps<Theme>,

  fullWidth: {
    width: "100%",
  } as SxProps<Theme>,

  noOutline: {
    outline: "none",
  } as SxProps<Theme>,

  overflowHidden: {
    overflow: "hidden",
  } as SxProps<Theme>,

  // ==========================================
  // LINK UTILITIES
  // ==========================================

  unstyledLink: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    textDecoration: "none",
  } as SxProps<Theme>,

  primaryLink: {
    color: "primary.main",
    fontWeight: 600,
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  } as SxProps<Theme>,

  // ==========================================
  // CONTACT BANNER UTILITIES
  // ==========================================

  contactBannerLink: {
    color: "common.white",
    textDecoration: "none",
    fontWeight: "bold",
    "&:hover": {
      textDecoration: "underline",
    },
  } as SxProps<Theme>,

  // ==========================================
  // ALERT & FEEDBACK UTILITIES
  // ==========================================

  successAlert: {
    bgcolor: "#e7f5e7",
    "& .MuiAlert-icon": { color: "success.main" },
  } as SxProps<Theme>,

  infoAlert: {
    mb: 1,
  } as SxProps<Theme>,

  neutralAlert: {
    mb: 1,
    bgcolor: "grey.50",
    color: "text.primary",
    border: 1,
    borderColor: "grey.200",
    borderRadius: 1,
    p: 2,
    "& .MuiAlert-icon": { color: "primary.main" },
  } as SxProps<Theme>,

  checkboxGroup: {
    my: 0,
    width: "100%",
    mr: 0,
  } as SxProps<Theme>,

  checkboxOption: (isSelected?: boolean) =>
    ({
      border: 1,
      borderColor: isSelected ? "primary.main" : "divider",
      borderRadius: 1,
      px: 1.5,
      py: 1,
      bgcolor: isSelected ? "rgba(25, 118, 210, 0.08)" : "background.paper", // Very light primary background
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        borderColor: "grey.400",
        bgcolor: isSelected ? "rgba(25, 118, 210, 0.08)" : "action.hover",
      },
    }) as SxProps<Theme>,

  formLabel: {
    mb: 1,
    display: "block",
  } as SxProps<Theme>,

  coverageCategoryLabel: {
    display: "block",
    color: "#353b48",
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: "0.7rem",
    mb: 0.5,
  } as SxProps<Theme>,

  // Field label style for non-floating labels
  fieldLabel: {
    color: "rgba(0, 0, 0, 0.4)",
    fontSize: "0.875rem",
    fontWeight: 500,
    mb: 1,
    display: "block",
  } as SxProps<Theme>,

  // ==========================================
  // ELIGIBILITY FORM UTILITIES
  // ==========================================

  applicantsBox: (hasError?: boolean) =>
    ({
      p: { xs: 2, sm: 3 },
      bgcolor: "background.paper",
      borderRadius: 1.5,
      boxShadow: 2,
      ...(hasError && {
        border: 1,
        borderColor: "error.main",
      }),
    }) as SxProps<Theme>,

  sectionHeading: {
    mb: 2,
  } as SxProps<Theme>,

  subsectionHeading: {
    mb: 1,
  } as SxProps<Theme>,

  subsectionHeadingBold: {
    fontWeight: 600,
    mb: 1,
  } as SxProps<Theme>,

  sidebarText: {
    lineHeight: 2.66,
    textTransform: "uppercase",
    color: "rgba(0, 0, 0, 0.6)",
    display: "block",
    fontWeight: 700,
    fontSize: "0.75rem",
    letterSpacing: "1px",
  } as SxProps<Theme>,

  coverageErrorBox: (hasError?: boolean) =>
    ({
      ...(hasError && {
        border: 1,
        borderColor: "error.main",
        borderRadius: 1,
        p: 2,
      }),
    }) as SxProps<Theme>,

  formHelperText: {
    mt: 1,
    fontSize: "0.875rem",
  } as SxProps<Theme>,

  captionText: {
    ml: 4,
    mt: 0.125,
  } as SxProps<Theme>,

  inlineHeadingSpacing: {
    mb: 1,
  } as SxProps<Theme>,

  subsectionBox: {
    p: 2,
    border: 1,
    borderColor: "divider",
    borderRadius: 1,
    bgcolor: "grey.50",
    "& .MuiTextField-root, & .MuiFormControl-root": {
      "& .MuiOutlinedInput-root, & .MuiSelect-outlined": {
        bgcolor: "background.paper",
      },
    },
  } as SxProps<Theme>,

  // ==========================================
  // PRICING UTILITIES
  // ==========================================

  pricingDisplay: {
    display: "flex",
    alignItems: "baseline",
    gap: 1,
  } as SxProps<Theme>,

  pricingPlaceholder: {
    display: "flex",
    alignItems: "baseline",
    gap: 1,
    minHeight: "3rem",
  } as SxProps<Theme>,

  pricingAmount: {
    fontWeight: 700,
  } as SxProps<Theme>,

  pricingPlaceholderText: {
    fontStyle: "italic",
  } as SxProps<Theme>,

  coveragePricingAmount: {
    fontWeight: 700,
    fontSize: "2rem",
  } as SxProps<Theme>,

  // ==========================================
  // NAVIGATION UTILITIES
  // ==========================================

  pageNavigation: {
    mt: 2,
    // pt: 3,
  } as SxProps<Theme>,

  // ==========================================
  // RESPONSIVE UTILITIES
  // ==========================================

  responsiveFieldWidth: {
    width: { xs: "100%", sm: "auto" },
    flex: { xs: "unset", sm: 1 },
  } as SxProps<Theme>,

  // ==========================================
  // PAGE-SPECIFIC UTILITIES
  // ==========================================

  coveragePricingDisplay: {
    display: "flex",
    alignItems: "baseline",
    gap: 1,
    justifyContent: "center",
    textAlign: "center",
  } as SxProps<Theme>,

  // ==========================================
  // COVERAGE CATEGORY UTILITIES
  // ==========================================

  coverageCategoryIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.75rem",
  } satisfies SxProps<Theme>,

  coverageCategoryHeader: {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
  } satisfies SxProps<Theme>,

  coverageProductItem: {
    display: "flex",
    alignItems: "center",
    gap: 1,
  } satisfies SxProps<Theme>,

  coverageBulletPoint: {
    color: "text.secondary",
    fontWeight: 400,
  } satisfies SxProps<Theme>,

  // ==========================================
  // ACCORDION STYLES
  // ==========================================

  accordionSummary: {
    bgcolor: "grey.50",
    "&:hover": {
      bgcolor: "grey.100",
    },
  } satisfies SxProps<Theme>,
};

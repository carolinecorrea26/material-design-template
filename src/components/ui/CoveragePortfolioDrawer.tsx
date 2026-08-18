import {
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import AppDrawer from "../layout/AppDrawer";

// ---------------------------------------------------------------------------
// Dummy existing-coverage data
// ---------------------------------------------------------------------------

type CoverageItem = {
  name: string;
  amount: string;
  riders?: string[];
};

type ApplicantPortfolio = {
  applicant: "self" | "spouse";
  label: string;
  coverages: CoverageItem[];
};

const DUMMY_PORTFOLIO: ApplicantPortfolio[] = [
  {
    applicant: "self",
    label: "Member",
    coverages: [
      {
        name: "Term Life Insurance",
        amount: "$250,000",
        riders: ["Chronic Illness Rider (CIR)"],
      },
      { name: "Long Term Disability", amount: "$3,500 / month" },
      { name: "Accidental Death & Dismemberment", amount: "$100,000" },
    ],
  },
  {
    applicant: "spouse",
    label: "Spouse",
    coverages: [
      { name: "Term Life Insurance", amount: "$100,000" },
      { name: "Short Term Disability", amount: "$2,000 / month" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type CoveragePortfolioDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** When spouse is not applying, hide their portfolio. */
  hasSpouse?: boolean;
};

export default function CoveragePortfolioDrawer({
  open,
  onClose,
  hasSpouse = false,
}: CoveragePortfolioDrawerProps) {
  const visiblePortfolio = DUMMY_PORTFOLIO.filter(
    (p) => p.applicant === "self" || hasSpouse,
  );

  return (
    <AppDrawer open={open} onClose={onClose} title="Coverage portfolio" swipeable>
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          The following coverage is currently in force based on your membership
          record.
        </Typography>
        {visiblePortfolio.map((portfolio, index) => (
          <Box key={portfolio.applicant}>
            {index > 0 && <Divider sx={{ mb: 3 }} />}
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: "0.08em" }}
            >
              {portfolio.label}
            </Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {portfolio.coverages.map((coverage) => (
                <Box
                  key={coverage.name}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "background.paper",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {coverage.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                      color="primary.main"
                    >
                      {coverage.amount}
                    </Typography>
                  </Stack>
                  {coverage.riders && coverage.riders.length > 0 && (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      flexWrap="wrap"
                      sx={{ mt: 1 }}
                    >
                      {coverage.riders.map((rider) => (
                        <Chip
                          key={rider}
                          label={rider}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.6875rem" }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </AppDrawer>
  );
}

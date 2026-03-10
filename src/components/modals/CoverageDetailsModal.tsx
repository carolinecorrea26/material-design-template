import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import {
  BoltRounded,
  ChildFriendlyRounded,
  ExpandMore,
  PersonRounded,
  SupervisorAccountRounded,
} from "@mui/icons-material";
import { PRODUCT_LOOKUP } from "../../constants/getStartedProducts";
import { COVERAGE_CATEGORY_LABELS } from "../../constants/coverage";
import { commonStyles } from "../../theme/commonStyles";
import CoverageIcon from "../../utils/coverageIcons";

type CoverageDetailsProduct = {
  id: string;
  name: string;
  applicants: string[];
  href: string;
};

type CoverageDetailsCategory = {
  id: string;
  description: string;
  products: CoverageDetailsProduct[];
};

interface CoverageDetailsModalProps {
  open: boolean;
  onClose: () => void;
  coverageInfoCards: CoverageDetailsCategory[];
  productAmounts: Record<string, string>;
  categoryAmounts: Record<string, string>;
  title?: string;
}

const applicantLabelMap: Record<string, string> = {
  Self: "Member",
  Spouse: "Spouse",
  Child: "Child",
};

const applicantIconMap: Record<string, React.ReactElement> = {
  Self: <PersonRounded fontSize="small" />,
  Spouse: <SupervisorAccountRounded fontSize="small" />,
  Child: <ChildFriendlyRounded fontSize="small" />,
};

export default function CoverageDetailsModal({
  open,
  onClose,
  coverageInfoCards,
  productAmounts,
  categoryAmounts,
  title = "Explore coverage options",
}: CoverageDetailsModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="coverage-catalog-title"
      maxWidth="md"
      fullWidth
    >
      <DialogTitle id="coverage-catalog-title">{title}</DialogTitle>
      <DialogContent
        dividers
        sx={{
          bgcolor: "#eceef2",
          maxHeight: { xs: "70vh", md: "60vh" },
          overflowY: "auto",
        }}
      >
        {coverageInfoCards.length > 0 ? (
          <Stack spacing={2}>
            {coverageInfoCards.map((card) => (
              <Box
                key={card.id}
                sx={{
                  mb: "1rem",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "rgba(0, 73, 187, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CoverageIcon
                      category={card.id}
                      fontSize="small"
                      sx={{ color: "#0049bb" }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={commonStyles.coverageCategoryLabel}
                  >
                    {COVERAGE_CATEGORY_LABELS[card.id]}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  {card.products.map((product, index) => {
                    const productMeta = PRODUCT_LOOKUP[product.id];
                    const productDescription =
                      productMeta?.coverageHighlight ??
                      card.description ??
                      "Coverage details available in the brochure.";

                    return (
                      <Accordion
                        key={product.id}
                        disableGutters
                        elevation={0}
                        square
                        sx={{
                          m: 0,
                          bgcolor: "#ffffff",
                          "&:before": { display: "none" },
                          borderBottom:
                            index === card.products.length - 1 ? 0 : 1,
                          borderColor: "divider",
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{
                                fontSize: {
                                  xs: "0.75rem",
                                  md: "0.875rem",
                                },
                              }}
                            >
                              {product.name}
                            </Typography>
                            {productMeta?.quickDecision ? (
                              <Chip
                                label="QuickDecision"
                                size="small"
                                variant="outlined"
                                icon={<BoltRounded />}
                                sx={{
                                  color: "success.main",
                                  borderColor: "success.main",
                                  "& .MuiChip-icon": {
                                    color: "success.main",
                                  },
                                }}
                              />
                            ) : null}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={1.25}>
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontWeight: 700,
                                }}
                              >
                                Description:
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {productDescription}{" "}
                                <MuiLink
                                  href={product.href}
                                  target="_blank"
                                  rel="noopener"
                                  underline="none"
                                  color="primary"
                                  sx={{ fontSize: "0.875rem" }}
                                >
                                  See full coverage details
                                </MuiLink>
                              </Typography>
                            </Box>
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontWeight: 700,
                                }}
                              >
                                Amounts:
                              </Typography>
                              <Stack spacing={0.5}>
                                {product.applicants.map((applicant) => {
                                  const defaultAmount =
                                    productAmounts[product.id] ??
                                    categoryAmounts[card.id] ??
                                    productMeta?.coverageHighlight ??
                                    "Varies by product";
                                  const amountByApplicant: Record<
                                    string,
                                    string
                                  > = {
                                    Self: defaultAmount,
                                    Spouse: defaultAmount,
                                    Child: "$10K",
                                  };

                                  return (
                                    <Typography
                                      key={applicant}
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          color: "primary.main",
                                          display: "flex",
                                        }}
                                      >
                                        {applicantIconMap[applicant]}
                                      </Box>
                                      {applicantLabelMap[applicant] ??
                                        applicant}
                                      :{" "}
                                      {amountByApplicant[applicant] ??
                                        defaultAmount}
                                    </Typography>
                                  );
                                })}
                              </Stack>
                            </Box>
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Coverage details will appear here once products are available.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

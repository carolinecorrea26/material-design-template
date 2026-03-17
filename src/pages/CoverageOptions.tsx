import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import {
  ExpandMore,
  PersonOutline,
  FavoriteBorder,
  ChildCare,
} from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
import FormPageLayout from "../components/layout/FormPageLayout";
import FormStepTransition from "../components/layout/FormStepTransition";
import PageNavigation from "../components/layout/PageNavigation";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { getProducts, quoteRate } from "../api/client";
import { COVERAGE_CATEGORY_LABELS } from "../constants/coverage";
import { commonStyles } from "../theme/commonStyles";
import CoverageIcon from "../utils/coverageIcons";
import type {
  Applicant,
  CoverageCategory,
  Product,
  SelectedItem,
} from "../types/app";

type AmountKey = `${string}:${Applicant}`;

const applicantLabels: Record<Applicant, string> = {
  self: "Self",
  spouse: "Spouse",
  child: "Child",
};

const applicantIcons: Record<Applicant, React.ElementType> = {
  self: PersonOutline,
  spouse: FavoriteBorder,
  child: ChildCare,
};

function ApplicantLabel({ applicant }: { applicant: Applicant }) {
  const Icon = applicantIcons[applicant];
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          bgcolor: "#dbe4f3",
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          "& svg": {
            width: "0.875em",
            height: "0.875em",
          },
        }}
      >
        <Icon />
      </Box>
      <Typography sx={commonStyles.sidebarText}>
        {applicantLabels[applicant]}
      </Typography>
    </Stack>
  );
}

function CategoryLabel({ category }: { category: CoverageCategory }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          bgcolor: "#dbe4f3",
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          "& svg": {
            width: "0.875em",
            height: "0.875em",
          },
        }}
      >
        <CoverageIcon category={category} color="currentColor" />
      </Box>
      <Typography sx={commonStyles.sidebarText}>
        {COVERAGE_CATEGORY_LABELS[category]}
      </Typography>
    </Stack>
  );
}

export default function CoverageOptions() {
  const { data, setCoverage, setEligibility } = useAppData();
  const { markComplete } = useStepper();
  const navigate = useNavigate();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [amountByKey, setAmountByKey] = React.useState<
    Record<AmountKey, number>
  >({});
  const [rateByKey, setRateByKey] = React.useState<Record<AmountKey, number>>(
    {},
  );
  const [showSelectionError, setShowSelectionError] = React.useState(false);
  const initializedRef = React.useRef(false);

  const buildSelections = React.useCallback((): SelectedItem[] => {
    const selections: SelectedItem[] = [];
    Object.entries(amountByKey).forEach(([key, amount]) => {
      if (!amount || amount <= 0) return;
      const [productId, applicant] = key.split(":") as [string, Applicant];
      selections.push({
        productId,
        applicant,
        amount,
        estMonthly: rateByKey[key as AmountKey] ?? 0,
      });
    });
    return selections;
  }, [amountByKey, rateByKey]);

  React.useEffect(() => {
    let mounted = true;
    getProducts()
      .then((fetched) => {
        if (!mounted) return;
        if (Array.isArray(fetched)) {
          setProducts(fetched);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedProductIds = React.useMemo(
    () => data.eligibility?.coverageProductSelections ?? [],
    [data.eligibility?.coverageProductSelections],
  );

  const selectedApplicants = React.useMemo(() => {
    const applicants = data.eligibility?.applicants;
    return {
      self: true,
      spouse: applicants?.spouse ?? false,
      child: applicants?.child ?? false,
    };
  }, [data.eligibility?.applicants]);

  const selectedProducts = React.useMemo(
    () => products.filter((product) => selectedProductIds.includes(product.id)),
    [products, selectedProductIds],
  );

  const productsByCategory = React.useMemo(() => {
    const grouped: Record<CoverageCategory, Product[]> = {
      LI: [],
      AD: [],
      DI: [],
      OO: [],
      SH: [],
    };
    selectedProducts.forEach((product) => {
      grouped[product.category].push(product);
    });
    return grouped;
  }, [selectedProducts]);

  const visibleCategories = React.useMemo(
    () =>
      (Object.keys(productsByCategory) as CoverageCategory[]).filter(
        (category) => productsByCategory[category].length > 0,
      ),
    [productsByCategory],
  );

  React.useEffect(() => {
    initializedRef.current = false;
  }, [selectedProductIds.join("|")]);

  React.useEffect(() => {
    if (initializedRef.current) return;

    if (selectedProducts.length === 0) {
      setAmountByKey({});
      setRateByKey({});
      initializedRef.current = true;
      return;
    }

    const nextAmounts: Record<AmountKey, number> = {};
    const nextRates: Record<AmountKey, number> = {};
    const savedCoverage = data.coverage ?? [];

    selectedProducts.forEach((product) => {
      product.eligibleApplicants.forEach((applicant) => {
        if (!selectedApplicants[applicant]) return;
        const key: AmountKey = `${product.id}:${applicant}`;
        const savedItem = savedCoverage.find(
          (item) =>
            item.productId === product.id && item.applicant === applicant,
        );
        nextAmounts[key] = savedItem?.amount ?? 0;
        if (savedItem?.estMonthly) {
          nextRates[key] = savedItem.estMonthly;
        }
      });
    });

    setAmountByKey(nextAmounts);
    if (Object.keys(nextRates).length > 0) {
      setRateByKey(nextRates);
    } else {
      setRateByKey({});
    }
    initializedRef.current = true;
  }, [selectedProducts, selectedApplicants, data.coverage]);

  const handleAmountChange = async (
    product: Product,
    applicant: Applicant,
    amount: number,
  ) => {
    setShowSelectionError(false);
    const key: AmountKey = `${product.id}:${applicant}`;
    setAmountByKey((prev) => ({ ...prev, [key]: amount }));
    if (!amount || amount <= 0) {
      setRateByKey((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    const smoker =
      applicant === "self"
        ? data.eligibility?.smokerSelf === "yes"
        : data.eligibility?.smokerSpouse === "yes";
    try {
      const quote = await quoteRate({
        productId: product.id,
        applicant,
        amount,
        smoker,
        age: undefined,
      });
      setRateByKey((prev) => ({ ...prev, [key]: quote.monthly }));
    } catch (error) {
      console.error("Failed to quote rate", error);
    }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const formatMonthly = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!data.eligibility) {
      navigate("/eligibility");
      return;
    }

    const selections = buildSelections();
    if (selections.length === 0) {
      setShowSelectionError(true);
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return;
    }

    setShowSelectionError(false);
    setCoverage(selections);

    const persistedProductIds = Array.from(
      new Set(selections.map((item) => item.productId)),
    ).sort();
    setEligibility({
      ...data.eligibility,
      coverageProductSelections: persistedProductIds,
    });

    markComplete();
    navigate("/contact");
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormPageLayout
        header={
          <PageHeader title="Choose from your available coverage options below." />
        }
        navigation={
          <PageNavigation
            hasUnsavedChanges={() =>
              Object.values(amountByKey).some((amount) => amount > 0)
            }
          />
        }
      >
        <FormStepTransition>
          <Stack spacing={2}>
            {showSelectionError && (
              <Alert severity="error">
                Select at least one coverage amount before continuing.
              </Alert>
            )}
            {loading ? (
              <Typography variant="body2" color="text.secondary">
                Loading coverage options...
              </Typography>
            ) : visibleCategories.length === 0 ? (
              <Alert severity="info">
                No coverage options are available for your current selections.
              </Alert>
            ) : (
              visibleCategories.map((category, index) => {
                const categoryProducts = productsByCategory[category];

                return (
                  <Accordion
                    key={category}
                    defaultExpanded={index === 0}
                    disableGutters
                    elevation={0}
                    square
                    sx={{
                      bgcolor: "transparent",
                      boxShadow: "none",
                      "&::before": { display: "none" },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{ px: 0, minHeight: "auto" }}
                    >
                      <CategoryLabel category={category} />
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, pt: 0 }}>
                      <Stack spacing={2}>
                        {categoryProducts.map((product) => (
                          <Box
                            key={product.id}
                            sx={{
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                              p: 2,
                              bgcolor: "background.paper",
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 600 }}
                            >
                              {product.name}
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 2 }}>
                              {product.eligibleApplicants
                                .filter(
                                  (applicant) => selectedApplicants[applicant],
                                )
                                .map((applicant) => {
                                  const key: AmountKey = `${product.id}:${applicant}`;
                                  const amount = amountByKey[key] ?? 0;
                                  const rate = rateByKey[key];
                                  const showLifeNotice =
                                    product.category === "LI" &&
                                    (applicant === "self" ||
                                      applicant === "spouse");
                                  return (
                                    <Box key={key}>
                                      <ApplicantLabel applicant={applicant} />
                                      {showLifeNotice && (
                                        <Alert
                                          severity="info"
                                          sx={{
                                            mb: 2,
                                            py: 0.5,
                                            "& .MuiAlert-message": {
                                              fontSize: "0.75rem",
                                            },
                                          }}
                                        >
                                          The maximum available through New York
                                          Life Insurance Company for any
                                          individual is $2,000,000, whether
                                          coverage is in one or divided among
                                          several group policies.
                                        </Alert>
                                      )}
                                      <FormControl fullWidth>
                                        <InputLabel id={`${key}-amount-label`}>
                                          Coverage Amount
                                        </InputLabel>
                                        <Select
                                          labelId={`${key}-amount-label`}
                                          label="Coverage Amount"
                                          value={amount}
                                          onChange={(event) =>
                                            handleAmountChange(
                                              product,
                                              applicant,
                                              Number(event.target.value),
                                            )
                                          }
                                        >
                                          <MenuItem value={0}>$0</MenuItem>
                                          {product.amounts
                                            .slice()
                                            .sort((a, b) => a - b)
                                            .map((amt) => (
                                              <MenuItem key={amt} value={amt}>
                                                {formatCurrency(amt)}
                                              </MenuItem>
                                            ))}
                                        </Select>
                                      </FormControl>
                                      {amount > 0 &&
                                        typeof rate === "number" && (
                                          <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="baseline"
                                            sx={{ mt: 1 }}
                                          >
                                            <Typography
                                              variant="body1"
                                              color="text.secondary"
                                            >
                                              Estimated cost
                                              <Box component="sup">1</Box>:
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                color: "success.main",
                                                fontWeight: 600,
                                                fontSize: "1rem",
                                              }}
                                            >
                                              {formatMonthly(rate)}/mo
                                            </Typography>
                                          </Stack>
                                        )}
                                    </Box>
                                  );
                                })}
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })
            )}
          </Stack>
        </FormStepTransition>
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" component="p">
            <Box component="sup">1</Box> Quoted cost is the best rate available
            based on the information you provided. Final cost may be based upon
            factors such as gender, health status, and use of tobacco/nicotine.
            Rates current as of 2026.
          </Typography>
        </Box>
      </FormPageLayout>
    </form>
  );
}

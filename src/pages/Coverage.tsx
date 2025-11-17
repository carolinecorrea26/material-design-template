import * as React from "react";
import {
  Card, CardContent, Stack, Typography, Select, MenuItem, FormControl, InputLabel,
  Button, Box, Container, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Link, Alert, Checkbox, FormControlLabel, Chip
} from "@mui/material";
import { FlashOn as QuickDecisionIcon, Person, People, ChildFriendly } from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import { useAppData } from "../state/AppDataContext";
import { useNavigate } from "react-router-dom";
import { getProducts, quoteRate } from "../api/client";
import type { Applicant, Product, SelectedItem, CoverageCategory } from "../types/app";
import CoverageIcon, { getCoverageLabel } from "../utils/coverageIcons";
import { commonStyles } from "../theme/commonStyles";
// import { useSnackbar } from "../components/feedback/SnackbarProvider";



type SelKey = `${string}:${Applicant}`; // productId:applicant

export default function Coverage() {
  const { data, setCoverage } = useAppData();
  const navigate = useNavigate();

  // const { notify } = useSnackbar();

  // Product ordering to match the coverage details dropdown
  const productOrder = [
    "Term Life Insurance",
    "10 Year Level Term Life Insurance", 
    "20-Year Level Term Life Insurance",
    "50+ Multi-Benefit Term Life Insurance",
    "Accidental Death and Dismemberment Insurance",
    "Long-Term Disability Plus Insurance",
    "Long-Term Disability Insurance",
    "Mid-Term Disability Insurance",
    "Professional Overhead Expense Disability Insurance",
    "Critical Illness",
    "Hospital Money Insurance",
    "Short-Term Disability Insurance"
  ];

  // Category ordering: LI (Life), DI (Disability), OO (Overhead), SH (Supplemental Health)
  const categoryOrder = ["LI", "DI", "OO", "SH"];

  // Applicant ordering: self, spouse, child
  const applicantOrder = ["self", "spouse", "child"];

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // selections: key = "productId:applicant"
  const [amountByKey, setAmountByKey] = React.useState<Record<SelKey, number | "">>({});
  const [rateByKey, setRateByKey] = React.useState<Record<SelKey, number>>({});
  const [selectedByKey, setSelectedByKey] = React.useState<Record<SelKey, boolean>>({});
  const [showQuickDecisionModal, setShowQuickDecisionModal] = React.useState(false);
  // const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  // const toggleCategory = (category: string) => {
  //   setExpandedCategories(prev => {
  //     const newSet = new Set(prev);
  //     if (newSet.has(category)) {
  //       newSet.delete(category);
  //     } else {
  //       newSet.add(category);
  //     }
  //     return newSet;
  //   });
  // };

  const elig = data.eligibility;
  const selfCats = React.useMemo(() => new Set(elig?.selfCoverages ?? []), [elig?.selfCoverages]);
  const spouseCats = React.useMemo(() => new Set(elig?.spouseCoverages ?? []), [elig?.spouseCoverages]);
  const chosenApplicants: Applicant[] = React.useMemo(() => {
    const out: Applicant[] = [];
    if (elig?.applicants?.self) out.push("self");
    if (elig?.applicants?.spouse) out.push("spouse");
    if (elig?.applicants?.child) out.push("child");
    return out;
  }, [elig]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const prods = await getProducts();
        if (mounted) setProducts(prods);
      } catch (e: unknown) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Expand the first category by default when products are loaded
  React.useEffect(() => {
    if (products.length > 0) {
      // Group products by category to find the first category
      const productsByCategory = products.reduce((acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
      }, {} as Record<string, Product[]>);

      // Get the first category that has visible products
      const firstCategory = Object.keys(productsByCategory).find(category => {
        const categoryProducts = productsByCategory[category];
        return categoryProducts.some(p => {
          const allowedApplicants = chosenApplicants.filter(a => {
            if (!p.eligibleApplicants.includes(a)) return false;
            if (a === "self" && selfCats.size && !selfCats.has(p.category)) return false;
            if (a === "spouse" && spouseCats.size && !spouseCats.has(p.category)) return false;
            return true;
          });
          return allowedApplicants.length > 0;
        });
      });

      // if (firstCategory) {
      //   setExpandedCategories(new Set([firstCategory]));
      // }

      // Initialize amounts to lowest available for all eligible products
      const initialAmounts: Record<SelKey, number> = {};
      const initialSelections: Record<SelKey, boolean> = {};

      products.forEach(p => {
        chosenApplicants.forEach(app => {
          if (!p.eligibleApplicants.includes(app)) return;
          if (app === "self" && selfCats.size && !selfCats.has(p.category)) return;
          if (app === "spouse" && spouseCats.size && !spouseCats.has(p.category)) return;

          const key: SelKey = `${p.id}:${app}`;
          if (p.amounts.length > 0) {
            const lowestAmount = Math.min(...p.amounts);
            initialAmounts[key] = lowestAmount;
            initialSelections[key] = false; // Don't auto-select, just set amounts
          }
        });
      });

      setAmountByKey(initialAmounts);
      setSelectedByKey(initialSelections);
    }
  }, [products, chosenApplicants, selfCats, spouseCats, elig]);

  // Get initial quotes for all initialized amounts
  React.useEffect(() => {
    if (Object.keys(amountByKey).length > 0 && products.length > 0) {
      const quotePromises: Promise<void>[] = [];

      Object.entries(amountByKey).forEach(async ([key, amount]) => {
        if (amount !== "") {
          const [productId, applicant] = key.split(':') as [string, Applicant];
          const product = products.find(p => p.id === productId);
          if (product) {
            const smoker = applicant === "self" ? (elig?.smokerSelf === "yes") : (elig?.smokerSpouse === "yes");
            const quotePromise = quoteRate({ productId, applicant, amount, smoker, age: undefined })
              .then(quote => {
                setRateByKey(prev => ({ ...prev, [key]: quote.monthly }));
              })
              .catch(error => {
                console.error(`Failed to get quote for ${key}:`, error);
              });
            quotePromises.push(quotePromise);
          }
        }
      });

      // Wait for all quotes to complete
      Promise.all(quotePromises).catch(error => {
        console.error('Error getting initial quotes:', error);
      });
    }
  }, [amountByKey, products, elig]);

  // DevTools: Fill form with test coverage selections
  React.useEffect(() => {
    const handleFillForm = () => {
      if (products.length === 0) return;

      const newSelectedByKey: Record<SelKey, boolean> = {};
      const newAmountByKey: Record<SelKey, number | ""> = {};
      const categoriesToExpand = new Set<string>();

      // Select ALL eligible products for ALL applicants
      products.forEach(product => {
        chosenApplicants.forEach(applicant => {
          // Check if this product is eligible for this applicant
          if (!product.eligibleApplicants.includes(applicant)) return;
          if (applicant === "self" && selfCats.size && !selfCats.has(product.category)) return;
          if (applicant === "spouse" && spouseCats.size && !spouseCats.has(product.category)) return;

          if (product.amounts.length > 0) {
            const key: SelKey = `${product.id}:${applicant}`;
            newSelectedByKey[key] = true;
            
            // Select the middle amount option, or the first if only one
            const amounts = product.amounts;
            const selectedAmount = amounts.length > 1 ? amounts[Math.floor(amounts.length / 2)] : amounts[0];
            newAmountByKey[key] = selectedAmount;
            
            categoriesToExpand.add(product.category);
          }
        });
      });

      setSelectedByKey(prev => ({ ...prev, ...newSelectedByKey }));
      setAmountByKey(prev => ({ ...prev, ...newAmountByKey }));
      // setExpandedCategories(categoriesToExpand);
    };

    window.addEventListener('devtools:fillform', handleFillForm);
    return () => window.removeEventListener('devtools:fillform', handleFillForm);
  }, [products, chosenApplicants, selfCats, spouseCats]);

  const onChangeAmount = async (key: SelKey, productId: string, applicant: Applicant, amount: number | "") => {
    setAmountByKey(prev => ({ ...prev, [key]: amount }));
    if (amount === "") {
      // cleared selection
      setRateByKey(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    // quote immediately (doc: show immediate estimated rate)
    const smoker = applicant === "self" ? (elig?.smokerSelf === "yes") : (elig?.smokerSpouse === "yes");
    const quote = await quoteRate({ productId, applicant, amount, smoker, age: undefined });
    setRateByKey(prev => ({ ...prev, [key]: quote.monthly }));
  };

  const onChangeSelection = (key: SelKey, selected: boolean) => {
    setSelectedByKey(prev => ({ ...prev, [key]: selected }));
    if (!selected) {
      // clear amount and rate when deselected
      setAmountByKey(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setRateByKey(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // const canContinue = React.useMemo(() => {
  //   // at least one key has a selection and amount and quoted rate
  //   return Object.entries(selectedByKey).some(([k, selected]) => 
  //     selected && amountByKey[k as SelKey] !== "" && typeof rateByKey[k as SelKey] === "number"
  //   );
  // }, [selectedByKey, amountByKey, rateByKey]);

  const handleContinue = () => {
    setSubmitAttempted(true);
    
    // Check if at least one product is selected
    const hasSelection = Object.values(selectedByKey).some(selected => selected === true);
    
    if (!hasSelection) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    const selections: SelectedItem[] = [];
    for (const [key, selected] of Object.entries(selectedByKey)) {
      if (!selected) continue;
      const amt = amountByKey[key as SelKey];
      if (amt === "") continue;
      const rate = rateByKey[key as SelKey];
      if (typeof rate !== "number") continue;
      const [productId, applicant] = key.split(":") as [string, Applicant];
      selections.push({
        productId,
        applicant,
        amount: Number(amt),
        estMonthly: rate
      });
    }
    // save locally for later pages
    setCoverage(selections);
    // notify("Coverage selection saved.", "success");
    navigate("/contact");
  };

  if (loading) {
    return (
      <Stack spacing={2}>
        <PageHeader title="Coverage" />
        <Card><CardContent><Typography>Loading products…</Typography></CardContent></Card>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <PageHeader title="Coverage" />
        <Card><CardContent><Typography color="error">{error}</Typography></CardContent></Card>
      </Stack>
    );
  }

  const anyVisible = products.some(p =>
    chosenApplicants.some(a => p.eligibleApplicants.includes(a) &&
      ((a === "self" && (!selfCats.size || selfCats.has(p.category))) ||
      (a === "spouse" && (!spouseCats.size || spouseCats.has(p.category))) ||
      (a === "child")))
  );

  if (!anyVisible) {
    return (
      <Stack spacing={2}>
        <PageHeader title="Coverage" />
        <Alert severity="info">
          No eligible products were found for your current selections. Please adjust your choices on the Eligibility page.
        </Alert>
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="outlined" onClick={() => navigate("/eligibility")}>Back to Eligibility</Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <PageHeader 
        title="Select Coverage"
        notes="Choose the coverage you want from the options below. The available options depend on your eligibility. If you already have coverage through this insurance program, select only the additional amount you need."
      />

      {submitAttempted && !Object.values(selectedByKey).some(selected => selected === true) && (
        <Alert severity="error">
          You must make a coverage selection. Please check at least one product below.
        </Alert>
      )}

      <Alert 
        severity="success"
        icon={<QuickDecisionIcon />}
        sx={{
          ...commonStyles.successAlert,
          '& .MuiAlert-icon': { color: 'success.main' }
        }}
      >
        <Typography variant="body2">
          <strong>QuickDecision<sup>SM</sup></strong> allows you to get a faster decision on your application with typically no medical exam using medical underwriting automated processing. Eligibility factors include coverage amount, age, and state availability. If QuickDecision is not available, you may apply on a standard underwritten basis.{' '}
          <Link 
            component="button" 
            variant="body2" 
            onClick={() => setShowQuickDecisionModal(true)}
            sx={{ ...commonStyles.primaryLink, verticalAlign: 'baseline' }}
          >
            Learn More
          </Link>
        </Typography>
      </Alert>

      {/* Coverage Options */}
      {(() => {
        // Group products by category
        const productsByCategory = products.reduce((acc, p) => {
          if (!acc[p.category]) acc[p.category] = [];
          acc[p.category].push(p);
          return acc;
        }, {} as Record<string, Product[]>);

        // Sort categories according to categoryOrder
        const sortedCategories = Object.keys(productsByCategory).sort((a, b) => {
          const aIndex = categoryOrder.indexOf(a);
          const bIndex = categoryOrder.indexOf(b);
          // If both categories are in the order array, sort by their position
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          // If only one is in the order array, prioritize it
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          // If neither is in the order array, maintain original order
          return 0;
        });

        return sortedCategories.map((category) => {
          const categoryProducts = productsByCategory[category];
          // Filter products for this category that have allowed applicants
          const visibleProducts = categoryProducts.filter(p => {
            const allowedApplicants = chosenApplicants.filter(a => {
              if (!p.eligibleApplicants.includes(a)) return false;
              if (a === "self" && selfCats.size && !selfCats.has(p.category)) return false;
              if (a === "spouse" && spouseCats.size && !spouseCats.has(p.category)) return false;
              return true;
            });
            return allowedApplicants.length > 0;
          });

          // Sort products within category according to productOrder
          visibleProducts.sort((a, b) => {
            const aIndex = productOrder.indexOf(a.name);
            const bIndex = productOrder.indexOf(b.name);
            // If both products are in the order array, sort by their position
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }
            // If only one is in the order array, prioritize it
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            // If neither is in the order array, maintain original order
            return 0;
          });

          if (visibleProducts.length === 0) return null;

          // const isExpanded = expandedCategories.has(category);

          return (
            <Card key={category} sx={commonStyles.categoryCard}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Category Header */}
                  <Box sx={commonStyles.coverageCategoryHeader}>
                    <CoverageIcon 
                      category={category as CoverageCategory} 
                      fontSize="large" 
                      color="primary.main"
                      sx={commonStyles.coverageCategoryIcon}
                    />
                    <Typography variant="h4">
                      {getCoverageLabel(category as CoverageCategory)}
                    </Typography>
                  </Box>

                  {/* Products */}
                  <Stack spacing={3}>
                      {/* Group by product, then show all eligible applicants */}
                      {visibleProducts.map((p) => {
                        const allowedApplicants = chosenApplicants.filter(a => {
                          if (!p.eligibleApplicants.includes(a)) return false;
                          if (a === "self" && selfCats.size && !selfCats.has(p.category)) return false;
                          if (a === "spouse" && spouseCats.size && !spouseCats.has(p.category)) return false;
                          return true;
                        });

                        // Sort applicants according to applicantOrder: self, spouse, child
                        allowedApplicants.sort((a, b) => {
                          const aIndex = applicantOrder.indexOf(a);
                          const bIndex = applicantOrder.indexOf(b);
                          return aIndex - bIndex;
                        });

                        if (allowedApplicants.length === 0) return null;

                        return (
                          <Box key={p.id}>
                            {/* Product Section Header */}
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
                              <Typography variant="h5">
                                {p.name}
                              </Typography>
                              {p.quickDecision && (
                                <Chip
                                  icon={<QuickDecisionIcon sx={{ color: 'success.main' }} />}
                                  size="small"
                                  sx={commonStyles.iconOnlyChip}
                                />
                              )}
                            </Stack>

                            {/* All applicant variants for this product */}
                            <Stack spacing={2}>
                              {allowedApplicants.map((app) => {
                                const key: SelKey = `${p.id}:${app}`;
                                const val = amountByKey[key] ?? "";
                                const rate = rateByKey[key];
                                const isLifeInsurance = p.category === "LI";

                                return (
                                  <Card key={key} variant="outlined" sx={commonStyles.coverageCard}>
                                    <CardContent>
                                      <Stack spacing={2}>
                                        {/* Applicant Header */}
                                        <Box>
                                          <Stack direction="row" spacing={1} alignItems="center">
                                            {app === 'self' && <Person color="primary" />}
                                            {app === 'spouse' && <People color="primary" />}
                                            {app === 'child' && <ChildFriendly color="primary" />}
                                            <Typography variant="h6">
                                              {app === 'self' ? 'Your' : app === 'spouse' ? 'Spouse' : 'Child'} {p.name}
                                            </Typography>
                                          </Stack>
                                        </Box>

                                        {/* Life Insurance Alerts */}
                                        {isLifeInsurance && app === "self" && (
                                          <Alert severity="info" sx={commonStyles.infoAlert}>
                                            <Typography variant="body2">
                                              The maximum available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies.
                                            </Typography>
                                          </Alert>
                                        )}

                                        {isLifeInsurance && app === "spouse" && (
                                          <Alert severity="info" sx={commonStyles.infoAlert}>
                                            <Typography variant="body2">
                                              Spouse coverage cannot exceed member coverage (including in force or requested coverage). The maximum available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies.
                                            </Typography>
                                          </Alert>
                                        )}

                                        {isLifeInsurance && app === "child" && (
                                          <Alert severity="info" sx={commonStyles.infoAlert}>
                                            <Typography variant="body2">
                                              Child coverage is available for all unmarried dependent children from live birth to age 26. Coverage amount is per child and covers all eligible children.
                                            </Typography>
                                          </Alert>
                                        )}

                                        {/* Estimated Cost */}
                                        {typeof rate === "number" && val !== "" ? (
                                          <Box sx={commonStyles.coveragePricingDisplay}>
                                            <Typography variant="h2" color="primary.light" sx={commonStyles.coveragePricingAmount}>
                                              ${rate.toFixed(2)}
                                            </Typography>
                                            <Typography color="text.secondary">/ month</Typography>
                                          </Box>
                                        ) : (
                                          <Box sx={commonStyles.pricingPlaceholder}>
                                            <Typography variant="h6" color="text.secondary" sx={commonStyles.pricingPlaceholderText}>
                                              Select amount for quote
                                            </Typography>
                                          </Box>
                                        )}

                                        {/* Coverage Amount */}
                                        <FormControl fullWidth>
                                          <InputLabel>Coverage Amount</InputLabel>
                                          <Select
                                            value={val}
                                            label="Coverage Amount"
                                            onChange={(e) => onChangeAmount(key, p.id, app, e.target.value as number)}
                                          >
                                            <MenuItem value=""><em>None</em></MenuItem>
                                            {p.amounts.map(a => (
                                              <MenuItem key={a} value={a}>
                                                {p.category === "DI" || p.category === "OO" ? `$${a}/mo` : `$${a.toLocaleString()}`}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>

                                        {/* Add Coverage Checkbox */}
                                        <Box sx={commonStyles.checkboxOption(selectedByKey[key])}>
                                          <FormControlLabel
                                            control={<Checkbox checked={!!selectedByKey[key]} onChange={(_,v)=>onChangeSelection(key, v)} />}
                                            label={`Add this coverage for ${app === 'self' ? 'yourself' : app === 'spouse' ? 'your spouse' : 'your child(ren)'}`}
                                            sx={commonStyles.checkboxGroup}
                                          />
                                        </Box>
                                      </Stack>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        });
      })()}

      <PageNavigation onContinue={handleContinue} backPath="/eligibility" />

      {/* QuickDecision Modal */}
      <Dialog 
        open={showQuickDecisionModal} 
        onClose={() => setShowQuickDecisionModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>About QuickDecision<sup>SM</sup></DialogTitle>
        <DialogContent>
          <DialogContentText>
            QuickDecision uses data sources to verify your health history, so there are typically no medical exams or lab tests to receive a decision on your insurance application. Any approval decisions on applications are conditional upon confirmation of your group status and coverage limit eligibility. A referral decision may be given if an underwriter needs to further review your application and may reach out to confirm details or request additional information. QuickDecision may not be available in all states and territories.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQuickDecisionModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

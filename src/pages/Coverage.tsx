import * as React from "react";
import {
  Card, CardContent, Stack, Typography, Select, MenuItem, FormControl, InputLabel,
  Button, Box, Alert, Checkbox, FormControlLabel, Divider, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import { Person, People, ChildFriendly, InfoOutlined, Shield } from "@mui/icons-material";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import { useAppData } from "../state/AppDataContext";
import { useStepper } from "../state/StepperContext";
import { useNavigate } from "react-router-dom";
import { getProducts, quoteRate } from "../api/client";
import { getClientConfig } from "../config/clients";
import type { Applicant, Product, SelectedItem, CoverageCategory } from "../types/app";
import { getCoverageLabel } from "../utils/coverageIcons";
import { commonStyles } from "../theme/commonStyles";
// import { useSnackbar } from "../components/feedback/SnackbarProvider";



type SelKey = `${string}:${Applicant}`; // productId:applicant

export default function Coverage() {
  const { data, setCoverage } = useAppData();
  const { next, markComplete } = useStepper();
  const navigate = useNavigate();
  const clientConfig = getClientConfig();
  const isAMA = clientConfig.id === 'ama';

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
  const [optionalBenefitsByKey, setOptionalBenefitsByKey] = React.useState<Record<SelKey, Record<string, boolean>>>({});
  const [surgicalOptionAmountByKey, setSurgicalOptionAmountByKey] = React.useState<Record<SelKey, number | "">>({});
  const [showLearnMoreModal, setShowLearnMoreModal] = React.useState(false);
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
      // Initialize amounts to lowest available for all eligible products
      const initialAmounts: Record<SelKey, number> = {};
      const initialSelections: Record<SelKey, boolean> = {};
      const initialRiders: Record<SelKey, Record<string, boolean>> = {};

      // Check if we have saved coverage data to restore
      const savedCoverage = data.coverage;
      
      products.forEach(p => {
        chosenApplicants.forEach(app => {
          if (!p.eligibleApplicants.includes(app)) return;
          if (app === "self" && selfCats.size && !selfCats.has(p.category)) return;
          if (app === "spouse" && spouseCats.size && !spouseCats.has(p.category)) return;

          const key: SelKey = `${p.id}:${app}`;
          
          // Check if this product/applicant combination was previously saved
          const savedItem = savedCoverage?.find(
            item => item.productId === p.id && item.applicant === app
          );
          
          if (savedItem) {
            // Restore saved data
            initialAmounts[key] = savedItem.amount;
            initialSelections[key] = true;
            if (savedItem.riders) {
              initialRiders[key] = savedItem.riders as Record<string, boolean>;
            }
          } else if (p.amounts.length > 0) {
            // Set default lowest amount for products that weren't selected
            const lowestAmount = Math.min(...p.amounts);
            initialAmounts[key] = lowestAmount;
            initialSelections[key] = false;
          }
        });
      });

      setAmountByKey(initialAmounts);
      setSelectedByKey(initialSelections);
      if (Object.keys(initialRiders).length > 0) {
        setOptionalBenefitsByKey(initialRiders);
      }
    }
  }, [products, chosenApplicants, selfCats, spouseCats, elig, data.coverage]);

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

  // Auto-save coverage selections when they change
  const autoSaveTimeoutRef = React.useRef<NodeJS.Timeout>();
  React.useEffect(() => {
    // Only save if we have products loaded and some selections
    if (products.length === 0) return;
    
    // Debounce auto-save to prevent infinite loops
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      const selections: SelectedItem[] = [];
      for (const [key, isSelected] of Object.entries(selectedByKey)) {
        if (!isSelected) continue;
        const amt = amountByKey[key as SelKey];
        if (amt === "") continue;
        const rate = rateByKey[key as SelKey];
        if (typeof rate !== "number") continue;
        const [productId, applicant] = key.split(":") as [string, Applicant];
        
        // Get riders for this product/applicant combination
        const riders = optionalBenefitsByKey[key as SelKey];
        
        selections.push({
          productId,
          applicant,
          amount: Number(amt),
          estMonthly: rate,
          riders: riders || {}
        });
      }
      
      // Save to context (this will trigger sessionStorage save)
      if (selections.length > 0) {
        setCoverage(selections);
      }
    }, 300); // 300ms debounce
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedByKey, amountByKey, rateByKey, optionalBenefitsByKey, products]);

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
      
      // Get riders for this product/applicant combination
      const riders = optionalBenefitsByKey[key as SelKey];
      
      selections.push({
        productId,
        applicant,
        amount: Number(amt),
        estMonthly: rate,
        riders: riders || {}
      });
    }
    // save locally for later pages
    setCoverage(selections);
    // notify("Coverage selection saved.", "success");
    markComplete();
    next();
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
            <Box key={category} sx={{ mb: 4 }}>
              {/* Category Header - Outside of cards */}
              <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                {getCoverageLabel(category as CoverageCategory)}
              </Typography>

              {/* Products - Each in its own card */}
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
                          <Card key={p.id} sx={commonStyles.categoryCard}>
                            <CardContent sx={{ borderTop: '6px solid', borderTopColor: 'primary.main' }}>
                              <Stack spacing={2}>
                                {/* Product Section Header */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1}}>
                                  
                                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                    {p.name}
                                  </Typography>
                                </Box>

                            {/* Product Description - Only for Term Life Insurance */}
                            {p.name === "Term Life Insurance" && (
                              <Alert severity="info" sx={{ ...commonStyles.infoAlert, mb: 2 }}>
                                <Typography variant="body2">
                                  Annual Renewable Group Term Life, designed to provide protection for both you and your family. Optional Chronic Illness Rider (CIR) available.
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  QuickDecision<sup>SM</sup> allows you to get a faster decision on your application with typically no medical exam using medical underwriting automated processing. Eligibility factors include coverage amount, age, and state availability. If QuickDecision is not available, you may apply on a standard underwritten basis.{' '}
                                  <Button 
                                    variant="text" 
                                    size="small" 
                                    onClick={() => setShowLearnMoreModal(true)}
                                    sx={{ p: 0, minWidth: 'auto', textTransform: 'none', fontWeight: 'bold' }}
                                  >
                                    Learn More
                                  </Button>
                                </Typography>
                              </Alert>
                            )}

                            {/* Product Description - Only for 10-Year Level Term Life Insurance */}
                            {p.name === "10 Year Level Term Life Insurance" && (
                              <Alert severity="info" sx={{ ...commonStyles.infoAlert, mb: 2 }}>
                                <Typography variant="body2">
                                  Rates for coverage are expected to remain level but are not guaranteed.
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  QuickDecision<sup>SM</sup> allows you to get a faster decision on your application with typically no medical exam using medical underwriting automated processing. Eligibility factors include coverage amount, age, and state availability. If QuickDecision is not available, you may apply on a standard underwritten basis.{' '}
                                  <Button 
                                    variant="text" 
                                    size="small" 
                                    onClick={() => setShowLearnMoreModal(true)}
                                    sx={{ p: 0, minWidth: 'auto', textTransform: 'none', fontWeight: 'bold' }}
                                  >
                                    Learn More
                                  </Button>
                                </Typography>
                              </Alert>
                            )}

                            {/* Product Description - Only for 20-Year Level Term Life Insurance */}
                            {p.name === "20-Year Level Term Life Insurance" && (
                              <Alert severity="info" sx={{ ...commonStyles.infoAlert, mb: 2 }}>
                                <Typography variant="body2">
                                  Great fit for those in their 30s and 40s! A 20 year term can bring stability to your financial planning.
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  QuickDecision<sup>SM</sup> allows you to get a faster decision on your application with typically no medical exam using medical underwriting automated processing. Eligibility factors include coverage amount, age, and state availability. If QuickDecision is not available, you may apply on a standard underwritten basis.{' '}
                                  <Button 
                                    variant="text" 
                                    size="small" 
                                    onClick={() => setShowLearnMoreModal(true)}
                                    sx={{ p: 0, minWidth: 'auto', textTransform: 'none', fontWeight: 'bold' }}
                                  >
                                    Learn More
                                  </Button>
                                </Typography>
                              </Alert>
                            )}

                            {/* Product Description - Only for Accidental Death and Dismemberment Insurance */}
                            {p.name === "Accidental Death and Dismemberment Insurance" && (
                              <Alert severity="info" sx={{ ...commonStyles.infoAlert, mb: 2 }}>
                                <Typography variant="body2">
                                  Accidents are unpredictable. This guaranteed acceptance coverage can help you safeguard your family finances should an accident occur.
                                </Typography>
                              </Alert>
                            )}

                            {/* Product Description - Only for Long-Term Disability Plus Insurance */}
                            {p.name === "Long-Term Disability Plus Insurance" && (
                              <Alert severity="info" sx={{ ...commonStyles.infoAlert, mb: 2 }}>
                                <Typography variant="body2">
                                  Benefits are paid directly to you for disabilities due to a covered sickness or injury up to age 65. Various additional features that could be beneficial to you exist with this coverage.
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  QuickDecision<sup>SM</sup> allows you to get a faster decision on your application with typically no medical exam using medical underwriting automated processing. Eligibility factors include coverage amount, age, and state availability. If QuickDecision is not available, you may apply on a standard underwritten basis.{' '}
                                  <Button 
                                    variant="text" 
                                    size="small" 
                                    onClick={() => setShowLearnMoreModal(true)}
                                    sx={{ p: 0, minWidth: 'auto', textTransform: 'none', fontWeight: 'bold' }}
                                  >
                                    Learn More
                                  </Button>
                                </Typography>
                              </Alert>
                            )}

                            {/* Product Description - Only for Hospital Income Insurance */}
                            {(p.name === "Hospital Money Insurance" || p.name === "Hospital Income Insurance") && (
                              <>
                                <Alert severity="info" sx={{ ...commonStyles.infoAlert, mb: 2 }}>
                                  <Typography variant="body2">
                                    Guaranteed coverage to help offset costs during a hospital stay. Benefits paid directly to you to use where you need the most. Coverage is subject to a pre-existing condition limitation. Please see the brochure for detail.
                                  </Typography>
                                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                    THIS IS A SUPPLEMENT TO HEALTH INSURANCE AND IS NOT A SUBSTITUTE FOR MAJOR MEDICAL COVERAGE.
                                  </Typography>
                                </Alert>
                                
                                <Box sx={{ 
                                  bgcolor: 'white', 
                                  border: 1, 
                                  borderColor: 'grey.300', 
                                  borderRadius: 1, 
                                  p: 2, 
                                  mb: 2,
                                  fontSize: '14pt'
                                }}>
                                  <Typography variant="body2" sx={{ fontSize: '14pt', mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
                                    IMPORTANT: This is a fixed indemnity policy,<br />NOT health insurance
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '14pt', mb: 1 }}>
                                    This fixed indemnity policy may pay you a limited dollar amount if you're sick or hospitalized. You're still responsible for paying the cost of your care.
                                  </Typography>
                                  <Typography component="ul" variant="body2" sx={{ fontSize: '14pt', mb: 1, pl: 3 }}>
                                    <li>The payment you get isn't based on the size of your medical bill.</li>
                                    <li>There might be a limit on how much this policy will pay each year.</li>
                                    <li>This policy isn't a substitute for comprehensive health insurance.</li>
                                    <li>Since this policy isn't health insurance, it doesn't have to include most Federal consumer protections that apply to health insurance.</li>
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '14pt', mb: 1, fontWeight: 'bold' }}>
                                    Looking for comprehensive health insurance?
                                  </Typography>
                                  <Typography component="ul" variant="body2" sx={{ fontSize: '14pt', mb: 1, pl: 3 }}>
                                    <li>Visit HealthCare.gov or call 1-800-318-2596 (TTY: 1-855-889-4325) to find health coverage options.</li>
                                    <li>To find out if you can get health insurance through your job, or a family member's job, contact the employer.</li>
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '14pt', mb: 1, fontWeight: 'bold' }}>
                                    Questions about this policy?
                                  </Typography>
                                  <Typography component="ul" variant="body2" sx={{ fontSize: '14pt', pl: 3 }}>
                                    <li>For questions or complaints about this policy, contact your State Department of Insurance. Find their number on the National Association of Insurance Commissioners' website (naic.org) under "Insurance Departments."</li>
                                    <li>If you have this policy through your job, or a family member's job, contact the employer.</li>
                                  </Typography>
                                </Box>
                              </>
                            )}

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
                                          <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Box sx={commonStyles.iconCircle}>
                                              {app === 'self' && <Person color="primary" />}
                                              {app === 'spouse' && <People color="primary" />}
                                              {app === 'child' && <ChildFriendly color="primary" />}
                                            </Box>
                                            <Typography variant="h6">
                                              {app === 'self' ? 'Your' : app === 'spouse' ? 'Spouse' : 'Child'} {p.name}
                                            </Typography>
                                          </Stack>
                                        </Box>

                                        {/* Life Insurance Alerts */}
                                        {isLifeInsurance && app === "self" && (
                                          <Alert severity="info" sx={commonStyles.infoAlert}>
                                            <Typography variant="body2">
                                              {p.name === "10 Year Level Term Life Insurance" ? (
                                                "The maximum available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies. See brochure for details regarding rate expectations/guarantees."
                                              ) : (
                                                "The maximum available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies."
                                              )}
                                            </Typography>
                                          </Alert>
                                        )}

                                        {/* Accidental Death and Dismemberment Insurance Alerts */}
                                        {p.category === "LI" && p.name === "Accidental Death and Dismemberment Insurance" && app === "self" && (
                                          <Alert severity="info" sx={commonStyles.infoAlert}>
                                            <Typography variant="body2">
                                              The maximum available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies.
                                            </Typography>
                                          </Alert>
                                        )}

                                        {p.category === "LI" && p.name === "Accidental Death and Dismemberment Insurance" && app === "spouse" && (
                                          <Alert severity="info" sx={commonStyles.infoAlert}>
                                            <Typography variant="body2">
                                              Spouse coverage cannot exceed member coverage (including in force or requested coverage).
                                            </Typography>
                                          </Alert>
                                        )}

                                        {/* Long-Term Disability Plus Insurance Alerts */}
                                        {p.name === "Long-Term Disability Plus Insurance" && app === "self" && (
                                          <Alert severity="info" sx={commonStyles.infoAlert}>
                                            <Typography variant="body2">
                                              The maximum available through all ABE Group Insurance underwritten by New York Life Insurance Company is $12,000 for a member whether coverage is in one or divided among several group policies.
                                            </Typography>
                                          </Alert>
                                        )}

                                        {p.name === "Long-Term Disability Plus Insurance" && app === "spouse" && (
                                          <Alert severity="info" sx={commonStyles.infoAlert}>
                                            <Typography variant="body2">
                                              Spouse coverage cannot exceed nine times member coverage. The maximum available through all ABE Group Insurance underwritten by New York Life Insurance Company is $5,000 for a spouse, whether coverage is in one or divided among several group policies.
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

                                        {/* Estimated Cost */}
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                          Estimated Cost<sup>1</sup>
                                        </Typography>
                                        {typeof rate === "number" && val !== "" ? (
                                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                            <Typography 
                                              color="primary" 
                                              sx={{ 
                                                fontSize: { xs: '2rem', md: '2rem' },
                                                fontWeight: 'bold',
                                                lineHeight: 1
                                              }}
                                            >
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

                                        {/* Benefit Amount */}
                                        <FormControl fullWidth sx={{ mt: 3 }}>
                                          <InputLabel>Benefit Amount</InputLabel>
                                          <Select
                                            value={val}
                                            label="Benefit Amount"
                                            onChange={(e) => onChangeAmount(key, p.id, app, e.target.value as number)}
                                          >
                                            {p.amounts.map(a => (
                                              <MenuItem key={a} value={a}>
                                                {p.category === "DI" || p.category === "OO" ? `$${a}/mo` : `$${a.toLocaleString()}`}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>

                                        {/* QuickDecision Indicator - only for products with QuickDecision notes and not for children */}
                                        {(p.name === "Term Life Insurance" || p.name === "10 Year Level Term Life Insurance" || p.name === "20-Year Level Term Life Insurance" || p.name === "Long-Term Disability Plus Insurance") && app !== 'child' && (
                                          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                                            <Tooltip 
                                              title={
                                                // Show Standard Underwriting if optional benefits are selected for Term Life
                                                (p.name === "Term Life Insurance" && optionalBenefitsByKey[key]?.chronicIllnessRider) ?
                                                  "If QuickDecision is not available, you may apply on a standard underwritten basis. You will be asked about your health and medical history, and may be requested to schedule a brief medical exam." :
                                                  "QuickDecision\u1d43\u1d50 allows you to get a faster decision on your application with typically no medical exam using medical underwriting automated processing. Eligibility factors include coverage amount, age, and state availability. If QuickDecision is not available, you may apply on a standard underwritten basis."
                                              }
                                              arrow
                                              placement="top"
                                              enterTouchDelay={0}
                                              leaveTouchDelay={3000}
                                            >
                                              <Chip
                                                label={
                                                  <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <Typography 
                                                      variant="caption" 
                                                      sx={{ 
                                                        color: (p.name === "Term Life Insurance" && optionalBenefitsByKey[key]?.chronicIllnessRider) ? 
                                                          'text.primary' : 'white' 
                                                      }}
                                                    >
                                                      {(p.name === "Term Life Insurance" && optionalBenefitsByKey[key]?.chronicIllnessRider) ?
                                                        "Standard Underwriting" :
                                                        "QuickDecision"}
                                                    </Typography>
                                                    <InfoOutlined 
                                                      sx={{ 
                                                        fontSize: '14px', 
                                                        color: (p.name === "Term Life Insurance" && optionalBenefitsByKey[key]?.chronicIllnessRider) ? 
                                                          'text.primary' : 'white' 
                                                      }} 
                                                    />
                                                  </Stack>
                                                }
                                                size="small"
                                                color={
                                                  (p.name === "Term Life Insurance" && optionalBenefitsByKey[key]?.chronicIllnessRider) ?
                                                    "default" :
                                                    "success"
                                                }
                                                variant="filled"
                                              />
                                            </Tooltip>
                                          </Box>
                                        )}

                                        {/* Add Coverage Checkbox */}
                                        <FormControlLabel
                                          control={<Checkbox checked={!!selectedByKey[key]} onChange={(_,v)=>onChangeSelection(key, v)} />}
                                          label={`Add for ${app === 'self' ? 'yourself' : app === 'spouse' ? 'your spouse' : 'your child(ren)'}`}
                                        />

                                        {/* Optional Benefits Section - Term Life Insurance Only (Self and Spouse) */}
                                        {p.name === "Term Life Insurance" && selectedByKey[key] && (app === 'self' || app === 'spouse') && (
                                          <Box sx={{ mt: 2, mb: 2 }}>
                                            <Typography variant="h6" gutterBottom>
                                              Optional Benefit(s)
                                            </Typography>
                                            <FormControlLabel
                                              control={
                                                <Checkbox
                                                  checked={optionalBenefitsByKey[key]?.['chronicIllnessRider'] || false}
                                                  onChange={(e) => {
                                                    setOptionalBenefitsByKey(prev => ({
                                                      ...prev,
                                                      [key]: {
                                                        ...prev[key],
                                                        chronicIllnessRider: e.target.checked
                                                      }
                                                    }));
                                                  }}
                                                />
                                              }
                                              label="Chronic Illness Rider (CIR)"
                                            />
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                                              Chronic Illness Rider (CIR): Accelerate up to 50% of the portion of your life insurance subject to the Chronic Illness Rider should you be permanently unable to perform 2 out of 6 activities of daily living or require substantial care due to permanent cognitive impairment.
                                            </Typography>
                                          </Box>
                                        )}

                                        {/* Optional Benefits Section - Hospital Income Insurance Only (Self and Spouse) */}
                                        {(p.name === "Hospital Income Insurance" || p.name === "Hospital Money Insurance") && selectedByKey[key] && (app === 'self' || app === 'spouse') && (
                                          <Box sx={{ mt: 2, mb: 2 }}>
                                            <Typography variant="h6" gutterBottom>
                                              Optional Benefit(s)
                                            </Typography>
                                            <FormControlLabel
                                              control={
                                                <Checkbox
                                                  checked={optionalBenefitsByKey[key]?.['surgicalOption'] || false}
                                                  onChange={(e) => {
                                                    setOptionalBenefitsByKey(prev => ({
                                                      ...prev,
                                                      [key]: {
                                                        ...prev[key],
                                                        surgicalOption: e.target.checked
                                                      }
                                                    }));
                                                    // Clear surgical option amount if unchecked
                                                    if (!e.target.checked) {
                                                      setSurgicalOptionAmountByKey(prev => ({
                                                        ...prev,
                                                        [key]: ""
                                                      }));
                                                    }
                                                  }}
                                                />
                                              }
                                              label="Surgical Option"
                                            />
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                                              Surgical Option: Pay a specified amount for a qualifying surgical procedure up to the maximum for the option selected. See brochure/certificate for exclusions. Note: Selection applies to all applicants for whom you are requesting Hospital Money Insurance.
                                            </Typography>
                                            
                                            {/* Surgical Option Coverage Amount Dropdown */}
                                            {optionalBenefitsByKey[key]?.['surgicalOption'] && (
                                              <FormControl fullWidth sx={{ mt: 2, ml: 4, pr: 4 }}>
                                                <InputLabel>Coverage Amount</InputLabel>
                                                <Select
                                                  value={surgicalOptionAmountByKey[key] ?? ""}
                                                  label="Coverage Amount"
                                                  onChange={(e) => {
                                                    setSurgicalOptionAmountByKey(prev => ({
                                                      ...prev,
                                                      [key]: e.target.value as number
                                                    }));
                                                  }}
                                                >
                                                  <MenuItem value={1000}>$1,000</MenuItem>
                                                  <MenuItem value={2000}>$2,000</MenuItem>
                                                  <MenuItem value={3000}>$3,000</MenuItem>
                                                  <MenuItem value={4000}>$4,000</MenuItem>
                                                  <MenuItem value={5000}>$5,000</MenuItem>
                                                </Select>
                                              </FormControl>
                                            )}
                                          </Box>
                                        )}
                                      </Stack>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </Stack>

                            {/* AMA-Specific: Estimated Cost Breakdown - After all applicants */}
                            {isAMA && (
                              <Card variant="outlined" sx={{ ...commonStyles.coverageCard, mt: 2 }}>
                                <CardContent>
                                  <Typography variant="h6" gutterBottom>
                                    Estimated Cost Breakdown
                                  </Typography>
                                  <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="body2">Premium Cost:</Typography>
                                      <Typography variant="body2" fontWeight={500}>$45.00</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="body2">Non-AMA Member Policy Fee:</Typography>
                                      <Typography variant="body2" fontWeight={500}>$25.00</Typography>
                                    </Box>
                                    <Divider />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="body1" fontWeight={600}>Total:</Typography>
                                      <Typography variant="body1" fontWeight={600}>$70.00</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ mt: 2 }}>
                                      Questions? Call{' '}
                                      <Typography
                                        component="a"
                                        href="tel:888-627-5902"
                                        sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                      >
                                        888-627-5902
                                      </Typography>
                                    </Typography>
                                  </Stack>
                                </CardContent>
                              </Card>
                            )}
                              </Stack>
                            </CardContent>
                          </Card>
                        );
                      })}
              </Stack>
            </Box>
          );
        });
      })()}

      {/* Footnote */}
      <Box sx={{ mt: 4, mb: 2, px: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <sup>1</sup>Quoted cost is the best rate available based on the information you provided. Final cost may be based upon factors such as gender, health status, and use of tobacco/nicotine. Rates current as of 2025.
        </Typography>
      </Box>

      <PageNavigation onContinue={handleContinue} backPath="/eligibility" />

      {/* Learn More Modal */}
      <Dialog 
        open={showLearnMoreModal} 
        onClose={() => setShowLearnMoreModal(false)}
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
          <Button onClick={() => setShowLearnMoreModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

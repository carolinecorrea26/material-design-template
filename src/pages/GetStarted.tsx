import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Stack,
  Typography,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField,
  Link as MuiLink,
  Tooltip,
} from "@mui/material";
import {
  PublishedWithChangesRounded,
  AccessTimeRounded,
  AccessTimeFilledRounded,
  ExpandMore,
  GppGoodRounded,
  LocalLibraryRounded,
} from "@mui/icons-material";
import { COVERAGE_CARDS } from "../constants/getStartedProducts";
import PageHeader from "../components/layout/PageHeader";
import FormStepTransition from "../components/layout/FormStepTransition";
import FormPageLayout from "../components/layout/FormPageLayout";
import PageNavigation from "../components/layout/PageNavigation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import RHFTextField from "../components/form/RHFTextField";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFSelect from "../components/form/RHFSelect";
import RHFCheckbox from "../components/form/RHFCheckbox";
import { formatUSPhone } from "../utils/formatting";
import {
  ACTIVE_CLIENT_ID,
  getClientBranding,
  getClientCoverageCategories,
  getClientFeatures,
  getClientMembershipQuestion,
} from "../config/clients";
import { getProducts } from "../api/client";
import { COVERAGE_CATEGORY_LABELS } from "../constants/coverage";
import { TITLE_OPTIONS } from "../constants/eligibility";
import { useAppData } from "../state/AppDataContext";
import { commonStyles } from "../theme/commonStyles";
import CoverageIcon from "../utils/coverageIcons";
import type { Product, CoverageCategory, Applicant } from "../types/app";

type CoverageCardView = {
  id: CoverageCategory;
  title: string;
  description: string;
  products: Array<{
    id: string;
    name: string;
    applicants: string[];
    href: string;
  }>;
};

type MembershipFormValues = {
  isMember?: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  waepaAttestation?: string;
  waepaEmployer?: string;
  waepaStartDate?: string;
  waepaDeclaration?: boolean;
};

const APPLICANT_LABELS: Record<Applicant, string> = {
  self: "Self",
  spouse: "Spouse",
  child: "Child",
};

const BROCHURE_BASE_URL = "https://d160mojjx9yhiu.cloudfront.net/pdfs/4591";

export default function GetStarted() {
  const { data, setEligibility, setContact } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const membershipQuestion = getClientMembershipQuestion();
  const [membershipValue, setMembershipValue] = React.useState<
    string | undefined
  >(data.eligibility?.isMember);
  const isWaepa = ACTIVE_CLIENT_ID === "waepa";
  const branding = getClientBranding();
  const clientFeatures = React.useMemo(() => getClientFeatures(), []);
  const clientCoverageCategories = React.useMemo(
    () => getClientCoverageCategories(),
    [],
  );
  const [productCatalog, setProductCatalog] = React.useState<Product[]>([]);
  const [quickQuoteOpen, setQuickQuoteOpen] = React.useState(false);

  const defaultValues = React.useMemo<MembershipFormValues>(
    () => ({
      isMember: data.eligibility?.isMember ?? "",
      title: data.eligibility?.title ?? "",
      firstName: data.eligibility?.firstName ?? "",
      middleInitial: data.eligibility?.middleInitial ?? "",
      lastName: data.eligibility?.lastName ?? "",
      suffix: data.eligibility?.suffix ?? "",
      email: data.eligibility?.email ?? "",
      phoneNumber: data.contact?.phoneNumber ?? "",
      phoneType:
        (data.contact?.phoneType as MembershipFormValues["phoneType"]) ??
        undefined,
      waepaAttestation: data.eligibility?.waepaAttestation ?? "",
      waepaEmployer: data.eligibility?.waepaEmployer ?? "",
      waepaStartDate: data.eligibility?.waepaStartDate ?? "",
      waepaDeclaration: data.eligibility?.waepaDeclaration ?? false,
    }),
    [data.contact, data.eligibility],
  );

  const validationSchema = React.useMemo(() => {
    return z
      .object({
        isMember: z.string().min(1, "Please select an option"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phoneNumber: z.string().optional(),
        waepaAttestation: z.string().optional(),
        waepaEmployer: z.string().optional(),
        waepaStartDate: z.string().optional(),
        waepaDeclaration: z.boolean().optional(),
      })
      .superRefine((values, ctx) => {
        const isWaepaMember = isWaepa && values.isMember === "new";
        const requiresCoreFields =
          isWaepaMember || (!!values.isMember && values.isMember !== "no");

        if (requiresCoreFields) {
          if (!values.firstName) {
            ctx.addIssue({
              code: "custom",
              path: ["firstName"],
              message: "First Name is required",
            });
          }
          if (!values.lastName) {
            ctx.addIssue({
              code: "custom",
              path: ["lastName"],
              message: "Last Name is required",
            });
          }
          if (!values.email) {
            ctx.addIssue({
              code: "custom",
              path: ["email"],
              message: "Email is required",
            });
          }
          if (!values.phoneNumber) {
            ctx.addIssue({
              code: "custom",
              path: ["phoneNumber"],
              message: "Phone Number is required",
            });
          }
        }

        if (isWaepaMember) {
          if (!values.waepaAttestation) {
            ctx.addIssue({
              code: "custom",
              path: ["waepaAttestation"],
              message: "Please select an option",
            });
          }
          if (!values.waepaDeclaration) {
            ctx.addIssue({
              code: "custom",
              path: ["waepaDeclaration"],
              message: "You must accept the declaration",
            });
          }
          if (values.waepaAttestation === "federal-active") {
            if (!values.waepaEmployer) {
              ctx.addIssue({
                code: "custom",
                path: ["waepaEmployer"],
                message: "Please select your employing agency",
              });
            }
            if (!values.waepaStartDate) {
              ctx.addIssue({
                code: "custom",
                path: ["waepaStartDate"],
                message: "Start Date is required",
              });
            }
          }
        }
      });
  }, [isWaepa]);

  const methods = useForm<MembershipFormValues>({
    defaultValues,
    resolver: zodResolver(validationSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  React.useEffect(() => {
    methods.reset(defaultValues);
  }, [defaultValues, methods]);

  React.useEffect(() => {
    let mounted = true;
    getProducts()
      .then((fetched) => {
        if (mounted && Array.isArray(fetched) && fetched.length > 0) {
          setProductCatalog(fetched);
        }
      })
      .catch((error) => {
        console.error("Failed to load products", error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const brochurePrefix = React.useMemo(
    () => branding.acronym?.toLowerCase() ?? "abe",
    [branding.acronym],
  );

  const getBrochureUrl = React.useCallback(
    (category: CoverageCategory) =>
      `${BROCHURE_BASE_URL}/${brochurePrefix}-${category.toLowerCase()}-overview.pdf`,
    [brochurePrefix],
  );

  const defaultCoverageCards = React.useMemo<CoverageCardView[]>(
    () =>
      COVERAGE_CARDS.map((card) => ({
        id: card.id as CoverageCategory,
        title: card.title,
        description: card.description,
        products: card.products.map((product) => ({
          id: product.id,
          name: product.name,
          applicants: product.applicants,
          href: getBrochureUrl(card.id as CoverageCategory),
        })),
      })),
    [getBrochureUrl],
  );

  const coverageCards = React.useMemo<CoverageCardView[]>(() => {
    if (productCatalog.length === 0) {
      return defaultCoverageCards;
    }

    const grouped: Record<CoverageCategory, Product[]> = {
      LI: [],
      AD: [],
      DI: [],
      OO: [],
      SH: [],
    };

    productCatalog.forEach((product) => {
      if (grouped[product.category]) {
        grouped[product.category].push(product);
      }
    });

    const cards = (Object.keys(grouped) as CoverageCategory[])
      .map((category) => {
        const categoryProducts = grouped[category];
        if (categoryProducts.length === 0) return null;
        const meta = COVERAGE_CARDS.find((card) => card.id === category);
        return {
          id: category,
          title: meta?.title ?? COVERAGE_CATEGORY_LABELS[category],
          description: meta?.description ?? "",
          products: categoryProducts.map((product) => ({
            id: product.id,
            name: product.name,
            applicants: product.eligibleApplicants.map(
              (applicant) => APPLICANT_LABELS[applicant] ?? applicant,
            ),
            href: getBrochureUrl(category),
          })),
        } satisfies CoverageCardView;
      })
      .filter((card): card is CoverageCardView => Boolean(card));

    return cards.length ? cards : defaultCoverageCards;
  }, [productCatalog, defaultCoverageCards, getBrochureUrl]);

  const coverageInfoCards = React.useMemo(
    () =>
      coverageCards.filter((card) =>
        clientCoverageCategories.includes(card.id),
      ),
    [clientCoverageCategories, coverageCards],
  );

  const showIntroNote = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    const introParam = params.get("intro")?.toLowerCase();
    if (introParam === "false") return false;
    if (introParam === "true") return true;
    return clientFeatures.showGetStartedIntro ?? true;
  }, [clientFeatures.showGetStartedIntro, location.search]);

  const IntroNote = React.useCallback(
    () => (
      <Alert severity="info" icon={false}>
        <Stack spacing={1.5}>
          <Accordion
            disableGutters
            elevation={0}
            sx={{
              bgcolor: "transparent",
              boxShadow: "none",
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                px: 0,
                minHeight: "auto",
                "& .MuiAccordionSummary-content": { my: 0.5 },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocalLibraryRounded sx={{ color: "#0049bb", fontSize: 18 }} />
                <Typography variant="body2" fontWeight={600}>
                  Learn more about this application
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pt: 1.5 }}>
              <Typography variant="body2" color="text.primary" sx={{ mb: 2 }}>
                You may apply for the following{" "}
                <Tooltip title="Group insurance provides coverage to eligible individuals through an organization or association.">
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      cursor: "pointer",
                    }}
                  >
                    group coverage
                  </Box>
                </Tooltip>{" "}
                available through this site. Your eligibility and any applicable
                coverage options will be confirmed as part of the application.
              </Typography>
              {coverageInfoCards.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small" aria-label="Coverage categories">
                    <TableHead
                      sx={{ display: { xs: "none", sm: "table-header-group" } }}
                    >
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell sx={{ fontWeight: 700, width: "35%" }}>
                          Category
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Coverage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {coverageInfoCards.map((card) => (
                        <TableRow
                          key={card.id}
                          sx={{
                            display: { xs: "block", sm: "table-row" },
                            px: { xs: 1.5, sm: 0 },
                            py: { xs: 1.5, sm: 0 },
                            "&:last-child td, &:last-child th": {
                              borderBottom: 0,
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              verticalAlign: "top",
                              py: 1.5,
                              display: { xs: "block", sm: "table-cell" },
                              borderBottom: { xs: 0, sm: "1px solid" },
                              borderColor: { xs: "transparent", sm: "divider" },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 1,
                                textAlign: "center",
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
                                sx={{
                                  ...commonStyles.coverageCategoryLabel,
                                  textAlign: "center",
                                }}
                              >
                                {COVERAGE_CATEGORY_LABELS[card.id]}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            <Box
                              component="ul"
                              sx={{
                                m: 0,
                                pl: 2,
                                display: "grid",
                                gap: 0.5,
                              }}
                            >
                              {card.products.map((product) => (
                                <Box
                                  component="li"
                                  key={product.id}
                                  sx={{ lineHeight: 1.4 }}
                                >
                                  <MuiLink
                                    href={product.href}
                                    target="_blank"
                                    rel="noopener"
                                    underline="none"
                                    color="primary"
                                    sx={{
                                      fontSize: "0.9rem",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {product.name}
                                  </MuiLink>
                                </Box>
                              ))}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Coverage details will appear here once products are available.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Stack>
      </Alert>
    ),
    [coverageInfoCards],
  );

  const membershipQuestionElement = React.useMemo(() => {
    if (isWaepa) {
      return (
        <Stack spacing={1}>
          <RHFRadioGroup
            name="isMember"
            label="Are you a current WAEPA member, or are you becoming a new member?"
            options={[
              { label: "Current member", value: "current" },
              { label: "New member", value: "new" },
            ]}
            required
          />
          <Typography variant="body2" color="text.secondary">
            Applying for coverage will make you a member.
          </Typography>
        </Stack>
      );
    }

    const questionText =
      membershipQuestion?.primaryQuestion ??
      "Are you an active member of your association?";

    if (membershipQuestion?.type === "select") {
      const options = membershipQuestion.options ?? [];
      if (options.length > 0) {
        return (
          <RHFSelect
            name="isMember"
            label={questionText}
            options={options}
            required
          />
        );
      }
    }

    return (
      <RHFRadioGroup
        name="isMember"
        label={questionText}
        options={
          membershipQuestion?.options ?? [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ]
        }
        required
      />
    );
  }, [isWaepa, membershipQuestion]);

  const handleConfirmMembership = methods.handleSubmit((values) => {
    setEligibility({
      ...data.eligibility,
      isMember: values.isMember ?? data.eligibility?.isMember,
      firstName: values.firstName ?? data.eligibility?.firstName ?? "",
      lastName: values.lastName ?? data.eligibility?.lastName ?? "",
      email: values.email ?? data.eligibility?.email ?? "",
      waepaAttestation: values.waepaAttestation,
      waepaEmployer: values.waepaEmployer,
      waepaStartDate: values.waepaStartDate,
      waepaDeclaration: values.waepaDeclaration,
    });

    if (values.phoneNumber) {
      setContact({
        ...data.contact,
        phoneNumber: values.phoneNumber,
      });
    }

    navigate("/eligibility");
  });

  React.useEffect(() => {
    const subscription = methods.watch((value, { name }) => {
      if (name === "isMember") {
        setMembershipValue((value.isMember as string) ?? undefined);
      }

      setEligibility({
        ...data.eligibility,
        isMember: value.isMember ?? data.eligibility?.isMember,
        firstName: value.firstName ?? data.eligibility?.firstName ?? "",
        lastName: value.lastName ?? data.eligibility?.lastName ?? "",
        email: value.email ?? data.eligibility?.email ?? "",
        waepaAttestation:
          value.waepaAttestation ?? data.eligibility?.waepaAttestation,
        waepaEmployer: value.waepaEmployer ?? data.eligibility?.waepaEmployer,
        waepaStartDate:
          value.waepaStartDate ?? data.eligibility?.waepaStartDate,
        waepaDeclaration:
          value.waepaDeclaration ?? data.eligibility?.waepaDeclaration,
      });

      if (value.phoneNumber !== undefined) {
        setContact({
          ...data.contact,
          phoneNumber: value.phoneNumber,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, data.eligibility, data.contact, setEligibility, setContact]);

  React.useEffect(() => {
    const handleFillForm = () => {
      const filledData: MembershipFormValues = {
        isMember: isWaepa ? "new" : "yes",
        firstName: "Jordan",
        lastName: "Smith",
        email: "jordan.smith@example.com",
        phoneNumber: "555-123-4567",
        waepaAttestation: "federal-active",
        waepaEmployer: "Federal Bureau of Investigation",
        waepaStartDate: "2022-01-15",
        waepaDeclaration: true,
      };

      methods.reset(filledData);
    };

    window.addEventListener("devtools:fillform", handleFillForm);
    return () =>
      window.removeEventListener("devtools:fillform", handleFillForm);
  }, [methods, isWaepa]);

  const showAdditionalFields = React.useMemo(() => {
    if (!membershipValue) {
      return false;
    }
    if (isWaepa || ACTIVE_CLIENT_ID === "ama") {
      return true;
    }
    return membershipValue === "yes";
  }, [isWaepa, membershipValue]);

  const showIneligibleMessage =
    membershipValue === "no" && ACTIVE_CLIENT_ID !== "ama" && !isWaepa;

  const waepaAttestation = methods.watch("waepaAttestation") as
    | string
    | undefined;
  const waepaDeclaration = methods.watch("waepaDeclaration") as
    | boolean
    | undefined;
  const showWaepaNewMemberFields = isWaepa && membershipValue === "new";
  const showWaepaEmploymentFields =
    showWaepaNewMemberFields && waepaAttestation === "federal-active";

  const waepaContinueDisabled =
    showAdditionalFields && showWaepaNewMemberFields && !waepaDeclaration;

  const WAEPA_ATTESTATION_OPTIONS = React.useMemo(
    () => [
      {
        label:
          "I am a civilian federal employee of the U.S. government actively at work",
        value: "federal-active",
      },
      {
        label: "I am a retired civilian federal annuitant",
        value: "federal-annuitant",
      },
      {
        label: "I am a former federal employee",
        value: "former-federal",
      },
      {
        label:
          "I am a spouse of a WAEPA member and want to apply as an Associate member",
        value: "spouse-associate",
      },
      {
        label:
          "I am an adult child of a WAEPA member and want to apply as an Associate member",
        value: "child-associate",
      },
    ],
    [],
  );

  const WAEPA_EMPLOYER_OPTIONS = React.useMemo(
    () => [
      "Administration for Children and Families",
      "Administrative Conference of the United States",
      "Administrative Review Board",
      "Agricultural Marketing Service",
      "Federal Bureau of Investigation",
    ],
    [],
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleConfirmMembership} noValidate>
        <FormPageLayout
          header={
            <PageHeader
              title="Start your insurance application"
              notes={
                <Stack spacing={2} sx={{ maxWidth: "80ch" }}>
                  <Typography
                    color="text.primary"
                    sx={{ fontWeight: 400, lineHeight: 1.6 }}
                  >
                    This application is for
                    {` ${branding.acronym ?? branding.name}`}-sponsored group
                    insurance, with coverage options available exclusively to
                    its members.
                  </Typography>
                  {showIntroNote ? <IntroNote /> : null}
                </Stack>
              }
            />
          }
          navigation={
            showAdditionalFields ? (
              <PageNavigation
                showBack={false}
                continueDisabled={waepaContinueDisabled}
              />
            ) : null
          }
        >
          <FormStepTransition>
            <Stack spacing={3}>
              {membershipQuestionElement}
              {showIneligibleMessage && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  Only members are eligible for coverage. Please contact your
                  association for assistance.
                </Alert>
              )}

              {showWaepaNewMemberFields && (
                <>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    Welcome! Please provide the following information to
                    complete your membership.
                  </Alert>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    {ACTIVE_CLIENT_ID === "ama" && (
                      <Box sx={{ width: { xs: "100%", md: "100px" } }}>
                        <RHFSelect
                          name="title"
                          label="Title"
                          options={TITLE_OPTIONS}
                        />
                      </Box>
                    )}
                    <Box sx={{ flex: 1 }}>
                      <RHFTextField
                        name="firstName"
                        label="First Name"
                        required
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <RHFTextField
                        name="lastName"
                        label="Last Name"
                        required
                      />
                    </Box>
                  </Stack>
                  <RHFTextField
                    name="email"
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                  <Controller
                    name="phoneNumber"
                    control={methods.control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Phone Number"
                        required
                        fullWidth
                        autoComplete="tel"
                        inputProps={{ inputMode: "tel" }}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(formatUSPhone(e.target.value))
                        }
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                  <RHFSelect
                    name="waepaAttestation"
                    label="I hereby attest that I am a U.S. citizen and meet one of the following qualifications:"
                    options={WAEPA_ATTESTATION_OPTIONS}
                    required
                    useStandardLabel
                  />
                  {showWaepaEmploymentFields && (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      <Controller
                        name="waepaEmployer"
                        control={methods.control}
                        rules={{
                          required: "Please select your employing agency",
                        }}
                        render={({ field, fieldState }) => (
                          <Autocomplete
                            options={WAEPA_EMPLOYER_OPTIONS}
                            value={field.value ?? null}
                            onChange={(_, value) => field.onChange(value)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="I am employed by"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                              />
                            )}
                          />
                        )}
                      />
                      <RHFTextField
                        name="waepaStartDate"
                        label="Start Date"
                        type="date"
                        required
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>
                  )}
                  <RHFCheckbox
                    name="waepaDeclaration"
                    label="By submitting this application, I attest that the answers to the questions herein are true."
                    rules={{ required: true }}
                    required
                  />
                </>
              )}

              {showAdditionalFields && (
                <>
                  {!showWaepaNewMemberFields && (
                    <>
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                      >
                        {ACTIVE_CLIENT_ID === "ama" && (
                          <Box sx={{ width: { xs: "100%", md: "100px" } }}>
                            <RHFSelect
                              name="title"
                              label="Title"
                              options={TITLE_OPTIONS}
                            />
                          </Box>
                        )}
                        <Box sx={{ flex: 1 }}>
                          <RHFTextField
                            name="firstName"
                            label="First Name"
                            required
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <RHFTextField
                            name="lastName"
                            label="Last Name"
                            required
                          />
                        </Box>
                      </Stack>

                      <RHFTextField
                        name="email"
                        label="Email"
                        type="email"
                        required
                        autoComplete="email"
                      />

                      <Controller
                        name="phoneNumber"
                        control={methods.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Phone Number"
                            required
                            fullWidth
                            autoComplete="tel"
                            inputProps={{ inputMode: "tel" }}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(formatUSPhone(e.target.value))
                            }
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />
                    </>
                  )}
                </>
              )}
            </Stack>
          </FormStepTransition>

          <Dialog
            open={quickQuoteOpen}
            onClose={() => setQuickQuoteOpen(false)}
            aria-labelledby="quick-quote-title"
          >
            <DialogTitle id="quick-quote-title">Quick Quote</DialogTitle>
            <DialogContent>
              <Typography>Quick quote modal coming soon.</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setQuickQuoteOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </FormPageLayout>
      </form>
    </FormProvider>
  );
}

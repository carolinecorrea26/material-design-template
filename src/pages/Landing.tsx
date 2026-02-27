import * as React from "react";
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Chip,
  Switch,
  Skeleton,
} from "@mui/material";
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRightAlt as ArrowRightAltIcon,
  VerifiedUserOutlined as VerifiedUserOutlinedIcon,
} from "@mui/icons-material";
import {
  getClientBranding,
  getClientFeatures,
  ACTIVE_CLIENT_ID,
} from "../config/clients";
import CoverageCategoryCard from "../components/coverage/CoverageCategoryCard";
import RadioGroup from "../components/form/RadioGroup";
import QuoteModal from "../components/coverage/QuoteModal";
import { FadeIn } from "../components/animations/FadeIn";
import { commonStyles } from "../theme/commonStyles";
import { getProducts } from "../api/client";
import type { Product, CoverageCategory } from "../types/app";
import { usePageLoading } from "../state/PageLoadingContext";

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "U.S. Armed Forces Pacific",
  "U.S. Armed Forces Americas",
];

const RATINGS = [
  { rating: "A++", agency: "A.M. Best" },
  { rating: "AAA", agency: "Fitch Ratings" },
  { rating: "Aa1", agency: "Moody's Investors Service" },
  { rating: "AA+", agency: "Standard & Poor's" },
];

const CATEGORY_DESCRIPTIONS: Record<CoverageCategory, string> = {
  LI: "Think about what your family would need to maintain their current standard of living if you were no longer there to help provide for them. Your income is most likely critical to meeting monthly expenses. We have choices that will meet your budget today while still providing peace of mind for your family's future.",
  DI: "A disability could potentially destroy your way of life. If you were to become disabled, Disability Insurance is commensurate with your profession so that you can live your life with all things you've enjoyed at your income level.",
  OO: "In the event of a total disability or illness, this coverage can help protect your practice and assets by paying a monthly benefit for your office expenses.",
  SH: "Critical Illness provides added protection for yourself and your family from the financial impact of a specific, life-threatening illness. Hospital Income Insurance is guaranteed coverage that can help offset costs during a hospital stay.",
};

interface LandingProps {
  hideNonHero?: boolean;
}

const LandingSkeleton = () => (
  <Box sx={{ width: "100%", py: { xs: 4, md: 6 } }}>
    <Container maxWidth="lg" sx={{ maxWidth: "1400px !important" }}>
      <Stack spacing={4}>
        <Box>
          <Skeleton variant="rounded" height={220} animation="wave" />
        </Box>
        <Stack spacing={2}>
          <Skeleton variant="text" width="60%" height={36} animation="wave" />
          <Skeleton variant="text" width="80%" height={24} animation="wave" />
          <Skeleton variant="text" width="50%" height={24} animation="wave" />
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Skeleton
              variant="rounded"
              width={180}
              height={48}
              animation="wave"
            />
            <Skeleton
              variant="rounded"
              width={180}
              height={48}
              animation="wave"
            />
          </Box>
        </Stack>
        <Stack spacing={2}>
          <Skeleton variant="text" width="40%" height={28} animation="wave" />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Skeleton
              variant="rounded"
              height={140}
              animation="wave"
              sx={{ flex: 1 }}
            />
            <Skeleton
              variant="rounded"
              height={140}
              animation="wave"
              sx={{ flex: 1 }}
            />
            <Skeleton
              variant="rounded"
              height={140}
              animation="wave"
              sx={{ flex: 1 }}
            />
          </Stack>
        </Stack>
      </Stack>
    </Container>
  </Box>
);

const HeroSection: React.FC<{
  hideNonHero: boolean;
  hideQuote: boolean;
  scrollToQuote: () => void;
}> = ({ hideNonHero, hideQuote, scrollToQuote }) => {
  const branding = getClientBranding();
  const features = getClientFeatures();

  return (
    <Box
      sx={{
        width: "100%",
        py: { xs: 0, md: 6 },
        position: "relative",
        overflow: "hidden",
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: { xs: "auto", md: 0 },
          top: { xs: 0, md: "auto" },
          right: { xs: "50%", md: 0 },
          transform: { xs: "translateX(50%)", md: "none" },
          width: { xs: "100%", md: "60%" },
          height: { xs: "350px", md: "100%" },
          backgroundImage: "url(/hero-people.jpg)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: { xs: "center top", md: "bottom right" },
          backgroundSize: { xs: "contain", lg: "cover" },
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          maxWidth: "1400px !important",
          position: "relative",
          zIndex: 1,
          pt: { xs: "260px", md: 0 },
        }}
      >
        <Box
          sx={{
            background: {
              xs: "rgba(255, 255, 255, 0.85)",
              md: "rgba(255, 255, 255, 0.95)",
            },
            padding: { xs: "1.5rem", md: "2rem" },
            borderRadius: "10px",
            maxWidth: { xs: "100%", md: "700px" },
          }}
        >
          <Stack spacing={2.5} alignItems={{ xs: "center", md: "flex-start" }}>
            <FadeIn trigger="immediate" delay={0.1}>
              <Chip
                icon={<VerifiedUserOutlinedIcon sx={{ fontSize: "1rem" }} />}
                label="Simple • Secure • Member-only rates"
                variant="outlined"
                sx={{
                  borderColor: "divider",
                  bgcolor: "#f9fafc",
                  fontSize: "0.75rem",
                  height: "auto",
                  py: 0.5,
                  "& .MuiChip-label": { px: 1.5 },
                  "& .MuiChip-icon": { color: "primary.main" },
                }}
              />
            </FadeIn>

            <FadeIn trigger="immediate" delay={0.2}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.5rem", md: "3rem", lg: "3.5rem" },
                  textAlign: { xs: "center", md: "left" },
                  fontWeight: 700,
                }}
              >
                {branding.heroTitle}
              </Typography>
            </FadeIn>

            <FadeIn trigger="immediate" delay={0.35}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  fontSize: { xs: "0.9375rem", md: "1rem" },
                  lineHeight: 1.6,
                  textAlign: { xs: "center", md: "left" },
                  maxWidth: "500px",
                }}
              >
                {branding.heroSubtitle}
              </Typography>
            </FadeIn>

            {!hideNonHero && (
              <FadeIn trigger="immediate" delay={0.5}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ width: { xs: "100%", sm: "auto" }, pt: 1 }}
                >
                  <Button
                    component={RouterLink}
                    to="/get-started"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowRightAltIcon />}
                    sx={{ py: 1.5, px: 4, width: { xs: "100%", sm: "auto" } }}
                  >
                    Begin Application
                  </Button>
                  {!hideQuote && (
                    <Button
                      onClick={scrollToQuote}
                      variant="outlined"
                      size="large"
                      sx={{ py: 1.5, px: 4, width: { xs: "100%", sm: "auto" } }}
                    >
                      Get Instant Quote
                    </Button>
                  )}
                </Stack>
              </FadeIn>
            )}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

const QuoteForm: React.FC<{
  coverageType: "life" | "disability";
  setCoverageType: (type: "life" | "disability") => void;
  birthday: string;
  setBirthday: (value: string) => void;
  state: string;
  setState: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  usesNicotine: string;
  setUsesNicotine: (value: string) => void;
  hoursPerWeek: string;
  setHoursPerWeek: (value: string) => void;
  monthlyIncome: string;
  setMonthlyIncome: (value: string) => void;
  onSubmit: () => void;
  quoteRef: React.RefObject<HTMLElement>;
}> = ({
  coverageType,
  setCoverageType,
  birthday,
  setBirthday,
  state,
  setState,
  gender,
  setGender,
  usesNicotine,
  setUsesNicotine,
  hoursPerWeek,
  setHoursPerWeek,
  monthlyIncome,
  setMonthlyIncome,
  onSubmit,
  quoteRef,
}) => {
  return (
    <Box sx={{ py: 2 }}>
      <Container sx={{ maxWidth: "1400px !important" }}>
        <Box ref={quoteRef}>
          <FadeIn trigger="viewport" once>
            <Card
              elevation={2}
              sx={{ borderLeft: 6, borderColor: "primary.main" }}
            >
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                <Stack spacing={3}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={3}
                    alignItems={{ xs: "flex-start", md: "center" }}
                    justifyContent="flex-start"
                  >
                    <Typography variant="h2" sx={{ fontWeight: 600 }}>
                      Get an instant quote
                    </Typography>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: coverageType === "life" ? 600 : 400,
                          color:
                            coverageType === "life"
                              ? "primary.main"
                              : "text.secondary",
                        }}
                      >
                        Group Life
                      </Typography>
                      <Switch
                        checked={coverageType === "disability"}
                        onChange={(e) =>
                          setCoverageType(
                            e.target.checked ? "disability" : "life",
                          )
                        }
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "primary.main",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                            {
                              backgroundColor: "primary.main",
                            },
                          "& .MuiSwitch-switchBase": {
                            color: "primary.main",
                          },
                          "& .MuiSwitch-track": {
                            backgroundColor: "primary.light",
                          },
                        }}
                      />
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: coverageType === "disability" ? 600 : 400,
                          color:
                            coverageType === "disability"
                              ? "primary.main"
                              : "text.secondary",
                        }}
                      >
                        Group Disability
                      </Typography>
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
                      gap: 2,
                      alignItems: "end",
                    }}
                  >
                    <TextField
                      label="Birthday (mm/dd/yyyy)"
                      value={birthday}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + "/" + value.slice(2);
                        }
                        if (value.length >= 5) {
                          value = value.slice(0, 5) + "/" + value.slice(5, 9);
                        }
                        setBirthday(value);
                      }}
                      // helperText="MM/DD/YYYY"
                      fullWidth
                      inputProps={{
                        maxLength: 10,
                        inputMode: "numeric",
                      }}
                    />

                    <TextField
                      label="State"
                      select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      // size="small"
                      fullWidth
                    >
                      {US_STATES.map((stateName) => (
                        <MenuItem key={stateName} value={stateName}>
                          {stateName}
                        </MenuItem>
                      ))}
                    </TextField>

                    <RadioGroup
                      label="Gender"
                      value={gender}
                      onChange={setGender}
                      options={[
                        { label: "Male", value: "male" },
                        { label: "Female", value: "female" },
                      ]}
                    />

                    {coverageType === "life" && (
                      <RadioGroup
                        label="Do you use nicotine products?"
                        value={usesNicotine}
                        onChange={setUsesNicotine}
                        options={[
                          { label: "Yes", value: "yes" },
                          { label: "No", value: "no" },
                        ]}
                      />
                    )}

                    {coverageType === "disability" && (
                      <>
                        <TextField
                          label="# Hours You Work/Week"
                          type="number"
                          value={hoursPerWeek}
                          onChange={(e) => setHoursPerWeek(e.target.value)}
                          // size="small"
                          fullWidth
                        />
                        <TextField
                          label="Average Monthly Income"
                          value={monthlyIncome}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            const formatted = value
                              ? `$${parseInt(value).toLocaleString()}`
                              : "";
                            setMonthlyIncome(formatted);
                          }}
                          // size="small"
                          fullWidth
                          helperText="Monthly income is asked to help determine the amount of disability coverage you may qualify for."
                        />
                      </>
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: { xs: "center", md: "flex-end" },
                      pt: 1,
                    }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      onClick={onSubmit}
                      sx={{ px: 6, py: 1.5 }}
                    >
                      See My Quote
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </FadeIn>
        </Box>
      </Container>
    </Box>
  );
};

const RatingsTicker: React.FC = () => (
  <FadeIn trigger="viewport" once>
    <Box
      sx={{
        bgcolor: "#f9fafc",
        borderTop: 1,
        borderBottom: 1,
        borderColor: "divider",
        py: 1.5,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: { xs: 4, sm: "12rem" },
          alignItems: "center",
          animation: "scroll 120s linear infinite",
          "@keyframes scroll": {
            "0%": { transform: "translateX(0)" },
            "100%": { transform: "translateX(-50%)" },
          },
          "&:hover": { animationPlayState: "paused" },
        }}
      >
        {[...Array(3)].map((_, setIndex) => (
          <React.Fragment key={setIndex}>
            {RATINGS.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  whiteSpace: "nowrap",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "success.main",
                    fontSize: "1.25rem",
                  }}
                >
                  {item.rating}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontSize: "0.75rem" }}
                >
                  {item.agency}
                </Typography>
              </Box>
            ))}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  </FadeIn>
);

const HowItWorksSection: React.FC = () => {
  const features = getClientFeatures();

  const steps = [
    {
      image: "/1-apply.svg",
      title: "Apply online",
      description:
        "Get an instant quote and submit your application in minutes.",
    },
    {
      image: "/2-medical.svg",
      title: "Provide medical info",
      description:
        "Some applications require health questions or a brief follow-up. If needed, we'll schedule a free medical exam at your convenience.",
    },
    {
      image: "/3-decision.svg",
      title: "Get a decision",
      description:
        "Once reviewed, you'll receive a decision. If approved, you get your coverage and a 30-day free-look period. QuickDecision℠ may offer faster approval, often without an exam.",
    },
  ];

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: "background.paper" }}>
      <Container sx={{ maxWidth: "900px !important" }}>
        <Stack spacing={4}>
          <FadeIn trigger="viewport">
            <Box>
              <Typography variant="h1" gutterBottom sx={{ fontWeight: 600 }}>
                How does it work?
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: 600, fontWeight: 400 }}
              >
                Applying for coverage is simple.
              </Typography>
            </Box>
          </FadeIn>

          <Stack direction="column" spacing={5}>
            {steps.map((step, index) => (
              <FadeIn key={index} trigger="viewport" delay={index * 0.12}>
                <Stack direction="row" spacing={3} alignItems="flex-start">
                  <Box
                    sx={{
                      width: { xs: "80px", md: "120px" },
                      minWidth: { xs: "80px", md: "120px" },
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      component="img"
                      src={step.image}
                      alt={step.title}
                      sx={{ height: { xs: 80, md: 100 }, width: "auto" }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      {step.title}
                    </Typography>
                    <Typography color="text.secondary" variant="body1">
                      {step.description}
                    </Typography>
                  </Box>
                </Stack>
              </FadeIn>
            ))}
          </Stack>

          <FadeIn trigger="viewport" delay={0.2}>
            <Box sx={{ pt: 4 }}>
              <Button
                component={RouterLink}
                to="/get-started"
                variant="outlined"
                size="large"
                endIcon={<ArrowRightAltIcon />}
                fullWidth
                sx={{ py: 1.5 }}
              >
                Begin Application
              </Button>
            </Box>
          </FadeIn>
        </Stack>
      </Container>
    </Box>
  );
};

const CoverageOptionsSection: React.FC<{ categoryCards: any[] }> = ({
  categoryCards,
}) => {
  const features = getClientFeatures();

  return (
    <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: "#ecf7f4" }}>
      <Container sx={{ maxWidth: { lg: "1400px !important" } }}>
        <Stack spacing={4}>
          <FadeIn trigger="viewport">
            <Box>
              <Typography
                variant="h1"
                gutterBottom
                sx={{ fontSize: "36px", lineHeight: 1.1, fontWeight: 700 }}
              >
                Review your coverage options.
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: "16px", maxWidth: 600 }}
              >
                Insurance tailored to meet your needs.
              </Typography>
            </Box>
          </FadeIn>

          <FadeIn trigger="viewport" delay={0.15}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg:
                    categoryCards.length === 1
                      ? "1fr"
                      : categoryCards.length === 2
                        ? "repeat(2, 1fr)"
                        : categoryCards.length === 3
                          ? "repeat(3, 1fr)"
                          : "repeat(4, 1fr)",
                },
                gap: 3,
                alignItems: "flex-start",
              }}
            >
              {categoryCards.map(
                (cardData) =>
                  cardData && (
                    <CoverageCategoryCard
                      key={cardData.category}
                      category={cardData.category}
                      description={cardData.description}
                      products={cardData.products}
                      brochureUrl={`https://d160mojjx9yhiu.cloudfront.net/pdfs/4591/abe-${cardData.category.toLowerCase()}-overview.pdf`}
                    />
                  ),
              )}
            </Box>
          </FadeIn>

          <FadeIn trigger="viewport" delay={0.3}>
            <Box textAlign="center" sx={{ pt: 4 }}>
              <Button
                component={RouterLink}
                to="/get-started"
                variant="contained"
                size="large"
                endIcon={<ArrowRightAltIcon />}
                sx={{ py: 1.5, px: 6 }}
              >
                Begin Application
              </Button>
            </Box>
          </FadeIn>
        </Stack>
      </Container>
    </Box>
  );
};

const AboutNYLSection: React.FC = () => (
  <Box
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <Box sx={{ width: "100%", maxWidth: "200px", mb: 3 }}>
      <Box
        sx={{
          width: "100%",
          height: { xs: 50, md: 60 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src="/brand/nyl/logo.png"
          alt="New York Life Logo"
          sx={{
            ...commonStyles.logo,
            height: { xs: 40, md: 50 },
            width: "auto",
          }}
        />
      </Box>
    </Box>
    <Box sx={{ maxWidth: "900px" }}>
      <Stack spacing={3}>
        <Typography variant="h3" component="h3">
          New York Life Insurance Company: a trusted name for over 180 years
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign={"justify"}
        >
          At the heart of New York Life is a commitment to be there for our
          customers when they need us, whether today or decades into the future.
          As of Today, New York Life has received the highest financial strength
          ratings¹ currently awarded to any U.S. life insurer. For our
          customers, that means promises kept, and peace of mind for the
          millions of families and businesses who rely on us.
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: "0.75rem" }}
        >
          ¹Third Party Rating Reports as of 09/30/2025.
        </Typography>
      </Stack>
    </Box>
  </Box>
);

const AboutAMASection: React.FC = () => (
  <Box
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <Box sx={{ width: "100%", maxWidth: "200px", mb: 3 }}>
      <Box
        sx={{
          width: "100%",
          height: { xs: 50, md: 60 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src="/brand/ama/logo.png"
          alt="AMA Logo"
          sx={{
            ...commonStyles.logo,
            height: { xs: 40, md: 50 },
            width: "auto",
          }}
        />
      </Box>
    </Box>
    <Box sx={{ maxWidth: "900px" }}>
      <Stack spacing={3}>
        <Typography variant="h3" component="h3">
          AMA Insurance: helping physicians protect what matters most
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign={"justify"}
        >
          For more than 50 years AMA-sponsored insurance has been protecting
          physicians and their families. As a subsidiary of the American Medical
          Association, AMA Insurance taps into the group buying power of over
          one million physicians to offer specially negotiated rates and
          tailored benefits from top insurance companies.
        </Typography>
      </Stack>
    </Box>
  </Box>
);

const AboutSection: React.FC = () => (
  <Box
    sx={{
      py: { xs: 4, md: 6 },
      bgcolor: "background.paper",
      borderTop: 1,
      borderBottom: 1,
      borderColor: "divider",
    }}
  >
    <Container maxWidth="xl">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 6, lg: 8 },
          alignItems: "stretch",
          maxWidth: "900px",
          mx: "auto",
        }}
      >
        {ACTIVE_CLIENT_ID === "ama" && (
          <FadeIn trigger="viewport">
            <AboutAMASection />
          </FadeIn>
        )}
        <FadeIn trigger="viewport" delay={0.15}>
          <AboutNYLSection />
        </FadeIn>
      </Box>
    </Container>
  </Box>
);

const RatesDisclosureSection: React.FC = () => (
  <Box
    sx={{
      py: { xs: 3, md: 4 },
      bgcolor: "#f9fafc",
      borderTop: 1,
      borderColor: "divider",
    }}
  >
    <Container maxWidth="lg" sx={{ maxWidth: "900px !important" }}>
      <FadeIn trigger="viewport">
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7 }}
          >
            Rates current as of 2022.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7 }}
          >
            <Typography
              component="span"
              sx={{
                textDecoration: "underline",
                cursor: "pointer",
                color: "primary.main",
              }}
            >
              Click here
            </Typography>{" "}
            for more information on this coverage—features, costs, eligibility,
            renewability, limitations, and exclusions.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7 }}
          >
            AMA-sponsored insurance described on this page are underwritten by
            New York Life Insurance Company, 51 Madison Ave., New York, NY 10010
            on Policy Form GMR. Coverage may not be available in all states and
            product features may vary by state.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7 }}
          >
            Quotes are for illustrative purposes only.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7 }}
          >
            NEW YORK LIFE and the NEW YORK LIFE Box Logo are trademarks of New
            York Life Insurance Company.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7 }}
          >
            AMA incurs administrative expenses in connection with this program.
            To maintain these valuable benefits it is reimbursed for such
            expense.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7, fontWeight: 600 }}
          >
            Disability Insurance with Step Rated Premiums:
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7 }}
          >
            Rates and premium credits are reviewed and may change annually. The
            premium credit is guaranteed for at least the first year of
            coverage.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7 }}
          >
            Rates are based on your age on the effective date of coverage. Rates
            for the Disability Insurance with Step Rated Premiums are based on
            attained age on each renewal date. Depending on program experience,
            premiums may change on the policy anniversary date (July 1) or your
            annual renewal date (whichever is later).
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7, fontWeight: 600 }}
          >
            Disability Insurance with Step Rated Premiums:
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7 }}
          >
            Attention Residents of AK, AL, AZ, CA, FL, GA, HI, LA, MS, NM, OR,
            SC, TX and WA: Due to higher than national average claims experience
            in these states, rates are 40% higher in California and Florida, and
            20% higher in Alaska, Alabama, Arizona, Georgia, Hawaii, Louisiana,
            Mississippi, New Mexico, Oregon, South Carolina, Texas and
            Washington. If you live in one of these states, the rates shown
            already reflect this premium adjustment.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7, fontWeight: 600 }}
          >
            Level Term Life Insurance:
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", lineHeight: 1.7 }}
          >
            The rate shown is the Super Preferred Risk Class rate for qualified
            non-tobacco users in good health and who meet additional
            underwriting guidelines.
          </Typography>
        </Stack>
      </FadeIn>
    </Container>
  </Box>
);

export default function Landing({ hideNonHero = false }: LandingProps) {
  const { isPageLoading } = usePageLoading();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const features = getClientFeatures();
  const quoteRef = React.useRef<HTMLElement>(null);

  const [coverageType, setCoverageType] = React.useState<"life" | "disability">(
    "life",
  );
  const [birthday, setBirthday] = React.useState("");
  const [state, setState] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [usesNicotine, setUsesNicotine] = React.useState("");
  const [hoursPerWeek, setHoursPerWeek] = React.useState("");
  const [monthlyIncome, setMonthlyIncome] = React.useState("");
  const [showQuoteModal, setShowQuoteModal] = React.useState(false);
  const [selectedCoverages, setSelectedCoverages] = React.useState({
    term10: "250000",
    term20: "500000",
    wholeLife: "100000",
  });
  const [products, setProducts] = React.useState<Product[]>([]);
  const showSkeleton = isPageLoading;

  React.useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  React.useEffect(() => {
    if (searchParams.get("form") === "advisor") {
      navigate("/advisor");
    }
  }, [searchParams, navigate]);

  const hideQuote = searchParams.get("qt") === "none";

  const categoryCards = React.useMemo(() => {
    const grouped: Record<CoverageCategory, Product[]> = {
      LI: [],
      DI: [],
      OO: [],
      SH: [],
    };

    products.forEach((product) => grouped[product.category].push(product));

    return (Object.keys(grouped) as CoverageCategory[])
      .map((category) => {
        const categoryProducts = grouped[category];
        if (categoryProducts.length === 0) return null;

        return {
          category,
          description: CATEGORY_DESCRIPTIONS[category],
          products: categoryProducts.map((product) => ({
            name: product.name,
            quickDecision: product.quickDecision,
          })),
        };
      })
      .filter(Boolean);
  }, [products]);

  const scrollToQuote = () => {
    quoteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSeeQuote = () => {
    setShowQuoteModal(true);
  };

  const handleBeginApplication = () => {
    setShowQuoteModal(false);
    const firstPage = features.showMembershipPage
      ? "/membership"
      : "/eligibility";
    navigate(firstPage);
  };

  return showSkeleton ? (
    <LandingSkeleton />
  ) : (
    <Box>
      <HeroSection
        hideNonHero={hideNonHero}
        hideQuote={hideQuote}
        scrollToQuote={scrollToQuote}
      />

      {!hideNonHero && !hideQuote && (
        <QuoteForm
          coverageType={coverageType}
          setCoverageType={setCoverageType}
          birthday={birthday}
          setBirthday={setBirthday}
          state={state}
          setState={setState}
          gender={gender}
          setGender={setGender}
          usesNicotine={usesNicotine}
          setUsesNicotine={setUsesNicotine}
          hoursPerWeek={hoursPerWeek}
          setHoursPerWeek={setHoursPerWeek}
          monthlyIncome={monthlyIncome}
          setMonthlyIncome={setMonthlyIncome}
          onSubmit={handleSeeQuote}
          quoteRef={quoteRef}
        />
      )}

      {!hideNonHero && (
        <>
          <HowItWorksSection />
          <CoverageOptionsSection categoryCards={categoryCards} />
          <RatingsTicker />
          <AboutSection />
          {ACTIVE_CLIENT_ID === "ama" && <RatesDisclosureSection />}
        </>
      )}

      <QuoteModal
        open={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        onBeginApplication={handleBeginApplication}
        selectedCoverages={selectedCoverages}
        onCoverageChange={setSelectedCoverages}
      />
    </Box>
  );
}

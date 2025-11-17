import * as React from "react";
import { 
  Box, Container, Stack, Typography, Button, Card, CardContent,
  ToggleButton, ToggleButtonGroup, TextField, MenuItem, Link
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import RadioGroup from "../components/form/RadioGroup";
import { 
  ArrowRightAlt as ArrowRightAltIcon
} from "@mui/icons-material";
import { getClientBranding } from "../config/clients";
import CoverageCategoryCard from "../components/coverage/CoverageCategoryCard";
import { commonStyles } from "../theme/commonStyles";
import QuoteModal from "../components/coverage/QuoteModal";
import { getProducts } from "../api/client";
import type { Product, CoverageCategory } from "../types/app";

export default function Landing() {
  const navigate = useNavigate();
  const branding = getClientBranding();
  const quoteRef = React.useRef<HTMLElement>(null);
  const [coverageType, setCoverageType] = React.useState<'life' | 'disability'>('life');
  const [birthday, setBirthday] = React.useState('');
  const [state, setState] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [usesNicotine, setUsesNicotine] = React.useState('');
  const [hoursPerWeek, setHoursPerWeek] = React.useState('');
  const [monthlyIncome, setMonthlyIncome] = React.useState('');
  const [showQuoteModal, setShowQuoteModal] = React.useState(false);
  const [selectedCoverages, setSelectedCoverages] = React.useState({
    term10: '250000',
    term20: '500000',
    wholeLife: '100000'
  });
  const [products, setProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    const loadProducts = async () => {
      const productData = await getProducts();
      setProducts(productData);
    };
    loadProducts();
  }, []);

  // Group products by category and transform for CoverageCategoryCard
  const categoryCards = React.useMemo(() => {
    // Category descriptions
    const descriptions: Record<CoverageCategory, string> = {
      LI: "Think about what your family would need to maintain their current standard of living if you were no longer there to help provide for them. Your income is most likely critical to meeting monthly expenses. We have choices that will meet your budget today while still providing peace of mind for your family's future.",
      DI: "A disability could potentially destroy your way of life. If you were to become disabled, Disability Insurance is commensurate with your profession so that you can live your life with all things you've enjoyed at your income level.",
      OO: "In the event of a total disability or illness, this coverage can help protect your practice and assets by paying a monthly benefit for your office expenses.",
      SH: "Critical Illness provides added protection for yourself and your family from the financial impact of a specific, life-threatening illness. Hospital Income Insurance is guaranteed coverage that can help offset costs during a hospital stay."
    };

    const grouped: Record<CoverageCategory, Product[]> = {
      LI: [],
      DI: [],
      OO: [],
      SH: []
    };
    
    products.forEach(product => {
      grouped[product.category].push(product);
    });
    
    return (Object.keys(grouped) as CoverageCategory[]).map(category => {
      const categoryProducts = grouped[category];
      if (categoryProducts.length === 0) return null;
      
      return {
        category,
        description: descriptions[category],
        products: categoryProducts.map(product => ({
          name: product.name,
          quickDecision: product.quickDecision
        }))
      };
    }).filter(Boolean);
  }, [products]);

  const scrollToQuote = () => {
    quoteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSeeQuote = () => {
    setShowQuoteModal(true);
  };

  const handleBeginApplication = () => {
    setShowQuoteModal(false);
    navigate('/eligibility');
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        {/* Content Above Image */}
        <Container maxWidth="lg">
          <Box sx={{ pt: { xs: 0, md: 1 }, pb: { xs: 3, md: 4 } }}>
            <Box sx={{ mx: 'auto', textAlign: 'center' }}>
              <Stack spacing={2.5} alignItems="center">
                <Typography 
                  variant="h1" 
                  component="h1"
                  sx={{ 
                    textAlign: 'center'
                  }}
                >
                  {branding.heroTitle}
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.9375rem', md: '1rem' }, 
                    lineHeight: 1.6,
                    maxWidth: 700
                  }}
                >
                  {branding.heroSubtitle}
                </Typography>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  sx={{ 
                    mt: 1, 
                    width: { xs: '100%', sm: 'auto' },
                    alignItems: { xs: 'stretch', sm: 'center' }
                  }}
                >
                  <Button 
                    component={RouterLink} 
                    to="/eligibility" 
                    variant="contained" 
                    size="large"
                    endIcon={<ArrowRightAltIcon />}
                    sx={{ 
                      py: 1.5, 
                      px: 4,
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    Begin Application
                  </Button>
                  <Button 
                    onClick={scrollToQuote}
                    variant="outlined" 
                    size="large"
                    sx={{ 
                      py: 1.5, 
                      px: 4,
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    Get Quote
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Container>
        
        {/* Hero Image */}
        <Box
          component="img"
          src={branding.heroImage || '/brand/default/hero.png'}
          alt={branding.heroImageAlt || 'Insurance Coverage'}
          sx={{
            width: { xs: '100%', sm: '85%', md: '70%' },
            height: 'auto',
            maxHeight: { xs: 280, sm: 350, md: 400 },
            objectFit: 'cover',
            display: 'block',
            mx: 'auto'
          }}
        />
      </Box>

      {/* Quote Section */}
      <Box
        ref={quoteRef}
        sx={{
          bgcolor: 'grey.50',
          py: { xs: 4, md: 5 },
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={2.5} alignItems="center">
            <Typography variant="h3" component="h2" textAlign="center" sx={{ fontWeight: 600 }}>
              Get an instant quote.
            </Typography>
            <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ maxWidth: 600, fontWeight: 400 }}>
              Apply for a combination of monthly premium and coverage amount that's a good fit for you.
            </Typography>
            <Card sx={{ width: '100%', maxWidth: 600 }}>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
                  {/* Coverage Type Toggle */}
                  <ToggleButtonGroup
                    value={coverageType}
                    exclusive
                    onChange={(_e, newValue) => newValue && setCoverageType(newValue)}
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    <ToggleButton value="life">Life Insurance</ToggleButton>
                    <ToggleButton value="disability">Disability Insurance</ToggleButton>
                  </ToggleButtonGroup>

                  {/* Always Displayed Fields */}
                  <TextField
                    label="Date of Birth"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="State"
                    select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="Alabama">Alabama</MenuItem>
                    <MenuItem value="Alaska">Alaska</MenuItem>
                    <MenuItem value="Arizona">Arizona</MenuItem>
                    <MenuItem value="Arkansas">Arkansas</MenuItem>
                    <MenuItem value="California">California</MenuItem>
                    <MenuItem value="Colorado">Colorado</MenuItem>
                    <MenuItem value="Connecticut">Connecticut</MenuItem>
                    <MenuItem value="Delaware">Delaware</MenuItem>
                    <MenuItem value="District of Columbia">District of Columbia</MenuItem>
                    <MenuItem value="Florida">Florida</MenuItem>
                    <MenuItem value="Georgia">Georgia</MenuItem>
                    <MenuItem value="Hawaii">Hawaii</MenuItem>
                    <MenuItem value="Idaho">Idaho</MenuItem>
                    <MenuItem value="Illinois">Illinois</MenuItem>
                    <MenuItem value="Indiana">Indiana</MenuItem>
                    <MenuItem value="Iowa">Iowa</MenuItem>
                    <MenuItem value="Kansas">Kansas</MenuItem>
                    <MenuItem value="Kentucky">Kentucky</MenuItem>
                    <MenuItem value="Louisiana">Louisiana</MenuItem>
                    <MenuItem value="Maine">Maine</MenuItem>
                    <MenuItem value="Maryland">Maryland</MenuItem>
                    <MenuItem value="Massachusetts">Massachusetts</MenuItem>
                    <MenuItem value="Michigan">Michigan</MenuItem>
                    <MenuItem value="Minnesota">Minnesota</MenuItem>
                    <MenuItem value="Mississippi">Mississippi</MenuItem>
                    <MenuItem value="Missouri">Missouri</MenuItem>
                    <MenuItem value="Montana">Montana</MenuItem>
                    <MenuItem value="Nebraska">Nebraska</MenuItem>
                    <MenuItem value="Nevada">Nevada</MenuItem>
                    <MenuItem value="New Hampshire">New Hampshire</MenuItem>
                    <MenuItem value="New Jersey">New Jersey</MenuItem>
                    <MenuItem value="New Mexico">New Mexico</MenuItem>
                    <MenuItem value="New York">New York</MenuItem>
                    <MenuItem value="North Carolina">North Carolina</MenuItem>
                    <MenuItem value="North Dakota">North Dakota</MenuItem>
                    <MenuItem value="Ohio">Ohio</MenuItem>
                    <MenuItem value="Oklahoma">Oklahoma</MenuItem>
                    <MenuItem value="Oregon">Oregon</MenuItem>
                    <MenuItem value="Pennsylvania">Pennsylvania</MenuItem>
                    <MenuItem value="Rhode Island">Rhode Island</MenuItem>
                    <MenuItem value="South Carolina">South Carolina</MenuItem>
                    <MenuItem value="South Dakota">South Dakota</MenuItem>
                    <MenuItem value="Tennessee">Tennessee</MenuItem>
                    <MenuItem value="Texas">Texas</MenuItem>
                    <MenuItem value="Utah">Utah</MenuItem>
                    <MenuItem value="Vermont">Vermont</MenuItem>
                    <MenuItem value="Virginia">Virginia</MenuItem>
                    <MenuItem value="Washington">Washington</MenuItem>
                    <MenuItem value="West Virginia">West Virginia</MenuItem>
                    <MenuItem value="Wisconsin">Wisconsin</MenuItem>
                    <MenuItem value="Wyoming">Wyoming</MenuItem>
                    <MenuItem value="U.S. Armed Forces Pacific">U.S. Armed Forces Pacific</MenuItem>
                    <MenuItem value="U.S. Armed Forces Americas">U.S. Armed Forces Americas</MenuItem>
                  </TextField>

                  <RadioGroup
                    label="Gender"
                    value={gender}
                    onChange={setGender}
                    options={[
                      { label: 'Male', value: 'male' },
                      { label: 'Female', value: 'female' }
                    ]}
                  />

                  {/* Conditional Fields based on Coverage Type */}
                  {coverageType === 'life' && (
                    <RadioGroup
                      label="Do you use nicotine products?"
                      value={usesNicotine}
                      onChange={setUsesNicotine}
                      options={[
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' }
                      ]}
                    />
                  )}

                  {coverageType === 'disability' && (
                    <>
                      <TextField
                        label="# Hours You Work/Week"
                        type="number"
                        value={hoursPerWeek}
                        onChange={(e) => setHoursPerWeek(e.target.value)}
                        fullWidth
                      />
                      <TextField
                        label="Average Monthly Income"
                        value={monthlyIncome}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          const formatted = value ? `$${parseInt(value).toLocaleString()}` : '';
                          setMonthlyIncome(formatted);
                        }}
                        fullWidth
                        helperText="Monthly income is asked to help determine the amount of disability coverage you may qualify for."
                      />
                    </>
                  )}

                  <Button 
                    variant="contained" 
                    fullWidth 
                    size="large" 
                    sx={{ mt: 2 }}
                    onClick={handleSeeQuote}
                  >
                    See My Quote
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Container>
      </Box>

      {/* About Process Section */}
      <Box
        sx={{
          py: { xs: 4, md: 6 },
          bgcolor: 'background.paper'
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={4}>
            <Box textAlign="center">
              <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                How does this process work?
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontWeight: 400 }}>
                Follow these simple steps to get started.
              </Typography>
            </Box>

            <Stack direction="column" spacing={4}>
              <Box>
                <Stack direction="row" spacing={3} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    1
                  </Box>
                  <Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      Apply online.
                    </Typography>
                    <Typography color="text.secondary" variant="body1">
                      Get an instant quote and submit your application online. It's never been easier.
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Box>
                <Stack direction="row" spacing={3} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    2
                  </Box>
                  <Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      Provide medical info.
                    </Typography>
                    <Typography color="text.secondary" variant="body1">
                      Many types of insurance require health information to provide a decision on your application. We may ask health questions on your application or a representative of New York Life or their medical service provider may contact you to collect your health history. If needed, we will schedule a medical exam at no cost to you and at a time and place convenient to you. <Link href="#" sx={commonStyles.primaryLink}>Learn more</Link>
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Box>
                <Stack direction="row" spacing={3} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    3
                  </Box>
                  <Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                      Get a decision.
                    </Typography>
                    <Typography color="text.secondary" variant="body1">
                      Decisions are made after all information is received and reviewed by New York Life. If approved, you will receive a certificate of insurance and have a 30-day no-obligation free look. Plus, when QuickDecisionSM is available, you can get a faster decision on your application, typically with no medical exam.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>

            <Box textAlign="center" sx={{ pt: 4 }}>
              <Button 
                component={RouterLink} 
                to="/eligibility" 
                variant="contained" 
                size="large"
                endIcon={<ArrowRightAltIcon />}
                sx={{ py: 1.5, px: 6 }}
              >
                Begin Application
              </Button>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* About Coverage Section */}
      <Box
        sx={{
          py: { xs: 4, md: 6 },
          bgcolor: 'rgba(25, 118, 210, 0.04)'
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={4}>
            <Box textAlign="center">
              <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                Review your coverage options.
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontWeight: 400 }}>
                Insurance tailored to meet your needs.
              </Typography>
            </Box>

            <Stack direction="column" spacing={3}>
              {categoryCards.map((cardData) => (
                cardData && (
                  <CoverageCategoryCard
                    key={cardData.category}
                    category={cardData.category}
                    description={cardData.description}
                    products={cardData.products}
                  />
                )
              ))}
            </Stack>

            <Box textAlign="center" sx={{ pt: 4 }}>
              <Button 
                component={RouterLink} 
                to="/eligibility" 
                variant="contained" 
                size="large"
                endIcon={<ArrowRightAltIcon />}
                sx={{ py: 1.5, px: 6 }}
              >
                Begin Application
              </Button>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* About New York Life Section */}
      <Box
        sx={{
          py: { xs: 4, md: 6 },
          bgcolor: 'background.paper',
          borderTop: 1,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="column" spacing={4} alignItems="center" textAlign="center">
            <Box sx={{ width: '100%', maxWidth: '300px' }}>
              <Box
                sx={{
                  width: '100%',
                  height: { xs: 80, md: 100 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  component="img"
                  src="/brand/nyl/logo.png"
                  alt="New York Life Logo"
                  sx={{
                    ...commonStyles.logo,
                    height: { xs: 60, md: 80 },
                    width: 'auto'
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ maxWidth: '600px' }}>
              <Stack spacing={3}>
                <Typography variant="h3" component="h2" sx={{ fontWeight: 600 }}>
                  New York Life Insurance Company: a trusted name for over 180 years
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                  At the heart of New York Life is a commitment to be there for our customers when they need us, whether today or decades into the future. As of Today, New York Life has received the highest financial strength ratings¹ currently awarded to any U.S. life insurer. For our customers, that means promises kept, and peace of mind for the millions of families and businesses who rely on us.
                </Typography>
                <Stack direction="row" spacing={3} flexWrap="wrap" justifyContent="center">
                  <Box>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1, color: 'primary.light' }}>A++</Typography>
                    <Typography sx={{ fontSize: '0.625rem', lineHeight: 1.2, color: 'text.secondary' }}>A.M. Best</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1, color: 'primary.light' }}>AAA</Typography>
                    <Typography sx={{ fontSize: '0.625rem', lineHeight: 1.2, color: 'text.secondary' }}>Fitch Ratings</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1, color: 'primary.light' }}>Aa1</Typography>
                    <Typography sx={{ fontSize: '0.625rem', lineHeight: 1.2, color: 'text.secondary' }}>Moody's Investors Service</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1, color: 'primary.light' }}>AA+</Typography>
                    <Typography sx={{ fontSize: '0.625rem', lineHeight: 1.2, color: 'text.secondary' }}>Standard & Poor's</Typography>
                  </Box>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  ¹Third Party Rating Reports as of 09/30/2025.
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Quote Modal */}
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

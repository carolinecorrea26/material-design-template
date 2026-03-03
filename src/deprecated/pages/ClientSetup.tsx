import * as React from "react";
import {
  Box,
  Container,
  Stack,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  Chip,
} from "@mui/material";
import { THEME_COLORS } from "../../config/themeColors";

interface ClientSetupForm {
  // Basic Info
  id: string;
  name: string;
  acronym: string;

  // Theme
  colorName: keyof typeof THEME_COLORS;

  // Branding
  logoPath: string;
  partnerLogoPath: string;
  heroImagePath: string;
  heroTitle: string;
  heroSubtitle: string;
  phone: string;
  phoneDisplay: string;

  // Products & Coverage
  productsFile: string;
  coverageCategories: Array<"LI" | "AD" | "DI" | "OO" | "SH">;

  // Features
  showPartnerLogo: boolean;
  showRatingBadges: boolean;
  enableDisabilityInsurance: boolean;
  enableLifeInsurance: boolean;
  showCoverageDetails: boolean;
  showMembershipPage: boolean;

  // Field Labels
  dateOfBirthLabel: string;
  genderLabel: string;
  stateLabel: string;
  nicotineUseLabel: string;

  // Membership Question
  membershipPrimaryQuestion: string;
  membershipSpouseQuestion: string;
  membershipType: "radio" | "checkbox";
}

export default function ClientSetup() {
  const [formData, setFormData] = React.useState<ClientSetupForm>({
    // Basic Info
    id: "",
    name: "",
    acronym: "",

    // Theme
    colorName: "blue",

    // Branding
    logoPath: "/brand/default/logo.png",
    partnerLogoPath: "/brand/nyl/logo.png",
    heroImagePath: "/brand/default/hero.png",
    heroTitle: "Protect what matters most.",
    heroSubtitle:
      "Life and disability insurance coverage for you and your family.",
    phone: "",
    phoneDisplay: "",

    // Products & Coverage
    productsFile: "products",
    coverageCategories: ["LI", "AD", "DI", "OO", "SH"],

    // Features
    showPartnerLogo: true,
    showRatingBadges: true,
    enableDisabilityInsurance: true,
    enableLifeInsurance: true,
    showCoverageDetails: true,
    showMembershipPage: false,

    // Field Labels
    dateOfBirthLabel: "Birthday",
    genderLabel: "Gender",
    stateLabel: "State",
    nicotineUseLabel: "Do you use tobacco products?",

    // Membership Question
    membershipPrimaryQuestion: "Are you an active member?",
    membershipSpouseQuestion: "Is your spouse an active member?",
    membershipType: "radio",
  });

  const [generatedConfig, setGeneratedConfig] = React.useState<string>("");

  const handleInputChange = (field: keyof ClientSetupForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCoverageToggle = (category: "LI" | "AD" | "DI" | "OO" | "SH") => {
    setFormData((prev) => ({
      ...prev,
      coverageCategories: prev.coverageCategories.includes(category)
        ? prev.coverageCategories.filter((c) => c !== category)
        : [...prev.coverageCategories, category],
    }));
  };

  const generateConfig = () => {
    const config = `{
  id: '${formData.id}',
  branding: {
    name: '${formData.name}',
    acronym: '${formData.acronym}',
    logo: '${formData.logoPath}',
    logoAlt: '${formData.acronym} Logo',
    partnerLogo: '${formData.partnerLogoPath}',
    partnerLogoAlt: 'New York Life Logo',
    heroImage: '${formData.heroImagePath}',
    heroImageAlt: '${formData.name}',
    heroTitle: '${formData.heroTitle}',
    heroSubtitle: '${formData.heroSubtitle}',
    products: [],
    phone: '${formData.phone}',
    phoneDisplay: '${formData.phoneDisplay}',
  },
  theme: {
    colorName: '${formData.colorName}',
  },
  fieldLabels: {
    dateOfBirth: '${formData.dateOfBirthLabel}',
    gender: '${formData.genderLabel}',
    state: '${formData.stateLabel}',
    nicotineUse: '${formData.nicotineUseLabel}',
  },
  membershipQuestion: {
    primaryQuestion: '${formData.membershipPrimaryQuestion}',
    spouseQuestion: '${formData.membershipSpouseQuestion}',
    type: '${formData.membershipType}',
  },
  features: {
    showPartnerLogo: ${formData.showPartnerLogo},
    showRatingBadges: ${formData.showRatingBadges},
    enableDisabilityInsurance: ${formData.enableDisabilityInsurance},
    enableLifeInsurance: ${formData.enableLifeInsurance},
    showCoverageDetails: ${formData.showCoverageDetails},
    showMembershipPage: ${formData.showMembershipPage},
  },
  productsFile: '${formData.productsFile}',
  coverageCategories: [${formData.coverageCategories.map((c) => `'${c}'`).join(", ")}],
}`;

    setGeneratedConfig(config);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedConfig);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
            Client Site Setup
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure a new client site with custom branding, features, and
            coverage options.
          </Typography>
        </Box>

        {/* Basic Information */}
        <Card>
          <CardContent>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Basic Information
            </Typography>
            <Stack spacing={3}>
              <TextField
                label="Client ID"
                value={formData.id}
                onChange={(e) => handleInputChange("id", e.target.value)}
                fullWidth
                helperText="Lowercase, no spaces (e.g., 'nar', 'abe')"
              />
              <TextField
                label="Client Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                fullWidth
                helperText="Full organization name"
              />
              <TextField
                label="Acronym"
                value={formData.acronym}
                onChange={(e) => handleInputChange("acronym", e.target.value)}
                fullWidth
                helperText="Short abbreviation"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardContent>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Theme
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Color Theme</InputLabel>
              <Select
                value={formData.colorName}
                onChange={(e) => handleInputChange("colorName", e.target.value)}
                label="Color Theme"
              >
                {Object.keys(THEME_COLORS).map((color) => (
                  <MenuItem key={color} value={color}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          bgcolor:
                            THEME_COLORS[color as keyof typeof THEME_COLORS]
                              .primary.main,
                          border: 1,
                          borderColor: "divider",
                        }}
                      />
                      <Typography sx={{ textTransform: "capitalize" }}>
                        {color}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardContent>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Branding
            </Typography>
            <Stack spacing={3}>
              <TextField
                label="Logo Path"
                value={formData.logoPath}
                onChange={(e) => handleInputChange("logoPath", e.target.value)}
                fullWidth
              />
              <TextField
                label="Partner Logo Path"
                value={formData.partnerLogoPath}
                onChange={(e) =>
                  handleInputChange("partnerLogoPath", e.target.value)
                }
                fullWidth
              />
              <TextField
                label="Hero Image Path"
                value={formData.heroImagePath}
                onChange={(e) =>
                  handleInputChange("heroImagePath", e.target.value)
                }
                fullWidth
              />
              <TextField
                label="Hero Title"
                value={formData.heroTitle}
                onChange={(e) => handleInputChange("heroTitle", e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
              <TextField
                label="Hero Subtitle"
                value={formData.heroSubtitle}
                onChange={(e) =>
                  handleInputChange("heroSubtitle", e.target.value)
                }
                fullWidth
                multiline
                rows={3}
              />
              <TextField
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                fullWidth
                helperText="Numbers only, no formatting"
              />
              <TextField
                label="Phone Display"
                value={formData.phoneDisplay}
                onChange={(e) =>
                  handleInputChange("phoneDisplay", e.target.value)
                }
                fullWidth
                helperText="Formatted display (e.g., '(800) 555-1234')"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Products & Coverage */}
        <Card>
          <CardContent>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Products & Coverage
            </Typography>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Products File</InputLabel>
                <Select
                  value={formData.productsFile}
                  onChange={(e) =>
                    handleInputChange("productsFile", e.target.value)
                  }
                  label="Products File"
                >
                  <MenuItem value="products">Standard Products</MenuItem>
                  <MenuItem value="products-demo">Demo Products</MenuItem>
                  <MenuItem value="products-nar">NAR Products</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  Coverage Categories
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {(["LI", "AD", "DI", "OO", "SH"] as const).map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      onClick={() => handleCoverageToggle(category)}
                      color={
                        formData.coverageCategories.includes(category)
                          ? "primary"
                          : "default"
                      }
                      variant={
                        formData.coverageCategories.includes(category)
                          ? "filled"
                          : "outlined"
                      }
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardContent>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Features
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.showPartnerLogo}
                    onChange={(e) =>
                      handleInputChange("showPartnerLogo", e.target.checked)
                    }
                  />
                }
                label="Show Partner Logo (New York Life)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.showRatingBadges}
                    onChange={(e) =>
                      handleInputChange("showRatingBadges", e.target.checked)
                    }
                  />
                }
                label="Show Rating Badges"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.enableDisabilityInsurance}
                    onChange={(e) =>
                      handleInputChange(
                        "enableDisabilityInsurance",
                        e.target.checked,
                      )
                    }
                  />
                }
                label="Enable Disability Insurance"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.enableLifeInsurance}
                    onChange={(e) =>
                      handleInputChange("enableLifeInsurance", e.target.checked)
                    }
                  />
                }
                label="Enable Life Insurance"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.showCoverageDetails}
                    onChange={(e) =>
                      handleInputChange("showCoverageDetails", e.target.checked)
                    }
                  />
                }
                label="Show Coverage Details Dropdown"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.showMembershipPage}
                    onChange={(e) =>
                      handleInputChange("showMembershipPage", e.target.checked)
                    }
                  />
                }
                label="Show Membership Page"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Field Labels */}
        <Card>
          <CardContent>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Field Labels
            </Typography>
            <Stack spacing={3}>
              <TextField
                label="Date of Birth Label"
                value={formData.dateOfBirthLabel}
                onChange={(e) =>
                  handleInputChange("dateOfBirthLabel", e.target.value)
                }
                fullWidth
              />
              <TextField
                label="Gender Label"
                value={formData.genderLabel}
                onChange={(e) =>
                  handleInputChange("genderLabel", e.target.value)
                }
                fullWidth
              />
              <TextField
                label="State Label"
                value={formData.stateLabel}
                onChange={(e) =>
                  handleInputChange("stateLabel", e.target.value)
                }
                fullWidth
              />
              <TextField
                label="Nicotine Use Label"
                value={formData.nicotineUseLabel}
                onChange={(e) =>
                  handleInputChange("nicotineUseLabel", e.target.value)
                }
                fullWidth
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Membership Question */}
        <Card>
          <CardContent>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Membership Question
            </Typography>
            <Stack spacing={3}>
              <TextField
                label="Primary Question"
                value={formData.membershipPrimaryQuestion}
                onChange={(e) =>
                  handleInputChange("membershipPrimaryQuestion", e.target.value)
                }
                fullWidth
                multiline
                rows={2}
              />
              <TextField
                label="Spouse Question"
                value={formData.membershipSpouseQuestion}
                onChange={(e) =>
                  handleInputChange("membershipSpouseQuestion", e.target.value)
                }
                fullWidth
                multiline
                rows={2}
              />
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={formData.membershipType}
                  onChange={(e) =>
                    handleInputChange("membershipType", e.target.value)
                  }
                  label="Question Type"
                >
                  <MenuItem value="radio">Radio (Yes/No)</MenuItem>
                  <MenuItem value="checkbox">Checkbox</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>

        {/* Generate Config */}
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Generated Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Click "Generate Config" to create the configuration object.
                  Copy and paste this into your clients.ts file.
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={generateConfig}
                size="large"
                fullWidth
              >
                Generate Configuration
              </Button>

              {generatedConfig && (
                <>
                  <Alert severity="success">
                    Configuration generated! Copy the code below and add it to
                    src/config/clients.ts
                  </Alert>

                  <Box
                    sx={{
                      bgcolor: "grey.100",
                      p: 2,
                      borderRadius: 1,
                      position: "relative",
                      maxHeight: 400,
                      overflow: "auto",
                    }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={copyToClipboard}
                      sx={{ position: "absolute", top: 8, right: 8 }}
                    >
                      Copy
                    </Button>
                    <Typography
                      component="pre"
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        m: 0,
                        pr: 10,
                      }}
                    >
                      {generatedConfig}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

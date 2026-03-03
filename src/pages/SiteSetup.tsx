import * as React from "react";
import {
  Box,
  Container,
  Stack,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  MenuItem,
  Divider,
  Alert,
  Paper,
} from "@mui/material";
import { useForm, FormProvider } from "react-hook-form";
import RHFTextField from "../components/form/RHFTextField";
import RHFSelect from "../components/form/RHFSelect";
import RHFCheckbox from "../components/form/RHFCheckbox";
import { THEME_COLORS } from "../config/themeColors";
import type { ClientConfig, ClientId } from "../config/clients";

interface SiteSetupFormData {
  // Basic Info
  clientId: string;
  clientName: string;
  clientAcronym: string;

  // Branding
  logoPath: string;
  partnerLogoPath: string;
  heroImagePath: string;
  heroTitle: string;
  heroSubtitle: string;
  phone: string;
  phoneDisplay: string;

  // Theme
  themeColor: keyof typeof THEME_COLORS;

  // Field Labels
  dateOfBirthLabel: string;
  genderLabel: string;
  stateLabel: string;
  nicotineUseLabel: string;

  // Membership Question
  membershipPrimaryQuestion: string;
  membershipSpouseQuestion: string;
  membershipType: "radio" | "checkbox";

  // Features
  showPartnerLogo: boolean;
  showRatingBadges: boolean;
  enableDisabilityInsurance: boolean;
  enableLifeInsurance: boolean;
  showCoverageDetails: boolean;
  showMembershipPage: boolean;

  // Products & Coverage
  productsFile: string;
  coverageCategories: string;
}

export default function SiteSetup() {
  const methods = useForm<SiteSetupFormData>({
    defaultValues: {
      clientId: "",
      clientName: "",
      clientAcronym: "",
      logoPath: "/brand/default/logo.png",
      partnerLogoPath: "/brand/nyl/logo.png",
      heroImagePath: "/brand/default/hero.png",
      heroTitle: "",
      heroSubtitle: "",
      phone: "",
      phoneDisplay: "",
      themeColor: "blue",
      dateOfBirthLabel: "Birthday",
      genderLabel: "Gender",
      stateLabel: "State",
      nicotineUseLabel: "Do you use tobacco products?",
      membershipPrimaryQuestion: "",
      membershipSpouseQuestion: "",
      membershipType: "radio",
      showPartnerLogo: true,
      showRatingBadges: true,
      enableDisabilityInsurance: true,
      enableLifeInsurance: true,
      showCoverageDetails: true,
      showMembershipPage: false,
      productsFile: "products",
      coverageCategories: "LI,AD,DI,OO,SH",
    },
  });

  const [generatedConfig, setGeneratedConfig] = React.useState<string>("");
  const [showOutput, setShowOutput] = React.useState(false);

  const onSubmit = (data: SiteSetupFormData) => {
    // Generate client config object
    const config: Partial<ClientConfig> = {
      id: data.clientId as ClientId,
      branding: {
        name: data.clientName,
        acronym: data.clientAcronym,
        logo: data.logoPath,
        logoAlt: `${data.clientAcronym} Logo`,
        partnerLogo: data.partnerLogoPath,
        partnerLogoAlt: "New York Life Logo",
        heroImage: data.heroImagePath,
        heroImageAlt: `${data.clientName} Insurance`,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        products: [],
        phone: data.phone,
        phoneDisplay: data.phoneDisplay,
      },
      theme: {
        colorName: data.themeColor,
      },
      fieldLabels: {
        dateOfBirth: data.dateOfBirthLabel,
        gender: data.genderLabel,
        state: data.stateLabel,
        nicotineUse: data.nicotineUseLabel,
      },
      membershipQuestion: data.membershipPrimaryQuestion
        ? {
            primaryQuestion: data.membershipPrimaryQuestion,
            spouseQuestion: data.membershipSpouseQuestion,
            type: data.membershipType,
          }
        : undefined,
      features: {
        showPartnerLogo: data.showPartnerLogo,
        showRatingBadges: data.showRatingBadges,
        enableDisabilityInsurance: data.enableDisabilityInsurance,
        enableLifeInsurance: data.enableLifeInsurance,
        showCoverageDetails: data.showCoverageDetails,
        showMembershipPage: data.showMembershipPage,
      },
      productsFile: data.productsFile,
      coverageCategories: data.coverageCategories
        .split(",")
        .map((c) => c.trim()) as any,
    };

    // Format as TypeScript code
    const configString = `  ${data.clientId}: ${JSON.stringify(config, null, 2).replace(/"([^"]+)":/g, "$1:")},`;
    setGeneratedConfig(configString);
    setShowOutput(true);
  };

  const themeColorOptions = Object.keys(THEME_COLORS).map((key) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: key,
  }));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
            Site Configuration Setup
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Internal tool for creating new client site configurations. Fill out
            the form below to generate the configuration code.
          </Typography>
        </Box>

        <Alert severity="info">
          This is an internal development tool. The generated configuration
          should be added to <code>src/config/clients.ts</code> in the{" "}
          <code>CLIENT_CONFIGS</code> object.
        </Alert>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <Stack spacing={4}>
              {/* Basic Information */}
              <Card>
                <CardContent>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Basic Information
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    <RHFTextField
                      name="clientId"
                      label="Client ID"
                      required
                      helperText="Lowercase identifier (e.g., 'nar', 'abe')"
                    />
                    <RHFTextField
                      name="clientName"
                      label="Client Full Name"
                      required
                      helperText="e.g., 'National Association of REALTORS®'"
                    />
                    <RHFTextField
                      name="clientAcronym"
                      label="Client Acronym"
                      required
                      helperText="e.g., 'NAR', 'ABE'"
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Branding */}
              <Card>
                <CardContent>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Branding
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    <RHFTextField
                      name="logoPath"
                      label="Logo Path"
                      required
                      helperText="Path to client logo (e.g., '/brand/nar/logo.png')"
                    />
                    <RHFTextField
                      name="partnerLogoPath"
                      label="Partner Logo Path"
                      helperText="Path to New York Life logo"
                    />
                    <RHFTextField
                      name="heroImagePath"
                      label="Hero Image Path"
                      required
                      helperText="Path to hero section image"
                    />
                    <RHFTextField
                      name="heroTitle"
                      label="Hero Title"
                      required
                      multiline
                      rows={2}
                      helperText="Main headline on landing page"
                    />
                    <RHFTextField
                      name="heroSubtitle"
                      label="Hero Subtitle"
                      required
                      multiline
                      rows={3}
                      helperText="Supporting text below hero title"
                    />
                    <RHFTextField
                      name="phone"
                      label="Phone Number"
                      required
                      helperText="Phone number (digits only, e.g., '8449270527')"
                    />
                    <RHFTextField
                      name="phoneDisplay"
                      label="Phone Display Format"
                      required
                      helperText="Formatted phone (e.g., '(844) 927-0527')"
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
                    sx={{ fontWeight: 600 }}
                  >
                    Theme
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    <RHFSelect
                      name="themeColor"
                      label="Theme Color"
                      options={themeColorOptions}
                      required
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
                    sx={{ fontWeight: 600 }}
                  >
                    Field Labels (Optional Customization)
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    <RHFTextField
                      name="dateOfBirthLabel"
                      label="Date of Birth Label"
                    />
                    <RHFTextField name="genderLabel" label="Gender Label" />
                    <RHFTextField name="stateLabel" label="State Label" />
                    <RHFTextField
                      name="nicotineUseLabel"
                      label="Nicotine Use Label"
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
                    sx={{ fontWeight: 600 }}
                  >
                    Membership Question (Optional)
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    <RHFTextField
                      name="membershipPrimaryQuestion"
                      label="Primary Member Question"
                      multiline
                      rows={2}
                      helperText="Leave blank if no membership page"
                    />
                    <RHFTextField
                      name="membershipSpouseQuestion"
                      label="Spouse Membership Question"
                      multiline
                      rows={2}
                    />
                    <RHFSelect
                      name="membershipType"
                      label="Membership Question Type"
                      options={[
                        { label: "Radio (Yes/No)", value: "radio" },
                        { label: "Checkbox", value: "checkbox" },
                      ]}
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardContent>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Features
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <RHFCheckbox
                      name="showPartnerLogo"
                      label="Show Partner Logo (New York Life)"
                    />
                    <RHFCheckbox
                      name="showRatingBadges"
                      label="Show Rating Badges"
                    />
                    <RHFCheckbox
                      name="enableDisabilityInsurance"
                      label="Enable Disability Insurance"
                    />
                    <RHFCheckbox
                      name="enableLifeInsurance"
                      label="Enable Life Insurance"
                    />
                    <RHFCheckbox
                      name="showCoverageDetails"
                      label="Show Coverage Details Dropdown"
                    />
                    <RHFCheckbox
                      name="showMembershipPage"
                      label="Show Membership Page"
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
                    sx={{ fontWeight: 600 }}
                  >
                    Products & Coverage
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    <RHFSelect
                      name="productsFile"
                      label="Products File"
                      options={[
                        { label: "Standard Products", value: "products" },
                        { label: "Demo Products", value: "products-demo" },
                        { label: "NAR Products", value: "products-nar" },
                      ]}
                      required
                      helperText="Select existing products file or create a new one"
                    />
                    <RHFTextField
                      name="coverageCategories"
                      label="Coverage Categories"
                      required
                      helperText="Comma-separated list (e.g., 'LI,DI,OO,SH')"
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                >
                  Generate Configuration
                </Button>
              </Box>
            </Stack>
          </form>
        </FormProvider>

        {/* Generated Output */}
        {showOutput && (
          <Card sx={{ bgcolor: "grey.50" }}>
            <CardContent>
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Generated Configuration
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedConfig);
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                </Box>
                <Alert severity="success">
                  Configuration generated successfully! Copy the code below and
                  add it to the <code>CLIENT_CONFIGS</code> object in{" "}
                  <code>src/config/clients.ts</code>.
                </Alert>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "background.paper",
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    overflow: "auto",
                    maxHeight: 500,
                  }}
                >
                  <pre style={{ margin: 0 }}>{generatedConfig}</pre>
                </Paper>
                <Alert severity="info">
                  <Typography variant="body2" gutterBottom>
                    <strong>Next Steps:</strong>
                  </Typography>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Copy the configuration above</li>
                    <li>
                      Open <code>src/config/clients.ts</code>
                    </li>
                    <li>
                      Add the configuration to the <code>CLIENT_CONFIGS</code>{" "}
                      object
                    </li>
                    <li>
                      Add the client ID to the <code>ClientId</code> type
                    </li>
                    <li>
                      If using a new products file, create it in{" "}
                      <code>src/data/fixtures/</code>
                    </li>
                    <li>
                      Add brand assets to <code>public/brand/[client-id]/</code>
                    </li>
                    <li>
                      Update <code>ACTIVE_CLIENT_ID</code> in{" "}
                      <code>clients.ts</code> to test
                    </li>
                  </ol>
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  );
}

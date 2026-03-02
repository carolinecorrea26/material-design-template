import * as React from "react";
import {
  Typography,
  Box,
  Stack,
  useTheme,
  Card,
  CardContent,
  Button,
  TextField,
  FormControlLabel,
  Chip,
  Alert,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
  Divider,
} from "@mui/material";
import { VerifiedUserOutlined, ShieldOutlined } from "@mui/icons-material";
import { FormProvider, useForm } from "react-hook-form";
import PageHeader from "../components/layout/PageHeader";
import PageNavigation from "../components/layout/PageNavigation";
import RHFTextField from "../components/form/RHFTextField";
import RHFSelect from "../components/form/RHFSelect";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFCheckbox from "../components/form/RHFCheckbox";
import RHFCurrencyField from "../components/form/RHFCurrencyField";
import DateField from "../components/form/DateField";
import { commonStyles } from "../theme/commonStyles";
import { THEME_COLORS, UI_COLORS } from "../config/themeColors";

export default function Styleguide() {
  const theme = useTheme();

  // Mock form for demo purposes
  const methods = useForm({
    defaultValues: {
      textField: "",
      longLabelField: "",
      currencyField: "",
      dateField: "",
      selectField: "",
      radioField: "",
      checkboxField: false,
      textareaField: "",
    },
  });

  const ColorSwatch = ({ color, name }: { color: string; name: string }) => (
    <Box sx={{ textAlign: "center" }}>
      <Box
        sx={{
          width: 100,
          height: 100,
          bgcolor: color,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          mb: 1,
        }}
      />
      <Typography variant="caption" display="block" fontWeight={600}>
        {name}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {color}
      </Typography>
    </Box>
  );

  return (
    <Stack spacing={6}>
      <PageHeader
        title="Design System & Style Guide"
        notes="A comprehensive reference for theme colors, typography, and UI components."
      />

      {/* ========== THEME COLORS ========== */}
      <Card sx={commonStyles.categoryCard}>
        <CardContent>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            1. Theme Colors
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Client-specific color palettes. Each client can choose a primary
            theme that defines the main and dark variants used throughout the
            application.
          </Typography>

          <Stack spacing={4} sx={{ mt: 4 }}>
            {Object.entries(THEME_COLORS).map(([themeName, colors]) => (
              <Box key={themeName}>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, textTransform: "capitalize", fontWeight: 600 }}
                >
                  {themeName} Theme
                </Typography>
                <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                  <ColorSwatch
                    color={colors.primary.main}
                    name="Primary Main"
                  />
                  <ColorSwatch
                    color={colors.primary.dark}
                    name="Primary Dark"
                  />
                </Stack>
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 4 }} />

          <Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              System Colors
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Semantic colors used for feedback, status, and UI elements across
              all client themes.
            </Typography>
            <Stack
              direction="row"
              spacing={3}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 3 }}
            >
              <ColorSwatch color={UI_COLORS.success.main} name="Success" />
              <ColorSwatch color={UI_COLORS.error.main} name="Error" />
              <ColorSwatch color={UI_COLORS.warning.main} name="Warning" />
              <ColorSwatch color={UI_COLORS.info.main} name="Info" />
            </Stack>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Neutral Colors
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Grey scale used for backgrounds, borders, and text.
            </Typography>
            <Stack
              direction="row"
              spacing={3}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 3 }}
            >
              <ColorSwatch color="#FFFFFF" name="White" />
              <ColorSwatch color={UI_COLORS.grey[100]} name="Grey 100" />
              <ColorSwatch color={UI_COLORS.grey[300]} name="Grey 300" />
              <ColorSwatch color={UI_COLORS.grey[500]} name="Grey 500" />
              <ColorSwatch color={UI_COLORS.grey[700]} name="Grey 700" />
              <ColorSwatch color={UI_COLORS.grey[900]} name="Grey 900" />
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* ========== TYPOGRAPHY ========== */}
      <Card sx={commonStyles.categoryCard}>
        <CardContent>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            2. Typography
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Font family: <strong>Inter</strong> (sans-serif). Consistent type
            scale and weights for hierarchy and readability.
          </Typography>

          <Stack spacing={3} sx={{ mt: 4 }}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 0.5 }}
              >
                H1 • 2.5rem (40px) • Weight 700
              </Typography>
              <Typography variant="h1">Main Page Title</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Used for primary page headings
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 0.5 }}
              >
                H2 • 2rem (32px) • Weight 700
              </Typography>
              <Typography variant="h2">Section Header</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Used for major section headings
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 0.5 }}
              >
                H3 • 1.75rem (28px) • Weight 600
              </Typography>
              <Typography variant="h3">Subsection Title</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Used for subsections and card titles
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 0.5 }}
              >
                H4 • 1.5rem (24px) • Weight 600
              </Typography>
              <Typography variant="h4">Card Header</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Used for category card headers
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 0.5 }}
              >
                H5 • 1.25rem (20px) • Weight 600
              </Typography>
              <Typography variant="h5">Nested Card Header</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Used for nested content sections
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 0.5 }}
              >
                Body 1 • 1rem (16px) • Weight 400
              </Typography>
              <Typography variant="body1">
                This is the primary body text used for most content throughout
                the application. It provides good readability and is the default
                for paragraphs and descriptions.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 0.5 }}
              >
                Body 2 • 0.875rem (14px) • Weight 400
              </Typography>
              <Typography variant="body2">
                This is secondary body text used for helper text, descriptions,
                and supplementary information.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 0.5 }}
              >
                Caption • 0.75rem (12px) • Weight 400
              </Typography>
              <Typography variant="caption">
                This is caption text used for labels, footnotes, and helper
                text.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* ========== COMPONENTS ========== */}
      <Card sx={commonStyles.categoryCard}>
        <CardContent>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            3. Components
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Reusable UI components used throughout the application.
          </Typography>

          <Stack spacing={6} sx={{ mt: 4 }}>
            {/* Cards */}
            <Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Cards
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Container components for grouping related content.
              </Typography>

              <Stack spacing={3} sx={{ mt: 3 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Category Card (Grey Background)
                  </Typography>
                  <Card sx={commonStyles.categoryCard}>
                    <CardContent>
                      <Typography variant="h5" gutterBottom>
                        Category Card Title
                      </Typography>
                      <Typography variant="body2">
                        This is the main content container with a grey
                        background. Used for major sections.
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Coverage Card (White Background)
                  </Typography>
                  <Card sx={commonStyles.coverageCard}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Nested Card Title
                      </Typography>
                      <Typography variant="body2">
                        White cards are used for nested content within category
                        cards.
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Buttons */}
            <Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Buttons
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Primary actions and navigation controls.
              </Typography>

              <Stack spacing={3} sx={{ mt: 3 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Button Variants
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    <Button variant="contained">Contained</Button>
                    <Button variant="outlined">Outlined</Button>
                    <Button variant="text">Text</Button>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Button Sizes
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Button variant="contained" size="small">
                      Small
                    </Button>
                    <Button variant="contained" size="medium">
                      Medium
                    </Button>
                    <Button variant="contained" size="large">
                      Large
                    </Button>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Button States
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    <Button variant="contained">Default</Button>
                    <Button variant="contained" disabled>
                      Disabled
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Alerts */}
            <Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Alerts
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Feedback messages for success, errors, warnings, and
                information.
              </Typography>

              <Stack spacing={2} sx={{ mt: 3 }}>
                <Alert severity="info">This is an informational message</Alert>
                <Alert severity="success">This is a success message</Alert>
                <Alert severity="warning">This is a warning message</Alert>
                <Alert severity="error">This is an error message</Alert>
              </Stack>
            </Box>

            <Divider />

            {/* Chips */}
            <Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Chips
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Compact elements for displaying tags, categories, or status.
              </Typography>

              <Stack
                direction="row"
                spacing={2}
                flexWrap="wrap"
                useFlexGap
                sx={{ mt: 3 }}
              >
                <Chip label="Default" />
                <Chip label="Primary" color="primary" />
                <Chip label="Success" color="success" />
                <Chip label="Outlined" variant="outlined" />
                <Chip label="Small" size="small" />
              </Stack>
            </Box>

            <Divider />

            {/* Navigation */}
            <Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Navigation
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Components for application and form navigation.
              </Typography>

              <Stack spacing={4} sx={{ mt: 3 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Form Progress Indicators
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 2 }}
                  >
                    Step indicators show progress through multi-step forms
                  </Typography>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <VerifiedUserOutlined
                        sx={{ fontSize: 18, color: "success.main" }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="success.main"
                      >
                        Completed
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ShieldOutlined
                        sx={{ fontSize: 18, color: "primary.main" }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="primary"
                      >
                        Active
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Future
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Form Navigation Buttons
                  </Typography>
                  <PageNavigation />
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Form Fields */}
            <Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Form Fields
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Input components for collecting user data with validation
                support.
              </Typography>

              <FormProvider {...methods}>
                <Stack spacing={4} sx={{ mt: 3, maxWidth: 600 }}>
                  {/* Text Fields */}
                  <Box>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Text Fields
                    </Typography>
                    <Stack spacing={3}>
                      <RHFTextField
                        name="textField"
                        label="Text Field with Floating Label"
                        placeholder="Enter text"
                      />

                      <Box>
                        <FormLabel>
                          Text field with standard label (for longer questions)
                        </FormLabel>
                        <TextField placeholder="Enter your answer" fullWidth />
                      </Box>

                      <RHFTextField
                        name="textareaField"
                        label="Textarea Field"
                        multiline
                        rows={4}
                      />
                    </Stack>
                  </Box>

                  {/* Specialized Fields */}
                  <Box>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Specialized Input Fields
                    </Typography>
                    <Stack spacing={3}>
                      <DateField name="dateField" label="Date Field" />

                      <RHFCurrencyField
                        name="currencyField"
                        label="Currency Field"
                      />
                    </Stack>
                  </Box>

                  {/* Dropdowns */}
                  <Box>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Dropdown Fields
                    </Typography>
                    <Stack spacing={3}>
                      <RHFSelect
                        name="selectField"
                        label="Standard Dropdown"
                        options={[
                          { label: "Option 1", value: "option1" },
                          { label: "Option 2", value: "option2" },
                          { label: "Option 3", value: "option3" },
                        ]}
                      />

                      <FormControl fullWidth>
                        <InputLabel>Multiselect Dropdown</InputLabel>
                        <Select
                          multiple
                          value={[]}
                          label="Multiselect Dropdown"
                          renderValue={(selected) =>
                            (selected as string[]).join(", ")
                          }
                        >
                          <MenuItem value="option1">
                            <Checkbox checked={false} />
                            Option 1
                          </MenuItem>
                          <MenuItem value="option2">
                            <Checkbox checked={false} />
                            Option 2
                          </MenuItem>
                          <MenuItem value="option3">
                            <Checkbox checked={false} />
                            Option 3
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </Box>

                  {/* Radio Buttons */}
                  <Box>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Radio Buttons
                    </Typography>
                    <RHFRadioGroup
                      name="radioField"
                      label="Radio Group"
                      options={[
                        { label: "Yes", value: "yes" },
                        { label: "No", value: "no" },
                      ]}
                    />
                  </Box>

                  {/* Checkboxes */}
                  <Box>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Checkboxes
                    </Typography>
                    <Stack spacing={1}>
                      <RHFCheckbox
                        name="checkboxField"
                        label="Single Checkbox"
                      />
                      <FormControlLabel
                        control={<Checkbox />}
                        label="Checkbox Option 2"
                      />
                      <FormControlLabel
                        control={<Checkbox />}
                        label="Checkbox Option 3"
                      />
                    </Stack>
                  </Box>

                  {/* Required Fields */}
                  <Box>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Required Fields
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 2 }}
                    >
                      Required fields display a red asterisk (*)
                    </Typography>
                    <Stack spacing={3}>
                      <RHFTextField
                        name="requiredTextField"
                        label="Required Text Field"
                        required
                      />

                      <DateField
                        name="requiredDateField"
                        label="Required Date Field"
                        required
                      />

                      <RHFSelect
                        name="requiredSelectField"
                        label="Required Dropdown"
                        required
                        options={[
                          { label: "Option 1", value: "option1" },
                          { label: "Option 2", value: "option2" },
                        ]}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </FormProvider>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

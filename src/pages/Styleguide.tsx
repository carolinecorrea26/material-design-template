import * as React from "react";
import {
  Typography, Box, Stack, useTheme, Card, CardContent,
  Button, TextField, FormControlLabel, Chip, Alert, Checkbox, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, ToggleButtonGroup, ToggleButton, FormLabel
} from "@mui/material";
import { Person, Email, Security, CheckCircle, Info, Warning, Error, People, ChildFriendly } from "@mui/icons-material";
import { FormProvider, useForm } from "react-hook-form";
import PageHeader from "../components/layout/PageHeader";
import { CollapsibleSection } from "../components/common";
import { CoverageCategoryCard, CoverageCategoryChip } from "../components/coverage";
import RHFTextField from "../components/form/RHFTextField";
import RHFSelect from "../components/form/RHFSelect";
import RHFRadioGroup from "../components/form/RHFRadioGroup";
import RHFCheckbox from "../components/form/RHFCheckbox";
import RHFCurrencyField from "../components/form/RHFCurrencyField";
import DateField from "../components/form/DateField";
import { ParityBreadcrumb } from "../components/parity";
import { commonStyles } from "../theme/commonStyles";
import { THEME_COLORS, UI_COLORS } from "../config/themeColors";

export default function Styleguide() {
  const theme = useTheme();
  
  // Mock form for demo purposes
  const methods = useForm({
    defaultValues: {
      textField: '',
      selectField: '',
      radioField: 'option1',
      checkboxField: false
    }
  });

  const ColorSwatch = ({ color, name }: { color: string; name: string }) => (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        sx={{
          width: 100,
          height: 100,
          bgcolor: color,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          mb: 1
        }}
      />
      <Typography variant="caption" display="block">
        {name}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {color}
      </Typography>
    </Box>
  );

  return (
    <Stack spacing={4}>
      <PageHeader 
        title="Design System & Style Guide"
        notes="A comprehensive guide to theme colors, typography, and components used in this application."
      />

      {/* Theme Colors */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Theme Colors
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Clients can choose from these predefined color palettes. Each theme has a main primary color and a dark variant.
        </Typography>
        
        <Stack spacing={4} sx={{ mt: 3 }}>
          {Object.entries(THEME_COLORS).map(([themeName, colors]) => (
            <Box key={themeName}>
              <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
                {themeName} Theme
              </Typography>
              <Stack direction="row" spacing={3}>
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

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            UI System Colors
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            These semantic colors are used throughout the application and are independent of the client theme.
          </Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
            <ColorSwatch color={UI_COLORS.success.main} name="Success" />
            <ColorSwatch color={UI_COLORS.error.main} name="Error" />
            <ColorSwatch color={UI_COLORS.warning.main} name="Warning" />
            <ColorSwatch color={UI_COLORS.info.main} name="Info" />
            <ColorSwatch color={UI_COLORS.grey[100]} name="Grey 100" />
            <ColorSwatch color={UI_COLORS.grey[300]} name="Grey 300" />
            <ColorSwatch color={UI_COLORS.grey[700]} name="Grey 700" />
          </Stack>
        </Box>
      </Card>

      {/* Typography */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Typography
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Font family: Inter (sans-serif). All sizes and weights are predefined for consistency.
        </Typography>
        
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Variant</strong></TableCell>
                <TableCell><strong>Size</strong></TableCell>
                <TableCell><strong>Weight</strong></TableCell>
                <TableCell><strong>Usage</strong></TableCell>
                <TableCell><strong>Example</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>h1</TableCell>
                <TableCell>2.5rem (40px)</TableCell>
                <TableCell>700</TableCell>
                <TableCell>Main page titles</TableCell>
                <TableCell><Typography variant="h1">Heading 1</Typography></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>h2</TableCell>
                <TableCell>2rem (32px)</TableCell>
                <TableCell>700</TableCell>
                <TableCell>Section headers</TableCell>
                <TableCell><Typography variant="h2">Heading 2</Typography></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>h3</TableCell>
                <TableCell>1.75rem (28px)</TableCell>
                <TableCell>600</TableCell>
                <TableCell>Subsection titles</TableCell>
                <TableCell><Typography variant="h3">Heading 3</Typography></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>h4</TableCell>
                <TableCell>1.5rem (24px)</TableCell>
                <TableCell>600</TableCell>
                <TableCell>Card/category headers</TableCell>
                <TableCell><Typography variant="h4">Heading 4</Typography></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>h5</TableCell>
                <TableCell>1.25rem (20px)</TableCell>
                <TableCell>600</TableCell>
                <TableCell>Nested card headers</TableCell>
                <TableCell><Typography variant="h5">Heading 5</Typography></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>h6</TableCell>
                <TableCell>1.125rem (18px)</TableCell>
                <TableCell>600</TableCell>
                <TableCell>Small headers, labels</TableCell>
                <TableCell><Typography variant="h6">Heading 6</Typography></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>body1</TableCell>
                <TableCell>1rem (16px)</TableCell>
                <TableCell>400</TableCell>
                <TableCell>Primary body text</TableCell>
                <TableCell><Typography variant="body1">Body text paragraph</Typography></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>body2</TableCell>
                <TableCell>0.875rem (14px)</TableCell>
                <TableCell>400</TableCell>
                <TableCell>Secondary text, descriptions</TableCell>
                <TableCell><Typography variant="body2">Smaller body text</Typography></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>caption</TableCell>
                <TableCell>0.75rem (12px)</TableCell>
                <TableCell>400</TableCell>
                <TableCell>Help text, footnotes</TableCell>
                <TableCell><Typography variant="caption">Caption text</Typography></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Component Library */}
      {/* <Card sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Component Library
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Reusable components used throughout the application.
        </Typography>
        
        <Stack spacing={4} sx={{ mt: 3 }}>
          <Box>
            <Typography variant="h5" gutterBottom>Form Components</Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Component</strong></TableCell>
                    <TableCell><strong>Usage</strong></TableCell>
                    <TableCell><strong>Location</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>RHFTextField</TableCell>
                    <TableCell>Text input fields (React Hook Form integrated)</TableCell>
                    <TableCell>All form pages</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>RHFSelect</TableCell>
                    <TableCell>Dropdown selection fields</TableCell>
                    <TableCell>Contact, Profile, Eligibility</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>RHFRadioGroup</TableCell>
                    <TableCell>Toggle button groups for mutually exclusive options</TableCell>
                    <TableCell>Health History, Profile, Contact</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>RHFCheckbox</TableCell>
                    <TableCell>Single checkbox fields</TableCell>
                    <TableCell>Profile, Consent</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>RHFCurrencyField</TableCell>
                    <TableCell>Currency-formatted input fields</TableCell>
                    <TableCell>Coverage, Profile</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom>Layout Components</Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Component</strong></TableCell>
                    <TableCell><strong>Usage</strong></TableCell>
                    <TableCell><strong>Location</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>PageHeader</TableCell>
                    <TableCell>Page title and subtitle/notes section</TableCell>
                    <TableCell>All application pages</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>PageNavigation</TableCell>
                    <TableCell>Back/Continue navigation buttons</TableCell>
                    <TableCell>All form pages</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CollapsibleSection</TableCell>
                    <TableCell>Expandable/collapsible content sections</TableCell>
                    <TableCell>Eligibility, Decision</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Card (categoryCard)</TableCell>
                    <TableCell>Main content container with grey background</TableCell>
                    <TableCell>All form pages</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Card (coverageCard)</TableCell>
                    <TableCell>Nested white cards within category cards</TableCell>
                    <TableCell>Eligibility, Profile, Contact</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom>Coverage Components</Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Component</strong></TableCell>
                    <TableCell><strong>Usage</strong></TableCell>
                    <TableCell><strong>Location</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>CoverageCategoryCard</TableCell>
                    <TableCell>Display coverage category with products list</TableCell>
                    <TableCell>Landing page</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CoverageCategoryChip</TableCell>
                    <TableCell>Small badge showing coverage category</TableCell>
                    <TableCell>Coverage, Preview</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CoverageIcon</TableCell>
                    <TableCell>Icons for coverage categories (LI, DI, OO, SH)</TableCell>
                    <TableCell>Coverage pages</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography variant="h5" gutterBottom>Feedback Components</Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Component</strong></TableCell>
                    <TableCell><strong>Usage</strong></TableCell>
                    <TableCell><strong>Location</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Alert</TableCell>
                    <TableCell>Info, success, warning, and error messages</TableCell>
                    <TableCell>All pages for validation/feedback</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>ParitySnackbar</TableCell>
                    <TableCell>Toast notifications (temporary messages)</TableCell>
                    <TableCell>Global notification system</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>PageLoader</TableCell>
                    <TableCell>Loading spinner during page transitions</TableCell>
                    <TableCell>All page navigation</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </Card> */}

      {/* Buttons */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Buttons
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button variant="contained">Contained</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="text">Text</Button>
          <Button variant="contained" size="small">Small</Button>
          <Button variant="contained" size="large">Large</Button>
          <Button variant="contained" disabled>Disabled</Button>
        </Stack>
      </Card>

      {/* Form Components - Live Examples */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Form Components
        </Typography>
        <FormProvider {...methods}>
          <Stack spacing={3} sx={{ maxWidth: 500 }}>
            <Typography variant="h6">Standard Fields</Typography>
            
            <RHFTextField 
              name="textField" 
              label="Short Label" 
              placeholder="Enter text" 
            />
            
            <Box>
              <FormLabel>
                Fields with a longer label (too long for a floating label)
              </FormLabel>
              <TextField 
                placeholder="Enter your answer"
                fullWidth
              />
            </Box>
            
            <RHFCurrencyField
              name="currencyField"
              label="Currency Field"
            />
            
            <DateField 
              name="dateField"
              label="Date Field"
            />
            
            <RHFSelect 
              name="selectField" 
              label="Select Field"
              options={[
                { label: "Option 1", value: "option1" },
                { label: "Option 2", value: "option2" },
                { label: "Option 3", value: "option3" }
              ]}
            />
            
            <Box>
              <RHFRadioGroup 
                name="radioField"
                label="Radio Button"
                options={[
                  { label: "Yes", value: "yes" },
                  { label: "No", value: "no" }
                ]}
              />
            </Box>

            <Box>
              <FormLabel>Checkboxes</FormLabel>
              <RHFCheckbox 
                name="checkboxField" 
                label="Checkbox Field" 
              />
            </Box>

            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Required Fields (with red asterisk)</Typography>

            <RHFTextField 
              name="requiredTextField" 
              label="Required Text Field" 
              placeholder="Enter text"
              required
            />
            
            <Box>
              <FormLabel required>
                Required field with standard label
              </FormLabel>
              <TextField 
                placeholder="Enter your answer"
                fullWidth
              />
            </Box>
            
            <RHFCurrencyField
              name="requiredCurrencyField"
              label="Required Currency Field"
              required
            />
            
            <TextField 
              type="date"
             DateField 
              name="requiredDateField"
              label="Required Date Field"
              required
            <RHFSelect 
              name="requiredSelectField" 
              label="Required Select Field"
              required
              options={[
                { label: "Option 1", value: "option1" },
                { label: "Option 2", value: "option2" },
                { label: "Option 3", value: "option3" }
              ]}
            />
            
            <Box>
              <RHFRadioGroup 
                name="requiredRadioField"
                label="Required Radio Button"
                required
                options={[
                  { label: "Yes", value: "yes" },
                  { label: "No", value: "no" }
                ]}
              />
            </Box>

            <Box>
              <FormLabel required>Required Checkbox</FormLabel>
              <FormControlLabel
                control={<Checkbox />}
                label={
                  <Typography variant="body2" component="span">
                    I agree to the terms and conditions{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                  </Typography>
                }
              />
            </Box>
            
          </Stack>
        </FormProvider>
      </Card>

      {/* Feedback Component Examples */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Feedback Components
        </Typography>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>Alerts</Typography>
            <Stack spacing={2}>
              <Alert severity="info">
                This is an informational alert
              </Alert>
              <Alert severity="success">
                This is a success alert
              </Alert>
              <Alert severity="warning">
                This is a warning alert
              </Alert>
              <Alert severity="error">
                This is an error alert
              </Alert>
            </Stack>
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom>Chips</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Chip label="Default Chip" />
              <Chip label="Primary Chip" color="primary" />
              <Chip label="Outlined" variant="outlined" />
              <Chip label="Small" size="small" />
            </Stack>
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}

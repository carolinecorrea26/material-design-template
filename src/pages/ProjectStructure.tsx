import * as React from "react";
import {
  Box, Card, CardContent, Stack, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper
} from "@mui/material";
import PageHeader from "../components/layout/PageHeader";

export default function ProjectStructure() {
  return (
    <Stack spacing={4}>
      <PageHeader 
        title="Project Structure"
        notes="A guide to help you navigate and understand the project organization."
      />

      <Card sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          📁 Directory Structure
        </Typography>

        <Box component="pre" sx={{
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          bgcolor: 'grey.50',
          p: 2,
          borderRadius: 1,
          overflow: 'auto',
          lineHeight: 1.5,
          mt: 2
        }}>
{`src/
├── components/           # Feature-organized React components
│   ├── common/          # Reusable UI components
│   ├── coverage/        # Coverage/insurance components
│   ├── dev/             # Development tools
│   ├── feedback/        # User feedback components
│   ├── form/            # Form input components (RHF integrated)
│   ├── layout/          # Layout components (Header, Footer, etc.)
│   └── parity/          # Parity-specific components
├── pages/               # Page components (one per route)
├── hooks/               # Custom React hooks
├── state/               # State management (Context providers)
├── theme/               # Styling & theming
│   ├── commonStyles.ts  # Reusable style utilities
│   ├── components.ts    # MUI component style overrides
│   └── muiTheme.ts      # Material-UI theme configuration
├── config/              # Configuration files
│   ├── clients.ts       # Client branding configurations
│   ├── pages.ts         # Page definitions
│   └── themeColors.ts   # Theme color palettes
├── validation/          # Form validation schemas (Zod)
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── constants/           # Application constants
├── api/                 # API integration & data fetching
├── data/                # Static data
│   └── fixtures/        # JSON test fixtures
└── assets/              # Static assets (images, fonts, etc.)`}
        </Box>
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          🗂️ Key Directories Explained
        </Typography>

        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Directory</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Purpose</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Key Files</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell><code>/components/common</code></TableCell>
                <TableCell>Reusable UI components used across multiple pages</TableCell>
                <TableCell>CollapsibleSection, PageLoader, PrivacyNotice</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/components/coverage</code></TableCell>
                <TableCell>Coverage/insurance specific components</TableCell>
                <TableCell>CoverageCategoryCard, CoverageCategoryChip, QuoteModal</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/components/form</code></TableCell>
                <TableCell>Form input components integrated with React Hook Form</TableCell>
                <TableCell>RHFTextField, RHFSelect, RHFRadioGroup, RHFCheckbox, RHFCurrencyField</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/components/layout</code></TableCell>
                <TableCell>Layout structure components</TableCell>
                <TableCell>Header, Footer, PageHeader, PageNavigation</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/components/dev</code></TableCell>
                <TableCell>Development tools (only shown in dev/prototype)</TableCell>
                <TableCell>DevTools, ClientSwitcher</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/pages</code></TableCell>
                <TableCell>Page components (one per route)</TableCell>
                <TableCell>Landing, Membership, Eligibility, Coverage, Contact, Profile, etc.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/hooks</code></TableCell>
                <TableCell>Custom React hooks</TableCell>
                <TableCell>useScrollToFirstError, usePageTransition</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/state</code></TableCell>
                <TableCell>React Context providers for global state</TableCell>
                <TableCell>AppDataContext, StepperContext</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/theme</code></TableCell>
                <TableCell>Styling and theming configuration</TableCell>
                <TableCell>muiTheme.ts, commonStyles.ts, components.ts</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/config</code></TableCell>
                <TableCell>Application configuration</TableCell>
                <TableCell>clients.ts (branding), themeColors.ts, pages.ts</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/validation</code></TableCell>
                <TableCell>Form validation schemas using Zod</TableCell>
                <TableCell>eligibility.ts, contact.ts, profile.ts, healthHistory.ts</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/types</code></TableCell>
                <TableCell>TypeScript type definitions</TableCell>
                <TableCell>app.ts (main types)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>/api</code></TableCell>
                <TableCell>API calls and data fetching</TableCell>
                <TableCell>client.ts (getProducts, etc.)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          📄 Important Files
        </Typography>

        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Purpose</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell><code>src/router.tsx</code></TableCell>
                <TableCell>Defines all application routes and navigation</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>src/AppShell.tsx</code></TableCell>
                <TableCell>Main layout wrapper (Header, Footer, DevTools)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>src/config/clients.ts</code></TableCell>
                <TableCell>Client branding configuration (logos, colors, text)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>src/config/themeColors.ts</code></TableCell>
                <TableCell>Available theme color palettes</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>src/theme/muiTheme.ts</code></TableCell>
                <TableCell>Material-UI theme configuration</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>src/theme/commonStyles.ts</code></TableCell>
                <TableCell>Reusable style definitions used across components</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>src/state/AppDataContext.tsx</code></TableCell>
                <TableCell>Global application state management</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><code>src/api/client.ts</code></TableCell>
                <TableCell>API functions for fetching products and data</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          🔍 Finding What You Need
        </Typography>

        <Stack spacing={3} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Looking for a specific component?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Form inputs:</strong> Check <code>/components/form</code> (RHFTextField, RHFSelect, etc.)<br/>
              • <strong>Layout elements:</strong> Check <code>/components/layout</code> (Header, Footer, PageNavigation)<br/>
              • <strong>Coverage UI:</strong> Check <code>/components/coverage</code> (Cards, Chips, Modals)<br/>
              • <strong>General UI:</strong> Check <code>/components/common</code> (Alerts, Loaders, etc.)
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Need to modify a page?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All page components are in <code>/pages</code> directory. Each route has its own file (e.g., Eligibility.tsx, Coverage.tsx, Profile.tsx).
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Want to change branding or colors?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Client branding:</strong> <code>/config/clients.ts</code> (logos, text, phone numbers)<br/>
              • <strong>Theme colors:</strong> <code>/config/themeColors.ts</code> (color palettes)<br/>
              • <strong>Theme settings:</strong> <code>/theme/muiTheme.ts</code> (typography, spacing, etc.)<br/>
              • <strong>Reusable styles:</strong> <code>/theme/commonStyles.ts</code> (component styles)
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Need to add form validation?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All validation schemas are in <code>/validation</code> using Zod. Each page has its own schema file (e.g., contact.ts, profile.ts).
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Working with products/coverage data?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Product data:</strong> <code>/data/fixtures/products.json</code><br/>
              • <strong>API functions:</strong> <code>/api/client.ts</code> (getProducts, etc.)<br/>
              • <strong>Types:</strong> <code>/types/app.ts</code> (Product, CoverageCategory, etc.)
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Managing global state?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>Application data:</strong> <code>/state/AppDataContext.tsx</code> (form data, user selections)<br/>
              • <strong>Navigation state:</strong> <code>/state/StepperContext.tsx</code> (current step, progress)
            </Typography>
          </Box>
        </Stack>
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          💡 Quick Tips
        </Typography>

        <Stack spacing={2} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              • All components use barrel exports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Import from directory index: <code>import {"{ Component }"} from '../components/common'</code>
            </Typography>
          </Box>

          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              • Form components are React Hook Form integrated
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use RHF* components (RHFTextField, RHFSelect) for automatic validation and state management
            </Typography>
          </Box>

          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              • TypeScript is used throughout
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check <code>/types/app.ts</code> for main type definitions
            </Typography>
          </Box>

          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              • Development tools are available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Open DevTools panel (gear icon on right) to switch clients, fill forms, or reset the app
            </Typography>
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}
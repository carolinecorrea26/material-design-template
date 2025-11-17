import * as React from "react";
import {
  Box, Card, CardContent, Stack, Typography, Divider
} from "@mui/material";

export default function ProjectStructure() {
  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ textAlign: 'center', mb: 2 }}>
        Project Structure (Dev-only)
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            📁 Source Directory Structure
          </Typography>

          <Box component="pre" sx={{
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            bgcolor: 'grey.50',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            lineHeight: 1.5
          }}>
{`src/
├── components/           # Feature-organized React components
│   ├── common/          # Reusable components (CollapsibleSection, etc.)
│   ├── coverage/        # Coverage/insurance related (Cards, Chips, QuoteModal)
│   ├── dev/             # Development tools (ClientSwitcher, DevTools)
│   ├── feedback/        # User feedback (Snackbar, Confirm dialogs)
│   ├── form/            # Form components only (RHF*, RadioGroup, etc.)
│   ├── layout/          # Layout components (Header, Footer, Navigation)
│   └── parity/          # Parity-specific components
├── hooks/               # Custom React hooks
│   ├── index.ts         # Central hook exports
│   ├── useClientConfig.ts
│   ├── usePageTransition.ts
│   └── useScrollToFirstError.ts
├── pages/               # Page components (one per route)
├── theme/               # Styling & theming
│   ├── commonStyles.ts  # Reusable style utilities
│   ├── components.ts    # Component-specific styles
│   └── muiTheme.ts      # Material-UI theme configuration
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── config/              # Configuration files
├── constants/           # Application constants
├── validation/          # Form validation logic
├── state/               # State management (Context providers)
├── navigation/          # Navigation components
├── api/                 # API integration
├── data/                # Static data & test fixtures
│   └── fixtures/        # JSON test data
├── mocks/               # Mock data for testing
└── stories/             # Storybook documentation`}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            🏗️ Architecture Principles
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Feature-Based Organization
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Components are grouped by business domain (coverage, form, layout) rather than technical type,
                making it easier to find and maintain related functionality.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Separation of Concerns
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Business logic, UI components, styling, and configuration are kept in separate directories
                to maintain clean boundaries and improve maintainability.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Barrel Exports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Each directory has an index.ts file that re-exports all its contents, enabling clean imports
                like <code>import {"{ Component }"} from '../components/common'</code>.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                TypeScript First
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Strong typing throughout with dedicated types directory and proper interface definitions
                for all components and data structures.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            📋 Development Guidelines
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Adding New Components
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Place components in the appropriate feature directory (e.g., coverage-related in components/coverage/).
                Update the directory's index.ts file to export the new component.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Custom Hooks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All custom hooks go in the hooks/ directory. Add exports to hooks/index.ts
                and follow the use* naming convention.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Storybook Documentation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create stories for all components in src/stories/. Follow the naming pattern
                ComponentName.stories.tsx and organize by category.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
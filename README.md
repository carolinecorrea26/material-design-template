# NYL MDV2 Prototype

A modern, multi-step insurance application built with React, TypeScript, Material-UI, and Vite.

## 🚀 Features

- **Modern Tech Stack**: React 18, TypeScript, Material-UI v7, React Router v7
- **Multi-Client Support**: Easy configuration for different clients (ABE, NYL, AMA, etc.)
- **Dynamic Branding**: Client-specific logos, colors, and themes
- **Form Management**: React Hook Form with Zod validation
- **Responsive Design**: Mobile-first approach with Material-UI breakpoints
- **Theme Customization**: Centralized theme configuration with consistent styling
- **Multi-step Forms**: Progressive disclosure with validation
- **Quote Generation**: Interactive quote modal with product selection
- **Component Library**: Reusable form components and layouts
- **Type Safety**: Full TypeScript coverage
- **Development Tools**: Storybook for component development, MSW for API mocking

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── common/         # Shared UI components (CollapsibleSection, etc.)
│   ├── form/           # Form components (RHFTextField, RadioGroup, etc.)
│   └── layout/         # Layout components (Header, PageHeader, etc.)
├── pages/              # Route pages
│   ├── Landing.tsx     # Landing page with hero and quote form
│   ├── Eligibility.tsx # Multi-step eligibility form
│   ├── Coverage.tsx    # Coverage selection
│   ├── Profile.tsx     # Applicant profile
│   └── ...
├── theme/              # Theme configuration
│   ├── muiTheme.ts     # MUI theme setup
│   ├── components.ts   # Component style overrides
│   └── commonStyles.ts # Shared style utilities
├── validation/         # Zod schemas for form validation
├── config/             # App configuration
└── router.tsx          # React Router setup
```

## 🛠️ Tech Stack

- **React 18.3.1** - UI library
- **TypeScript** - Type safety
- **Material-UI 7.3.2** - Component library
- **React Hook Form 7.63** - Form management
- **Zod 4.1** - Schema validation
- **React Router 7.9** - Routing
- **Vite 6.x** - Build tool
- **MSW 2.11** - API mocking
- **Storybook 9.1** - Component development

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start Storybook
npm run storybook
```

### Available Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run storybook` - Start Storybook (http://localhost:6006)
- `npm run build-storybook` - Build Storybook for production

## 🎨 Client Configuration

The application supports multiple clients with different branding and configurations. See [CLIENT_CONFIG.md](./CLIENT_CONFIG.md) for full documentation.

### Quick Start

1. **Set the active client** in `.env`:
   ```env
   VITE_CLIENT_ID=abe    # or 'nyl', 'ama', or 'default'
   ```

2. **Restart the dev server**:
   ```bash
   npm run dev
   ```

### What Changes per Client?

- **Logos**: Primary and partner logos
- **Hero Images**: Client-specific hero images on landing page
- **Theme Colors**: Primary and secondary brand colors
- **Features**: Show/hide components (partner logo, rating badges, etc.)
- **Field Labels**: Custom labels per client (coming soon)

### Available Clients

- **ABE** (`abe`) - American Bar Endowment with NYL partnership
- **NYL** (`nyl`) - New York Life standalone
- **AMA** (`ama`) - American Medical Association with NYL partnership
- **Default** (`default`) - Same as NYL (fallback configuration)

See [CLIENT_CONFIG.md](./CLIENT_CONFIG.md) for adding new clients and advanced configuration.

## 📋 Application Flow

1. **Landing Page** (`/`) - Hero section with quote form
   - Coverage type selection (Life/Disability)
   - Basic information input
   - Quote modal with product options

2. **Eligibility** (`/eligibility`) - Multi-step form
   - Personal information
   - Health questions
   - Work/financial details
   - Spouse and children information

3. **Coverage Selection** (`/coverage`) - Policy options
4. **Profile** (`/profile`) - Detailed applicant information
5. **Contact** (`/contact`) - Contact details
6. **Payment** (`/payment`) - Payment information
7. **Preview** (`/preview`) - Application review
8. **Receipt** (`/receipt`) - Confirmation

## 🎨 Theme & Styling

The application uses a centralized theme configuration:

- **Primary Color**: Custom blue (#1976d2)
- **Typography**: Inter font family
- **Components**: Centralized style overrides in `src/theme/components.ts`
- **Responsive**: Mobile-first with consistent breakpoints

### Key Style Patterns

- Toggle buttons (radio groups) use primary color fill when selected
- Form labels are consistent across all pages
- Date pickers use native HTML5 inputs
- Consistent spacing and typography throughout

## 📦 Key Components

### Form Components
- `RHFTextField` - Text input with React Hook Form integration
- `RHFSelect` - Dropdown select with validation
- `RHFRadioGroup` - Radio group styled as toggle buttons
- `RHFCheckbox` - Checkbox with form integration
- `RadioGroup` - Standalone toggle button group

### Layout Components
- `Header` - App header with navigation and ratings
- `PageHeader` - Page title with description
- `PageNavigation` - Multi-step navigation controls
- `CollapsibleSection` - Expandable content sections

## 🧪 Testing & Development

- **Storybook**: Component isolation and documentation
- **MSW**: Mock Service Worker for API simulation
- **ESLint**: Code quality and consistency
- **TypeScript**: Compile-time type checking

## 📚 Documentation

- [COMPONENTS.md](./COMPONENTS.md) - Detailed component documentation
- [src/docs/](./src/docs/) - Additional documentation

## 🔧 Configuration Files

- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint rules
- `.storybook/` - Storybook configuration

## 📝 Code Style

- **Formatting**: Prettier with default settings
- **Linting**: ESLint with React and TypeScript rules
- **Naming**: PascalCase for components, camelCase for utilities
- **Imports**: Organized with absolute paths where applicable

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Use the established theme system for styling
3. Create reusable components when appropriate
4. Add TypeScript types for all new code
5. Test components in Storybook
6. Update documentation as needed

## 📄 License

Private project - All rights reserved

---

## 🔍 ESLint Advanced Configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

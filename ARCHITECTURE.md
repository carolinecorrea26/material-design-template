# Architecture Documentation

## Overview

This is a modern React application built with TypeScript, Material-UI, and Vite. The application follows a component-based architecture with centralized state management, theming, and validation.

## Technology Stack

### Core
- **React 18.3.1** - UI library with hooks
- **TypeScript 5.8** - Type safety and developer experience
- **Vite 6.x** - Fast build tool and dev server
- **React Router 7.9** - Client-side routing

### UI & Styling
- **Material-UI 7.3.2** - Component library
- **Emotion** - CSS-in-JS styling
- **Inter Font** - Typography (variable + standard)

### Forms & Validation
- **React Hook Form 7.63** - Form state management
- **Zod 4.1** - Schema validation
- **@hookform/resolvers** - RHF + Zod integration

### Development Tools
- **Storybook 9.1** - Component development and documentation
- **MSW 2.11** - API mocking
- **ESLint 9.36** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Testing framework

## Project Structure

```
nyl-mdv2-proto/
├── public/                      # Static assets
│   ├── mockServiceWorker.js    # MSW service worker
│   └── brand/                  # Logo images
│
├── src/
│   ├── main.tsx                # Application entry point
│   ├── App.tsx                 # Root component
│   ├── AppShell.tsx            # Layout wrapper
│   ├── router.tsx              # Route configuration
│   │
│   ├── components/             # Reusable components
│   │   ├── common/            # Shared UI components
│   │   │   ├── CollapsibleSection.tsx
│   │   │   └── PageLoader.tsx
│   │   ├── form/              # Form components
│   │   │   ├── RHFTextField.tsx
│   │   │   ├── RHFSelect.tsx
│   │   │   ├── RHFRadioGroup.tsx
│   │   │   ├── RHFCheckbox.tsx
│   │   │   └── RadioGroup.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── PageNavigation.tsx
│   │   ├── parity/            # Legacy compatibility components
│   │   ├── feedback/          # User feedback components
│   │   └── dev/               # Development utilities
│   │
│   ├── pages/                  # Route page components
│   │   ├── Landing.tsx        # Landing page with quote form
│   │   ├── Eligibility.tsx    # Multi-step eligibility form
│   │   ├── Coverage.tsx       # Coverage selection
│   │   ├── Profile.tsx        # Applicant profile
│   │   ├── Contact.tsx        # Contact information
│   │   ├── Payment.tsx        # Payment details
│   │   ├── Preview.tsx        # Application review
│   │   ├── Receipt.tsx        # Confirmation
│   │   ├── Resume.tsx         # Resume application
│   │   ├── Home.tsx           # Home page
│   │   └── Consent.tsx        # Consent forms
│   │
│   ├── theme/                  # Theme configuration
│   │   ├── muiTheme.ts        # MUI theme setup
│   │   ├── components.ts      # Component style overrides
│   │   └── commonStyles.ts    # Shared style utilities
│   │
│   ├── validation/             # Zod schemas
│   │   └── eligibility.ts     # Eligibility form schema
│   │
│   ├── config/                 # App configuration
│   │   └── pages.ts           # Page metadata
│   │
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   ├── constants/              # App constants
│   ├── data/                   # Static data
│   ├── state/                  # State management
│   ├── api/                    # API client functions
│   ├── mocks/                  # MSW mock handlers
│   ├── stories/                # Storybook stories
│   ├── docs/                   # Additional documentation
│   └── assets/                 # Images and icons
│
├── .storybook/                 # Storybook configuration
├── eslint.config.js            # ESLint configuration
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
├── package.json                # Dependencies and scripts
├── README.md                   # Project overview
├── COMPONENTS.md               # Component documentation
└── ARCHITECTURE.md             # This file
```

## Architecture Patterns

### Component Architecture

#### 1. Page Components
- Located in `src/pages/`
- Handle routing and page-level logic
- Use layout components (Header, PageHeader, PageNavigation)
- Import and compose smaller components
- Manage page-specific state

#### 2. Form Components
- Prefixed with `RHF` for React Hook Form integration
- Located in `src/components/form/`
- Wrapped Material-UI components
- Handle validation and error display
- Type-safe with TypeScript

#### 3. Layout Components
- Located in `src/components/layout/`
- Provide consistent structure
- Handle responsive behavior
- Reusable across pages

#### 4. Common Components
- Located in `src/components/common/`
- Generic, reusable UI elements
- No business logic
- Highly composable

### State Management

#### Form State
- **React Hook Form** manages form data
- Field-level validation with Zod schemas
- Optimized re-renders
- Built-in error handling

#### Application State
- React Context (where needed)
- Local component state with `useState`
- URL state via React Router

#### Server State
- MSW for development mocking
- Prepared for future API integration

### Routing

```tsx
// Route structure
/                    -> Landing page
/eligibility         -> Eligibility form
/coverage            -> Coverage selection
/profile             -> Applicant profile
/contact             -> Contact details
/payment             -> Payment information
/preview             -> Application review
/receipt             -> Confirmation
/resume              -> Resume application
/home                -> Home page
/consent             -> Consent forms
```

### Styling Strategy

#### Theme-First Approach
1. **Global Theme** (`muiTheme.ts`):
   - Colors (primary, secondary, error, etc.)
   - Typography (fonts, sizes, weights)
   - Spacing (8px base unit)
   - Breakpoints (xs, sm, md, lg, xl)
   - Shape (border radius)

2. **Component Overrides** (`components.ts`):
   - MUI component default styles
   - Consistent behavior across app
   - No component-level inline styles for theme-controlled properties

3. **Common Styles** (`commonStyles.ts`):
   - Reusable style objects
   - Shared patterns (flexGrow, unstyledLink, logo sizing)

#### Style Hierarchy
1. Theme defaults (lowest priority)
2. Component overrides in theme
3. Component-specific styles (when needed)
4. Inline `sx` props (highest priority, use sparingly)

**Principles**:
- Avoid inline styles when possible
- Define reusable styles in theme
- Keep component code focused on logic, not styling
- Use `sx` prop only for component-specific one-offs

### Validation Strategy

#### Zod Schemas
- Type-safe validation
- Async validation support
- Conditional validation with `superRefine`
- Array validation for dynamic fields
- Error message customization

#### Form Integration
```tsx
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

const form = useForm({
  resolver: zodResolver(schema)
});
```

### Type Safety

#### TypeScript Configuration
- Strict mode enabled
- Path aliases for imports
- Type checking in build process

#### Type Patterns
- Props interfaces for all components
- Zod schema inference for form types
- Generic types for reusable components

### Responsive Design

#### Breakpoint Strategy
- Mobile-first approach
- Use MUI breakpoints consistently
- `useMediaQuery` for conditional rendering
- Stack direction changes for layouts

#### Patterns
```tsx
// Responsive spacing
sx={{ py: { xs: 4, md: 6 } }}

// Conditional rendering
const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

// Responsive layout
<Stack direction={{ xs: 'column', sm: 'row' }}>
```

## Data Flow

### Form Submission Flow
1. User fills form fields
2. React Hook Form manages state
3. Zod validates on blur/submit
4. Error messages display
5. Valid data submitted
6. Navigation to next page

### Page Navigation Flow
1. User clicks navigation button
2. Form validation triggers
3. If valid, save data (future: API call)
4. Navigate to next route
5. PageLoader shows during transition

## Performance Considerations

### Optimization Strategies
1. **Code Splitting**: Route-based code splitting with React Router
2. **Lazy Loading**: Dynamic imports for heavy components
3. **Memoization**: React.memo for expensive renders
4. **Form Optimization**: React Hook Form's isolated re-renders
5. **Bundle Size**: Tree-shaking with Vite

### Build Optimization
- Vite's fast HMR in development
- Optimized production builds
- Asset optimization (images, fonts)
- CSS minification via Emotion

## Development Workflow

### Local Development
```bash
npm run dev          # Start dev server
npm run storybook    # Start Storybook
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run build        # Type check + build
```

### Component Development
1. Create component in appropriate folder
2. Add TypeScript types
3. Create Storybook story
4. Write component logic
5. Add to parent component/page
6. Test in browser and Storybook

## Testing Strategy

### Current Setup
- Vitest for unit tests
- Storybook for component testing
- Browser testing with @vitest/browser

### Future Testing
- E2E tests with Playwright
- Visual regression testing
- Accessibility testing

## Deployment

### Build Process
```bash
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build
```

### Output
- Optimized bundles in `dist/`
- Static assets with hashing
- Sourcemaps for debugging

## Future Enhancements

### Planned Features
- [ ] Real API integration
- [ ] Form data persistence
- [ ] Session management
- [ ] Analytics integration
- [ ] Accessibility audit
- [ ] Performance monitoring

### Technical Debt
- [ ] Complete test coverage
- [ ] Storybook stories for all components
- [ ] API error handling
- [ ] Loading states
- [ ] Offline support

## Contributing Guidelines

### Code Style
- Follow ESLint rules
- Use Prettier for formatting
- TypeScript strict mode
- Meaningful variable names
- Component-level comments for complex logic

### Component Guidelines
1. One component per file
2. Props interface at top
3. Type all props and state
4. Use functional components
5. Hooks before JSX
6. Return JSX at end

### Git Workflow
1. Create feature branch
2. Make atomic commits
3. Write descriptive commit messages
4. Test before committing
5. Request code review

## Resources

- [React Documentation](https://react.dev)
- [Material-UI Docs](https://mui.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)
- [Vite Guide](https://vitejs.dev)

---

Last Updated: 2025-10-16

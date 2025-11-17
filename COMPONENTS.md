# Component Documentation

This document provides a comprehensive overview of all components, their usage, and implementation details.

## Table of Contents
- [Form Components](#form-components)
- [Layout Components](#layout-components)
- [Page Components](#page-components)
- [Theme & Styling](#theme--styling)
- [Validation](#validation)
- [Best Practices](#best-practices)

---

## Form Components

### RHFTextField
**File**: `src/components/form/RHFTextField.tsx`  
**MUI Component**: `TextField`  
**Purpose**: React Hook Form wrapper for text input fields  
**Features**:
- Integrated with React Hook Form
- Error handling and validation messages
- Support for all TextField props (multiline, type, etc.)

### RHFSelect
**File**: `src/components/form/RHFSelect.tsx`  
**MUI Components**: `FormControl`, `InputLabel`, `Select`, `MenuItem`, `FormHelperText`  
**Purpose**: React Hook Form wrapper for select/dropdown fields  
**Features**:
- Integrated with React Hook Form
- Error handling
- Required field support
- Placeholder option support

### RHFRadioGroup
**File**: `src/components/form/RHFRadioGroup.tsx`  
**MUI Components**: `ToggleButtonGroup`, `ToggleButton`, `FormControl`, `FormLabel`, `FormHelperText`  
**Purpose**: React Hook Form wrapper for radio button groups (styled as toggle buttons)  
**Features**:
- Uses ToggleButton instead of traditional radio buttons for modern UI
- Full-width or standard layout
- Primary color fill when selected (via theme)
- Divider lines between options (via theme)
- Error handling
- No inline styling - all styles from theme

**Usage Example**:
```tsx
<RHFRadioGroup
  name="gender"
  label="Gender"
  options={[
    { label: "Male", value: "male" },
    { label: "Female", value: "female" }
  ]}
  required
/>
```

### RadioGroup (Standalone)
**File**: `src/components/form/RadioGroup.tsx`  
**MUI Components**: `FormLabel`, `ToggleButtonGroup`, `ToggleButton`  
**Purpose**: Standalone toggle button group without React Hook Form dependency  
**Features**:
- Same styling as RHFRadioGroup
- For use outside of React Hook Form contexts (e.g., Landing page)
- Controlled component with value and onChange props

**Usage Example**:
```tsx
<RadioGroup
  label="Gender"
  value={gender}
  onChange={setGender}
  options={[
    { label: "Male", value: "male" },
    { label: "Female", value: "female" }
  ]}
/>
```

### RHFCheckbox
**File**: `src/components/form/RHFCheckbox.tsx`  
**MUI Components**: `FormControlLabel`, `Checkbox`  
**Purpose**: React Hook Form wrapper for checkboxes  
**Features**:
- Integrated with React Hook Form
- Single checkbox control

---

## Layout Components

### AppShell
**File**: `src/AppShell.tsx`  
**MUI Components**: `Box`, `Container`  
**Purpose**: Main application layout wrapper  
**Features**:
- Contains Header component
- Provides consistent page structure
- Responsive container

### Header
**File**: `src/components/layout/Header.tsx`  
**MUI Components**: `AppBar`, `Toolbar`, `IconButton`, `Drawer`, `List`, `ListItem`, `ListItemButton`, `Collapse`, `Button`, `Menu`, `MenuItem`, `Typography`, `Stack`  
**Purpose**: Application header with responsive navigation  
**Features**:
- Responsive design (hamburger menu on mobile at <lg, horizontal nav on desktop)
- Association (ABE) and NYL logos with home link
- Rating badges from major agencies (A.M. Best, Fitch, Moody's, S&P)
- Dropdown menu for "Coverage Details" on desktop
- Collapsible mobile drawer navigation
- Max width constraint (1600px) for wide screens
- Resume application dialog
- Consistent spacing and typography

### PageHeader
**File**: `src/components/layout/PageHeader.tsx`  
**MUI Components**: `Box`, `Typography`  
**Purpose**: Page title header  
**Features**:
- Consistent page title styling
- Optional subtitle support

### PageNavigation
**File**: `src/components/layout/PageNavigation.tsx`  
**MUI Components**: `Box`, `Button`  
**Purpose**: Previous/Next navigation buttons  
**Features**:
- Conditional rendering of prev/next buttons
- Integrated with form submission
- Responsive layout

---

## Navigation Components

### ParityBreadcrumb
**File**: `src/components/parity/ParityBreadcrumb.tsx`  
**MUI Components**: `Stepper`, `Step`, `StepLabel`, `MobileStepper`, `Button`  
**Icons**: `KeyboardArrowLeft`, `KeyboardArrowRight`  
**Purpose**: Multi-step form progress indicator  
**Features**:
- Desktop: Full stepper with labels and clickable completed steps
- Mobile: Compact mobile stepper with progress bar
- Shows current step and total steps
- Navigation between steps

---

## UI Components

### PageLoader
**File**: `src/components/common/PageLoader.tsx`  
**MUI Components**: `Backdrop`, `CircularProgress`  
**Purpose**: Loading indicator during page transitions  
**Features**:
- 500ms delay before showing
- Centered spinner overlay

### Card Components
**MUI Components**: `Card`, `CardContent`  
**Usage**: Used throughout forms for section grouping  
**Features**:
- Elevation for depth
- Consistent padding (24px via theme)
- Border radius (12px for cards, 8px for buttons)

---

## Page Components

### Landing
**File**: `src/pages/Landing.tsx`  
**Purpose**: Marketing landing page with hero section and quote form  
**MUI Components Used**:
- `Box`, `Container`, `Stack` - Layout
- `Card`, `CardContent` - Quote form container
- `Typography` - Text content
- `Button` - CTAs
- `TextField` - Form inputs
- `MenuItem` - State dropdown
- `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` - Quote modal
- `Select`, `FormControl`, `InputLabel` - Coverage amount selection
- `IconButton`, `Divider` - Modal UI

**Sections**:
1. **Hero Section**: 
   - Centered text content (title, description, CTA)
   - Hero image (70% width, max 400px height, centered)
   - **Client-specific hero images** loaded from client configuration
   - Scroll-to-quote functionality
   
2. **Quote Form**:
   - Coverage type toggle (Life/Disability)
   - Date of Birth (native date picker)
   - State dropdown (all 50 states + territories)
   - Gender (RadioGroup toggle buttons)
   - Conditional fields based on coverage type:
     - Life: Nicotine use (RadioGroup)
     - Disability: Hours/week, Monthly income (formatted)
   - "See My Quote" button triggers modal

3. **Quote Modal**:
   - 3 life insurance products with rates
   - Coverage amount dropdowns for each product
   - "Begin Application" button navigates to eligibility
   - Products: 10-Year Term, 20-Year Term, Whole Life

4. **About Coverage Section**: Information cards
5. **Why Choose Section**: Benefits with checkmarks
6. **How It Works Section**: 4-step process with icons

**State Management**: 
- Local React state (no React Hook Form)
- Managed coverage selections for quote modal

**Icons Used**:
- `Security`, `CheckCircle`, `ArrowRightAlt`, `Close`

---

### Eligibility
**File**: `src/pages/Eligibility.tsx`  
**Purpose**: Multi-step eligibility and application form
**MUI Components Used**:
- `Card`, `CardContent` - Section containers
- `Stack` - Layout and spacing
- `Typography` - Text and headings
- `FormGroup`, `FormControlLabel`, `Checkbox` - Coverage selection
- `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` - Ineligibility modal
- `Button` - Actions (Add Child, Remove, etc.)
- `Box` - Container elements
- `Alert` - Information messages

**Icons Used**:
- `BlockOutlined` - Membership section
- `SmokingRooms` - Tobacco use sections
- `Work` - DI (Disability Insurance) section
- `Business` - OO (Overhead Expense) section
- `People` - Spouse section
- `ChildFriendly` - Child section

**Form Features**:
- React Hook Form with Zod validation
- Collapsible sections (CollapsibleSection component)
- Dynamic fields (children array with add/remove)
- Conditional rendering based on selections
- Native date pickers for all birthday fields
- Currency and percentage formatting
- Ineligibility detection with modal

**Form Libraries**:
- React Hook Form: `useForm`, `Controller`, `useWatch`, `FormProvider`
- Zod: Schema validation with `zodResolver`

---

## Icons

All icons are from `@mui/icons-material`:

| Icon | Usage | Location |
|------|-------|----------|
| `BlockOutlined` | Membership verification | Eligibility page |
| `SmokingRooms` | Tobacco use sections | Eligibility page (Self & Spouse) |
| `Work` | Disability Insurance (DI) | Eligibility page (Self & Spouse) |
| `Business` | Overhead Expense (OO) | Eligibility page (Self) |
| `People` | Spouse section | Eligibility page |
| `ChildFriendly` | Child section | Eligibility page |
| `MenuIcon` | Mobile menu toggle | Header |
| `ExpandMore` / `ExpandLess` | Collapsible sections | Header mobile menu |
| `KeyboardArrowLeft` / `KeyboardArrowRight` | Navigation | Mobile stepper |

---

## Theme Configuration

### Colors
**File**: `src/theme/muiTheme.ts`

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Main | `#0e7490` | Buttons, selected states, icons |
| Primary Light | `#0891b2` | Hover states |
| Primary Dark | `#155e75` | Active states |
| Secondary Main | `#0369a1` | Secondary actions |
| Secondary Light | `#0284c7` | Secondary hover |
| Secondary Dark | `#075985` | Secondary active |
| Background Default | `#f3f4f6` | Page background |
| Background Paper | `#FFFFFF` | Card/form backgrounds |
| Error | `#ef4444` | Validation errors |
| Success | `#10b981` | Success messages |
| Warning | `#f59e0b` | Warning messages |

### Component Overrides
**File**: `src/theme/components.ts`

- **MuiButton**: 8px border radius, 600 font weight
- **MuiCard**: 12px border radius
- **MuiCardContent**: 24px padding
- **MuiInputLabel**: Red asterisk (#D32F2F) for required fields
- **MuiFormLabel**: Red asterisk (#D32F2F) for required fields
- **MuiContainer**: "md" max width, responsive padding
- **MuiToolbar**: Gap spacing (8px)
- **MuiToggleButton**: Primary color fill when selected, white contrast text
- **MuiToggleButtonGroup**: Proper border handling for divider lines
- **MuiTypography**: Respects color prop via ownerState check
- **MuiAppBar**: White background with bottom border
- **MuiLink**: No underline by default, underline on hover

### Typography
- **Font Family**: InterVariable, Inter, system-ui
- **Headings**: 600 font weight
- **Button**: No text transform, 600 font weight
- **Base Size**: 16px (1rem)

### Shape
- **Border Radius**: 8px (buttons, inputs)
- **Card Border Radius**: 12px
- **Spacing Unit**: 8px

---

## Form Validation

### Zod Schema
**File**: `src/validation/eligibility.ts`  
**Schema**: `EligibilitySchema`

**Validation Features**:
- Email validation with regex
- Date validation (MM/DD/YYYY format)
- Conditional validation using `superRefine`
- Array validation for children
- Required field enforcement based on selections

**Validated Fields**:
- Member personal information
- Spouse personal information (when selected)
- Children information (dynamic array, when selected)
- Coverage selections
- Tobacco use and products
- DI income and hours
- OO expenses and responsibility percentage

---

## Responsive Breakpoints

Material-UI default breakpoints are used:
- **xs**: 0px (mobile)
- **sm**: 600px (tablet)
- **md**: 900px (small desktop)
- **lg**: 1200px (desktop)
- **xl**: 1536px (large desktop)

### Responsive Patterns Used
- Stack direction changes: `{ xs: "column", sm: "row" }`
- Conditional rendering based on `useMediaQuery(theme.breakpoints.down('md'))`
- Mobile stepper vs desktop stepper
- Hamburger menu vs horizontal navigation
- Responsive padding and spacing

---

## State Management

### React Hook Form
- Form state management
- Validation integration
- Controlled components via `Controller`
- Watching field values with `useWatch`
- Dynamic field arrays for children

### React Hooks Used
- `useState` - Local component state
- `useEffect` - Side effects (membership check, default child)
- `useNavigate` - Routing
- `useLocation` - Current route info
- `useTheme` - Access theme values
- `useMediaQuery` - Responsive breakpoints

---

## File Structure

```
src/
├── components/
│   ├── common/
│   │   └── PageLoader.tsx
│   ├── form/
│   │   ├── RHFCheckbox.tsx
│   │   ├── RHFRadioGroup.tsx
│   │   ├── RHFSelect.tsx
│   │   └── RHFTextField.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── PageHeader.tsx
│   │   └── PageNavigation.tsx
│   └── parity/
│       └── ParityBreadcrumb.tsx
├── pages/
│   └── Eligibility.tsx
├── theme/
│   ├── components.ts
│   └── muiTheme.ts
├── validation/
│   └── eligibility.ts
└── hooks/
    └── useScrollToFirstError.ts
```

---

## Dependencies

### Core Libraries
- **React**: ^18.3.1
- **React Router DOM**: ^7.1.1
- **Material-UI (MUI)**: ^7.3.2
  - @mui/material
  - @mui/icons-material
  - @emotion/react
  - @emotion/styled

### Form Libraries
- **React Hook Form**: ^7.63.0
- **Zod**: ^4.1.11
- **@hookform/resolvers**: ^3.10.0

### Build Tools
- **Vite**: ^6.0.11
- **TypeScript**: ~5.8.0

---

## Best Practices

1. **Component Reusability**: All form components are wrapped for React Hook Form integration
2. **Consistent Styling**: Theme-based styling with minimal inline styles
3. **Responsive Design**: Mobile-first approach with breakpoint-specific rendering
4. **Accessibility**: Proper ARIA labels, error messages, and required field indicators
5. **Type Safety**: TypeScript for all components and validation schemas
6. **Validation**: Client-side validation with Zod schemas
7. **Code Organization**: Separation of concerns (components, pages, theme, validation)

---

## Recent Updates & Changes

### Date Pickers
- **Changed**: All birthday fields now use native HTML5 date pickers (`type="date"`)
- **Removed**: Custom MM/DD/YYYY formatting with Controller wrapper
- **Benefits**: Better mobile UX, built-in validation, calendar picker
- **Implementation**: `<RHFTextField type="date" InputLabelProps={{ shrink: true }} />`
- **Pages Updated**: Eligibility (self, spouse, children birthdays), Landing quote form

### Toggle Button Styling
- **Centralized**: All ToggleButton styling moved to theme
- **Removed**: Inline `sx` props from components
- **Current**: Primary color fill when selected, default MUI borders/dividers
- **Components**: RHFRadioGroup, RadioGroup (standalone)

### Component Refactoring
- **Created**: RadioGroup standalone component for non-form contexts
- **Updated**: Landing page uses RadioGroup instead of inline ToggleButtonGroup
- **Consistency**: Both RHFRadioGroup and RadioGroup use identical theme styling

### Header Updates
- **Added**: Max width constraint (1600px) for wide screens
- **Updated**: Rating badges with consistent sizing (minWidth 85px)
- **Changed**: Mobile breakpoint to `down('lg')` for earlier hamburger menu
- **Spacing**: Removed left margin from rating badges

---

## Notes

- All form fields use the default "medium" size (no size="small" overrides)
- Toggle buttons are used instead of traditional radio buttons for better UX
- Required fields show red asterisks via theme configuration
- Date fields use native HTML5 date pickers (not custom formatting)
- Currency and percentage inputs have auto-formatting
- Child section dynamically manages array of children with add/remove functionality
- All component styling should be defined in theme, not inline
- "Date of Birth" label is used consistently (not "Birthday")
- Landing page and Eligibility forms use matching field components and styling

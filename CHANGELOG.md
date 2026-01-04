# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Quote modal on Landing page with 3 life insurance products
- Native HTML5 date pickers for all birthday fields
- RadioGroup standalone component for non-form contexts
- Comprehensive project documentation (README.md, COMPONENTS.md, ARCHITECTURE.md)
- Index files for better component imports (`src/components/index.ts`, `src/components/form/index.ts`, etc.)
- CHANGELOG.md for tracking project changes

### Changed
- **BREAKING**: All birthday fields now use `type="date"` instead of custom MM/DD/YYYY text formatting
- Centralized all ToggleButton styling in theme configuration
- Removed all inline `sx` styles from RHFRadioGroup and RadioGroup components
- Updated all "Birthday" labels to "Date of Birth" for consistency
- Header now has max-width constraint (1600px) for wide screens
- Landing page Gender field now uses RadioGroup toggle buttons (matches Eligibility)
- Mobile header breakpoint changed to `down('lg')` for earlier hamburger menu

### Fixed
- Typography color override now properly respects `color` prop via ownerState check
- ToggleButton divider lines now show correctly between options
- Form field consistency between Landing and Eligibility pages

### Removed
- Unused Vite boilerplate CSS files (App.css, index.css)
- Inline styling from form components (moved to theme)
- Custom MM/DD/YYYY date formatting logic (replaced with native date picker)

## [0.0.0] - 2025-10-16

### Added
- Initial project setup with React 18, TypeScript, Material-UI 7, and Vite
- Multi-step eligibility form with React Hook Form and Zod validation
- Landing page with hero section and quote form
- Responsive header with navigation
- Theme configuration with custom colors and component overrides
- Form components (RHFTextField, RHFSelect, RHFRadioGroup, RHFCheckbox)
- Layout components (Header, PageHeader, PageNavigation)
- Page components (Landing, Eligibility, Coverage, Profile, Contact, Payment, Preview, Receipt)
- Storybook setup for component development
- MSW setup for API mocking
- ESLint and Prettier configuration

[Unreleased]: https://github.com/your-org/nyl-mdv2-proto/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/your-org/nyl-mdv2-proto/releases/tag/v0.0.0

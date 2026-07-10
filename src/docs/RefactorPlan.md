# Refactor Plan

## Goal

Refactor the prototype so it is easier to understand as a design and development reference.

This project is not intended to become the production application. It should document the template design, reusable UI patterns, content/copy, page flow, and interaction states clearly enough for developers to translate the design into production.

The refactor should make the project feel like a reusable application template, not a one-off project organized around specific pages or business areas.

## Main priorities

1. Add Storybook documentation for the design system, reusable components, page patterns, and copy.
2. Keep the existing prototype working while refactoring incrementally.
3. Organize components by UI purpose, not by business area or page name.
4. Keep route-level pages simple and focused on composition.
5. Reduce repeated custom styling where it creates confusion.
6. Keep config, content, and UI responsibilities clearly separated.
7. Make the folder structure easy for developers to understand.

## Core organizing principle

The source structure should be generic enough to make sense in any React/MUI project.

Do not organize reusable components around project-specific page names or business concepts.

Avoid component folders like:

```text
components/
  coverage/
  eligibility/
  membership/
  profile/
  payment/
```

Use generic UI pattern folders instead:

```text
components/
  common/
  layout/
  navigation/
  forms/
  feedback/
  overlays/
  content/
```

## Target source structure

```text
src/
  app/
    App.tsx
    router.tsx
    theme.ts
    providers/

  components/
    common/
      Small reusable building blocks and generic UI primitives.

    layout/
      Page structure, containers, cards, sections, panels, and layout wrappers.

    navigation/
      Header, footer, stepper, breadcrumbs, page navigation, and action navigation.

    forms/
      Field rendering, field groups, form sections, option rows, dynamic lists, and conditional groups.

    feedback/
      Alerts, validation messages, success messages, error summaries, badges, empty states, and loading states.

    overlays/
      Dialogs, modals, drawers, popovers, summaries, previews, and calculators.

    content/
      Reusable content display patterns, help blocks, notes, disclosures, and informational sections.

  pages/
    Route-level screens only.

  config/
    Page definitions, field definitions, flow configuration, rules, product/application configuration, and mock data.

  content/
    Default copy, client-specific overrides, page text, helper text, labels, alerts, and help content.

  utils/
    Shared formatting, rules helpers, data helpers, and transformation logic.

  dev/
    Prototype-only helpers, mock tools, and development utilities.

  docs/
    Storybook documentation and refactor planning.
```

## Pages

Pages are route-level screens only.

A page should compose reusable components, config, and content. A page should not define reusable UI patterns.

Pages can:

- Load page-level config.
- Pull in page-level content.
- Compose shared layout, form, feedback, navigation, overlay, and content components.
- Handle route-level behavior.
- Pass data into reusable components.

Pages should avoid:

- Owning reusable visual patterns.
- Containing repeated styling that appears elsewhere.
- Hardcoding copy that belongs in `src/content`.
- Hardcoding field definitions that belong in `src/config`.
- Becoming a folder for page-specific reusable components.

Example page role:

```tsx
<Page>
  <PageHeader />
  <FormSection />
  <FieldRenderer />
  <ActionFooter />
</Page>
```

The page decides what appears. Shared components decide how reusable UI patterns look and behave.

## Components

Components should be organized by UI purpose, not by business flow or page name.

A component belongs in `src/components` when it represents a reusable UI pattern or a pattern that developers should understand for the template.

Examples of reusable components:

- Page shell
- Page header
- Page card
- Section container
- Form section
- Field renderer
- Field group
- Option row
- Dynamic list
- Conditional group
- Alert
- Badge
- Info panel
- Help block
- Dialog
- Drawer
- Summary panel
- Action footer

## Component folders

### `components/common`

Use for small, generic primitives that can be reused anywhere.

Examples:

- Icon wrapper
- Visually hidden text
- Generic utility display component
- Reusable wrapper with no specific layout meaning

### `components/layout`

Use for structural UI and page composition patterns.

Examples:

- `Page`
- `PageHeader`
- `PageSection`
- `PageCard`
- `SectionBanner`
- `Panel`
- `SummaryPanel`
- `ActionFooter`

### `components/navigation`

Use for movement through the application.

Examples:

- Header
- Footer
- Stepper
- Breadcrumbs
- Page navigation
- Back/next controls

### `components/forms`

Use for reusable form patterns.

Examples:

- Field renderer
- Field group
- Form section
- Applicant section
- Option row
- Dynamic list
- Conditional group
- Searchable select
- Checkbox group
- Radio group

### `components/feedback`

Use for status, validation, and user feedback.

Examples:

- Alert
- Success message
- Error message
- Error summary
- Validation message
- Info banner
- Status badge
- Empty state
- Loading state

### `components/overlays`

Use for UI that appears above or outside the main page flow.

Examples:

- Dialog
- Modal
- Drawer
- Popover
- Application summary
- Cost estimate
- Document preview
- Calculator

### `components/content`

Use for reusable content display patterns.

Examples:

- Help block
- Note panel
- Info panel
- Disclosure text
- Product information display
- Review summary display
- Supporting text block

## Config vs. content vs. components

### Config

Config describes structure, options, rules, and behavior.

Examples:

- Page definitions
- Step definitions
- Field definitions
- Conditional display rules
- Form flow
- Product/application options
- Client setup
- Mock data
- Mock rates

### Content

Content contains user-facing words.

Examples:

- Page titles
- Page subheads
- Button labels
- Field labels
- Helper text
- Alert text
- Error text
- Help text
- Note text
- Disclosure text
- Footer copy
- Client-specific copy overrides

### Components

Components render reusable UI patterns.

Components should receive data, config, and content through props or shared helpers. They should avoid owning business-specific copy or rules unless that behavior is part of the generic UI pattern.

## Styling refactor rules

Do not remove all `sx`.

Material UI supports `sx`, and it is acceptable for local layout adjustments.

Refactor styling when:

- The same style block appears in multiple places.
- A visual pattern is repeated across components.
- A color is hardcoded instead of using the theme.
- A border radius, background, or spacing pattern is repeated.
- The styling makes the component harder to understand.
- The same component state is styled in multiple places.

Keep `sx` when:

- It is a simple one-off layout adjustment.
- It is only used once.
- Moving it would make the component harder to read.
- The style is specific to a local layout need.

## Likely shared patterns to extract

Only create these when the repeated pattern is confirmed in the existing code.

Potential shared components:

- `Page`
- `PageHeader`
- `PageCard`
- `PageSection`
- `SectionBanner`
- `Panel`
- `InfoPanel`
- `NotePanel`
- `SelectableSurface`
- `StatusBadge`
- `SummaryPanel`
- `ActionFooter`
- `EmptyState`

Do not create folders or components just to make the structure look complete. Extract only when it improves clarity.

## Storybook documentation plan

Storybook should document the reusable template system, not every file.

Recommended Storybook sections:

```text
Project
  Overview
  Refactor Plan

Foundations
  Theme
  Typography
  Colors
  Spacing and Surfaces

Layout Patterns
  Page
  Page Header
  Page Card
  Page Section
  Panel
  Section Banner
  Action Footer
  Summary Panel

Navigation Patterns
  Header
  Footer
  Stepper
  Breadcrumbs
  Page Navigation

Form Patterns
  Field Renderer
  Field Group
  Form Section
  Option Row
  Dynamic List
  Conditional Group
  Searchable Select
  Checkbox Group
  Radio Group

Feedback Patterns
  Alert
  Success Message
  Error Summary
  Validation Message
  Info Banner
  Status Badge
  Empty State
  Loading State

Overlay Patterns
  Dialog
  Drawer
  Popover
  Application Summary
  Cost Estimate
  Document Preview
  Calculator

Content Patterns
  Help Block
  Info Panel
  Note Panel
  Disclosure Text
  Product Information
  Review Summary

Content Inventory
  Page Titles and Subheads
  Navigation Labels
  Button Labels
  Alerts and Helper Text
  Help Content
  Client Overrides

Page Flow
  Application Flow Overview
  Step Structure
  Conditional Routing
  Review and Submit Flow
```

## Storybook rules

Storybook should:

- Show reusable components in isolation.
- Show important component states and variants.
- Document shared layout and form patterns.
- Render copy from the actual content files when possible.
- Help developers understand what is reusable.
- Help developers understand what is prototype-only.

Storybook should not:

- Duplicate copy manually when it already exists in `src/content`.
- Document every tiny file.
- Become a second version of the application.
- Organize documentation around business areas unless documenting the overall page flow.

## Refactor sequence

### Step 1: Storybook setup

Status: started.

- Install Storybook.
- Connect Storybook to the app theme.
- Remove default Storybook demo stories.
- Add project overview documentation.

### Step 2: Refactor documentation

Before changing components, document the intended structure.

- Add this refactor plan.
- Add the refactor plan to Storybook.
- Add a current component inventory.
- Add a current content/copy inventory.

### Step 3: Current inventory

Document what exists before moving files.

Inventory should include:

- Existing component folders
- Existing page files
- Existing config files
- Existing content files
- Components that appear reusable
- Styling patterns that appear repeated
- Copy/content locations

### Step 4: Folder cleanup

Move files only when the destination is obvious.

Recommended process:

1. Identify reusable components.
2. Assign each component to a generic UI pattern folder.
3. Move only a few files at a time.
4. Update imports.
5. Run the app.
6. Run Storybook.
7. Commit.

Do not move components into business-specific folders.

### Step 5: Styling cleanup

Review repeated styling patterns.

Start with:

- Section headers
- Page cards/panels
- Option rows
- Info/alert blocks
- Summary panels
- Footer/action areas

Extract shared components only when the same visual pattern is repeated and has a clear reusable purpose.

### Step 6: Add component stories

After the structure is clearer, add Storybook stories for reusable components.

Start with stable generic patterns first:

- Page
- Page header
- Page card
- Form section
- Field renderer
- Option row
- Dynamic list
- Conditional group
- Alert
- Info panel

### Step 7: Add copy documentation

Use the existing `src/content` files as the source of truth.

Document:

- Page titles
- Subheads
- Button labels
- Field labels
- Helper text
- Alert text
- Help content
- Client-specific overrides

### Step 8: Add page flow documentation

Document the overall application flow after reusable components and copy are documented.

Page flow documentation should explain:

- What each step does
- What config/content drives each step
- What conditional behavior exists
- What reusable components are used
- What is important for dev handoff

## Commit strategy

Use small commits.

Recommended commits:

```text
chore: add storybook
docs: add storybook project overview
docs: add refactor plan
docs: add component inventory
docs: add content inventory
refactor: organize layout components
refactor: organize form components
refactor: organize feedback components
refactor: extract shared section banner
refactor: extract selectable surface
docs: add layout pattern stories
docs: add form pattern stories
docs: add content inventory stories
```

## Definition of done

The refactor is successful when:

- Storybook runs locally.
- The prototype still runs locally.
- Developers can understand the template structure from Storybook.
- Reusable components are organized by generic UI purpose.
- Components are not organized by business area.
- Route-level pages remain focused on composition.
- Reusable components are documented.
- Page patterns are documented.
- User-facing copy is easy to find.
- Client-specific overrides are clear.
- Config, content, and component responsibilities are clear.
- Repeated styling is reduced where practical.

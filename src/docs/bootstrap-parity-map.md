# Bootstrap → Material v2 Parity Map

> Goal: replicate current site behavior/structure with MUI v5 (MDv2) without inventing new components. When in doubt, behavior parity > visual parity.

## Layout & Grid
- **Bootstrap**: Container, Row, Col (12-col), 24px gutters (≈ 1.5rem).
- **MUI**: `Container`, `Grid` (12-col). Use `Container maxWidth="lg"` and `Grid spacing={3}` (3 * 8px = 24px) for Bootstrap-like gutters.

## Navigation
- **Navbar** → `AppBar + Toolbar` (keep actions/layout identical to current site).
- **Breadcrumb** → `Breadcrumbs` (for simple trail) **or** Step display → `Stepper` (numeric/current/completed).
  - We use a small wrapper `ParityBreadcrumb` so we can show either trail or numbered steps with the same props.

## Content
- **Card** → `Card`, `CardHeader`, `CardContent`, `CardActions`.
- **Accordion/Collapse** → `Accordion` / `Collapse`.
- **Tabs** → `Tabs`, `Tab`.

## Forms
- **FormGroup/FormControl/InputGroup** → `TextField`, `Select`, `FormControl`, `FormLabel`, `FormHelperText`, adornments via `InputAdornment`.
- **Checkbox/Radio/Switch** → MUI equivalents; group with `RadioGroup`, `FormGroup`.
- **Validation** → React Hook Form + Zod (error text maps to `helperText` and `error`).

## Feedback
- **Alert** → `Alert` (inline) and **Toast** → `Snackbar` + `Alert`.
  - Wrapper `ParitySnackbar` unifies both “toast” and inline semantics.

## Overlays
- **Modal** → `Dialog` (focus trap, ARIA). Wrapper `ParityDialog` standardizes title/actions.

## Misc
- **Dropdown** → `Menu` (anchor on button).
- **Tooltip** → `Tooltip`.
- **Spinner** → `CircularProgress`.
- **Table** → `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`.
- **Pagination** → `Pagination`.

### Layout notes
- Spacing scale: use `theme.spacing(1) = 8px`; Bootstrap-like gutters = `spacing={3}`.
- Keep container widths similar: `maxWidth="lg"` (adjust per page if needed).
- Button density: Bootstrap default ≈ MUI `size="medium"`; avoid text-transform changes (already set in theme).

### A11y notes
- Dialogs must have `aria-labelledby` and focus trap (MUI handles this).
- Keyboard order matches DOM; ensure actionable elements in predictable order.
- Error messaging: associate `id` from `TextField` with helper text via `aria-describedby` (MUI does this automatically when using `helperText`).


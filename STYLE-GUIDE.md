# Style System Quick Reference

## Common Styles Import
```tsx
import { commonStyles } from '../../theme/commonStyles';
```

## Quick Reference

### Spacing
```tsx
// Margins
<Box sx={commonStyles.marginBottom}>        // mb: 1
<Box sx={commonStyles.marginBottom2}>       // mb: 2
<Box sx={commonStyles.marginBottom3}>       // mb: 3
<Box sx={commonStyles.noVerticalMargin}>    // my: 0

// Padding
<Box sx={commonStyles.paddingTop3}>         // pt: 3
```

### Layout
```tsx
// Flex Patterns
<Box sx={commonStyles.flexCenter}>          // Centered flex
<Box sx={commonStyles.flexRow}>             // Horizontal flex with gap
<Box sx={commonStyles.flexColumn}>          // Vertical flex with gap
<Box sx={commonStyles.flexGrow}>            // flex: 1

// Width
<Box sx={commonStyles.fullWidth}>           // width: 100%
```

### Typography
```tsx
<Typography sx={commonStyles.fontWeightBold}>    // fontWeight: 600
<Typography sx={commonStyles.textCenter}>        // textAlign: center
<Typography sx={commonStyles.maxWidthText}>      // maxWidth: 60ch + center
```

### Containers
```tsx
// Paper Box (padded, shadowed, rounded)
<Box sx={commonStyles.paperBox}>

// Bordered Box (border, padding, rounded)
<Box sx={commonStyles.borderedBox}>

// Footer
<Box sx={commonStyles.footer}>
```

### Combining Styles
```tsx
// Spread commonStyles with additional props
<Box sx={{
  ...commonStyles.borderedBox,
  bgcolor: 'grey.50',
  '& .MuiTextField-root': {
    bgcolor: 'background.paper'
  }
}}>
```

### Icons & Images
```tsx
<Box component="img" src="/logo.png" sx={commonStyles.logo} />
```

### Interactive
```tsx
<Stack sx={commonStyles.cursorPointer} onClick={handleClick}>
```

### Lists
```tsx
<ListItemButton sx={commonStyles.nestedListItem}>  // pl: 4
<Divider sx={commonStyles.dividerSpacing}>         // my: 1
```

## Theme Component Overrides

These are automatically applied - no need for sx props:

- **MuiAppBar**: Has bgcolor and border by default
- **MuiToolbar**: Has gap: 2 spacing
- **MuiDivider**: Border color from theme
- **MuiLink**: No underline by default, underline on hover
- **MuiListSubheader**: Styled with primary color and bold font
- **MuiCardContent**: Consistent 24px padding
- **MuiButton**: 8px border radius, 600 font weight

## When to Use What

### Use Theme Components When:
- Style applies to ALL instances of a component
- Part of the design system's global rules
- Affects component's default appearance

### Use Common Styles When:
- Pattern is reused 3+ times
- Simple, single-purpose utilities
- Not context-specific

### Use Inline sx When:
- Style is unique to one component
- Depends on component state/props
- Uses complex responsive breakpoints
- Needs theme palette colors
- Targets nested components

## Examples

### ❌ Before (Hard-coded)
```tsx
<Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1.5, boxShadow: 2 }}>
  <Typography sx={{ mb: 2, fontWeight: 600 }}>Title</Typography>
  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
    <Icon color="primary" />
    <Typography sx={{ fontWeight: 600 }}>Section</Typography>
  </Stack>
</Box>
```

### ✅ After (Refactored)
```tsx
<Box sx={commonStyles.paperBox}>
  <Typography sx={{ ...commonStyles.marginBottom2, ...commonStyles.fontWeightBold }}>
    Title
  </Typography>
  <Stack direction="row" spacing={1} alignItems="center" sx={commonStyles.marginBottom}>
    <Icon color="primary" />
    <Typography sx={commonStyles.fontWeightBold}>Section</Typography>
  </Stack>
</Box>
```

### ✅ Even Better (Combined)
```tsx
<Box sx={commonStyles.paperBox}>
  <Typography variant="h6" sx={commonStyles.marginBottom2}>Title</Typography>
  <Stack direction="row" spacing={1} alignItems="center" sx={commonStyles.marginBottom}>
    <Icon color="primary" />
    <Typography variant="subtitle1">Section</Typography>  {/* h6 & subtitle1 are bold by default */}
  </Stack>
</Box>
```

## Adding New Common Styles

When you find a pattern repeated 3+ times:

1. Add it to `src/theme/commonStyles.ts`
2. Follow the naming convention: `{property}{Value}` or `{purpose}`
3. Add JSDoc comment describing usage
4. Group with similar utilities

```tsx
export const commonStyles = {
  // ... existing styles ...
  
  // New utility
  marginTop6: {
    mt: 6
  } as SxProps<Theme>,
};
```

## Testing Checklist

After refactoring styles:

- [ ] Visual appearance unchanged
- [ ] Responsive behavior maintained
- [ ] Hover/focus states work
- [ ] Theme colors apply correctly
- [ ] No console errors
- [ ] Accessibility attributes preserved

# Refactoring Summary - January 4, 2026

## Changes Implemented

### 1. Dynamic Product File Loading

**File:** `src/api/client.ts`

**Before:** All product files were manually imported and mapped in a static object

```typescript
import productsAma from "../data/fixtures/products-ama.json";
// ... 7 more imports
const PRODUCT_FILES: Record<string, Product[]> = {
  'products-ama': productsAma,
  // ... manual mapping
};
```

**After:** Dynamic import system that loads files as needed

```typescript
async function loadProductFile(fileName: string): Promise<Product[]> {
  const module = await import(`../data/fixtures/${fileName}.json`);
  return module.default as Product[];
}
```

**Benefits:**

- No need to update imports when adding new clients
- Smaller initial bundle size (lazy loading)
- Cleaner, more maintainable code
- Automatic fallback to standard products file

### 2. Centralized Coverage Category Labels

**File:** `src/constants/coverage.ts` (NEW)

**Before:** Category labels duplicated in multiple components

- Header.tsx had its own `categoryNames` object
- Other components might define their own labels

**After:** Single source of truth for coverage category labels

```typescript
export const COVERAGE_CATEGORY_LABELS: Record<CoverageCategory, string> = {
  LI: "Life Insurance",
  DI: "Disability Insurance",
  OO: "Overhead Expense",
  SH: "Supplemental Health",
};
```

**Updated Files:**

- `src/components/layout/Header.tsx` - Now imports from constants

**Benefits:**

- Consistency across the application
- Easy to update labels in one place
- Type-safe with TypeScript
- Includes utility function `getCoverageLabel()`

### 3. Improved Error Handling

**File:** `src/api/client.ts`

**Before:** Hardcoded fallback products that didn't match real data structure

**After:** Falls back to the standard products.json file

- More reliable fallback
- Consistent product structure
- Better error logging

## Recommendations for Future Refactoring

### High Priority

1. **Remove Duplicate Product Files**
   - Delete `/public/data/fixtures/products-*.json` files
   - Only `/src/data/fixtures/` is used
   - Reduces confusion and maintenance burden

2. **Type-Safe Product File Names**
   - Create a union type for valid product file names
   - Prevents typos in client configs

   ```typescript
   type ProductFileName = 'products' | 'products-ama' | 'products-calbar' | ...;
   ```

3. **Consolidate Coverage Icons**
   - Currently in `utils/coverageIcons.tsx`
   - Should move to `constants/coverage.ts` for consistency

### Medium Priority

4. **Client Config Validation**
   - Add runtime validation for client configurations
   - Ensure required fields are present
   - Validate productsFile references exist

5. **Product Schema Validation**
   - Add JSON schema or Zod validation for product data
   - Ensures all product files have consistent structure
   - Catches errors at build time

6. **Memoization Optimization**
   - `getProducts()` is called multiple times
   - Consider caching results at the app level
   - Use React Query or similar for data fetching

### Low Priority

7. **Extract Magic Strings**
   - URL parameter names ('client')
   - Session storage keys
   - Move to a constants file

8. **Component Splitting**
   - Header.tsx is 300+ lines
   - Split into CoverageMenu, MobileMenu, etc.

9. **CSS-in-JS Migration**
   - Consider migrating from sx props to styled components
   - Better performance and type safety

## Files Modified

- ✅ `src/api/client.ts` - Dynamic imports
- ✅ `src/constants/coverage.ts` - NEW file
- ✅ `src/components/layout/Header.tsx` - Use centralized constants

## Testing Checklist

- [ ] Test product loading for all clients (ABE, AMA, AVMA, CALBAR, WAEPA, IEEE, NAR)
- [ ] Verify fallback behavior when product file doesn't exist
- [ ] Check coverage labels display correctly in header dropdown
- [ ] Ensure no regression in existing functionality
- [ ] Test mobile menu coverage section

## Performance Impact

**Positive:**

- Smaller initial bundle (lazy loading of product files)
- Reduced code duplication
- Faster build times (fewer static imports)

**Neutral:**

- First product load slightly slower due to dynamic import (negligible)
- Overall performance maintained or improved

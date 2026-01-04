# Client Configuration System

This document explains how to configure the application for different clients (ABE, NYL, etc.).

## Quick Start

### Change Active Client

**Option 1: URL Parameter (Easiest for Testing)**

Add `?client=abe` to any URL:
```
http://localhost:5173/?client=abe
http://localhost:5173/?client=nyl
http://localhost:5173/?client=ama
http://localhost:5173/?client=default
```

- ✅ No restart needed
- ✅ Persists across navigation (uses session storage)
- ✅ Perfect for demos and testing
- ✅ Can use the ClientSwitcher component for easy switching

**Option 2: Environment Variable (Recommended for Development)**

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set the client:
   ```env
   VITE_CLIENT_ID=abe    # or 'nyl' or 'default'
   ```

3. Restart the dev server:
   ```bash
   npm run dev
   ```

**Option 3: Direct Configuration (Not Recommended)**

Edit `src/config/clients.ts` and change the fallback:
```typescript
export const ACTIVE_CLIENT_ID: ClientId = 'abe'; // or 'nyl' or 'default'
```

### Client Selection Priority

The system checks for the client in this order:
1. **URL parameter** (?client=abe) - Highest priority
2. **Session storage** (persists URL selection)
3. **Environment variable** (VITE_CLIENT_ID)
4. **Default fallback** ('abe')

## What Changes per Client?

### Currently Supported

#### 1. **Branding**
- Primary logo
- Partner logo (optional)
- Hero image (landing page)
- Logo alt text
- Organization name
- Support phone number
- Phone hours (optional)
- Schedule call URL (optional)

#### 2. **Theme Colors**
- Primary color (main, light, dark)
- Secondary color (main, light, dark)
- Automatically applies throughout the app

#### 3. **Features**
- Show/hide partner logo
- Show/hide rating badges
- Enable/disable insurance types
- Show/hide coverage details dropdown

#### 4. **Hero Images**
- Client-specific hero images on landing page
- Automatic fallback to default image

#### 5. **Contact Information**
- Client-specific phone numbers in top banner
- Optional phone hours display
- Optional "Schedule a Call" link

### Coming Soon
- Field labels customization
- Field visibility per client
- Custom validation rules
- Client-specific content

## Client Configurations

### ABE (American Bar Endowment)
```typescript
VITE_CLIENT_ID=abe
```
- **Colors**: Cyan/Teal (#0e7490)
- **Logos**: ABE + NYL partner logo
- **Phone**: (800) 621-8981
- **Features**: All enabled

### NYL (New York Life)
```typescript
VITE_CLIENT_ID=nyl
```
- **Colors**: NYL Blue (#056db9)
- **Logos**: NYL only (no partner)
- **Phone**: (800) 621-8981
- **Features**: All enabled

### AMA (American Medical Association)
```typescript
VITE_CLIENT_ID=ama
```
- **Colors**: AMA Blue (#003d79)
- **Logos**: AMA + NYL partner logo
- **Phone**: 888-627-5902 (M-F 8:00am-5:00pm CT)
- **Schedule Call**: Available
- **Features**: All enabled

### Default
```typescript
VITE_CLIENT_ID=default
```
- **Colors**: NYL Blue (#056db9) - Same as NYL
- **Logos**: NYL logo
- **Features**: All enabled
- **Note**: Default configuration uses NYL branding

## Adding a New Client

1. **Add brand assets** to `public/brand/[client-name]/`:
   ```
   public/brand/
   └── newclient/
       ├── logo.png
       └── hero.png
   ```

2. **Update `src/config/clients.ts`**:

```typescript
// Add to ClientId type
export type ClientId = 'abe' | 'nyl' | 'ama' | 'newclient' | 'default';

// Add configuration
export const CLIENT_CONFIGS: Record<ClientId, ClientConfig> = {
  // ... existing configs
  
  newclient: {
    id: 'newclient',
    branding: {
      name: 'New Client Name',
      logo: '/brand/newclient/logo.png',
      logoAlt: 'New Client Logo',
      heroImage: '/brand/newclient/hero.png',
      heroImageAlt: 'New Client Hero',
    },
    theme: {
      primaryColor: '#YOUR_BRAND_COLOR',
      primaryLight: '#LIGHTER_SHADE',
      primaryDark: '#DARKER_SHADE',
    },
    features: {
      showPartnerLogo: false,
      showRatingBadges: true,
      enableDisabilityInsurance: true,
      enableLifeInsurance: true,
    },
  },
};
```

3. **Set as active**:
   ```env
   VITE_CLIENT_ID=newclient
   ```

## Using Client Config in Components

### Import Functions
```typescript
import { getClientBranding, getClientFeatures } from '@/config/clients';

const branding = getClientBranding();
const features = getClientFeatures();
```

### Use React Hooks
```typescript
import { useClientBranding, useFeature } from '@/hooks/useClientConfig';

function MyComponent() {
  const branding = useClientBranding();
  const showRatings = useFeature('showRatingBadges');
  
  return (
    <div>
      <img src={branding.logo} alt={branding.logoAlt} />
      {showRatings && <RatingBadges />}
    </div>
  );
}
```

### Conditional Rendering
```typescript
import { isFeatureEnabled } from '@/config/clients';

{isFeatureEnabled('showPartnerLogo') && (
  <PartnerLogo />
)}
```

### Switch Clients Programmatically
```typescript
import { switchClient, getClientSwitchUrl } from '@/config/clients';

// Reload page with new client
switchClient('nyl');

// Get URL without navigation
const url = getClientSwitchUrl('abe');
```

### Use the ClientSwitcher Component
```typescript
import ClientSwitcher from '@/components/dev/ClientSwitcher';

function DevTools() {
  return (
    <Box>
      <ClientSwitcher />
    </Box>
  );
}
```

The `ClientSwitcher` component provides:
- Chip showing current client
- Dropdown menu to switch clients
- Visual indicator when using URL override
- Option to clear override and use default

## Configuration Options

### Branding
```typescript
interface ClientBranding {
  name: string;              // Display name
  logo: string;              // Path to primary logo
  partnerLogo?: string;      // Path to partner logo
  logoAlt: string;           // Alt text for logo
  partnerLogoAlt?: string;   // Alt text for partner logo
}
```

### Theme
```typescript
interface ClientTheme {
  primaryColor: string;      // Main brand color
  primaryLight?: string;     // Light variant
  primaryDark?: string;      // Dark variant
  secondaryColor?: string;   // Secondary brand color
  secondaryLight?: string;   // Secondary light
  secondaryDark?: string;    // Secondary dark
}
```

### Features
```typescript
interface ClientFeatures {
  showPartnerLogo?: boolean;           // Show partner logo
  showRatingBadges?: boolean;          // Show rating badges
  enableDisabilityInsurance?: boolean; // Enable DI options
  enableLifeInsurance?: boolean;       // Enable life options
  showCoverageDetails?: boolean;       // Show coverage dropdown
}
```

## Build for Specific Client

### Development
```bash
VITE_CLIENT_ID=nyl npm run dev
```

### Production Build
```bash
VITE_CLIENT_ID=nyl npm run build
```

### Multiple Builds
Create separate build scripts in `package.json`:
```json
{
  "scripts": {
    "build:abe": "VITE_CLIENT_ID=abe npm run build",
    "build:nyl": "VITE_CLIENT_ID=nyl npm run build",
    "build:all": "npm run build:abe && npm run build:nyl"
  }
}
```

## Best Practices

1. **Always use hooks in React components**
   ```typescript
   const branding = useClientBranding(); // ✅ Good
   const branding = getClientBranding(); // ❌ Won't react to changes
   ```

2. **Set client via environment variable**
   - Use `.env` for development
   - Use build scripts for production
   - Don't commit `.env` (use `.env.example`)

3. **Test with multiple clients**
   - Switch between clients during development
   - Verify colors and logos update correctly
   - Check feature flags work as expected

4. **Document new fields**
   - Add to this README when adding new config options
   - Update TypeScript interfaces
   - Provide examples

## Troubleshooting

### Theme colors not updating
- Restart dev server after changing `.env`
- Clear browser cache
- Check console for errors

### Logo not showing
- Verify path in `public/brand/[client]/logo.png`
- Check browser network tab for 404 errors
- Ensure logo path matches config

### Changes not applying
- Changes to `.env` require dev server restart
- Changes to `clients.ts` require browser refresh
- Some changes may need cache clear

## Future Enhancements

Planned additions to the configuration system:

- [ ] Field label customization
- [ ] Field visibility toggles
- [ ] Custom validation rules per client
- [ ] Client-specific content/copy
- [ ] Multi-language support
- [ ] Custom email templates
- [ ] PDF branding
- [ ] Analytics tracking IDs

---

Last Updated: October 16, 2025

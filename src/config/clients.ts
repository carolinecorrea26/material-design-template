import { THEME_COLORS, type ThemeColorName } from './themeColors';

export type ClientId = 'abe' | 'ama' | 'avmalifetrust' | 'waepa' | 'ieee' | 'demo' | 'default';

export interface ClientBranding {
  /** Client display name */
  name: string;
  /** Client acronym */
  acronym: string;
  /** Path to primary logo */
  logo: string;
  /** Path to partner logo (optional) */
  partnerLogo?: string;
  /** Alternate text for logo */
  logoAlt: string;
  /** Partner logo alt text (optional) */
  partnerLogoAlt?: string;
  /** Path to hero image (optional) */
  heroImage?: string;
  /** Hero image alt text (optional) */
  heroImageAlt?: string;
  /** Hero section title text */
  heroTitle: string;
  /** Hero section subtitle text */
  heroSubtitle: string;
  /** List of available insurance products */
  products: string[];
  /** Support phone number */
  phone?: string;
  /** Phone number display text (optional, defaults to phone) */
  phoneDisplay?: string;
  /** Phone hours (e.g., "M-F 8:00am-5:00pm CT") */
  phoneHours?: string;
  /** Schedule call URL (optional) */
  scheduleCallUrl?: string;
}

export interface ClientTheme {
  /** Theme color name - references a predefined color palette */
  colorName: ThemeColorName;
}

export interface ClientFieldLabels {
  /** Label for birthday fields */
  dateOfBirth?: string;
  /** Label for gender fields */
  gender?: string;
  /** Label for state fields */
  state?: string;
  /** Label for nicotine use */
  nicotineUse?: string;
  // Add more custom labels as needed
}

export interface ClientMembershipQuestion {
  /** Question text for primary member */
  primaryQuestion: string;
  /** Question text for spouse member (optional) */
  spouseQuestion?: string;
  /** Type of question: 'radio' for Y/N, 'select' for dropdown */
  type: 'radio' | 'select';
  /** Options for primary member select type questions */
  options?: Array<{ label: string; value: string }>;
  /** Options for spouse member select type questions (optional, falls back to options) */
  spouseOptions?: Array<{ label: string; value: string }>;
}

export interface ClientFeatures {
  /** Whether to show partner logo */
  showPartnerLogo?: boolean;
  /** Whether to show rating badges */
  showRatingBadges?: boolean;
  /** Whether disability insurance is enabled */
  enableDisabilityInsurance?: boolean;
  /** Whether life insurance is enabled */
  enableLifeInsurance?: boolean;
  /** Whether to show coverage details */
  showCoverageDetails?: boolean;
}

export interface ClientConfig {
  id: ClientId;
  branding: ClientBranding;
  theme: ClientTheme;
  fieldLabels?: ClientFieldLabels;
  membershipQuestion?: ClientMembershipQuestion;
  features?: ClientFeatures;
}

/**
 * Client Configurations
 */
export const CLIENT_CONFIGS: Record<ClientId, ClientConfig> = {
  abe: {
    id: 'abe',
    branding: {
      name: 'American Bar Endowment',
      acronym: 'ABE',
      logo: '/brand/abe/logo.png',
      logoAlt: 'ABE Logo',
      partnerLogo: '/brand/nyl/logo.png',
      partnerLogoAlt: 'New York Life Logo',
      heroImage: '/brand/abe/hero.png',
      heroImageAlt: 'Bar Association Members',
      heroTitle: 'High quality insurance and exclusive rates for Bar Association Members.',
      heroSubtitle: 'Group Life, Disability and Supplemental Insurance available exclusively to Bar Association Members. Start your application today.',
      products: [
        'Term Life Insurance',
        '10-Year Level Term Life Insurance',
        '20-Year Level Term Life Insurance',
        '50+ Multi-Benefit Term Life Insurance',
        'Accidental Death and Dismemberment Insurance',
        'Long-Term Disability Plus Insurance',
        'Long-Term Disability Insurance',
        'Mid-Term Disability Insurance',
        'Professional Overhead Expense Disability Insurance',
        'Critical Illness',
        'Hospital Money Insurance'
      ],
      phone: '8006218981',
      phoneDisplay: '(800) 621-8981',
    },
    theme: {
      colorName: 'green',
    },
    fieldLabels: {
      dateOfBirth: 'Birthday',
      gender: 'Gender',
      state: 'State',
      nicotineUse: 'Do you use nicotine products?',
    },
    membershipQuestion: {
      primaryQuestion: 'Are you an active member of a State, Local, or Specialty Bar Association?',
      spouseQuestion: 'Is your spouse an active member of a State, Local, or Specialty Bar Association?',
      type: 'radio',
    },
    features: {
      showPartnerLogo: true,
      showRatingBadges: true,
      enableDisabilityInsurance: true,
      enableLifeInsurance: true,
      showCoverageDetails: true,
    },
  },
  
  ama: {
    id: 'ama',
    branding: {
      name: 'American Medical Association',
      acronym: 'AMA',
      logo: '/brand/ama/logo.png',
      logoAlt: 'AMA Logo',
      partnerLogo: '/brand/nyl/logo.png',
      partnerLogoAlt: 'New York Life Logo',
      heroImage: '/brand/ama/hero.png',
      heroImageAlt: 'AMA Members',
      heroTitle: 'Help safeguard your financial future.',
      heroSubtitle: 'AMA-sponsored coverage designed to protect you, your family and your career underwritten by New York Life Insurance Company.',
      products: [
        '20-Year Level Term Life Insurance',
        '15-Year Level Term Life Insurance',
        '10-Year Level Term Life Insurance',
        'Term Life Insurance',
        'Preferred Term Life Insurance',
        'Premier Accident Insurance',
        'Disability Insurance with Step Rated Premiums',
        'Disability Insurance with Level Rated Premiums',
        'Office Overhead Expense Insurance',
        'Hospital Income Insurance'
      ],
      phone: '8886275902',
      phoneDisplay: '888-627-5902',
      phoneHours: 'M-F 8:00am-5:00pm CT',
      scheduleCallUrl: 'https://calendly.com/insurance-specialists-1/ama-insurance-website-inquiry?month=2025-10',
    },
    theme: {
      colorName: 'blue',
    },
    fieldLabels: {
      dateOfBirth: 'Birthday',
      gender: 'Gender',
      state: 'State',
      nicotineUse: 'Do you use tobacco products?',
    },
    membershipQuestion: {
      primaryQuestion: 'I am a (select one)',
      spouseQuestion: 'Spouse Specialty',
      type: 'select',
      options: [
        { label: 'Physician', value: 'physician' },
        { label: 'Resident', value: 'resident' },
        { label: 'Student', value: 'student' },
        { label: 'Retired Physician', value: 'retired' },
        { label: 'Spouse of Physician', value: 'spouse' },
      ],
      spouseOptions: [
        { label: 'Spouse of Physician', value: 'spouse' },
      ],
    },
    features: {
      showPartnerLogo: true,
      showRatingBadges: true,
      enableDisabilityInsurance: true,
      enableLifeInsurance: true,
      showCoverageDetails: true,
    },
  },
  
  avmalifetrust: {
    id: 'avmalifetrust',
    branding: {
      name: 'American Veterinary Medical Association',
      acronym: 'AVMA',
      logo: '/brand/avmalifetrust/logo.png',
      logoAlt: 'AVMA Life Trust Logo',
      partnerLogo: '/brand/nyl/logo.png',
      partnerLogoAlt: 'New York Life Logo',
      heroImage: '/brand/avmalifetrust/hero.png',
      heroImageAlt: 'AVMA Members',
      heroTitle: 'Help safeguard your financial future.',
      heroSubtitle: 'Coverage designed for you, available at member exclusive rates.',
      products: [
        'Term Life Insurance',
        '10-Year Level Term Life Insurance',
        '20-Year Level Term Life Insurance',
        'Accidental Death and Dismemberment Insurance',
        'Disability Insurance',
        'Critical Illness Insurance',
        'Hospital Income Insurance'
      ],
      phone: '8006218981',
      phoneDisplay: '(800) 621-8981',
    },
    theme: {
      colorName: 'green',
    },
    fieldLabels: {
      dateOfBirth: 'Birthday',
      gender: 'Gender',
      state: 'State',
      nicotineUse: 'Do you use tobacco products?',
    },
    membershipQuestion: {
      primaryQuestion: 'Are you an active member of the American Veterinary Medical Association?',
      spouseQuestion: 'Is your spouse an active member of the American Veterinary Medical Association?',
      type: 'radio',
    },
    features: {
      showPartnerLogo: true,
      showRatingBadges: true,
      enableDisabilityInsurance: true,
      enableLifeInsurance: true,
      showCoverageDetails: true,
    },
  },
  
  waepa: {
    id: 'waepa',
    branding: {
      name: 'Worldwide Assurance for Employees of Public Agencies',
      acronym: 'WAEPA',
      logo: '/brand/waepa/logo.png',
      logoAlt: 'WAEPA Logo',
      partnerLogo: '/brand/nyl/logo.png',
      partnerLogoAlt: 'New York Life Logo',
      heroImage: '/brand/waepa/hero.png',
      heroImageAlt: 'WAEPA Members',
      heroTitle: 'Safeguard your family\'s future.',
      heroSubtitle: 'Group Term Life and Group Short Term Disability Insurance, available exclusively to Civilian Federal Employees. Start your application today.',
      products: [
        'Group Term Life Insurance',
        'Group Short-Term Disability Income Insurance Plan'
      ],
      phone: '8003683484',
      phoneDisplay: '800-368-3484',
      phoneHours: 'M-Th 8:30am - 6:30pm, F 8:30am - 5:00pm, ET',
    },
    theme: {
      colorName: 'blue',
    },
    fieldLabels: {
      dateOfBirth: 'Birthday',
      gender: 'Gender',
      state: 'State',
      nicotineUse: 'Do you use tobacco products?',
    },
    membershipQuestion: {
      primaryQuestion: 'Are you a civilian federal employee?',
      spouseQuestion: 'Is your spouse a civilian federal employee?',
      type: 'radio',
    },
    features: {
      showPartnerLogo: true,
      showRatingBadges: true,
      enableDisabilityInsurance: true,
      enableLifeInsurance: true,
      showCoverageDetails: true,
    },
  },
  
  ieee: {
    id: 'ieee',
    branding: {
      name: 'IEEE',
      acronym: 'IEEE',
      logo: '/brand/ieee/logo.png',
      logoAlt: 'IEEE Logo',
      partnerLogo: '/brand/nyl/logo.png',
      partnerLogoAlt: 'New York Life Logo',
      heroImage: '/brand/ieee/hero.png',
      heroImageAlt: 'IEEE Members',
      heroTitle: 'Help safeguard your financial future.',
      heroSubtitle: 'Coverage designed for you, available at member exclusive rates.',
      products: [
        'Group Term Life Insurance Plan',
        'Group 10-Year Level Term Life Insurance',
        'Group 20-Year Level Term Life Insurance',
        'Accidental Death and Dismemberment',
        'Group Disability Income Insurance'
      ],
      phone: '8006784333',
      phoneDisplay: '800-678-IEEE (4333)',
      phoneHours: 'M-F 8:00am-5:00pm ET',
    },
    theme: {
      colorName: 'blue',
    },
    fieldLabels: {
      dateOfBirth: 'Birthday',
      gender: 'Gender',
      state: 'State',
      nicotineUse: 'Do you use tobacco products?',
    },
    membershipQuestion: {
      primaryQuestion: 'Are you an active member of IEEE?',
      spouseQuestion: 'Is your spouse an active member of IEEE?',
      type: 'radio',
    },
    features: {
      showPartnerLogo: true,
      showRatingBadges: true,
      enableDisabilityInsurance: true,
      enableLifeInsurance: true,
      showCoverageDetails: true,
    },
  },
  
  demo: {
    id: 'demo',
    branding: {
      name: 'Demo Insurance',
      acronym: 'DEMO',
      logo: '/brand/nyl/logo.png',
      logoAlt: 'New York Life Logo',
      heroImage: '/brand/nyl/hero.png',
      heroImageAlt: 'Demo Insurance Coverage',
      heroTitle: 'Demo Site - Insurance Coverage Options',
      heroSubtitle: 'Explore our comprehensive insurance products designed to protect you and your family.',
      products: [
        'Term Life Insurance',
        '10 Year Level Term Life Insurance',
        'Long-Term Disability Plus Insurance',
        'Critical Illness',
        'Hospital Money Insurance',
        'Short-Term Disability Insurance'
      ],
      phone: '8006218981',
      phoneDisplay: '(800) 621-8981',
    },
    theme: {
      colorName: 'blue',
    },
    fieldLabels: {
      dateOfBirth: 'Birthday',
      gender: 'Gender',
      state: 'State',
      nicotineUse: 'Do you use tobacco products?',
    },
    membershipQuestion: {
      primaryQuestion: 'Are you an active member of Demo Insurance?',
      spouseQuestion: 'Is your spouse an active member of Demo Insurance?',
      type: 'radio',
    },
    features: {
      showPartnerLogo: false,
      showRatingBadges: true,
      enableDisabilityInsurance: true,
      enableLifeInsurance: true,
      showCoverageDetails: true,
    },
  },
  
  default: {
    id: 'default',
    branding: {
      name: 'New York Life',
      acronym: 'NYL',
      logo: '/brand/nyl/logo.png',
      logoAlt: 'New York Life Logo',
      heroImage: '/brand/nyl/hero.png',
      heroImageAlt: 'New York Life Insurance',
      heroTitle: 'Help safeguard your financial future.',
      heroSubtitle: 'Coverage designed for you, available at member exclusive rates.',
      products: [
        'Term Life Insurance',
        '10-Year Level Term Life Insurance',
        '20-Year Level Term Life Insurance',
        'Accidental Death and Dismemberment Insurance',
        'Disability Insurance',
        'Critical Illness Insurance',
        'Hospital Income Insurance'
      ],
      phone: '8006218981',
      phoneDisplay: '(800) 621-8981',
    },
    theme: {
      colorName: 'blue',
    },
    fieldLabels: {
      dateOfBirth: 'Birthday',
      gender: 'Gender',
      state: 'State',
      nicotineUse: 'Do you use tobacco?',
    },
    membershipQuestion: {
      primaryQuestion: 'Are you an active member of a Demo Association?',
      spouseQuestion: 'Is your spouse an active member of a Demo Association?',
      type: 'radio',
    },
    features: {
      showPartnerLogo: false,
      showRatingBadges: true,
      enableDisabilityInsurance: true,
      enableLifeInsurance: true,
      showCoverageDetails: true,
    },
  },
};

/**
 * Get client ID from URL parameter
 * Checks for ?client=abc or &client=abc in URL
 */
function getClientIdFromUrl(): ClientId | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  const clientParam = params.get('client');
  
  if (clientParam && clientParam in CLIENT_CONFIGS) {
    return clientParam as ClientId;
  }
  
  return null;
}

/**
 * Get client ID from session storage
 * Persists URL parameter selection across navigation
 */
function getClientIdFromStorage(): ClientId | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem('activeClientId');
    if (stored && stored in CLIENT_CONFIGS) {
      return stored as ClientId;
    }
  } catch (e) {
    // sessionStorage might not be available
    console.warn('Could not access sessionStorage:', e);
  }
  
  return null;
}

/**
 * Save client ID to session storage
 */
function saveClientIdToStorage(clientId: ClientId): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem('activeClientId', clientId);
  } catch (e) {
    console.warn('Could not save to sessionStorage:', e);
  }
}

/**
 * Determine the active client ID
 * Priority: URL parameter > Session Storage > Environment Variable > Default
 */
function getActiveClientId(): ClientId {
  // 1. Check URL parameter (highest priority)
  const urlClientId = getClientIdFromUrl();
  if (urlClientId) {
    saveClientIdToStorage(urlClientId);
    return urlClientId;
  }
  
  // 2. Check session storage (persists URL selection)
  const storedClientId = getClientIdFromStorage();
  if (storedClientId) {
    return storedClientId;
  }
  
  // 3. Check environment variable
  const envClientId = import.meta.env.VITE_CLIENT_ID as ClientId;
  if (envClientId && envClientId in CLIENT_CONFIGS) {
    return envClientId;
  }
  
  // 4. Default fallback
  return 'abe';
}

/**
 * Active Client Configuration
 * 
 * Determined by (in order of priority):
 * 1. URL parameter: ?client=abe
 * 2. Session storage (persists URL selection)
 * 3. Environment variable: VITE_CLIENT_ID
 * 4. Default: 'abe'
 */
export const ACTIVE_CLIENT_ID: ClientId = getActiveClientId();

/**
 * Get the active client configuration
 */
export function getClientConfig(): ClientConfig {
  return CLIENT_CONFIGS[ACTIVE_CLIENT_ID] || CLIENT_CONFIGS.default;
}

/**
 * Get client branding
 */
export function getClientBranding(): ClientBranding {
  return getClientConfig().branding;
}

/**
 * Get client theme colors
 * Returns primary color variants for Material UI theme generation
 */
export function getClientTheme() {
  const config = getClientConfig();
  const colorName = config.theme.colorName;
  const colors = THEME_COLORS[colorName];
  
  return colors.primary;
}

/**
 * Get client field labels
 */
export function getClientFieldLabels(): ClientFieldLabels {
  return getClientConfig().fieldLabels || {};
}

/**
 * Get client membership question configuration
 */
export function getClientMembershipQuestion(): ClientMembershipQuestion | undefined {
  return getClientConfig().membershipQuestion;
}

/**
 * Get client features
 */
export function getClientFeatures(): ClientFeatures {
  return getClientConfig().features || {};
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof ClientFeatures): boolean {
  const features = getClientFeatures();
  return features[feature] ?? true; // Default to true if not specified
}

/**
 * Get URL for switching to a specific client
 * Preserves current path and other query parameters
 */
export function getClientSwitchUrl(clientId: ClientId): string {
  if (typeof window === 'undefined') return '';
  
  const url = new URL(window.location.href);
  url.searchParams.set('client', clientId);
  return url.toString();
}

/**
 * Switch to a different client (client-side navigation)
 * Reloads the page with the new client parameter
 */
export function switchClient(clientId: ClientId): void {
  if (typeof window === 'undefined') return;
  
  const newUrl = getClientSwitchUrl(clientId);
  window.location.href = newUrl;
}

/**
 * Clear client override and use default configuration
 * Removes URL parameter and clears session storage
 */
export function clearClientOverride(): void {
  if (typeof window === 'undefined') return;
  
  // Clear session storage
  try {
    sessionStorage.removeItem('activeClientId');
  } catch (e) {
    console.warn('Could not clear sessionStorage:', e);
  }
  
  // Remove URL parameter
  const url = new URL(window.location.href);
  url.searchParams.delete('client');
  window.location.href = url.toString();
}

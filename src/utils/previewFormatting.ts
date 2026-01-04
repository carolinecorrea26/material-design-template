/**
 * Utility functions for formatting preview page data
 */

/**
 * Fields that should be excluded from the preview page
 * Add field paths (dot notation) that should not be displayed
 */
export const EXCLUDED_PREVIEW_FIELDS = [
  'eligibility.selfCoverages',
  'eligibility.spouseCoverages',
  'eligibility.childCoverages',
  'profile.businessAddressSameAsHome',
  'profile.isBusinessAddressSameAsHome',
  'contact.businessAddressSameAsHome'
];

/**
 * Check if a field should be excluded from preview
 */
export function shouldExcludeField(fieldPath: string): boolean {
  return EXCLUDED_PREVIEW_FIELDS.includes(fieldPath);
}

/**
 * Format answer text with proper capitalization and spacing
 * Examples:
 * - "age65" -> "Age 65"
 * - "5years" -> "5 Years"
 * - "yes" -> "Yes"
 * - "no" -> "No"
 */
export function formatAnswer(value: any): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length > 0 ? value.map(v => formatAnswer(v)).join(", ") : "—";
  
  let str = String(value);
  
  // Handle common patterns
  // Add space before numbers in patterns like "age65"
  str = str.replace(/([a-z])(\d)/gi, '$1 $2');
  
  // Add space between number and text in patterns like "5years"
  str = str.replace(/(\d)([a-z])/gi, '$1 $2');
  
  // Handle camelCase - add space before capitals
  str = str.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // Capitalize first letter of each word
  str = str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return str;
}

/**
 * Format label text for display
 */
export function formatLabel(label: string): string {
  return label;
}

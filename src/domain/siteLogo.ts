export const siteLogoMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
export const maxSiteLogoBytes = 1024 * 1024;

export function isSiteLogo(value: string | undefined): value is string {
  if (!value || value.length > 4 * Math.ceil(maxSiteLogoBytes / 3) + 32) return false;
  const match = /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[1].length % 4 !== 0) return false;
  const padding = match[1].endsWith('==') ? 2 : match[1].endsWith('=') ? 1 : 0;
  return match[1].length * 3 / 4 - padding <= maxSiteLogoBytes;
}

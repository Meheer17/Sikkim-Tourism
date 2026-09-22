import config from '@/config/api.config';

export const buildImageUrl = (filename?: string | null): string | undefined => {
  if (!filename) return undefined;
  const trimmed = String(filename).trim();
  const base = String(config.api.baseURL || '').replace(/\/$/, '');

  // If URL is an expired Google Usercontent streetview/gpms URL (which returns 403), fallback to local 360 panorama
  if (/lh3\.googleusercontent\.com/i.test(trimmed)) {
    return base ? `${base}/cdn/images/rumtek_panorama_360.jpg` : trimmed;
  }

  // If URL points to backend CDN images (even with an older IP or localhost), rewrite to current base URL
  const cdnMatch = trimmed.match(/(?:\/api\/v1)?\/cdn\/images\/([^/?#]+)/i);
  if (cdnMatch && cdnMatch[1]) {
    let rawName = cdnMatch[1];
    try {
      rawName = decodeURIComponent(rawName);
    } catch {
      // Keep as-is if malformed
    }
    return base ? `${base}/cdn/images/${encodeURIComponent(rawName)}` : trimmed;
  }

  // If it's already an external full URL (e.g. S3, Cloudinary), return as-is
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (!base) return undefined;

  // Ensure we produce: http://host:port/api/v1/cdn/images/{filename}
  return `${base}/cdn/images/${encodeURIComponent(trimmed)}`;
};

export default buildImageUrl;

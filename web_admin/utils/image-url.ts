export const buildImageUrl = (filename?: string | null): string | undefined => {
  if (!filename) return undefined;
  const trimmed = String(filename).trim();
  
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.29.140:8000';
  const base = baseURL.replace(/\/$/, '');

  // If URL points to backend CDN images (even with an older IP or localhost), rewrite to current base URL
  const cdnMatch = trimmed.match(/(?:\/api\/v1)?\/cdn\/images\/([^/?#]+)/i);
  if (cdnMatch && cdnMatch[1]) {
    const rawName = decodeURIComponent(cdnMatch[1]);
    return `${base}/api/v1/cdn/images/${encodeURIComponent(rawName)}`;
  }

  // If it's already a full URL, return as-is
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Produce: http://host:port/api/v1/cdn/images/{filename}
  return `${base}/api/v1/cdn/images/${encodeURIComponent(trimmed)}`;
};

export default buildImageUrl;

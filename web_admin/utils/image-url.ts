export const buildImageUrl = (filename?: string | null): string | undefined => {
  if (!filename) return undefined;
  const trimmed = String(filename).trim();
  
  // If it's already a full URL, return as-is
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const base = baseURL.replace(/\/$/, '');

  // Produce: http://host:port/api/v1/cdn/images/{filename}
  return `${base}/api/v1/cdn/images/${encodeURIComponent(trimmed)}`;
};

export default buildImageUrl;

import config from '@/config/api.config';

export const buildImageUrl = (filename?: string | null): string | undefined => {
  if (!filename) return undefined;
  const trimmed = String(filename).trim();
  // If it's already a full URL, return as-is
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = String(config.api.baseURL || '').replace(/\/$/, '');
  if (!base) return undefined;

  // Ensure we produce: http://host:port/api/v1/cdn/images/{filename}
  return `${base}/cdn/images/${encodeURIComponent(trimmed)}`;
};

export default buildImageUrl;

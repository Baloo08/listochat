/**
 * Utility to safely normalize image URLs across SPA routes and components.
 * Prevents broken image links when navigating nested routes like /reservas/:slug or /canchas/:slug.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URLs, external HTTPS/HTTP, and blob previews
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }

  // Relative uploads path normalization: ensure leading slash
  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed}`;
  }

  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  // General relative path
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

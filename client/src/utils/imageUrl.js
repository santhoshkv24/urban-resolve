/**
 * Resolves a relative image path from the API (e.g. "/uploads/image.jpg")
 * to a full URL using the backend base URL.
 *
 * Usage:
 *   <img src={getImageUrl(ticket.imageUrl)} />
 */
const BACKEND_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : null) || 'http://localhost:5000';

export const getImageUrl = (path) => {
  if (!path) return null;
  // Already absolute (e.g. blob: or http:)
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${BACKEND_BASE}${path}`;
};

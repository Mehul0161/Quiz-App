const rawBase: string | undefined = (import.meta as any).env?.VITE_API_BASE_URL;

// Fallback to same-origin /api in browser if env not provided
const fallbackBase = typeof window !== 'undefined' ? `${window.location.origin}/api` : '';

// Remove any trailing slashes to avoid double slashes when joining paths
export const API_BASE_URL: string = (rawBase && rawBase.trim() !== '' ? rawBase : fallbackBase).replace(/\/+$/, '');

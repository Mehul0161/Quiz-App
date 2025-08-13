const rawBase: string | undefined = (import.meta as any).env?.API_BASE_URL
  ? String((import.meta as any).env?.API_BASE_URL)
  : 'https://quiz-app-b-one.vercel.app/api';

// Fallback to same-origin /api in browser if env not provided
const fallbackBase = typeof window !== 'undefined' ? `${window.location.origin}/api` : '';

// Remove any trailing slashes to avoid double slashes when joining paths
export const API_BASE_URL: string = (rawBase && rawBase.trim() !== '' ? rawBase : fallbackBase).replace(/\/+$/, '');

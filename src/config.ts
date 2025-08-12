export const API_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL || '';

if (!API_BASE_URL) {
  // Optional: warn in dev
  // console.warn('VITE_API_BASE_URL is not set. API calls may fail.');
}

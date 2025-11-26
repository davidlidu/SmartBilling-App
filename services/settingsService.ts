import { SenderDetails } from '../types';
import { DEFAULT_SENDER_DETAILS } from '../constants'; // For fallback/initial structure

const API_BASE_URL = 'https://api.facturador.lidutech.net/api'; // PRODUCTION: Adjust to your deployed backend URL. e.g., https://yourdomain.com/api or '/api' if proxied.

const handleResponse = async <T>(response: Response): Promise<T | null> => {
  if (response.status === 404 || response.status === 204) return null; // Not found or no content
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error desconocido del servidor' }));
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
};


// A local cache for settings to avoid multiple fetches during app lifecycle if not strictly needed
let localSettingsCache: SenderDetails | null = null;

export const getSettings = async (): Promise<SenderDetails> => {
  if (localSettingsCache) {
    return localSettingsCache;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/settings/profile`);
    const backendSettings = await handleResponse<SenderDetails>(response);
    
    if (backendSettings) {
      localSettingsCache = { ...DEFAULT_SENDER_DETAILS, ...backendSettings };
      return localSettingsCache;
    }
    // If backend returns null (no profile setup yet), return default.
    // The frontend will use DEFAULT_SENDER_DETAILS as a template.
    localSettingsCache = DEFAULT_SENDER_DETAILS;
    return DEFAULT_SENDER_DETAILS;
  } catch (error) {
    console.error("Error fetching settings from backend:", error);
    // Fallback to default if backend fetch fails
    return DEFAULT_SENDER_DETAILS;
  }
};

export const saveSettings = async (newSettings: Partial<SenderDetails>): Promise<SenderDetails> => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    const savedBackendSettings = await handleResponse<SenderDetails>(response);
    if (savedBackendSettings) {
      localSettingsCache = { ...DEFAULT_SENDER_DETAILS, ...savedBackendSettings };
      return localSettingsCache;
    }
    // Fallback if save operation doesn't return expected data (should not happen with POST)
    localSettingsCache = { ...DEFAULT_SENDER_DETAILS, ...newSettings } as SenderDetails;
    return localSettingsCache;
  } catch (error) {
    console.error("Error saving settings to backend:", error);
    // Fallback to an in-memory update of the cache on error
    localSettingsCache = { ...(localSettingsCache || DEFAULT_SENDER_DETAILS), ...newSettings } as SenderDetails;
    throw error; // Re-throw to allow UI to handle it
  }
};

// Resetting settings might mean telling backend to delete/reset its profile,
// or simply clearing local cache and letting getSettings fetch (or return default).
// For now, this just clears local cache. A backend endpoint would be needed for true server-side reset.
export const resetSettingsFrontendCache = (): SenderDetails => {
  localSettingsCache = null; 
  // To truly reset on backend, you'd need a DELETE /api/settings/profile endpoint
  // or a POST that sets it to defaults.
  // For now, frontend just reverts to using DEFAULT_SENDER_DETAILS until next successful fetch.
  return DEFAULT_SENDER_DETAILS;
};
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import fetchRetry from 'fetch-retry';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Create a fetch wrapper with retry logic for maintenance windows
// as recommended by Supabase: https://supabase.com/docs/guides/database/connecting-to-postgres#handling-reconnections
const fetchWithRetry = fetchRetry(fetch);

const customFetch: typeof fetch = (url, options) => {
  return fetchWithRetry(url, {
    ...options,
    retries: 3,
    retryDelay: (attempt) => Math.pow(2, attempt) * 1000, // Exponential backoff: 1s, 2s, 4s
    retryOn: (attempt, error, response) => {
      // Retry on network errors
      if (error !== null) return true;

      // Retry on specific HTTP status codes common during maintenance
      if (response && [502, 503, 504, 408].includes(response.status)) {
        return true;
      }

      return false;
    }
  });
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: customFetch,
  },
});
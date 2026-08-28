import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * False when the project hasn't been configured yet. The app checks this and
 * shows a setup screen rather than throwing on a blank page — the failure a
 * missing .env.local produces should be legible, not a white screen.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[compas] Supabase is not configured. Copy .env.example to .env.local and fill it in — see supabase/README.md.',
  );
}

export const supabase = createClient<Database>(
  url || 'http://localhost:54321',
  anonKey || 'anon-key-not-set',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'compas.auth',
    },
  },
);

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ejyzldnrcgglcnpbxmda.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeXpsZG5yY2dnbGNucGJ4bWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MzAwODksImV4cCI6MjA2NzUwNjA4OX0.nGe9iaFfQ3nl9WZGfI4gCW9qaNViIIamdVFnTyoIHjQ";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      Accept: 'application/json',
    },
  },
});

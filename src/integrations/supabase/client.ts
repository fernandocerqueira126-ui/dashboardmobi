import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ygoszrmhvbqvhpwpnghj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnb3N6cm1odmJxdmhwd3BuZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzOTgxMzIsImV4cCI6MjA4NDk3NDEzMn0.CX8z61ok4CWnZ9qOpINt2bWHpWLyObER0IZyuBfQ0xQ";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
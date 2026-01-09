import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const SUPABASE_URL = "https://anecuxbekhdkxcwblhtm.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuZWN1eGJla2hka3hjd2JsaHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTc0ODgsImV4cCI6MjA4MjkzMzQ4OH0.DkxoFpEdoZZ8aOi_asRbhobJOpFVaog8lGzTfMKyATo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

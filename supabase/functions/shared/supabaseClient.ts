// @ts-nocheck
import { createClient as createSupabaseClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Supabase URL or SERVICE_ROLE_KEY is not set in environment variables.");
}

export const supabase = createSupabaseClient(
  SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false } }
);
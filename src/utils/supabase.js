import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tdaunjwsexqrtzvqjlwk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYXVuandzZXhxcnR6dnFqbHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTY5MDMsImV4cCI6MjA1OTc5MjkwM30.ZL3tm6apr_gagIY-hovswB3LSu9MBF3UHEby-63stas";

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveTilesToSupabase(tyles) {
  try {
    const { data, error } = await supabase.from("game_test").insert([{ tyles }]);
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.SUPABASE_URL as string;
const key = process.env.SUPABASE_ANON_KEY as string;

export const sb = createClient(url, key);

(async () => {
  // getSession() checks if the API key and URL can talk to Supabase 
  // without needing a specific database table to exist.
  const { error } = await sb.auth.getSession();
  
  if (error) {
    console.error("Supabase connection error:", error.message);
  } else {
    console.log("Supabase connected successfully ✅");
  }
})();
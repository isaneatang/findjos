import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

// Creates the browser client used for seller and administrator authentication.
export function createSupabaseBrowserClient() {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient(url, key);
}

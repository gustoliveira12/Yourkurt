import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://owzfwvudvrpzvtveypgg.supabase.co",
  "sb_publishable_9tegEZ5TYSMQYEo3OEwCTg_cTzNZWsz",
);

export default supabase;

import { createBrowserClient as supabaseCreateBrowserClient } from "@supabase/ssr"
import { supabaseConfig } from "./config"

export function createBrowserClient() {
  return supabaseCreateBrowserClient(supabaseConfig.url, supabaseConfig.anonKey)
}

export function createClient() {
  return createBrowserClient()
}

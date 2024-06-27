import { createClient } from 'supabase'

export const supabaseClient = () =>  {
    return createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))
}
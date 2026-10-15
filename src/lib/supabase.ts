import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && key)

// Sin las variables de entorno la portada sigue andando; la app avisa qué falta.
export const supabase = isConfigured
  ? createClient(url!, key!, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true } })
  : null

export function db() {
  if (!supabase) throw new Error('Falta configurar Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).')
  return supabase
}

import type { Session } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { db, supabase } from './supabase'

// undefined: todavía no se sabe (cargando); null: sin sesión.
let session: Session | null | undefined = supabase ? undefined : null
const listeners = new Set<() => void>()

if (supabase) {
  supabase.auth.onAuthStateChange((_event, next) => {
    session = next
    listeners.forEach((l) => l())
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSession() {
  return useSyncExternalStore(subscribe, () => session)
}

export function currentUserId(): string | null {
  return session?.user.id ?? null
}

/** Nombre sugerido para la persona: el de Google o lo que está antes de la @. */
export function suggestedName(s: Session | null | undefined): string {
  const meta = s?.user.user_metadata as { full_name?: string; name?: string } | undefined
  const full = meta?.full_name ?? meta?.name
  if (full) return full.split(' ')[0]
  const email = s?.user.email ?? ''
  const local = email.split('@')[0].split(/[._+-]/)[0]
  return local ? local[0].toUpperCase() + local.slice(1) : ''
}

function redirectTo(next: string) {
  return `${window.location.origin}/entrar?next=${encodeURIComponent(next)}`
}

export async function signInWithGoogle(next: string) {
  const { error } = await db().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo(next) } })
  if (error) throw new Error('No se pudo abrir Google. Probá de nuevo.')
}

export async function signInWithEmail(email: string, next: string) {
  const { error } = await db().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo(next) } })
  if (error) {
    throw new Error(
      error.status === 429 ? 'Pediste muchos links seguidos. Esperá un minuto y probá de nuevo.' : 'No se pudo mandar el mail. Revisá la dirección.',
    )
  }
}

export async function signOut() {
  await db().auth.signOut()
}

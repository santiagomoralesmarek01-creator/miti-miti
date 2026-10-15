import { db } from './supabase'

// Ingreso con el botón oficial de Google (Google Identity Services).
// Google entrega un comprobante (ID token) en la misma página y Supabase lo
// valida, así la pantalla de Google muestra el dominio de la web y no el de
// Supabase.

export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || null

interface GoogleId {
  initialize(config: {
    client_id: string
    callback: (response: { credential: string }) => void
    nonce: string
    use_fedcm_for_prompt?: boolean
    use_fedcm_for_button?: boolean
  }): void
  renderButton(
    parent: HTMLElement,
    options: { type: 'standard'; theme: 'outline'; size: 'large'; text: 'continue_with'; shape: 'pill'; logo_alignment: 'center'; width: number; locale: string },
  ): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } }
  }
}

let loading: Promise<GoogleId> | null = null

/** Carga una sola vez el script de Google. Falla si no carga en 8 segundos. */
export function loadGoogleId(): Promise<GoogleId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  loading ??= new Promise<GoogleId>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    const timer = setTimeout(() => reject(new Error('Google no respondió')), 8000)
    script.onload = () => {
      clearTimeout(timer)
      if (window.google?.accounts?.id) resolve(window.google.accounts.id)
      else reject(new Error('Google no se pudo cargar'))
    }
    script.onerror = () => {
      clearTimeout(timer)
      reject(new Error('Google no se pudo cargar'))
    }
    document.head.appendChild(script)
  }).catch((e: unknown) => {
    loading = null
    throw e
  })
  return loading
}

/**
 * Nonce de un solo uso contra repeticiones: Google recibe el hash y lo
 * incluye en el comprobante; Supabase recibe el original y verifica que coincidan.
 */
export async function createNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  return { raw, hashed: await sha256Hex(raw) }
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function signInWithGoogleIdToken(token: string, nonce: string) {
  const { error } = await db().auth.signInWithIdToken({ provider: 'google', token, nonce })
  if (error) {
    console.error('Ingreso con Google fallido:', error.message)
    throw new Error('No se pudo entrar con Google. Probá de nuevo.')
  }
}

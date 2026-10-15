import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { GoogleButton } from '../components/GoogleButton'
import { FaltaConfigurar, Cargando } from '../components/RequireAuth'
import { Header } from '../components/Header'
import { signInWithEmail, signInWithGoogle, useSession } from '../lib/auth'
import { isConfigured } from '../lib/supabase'

/**
 * Mensaje para cuando Supabase vuelve con un error (en la query o en el #)
 * o con un código que no pudo canjear. Muestra también el detalle técnico,
 * así un problema de configuración no queda escondido.
 */
function returnError(params: URLSearchParams): string {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const detail = params.get('error_description') ?? hash.get('error_description')
  if (detail) {
    console.error('Ingreso fallido:', detail)
    const expired = /expired|invalid|already/i.test(detail) && !/exchange/i.test(detail)
    return expired ? 'El link venció o ya se usó. Pedí uno nuevo.' : `No se pudo entrar (${detail}). Probá de nuevo.`
  }
  if (params.has('code')) return 'No se pudo completar el ingreso. Probá de nuevo desde este mismo navegador.'
  return ''
}

/** Solo se aceptan rutas internas, para que nadie arme un link que lleve a otro sitio. */
function safeNext(raw: string | null) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/app'
}

export function Login() {
  const session = useSession()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [busy, setBusy] = useState<'google' | 'email' | null>(null)
  const [error, setError] = useState(() => returnError(params))

  if (!isConfigured) return <FaltaConfigurar />
  if (session) return <Navigate to={next} replace />
  // Volviendo de Google o del mail, Supabase canjea el código: esperamos la sesión.
  if (session === undefined) return <Cargando />

  const invited = next.startsWith('/unirse/')

  const google = async () => {
    setBusy('google')
    setError('')
    try {
      await signInWithGoogle(next)
    } catch (e) {
      setError((e as Error).message)
      setBusy(null)
    }
  }

  const byEmail = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Escribí un mail válido.')
    setBusy('email')
    setError('')
    try {
      await signInWithEmail(email.trim(), next)
      setSentTo(email.trim())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Header variant="app" />
      <main className="app contenedor entrar">
        <div className="caja entrar-caja">
          {sentTo ? (
            <div className="enviado">
              <span className="grande" aria-hidden="true">
                📬
              </span>
              <h1>Revisá tu mail</h1>
              <p>
                Te mandamos un link a <strong>{sentTo}</strong>. Abrilo desde este mismo navegador para entrar.
              </p>
              <button className="enlace-peligro" onClick={() => setSentTo('')}>
                Usar otro mail
              </button>
            </div>
          ) : (
            <>
              <span className="etiqueta">{invited ? 'Te invitaron a un grupo' : 'Entrar'}</span>
              <h1>{invited ? 'Entrá para sumarte.' : 'Hola de nuevo.'}</h1>
              <p className="entrar-bajada">Sin contraseñas: entrás con Google o con un link que te llega por mail.</p>

              <GoogleButton
                onError={setError}
                fallback={
                <button className="boton boton--grande boton--papel boton--ancho" onClick={google} disabled={busy !== null}>
                  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
                  </svg>
                  {busy === 'google' ? 'Abriendo Google…' : 'Seguir con Google'}
                </button>
                }
              />

              <div className="separador">
                <span>o con tu mail</span>
              </div>

              <form onSubmit={byEmail} className="entrar-mail">
                <label className="campo">
                  Mail
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@mail.com" autoComplete="email" />
                </label>
                <button className="boton boton--grande boton--ancho" disabled={busy !== null}>
                  {busy === 'email' ? 'Mandando…' : 'Mandame el link'}
                </button>
              </form>

              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}

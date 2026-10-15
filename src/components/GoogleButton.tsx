import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GOOGLE_CLIENT_ID, createNonce, loadGoogleId, signInWithGoogleIdToken } from '../lib/googleIdentity'

/**
 * Botón oficial de Google. Mientras carga muestra un lugar reservado y, si no
 * hay Client ID o Google no carga (bloqueador, sin conexión), muestra `fallback`.
 */
export function GoogleButton({ fallback, onError }: { fallback: ReactNode; onError: (message: string) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>(GOOGLE_CLIENT_ID ? 'loading' : 'fallback')
  const errorRef = useRef(onError)
  useEffect(() => {
    errorRef.current = onError
  })

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false
    ;(async () => {
      try {
        const [google, nonce] = await Promise.all([loadGoogleId(), createNonce()])
        if (cancelled || !box.current) return
        google.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: nonce.hashed,
          use_fedcm_for_prompt: true,
          use_fedcm_for_button: true,
          callback: ({ credential }) => {
            signInWithGoogleIdToken(credential, nonce.raw).catch((e: Error) => errorRef.current(e.message))
          },
        })
        google.renderButton(box.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'center',
          width: Math.min(400, Math.max(200, box.current.offsetWidth)),
          locale: 'es-419',
        })
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('fallback')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'fallback') return <>{fallback}</>
  return (
    <div className={`boton-google${status === 'loading' ? ' boton-google--cargando' : ''}`}>
      <div ref={box} className="boton-google-lugar" />
    </div>
  )
}

import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../lib/auth'
import { isConfigured } from '../lib/supabase'
import { Header } from './Header'

export function Cargando() {
  return (
    <div className="cargando" role="status">
      <span className="girador" aria-hidden="true" />
      Cargando…
    </div>
  )
}

export function FaltaConfigurar() {
  return (
    <>
      <Header variant="app" />
      <main className="app contenedor">
        <div className="vacio">
          <strong>Falta conectar Supabase.</strong>
          <p>
            Creá un archivo <code>.env.local</code> con <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>. Los pasos están
            en el README.
          </p>
        </div>
      </main>
    </>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useSession()
  const location = useLocation()

  if (!isConfigured) return <FaltaConfigurar />
  if (session === undefined) return <Cargando />
  if (session === null) {
    const next = location.pathname + location.search
    return <Navigate to={`/entrar?next=${encodeURIComponent(next)}`} replace />
  }
  return children
}

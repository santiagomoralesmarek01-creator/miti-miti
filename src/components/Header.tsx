import { Link, useNavigate } from 'react-router-dom'
import { signOut, useSession } from '../lib/auth'
import { Logo } from './Logo'

export function Header({ variant }: { variant: 'landing' | 'app' }) {
  const session = useSession()
  const navigate = useNavigate()

  return (
    <header className="barra">
      <div className="contenedor">
        <Logo to={variant === 'app' && session ? '/app' : '/'} />
        <nav aria-label="Principal">
          {variant === 'landing' ? (
            <>
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#probala">Probala</a>
              <a href="#preguntas">Preguntas</a>
              <Link to="/app" className="boton boton--chico">
                {session ? 'Mis grupos →' : 'Entrar →'}
              </Link>
            </>
          ) : (
            <>
              <Link to="/">Inicio</Link>
              {session && (
                <>
                  <Link to="/app">Mis grupos</Link>
                  <button
                    className="boton boton--chico boton--papel"
                    onClick={async () => {
                      await signOut()
                      navigate('/')
                    }}
                    title={session.user.email}
                  >
                    Salir
                  </button>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

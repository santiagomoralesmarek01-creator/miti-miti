import { Link } from 'react-router-dom'
import { Logo } from './Logo'

export function Header({ variant }: { variant: 'landing' | 'app' }) {
  return (
    <header className="barra">
      <div className="contenedor">
        <Logo to={variant === 'app' ? '/app' : '/'} />
        <nav aria-label="Principal">
          {variant === 'landing' ? (
            <>
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#probala">Probala</a>
              <a href="#preguntas">Preguntas</a>
              <Link to="/app" className="boton boton--chico">
                Abrir la app →
              </Link>
            </>
          ) : (
            <>
              <Link to="/">Inicio</Link>
              <Link to="/app" className="boton boton--chico boton--papel">
                Mis grupos
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

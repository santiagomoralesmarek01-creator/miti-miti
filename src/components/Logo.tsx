import { Link } from 'react-router-dom'

export function LogoMark() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill="var(--amarillo)" />
      <path d="M20 3a17 17 0 0 1 0 34z" fill="var(--rosa)" />
      <circle cx="20" cy="20" r="17" fill="none" stroke="var(--linea)" strokeWidth="3" />
      <path d="M20 3v34" stroke="var(--linea)" strokeWidth="3" />
    </svg>
  )
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="logo" aria-label="Miti-Miti, inicio">
      <LogoMark />
      <span>miti·miti</span>
    </Link>
  )
}

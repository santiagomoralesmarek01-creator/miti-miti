const COLORES = ['--amarillo', '--rosa', '--verde', '--celeste', '--violeta', '--naranja']

function colorFor(index: number) {
  return `var(${COLORES[index % COLORES.length]})`
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.trim().slice(0, 2)
  return letters.toUpperCase()
}

export function Avatar({ name, index, title }: { name: string; index: number; title?: string }) {
  return (
    <span className="avatar" style={{ background: colorFor(index) }} title={title ?? name} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

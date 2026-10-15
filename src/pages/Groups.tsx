import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Header } from '../components/Header'
import { Modal } from '../components/Modal'
import { NewGroupForm } from '../components/NewGroupForm'
import { Cargando } from '../components/RequireAuth'
import { formatMoney } from '../lib/money'
import { totalSpent } from '../lib/settle'
import { loadGroups, useGroups } from '../lib/store'

const FONDOS = ['--amarillo', '--rosa', '--verde', '--celeste', '--violeta', '--naranja']

export function Groups() {
  const { groups, status } = useGroups()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <Header variant="app" />
      <main className="app contenedor">
        <div className="app-encabezado">
          <div>
            <span className="etiqueta">Tus grupos</span>
            <h1 style={{ marginTop: 12 }}>¿Quién debe qué?</h1>
          </div>
          <button className="boton boton--grande" onClick={() => setCreating(true)}>
            + Nuevo grupo
          </button>
        </div>

        {status === 'error' && groups.length === 0 ? (
          <div className="vacio">
            <strong>No pudimos traer tus grupos.</strong>
            <p style={{ marginBottom: 18 }}>Revisá tu conexión.</p>
            <button className="boton" onClick={() => void loadGroups()}>
              Reintentar
            </button>
          </div>
        ) : status !== 'ready' && groups.length === 0 ? (
          <Cargando />
        ) : groups.length === 0 ? (
          <div className="vacio">
            <strong>Todavía no hay grupos.</strong>
            <p style={{ marginBottom: 20 }}>Armá uno y mandale el link de invitación a tu gente.</p>
            <button className="boton" onClick={() => setCreating(true)}>
              Crear mi primer grupo
            </button>
          </div>
        ) : (
          <div className="grilla-grupos">
            {groups.map((g, i) => (
              <Link to={`/app/g/${g.id}`} className="tarjeta-grupo caja" key={g.id}>
                <span className="emoji-grande" style={{ background: `var(${FONDOS[i % FONDOS.length]})` }}>
                  {g.emoji}
                </span>
                <h2>{g.name}</h2>
                <p className="meta">
                  {g.expenses.length} {g.expenses.length === 1 ? 'gasto' : 'gastos'} · {formatMoney(totalSpent(g), g.currency)}
                </p>
                <div className="avatares">
                  {g.members.slice(0, 6).map((m, j) => (
                    <Avatar key={m.id} name={m.name} index={j} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Modal open={creating} onClose={() => setCreating(false)} label="Nuevo grupo">
        <NewGroupForm onCancel={() => setCreating(false)} onCreated={(id) => navigate(`/app/g/${id}`)} />
      </Modal>
    </>
  )
}

import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ExpenseForm } from '../components/ExpenseForm'
import { Header } from '../components/Header'
import { Modal } from '../components/Modal'
import { formatMoney } from '../lib/money'
import { computeBalances, suggestTransfers, totalSpent } from '../lib/settle'
import { addMember, addPayment, deleteExpense, deleteGroup, deletePayment, useGroup } from '../lib/store'
import type { Group } from '../lib/types'

type Tab = 'gastos' | 'saldos'

export function GroupPage() {
  const { id } = useParams()
  const group = useGroup(id)
  const [tab, setTab] = useState<Tab>('gastos')
  const [adding, setAdding] = useState(false)

  if (!group) return <Navigate to="/app" replace />

  return (
    <>
      <Header variant="app" />
      <main className="app contenedor">
        <Link to="/app" className="volver">
          ← Mis grupos
        </Link>
        <div className="app-encabezado">
          <div className="grupo-titulo">
            <span className="emoji-grande">{group.emoji}</span>
            <h1>{group.name}</h1>
          </div>
        </div>

        <Summary group={group} />
        <Members group={group} />

        <div className="pestanias" role="tablist" aria-label="Secciones del grupo">
          {(['gastos', 'saldos'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t === 'gastos' ? '🧾 Gastos' : '⚖️ Saldos'}
            </button>
          ))}
        </div>

        <div role="tabpanel">{tab === 'gastos' ? <Activity group={group} onAdd={() => setAdding(true)} /> : <Balances group={group} />}</div>

        <DangerZone group={group} />
      </main>

      <div className="flotante">
        <button className="boton boton--grande boton--rosa" onClick={() => setAdding(true)}>
          + Gasto
        </button>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} label="Nuevo gasto">
        <ExpenseForm group={group} onDone={() => setAdding(false)} />
      </Modal>
    </>
  )
}

function Summary({ group }: { group: Group }) {
  const pending = useMemo(() => suggestTransfers(computeBalances(group)), [group])
  return (
    <div className="resumen">
      <div className="dato caja">
        <p className="rotulo">Total gastado</p>
        <p className="valor">{formatMoney(totalSpent(group), group.currency)}</p>
      </div>
      <div className="dato caja">
        <p className="rotulo">Por persona</p>
        <p className="valor">{formatMoney(Math.round(totalSpent(group) / Math.max(group.members.length, 1)), group.currency)}</p>
      </div>
      <div className="dato caja">
        <p className="rotulo">Transferencias pendientes</p>
        <p className="valor">{pending.length === 0 ? '¡A mano!' : pending.length}</p>
      </div>
    </div>
  )
}

function Members({ group }: { group: Group }) {
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)

  const add = () => {
    const n = name.trim()
    if (!n || group.members.some((m) => m.name.toLowerCase() === n.toLowerCase())) return
    addMember(group.id, n)
    setName('')
    setOpen(false)
  }

  return (
    <div className="integrantes">
      {group.members.map((m, i) => (
        <span className="chip" aria-pressed="false" style={{ opacity: 1, cursor: 'default' }} key={m.id}>
          <Avatar name={m.name} index={i} /> {m.name}
        </span>
      ))}
      {open ? (
        <span className="agregar-integrante">
          <label className="sr-only" htmlFor="sumar-persona">
            Nombre
          </label>
          <input
            id="sumar-persona"
            className="campo"
            style={{ padding: '6px 12px', border: '2px solid var(--linea)', borderRadius: 999, background: 'var(--papel)' }}
            value={name}
            autoFocus
            maxLength={30}
            placeholder="Nombre"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
              if (e.key === 'Escape') setOpen(false)
            }}
          />
          <button className="boton boton--chico" onClick={add}>
            Sumar
          </button>
        </span>
      ) : (
        <button className="chip" style={{ paddingLeft: 12 }} onClick={() => setOpen(true)}>
          + Sumar persona
        </button>
      )}
    </div>
  )
}

function Activity({ group, onAdd }: { group: Group; onAdd: () => void }) {
  const name = (id: string) => group.members.find((m) => m.id === id)?.name ?? '¿?'
  const items = [
    ...group.expenses.map((e) => ({ kind: 'gasto' as const, at: e.createdAt, e })),
    ...group.payments.map((p) => ({ kind: 'pago' as const, at: p.createdAt, p })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  if (items.length === 0) {
    return (
      <div className="vacio">
        <strong>Sin gastos todavía.</strong>
        <p style={{ marginBottom: 18 }}>Cargá el primero y empezá a llevar las cuentas.</p>
        <button className="boton" onClick={onAdd}>
          Cargar un gasto
        </button>
      </div>
    )
  }

  return (
    <div className="lista">
      {items.map((it) =>
        it.kind === 'gasto' ? (
          <article className="gasto caja" key={it.e.id}>
            <span className="emoji" aria-hidden="true">
              {it.e.emoji}
            </span>
            <div>
              <h3>{it.e.description}</h3>
              <p className="detalle">
                Pagó <strong>{name(it.e.payerId)}</strong> ·{' '}
                {it.e.participantIds.length === group.members.length ? 'entre todos' : `entre ${it.e.participantIds.map(name).join(', ')}`}
              </p>
            </div>
            <span className="monto">{formatMoney(it.e.amount, group.currency)}</span>
            <button
              className="icono-boton"
              aria-label={`Borrar ${it.e.description}`}
              onClick={() => confirm(`¿Borrar "${it.e.description}"?`) && deleteExpense(group.id, it.e.id)}
            >
              ✕
            </button>
          </article>
        ) : (
          <article className="gasto gasto--pago caja" key={it.p.id}>
            <span className="emoji" aria-hidden="true">
              🤝
            </span>
            <div>
              <h3>
                {name(it.p.fromId)} le pagó a {name(it.p.toId)}
              </h3>
              <p className="detalle">Pago para saldar deudas</p>
            </div>
            <span className="monto">{formatMoney(it.p.amount, group.currency)}</span>
            <button className="icono-boton" aria-label="Deshacer pago" onClick={() => deletePayment(group.id, it.p.id)}>
              ✕
            </button>
          </article>
        ),
      )}
    </div>
  )
}

function Balances({ group }: { group: Group }) {
  const balances = useMemo(() => computeBalances(group), [group])
  const transfers = useMemo(() => suggestTransfers(balances), [balances])
  const max = Math.max(1, ...[...balances.values()].map(Math.abs))
  const index = (id: string) => group.members.findIndex((m) => m.id === id)
  const name = (id: string) => group.members[index(id)]?.name ?? '¿?'

  return (
    <div className="saldos">
      <section className="caja">
        <h2>Saldos</h2>
        {group.members.map((m, i) => {
          const b = balances.get(m.id) ?? 0
          const width = `${(Math.abs(b) / max) * 50}%`
          return (
            <div className="saldo" key={m.id}>
              <Avatar name={m.name} index={i} />
              <div className="nombre-y-monto">
                <span>{m.name}</span>
                <span className="monto">
                  {b === 0 ? 'a mano' : b > 0 ? `le deben ${formatMoney(b, group.currency)}` : `debe ${formatMoney(-b, group.currency)}`}
                </span>
              </div>
              <div className="barra-saldo" aria-hidden="true">
                {b > 0 && <span className="positivo" style={{ width }} />}
                {b < 0 && <span className="negativo" style={{ width }} />}
              </div>
            </div>
          )
        })}
      </section>

      <section className="caja">
        <h2>Cómo quedar a mano</h2>
        {transfers.length === 0 ? (
          <div className="a-mano">
            <span className="grande">🙌</span>
            <strong>¡Están a mano!</strong>
            <p>Nadie le debe nada a nadie.</p>
          </div>
        ) : (
          transfers.map((t) => (
            <div className="paso-saldar" key={`${t.fromId}-${t.toId}`}>
              <span className="par-avatares">
                <Avatar name={name(t.fromId)} index={index(t.fromId)} />
                <Avatar name={name(t.toId)} index={index(t.toId)} />
              </span>
              <span className="quien">
                {name(t.fromId)} le pasa a {name(t.toId)}
                <br />
                <strong>{formatMoney(t.amount, group.currency)}</strong>
              </span>
              <button className="boton boton--chico boton--verde" onClick={() => addPayment(group.id, t)}>
                Pagado ✓
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  )
}

function DangerZone({ group }: { group: Group }) {
  const navigate = useNavigate()
  return (
    <div className="zona-peligro">
      <button
        className="enlace-peligro"
        onClick={() => {
          if (confirm(`¿Borrar el grupo "${group.name}" con todos sus gastos? No se puede deshacer.`)) {
            deleteGroup(group.id)
            navigate('/app')
          }
        }}
      >
        Borrar este grupo
      </button>
    </div>
  )
}

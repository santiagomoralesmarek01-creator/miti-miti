import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ExpenseForm } from '../components/ExpenseForm'
import { Header } from '../components/Header'
import { InviteDialog } from '../components/InviteDialog'
import { Modal } from '../components/Modal'
import { Cargando } from '../components/RequireAuth'
import { currentUserId } from '../lib/auth'
import { formatMoney } from '../lib/money'
import { computeBalances, suggestTransfers, totalSpent } from '../lib/settle'
import { addMember, addPayment, deleteExpense, deleteGroup, deletePayment, useGroup } from '../lib/store'
import { attempt, showToast } from '../lib/toast'
import type { Group } from '../lib/types'

type Tab = 'gastos' | 'saldos'

export function GroupPage() {
  const { id } = useParams()
  const { group, notFound } = useGroup(id)
  const [tab, setTab] = useState<Tab>('gastos')
  const [dialog, setDialog] = useState<'gasto' | 'invitar' | null>(null)

  if (notFound) {
    return (
      <>
        <Header variant="app" />
        <main className="app contenedor">
          <div className="vacio">
            <strong>No encontramos este grupo.</strong>
            <p style={{ marginBottom: 18 }}>Puede que lo hayan borrado o que todavía no te hayan invitado.</p>
            <Link to="/app" className="boton">
              Ir a mis grupos
            </Link>
          </div>
        </main>
      </>
    )
  }

  if (!group) return <Cargando />

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
          <button className="boton boton--verde" onClick={() => setDialog('invitar')}>
            🔗 Invitar
          </button>
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

        <div role="tabpanel">
          {tab === 'gastos' ? <Activity group={group} onAdd={() => setDialog('gasto')} /> : <Balances group={group} />}
        </div>

        {group.createdBy === currentUserId() && <DangerZone group={group} />}
      </main>

      <div className="flotante">
        <button className="boton boton--grande boton--rosa" onClick={() => setDialog('gasto')}>
          + Gasto
        </button>
      </div>

      <Modal open={dialog === 'gasto'} onClose={() => setDialog(null)} label="Nuevo gasto">
        <ExpenseForm group={group} onDone={() => setDialog(null)} />
      </Modal>
      <Modal open={dialog === 'invitar'} onClose={() => setDialog(null)} label="Invitar al grupo">
        <InviteDialog group={group} onClose={() => setDialog(null)} />
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
  const me = currentUserId()

  const add = async () => {
    const n = name.trim()
    if (!n) return
    if (group.members.some((m) => m.name.toLowerCase() === n.toLowerCase())) return showToast(`Ya hay alguien que se llama ${n}.`, 'error')
    if (await attempt(() => addMember(group.id, n))) {
      setName('')
      setOpen(false)
    }
  }

  return (
    <div className="integrantes">
      {group.members.map((m, i) => (
        <span
          className={`chip chip--fijo${m.userId ? '' : ' chip--sin-cuenta'}`}
          key={m.id}
          title={m.userId ? undefined : 'Todavía no entró con la invitación'}
        >
          <Avatar name={m.name} index={i} /> {m.name}
          {m.userId === me && <span className="vos">vos</span>}
        </span>
      ))}
      {open ? (
        <span className="agregar-integrante">
          <label className="sr-only" htmlFor="sumar-persona">
            Nombre
          </label>
          <input
            id="sumar-persona"
            className="input-chip"
            value={name}
            autoFocus
            maxLength={30}
            placeholder="Nombre"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void add()
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
              onClick={() => confirm(`¿Borrar "${it.e.description}"?`) && void attempt(() => deleteExpense(group.id, it.e.id))}
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
            <button
              className="icono-boton"
              aria-label="Deshacer pago"
              onClick={() => confirm('¿Deshacer este pago?') && void attempt(() => deletePayment(group.id, it.p.id))}
            >
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
  const [paying, setPaying] = useState<string | null>(null)
  const max = Math.max(1, ...[...balances.values()].map(Math.abs))
  const index = (id: string) => group.members.findIndex((m) => m.id === id)
  const name = (id: string) => group.members[index(id)]?.name ?? '¿?'

  const markPaid = async (t: (typeof transfers)[number]) => {
    setPaying(`${t.fromId}-${t.toId}`)
    if (await attempt(() => addPayment(group.id, t))) showToast(`Listo: ${name(t.fromId)} le pagó a ${name(t.toId)}`)
    setPaying(null)
  }

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
              <button className="boton boton--chico boton--verde" disabled={paying !== null} onClick={() => markPaid(t)}>
                {paying === `${t.fromId}-${t.toId}` ? '…' : 'Pagado ✓'}
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
        onClick={async () => {
          if (!confirm(`¿Borrar el grupo "${group.name}" con todos sus gastos? Se borra para todos y no se puede deshacer.`)) return
          if (await attempt(() => deleteGroup(group.id))) navigate('/app')
        }}
      >
        Borrar este grupo
      </button>
    </div>
  )
}

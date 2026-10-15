import { useMemo, useState } from 'react'
import { formatMoney, parseMoney } from '../lib/money'
import { computeBalances, suggestTransfers } from '../lib/settle'
import { Avatar } from './Avatar'

const INICIAL = [
  { name: 'Sofi', paid: '12.000' },
  { name: 'Tomi', paid: '0' },
  { name: 'Juli', paid: '4.500' },
  { name: 'Nico', paid: '' },
]

/** Calculadora de la landing: usa la misma lógica que la app. */
export function MiniDemo() {
  const [rows, setRows] = useState(INICIAL)

  const transfers = useMemo(() => {
    const members = rows.map((r, i) => ({ id: String(i), name: r.name || `Persona ${i + 1}` }))
    const ids = members.map((m) => m.id)
    const expenses = rows.flatMap((r, i) => {
      const amount = parseMoney(r.paid)
      return amount ? [{ id: String(i), description: '', emoji: '', amount, payerId: String(i), participantIds: ids, createdAt: '' }] : []
    })
    return suggestTransfers(computeBalances({ members, expenses, payments: [] })).map((t) => ({
      ...t,
      from: members[Number(t.fromId)],
      to: members[Number(t.toId)],
    }))
  }, [rows])

  const update = (i: number, field: 'name' | 'paid', value: string) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, [field]: value } : r)))

  return (
    <div className="demo caja">
      <div className="demo-entrada">
        <p className="etiqueta" style={{ marginBottom: 18 }}>
          ¿Cuánto puso cada uno?
        </p>
        {rows.map((r, i) => (
          <div className="demo-fila" key={i}>
            <Avatar name={r.name || '?'} index={i} />
            <label className="sr-only" htmlFor={`demo-nombre-${i}`}>
              Nombre {i + 1}
            </label>
            <input id={`demo-nombre-${i}`} value={r.name} onChange={(e) => update(i, 'name', e.target.value)} placeholder="Nombre" />
            <label className="sr-only" htmlFor={`demo-monto-${i}`}>
              Cuánto pagó {r.name}
            </label>
            <input
              id={`demo-monto-${i}`}
              value={r.paid}
              inputMode="decimal"
              onChange={(e) => update(i, 'paid', e.target.value)}
              placeholder="$ 0"
            />
          </div>
        ))}
      </div>
      <div className="demo-salida" aria-live="polite">
        <h3>Para quedar a mano:</h3>
        {transfers.length === 0 ? (
          <p>Están a mano. Nadie le debe nada a nadie. 🙌</p>
        ) : (
          transfers.map((t) => (
            <div className="transferencia" key={`${t.fromId}-${t.toId}-${t.amount}`}>
              <span>{t.from.name}</span>
              <span className="flecha">→</span>
              <span>{t.to.name}</span>
              <span className="cuanto">{formatMoney(t.amount, 'ARS')}</span>
            </div>
          ))
        )}
        <p style={{ marginTop: 18, opacity: 0.75, fontSize: '0.95rem' }}>
          {transfers.length > 0 && `Solo ${transfers.length} ${transfers.length === 1 ? 'transferencia' : 'transferencias'}. `}
          Cambiá los montos y mirá cómo se recalcula.
        </p>
      </div>
    </div>
  )
}

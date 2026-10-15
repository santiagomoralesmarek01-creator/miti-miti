import { useState, type FormEvent } from 'react'
import { formatMoney, parseMoney } from '../lib/money'
import { splitEvenly } from '../lib/settle'
import { addExpense } from '../lib/store'
import type { Group } from '../lib/types'
import { Avatar } from './Avatar'

const EMOJIS = ['🛒', '🍕', '🍖', '🍻', '⛽', '🚕', '🏠', '🎟️', '☕', '💡', '🎁', '💸']

export function ExpenseForm({ group, onDone }: { group: Group; onDone: () => void }) {
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [amountText, setAmountText] = useState('')
  const [payerId, setPayerId] = useState(group.members[0]?.id ?? '')
  const [participants, setParticipants] = useState<string[]>(group.members.map((m) => m.id))
  const [error, setError] = useState('')

  const amount = parseMoney(amountText)
  const share = amount && participants.length ? splitEvenly(amount, participants.length)[0] : null

  const toggle = (id: string) =>
    setParticipants((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return setError('¿En qué se gastó?')
    if (!amount) return setError('Escribí un monto válido, por ejemplo 12.500 o 12500,50.')
    if (participants.length === 0) return setError('Elegí al menos una persona para dividir.')
    addExpense(group.id, { description: description.trim(), emoji, amount, payerId, participantIds: participants })
    onDone()
  }

  return (
    <form className="formulario caja" onSubmit={submit}>
      <h2>Nuevo gasto</h2>

      <div className="selector-emoji" role="group" aria-label="Ícono del gasto">
        {EMOJIS.map((em) => (
          <button type="button" key={em} aria-pressed={em === emoji} onClick={() => setEmoji(em)} aria-label={`Elegir ${em}`}>
            {em}
          </button>
        ))}
      </div>

      <div className="fila-campos fila-campos--3">
        <label className="campo">
          Descripción
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Carne y carbón" autoFocus maxLength={60} />
        </label>
        <label className="campo">
          Monto ({group.currency})
          <input value={amountText} onChange={(e) => setAmountText(e.target.value)} inputMode="decimal" placeholder="12.500" />
        </label>
      </div>

      <fieldset className="campo" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ marginBottom: 6 }}>¿Quién pagó?</legend>
        <div className="chips">
          {group.members.map((m, i) => (
            <button type="button" className="chip" key={m.id} aria-pressed={payerId === m.id} onClick={() => setPayerId(m.id)}>
              <Avatar name={m.name} index={i} /> {m.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="campo" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ marginBottom: 6 }}>
          ¿Entre quiénes se divide?{' '}
          {share !== null && (
            <span style={{ fontWeight: 500 }}>
              ({formatMoney(share, group.currency)} c/u)
            </span>
          )}
        </legend>
        <div className="chips">
          {group.members.map((m, i) => (
            <button type="button" className="chip" key={m.id} aria-pressed={participants.includes(m.id)} onClick={() => toggle(m.id)}>
              <Avatar name={m.name} index={i} /> {m.name}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="acciones-formulario">
        <button type="button" className="boton boton--papel" onClick={onDone}>
          Cancelar
        </button>
        <button type="submit" className="boton">
          Guardar gasto
        </button>
      </div>
    </form>
  )
}

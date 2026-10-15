import { useState, type FormEvent } from 'react'
import { centsToInput, formatMoney, parseMoney } from '../lib/money'
import { splitEvenly } from '../lib/settle'
import { addExpense, myMember, updateExpense } from '../lib/store'
import type { Expense, Group } from '../lib/types'
import { Avatar } from './Avatar'

const EMOJIS = ['🛒', '🍕', '🍖', '🍻', '⛽', '🚕', '🏠', '🎟️', '☕', '💡', '🎁', '💸']

/** Sin `expense` carga un gasto nuevo; con `expense` lo edita. */
export function ExpenseForm({ group, expense, onDone }: { group: Group; expense?: Expense; onDone: () => void }) {
  const [description, setDescription] = useState(expense?.description ?? '')
  const [emoji, setEmoji] = useState(expense?.emoji ?? EMOJIS[0])
  const [amountText, setAmountText] = useState(expense ? centsToInput(expense.amount) : '')
  const [payerId, setPayerId] = useState(expense?.payerId ?? myMember(group)?.id ?? group.members[0]?.id ?? '')
  const [participants, setParticipants] = useState<string[]>(
    // Al editar, se ignoran integrantes que ya no existen.
    expense ? expense.participantIds.filter((id) => group.members.some((m) => m.id === id)) : group.members.map((m) => m.id),
  )
  const emojis = expense && !EMOJIS.includes(expense.emoji) ? [expense.emoji, ...EMOJIS] : EMOJIS
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const amount = parseMoney(amountText)
  const share = amount && participants.length ? splitEvenly(amount, participants.length)[0] : null

  const toggle = (id: string) =>
    setParticipants((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return setError('¿En qué se gastó?')
    if (!amount) return setError('Escribí un monto válido, por ejemplo 12.500 o 12500,50.')
    if (participants.length === 0) return setError('Elegí al menos una persona para dividir.')
    setBusy(true)
    setError('')
    try {
      const data = { description: description.trim(), emoji, amount, payerId, participantIds: participants }
      if (expense) await updateExpense(group.id, expense.id, data)
      else await addExpense(group.id, data)
      onDone()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form className="formulario caja" onSubmit={submit}>
      <h2>{expense ? 'Editar gasto' : 'Nuevo gasto'}</h2>

      {group.members.length === 1 && (
        <p className="aviso">
          Por ahora sos la única persona del grupo, así que este gasto queda solo para vos. Invitá a tu gente con 🔗 <strong>Invitar</strong> antes de
          cargar gastos compartidos (o después editalo para sumarla).
        </p>
      )}

      <div className="selector-emoji" role="group" aria-label="Ícono del gasto">
        {emojis.map((em) => (
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
        <button type="submit" className="boton" disabled={busy}>
          {busy ? 'Guardando…' : expense ? 'Guardar cambios' : 'Guardar gasto'}
        </button>
      </div>
    </form>
  )
}

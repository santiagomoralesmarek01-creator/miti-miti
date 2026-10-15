import { useState, type FormEvent } from 'react'
import { suggestedName, useSession } from '../lib/auth'
import { CURRENCIES, type Currency } from '../lib/money'
import { createGroup } from '../lib/store'
import { Avatar } from './Avatar'

const EMOJIS = ['🏖️', '🍖', '🏠', '✈️', '🎂', '🍻', '⛺', '🎁', '🚗', '💸']

export function NewGroupForm({ onCreated, onCancel }: { onCreated: (groupId: string) => void; onCancel: () => void }) {
  const session = useSession()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [currency, setCurrency] = useState<Currency>('ARS')
  const [myName, setMyName] = useState(suggestedName(session))
  const [others, setOthers] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const taken = (n: string, list: string[]) => [myName, ...list].some((m) => m.trim().toLowerCase() === n.toLowerCase())

  const addDraft = () => {
    const n = draft.trim()
    if (!n) return
    if (taken(n, others)) return setError(`Ya hay alguien que se llama ${n}.`)
    setOthers([...others, n])
    setDraft('')
    setError('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const pending = draft.trim()
    const all = pending && !taken(pending, others) ? [...others, pending] : others
    if (!name.trim()) return setError('Ponele un nombre al grupo.')
    if (!myName.trim()) return setError('¿Cómo te llamamos en el grupo?')
    setBusy(true)
    setError('')
    try {
      onCreated(await createGroup({ name: name.trim(), emoji, currency, myName: myName.trim(), otherNames: all }))
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form className="formulario caja" onSubmit={submit}>
      <h2>Nuevo grupo</h2>

      <label className="campo">
        Nombre del grupo
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asado del domingo" autoFocus maxLength={60} />
      </label>

      <fieldset className="campo" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ marginBottom: 6 }}>Emoji</legend>
        <div className="selector-emoji">
          {EMOJIS.map((em) => (
            <button type="button" key={em} aria-pressed={em === emoji} onClick={() => setEmoji(em)} aria-label={`Elegir ${em}`}>
              {em}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="fila-campos fila-campos--3">
        <label className="campo">
          Tu nombre en el grupo
          <input value={myName} onChange={(e) => setMyName(e.target.value)} maxLength={30} />
        </label>
        <label className="campo">
          Moneda
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.code})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="campo">
        <label htmlFor="nuevo-integrante">¿Quiénes más? (opcional, también los podés invitar después)</label>
        <div className="agregar-integrante">
          <input
            id="nuevo-integrante"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addDraft()
              }
            }}
            placeholder="Nombre y Enter"
            maxLength={30}
          />
          <button type="button" className="boton boton--rosa" onClick={addDraft}>
            Sumar
          </button>
        </div>
        {others.length > 0 && (
          <div className="chips" style={{ marginTop: 6 }}>
            {others.map((m, i) => (
              <button type="button" className="chip" aria-pressed="true" key={m} onClick={() => setOthers(others.filter((x) => x !== m))} title="Quitar">
                <Avatar name={m} index={i + 1} /> {m} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="acciones-formulario">
        <button type="button" className="boton boton--papel" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={busy}>
          {busy ? 'Creando…' : 'Crear grupo'}
        </button>
      </div>
    </form>
  )
}

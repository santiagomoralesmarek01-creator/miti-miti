import { useState, type FormEvent } from 'react'
import { CURRENCIES, type Currency } from '../lib/money'
import { createGroup } from '../lib/store'
import type { Group } from '../lib/types'
import { Avatar } from './Avatar'

const EMOJIS = ['🏖️', '🍖', '🏠', '✈️', '🎂', '🍻', '⛺', '🎁', '🚗', '💸']

export function NewGroupForm({ onCreated, onCancel }: { onCreated: (g: Group) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [currency, setCurrency] = useState<Currency>('ARS')
  const [members, setMembers] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  const addDraft = () => {
    const n = draft.trim()
    if (!n) return
    if (members.some((m) => m.toLowerCase() === n.toLowerCase())) {
      setError(`Ya hay alguien que se llama ${n}.`)
      return
    }
    setMembers([...members, n])
    setDraft('')
    setError('')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const all = draft.trim() ? [...members, draft.trim()] : members
    if (!name.trim()) return setError('Ponele un nombre al grupo.')
    if (all.length < 2) return setError('Sumá al menos dos personas.')
    onCreated(createGroup({ name: name.trim(), emoji, currency, memberNames: all }))
  }

  return (
    <form className="formulario caja" onSubmit={submit}>
      <h2>Nuevo grupo</h2>

      <label className="campo">
        Nombre
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

      <div className="campo">
        <label htmlFor="nuevo-integrante">Integrantes (vos incluido)</label>
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
        {members.length > 0 && (
          <div className="chips" style={{ marginTop: 6 }}>
            {members.map((m, i) => (
              <button
                type="button"
                className="chip"
                aria-pressed="true"
                key={m}
                onClick={() => setMembers(members.filter((x) => x !== m))}
                title="Quitar"
              >
                <Avatar name={m} index={i} /> {m} ✕
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
        <button type="submit" className="boton">
          Crear grupo
        </button>
      </div>
    </form>
  )
}

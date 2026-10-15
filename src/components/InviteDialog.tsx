import { useState } from 'react'
import { resetInvite } from '../lib/store'
import { attempt, showToast } from '../lib/toast'
import type { Group } from '../lib/types'

export function InviteDialog({ group, onClose }: { group: Group; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const link = `${window.location.origin}/unirse/${group.inviteCode}`
  const canShare = typeof navigator.share === 'function'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      showToast('Link copiado')
    } catch {
      showToast('No se pudo copiar. Seleccioná el link a mano.', 'error')
    }
  }

  const share = () =>
    navigator.share({ title: `Miti-Miti · ${group.name}`, text: `Sumate a "${group.name}" en Miti-Miti para dividir los gastos:`, url: link }).catch(() => {})

  const reset = async () => {
    if (!confirm('El link actual va a dejar de funcionar. ¿Generar uno nuevo?')) return
    setBusy(true)
    if (await attempt(() => resetInvite(group.id))) showToast('Link nuevo generado')
    setBusy(false)
  }

  return (
    <div className="formulario caja">
      <h2>Invitar al grupo</h2>
      <p>Mandale este link a quien quieras sumar. Va a tener que entrar con su cuenta y elegir quién es.</p>
      <label className="campo">
        Link de invitación
        <input value={link} readOnly onFocus={(e) => e.currentTarget.select()} />
      </label>
      <div className="acciones-formulario" style={{ justifyContent: 'start' }}>
        <button className="boton" onClick={copy}>
          📋 Copiar link
        </button>
        {canShare && (
          <button className="boton boton--verde" onClick={share}>
            📤 Compartir
          </button>
        )}
      </div>
      <p style={{ color: 'var(--tinta-suave)', fontSize: '0.92rem' }}>
        ¿Se compartió donde no debía?{' '}
        <button className="enlace-peligro" onClick={reset} disabled={busy}>
          Generar un link nuevo
        </button>
      </p>
      <div className="acciones-formulario">
        <button className="boton boton--papel" onClick={onClose}>
          Listo
        </button>
      </div>
    </div>
  )
}

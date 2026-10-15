import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Header } from '../components/Header'
import { Cargando } from '../components/RequireAuth'
import { suggestedName, useSession } from '../lib/auth'
import { getInvite, joinGroup, type Invite } from '../lib/store'
import { attempt } from '../lib/toast'

export function Join() {
  const { code = '' } = useParams()
  const session = useSession()
  const navigate = useNavigate()
  const [invite, setInvite] = useState<Invite | null | undefined>(undefined)
  const [choice, setChoice] = useState<string | 'nuevo' | null>(null)
  const [name, setName] = useState(suggestedName(session))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void attempt(async () => setInvite(await getInvite(code)))
  }, [code])

  if (invite === undefined) return <Cargando />
  if (invite?.alreadyMember) return <Navigate to={`/app/g/${invite.groupId}`} replace />

  const join = async () => {
    if (!choice) return
    if (choice === 'nuevo' && !name.trim()) return
    setBusy(true)
    let gid = ''
    const ok = await attempt(async () => {
      gid = await joinGroup(code, choice === 'nuevo' ? { name: name.trim() } : { memberId: choice })
    })
    setBusy(false)
    if (ok) navigate(`/app/g/${gid}`, { replace: true })
  }

  return (
    <>
      <Header variant="app" />
      <main className="app contenedor entrar">
        {invite === null ? (
          <div className="vacio">
            <strong>Este link de invitación no anda.</strong>
            <p style={{ marginBottom: 18 }}>Puede que lo hayan cambiado. Pedile uno nuevo a alguien del grupo.</p>
            <Link to="/app" className="boton">
              Ir a mis grupos
            </Link>
          </div>
        ) : (
          <div className="caja entrar-caja">
            <span className="grupo-titulo" style={{ marginBottom: 18 }}>
              <span className="emoji-grande">{invite.emoji}</span>
              <span>
                <span className="etiqueta">Te invitaron</span>
                <h1 style={{ marginTop: 8 }}>{invite.name}</h1>
              </span>
            </span>
            <p className="entrar-bajada">¿Quién sos en este grupo?</p>

            <div className="chips chips--elegir" style={{ marginBottom: 16 }}>
              {invite.openMembers.map((m, i) => (
                <button type="button" className="chip" key={m.id} aria-pressed={choice === m.id} onClick={() => setChoice(m.id)}>
                  <Avatar name={m.name} index={i} /> Soy {m.name}
                </button>
              ))}
              <button type="button" className="chip" style={{ paddingLeft: 12 }} aria-pressed={choice === 'nuevo'} onClick={() => setChoice('nuevo')}>
                {invite.openMembers.length ? 'No estoy en la lista' : 'Sumarme al grupo'}
              </button>
            </div>

            {choice === 'nuevo' && (
              <label className="campo" style={{ marginBottom: 16 }}>
                Tu nombre en el grupo
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoFocus />
              </label>
            )}
            {choice === 'nuevo' && (
              <p className="aviso" style={{ marginBottom: 16 }}>
                Los gastos que ya estén cargados no te incluyen. Pedile a quien los cargó que los edite para sumarte.
              </p>
            )}

            <button className="boton boton--grande boton--ancho" onClick={join} disabled={!choice || busy}>
              {busy ? 'Entrando…' : 'Entrar al grupo'}
            </button>
          </div>
        )}
      </main>
    </>
  )
}

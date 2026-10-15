import { useEffect, useSyncExternalStore } from 'react'
import { currentUserId } from './auth'
import { GROUP_SELECT, rowToGroup, type GroupRow } from './mapping'
import type { Currency } from './money'
import { db } from './supabase'
import type { Expense, Group, Payment } from './types'

// Caché en memoria de los grupos que trae Supabase. Los componentes leen de acá
// con hooks; las funciones de escritura van a la base y después recargan.

interface State {
  groups: Map<string, Group>
  listStatus: 'idle' | 'loading' | 'ready' | 'error'
  missing: Set<string>
}

let state: State = { groups: new Map(), listStatus: 'idle', missing: new Set() }
const listeners = new Set<() => void>()

function setState(patch: Partial<State>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function putGroup(g: Group) {
  const groups = new Map(state.groups)
  groups.set(g.id, g)
  const missing = new Set(state.missing)
  missing.delete(g.id)
  setState({ groups, missing })
}

function fail(action: string): never {
  throw new Error(`No se pudo ${action}. Revisá tu conexión y probá de nuevo.`)
}

// ============ Lectura ============

export async function loadGroups() {
  setState({ listStatus: state.listStatus === 'ready' ? 'ready' : 'loading' })
  const { data, error } = await db().from('groups').select(GROUP_SELECT).order('created_at', { ascending: false })
  if (error) return setState({ listStatus: 'error' })
  setState({ groups: new Map((data as GroupRow[]).map((r) => [r.id, rowToGroup(r)])), listStatus: 'ready' })
}

export async function loadGroup(id: string) {
  const { data, error } = await db().from('groups').select(GROUP_SELECT).eq('id', id).maybeSingle()
  if (error) return
  if (!data) {
    const groups = new Map(state.groups)
    groups.delete(id)
    return setState({ groups, missing: new Set(state.missing).add(id) })
  }
  putGroup(rowToGroup(data as GroupRow))
}

export function useGroups() {
  useEffect(() => {
    void loadGroups()
  }, [])
  const s = useSyncExternalStore(subscribe, () => state)
  const groups = [...s.groups.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { groups, status: s.listStatus }
}

/** Cada cuánto se vuelve a traer el grupo por si el tiempo real se cortó sin avisar. */
const SAFETY_REFRESH_MS = 20_000

/** Trae un grupo y lo mantiene al día en tiempo real mientras la página está abierta. */
export function useGroup(id: string | undefined) {
  useEffect(() => {
    if (!id) return
    void loadGroup(id)

    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => void loadGroup(id), 150)
    }

    // Se espera a que el canal tenga la sesión antes de suscribirse: si no, la
    // suscripción puede salir dos veces y Supabase la cierra sin avisar.
    // El nombre es único para que una suscripción vieja no cierre la nueva.
    let channel: ReturnType<ReturnType<typeof db>['channel']> | null = null
    void db()
      .realtime.setAuth()
      .catch(() => {})
      .then(() => {
        if (!active) return
        channel = db().channel(`grupo-${id}-${crypto.randomUUID()}`)
        for (const table of ['members', 'expenses', 'payments']) {
          channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `group_id=eq.${id}` }, refresh)
        }
        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'groups', filter: `id=eq.${id}` }, refresh)
        // Al quedar suscripto se vuelve a traer el grupo, por si algo cambió mientras tanto.
        channel.subscribe((status) => status === 'SUBSCRIBED' && refresh())
      })

    // Red de seguridad: al volver a la pestaña (el celular corta la conexión al
    // bloquear la pantalla) y cada tanto mientras está visible.
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(() => document.visibilityState === 'visible' && refresh(), SAFETY_REFRESH_MS)

    return () => {
      active = false
      clearTimeout(timer)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      if (channel) void db().removeChannel(channel)
    }
  }, [id])

  const s = useSyncExternalStore(subscribe, () => state)
  const group = id ? s.groups.get(id) : undefined
  return { group, notFound: id ? s.missing.has(id) : true }
}

/** El integrante que corresponde a quien está usando la app. */
export function myMember(group: Group) {
  const uid = currentUserId()
  return group.members.find((m) => m.userId === uid)
}

// ============ Escritura ============

export async function createGroup(input: {
  name: string
  emoji: string
  currency: Currency
  myName: string
  otherNames: string[]
}): Promise<string> {
  const { data, error } = await db().rpc('create_group', {
    p_name: input.name,
    p_emoji: input.emoji,
    p_currency: input.currency,
    p_my_name: input.myName,
    p_other_names: input.otherNames,
  })
  if (error || !data) fail('crear el grupo')
  await loadGroup(data as string)
  return data as string
}

export async function deleteGroup(id: string) {
  const { error } = await db().from('groups').delete().eq('id', id)
  if (error) fail('borrar el grupo')
  const groups = new Map(state.groups)
  groups.delete(id)
  setState({ groups })
}

export async function addMember(groupId: string, name: string) {
  const { error } = await db().from('members').insert({ group_id: groupId, name })
  if (error) fail('sumar a la persona')
  await loadGroup(groupId)
}

export async function addExpense(groupId: string, input: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>) {
  const { error } = await db().from('expenses').insert({
    group_id: groupId,
    description: input.description,
    emoji: input.emoji,
    amount: input.amount,
    payer_id: input.payerId,
    participant_ids: input.participantIds,
  })
  if (error) fail('guardar el gasto')
  await loadGroup(groupId)
}

export async function updateExpense(groupId: string, expenseId: string, input: Omit<Expense, 'id' | 'createdAt' | 'createdBy'>) {
  const { error } = await db()
    .from('expenses')
    .update({
      description: input.description,
      emoji: input.emoji,
      amount: input.amount,
      payer_id: input.payerId,
      participant_ids: input.participantIds,
    })
    .eq('id', expenseId)
  if (error) fail('guardar los cambios')
  await loadGroup(groupId)
}

export async function deleteExpense(groupId: string, expenseId: string) {
  const { error } = await db().from('expenses').delete().eq('id', expenseId)
  if (error) fail('borrar el gasto')
  await loadGroup(groupId)
}

export async function addPayment(groupId: string, input: Omit<Payment, 'id' | 'createdAt' | 'createdBy'>) {
  const { error } = await db().from('payments').insert({ group_id: groupId, from_id: input.fromId, to_id: input.toId, amount: input.amount })
  if (error) fail('registrar el pago')
  await loadGroup(groupId)
}

export async function deletePayment(groupId: string, paymentId: string) {
  const { error } = await db().from('payments').delete().eq('id', paymentId)
  if (error) fail('deshacer el pago')
  await loadGroup(groupId)
}

export async function resetInvite(groupId: string) {
  const { error } = await db().rpc('reset_invite', { p_group_id: groupId })
  if (error) fail('generar un link nuevo')
  await loadGroup(groupId)
}

// ============ Invitaciones ============

export interface Invite {
  groupId: string
  name: string
  emoji: string
  alreadyMember: boolean
  openMembers: { id: string; name: string }[]
}

export async function getInvite(code: string): Promise<Invite | null> {
  const { data, error } = await db().rpc('get_invite', { p_code: code })
  if (error) fail('abrir la invitación')
  const row = (data as { group_id: string; name: string; emoji: string; already_member: boolean; open_members: Invite['openMembers'] }[])[0]
  if (!row) return null
  return { groupId: row.group_id, name: row.name, emoji: row.emoji, alreadyMember: row.already_member, openMembers: row.open_members }
}

export async function joinGroup(code: string, choice: { memberId: string } | { name: string }): Promise<string> {
  const { data, error } = await db().rpc('join_group', {
    p_code: code,
    p_member_id: 'memberId' in choice ? choice.memberId : null,
    p_name: 'name' in choice ? choice.name : null,
  })
  if (error || !data) throw new Error(error?.message.includes('ya tiene cuenta') ? 'Esa persona ya entró con otra cuenta. Elegí otra opción.' : 'No se pudo entrar al grupo.')
  await loadGroups()
  return data as string
}

import { useSyncExternalStore } from 'react'
import type { Currency } from './money'
import type { Expense, Group, Payment } from './types'

// Fase 1: los grupos viven en el navegador (localStorage).
// La API de este módulo es la que después va a implementar Supabase.

const KEY = 'miti-miti:grupos:v1'

let groups: Group[] = load()
const listeners = new Set<() => void>()

function load(): Group[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Group[]) : []
  } catch {
    return []
  }
}

function commit(next: Group[]) {
  groups = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Sin almacenamiento (modo privado): la app sigue andando en memoria.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const now = () => new Date().toISOString()
const uid = () => crypto.randomUUID()

function updateGroup(id: string, fn: (g: Group) => Group) {
  commit(groups.map((g) => (g.id === id ? fn(g) : g)))
}

export function useGroups(): Group[] {
  return useSyncExternalStore(subscribe, () => groups)
}

export function useGroup(id: string | undefined): Group | undefined {
  return useSyncExternalStore(subscribe, () => groups.find((g) => g.id === id))
}

export function createGroup(input: { name: string; emoji: string; currency: Currency; memberNames: string[] }): Group {
  const group: Group = {
    id: uid(),
    name: input.name,
    emoji: input.emoji,
    currency: input.currency,
    members: input.memberNames.map((name) => ({ id: uid(), name })),
    expenses: [],
    payments: [],
    createdAt: now(),
  }
  commit([group, ...groups])
  return group
}

export function deleteGroup(id: string) {
  commit(groups.filter((g) => g.id !== id))
}

export function addMember(groupId: string, name: string) {
  updateGroup(groupId, (g) => ({ ...g, members: [...g.members, { id: uid(), name }] }))
}

export function addExpense(groupId: string, input: Omit<Expense, 'id' | 'createdAt'>) {
  updateGroup(groupId, (g) => ({ ...g, expenses: [{ ...input, id: uid(), createdAt: now() }, ...g.expenses] }))
}

export function deleteExpense(groupId: string, expenseId: string) {
  updateGroup(groupId, (g) => ({ ...g, expenses: g.expenses.filter((e) => e.id !== expenseId) }))
}

export function addPayment(groupId: string, input: Omit<Payment, 'id' | 'createdAt'>) {
  updateGroup(groupId, (g) => ({ ...g, payments: [{ ...input, id: uid(), createdAt: now() }, ...g.payments] }))
}

export function deletePayment(groupId: string, paymentId: string) {
  updateGroup(groupId, (g) => ({ ...g, payments: g.payments.filter((p) => p.id !== paymentId) }))
}

/** Grupo de ejemplo para probar la app sin cargar nada. */
export function createDemoGroup(): Group {
  const g = createGroup({
    name: 'Finde en Mar del Plata',
    emoji: '🏖️',
    currency: 'ARS',
    memberNames: ['Sofi', 'Tomi', 'Juli', 'Nico'],
  })
  const [sofi, tomi, juli, nico] = g.members.map((m) => m.id)
  const all = [sofi, tomi, juli, nico]
  const demo: Omit<Expense, 'id' | 'createdAt'>[] = [
    { description: 'Nafta y peajes', emoji: '⛽', amount: 4800000, payerId: tomi, participantIds: all },
    { description: 'Súper del viernes', emoji: '🛒', amount: 3260000, payerId: sofi, participantIds: all },
    { description: 'Pizza en Montecatini', emoji: '🍕', amount: 2850000, payerId: juli, participantIds: all },
    { description: 'Alquiler de sombrilla', emoji: '⛱️', amount: 1500000, payerId: nico, participantIds: [sofi, juli, nico] },
    { description: 'Alfajores para llevar', emoji: '🍫', amount: 1240000, payerId: sofi, participantIds: [sofi, tomi] },
  ]
  for (const e of demo.reverse()) addExpense(g.id, e)
  return g
}

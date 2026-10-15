import type { Group } from './types'

export interface Transfer {
  fromId: string
  toId: string
  amount: number
}

/**
 * Reparte un monto en partes iguales sin perder centavos:
 * splitEvenly(1000, 3) → [334, 333, 333].
 */
export function splitEvenly(amount: number, parts: number): number[] {
  if (parts <= 0) return []
  const base = Math.floor(amount / parts)
  const rest = amount - base * parts
  return Array.from({ length: parts }, (_, i) => base + (i < rest ? 1 : 0))
}

/**
 * Saldo de cada integrante en centavos: positivo si le deben,
 * negativo si debe. La suma de todos los saldos siempre es cero.
 */
export function computeBalances(group: { members: { id: string }[] } & Pick<Group, 'expenses' | 'payments'>): Map<string, number> {
  const balances = new Map<string, number>(group.members.map((m) => [m.id, 0]))
  const add = (id: string, delta: number) => balances.set(id, (balances.get(id) ?? 0) + delta)

  for (const e of group.expenses) {
    if (e.participantIds.length === 0) continue
    add(e.payerId, e.amount)
    // Se ordena para que el centavo sobrante caiga siempre en la misma persona.
    const ids = [...e.participantIds].sort()
    splitEvenly(e.amount, ids.length).forEach((share, i) => add(ids[i], -share))
  }

  for (const p of group.payments) {
    add(p.fromId, p.amount)
    add(p.toId, -p.amount)
  }

  return balances
}

/**
 * Propone cómo saldar todas las deudas con pocas transferencias:
 * en cada paso, quien más debe le paga a quien más le deben.
 * Nunca usa más de n − 1 transferencias para n personas.
 */
export function suggestTransfers(balances: Map<string, number>): Transfer[] {
  const creditors: { id: string; amount: number }[] = []
  const debtors: { id: string; amount: number }[] = []
  for (const [id, amount] of balances) {
    if (amount > 0) creditors.push({ id, amount })
    else if (amount < 0) debtors.push({ id, amount: -amount })
  }

  const byAmount = (a: { id: string; amount: number }, b: { id: string; amount: number }) =>
    b.amount - a.amount || a.id.localeCompare(b.id)

  const transfers: Transfer[] = []
  while (creditors.length && debtors.length) {
    creditors.sort(byAmount)
    debtors.sort(byAmount)
    const c = creditors[0]
    const d = debtors[0]
    const amount = Math.min(c.amount, d.amount)
    transfers.push({ fromId: d.id, toId: c.id, amount })
    c.amount -= amount
    d.amount -= amount
    if (c.amount === 0) creditors.shift()
    if (d.amount === 0) debtors.shift()
  }
  return transfers
}

export function totalSpent(group: Pick<Group, 'expenses'>): number {
  return group.expenses.reduce((sum, e) => sum + e.amount, 0)
}

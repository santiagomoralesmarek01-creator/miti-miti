import type { Currency } from './money'
import type { Group } from './types'

// Filas tal como las devuelve Supabase (snake_case).
export interface GroupRow {
  id: string
  name: string
  emoji: string
  currency: string
  invite_code: string
  created_by: string
  created_at: string
  members: { id: string; name: string; user_id: string | null; created_at: string }[]
  expenses: {
    id: string
    description: string
    emoji: string
    amount: number | string
    payer_id: string
    participant_ids: string[]
    created_at: string
  }[]
  payments: { id: string; from_id: string; to_id: string; amount: number | string; created_at: string }[]
}

export const GROUP_SELECT = '*, members(*), expenses(*), payments(*)'

const byDate = <T extends { created_at: string; id: string }>(a: T, b: T) =>
  a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)

export function rowToGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    currency: row.currency as Currency,
    inviteCode: row.invite_code,
    createdBy: row.created_by,
    createdAt: row.created_at,
    // Los integrantes en orden de llegada, para que cada uno mantenga su color.
    members: [...row.members].sort(byDate).map((m) => ({ id: m.id, name: m.name, userId: m.user_id })),
    expenses: [...row.expenses]
      .sort(byDate)
      .reverse()
      .map((e) => ({
        id: e.id,
        description: e.description,
        emoji: e.emoji,
        // bigint puede llegar como texto: se convierte siempre a número.
        amount: Number(e.amount),
        payerId: e.payer_id,
        participantIds: e.participant_ids,
        createdAt: e.created_at,
      })),
    payments: [...row.payments]
      .sort(byDate)
      .reverse()
      .map((p) => ({ id: p.id, fromId: p.from_id, toId: p.to_id, amount: Number(p.amount), createdAt: p.created_at })),
  }
}

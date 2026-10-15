import { describe, expect, it } from 'vitest'
import { rowToGroup, type GroupRow } from './mapping'

const row: GroupRow = {
  id: 'g',
  name: 'Asado',
  emoji: '🍖',
  currency: 'ARS',
  invite_code: 'abc',
  created_by: 'u1',
  created_at: '2026-10-01T10:00:00Z',
  members: [
    { id: 'm2', name: 'Beto', user_id: null, created_at: '2026-10-01T10:00:02Z' },
    { id: 'm1', name: 'Ana', user_id: 'u1', created_at: '2026-10-01T10:00:01Z' },
  ],
  expenses: [
    { id: 'e1', description: 'Carne', emoji: '🍖', amount: '300000', payer_id: 'm1', participant_ids: ['m1', 'm2'], created_at: '2026-10-01T11:00:00Z' },
    { id: 'e2', description: 'Hielo', emoji: '🧊', amount: 5000, payer_id: 'm2', participant_ids: ['m1', 'm2'], created_at: '2026-10-01T12:00:00Z' },
  ],
  payments: [],
}

describe('rowToGroup', () => {
  const g = rowToGroup(row)

  it('ordena integrantes por llegada y gastos del más nuevo al más viejo', () => {
    expect(g.members.map((m) => m.name)).toEqual(['Ana', 'Beto'])
    expect(g.expenses.map((e) => e.id)).toEqual(['e2', 'e1'])
  })

  it('convierte los montos bigint que llegan como texto', () => {
    expect(g.expenses.find((e) => e.id === 'e1')?.amount).toBe(300000)
  })

  it('pasa a camelCase', () => {
    expect(g.inviteCode).toBe('abc')
    expect(g.members[0].userId).toBe('u1')
    expect(g.expenses[0].payerId).toBe('m2')
  })
})

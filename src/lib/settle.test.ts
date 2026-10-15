import { describe, expect, it } from 'vitest'
import { computeBalances, splitEvenly, suggestTransfers, type Transfer } from './settle'
import type { Expense, Member, Payment } from './types'

const members: Member[] = ['ana', 'beto', 'caro', 'dani'].map((id) => ({ id, name: id }))

function expense(payerId: string, amount: number, participantIds: string[]): Expense {
  return { id: crypto.randomUUID(), description: '', emoji: '', amount, payerId, participantIds, createdAt: '' }
}

function apply(balances: Map<string, number>, transfers: Transfer[]) {
  const result = new Map(balances)
  for (const t of transfers) {
    result.set(t.fromId, result.get(t.fromId)! + t.amount)
    result.set(t.toId, result.get(t.toId)! - t.amount)
  }
  return result
}

describe('splitEvenly', () => {
  it('no pierde ni inventa centavos', () => {
    expect(splitEvenly(1000, 3)).toEqual([334, 333, 333])
    expect(splitEvenly(7, 7)).toEqual([1, 1, 1, 1, 1, 1, 1])
    expect(splitEvenly(5, 0)).toEqual([])
  })
})

describe('computeBalances', () => {
  it('reparte un gasto entre todos', () => {
    const b = computeBalances({ members, expenses: [expense('ana', 4000, ['ana', 'beto', 'caro', 'dani'])], payments: [] })
    expect(Object.fromEntries(b)).toEqual({ ana: 3000, beto: -1000, caro: -1000, dani: -1000 })
  })

  it('respeta quiénes participan del gasto', () => {
    const b = computeBalances({ members, expenses: [expense('beto', 3000, ['ana', 'caro'])], payments: [] })
    expect(Object.fromEntries(b)).toEqual({ ana: -1500, beto: 3000, caro: -1500, dani: 0 })
  })

  it('descuenta los pagos ya hechos', () => {
    const payments: Payment[] = [{ id: 'p', fromId: 'beto', toId: 'ana', amount: 1000, createdAt: '' }]
    const b = computeBalances({ members, expenses: [expense('ana', 2000, ['ana', 'beto'])], payments })
    expect(Object.fromEntries(b)).toEqual({ ana: 0, beto: 0, caro: 0, dani: 0 })
  })

  it('siempre suma cero', () => {
    const expenses = [
      expense('ana', 1001, ['ana', 'beto', 'caro']),
      expense('caro', 999, ['beto', 'dani']),
      expense('dani', 12345, ['ana', 'beto', 'caro', 'dani']),
    ]
    const total = [...computeBalances({ members, expenses, payments: [] }).values()].reduce((a, b) => a + b, 0)
    expect(total).toBe(0)
  })
})

describe('suggestTransfers', () => {
  it('no propone nada si están a mano', () => {
    expect(suggestTransfers(new Map([['ana', 0], ['beto', 0]]))).toEqual([])
  })

  it('salda todo con como mucho n − 1 transferencias', () => {
    const balances = new Map([
      ['ana', 5000],
      ['beto', -2000],
      ['caro', -2500],
      ['dani', -500],
    ])
    const transfers = suggestTransfers(balances)
    expect(transfers.length).toBeLessThanOrEqual(3)
    expect([...apply(balances, transfers).values()].every((v) => v === 0)).toBe(true)
  })

  it('aprovecha las deudas que se cancelan justo', () => {
    const transfers = suggestTransfers(
      new Map([
        ['ana', 3000],
        ['beto', 1000],
        ['caro', -3000],
        ['dani', -1000],
      ]),
    )
    expect(transfers).toEqual([
      { fromId: 'caro', toId: 'ana', amount: 3000 },
      { fromId: 'dani', toId: 'beto', amount: 1000 },
    ])
  })

  it('funciona con grupos grandes y montos al azar', () => {
    for (let round = 0; round < 50; round++) {
      const ids = Array.from({ length: 12 }, (_, i) => `p${i}`)
      const group = {
        members: ids.map((id) => ({ id, name: id })),
        expenses: Array.from({ length: 30 }, () => {
          const participants = ids.filter(() => Math.random() > 0.4)
          return expense(ids[Math.floor(Math.random() * ids.length)], 1 + Math.floor(Math.random() * 100000), participants)
        }),
        payments: [],
      }
      const balances = computeBalances(group)
      const transfers = suggestTransfers(balances)
      expect(transfers.length).toBeLessThan(ids.length)
      expect(transfers.every((t) => t.amount > 0)).toBe(true)
      expect([...apply(balances, transfers).values()].every((v) => v === 0)).toBe(true)
    }
  })
})

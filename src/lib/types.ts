import type { Currency } from './money'

export interface Member {
  id: string
  name: string
}

export interface Expense {
  id: string
  description: string
  emoji: string
  /** Monto total en centavos. */
  amount: number
  payerId: string
  /** Quienes comparten el gasto, en partes iguales. */
  participantIds: string[]
  createdAt: string
}

/** Una transferencia ya hecha para saldar deudas. */
export interface Payment {
  id: string
  fromId: string
  toId: string
  amount: number
  createdAt: string
}

export interface Group {
  id: string
  name: string
  emoji: string
  currency: Currency
  members: Member[]
  expenses: Expense[]
  payments: Payment[]
  createdAt: string
}

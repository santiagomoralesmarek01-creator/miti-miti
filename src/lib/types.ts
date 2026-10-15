import type { Currency } from './money'

export interface Member {
  id: string
  name: string
  /** Cuenta vinculada; null si la persona todavía no entró con la invitación. */
  userId: string | null
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
  /** Cuenta de quien lo cargó: solo esa persona lo puede editar o borrar. */
  createdBy: string | null
  createdAt: string
}

/** Una transferencia ya hecha para saldar deudas. */
export interface Payment {
  id: string
  fromId: string
  toId: string
  amount: number
  /** Cuenta de quien lo registró: solo esa persona lo puede deshacer. */
  createdBy: string | null
  createdAt: string
}

export interface Group {
  id: string
  name: string
  emoji: string
  currency: Currency
  inviteCode: string
  createdBy: string
  members: Member[]
  expenses: Expense[]
  payments: Payment[]
  createdAt: string
}

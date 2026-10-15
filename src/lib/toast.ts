import { useSyncExternalStore } from 'react'

export interface Toast {
  id: number
  text: string
  kind: 'ok' | 'error'
}

let toasts: Toast[] = []
let next = 1
const listeners = new Set<() => void>()

function emit(list: Toast[]) {
  toasts = list
  listeners.forEach((l) => l())
}

export function showToast(text: string, kind: Toast['kind'] = 'ok') {
  const id = next++
  emit([...toasts, { id, text, kind }])
  setTimeout(() => emit(toasts.filter((t) => t.id !== id)), 4000)
}

/** Corre una acción y, si falla, muestra el error en un cartel. Devuelve si salió bien. */
export async function attempt(action: () => Promise<unknown>): Promise<boolean> {
  try {
    await action()
    return true
  } catch (e) {
    showToast(e instanceof Error ? e.message : 'Algo salió mal.', 'error')
    return false
  }
}

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => toasts,
  )
}

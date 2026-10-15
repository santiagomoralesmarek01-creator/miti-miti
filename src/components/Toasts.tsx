import { useToasts } from '../lib/toast'

export function Toasts() {
  const toasts = useToasts()
  return (
    <div className="carteles" role="status" aria-live="polite">
      {toasts.map((t) => (
        <p key={t.id} className={`cartel caja cartel--${t.kind}`}>
          {t.kind === 'error' ? '⚠️ ' : '✓ '}
          {t.text}
        </p>
      ))}
    </div>
  )
}

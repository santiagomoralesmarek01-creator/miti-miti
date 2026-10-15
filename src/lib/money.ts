// Todo el dinero se maneja en centavos (enteros) para evitar errores de redondeo.

export type Currency = 'ARS' | 'USD' | 'EUR' | 'UYU' | 'CLP' | 'BRL'

export const CURRENCIES: { code: Currency; label: string }[] = [
  { code: 'ARS', label: 'Peso argentino' },
  { code: 'USD', label: 'Dólar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'UYU', label: 'Peso uruguayo' },
  { code: 'CLP', label: 'Peso chileno' },
  { code: 'BRL', label: 'Real' },
]

const formatters = new Map<Currency, Intl.NumberFormat>()

export function formatMoney(cents: number, currency: Currency): string {
  let fmt = formatters.get(currency)
  if (!fmt) {
    fmt = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
    formatters.set(currency, fmt)
  }
  return fmt.format(cents / 100)
}

/** Centavos al texto que se muestra en un campo para editarlo: 150050 → "1500,5". */
export function centsToInput(cents: number): string {
  const whole = Math.floor(cents / 100)
  const frac = cents % 100
  return frac === 0 ? String(whole) : `${whole},${String(frac).padStart(2, '0').replace(/0$/, '')}`
}

/**
 * Convierte lo que escribe una persona en centavos.
 * Acepta "1500", "1.500", "1.500,50", "1500,5", "1500.50" y "$ 1.500".
 * Devuelve null si no es un monto válido y positivo.
 */
export function parseMoney(input: string): number | null {
  let s = input.trim().replace(/[$\s]/g, '').replace(/^[A-Z]{3}/i, '')
  if (!s || !/^[\d.,]+$/.test(s)) return null

  if (s.includes(',')) {
    // Formato rioplatense: el punto separa miles y la coma, decimales.
    if (s.indexOf(',') !== s.lastIndexOf(',')) return null
    s = s.replace(/\./g, '').replace(',', '.')
  } else {
    const dots = s.split('.').length - 1
    if (dots > 1) {
      s = s.replace(/\./g, '')
    } else if (dots === 1 && /^\d{1,3}\.\d{3}$/.test(s)) {
      // "1.500" se lee como mil quinientos, no como 1,5.
      s = s.replace('.', '')
    }
  }

  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  const [whole, frac = ''] = s.split('.')
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'))
  return cents > 0 && Number.isSafeInteger(cents) ? cents : null
}

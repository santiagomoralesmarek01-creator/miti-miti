import { describe, expect, it } from 'vitest'
import { formatMoney, parseMoney } from './money'

describe('parseMoney', () => {
  it.each([
    ['1500', 150000],
    ['1.500', 150000],
    ['1.500,50', 150050],
    ['1500,5', 150050],
    ['1500.50', 150050],
    ['12.5', 1250],
    ['$ 2.000.000', 200000000],
    ['0,99', 99],
  ])('lee %s como %i centavos', (input, cents) => {
    expect(parseMoney(input)).toBe(cents)
  })

  it.each(['', 'abc', '0', '-5', '1,2,3', '1.234,567', '12a'])('rechaza %j', (input) => {
    expect(parseMoney(input)).toBeNull()
  })
})

describe('formatMoney', () => {
  it('usa el formato argentino', () => {
    expect(formatMoney(150050, 'ARS').replace(/\s/g, ' ')).toBe('$ 1.500,5')
  })
})

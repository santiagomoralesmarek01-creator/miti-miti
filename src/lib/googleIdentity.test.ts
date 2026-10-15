import { describe, expect, it } from 'vitest'
import { createNonce, sha256Hex } from './googleIdentity'

describe('sha256Hex', () => {
  it('coincide con el valor de referencia de SHA-256', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})

describe('createNonce', () => {
  it('el hash es el SHA-256 en hexadecimal del nonce original', async () => {
    const { raw, hashed } = await createNonce()
    expect(hashed).toBe(await sha256Hex(raw))
  })

  it('cambia en cada llamada', async () => {
    const [a, b] = await Promise.all([createNonce(), createNonce()])
    expect(a.raw).not.toBe(b.raw)
  })
})

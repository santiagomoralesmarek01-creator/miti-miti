# Miti-Miti

**Las cuentas claras, miti-miti.** Una web para dividir gastos entre amigos:
anotás quién pagó qué y te dice quién le debe a quién, con la menor cantidad de
transferencias posible.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&logoColor=white)

## Qué hace

- **Portada** (`/`) que presenta el producto, con una **calculadora en vivo**:
  cambiás cuánto puso cada uno y se recalculan las transferencias al instante.
- **Grupos** (`/app`): cada uno con nombre, emoji, moneda e integrantes.
- **Gastos**: quién pagó, cuánto y entre quiénes se divide (no hace falta que
  sean todos).
- **Saldos**: cuánto debe o le deben a cada persona, con barras.
- **Cómo quedar a mano**: la lista mínima de transferencias, con un botón
  "Pagado ✓" que registra el pago y actualiza los saldos.
- Grupo de ejemplo para probar sin cargar nada. Modo claro y oscuro automático.

## Decisiones técnicas

- **Dinero en centavos enteros.** Nunca se usan decimales de punto flotante para
  montos. Al dividir, los centavos que sobran se reparten de a uno
  (`splitEvenly(1000, 3) → [334, 333, 333]`), así la suma siempre cierra.
- **Algoritmo para saldar** (`src/lib/settle.ts`): se calcula el saldo neto de
  cada persona (lo que pagó menos su parte) y, en cada paso, quien más debe le
  paga a quien más le deben. Garantiza como mucho *n − 1* transferencias para
  *n* personas.
- **Lectura de montos en formato local**: `1.500`, `1.500,50` y `1500.5` se
  interpretan como escribe la gente en Argentina (`src/lib/money.ts`).
- **Estado sin librerías**: un store chico con `useSyncExternalStore`. Por ahora
  guarda en `localStorage`; su API está pensada para cambiarla por Supabase.
- **Tests** con Vitest para la lógica de dinero y de saldos, incluida una prueba
  con grupos y montos al azar que verifica que todos queden en cero.
- **CI** en GitHub Actions: lint, tests y build en cada push.

## Correrlo

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests
npm run build    # versión de producción en dist/
```

## Próximos pasos

- [ ] Cuentas y grupos compartidos con Supabase (link de invitación, RLS).
- [ ] Gastos en otra moneda con la cotización del día (dólar blue / MEP).
- [ ] División por montos o porcentajes, no solo en partes iguales.
- [ ] Instalable como PWA.

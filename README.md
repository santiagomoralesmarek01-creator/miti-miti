# Miti-Miti

**Las cuentas claras, miti-miti.** Una web para dividir gastos entre amigos:
anotás quién pagó qué y te dice quién le debe a quién, con la menor cantidad de
transferencias posible.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres%20%2B%20Realtime-3ECF8E?logo=supabase&logoColor=white)
![Vitest](https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&logoColor=white)

## Qué hace

- **Portada** (`/`) que presenta el producto, con una **calculadora en vivo**:
  cambiás cuánto puso cada uno y se recalculan las transferencias al instante.
- **Cuentas sin contraseña**: entrás con Google o con un link que te llega por mail.
- **Grupos privados**: solo los ven sus integrantes. Se entra con un **link de
  invitación**; al abrirlo elegís quién sos de la lista (o te sumás con tu
  nombre). Si el link se filtra, se genera uno nuevo y el anterior deja de andar.
- **Gastos**: quién pagó, cuánto y entre quiénes se divide (no hace falta que
  sean todos).
- **Saldos**: cuánto debe o le deben a cada persona, con barras.
- **Cómo quedar a mano**: la lista mínima de transferencias, con un botón
  "Pagado ✓" que registra el pago y actualiza los saldos.
- **Tiempo real**: si alguien del grupo carga un gasto, el resto lo ve aparecer
  sin recargar.
- Modo claro y oscuro automático.

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
- **Seguridad en la base, no en el front** (`supabase/migrations/`): todas las
  tablas tienen *Row Level Security*; solo los integrantes de un grupo pueden
  leerlo o escribirlo. Unirse, crear grupos y regenerar el link pasan por
  funciones SQL (`join_group`, `create_group`, `reset_invite`), y el cliente
  solo puede cambiar el nombre de un integrante, nunca a qué cuenta pertenece.
- **Tests de permisos** (`supabase/tests/permisos.test.sql`): simulan a tres
  personas (quien crea, quien es invitada y quien no) y verifican qué puede ver
  y hacer cada una. Corren en la CI contra un Postgres real.
- **Estado sin librerías**: un store chico con `useSyncExternalStore` que cachea
  los grupos y se suscribe a los cambios de Supabase Realtime del grupo abierto.
- **Tests** con Vitest para la lógica de dinero, de saldos y del mapeo de datos,
  incluida una prueba con grupos y montos al azar que verifica que todos queden
  en cero.
- **CI** en GitHub Actions: lint, tests, build y tests de permisos en cada push.

## Correrlo en tu computadora

Necesitás Node 22 y Docker (para levantar Supabase local).

```bash
npm install
npx supabase start          # levanta Postgres, Auth y Realtime y aplica las migraciones
cp .env.example .env.local  # y pegá la API URL y la anon key que muestra el comando anterior
npm run dev                 # http://localhost:5173
```

Los mails con el link para entrar llegan a Mailpit: <http://127.0.0.1:54324>.

```bash
npm test           # tests de la lógica
npm run test:db    # tests de permisos (necesita un Postgres; usa PGHOST, PGUSER, etc.)
npm run build      # versión de producción en dist/
```

## Publicarlo

1. **Supabase**: creá un proyecto en <https://supabase.com> y aplicá la
   migración: `npx supabase link --project-ref TU-REF` y `npx supabase db push`
   (o pegá el archivo de `supabase/migrations/` en el *SQL Editor*).
2. **URLs permitidas**: en *Authentication → URL Configuration*, poné como
   *Site URL* el dominio de Vercel y agregá en *Redirect URLs*
   `https://TU-DOMINIO/**` y `http://localhost:5173/**`.
3. **Google**: en Google Cloud creá un *OAuth client ID* (tipo Web) con la
   *redirect URI* `https://TU-PROYECTO.supabase.co/auth/v1/callback`, y cargá el
   Client ID y el Secret en *Authentication → Providers → Google*.
4. **Vercel**: importá el repo y cargá las variables `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY`.
5. **Mails**: el servidor de mails que trae Supabase solo manda a los miembros
   del equipo del proyecto. Configurá un SMTP propio (por ejemplo Resend) en
   *Authentication → Emails → SMTP Settings*, y pegá las plantillas en castellano
   de `supabase/templates/` en *Authentication → Emails → Templates*:
   `magic-link.html` en **Magic Link** y `confirm-signup.html` en
   **Confirm signup**.

## Próximos pasos

- [ ] Gastos en otra moneda con la cotización del día (dólar blue / MEP).
- [ ] División por montos o porcentajes, no solo en partes iguales.
- [ ] Editar gastos y ver quién cargó cada uno.
- [ ] Instalable como PWA.

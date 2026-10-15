import { Link } from 'react-router-dom'
import { Header } from '../components/Header'

const CONTACTO = 'hola@miti-miti.com.ar'

const SECCIONES: { titulo: string; parrafos: string[] }[] = [
  {
    titulo: 'Qué datos guardamos',
    parrafos: [
      'Tu mail, para que puedas entrar. Si entrás con Google, también tu nombre, que usamos solo para sugerirte cómo aparecer en tus grupos.',
      'Lo que cargás en la app: los grupos, los nombres de sus integrantes, los gastos y los pagos.',
    ],
  },
  {
    titulo: 'Para qué los usamos',
    parrafos: [
      'Únicamente para que Miti-Miti funcione: que puedas entrar, ver tus grupos y calcular quién le debe a quién.',
      'No vendemos ni compartimos tus datos, no mostramos publicidad y no los usamos para otra cosa.',
    ],
  },
  {
    titulo: 'Quién puede verlos',
    parrafos: [
      'Cada grupo lo ven solo sus integrantes, es decir, las personas que entraron con el link de invitación. Nadie más puede leerlo.',
      'Los datos se guardan en Supabase, el servicio que usamos como base de datos, y los mails de ingreso se envían a través de Resend.',
    ],
  },
  {
    titulo: 'Borrar tus datos',
    parrafos: [
      'Quien crea un grupo puede borrarlo desde la app, con todos sus gastos.',
      `Para borrar tu cuenta y todo lo asociado a ella, escribinos a ${CONTACTO} desde el mail con el que entrás y lo hacemos.`,
    ],
  },
]

export function Privacy() {
  return (
    <>
      <Header variant="landing" />
      <main className="app contenedor legal">
        <Link to="/" className="volver">
          ← Inicio
        </Link>
        <span className="etiqueta">Privacidad</span>
        <h1>Tus datos, claros como tus cuentas.</h1>
        <p className="legal-bajada">
          Miti-Miti es un proyecto personal para dividir gastos entre amigos. Esta página cuenta, sin letra chica, qué datos guardamos y qué hacemos
          con ellos.
        </p>
        {SECCIONES.map((s) => (
          <section className="caja legal-seccion" key={s.titulo}>
            <h2>{s.titulo}</h2>
            {s.parrafos.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
        <p className="legal-pie">
          ¿Dudas? Escribinos a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>. Última actualización: octubre de 2026.
        </p>
      </main>
    </>
  )
}

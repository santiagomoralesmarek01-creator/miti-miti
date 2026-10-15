import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Header } from '../components/Header'
import { LogoMark } from '../components/Logo'
import { MiniDemo } from '../components/MiniDemo'

const CINTA = ['Asados', 'Viajes', 'Depto compartido', 'Regalos', 'Cumpleaños', 'Vacaciones', 'Expensas', 'Salidas', 'La vaquita']

const FUNCIONES = [
  { emoji: '🧮', color: '--amarillo', titulo: 'Cuentas sin decimales raros', texto: 'Todo se calcula en centavos. Nadie pierde ni gana un peso por redondeo.' },
  { emoji: '🎯', color: '--rosa', titulo: 'Gastos para algunos', texto: '¿Tomi no tomó vino? Elegí quiénes participan de cada gasto y listo.' },
  { emoji: '⚡', color: '--verde', titulo: 'Menos transferencias', texto: 'Miti-Miti cruza las deudas y te dice el camino más corto para quedar a mano.' },
  { emoji: '🌎', color: '--celeste', titulo: 'En tu moneda', texto: 'Pesos, dólares, reales o euros. Cada grupo con la suya.' },
  { emoji: '📱', color: '--violeta', titulo: 'En vivo, desde el navegador', texto: 'No hay que instalar nada. Si alguien carga un gasto, lo ves aparecer al instante.' },
  { emoji: '🔒', color: '--naranja', titulo: 'Solo con invitación', texto: 'Cada grupo lo ven únicamente sus integrantes. Entrás con Google o con un link por mail.' },
]

const PREGUNTAS = [
  { p: '¿Es gratis?', r: 'Sí. Miti-Miti es un proyecto personal y no tiene planes pagos ni publicidad.' },
  {
    p: '¿Cómo calcula quién le paga a quién?',
    r: 'Suma lo que puso cada persona, le resta su parte de cada gasto y obtiene un saldo. Después empareja a quien más debe con quien más le deben, una y otra vez, hasta que todos quedan en cero. Así nunca hacen falta más transferencias que personas menos una.',
  },
  { p: '¿Qué pasa si el gasto no se divide justo?', r: 'Los centavos que sobran se reparten de a uno, para que la suma siempre cierre exacta.' },
  {
    p: '¿Quién puede ver mis grupos?',
    r: 'Solo sus integrantes. Para entrar hace falta el link de invitación y una cuenta. Si el link se comparte donde no debía, generás uno nuevo y el anterior deja de funcionar.',
  },
  { p: '¿Necesito contraseña?', r: 'No. Entrás con tu cuenta de Google o con un link que te llega por mail.' },
]

export function Landing() {
  return (
    <>
      <Header variant="landing" />
      <main>
        <section className="hero">
          <div className="contenedor">
            <div>
              <span className="etiqueta">Dividí gastos sin dramas</span>
              <h1>
                Las cuentas claras, <span className="resaltado">miti-miti.</span>
              </h1>
              <p className="bajada">
                Anotá quién pagó qué y Miti-Miti te dice quién le debe a quién, con la menor cantidad de transferencias.
              </p>
              <div className="acciones">
                <Link to="/app" className="boton boton--grande">
                  Armar un grupo
                </Link>
                <a href="#probala" className="boton boton--grande boton--papel">
                  Probar la calculadora
                </a>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="ticket ticket--1 caja">
                <div className="sticker">¡a mano!</div>
                <p className="etiqueta">🏖️ Finde en la costa</p>
                <p className="monto" style={{ marginTop: 12 }}>
                  $ 136.500
                </p>
                <p>gastados entre 4</p>
              </div>
              <div className="ticket ticket--2 caja">
                {[
                  ['⛽', 'Nafta', '$ 48.000'],
                  ['🛒', 'Súper', '$ 32.600'],
                  ['🍕', 'Pizza', '$ 28.500'],
                ].map(([e, d, m]) => (
                  <div className="renglon" key={d}>
                    <span>
                      {e} {d}
                    </span>
                    <strong>{m}</strong>
                  </div>
                ))}
              </div>
              <div className="ticket ticket--3 caja">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name="Nico" index={3} />
                  <span style={{ fontWeight: 700 }}>→</span>
                  <Avatar name="Tomi" index={1} />
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--fuente-titulo)', fontSize: '1.4rem' }}>$ 21.075</span>
                </div>
                <p style={{ marginTop: 8, fontWeight: 600 }}>Nico le pasa a Tomi y listo.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="cinta" aria-hidden="true">
          <div className="cinta-pista">
            {[...CINTA, ...CINTA].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>

        <section className="seccion" id="como-funciona">
          <div className="contenedor">
            <div className="seccion-titulo">
              <span className="etiqueta">Cómo funciona</span>
              <h2>Tres pasos y nadie queda debiendo.</h2>
            </div>
            <div className="pasos">
              {[
                ['Armá el grupo', 'Ponele nombre, un emoji y sumá a la gente. El asado del domingo, el viaje, el depto.'],
                ['Cargá los gastos', 'Quién pagó, cuánto y entre quiénes se divide. Lo hacés en segundos, desde el celu.'],
                ['Quedá a mano', 'Miti-Miti te muestra quién le transfiere a quién. Marcás los pagos y listo.'],
              ].map(([t, d], i) => (
                <article className="paso caja" key={t}>
                  <span className="numero">{i + 1}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="seccion" id="probala" style={{ paddingTop: 0 }}>
          <div className="contenedor">
            <div className="seccion-titulo">
              <span className="etiqueta">Probala acá mismo</span>
              <h2>Cambiá los números y mirá la magia.</h2>
            </div>
            <MiniDemo />
          </div>
        </section>

        <section className="seccion" style={{ paddingTop: 0 }}>
          <div className="contenedor">
            <div className="seccion-titulo">
              <span className="etiqueta">Lo que trae</span>
              <h2>Hecha para los grupos de verdad.</h2>
            </div>
            <div className="funciones">
              {FUNCIONES.map((f) => (
                <article className="funcion caja" key={f.titulo}>
                  <span className="emoji" style={{ background: `var(${f.color})` }}>
                    {f.emoji}
                  </span>
                  <h3>{f.titulo}</h3>
                  <p>{f.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="seccion" id="preguntas" style={{ paddingTop: 0 }}>
          <div className="contenedor">
            <div className="seccion-titulo">
              <span className="etiqueta">Preguntas</span>
              <h2>Lo que siempre preguntan.</h2>
            </div>
            <div className="preguntas">
              {PREGUNTAS.map((q) => (
                <details className="caja" key={q.p}>
                  <summary>{q.p}</summary>
                  <p>{q.r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="contenedor">
          <div className="final caja">
            <h2>Cuentas claras, amistades largas.</h2>
            <p>Armá tu primer grupo en menos de un minuto.</p>
            <Link to="/app" className="boton boton--grande">
              Empezar ahora
            </Link>
          </div>
        </section>
      </main>

      <footer className="pie">
        <div className="contenedor">
          <span className="logo" style={{ fontSize: '1.1rem' }}>
            <LogoMark /> miti·miti
          </span>
          <span>
            Hecho con React y TypeScript en Argentina · <Link to="/privacidad">Privacidad</Link>
          </span>
        </div>
      </footer>
    </>
  )
}

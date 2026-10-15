import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Los links de invitación (/unirse/…) se comparten por WhatsApp, que no ejecuta
// JavaScript: lee solo el HTML. Esta copia de index.html cambia la vista previa
// para que diga que te invitaron. Vercel la sirve en /unirse/* (vercel.json).
const INVITE = {
  title: 'Te invitaron a un grupo en Miti-Miti',
  description: 'Sumate al grupo para dividir los gastos y quedar a mano. Entrá con el link y elegí quién sos.',
  image: 'https://miti-miti.com.ar/og-invitacion.png',
  alt: 'Miti-Miti: te invitaron a un grupo. Sumate y quedemos a mano.',
}

export function inviteHtml(html: string): string {
  const set = (attr: 'property' | 'name', key: string, value: string) => {
    const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`)
    if (!re.test(html)) throw new Error(`Falta la meta ${key} en index.html`)
    html = html.replace(re, `$1${value}$2`)
  }
  set('property', 'og:title', INVITE.title)
  set('name', 'twitter:title', INVITE.title)
  set('property', 'og:description', INVITE.description)
  set('name', 'twitter:description', INVITE.description)
  set('property', 'og:image', INVITE.image)
  set('name', 'twitter:image', INVITE.image)
  set('property', 'og:image:alt', INVITE.alt)
  // Sin og:url: si apuntara a la portada, algunas apps mostrarían esa vista previa.
  html = html.replace(/\s*<meta property="og:url" content="[^"]*" \/>/, '')
  return html.replace(/<title>[^<]*<\/title>/, `<title>${INVITE.title}</title>`)
}

function invitePage(): Plugin {
  let outDir = 'dist'
  return {
    name: 'pagina-de-invitacion',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    // Al final del build, cuando index.html ya tiene los nombres finales de los assets.
    closeBundle() {
      const html = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      writeFileSync(resolve(outDir, 'unirse.html'), inviteHtml(html))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), invitePage()],
})

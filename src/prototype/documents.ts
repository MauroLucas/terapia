import type * as Phaser from 'phaser'
import { HAND_FONT } from './art'
import { overlay, text } from './ui'

// Objetos que Jorge se guarda. Se ven al encontrarlos y se pueden volver a ver desde el diario (pestaña Objetos).

type Build = (scene: Phaser.Scene, c: Phaser.GameObjects.Container, w: number, h: number) => void
interface Page {
  build: Build
  opts: { w?: number; h?: number; paper?: number }
}

export type ObjetoId = 'foto' | 'notas' | 'notaCajon' | 'banner' | 'informe' | 'llave' | 'papelHigienico' | 'ficha' | 'sortija' | 'boletin' | 'cuaderno' | 'fotoFiesta' | 'papelito' | 'servilleta' | 'boleto' | 'informeClaro' | 'numeroMaria'

// Boletín de la Sesión 2. Firmado: la firma de la mamá, un garabato
function boletinPage(firmado: boolean): Page {
  return {
    opts: { w: 560, h: 520, paper: 0xe8e2cf },
    build: (scene, c) => {
      const ink = '#2b3140'
      c.add(text(scene, 0, -220, 'BOLETÍN DE CALIFICACIONES', 22, ink, { fontStyle: 'bold' }).setOrigin(0.5))
      c.add(text(scene, 0, -190, '3.er año · Jorge', 17, '#4a5060').setOrigin(0.5))
      const notas: [string, string, string][] = [
        ['Lengua', '7', ink],
        ['Historia', '6', ink],
        ['Matemática', '3', '#b11'],
        ['Biología', '6', ink],
        ['Inglés', '5', ink],
      ]
      notas.forEach(([m, n, col], i) => {
        c.add(text(scene, -200, -140 + i * 38, m, 19, ink))
        c.add(text(scene, 180, -140 + i * 38, n, 22, col, { fontStyle: 'bold' }).setOrigin(1, 0))
      })
      c.add(scene.add.rectangle(0, 72, 440, 2, 0x8a8f99))
      c.add(text(scene, 0, 104, 'La preceptora quiere hablar con el padre.', 17, '#b11', { fontFamily: HAND_FONT }).setOrigin(0.5))
      c.add(text(scene, -200, 170, 'Firma del padre:', 18, ink))
      c.add(scene.add.rectangle(80, 192, 220, 2, 0x2b3140))
      if (firmado) {
        const g = scene.add.graphics().lineStyle(2.5, 0x22305a)
        g.beginPath()
        g.moveTo(-10, 186)
        for (let x = 0; x <= 170; x += 6) g.lineTo(-10 + x, 180 + Math.sin(x / 9) * 9 - (x > 120 ? (x - 120) * 0.25 : 0))
        g.strokePath()
        c.add(g)
      }
    },
  }
}

export const OBJETOS: Record<ObjetoId, { nombre: string; texto: string; pages: Page[] }> = {
  foto: {
    nombre: 'Foto',
    texto: 'Estaba en la billetera. Una señora conmigo. Atrás dice "12/08".',
    pages: [
      {
        opts: { w: 520, h: 400, paper: 0x2b2018 },
        build: (scene, c) => {
          const g = scene.add.graphics()
          g.fillStyle(0xf4efe2).fillRect(-230, -170, 460, 340)
          g.fillStyle(0x8fa7b8).fillRect(-210, -150, 420, 260)
          g.fillStyle(0x5f7d4f).fillRect(-210, 50, 420, 60)
          // Jorge
          g.fillStyle(0x3e7d3c).fillRoundedRect(-110, -10, 70, 120, 14)
          g.fillStyle(0xe7c09a).fillCircle(-75, -45, 30)
          g.fillStyle(0x111114).slice(-75, -50, 31, Math.PI, Math.PI * 2, false).fillPath()
          // La mujer de la foto (su mamá, él no la reconoce)
          g.fillStyle(0x8a5a7a).fillRoundedRect(20, -5, 74, 115, 14)
          g.fillStyle(0xe2b996).fillCircle(57, -40, 28)
          g.fillStyle(0x9a9a9a).slice(57, -45, 31, Math.PI, Math.PI * 2, false).fillPath()
          g.fillRect(28, -48, 10, 34).fillRect(76, -48, 10, 34)
          g.lineStyle(2, 0x222222)
          g.beginPath().arc(-75, -38, 10, 0.3, Math.PI - 0.3).strokePath()
          g.beginPath().arc(57, -33, 10, 0.3, Math.PI - 0.3).strokePath()
          c.add(g)
        },
      },
      {
        // Dorso de la foto: la fecha es el código del candado
        opts: { w: 520, h: 400, paper: 0x2b2018 },
        build: (scene, c) => {
          c.add(scene.add.rectangle(0, 0, 460, 340, 0xf4efe2))
          c.add(text(scene, 0, 0, '12/08', 64, '#2a2a5a', { fontFamily: HAND_FONT }).setOrigin(0.5).setAngle(-4))
        },
      },
    ],
  },
  notas: {
    nombre: 'Notas de la heladera',
    texto: 'Notas que me dejé a mí mismo, con mi letra.',
    pages: [
      {
        opts: { w: 760, h: 600, paper: 0xbfc3c8 },
        build: (scene, c) => {
          const notes: [number, number, number, number, string][] = [
            [-170, -130, -3, 0xf2e35a, 'Las llaves SIEMPRE\nen la mesa\nde la cocina.'],
            [150, -120, 4, 0xf2a65a, 'Pastilla:\n1 a la mañana.\nNO saltearla.'],
            [-150, 120, 2, 0xf2e35a, 'Si no te acordás\nde algo, no entres\nen pánico.\nEstá todo anotado.'],
            [160, 130, -4, 0x9ee07a, 'Neural →\nmartes y jueves.'],
          ]
          for (const [x, y, rot, color, msg] of notes) {
            const r = scene.add.rectangle(0, 0, 250, 200, color).setStrokeStyle(1, 0x000000, 0.15)
            const t = text(scene, 0, 0, msg, 22, '#2a2a2a', { fontFamily: HAND_FONT, align: 'center' }).setOrigin(0.5)
            c.add(scene.add.container(x, y, [r, t]).setAngle(rot))
          }
        },
      },
    ],
  },
  notaCajon: {
    nombre: 'Nota del cajón',
    texto: 'Estaba pegada en el cajón con candado. Es mi letra.',
    pages: [
      {
        opts: { w: 420, h: 340, paper: 0x4a3628 },
        build: (scene, c) => {
          c.add(scene.add.rectangle(0, 0, 300, 240, 0xf2e35a).setStrokeStyle(1, 0x000000, 0.15).setAngle(-2))
          c.add(text(scene, 0, 0, 'Te extraño,\nmamá.', 34, '#2a2a2a', { fontFamily: HAND_FONT, align: 'center' }).setOrigin(0.5).setAngle(-2))
        },
      },
    ],
  },
  banner: {
    nombre: 'Banner de Neural',
    texto: 'Estaba en la mesa, debajo de la basura. Neural es un centro para recuperar la memoria.',
    pages: [
      {
        opts: { w: 720, h: 540, paper: 0xf4f2ec },
        build: (scene, c, _w, h) => {
          let y = -h / 2 + 40
          const add = (s: string, size: number, color: string, extra: Phaser.Types.GameObjects.Text.TextStyle = {}, gap = 10) => {
            const t = text(scene, 0, y, s, size, color, { align: 'center', wordWrap: { width: 620 }, ...extra }).setOrigin(0.5, 0)
            c.add(t)
            y += t.height + gap
          }
          add('NEURAL', 54, '#2f5fb8', { fontStyle: 'bold' }, 0)
          add('Centro de Rehabilitación de la Memoria', 20, '#556', {}, 18)
          add('Tus recuerdos siguen ahí. Te ayudamos a encontrarlos.', 22, '#222', { fontStyle: 'bold' }, 14)
          add('¿Olvidás nombres, lugares o momentos importantes?\n¿Sentís que tu propia vida es un rompecabezas incompleto?', 17, '#333', {}, 12)
          add('En Neural combinamos neurociencia e inteligencia artificial para acompañarte a recuperar tu memoria.', 17, '#333', {}, 14)
          add('Cómo funciona', 19, '#2f5fb8', { fontStyle: 'bold' }, 6)
          add('1. Mientras dormís, nuestro sistema de IA interpreta tus sueños.\n2. Tu médico ve en pantalla lo que soñás, en tiempo real.\n3. Con una inducción guiada, te lleva a un sueño lúcido donde\npodés recorrer tus recuerdos de forma consciente y segura.', 16, '#333', { align: 'left' }, 14)
          add('Terapia de sueño lúcido asistida por IA · Sesiones personalizadas', 14, '#777', { fontStyle: 'italic' }, 14)
          add('NEURAL — Volvé a ser vos.', 24, '#2f5fb8', { fontStyle: 'bold' })
        },
      },
    ],
  },
  informe: {
    nombre: 'Informe de Neural',
    texto: 'Estaba en el cajón con candado. Alguien tachó la causa.',
    pages: [
      {
        opts: { w: 700, h: 560, paper: 0xf7f6f1 },
        build: (scene, c, w, h) => {
          let y = -h / 2 + 36
          const add = (s: string, size: number, color = '#222', extra: Phaser.Types.GameObjects.Text.TextStyle = {}, gap = 8) => {
            const t = text(scene, -w / 2 + 50, y, s, size, color, { wordWrap: { width: w - 100 }, ...extra })
            c.add(t)
            y += t.height + gap
            return t
          }
          add('NEURAL — Centro de Rehabilitación de la Memoria', 18, '#2f5fb8', { fontStyle: 'bold' }, 2)
          add('Informe de seguimiento', 26, '#222', { fontStyle: 'bold' }, 20)
          add('Paciente: Jorge\nEdad: 40 años\nSesiones realizadas: 11', 18, '#333', {}, 20)
          add('Observaciones:', 18, '#222', { fontStyle: 'bold' }, 4)
          const obs = add('El paciente presenta pérdida de memoria autobiográfica de origen a determinar. Responde bien a la inducción de sueño lúcido. Recupera con facilidad recuerdos neutros, pero muestra fuerte resistencia ante recuerdos vinculados a', 18, '#333', {}, 6)
          // La causa está tachada con marcador
          c.add(scene.add.rectangle(-w / 2 + 50, obs.y + obs.height + 4, 280, 24, 0x111111).setOrigin(0, 0).setAngle(-1))
          y += 40
          add('Recomendación: continuar con las sesiones. No interrumpir el tratamiento.', 18, '#333', { fontStyle: 'bold' })
        },
      },
    ],
  },
  informeClaro: {
    nombre: 'Informe de Neural (otra vez)',
    texto: 'El mismo informe. La parte tachada ahora se lee a través del marcador.',
    pages: [
      {
        opts: { w: 700, h: 560, paper: 0xf7f6f1 },
        build: (scene, c, w, h) => {
          let y = -h / 2 + 36
          const add = (s: string, size: number, color = '#222', extra: Phaser.Types.GameObjects.Text.TextStyle = {}, gap = 8) => {
            const t = text(scene, -w / 2 + 50, y, s, size, color, { wordWrap: { width: w - 100 }, ...extra })
            c.add(t)
            y += t.height + gap
            return t
          }
          add('NEURAL — Centro de Rehabilitación de la Memoria', 18, '#2f5fb8', { fontStyle: 'bold' }, 2)
          add('Informe de seguimiento', 26, '#222', { fontStyle: 'bold' }, 20)
          add('Paciente: Jorge\nEdad: 40 años\nSesiones realizadas: 11', 18, '#333', {}, 20)
          add('Observaciones:', 18, '#222', { fontStyle: 'bold' }, 4)
          const obs = add('El paciente presenta pérdida de memoria autobiográfica de origen a determinar. Responde bien a la inducción de sueño lúcido. Recupera con facilidad recuerdos neutros, pero muestra fuerte resistencia ante recuerdos vinculados a', 18, '#333', {}, 6)
          // Después de la Sesión 7, la tachadura se gastó: se lee lo que había abajo
          c.add(text(scene, -w / 2 + 52, obs.y + obs.height + 4, 'la muerte de su madre.', 18, '#333'))
          c.add(scene.add.rectangle(-w / 2 + 50, obs.y + obs.height + 4, 280, 24, 0x111111, 0.28).setOrigin(0, 0).setAngle(-1))
          y += 40
          add('Recomendación: continuar con las sesiones. No interrumpir el tratamiento.', 18, '#333', { fontStyle: 'bold' })
        },
      },
    ],
  },
  llave: {
    nombre: 'Llave',
    texto: 'La llave de la puerta. Estaba debajo del banner.',
    pages: [],
  },
  papelHigienico: {
    nombre: 'Papel higiénico',
    texto: 'Un rollo entero. Estaba en un cubículo del baño de Neural.',
    pages: [],
  },
  boletin: {
    nombre: 'Boletín',
    texto: 'Mi boletín de tercer año. Lo tenía que firmar mi papá. Lo firmó mamá.',
    pages: [boletinPage(false), boletinPage(true)],
  },
  cuaderno: {
    nombre: 'Cuaderno de matemática',
    texto: 'Mi cuaderno de cuando tenía quince. En los márgenes, la letra de María.',
    pages: [
      {
        opts: { w: 600, h: 520, paper: 0xf4f1e6 },
        build: (scene, c) => {
          const g = scene.add.graphics()
          g.lineStyle(1, 0x9fb4c8, 0.7)
          for (let y = -220; y <= 230; y += 26) g.lineBetween(-280, y, 280, y)
          g.lineStyle(2, 0xd98080, 0.7).lineBetween(-200, -250, -200, 250)
          c.add(g)
          const mine = '#2b3140'
          c.add(text(scene, -180, -210, 'Ecuaciones', 24, mine, { fontFamily: HAND_FONT }))
          c.add(text(scene, -180, -160, '2x + 3 = 11', 22, mine, { fontFamily: HAND_FONT }))
          c.add(text(scene, -180, -132, '2x = 11 + 3   ✗', 22, '#9a4040', { fontFamily: HAND_FONT }))
          c.add(text(scene, -180, -80, '2x = 11 − 3', 22, mine, { fontFamily: HAND_FONT }))
          c.add(text(scene, -180, -54, 'x = 4', 22, mine, { fontFamily: HAND_FONT }))
          // La letra de María, en otro color
          const hers = '#7a3b8a'
          c.add(text(scene, 40, -150, '¡Restás, no sumás!', 20, hers, { fontFamily: HAND_FONT }).setAngle(-4))
          c.add(text(scene, 60, -64, '¡Bien, Jorge!\nVes que podés.', 20, hers, { fontFamily: HAND_FONT }).setAngle(-3))
          c.add(text(scene, -150, 60, 'Martes, 18 hs, en la plaza. — M.', 20, hers, { fontFamily: HAND_FONT }).setAngle(-2))
          c.add(text(scene, -180, 140, 'x + 5 = 12', 22, mine, { fontFamily: HAND_FONT }))
          c.add(text(scene, -180, 166, 'x = 7', 22, mine, { fontFamily: HAND_FONT }))
          c.add(text(scene, 70, 166, '✓', 30, hers, { fontFamily: HAND_FONT }))
        },
      },
    ],
  },
  fotoFiesta: {
    nombre: 'Foto de la fiesta',
    texto: 'María y yo en la fiesta de egresados, a los diecisiete. Es la foto que faltaba en el portarretratos.',
    pages: [
      {
        // La foto con flash: fondo oscuro del salón, guirnaldas, los dos abrazados (provisorio)
        opts: { w: 520, h: 420, paper: 0x2b2018 },
        build: (scene, c) => {
          const g = scene.add.graphics()
          g.fillStyle(0xf4efe2).fillRect(-230, -180, 460, 360)
          g.fillStyle(0x2a2238).fillRect(-210, -160, 420, 280)
          const colores = [0xe0b04a, 0xd9534f, 0x5aa7c8, 0x9ee07a]
          for (let i = 0; i < 14; i++) g.fillStyle(colores[i % 4]).fillCircle(-200 + i * 30, -140 + Math.sin(i * 0.9) * 8, 5)
          g.fillStyle(0xfff3c8, 0.18).fillCircle(150, -110, 70)
          // Jorge (suéter verde) y María (vestido bordó), abrazados
          g.fillStyle(0x3e7d3c).fillRoundedRect(-100, -10, 76, 130, 14)
          g.fillStyle(0xe7c09a).fillCircle(-62, -48, 30)
          g.fillStyle(0x111114).slice(-62, -53, 31, Math.PI, Math.PI * 2, false).fillPath()
          g.fillStyle(0x2a1d16).fillRoundedRect(4, -86, 64, 110, 18)
          g.fillStyle(0x8a3048).fillRoundedRect(4, -6, 64, 126, 14)
          g.fillStyle(0xe9c6a4).fillCircle(36, -46, 28)
          g.fillStyle(0x2a1d16).slice(36, -52, 30, Math.PI, Math.PI * 2, false).fillPath()
          g.fillStyle(0x3e7d3c).fillRoundedRect(-30, 20, 50, 14, 7)
          g.lineStyle(2, 0x222222)
          g.beginPath().arc(-62, -42, 10, 0.3, Math.PI - 0.3).strokePath()
          g.beginPath().arc(36, -40, 10, 0.3, Math.PI - 0.3).strokePath()
          c.add(g)
          c.add(text(scene, 150, 148, 'J y M', 22, '#7a3b8a', { fontFamily: HAND_FONT }).setOrigin(0.5).setAngle(-5))
        },
      },
    ],
  },
  papelito: {
    nombre: 'Papelito',
    texto: 'El número de papá, con la letra de mamá. Me lo dio la noche de la pelea. Nunca lo llamé.',
    pages: [
      {
        // Un papel arrancado de una libreta, con la letra de la mamá (número inventado, provisorio)
        opts: { w: 440, h: 300, paper: 0x2b2018 },
        build: (scene, c) => {
          const g = scene.add.graphics()
          g.fillStyle(0xf2ecd8).fillRect(-170, -100, 340, 200)
          g.lineStyle(1, 0xc9bfa0)
          for (let y = -60; y <= 80; y += 28) g.lineBetween(-160, y, 160, y)
          g.lineStyle(2, 0xd9d1b8).lineBetween(-60, -100, -60, 100)
          c.add(g)
          c.add(text(scene, 0, -38, 'Papá', 30, '#2a3a6a', { fontFamily: HAND_FONT }).setOrigin(0.5).setAngle(-3))
          c.add(text(scene, 0, 26, '4555-0142', 40, '#2a3a6a', { fontFamily: HAND_FONT }).setOrigin(0.5).setAngle(-2))
        },
      },
    ],
  },
  servilleta: {
    nombre: 'Servilleta del bar',
    texto: 'María la dibujó en el bar, la noche que nos reencontramos: la ventana de la cocina, con plantas. Me la guardé.',
    pages: [
      {
        // Una servilleta de papel, un poco mojada, con un dibujo en birome (provisorio)
        opts: { w: 420, h: 420, paper: 0x2b2018 },
        build: (scene, c) => {
          const g = scene.add.graphics()
          g.fillStyle(0xf4f2ec).fillRect(-160, -160, 320, 320)
          g.lineStyle(2, 0xd9d4c4).strokeRect(-150, -150, 300, 300)
          g.fillStyle(0xc9d6e0, 0.35).fillCircle(90, 90, 46).fillCircle(-100, 70, 30)
          // La ventana de la cocina, con plantas
          const ink = 0x2a3a6a
          g.lineStyle(3, ink).strokeRect(-80, -90, 160, 120).lineBetween(0, -90, 0, 30).lineBetween(-95, 30, 95, 30)
          for (const [px, h] of [[-55, 34], [-15, 46], [30, 28], [60, 40]] as [number, number][]) {
            g.lineStyle(2, ink).strokeRect(px - 10, 30, 20, 16)
            g.lineBetween(px, 30, px, 30 - h).lineBetween(px, 30 - h * 0.6, px - 12, 30 - h * 0.8).lineBetween(px, 30 - h * 0.4, px + 12, 30 - h * 0.6)
          }
          c.add(g)
          c.add(text(scene, 0, 96, 'así', 26, '#2a3a6a', { fontFamily: HAND_FONT }).setOrigin(0.5).setAngle(-4))
        },
      },
    ],
  },
  numeroMaria: {
    nombre: 'El número de María',
    texto: 'María me lo dio en la vereda del velorio de mamá. Su número nuevo. "Llamame."',
    pages: [
      {
        // Una hoja chiquita arrancada de una agenda, con la letra de María en violeta (número inventado, provisorio)
        opts: { w: 440, h: 300, paper: 0x1d1f2a },
        build: (scene, c) => {
          const g = scene.add.graphics()
          g.fillStyle(0xf7f4ec).fillRect(-160, -96, 320, 192)
          g.lineStyle(1, 0xd9d4e6)
          for (let y = -56; y <= 76; y += 26) g.lineBetween(-150, y, 150, y)
          g.fillStyle(0xd9d4e6).fillCircle(-148, -84, 3).fillCircle(-148, 84, 3)
          c.add(g)
          c.add(text(scene, 0, -44, 'María', 30, '#5a3a8a', { fontFamily: HAND_FONT }).setOrigin(0.5).setAngle(-3))
          c.add(text(scene, 0, 10, '15 4555-0838', 36, '#5a3a8a', { fontFamily: HAND_FONT }).setOrigin(0.5).setAngle(-2))
          const l = text(scene, 40, 62, 'llamame', 24, '#5a3a8a', { fontFamily: HAND_FONT }).setOrigin(0.5).setAngle(-4)
          c.add(l)
          const u = scene.add.graphics().lineStyle(2, 0x5a3a8a).lineBetween(-4, 78, 86, 72)
          c.add(u)
        },
      },
    ],
  },
  boleto: {
    nombre: 'Boletos del micro',
    texto: 'Los dos boletos del micro a San Rafael, el del viaje con mamá. Los guardé en la cómoda.',
    pages: [
      {
        // Dos boletos de micro de larga distancia, uno arriba del otro (provisorio)
        opts: { w: 560, h: 420, paper: 0x2b2018 },
        build: (scene, c) => {
          for (const [dy, asiento] of [[-80, '23'], [70, '24']] as [number, string][]) {
            const g = scene.add.graphics()
            g.fillStyle(0xf2ecd8).fillRect(-230, dy - 60, 460, 120)
            g.fillStyle(0x2f6fa0).fillRect(-230, dy - 60, 460, 26)
            g.lineStyle(2, 0xc9bfa0).lineBetween(130, dy - 60, 130, dy + 60)
            c.add(g)
            c.add(text(scene, -215, dy - 56, 'MICRO · LARGA DISTANCIA', 15, '#f2ecd8', { fontStyle: 'bold' }))
            c.add(text(scene, -215, dy - 22, 'Buenos Aires → San Rafael (Mza.)', 19, '#2b3140'))
            c.add(text(scene, -215, dy + 10, 'Salida: 11/08 · 21:30 hs', 17, '#4a5060'))
            c.add(text(scene, 145, dy - 22, 'Asiento', 14, '#4a5060'))
            c.add(text(scene, 145, dy, asiento, 30, '#2b3140', { fontStyle: 'bold' }))
          }
          c.add(text(scene, 0, 175, 'Llegada: 12/08', 18, '#e8dcc0', { fontFamily: HAND_FONT }).setOrigin(0.5))
        },
      },
    ],
  },
  sortija: {
    nombre: 'Sortija',
    texto: 'La sortija de la calesita de la feria. Estaba en una caja de cosas de cuando era chico, con un papelito de mamá: "el año que empezó segundo grado".',
    pages: [
      {
        opts: { w: 420, h: 380, paper: 0x2b2018 },
        build: (scene, c) => {
          const g = scene.add.graphics()
          g.lineStyle(26, 0xc8962e).strokeCircle(0, -10, 92)
          g.lineStyle(10, 0xe0b04a).strokeCircle(0, -10, 92)
          g.lineStyle(5, 0xfff0b8).beginPath().arc(0, -10, 92, Math.PI * 1.08, Math.PI * 1.45).strokePath()
          c.add(g)
          c.add(text(scene, 0, 140, 'La sortija de la calesita', 22, '#e8dcc0', { fontFamily: HAND_FONT }).setOrigin(0.5))
        },
      },
      {
        // El papelito que venía con la sortija, con la letra de la mamá: la pista de la edad en La primera noche (provisorio)
        opts: { w: 460, h: 260, paper: 0xefe6cf },
        build: (scene, c) => {
          const ink = '#3a3550'
          c.add(text(scene, 0, -70, 'La sortija de Jorgito.', 30, ink, { fontFamily: HAND_FONT }).setOrigin(0.5))
          c.add(text(scene, 0, 0, 'De la feria, el año', 26, ink, { fontFamily: HAND_FONT }).setOrigin(0.5))
          c.add(text(scene, 0, 44, 'que empezó segundo grado.', 26, ink, { fontFamily: HAND_FONT }).setOrigin(0.5))
        },
      },
    ],
  },
  ficha: {
    nombre: 'Ficha',
    texto: 'Una ficha para la máquina de bebidas. Me la dio el del baño.',
    pages: [],
  },
}

// Muestra una página de un objeto en primer plano
export function showPage(scene: Phaser.Scene, id: ObjetoId, i: number) {
  const p = OBJETOS[id].pages[i]
  return overlay(scene, (c, w, h) => p.build(scene, c, w, h), p.opts)
}

// Muestra un objeto en primer plano, página por página
export async function showObjeto(scene: Phaser.Scene, id: ObjetoId) {
  for (let i = 0; i < OBJETOS[id].pages.length; i++) await showPage(scene, id, i)
}

import type * as Phaser from 'phaser'
import { HAND_FONT } from './art'
import { overlay, text } from './ui'

// Objetos que Jorge se guarda. Se ven al encontrarlos y se pueden volver a ver desde el diario (pestaña Objetos).

type Build = (scene: Phaser.Scene, c: Phaser.GameObjects.Container, w: number, h: number) => void
interface Page {
  build: Build
  opts: { w?: number; h?: number; paper?: number }
}

export type ObjetoId = 'foto' | 'notas' | 'notaCajon' | 'banner' | 'informe' | 'llave' | 'papelHigienico' | 'ficha'

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
          add('Paciente: Jorge\nEdad: 30 años\nSesiones realizadas: 11', 18, '#333', {}, 20)
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

import * as Phaser from 'phaser'
import { FONT, HAND_FONT, makeTextures } from '../art'
import { sfx, startCalesita } from '../audio'
import { addPista, state } from '../state'
import { eyelids, objective, onKey, say, text, toast, type Line, type Point } from '../ui'
import { openDiary } from './diary'
import { controlsHelp } from '../touch'

// Sesión 1: el circo. Primer sueño lúcido: un recuerdo de cuando Jorge, de chico, fue al circo con su mamá.
// Se recorre en tres partes, de izquierda a derecha:
//   afuera:  [algodón de azúcar] … [banco] [calesita] … [la carpa]
//   función: adentro de la carpa (fija): Lechuga, el truco de las galeras y el número del elefante
//   atrás:   [la lona] [jaula del león] [cuidador con linterna · cajas] [jaula de los monos] [ente · carromato] … [el elefante]
// Afuera está todo a oscuras: el doctor Vela es una llama que acompaña a Jorge, y lo que ilumina toma forma y color.
// Atrás de la carpa hay sigilo: que no lo vea el cuidador y esquivar a los entes (fallas del sueño), escondiéndose.
// Jorge suelta al elefante y el elefante no se va. Lechuga le reprocha, se rompe, y Jorge se queda quieto hasta que
// la mamá lo encuentra. Al despertar sigue en Office (modo despertar).
// No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const FLOOR = 600
const KID = FLOOR - 52 // centro de Jorge chico parado
const WALK = 170 // un poco más lento que de grande
const REVEAL = 240 // hasta dónde llega la luz de la llama (px, en horizontal)
const STILL_MS = 5000 // cuánto hay que quedarse quieto al final
const CONE = 320 // largo de la luz de la linterna del cuidador

type Area = 'afuera' | 'funcion' | 'atras'
const AREA: Record<Area, { x0: number; x1: number; min: number; max: number }> = {
  afuera: { x0: 0, x1: 2400, min: 170, max: 2240 },
  funcion: { x0: 3000, x1: 4280, min: 3060, max: 3470 },
  atras: { x0: 4900, x1: 8900, min: 5080, max: 8780 },
}

const POS = {
  algodon: 400,
  banco: 820,
  inicio: 880,
  calesita: 1200,
  carpa: 2050,
  // Adentro
  pista: 3640,
  butaca: 3270,
  mamaF: 3360,
  gradas: 3090,
  // Atrás de la carpa
  salida: 5130,
  leon: 5300,
  caja: 6200,
  monos: 6950,
  carro: 7450,
  estaca: 8470,
  soltar: 8430,
  elefante: 8600,
}
const MESA = POS.pista + 60 // la mesa del truco, un poco a la derecha: Jorge se para a la izquierda
const SLOTS = [MESA - 140, MESA, MESA + 140] // las tres galeras del truco

// Gente sin cara de afuera. Las que tienen `dice` se pueden "hablar"
const SOMBRAS: { x: number; flip?: boolean; dice?: string; piensa?: string }[] = [
  { x: 620, flip: true },
  { x: 1580, dice: '¿Y tu mamá, nene?', piensa: 'No tiene cara.' },
  { x: 1760, flip: true },
]

type Phase = 'intro' | 'afuera' | 'funcion' | 'escape' | 'sigilo' | 'elefante' | 'quieto' | 'final'
type Paint = (c: number) => number
interface Reveal {
  x: number
  gray: Phaser.GameObjects.Graphics
  color: Phaser.GameObjects.Graphics
  lit: number
  revealed: boolean
  onReveal?: () => void
}
interface Spot {
  x: number
  label: () => string
  when: () => boolean
  action: () => Promise<void>
}
interface Guardia {
  img: Phaser.GameObjects.Image
  cone: Phaser.GameObjects.Graphics
  x: number
  min: number
  max: number
  dir: number
  pause: number
  seenMs: number
}
interface Ente {
  img: Phaser.GameObjects.Image
  x: number
  min: number
  max: number
  dir: number
}

// Lo que todavía no se recuerda se ve gris
const toGray: Paint = (c) => {
  const r = (c >> 16) & 0xff
  const g = (c >> 8) & 0xff
  const b = c & 0xff
  const l = Math.round((0.3 * r + 0.59 * g + 0.11 * b) * 0.55 + 18)
  return (l << 16) | (l << 8) | Math.min(255, l + 10)
}

export class Dream extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private flame!: Phaser.GameObjects.Container
  private flameGlow!: Phaser.GameObjects.Arc
  private dark!: Phaser.GameObjects.Image
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text
  private goal!: ReturnType<typeof objective>
  private music?: ReturnType<typeof startCalesita>
  private objs: Reveal[] = []
  private spots: Spot[] = []
  private horses: Reveal[] = []
  private horseTweens: Phaser.Tweens.Tween[] = []
  private sortijaRing!: Phaser.GameObjects.Graphics
  private carpaLetters: Phaser.GameObjects.Text[] = []
  private afiche!: Phaser.GameObjects.Image
  // Adentro de la carpa
  private lechuga!: Phaser.GameObjects.Image
  private mamaF!: Phaser.GameObjects.Image
  private vecina!: Phaser.GameObjects.Image
  private reflector!: Phaser.GameObjects.Graphics
  // Atrás de la carpa
  private elefante!: Phaser.GameObjects.Image
  private cadena!: Phaser.GameObjects.Graphics
  private estaca!: Phaser.GameObjects.Graphics
  private guardias: Guardia[] = []
  private entes: Ente[] = []
  private frio?: Phaser.GameObjects.Rectangle
  private area: Area = 'afuera'
  private phase: Phase = 'intro'
  private busy = true
  private leaving = false
  private lockUntil = 0
  private facing = 1
  private walkDist = 0
  private stepDist = 0
  private flameOn = false
  private fragments = new Set<string>()
  private knowsMama = false
  private hidden = false
  private checkpoint = POS.salida
  private checkpointHidden = false
  private safeUntil = 0
  private fallasGuardia = 0
  private fallasEnte = 0
  private vioGuardia = false
  private vioEnte = false
  private stillMs = 0
  private movingMs = 0
  private hinted = false

  constructor() {
    super('Dream')
  }

  create() {
    this.busy = true
    this.leaving = false
    this.phase = 'intro'
    this.area = 'afuera'
    this.facing = 1
    this.flameOn = false
    this.fragments = new Set()
    this.knowsMama = this.hidden = this.checkpointHidden = this.hinted = false
    this.vioGuardia = this.vioEnte = false
    this.fallasGuardia = this.fallasEnte = 0
    this.stillMs = this.movingMs = this.safeUntil = 0
    this.checkpoint = POS.salida
    this.objs = []
    this.horses = []
    this.horseTweens = []
    this.carpaLetters = []
    this.guardias = []
    this.entes = []
    this.frio = undefined
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0d1120')
    this.drawAfuera()
    this.drawFuncion()
    this.drawAtras()

    this.player = this.add.image(POS.inicio, KID, 'chico0').setDepth(10)
    this.flameGlow = this.add.circle(0, 0, 60, 0xffc56b, 0.18).setBlendMode(Phaser.BlendModes.ADD)
    this.flame = this.add.container(POS.inicio + 70, -200, [this.flameGlow, this.add.image(0, 0, 'llama')]).setDepth(790).setVisible(false)
    this.dark = this.add.image(POS.inicio, KID - 40, this.darkness()).setDepth(780).setScale(0.55)

    const box = this.add.graphics()
    box.fillStyle(0xf6f3ea).fillRoundedRect(-16, -16, 32, 32, 7)
    box.lineStyle(2, 0x111111).strokeRoundedRect(-16, -16, 32, 32, 7)
    const key = this.add.text(0, 0, 'E', { fontFamily: FONT, fontSize: '18px', color: '#111', fontStyle: 'bold', resolution: 2 }).setOrigin(0.5)
    this.promptLabel = this.add.text(0, 26, '', { fontFamily: FONT, fontSize: '14px', color: '#d8dce6', resolution: 2, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0)
    this.prompt = this.add.container(0, 0, [box, key, this.promptLabel]).setDepth(800).setVisible(false)
    this.tweens.add({ targets: this.prompt, scale: 1.08, yoyo: true, repeat: -1, duration: 600 })
    this.goal = objective(this)
    this.setupSpots()

    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,A,D,E,SPACE,TAB,ESC') as Record<string, Phaser.Input.Keyboard.Key>
    const cam = this.cameras.main
    cam.setBounds(0, 0, AREA.afuera.x1, 720)
    cam.startFollow(this.player, true, 0.08, 0.08)
    cam.centerOn(this.player.x, 360)
    this.music = startCalesita()
    this.events.once('shutdown', () => this.music?.stop(0.5))
    void this.run(() => this.intro())
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __dream?: Dream }).__dream = this
  }

  // ---------- Escenario ----------

  // Oscuridad con un agujero de luz en el centro: va siempre pegada a la llama
  private darkness() {
    const key = 'oscuridad-sueno'
    if (this.textures.exists(key)) return key
    const w = 3000
    const h = 1800
    const tex = this.textures.createCanvas(key, w, h)!
    const ctx = tex.getContext()
    const grad = ctx.createRadialGradient(w / 2, h / 2, 120, w / 2, h / 2, 360)
    grad.addColorStop(0, 'rgba(5,6,12,0)')
    grad.addColorStop(0.55, 'rgba(5,6,12,0.55)')
    grad.addColorStop(1, 'rgba(5,6,12,0.97)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    tex.refresh()
    return key
  }

  // Un objeto del recuerdo: se dibuja dos veces, gris y en color. Cuando la luz lo toca un rato, aparece el color
  private reveal(x: number, draw: (g: Phaser.GameObjects.Graphics, k: Paint) => void, depth = 2, onReveal?: () => void) {
    const gray = this.add.graphics().setDepth(depth)
    draw(gray, toGray)
    const color = this.add.graphics().setDepth(depth).setAlpha(0)
    draw(color, (c) => c)
    const r: Reveal = { x, gray, color, lit: 0, revealed: false, onReveal }
    this.objs.push(r)
    return r
  }

  private isRevealed(x: number) {
    return this.objs.some((o) => o.x === x && o.revealed)
  }

  private guirnaldas(g: Phaser.GameObjects.Graphics, from: number, to: number, y: number) {
    const bulbs = [0xffd36a, 0xff8a6a, 0x9fd6ff, 0xb9f2a0]
    for (let x0 = from; x0 < to; x0 += 600) {
      g.lineStyle(2, 0x2b2f3a)
      g.beginPath()
      for (let x = 0; x <= 600; x += 20) g.lineTo(x0 + x, y + Math.sin((x / 600) * Math.PI) * 50)
      g.strokePath()
      for (let x = 30; x < 600; x += 60) g.fillStyle(bulbs[(x / 60) % 4 | 0]).fillCircle(x0 + x, y + 4 + Math.sin((x / 600) * Math.PI) * 50, 5)
    }
  }

  private drawAfuera() {
    const g = this.add.graphics()
    // Cielo de noche, pasto pisado y tierra
    g.fillStyle(0x141a2e).fillRect(0, 0, AREA.afuera.x1, FLOOR)
    g.fillStyle(0x2a3326).fillRect(0, FLOOR, AREA.afuera.x1, 120)
    g.fillStyle(0x3a4630).fillRect(0, FLOOR, AREA.afuera.x1, 8)
    // Guirnaldas de lamparitas: siempre en color, la oscuridad las tapa
    this.guirnaldas(g, 0, 1500, 70)

    this.reveal(POS.algodon, (g2, k) => this.paintAlgodon(g2, k, POS.algodon))
    this.reveal(POS.banco, (g2, k) => this.paintBanco(g2, k, POS.banco))
    this.drawCalesita()
    this.drawCarpa()

    for (const s of SOMBRAS) this.add.image(s.x, FLOOR - 75, 'sombra').setFlipX(!!s.flip).setAlpha(0.85).setDepth(8)
  }

  private paintAlgodon(g: Phaser.GameObjects.Graphics, k: Paint, x: number) {
    g.fillStyle(k(0xe8e2d6)).fillRect(x - 90, 470, 180, 90)
    g.fillStyle(k(0xf2a7c3)).fillRect(x - 90, 490, 180, 14)
    g.fillStyle(k(0x2b2b2b)).fillCircle(x - 60, 570, 22).fillCircle(x + 60, 570, 22)
    g.fillStyle(k(0xd9dde5)).fillCircle(x - 60, 570, 8).fillCircle(x + 60, 570, 8)
    g.fillStyle(k(0x8a8f99)).fillRect(x - 102, 390, 8, 82).fillRect(x + 94, 390, 8, 82)
    for (let i = 0; i < 8; i++) g.fillStyle(k(i % 2 ? 0xf6f3ea : 0xf2a7c3)).fillRect(x - 112 + i * 28, 360, 28, 32)
    g.fillStyle(k(0xf6f3ea)).fillTriangle(x - 112, 392, x + 112, 392, x, 404)
    for (const [cx, col] of [[x - 50, 0xf7b6d2], [x - 10, 0xb9d8f2], [x + 34, 0xf7b6d2]] as [number, number][]) {
      g.lineStyle(3, k(0xd9c9a8)).lineBetween(cx, 470, cx, 430)
      g.fillStyle(k(col)).fillCircle(cx, 418, 20).fillCircle(cx - 10, 426, 13).fillCircle(cx + 11, 425, 13)
    }
  }

  private paintBanco(g: Phaser.GameObjects.Graphics, k: Paint, x: number) {
    g.fillStyle(k(0x6b4a2e)).fillRect(x - 60, 540, 120, 10).fillRect(x - 60, 510, 120, 8)
    g.fillStyle(k(0x3b2a1f)).fillRect(x - 54, 550, 8, 50).fillRect(x + 46, 550, 8, 50)
  }

  private drawCalesita() {
    const cx = POS.calesita
    this.reveal(cx, (g, k) => {
      // Techo a gajos rojos y blancos
      for (let i = 0; i < 10; i++) {
        g.fillStyle(k(i % 2 ? 0xf3efe6 : 0xc0392b)).fillTriangle(cx, 130, cx - 260 + i * 52, 250, cx - 260 + (i + 1) * 52, 250)
      }
      g.fillStyle(k(0xe0b04a)).fillRect(cx - 270, 250, 540, 26)
      for (let i = 0; i < 14; i++) g.fillStyle(k(0xffe08a)).fillCircle(cx - 255 + i * 39, 263, 5)
      g.fillStyle(k(0xd9b45a)).fillRect(cx - 10, 276, 20, 286)
      for (const px of [cx - 200, cx - 80, cx + 80, cx + 200]) g.fillStyle(k(0xd9b45a)).fillRect(px - 2, 276, 4, 286)
      g.fillStyle(k(0x7a4b2e)).fillRect(cx - 280, 560, 560, 26)
      g.fillStyle(k(0x5a3520)).fillRect(cx - 270, 586, 540, 14)
      // El palo de la sortija, a la derecha
      g.lineStyle(5, k(0x8a5a3a)).lineBetween(cx + 360, 180, cx + 260, 300)
    }, 3)
    const colors = [0xf1ece0, 0xb07a4a, 0x9fb4c8, 0xe8a0b4]
    ;[cx - 200, cx - 80, cx + 80, cx + 200].forEach((hx, i) => {
      const h = this.reveal(cx, (g, k) => this.paintCaballo(g, k, hx, colors[i]), 4)
      this.horses.push(h)
      this.horseTweens.push(this.tweens.add({ targets: [h.gray, h.color], y: -22, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: i * 350 }))
    })
    this.sortijaRing = this.add.graphics().setDepth(4)
    this.sortijaRing.lineStyle(4, 0xe0b04a).strokeCircle(cx + 258, 312, 9)
    this.sortijaRing.lineStyle(2, 0x8a5a3a).lineBetween(cx + 260, 300, cx + 258, 303)
  }

  private paintCaballo(g: Phaser.GameObjects.Graphics, k: Paint, hx: number, color: number) {
    g.lineStyle(5, k(color))
    g.lineBetween(hx - 28, 488, hx - 36, 522).lineBetween(hx - 12, 490, hx - 6, 524).lineBetween(hx + 14, 490, hx + 22, 520).lineBetween(hx + 28, 488, hx + 40, 512)
    g.fillStyle(k(color)).fillEllipse(hx, 470, 90, 40)
    g.fillTriangle(hx + 26, 470, hx + 44, 470, hx + 50, 420).fillEllipse(hx + 58, 418, 36, 20)
    g.fillStyle(k(0x5a3520)).fillTriangle(hx + 30, 452, hx + 46, 412, hx + 38, 448)
    g.lineStyle(4, k(0x5a3520)).lineBetween(hx - 44, 466, hx - 58, 490)
    g.fillStyle(k(0xc0392b)).fillRect(hx - 18, 448, 30, 10)
    g.fillStyle(k(0x111111)).fillCircle(hx + 64, 414, 2.5)
  }

  // La carpa, desde afuera: rayas rojas y blancas, la entrada con cortinas, el cartel CIRCO y el afiche de Lechuga
  private drawCarpa() {
    const x = POS.carpa
    this.reveal(x, (g, k) => {
      for (let i = 0; i < 12; i++) {
        const x0 = x - 360 + i * 60
        g.fillStyle(k(i % 2 ? 0xf1ece0 : 0xb8322a)).fillRect(x0, 250, 60, FLOOR - 250)
        g.fillStyle(k(i % 2 ? 0xe4ddcc : 0xa12b24)).fillTriangle(x, 50, x0, 250, x0 + 60, 250)
      }
      for (let i = 0; i < 12; i++) g.fillStyle(k(0xe0b04a)).fillTriangle(x - 360 + i * 60, 250, x - 300 + i * 60, 250, x - 330 + i * 60, 274)
      g.lineStyle(3, k(0x3b2a1f)).lineBetween(x, 50, x, 14)
      g.fillStyle(k(0xe0b04a)).fillTriangle(x, 14, x + 34, 24, x, 34)
      // Entrada: oscura, con las cortinas atadas a los costados
      g.fillStyle(k(0x1a0f14)).fillRect(x - 80, 400, 160, FLOOR - 400)
      g.fillStyle(k(0x7a1d1d)).fillTriangle(x - 86, 392, x - 86, FLOOR, x - 40, FLOOR).fillTriangle(x + 86, 392, x + 86, FLOOR, x + 40, FLOOR)
      g.fillStyle(k(0xa83a3a)).fillRoundedRect(x - 150, 312, 300, 60, 10)
      g.lineStyle(3, k(0xe0b04a)).strokeRoundedRect(x - 150, 312, 300, 60, 10)
      // Afiche de Lechuga
      g.fillStyle(k(0xf2d77a)).fillRect(x + 190, 380, 120, 170)
      g.lineStyle(3, k(0xb8322a)).strokeRect(x + 190, 380, 120, 170)
    }, 3, () => {
      this.carpaLetters.forEach((t) => t.setColor('#ffe08a'))
      this.afiche.clearTint()
    })
    // CIRCO, con la "I" que se apaga y se prende
    ;['C', 'I', 'R', 'C', 'O'].forEach((l, i) => {
      const t = text(this, x - 100 + i * 50, 342, l, 34, '#6f7280', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(4)
      this.carpaLetters.push(t)
      if (i === 1) this.tweens.add({ targets: t, alpha: 0.15, duration: 900, yoyo: true, repeat: -1, repeatDelay: 1400 })
    })
    this.afiche = this.add.image(x + 250, 470, 'lechuga').setScale(0.85).setDepth(4).setTint(0x5d6170)
    const nombre = text(this, x + 250, 540, '¡LECHUGA!', 18, '#6f7280', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(4)
    this.carpaLetters.push(nombre)
  }

  // Adentro de la carpa: la pista con su reflector, las gradas con la gente sin cara y Lechuga
  private drawFuncion() {
    const x0 = AREA.funcion.x0
    const pc = POS.pista
    const g = this.add.graphics()
    g.fillStyle(0x1a0f1a).fillRect(x0, 0, 1280, 720)
    // Las lonas del techo, en gajos desde el centro
    for (let i = 0; i < 16; i++) {
      g.fillStyle(i % 2 ? 0x3a1620 : 0x2a1a22).fillTriangle(pc, -40, x0 - 200 + i * 105, 360, x0 - 95 + i * 105, 360)
    }
    g.fillStyle(0x140c12).fillRect(x0, 360, 1280, 360)
    this.guirnaldas(g, x0, x0 + 1280, 120)
    // Gradas a los dos lados, con gente sin cara
    for (const [gx, dir] of [[x0, 1], [x0 + 1280, -1]] as [number, number][]) {
      for (let s = 0; s < 4; s++) {
        const w = 300 - s * 60
        g.fillStyle(s % 2 ? 0x4a2a1e : 0x5a3424).fillRect(dir > 0 ? gx : gx - w, 470 - s * 50, w, FLOOR - (470 - s * 50))
      }
    }
    for (const [sx, sy, f] of [[3040, 395, false], [3110, 345, false], [3170, 445, false], [4180, 395, true], [4110, 345, true], [4230, 445, true], [4060, 445, true]] as [number, number, boolean][]) {
      this.add.image(sx, sy, 'sombra').setScale(0.7).setFlipX(f).setAlpha(0.75).setDepth(2)
    }
    // La pista: arena con el borde rojo
    g.fillStyle(0x7a1d1d).fillEllipse(pc, 604, 700, 90)
    g.fillStyle(0xc9a46a).fillEllipse(pc, 600, 660, 70)
    g.fillStyle(0x2a1a14).fillRect(x0, 640, 1280, 80)
    // El reflector: un cono de luz sobre la pista
    this.reflector = this.add.graphics().setDepth(7).setAlpha(0)
    this.reflector.fillStyle(0xfff3d6, 0.07).fillTriangle(pc - 40, 0, pc + 40, 0, pc + 240, FLOOR).fillTriangle(pc - 40, 0, pc - 240, FLOOR, pc + 240, FLOOR)
    this.reflector.fillStyle(0xfff3d6, 0.12).fillEllipse(pc, 598, 480, 54)
    this.lechuga = this.add.image(pc, FLOOR - 75, 'lechuga').setDepth(9).setVisible(false)
    this.mamaF = this.add.image(POS.mamaF, FLOOR - 75, 'mama').setDepth(9).setFlipX(true)
    this.add.circle(POS.mamaF, this.mamaF.getTopCenter().y + 22, 22, 0xfff3d6, 0.7).setDepth(9).setBlendMode(Phaser.BlendModes.ADD)
    this.vecina = this.add.image(3560, FLOOR - 75, 'sombra').setDepth(8).setFlipX(true).setVisible(false)
  }

  // Atrás de la carpa: de noche, con los carromatos y las jaulas. Sigilo
  private drawAtras() {
    const x0 = AREA.atras.x0
    const x1 = AREA.atras.x1
    const g = this.add.graphics()
    g.fillStyle(0x0e1220).fillRect(x0, 0, x1 - x0, FLOOR)
    g.fillStyle(0x2a2620).fillRect(x0, FLOOR, x1 - x0, 120)
    g.fillStyle(0x38322a).fillRect(x0, FLOOR, x1 - x0, 6)
    // La parte de atrás de la carpa, con la lona por donde sale Jorge
    this.reveal(POS.salida, (g2, k) => {
      for (let i = 0; i < 6; i++) g2.fillStyle(k(i % 2 ? 0xe4ddcc : 0xa12b24)).fillRect(x0 + i * 60, 140, 60, FLOOR - 140)
      g2.fillStyle(k(0x6b1c1c)).fillTriangle(x0 + 250, 470, x0 + 330, FLOOR, x0 + 250, FLOOR)
      g2.lineStyle(3, k(0x3b2a1f))
      for (let i = 0; i < 4; i++) g2.lineBetween(x0 + 360, 160 + i * 40, x0 + 420 + i * 30, FLOOR)
    })
    this.reveal(POS.leon, (g2, k) => this.paintJaula(g2, k, POS.leon, 'leon'))
    // Cajas para esconderse: cuando Jorge se esconde, queda detrás (las cajas tapan a Jorge)
    this.reveal(POS.caja, (g2, k) => {
      const x = POS.caja
      g2.fillStyle(k(0x8a6a3a)).fillRect(x - 70, 510, 90, 90).fillRect(x + 10, 540, 70, 60).fillRect(x - 50, 450, 70, 60)
      g2.lineStyle(3, k(0x5a4224)).strokeRect(x - 70, 510, 90, 90).strokeRect(x + 10, 540, 70, 60).strokeRect(x - 50, 450, 70, 60)
      g2.lineBetween(x - 70, 510, x + 20, 600).lineBetween(x + 10, 540, x + 80, 600)
    }, 3)
    this.reveal(POS.monos, (g2, k) => this.paintJaula(g2, k, POS.monos, 'monos'))
    // Carromato con una lona que cuelga hasta el piso
    this.reveal(POS.carro, (g2, k) => {
      const x = POS.carro
      g2.fillStyle(k(0x7a2a2a)).fillRect(x - 130, 360, 260, 120)
      g2.lineStyle(4, k(0xe0b04a)).strokeRect(x - 130, 360, 260, 120)
      g2.fillStyle(k(0x5a1f1f)).fillTriangle(x - 140, 362, x + 140, 362, x, 320)
      g2.fillStyle(k(0x2b2b2b)).fillCircle(x - 90, 560, 34).fillCircle(x + 90, 560, 34)
      g2.fillStyle(k(0x8a8f99)).fillCircle(x - 90, 560, 10).fillCircle(x + 90, 560, 10)
      g2.fillStyle(k(0x6d6a52)).fillRect(x - 70, 478, 140, 122)
      g2.lineStyle(2, k(0x55533f)).lineBetween(x - 50, 480, x - 46, 600).lineBetween(x, 480, x + 4, 600).lineBetween(x + 46, 480, x + 42, 600)
    }, 3)
    // Fardos de pasto al lado del elefante
    this.reveal(POS.estaca, (g2, k) => {
      g2.fillStyle(k(0xc9a84a)).fillRoundedRect(POS.elefante + 150, 540, 90, 60, 8)
      g2.lineStyle(2, k(0x9a7f34)).lineBetween(POS.elefante + 160, 556, POS.elefante + 230, 556).lineBetween(POS.elefante + 160, 580, POS.elefante + 230, 580)
    })
    this.elefante = this.add.image(POS.elefante, FLOOR - 96, 'elefante').setDepth(9).setTint(0x7a7c86)
    // La cadena, de la pata de adelante a una estaca chiquita
    this.cadena = this.add.graphics().setDepth(9)
    this.cadena.lineStyle(3, 0x9aa3b5)
    for (let i = 0; i < 8; i++) this.cadena.strokeCircle(POS.estaca + 8 + i * 9, 590 - i * 1.5, 4)
    this.estaca = this.add.graphics({ x: POS.estaca, y: FLOOR }).setDepth(9)
    this.estaca.fillStyle(0x8a5a3a).fillRect(-4, -26, 8, 30)
    this.estaca.fillStyle(0x6b4a2e).fillRect(-6, -28, 12, 5)

    // El cuidador con la linterna, y un ente (una falla del sueño)
    // Van por encima de la oscuridad: la linterna los deja ver de lejos, y una falla del sueño se ve igual
    const cuidador = this.add.image(6700, FLOOR - 75, 'sombra').setDepth(784).setTint(0x8b8f9c)
    this.guardias.push({ img: cuidador, cone: this.add.graphics().setDepth(783), x: 6700, min: 5700, max: 6700, dir: -1, pause: 0, seenMs: 0 })
    const ente = this.add.image(7750, FLOOR - 75, 'ente').setDepth(784).setVisible(false)
    this.entes.push({ img: ente, x: 7750, min: 7150, max: 7750, dir: -1 })
  }

  private paintJaula(g: Phaser.GameObjects.Graphics, k: Paint, x: number, que: 'leon' | 'monos') {
    g.fillStyle(k(0x3b2a1f)).fillRect(x - 110, 560, 220, 20)
    g.fillStyle(k(0x2b2b2b)).fillCircle(x - 80, 584, 16).fillCircle(x + 80, 584, 16)
    if (que === 'leon') {
      g.fillStyle(k(0xc08a3e)).fillEllipse(x + 10, 530, 120, 46)
      g.fillStyle(k(0x7a4b22)).fillCircle(x - 50, 510, 30)
      g.fillStyle(k(0xc08a3e)).fillCircle(x - 54, 512, 18)
      g.fillStyle(k(0x111111)).fillCircle(x - 60, 508, 2)
    } else {
      for (const [mx, my] of [[x - 50, 520], [x + 30, 470], [x + 60, 530]] as [number, number][]) {
        g.fillStyle(k(0x6b4a2e)).fillEllipse(mx, my + 14, 26, 30).fillCircle(mx, my - 6, 12)
        g.fillStyle(k(0xd9b48a)).fillCircle(mx + 2, my - 4, 7)
      }
      g.lineStyle(3, k(0x6b4a2e)).lineBetween(x + 30, 455, x + 30, 410)
    }
    g.fillStyle(k(0x5a3520)).fillRect(x - 110, 400, 220, 14)
    g.lineStyle(4, k(0x9aa3b5))
    for (let i = 0; i <= 8; i++) g.lineBetween(x - 104 + i * 26, 414, x - 104 + i * 26, 560)
  }

  // ---------- Personajes y líneas ----------

  private kidHead = (): Point => ({ x: this.player.x + 4 * this.facing, y: this.player.y - 52 })
  private think = (t: string): Line => ({ kind: 'thought', text: t, anchor: this.kidHead })
  private kid = (t: string): Line => ({ kind: 'speech', text: t, anchor: this.kidHead })
  // La voz del doctor llega por la máquina: globo de "portero eléctrico", desde la llama (o desde arriba, si todavía no está)
  private vela = (t: string): Line => ({
    kind: 'intercom',
    text: t,
    anchor: () => (this.flameOn ? { x: this.flame.x, y: this.flame.y - 20 } : { x: this.cameras.main.worldView.centerX, y: this.cameras.main.worldView.top + 160 }),
  })
  private headOf = (img: Phaser.GameObjects.Image, drop = 0) => (): Point => ({ x: img.x, y: img.getTopCenter().y + drop })
  private sayAt = (img: Phaser.GameObjects.Image, t: string, drop = 0): Line => ({ kind: 'speech', text: t, anchor: this.headOf(img, drop) })
  private lech = (t: string): Line => this.sayAt(this.lechuga, t)
  private mamaSays = (t: string): Line => this.sayAt(this.mamaF, t)

  private setupSpots() {
    const escondite = (x: number): Spot => ({
      x,
      label: () => (this.hidden ? 'Salir' : 'Esconderme'),
      when: () => this.phase === 'sigilo',
      action: () => this.esconderse(x),
    })
    this.spots = [
      // Afuera
      { x: POS.algodon, label: () => 'Algodón de azúcar', when: () => this.area === 'afuera' && this.isRevealed(POS.algodon), action: () => this.algodon() },
      {
        x: POS.calesita,
        label: () => (this.fragments.has('calesita') ? 'Calesita' : 'Subirse a la calesita'),
        when: () => this.area === 'afuera' && this.isRevealed(POS.calesita),
        action: () => this.calesita(),
      },
      { x: POS.carpa, label: () => (this.listoParaEntrar() ? 'Entrar a la carpa' : 'Entrada'), when: () => this.area === 'afuera' && this.isRevealed(POS.carpa), action: () => this.entrada() },
      { x: POS.carpa + 250, label: () => 'Afiche', when: () => this.area === 'afuera' && this.isRevealed(POS.carpa), action: () => this.afichito() },
      ...SOMBRAS.filter((s) => s.dice).map((s) => ({ x: s.x, label: () => 'Alguien', when: () => this.area === 'afuera' && this.flameOn, action: () => this.sombra(s.x, s.dice!, s.piensa!) })),
      // Adentro, después de la función
      { x: POS.gradas, label: () => 'Pasar por debajo de las gradas', when: () => this.phase === 'escape', action: () => this.irAtras() },
      // Atrás de la carpa
      { x: POS.leon, label: () => 'Jaula', when: () => this.area === 'atras' && this.isRevealed(POS.leon), action: () => this.jaula('leon') },
      { x: POS.monos, label: () => 'Jaula', when: () => this.area === 'atras' && this.isRevealed(POS.monos), action: () => this.jaula('monos') },
      escondite(POS.caja),
      escondite(POS.carro),
      { x: POS.soltar, label: () => 'Soltar al elefante', when: () => this.phase === 'sigilo', action: () => this.soltar() },
    ]
  }

  // ---------- Afuera ----------

  private async intro() {
    const lids = eyelids(this, 0)
    await this.wait(1200)
    await lids.to(0.35, 2200)
    await lids.to(0.15, 1200)
    await lids.to(1, 2600)
    lids.destroy()
    await say(this, [this.think('¿Dónde estoy?'), this.think('Hay música… lejos.')])
    await say(this, [this.vela('Jorge, ¿me escuchás? Soy el doctor Vela.'), this.vela('Estás soñando. Mirate las manos.')])
    await this.manos()
    // Aparece la llama
    this.flameOn = true
    this.flame.setVisible(true).setAlpha(0).setPosition(this.player.x + 70, this.player.y - 260)
    sfx.flame()
    this.tweens.add({ targets: this.flame, alpha: 1, y: KID - 110, duration: 1600, ease: 'Sine.Out' })
    this.tweens.add({ targets: this.dark, scale: 1, duration: 2200, ease: 'Sine.Out' })
    await this.wait(1800)
    await say(this, [
      this.vela('Esa luz soy yo. Voy a estar con vos todo el tiempo.'),
      this.vela('Esto es un recuerdo tuyo, de cuando eras chico. Lo que ilumine, lo vas a poder recordar.'),
    ])
    this.phase = 'afuera'
    this.updateGoal()
    this.help('← → / A D caminar   ·   E examinar   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa')
  }

  private help(keyboard: string) {
    const t = text(this, 24, this.scale.height - 34, controlsHelp(keyboard), 16, '#aab2c4').setScrollFactor(0).setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: t, alpha: 0, duration: 1500, onComplete: () => t.destroy() }))
  }

  // Prueba de realidad de los sueños lúcidos: mirarse las manos
  private async manos() {
    const { width, height } = this.scale
    const label = text(this, width / 2, height - 90, 'E · Mirarme las manos', 20, '#e8e8e8').setOrigin(0.5).setScrollFactor(0).setDepth(960)
    this.tweens.add({ targets: label, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 })
    await new Promise<void>((resolve) => {
      const off = onKey(this, (code) => {
        if (code !== 'KeyE') return
        off()
        resolve()
      })
    })
    label.destroy()
    const bg = this.add.rectangle(0, 0, width, height, 0x05060c, 0.85).setOrigin(0).setScrollFactor(0).setDepth(960).setAlpha(0)
    const hands = this.add.graphics().setScrollFactor(0).setDepth(961).setAlpha(0)
    this.paintManos(hands, false)
    await this.tween({ targets: [bg, hands], alpha: 1, duration: 600 })
    await say(this, [this.think('Son chiquitas.'), this.think('Son manos de chico.')])
    await this.wait(600)
    this.paintManos(hands, true)
    this.cameras.main.shake(150, 0.002)
    await this.wait(500)
    await say(this, [
      this.think('…¿Seis dedos?'),
      this.vela('En los sueños las manos nunca salen bien. Así te das cuenta de que estás soñando.'),
    ])
    await this.tween({ targets: [bg, hands], alpha: 0, duration: 600 })
    bg.destroy()
    hands.destroy()
  }

  private paintManos(g: Phaser.GameObjects.Graphics, six: boolean) {
    g.clear()
    const skin = 0xe7c09a
    const cx = this.scale.width / 2
    for (const [px, mirror] of [[cx - 170, false], [cx + 60, true]] as [number, boolean][]) {
      g.fillStyle(0x3e7d3c).fillRoundedRect(px - 6, 520, 122, 120, 16)
      g.fillStyle(skin).fillRoundedRect(px, 380, 110, 150, 30)
      const fingers = six && mirror ? 5 : 4
      const fw = fingers === 5 ? 19 : 22
      for (let i = 0; i < fingers; i++) {
        const fx = px + 6 + i * ((110 - 12 - fw) / (fingers - 1))
        const len = [62, 76, 80, 70, 58][i] ?? 60
        g.fillRoundedRect(fx, 390 - len, fw, len + 20, fw / 2)
      }
      // Pulgar, hacia adentro
      const tx = mirror ? px - 34 : px + 98
      g.fillRoundedRect(tx, 450, 46, 26, 13)
      g.fillStyle(0xcfa07a)
      for (let i = 0; i < 3; i++) g.fillRect(px + 22 + i * 26, 470, 18, 3)
    }
  }

  // Un recuerdo se ve como figuras transparentes y cálidas, que aparecen y se van
  // `mamaX`: dónde está ella. `chicoX`: dónde está Jorge chico en el recuerdo (null si no aparece)
  private async memoria(mamaX: number, crouch: boolean, lines: (mama: Phaser.GameObjects.Image, chico: Phaser.GameObjects.Image) => Line[], chicoX: number | null) {
    const mama = this.add.image(mamaX, FLOOR - 75, crouch ? 'mamaAgachada' : 'mama').setDepth(9).setTint(0xffd9a0).setAlpha(0)
    const glow = this.add.circle(mamaX + 2, mama.getTopCenter().y + (crouch ? 59 : 23), 22, 0xfff3d6, 0).setDepth(9).setBlendMode(Phaser.BlendModes.ADD)
    const chico = this.add.image(chicoX ?? mamaX, KID, 'chico0').setDepth(9).setTint(0xffd9a0).setAlpha(0).setVisible(chicoX !== null)
    if (chicoX !== null) {
      mama.setFlipX(chicoX < mamaX)
      chico.setFlipX(chicoX > mamaX)
    }
    // Si Jorge está parado donde aparece el recuerdo, se corre a un costado para mirarlo
    const left = Math.min(mamaX, chicoX ?? mamaX) - 55
    const right = Math.max(mamaX, chicoX ?? mamaX) + 45
    if (this.player.x > left && this.player.x < right) {
      const to = left - 20 > 170 ? left - 20 : right + 20
      await this.walkTo(to)
    }
    this.face(mamaX)
    sfx.reveal()
    await this.tween({ targets: [mama, chico], alpha: 0.7, duration: 800 })
    this.tweens.add({ targets: glow, fillAlpha: 0.6, duration: 600 })
    await say(this, lines(mama, chico))
    await this.tween({ targets: [mama, chico, glow], alpha: 0, duration: 900 })
    mama.destroy()
    chico.destroy()
    glow.destroy()
  }

  private async algodon() {
    if (this.fragments.has('algodon')) {
      await say(this, [this.think(this.knowsMama ? 'Acá mamá me compró algodón de azúcar.' : 'Acá me compraron algodón de azúcar.')])
      return
    }
    await this.memoria(POS.algodon - 80, false, (m, c) => [this.sayAt(m, 'Uno chiquito, ¿eh? Que después no cenás.'), this.sayAt(c, '¡El rosa!')], POS.algodon + 10)
    await say(this, this.knowsMama ? [this.think('Mamá me compró algodón de azúcar.')] : [this.think('Vine con alguien. Una mujer.'), this.think('No le puedo ver la cara.')])
    // Es un recuerdo de más (un desvío): no hace falta para seguir
    this.fragments.add('algodon')
    if (addPista('El algodón de azúcar', this.knowsMama ? 'Fui al circo con mamá. Me compró algodón de azúcar.' : 'Fui al circo con una mujer. Me compró algodón de azúcar. No le puedo ver la cara.')) {
      toast(this, '✎ Nueva pista en el diario (TAB)')
    }
  }

  private async calesita() {
    if (this.fragments.has('calesita')) {
      await say(this, [this.think('La calesita se quedó quieta.')])
      return
    }
    await this.sortija()
    await say(this, [this.think('La sortija.'), this.think('Y después, la función.')])
    await this.fragmento(
      'calesita',
      'La calesita',
      `Afuera del circo había una calesita. Saqué la sortija. ${this.knowsMama ? 'Mamá' : 'Una mujer'} me saludaba desde el banco.`,
    )
  }

  // Mini juego: Jorge, arriba de un caballo, tiene que agarrar la sortija en el momento justo
  private async sortija() {
    const horse = this.horses[3]
    const hx = POS.calesita + 200
    this.player.setVisible(false)
    const rider = this.add.image(hx - 6, 430, 'chico0').setDepth(5)
    const follow = () => rider.setY(430 + horse.color.y)
    this.events.on('update', follow)

    const { width, height } = this.scale
    const cx = width / 2
    const y = height - 80
    let zone = 84
    const ui = this.add.container(0, 0).setScrollFactor(0).setDepth(960)
    const label = text(this, cx, y - 44, 'Agarrá la sortija: E cuando el anillo pase por el medio', 18, '#e8e8e8').setOrigin(0.5)
    const track = this.add.rectangle(cx, y, Math.min(440, width - 60), 14, 0x000000, 0.6).setStrokeStyle(2, 0x6c7385)
    const target = this.add.rectangle(cx, y, zone, 14, 0xe0b04a, 0.5)
    const ring = this.add.circle(cx, y, 11).setStrokeStyle(4, 0xe0b04a)
    ui.add([label, track, target, ring])
    let misses = 0
    const start = this.time.now
    const amp = Math.min(205, width / 2 - 40)
    const move = () => ring.setX(cx + Math.sin(((this.time.now - start) / 1000) * 2) * amp)
    this.events.on('update', move)
    await new Promise<void>((resolve) => {
      const off = onKey(this, (code) => {
        if (code !== 'KeyE') return
        if (Math.abs(ring.x - cx) <= zone / 2) {
          off()
          resolve()
          return
        }
        sfx.click()
        misses++
        this.floatText('Casi…', rider.x, rider.y - 70)
        if (misses === 3) {
          // El sueño ayuda: el blanco se agranda
          zone = 120
          target.setSize(zone, 14)
        }
      })
    })
    this.events.off('update', move)
    ui.destroy()
    sfx.pickup()
    this.sortijaRing.destroy()
    const won = this.add.circle(rider.x + 16, rider.y - 30, 9).setStrokeStyle(4, 0xe0b04a).setDepth(6)
    this.tweens.add({ targets: won, y: won.y - 30, alpha: 0, duration: 1200, onComplete: () => won.destroy() })
    // Desde el banco, la mamá lo saluda (recuerdo)
    await this.memoria(POS.banco, false, (m) => [this.sayAt(m, '¡Muy bien, Jorge! ¡Te ganaste otra vuelta!'), this.sayAt(m, 'Pero después, ¿eh? Que ya empieza la función.')], null)
    // La calesita para
    this.horseTweens.forEach((t) => t.stop())
    this.horses.forEach((h) => this.tweens.add({ targets: [h.gray, h.color], y: 0, duration: 800 }))
    await this.wait(900)
    this.events.off('update', follow)
    rider.destroy()
    this.facing = 1
    this.player.setVisible(true).setFlipX(false).setX(POS.calesita + 330)
    await this.wait(300)
  }

  private listoParaEntrar() {
    return this.fragments.has('calesita') && this.fragments.has('regla')
  }

  private async entrada() {
    if (!this.fragments.has('regla')) {
      await this.memoria(POS.carpa - 30, true, (m, c) => [
        this.sayAt(m, 'Jorge, mirame.', 36),
        this.sayAt(m, 'Adentro hay mucha gente.', 36),
        this.sayAt(m, 'Si te perdés, no salgas a buscarme.', 36),
        this.sayAt(m, 'Quedate quieto donde estás, que yo te encuentro. ¿Sí?', 36),
        this.sayAt(c, 'Sí, mamá.'),
      ], POS.carpa + 60)
      const before = this.fragments.size > 0
      this.knowsMama = true
      await say(this, [this.think('Mamá…'), this.think(before ? 'La mujer de la calesita era mi mamá.' : 'Vine al circo con mi mamá.')])
      await this.fragmento('regla', 'Lo que me dijo mamá', 'En la entrada del circo, mamá me dijo: "Si te perdés, quedate quieto donde estás, que yo te encuentro."')
      return
    }
    if (!this.fragments.has('calesita')) {
      await say(this, [this.think('Todavía no.'), this.think('Antes de entrar fuimos a la calesita. Me acuerdo de la música.')])
      return
    }
    await this.entrar()
  }

  private async afichito() {
    await say(this, [this.think('"¡Lechuga!"'), this.think('El señor del flequillo. Lo veía en la tele.')])
  }

  private async fragmento(id: string, titulo: string, texto: string) {
    this.fragments.add(id)
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
    const n = [...this.fragments].filter((f) => f !== 'algodon').length
    if (n === 1) await say(this, [this.vela('Eso que viste es un recuerdo, Jorge. Lo veo en la pantalla.'), this.vela('Seguí buscando.')])
    else if (n === 2) await say(this, [this.vela('Vas muy bien.'), this.vela('Ahora, la carpa.')])
    this.updateGoal()
  }

  private updateGoal() {
    if (this.phase === 'afuera') {
      const n = (this.fragments.has('calesita') ? 1 : 0) + (this.fragments.has('regla') ? 1 : 0)
      this.goal.set(n === 2 ? 'Entrar a la carpa' : `Seguir la luz y recordar qué pasó (${n}/2)`)
    } else if (this.phase === 'escape') this.goal.set('Ir a soltar al elefante, sin que mamá me vea')
    else if (this.phase === 'sigilo') this.goal.set('Llegar al elefante sin que me vean')
    else if (this.phase === 'quieto') this.goal.set('Quedarme quieto donde estoy')
    else this.goal.set(null)
  }

  private async sombra(x: number, dice: string, piensa: string) {
    const fake = { x, y: FLOOR - 150 }
    await say(this, [{ kind: 'speech', text: dice, anchor: () => fake }, this.think(piensa)])
  }

  private floatText(msg: string, x: number, y: number) {
    const t = text(this, x, y, msg, 18, '#f2d7b0', { fontFamily: HAND_FONT }).setOrigin(0.5).setDepth(960)
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 1100, onComplete: () => t.destroy() })
  }

  // ---------- Áreas ----------

  // Cambia de parte del sueño: mueve a Jorge y a la llama, y ajusta la cámara, la oscuridad y la música
  setArea(a: Area, x?: number) {
    this.area = a
    const A = AREA[a]
    const px = x ?? (a === 'afuera' ? POS.inicio : a === 'funcion' ? POS.butaca : POS.salida)
    this.player.setPosition(px, KID)
    this.flame.setPosition(px + 70 * this.facing, KID - 110)
    const cam = this.cameras.main
    cam.setBounds(A.x0, 0, A.x1 - A.x0, 720)
    cam.startFollow(this.player, true, 0.08, 0.08)
    cam.centerOn(px, 360)
    if (a === 'funcion') {
      // Adentro hay luz: el recuerdo se ve entero
      this.dark.setAlpha(0)
      this.cameras.main.setBackgroundColor('#1a0f1a')
      this.music?.clear()
    } else {
      this.dark.setAlpha(1)
      this.cameras.main.setBackgroundColor('#0d1120')
      this.music?.muffle()
    }
    this.flame.setScale(1)
    this.dark.setScale(1)
  }

  private async fundido(fn: () => void, ms = 500) {
    const cam = this.cameras.main
    cam.fadeOut(ms, 5, 6, 12)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    fn()
    cam.fadeIn(ms, 5, 6, 12)
    await this.wait(ms)
  }

  // ---------- La función ----------

  private async entrar() {
    this.phase = 'funcion'
    this.updateGoal()
    await this.fundido(() => {
      this.facing = 1
      this.player.setFlipX(false)
      this.setArea('funcion')
      this.cameras.main.stopFollow()
      this.cameras.main.centerOn(POS.pista - 170, 360)
    }, 700)
    await this.funcion()
  }

  private async funcion() {
    const pc = POS.pista
    await say(this, [this.think('Adentro de la carpa.'), this.think('Hay olor a pochoclo.')])
    sfx.redoble(1.8)
    await this.wait(1900)
    this.tweens.add({ targets: this.reflector, alpha: 1, duration: 400 })
    this.lechuga.setVisible(true).setAlpha(0)
    await this.tween({ targets: this.lechuga, alpha: 1, duration: 400 })
    sfx.aplausos(2.4)
    await this.wait(1200)
    await say(this, [
      this.lech('¡Buenas noches, chicos y chicas!'),
      this.lech('¡Bienvenidos al circo más lindo del mundo!'),
      this.lech('¡Yo soy Lechuga! ¿Me conocen?'),
    ])
    sfx.aplausos(1.6)
    await say(this, [this.think('Lechuga. El de la tele.'), this.think('Tiene el flequillo más lindo del mundo.')])

    // El truco de las galeras: Lechuga llama a Jorge como ayudante
    await say(this, [this.lech('Para el primer número necesito un ayudante.'), this.lech('¡A ver… vos! ¡El del suéter verde!')])
    this.reflector.setX(this.player.x - pc)
    await this.wait(500)
    await say(this, [this.mamaSays('Andá, Jorge. Andá.')])
    this.tweens.add({ targets: this.reflector, x: 0, duration: 900 })
    await this.walkTo(pc - 200)
    this.face(pc)
    await this.tween({ targets: this.lechuga, x: MESA, duration: 500 })
    await this.galeras()
    await this.tween({ targets: this.lechuga, x: pc, duration: 500 })
    await this.walkTo(POS.butaca)
    this.face(pc)

    // El número del elefante
    await this.numeroElefante()

    // Termina la función
    await say(this, [this.lech('¡Gracias, chicos! ¡Hasta la próxima!')])
    sfx.aplausos(2.6)
    this.tweens.add({ targets: this.lechuga, alpha: 0, duration: 900 })
    this.tweens.add({ targets: this.reflector, alpha: 0, duration: 900 })
    await this.wait(1200)
    this.lechuga.setVisible(false)
    await this.fragmento(
      'funcion',
      'La función',
      'En el circo, Lechuga, el presentador, me llamó para un truco con galeras. Después hicieron trabajar a un elefante con una cadena en la pata. No me gustó.',
    )

    // El descuido de la mamá
    this.vecina.setVisible(true).setAlpha(0).setX(3560)
    await this.tween({ targets: this.vecina, alpha: 0.9, x: 3480, duration: 900 })
    const vec = { x: 3480, y: FLOOR - 160 }
    await say(this, [{ kind: 'speech', text: '¡Hola! ¡Tanto tiempo!', anchor: () => vec }])
    this.mamaF.setFlipX(false)
    await say(this, [this.mamaSays('¡Ay, hola! ¿Cómo andan los chicos?')])
    await say(this, [
      this.think('Mamá está hablando.'),
      this.think('El elefante está atrás de la carpa.'),
      this.think('Lo voy a soltar.'),
      this.vela('Jorge… esto ya pasó. Es un recuerdo.'),
      this.vela('Mostrame qué hiciste.'),
    ])
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.phase = 'escape'
    this.updateGoal()
  }

  // Puzzle del show (provisorio): "¿dónde quedó la pelotita?", con tres galeras. No se puede perder: si se equivoca,
  // la siguiente vuelta es más lenta y la galera de la pelotita brilla un poco (el sueño ayuda)
  private async galeras() {
    const pc = MESA
    const table = this.add.graphics().setDepth(8)
    table.fillStyle(0x6b1c1c).fillRect(pc - 230, 520, 460, 16)
    table.fillStyle(0xe0b04a).fillRect(pc - 230, 534, 460, 4)
    table.fillStyle(0x3b2a1f).fillRect(pc - 210, 538, 10, 62).fillRect(pc + 200, 538, 10, 62)
    const ball = this.add.circle(SLOTS[1], 506, 13, 0xd8352a).setDepth(8)
    const hats = SLOTS.map((x) => {
      const g = this.add.graphics()
      g.fillStyle(0x111114).fillEllipse(0, 0, 76, 14).fillRect(-26, -64, 52, 64)
      g.fillStyle(0xb8322a).fillRect(-26, -16, 52, 9)
      g.fillStyle(0x2a2a30).fillRect(-26, -64, 52, 6)
      return this.add.container(x, 520, [g]).setDepth(9)
    })
    const glow = this.add.circle(0, 0, 36, 0xffe9a8, 0).setDepth(10).setBlendMode(Phaser.BlendModes.ADD)
    const arrow = this.add.triangle(0, 0, 0, 0, 24, 0, 12, 18, 0xf6f3ea).setDepth(10).setVisible(false)
    let ballHat = 1
    const sync = () => {
      ball.x = hats[ballHat].x
      glow.setPosition(hats[ballHat].x, hats[ballHat].y - 40)
    }
    this.events.on('update', sync)
    const lift = (i: number, up: boolean) => this.tween({ targets: hats[i], y: up ? 450 : 520, duration: 350, ease: 'Sine.InOut' })
    const help = text(this, this.scale.width / 2, this.scale.height - 60, controlsHelp('← → elegir   ·   E levantar la galera'), 18, '#e8e8e8').setOrigin(0.5).setScrollFactor(0).setDepth(960).setVisible(false)

    await say(this, [this.lech('Esta pelotita se esconde abajo de una galera.'), this.lech('¡Mirá bien, eh! ¡No le saques los ojos de encima!')])
    const rondas: { swaps: number; ms: number; ok: string[] }[] = [
      { swaps: 3, ms: 520, ok: ['¡Muy bien! ¡Qué ojo tiene este pibe!'] },
      { swaps: 5, ms: 400, ok: ['¡Otra vez! ¡No te puedo engañar!', '¡Un aplauso para mi ayudante!'] },
    ]
    for (let r = 0; r < rondas.length; r++) {
      if (r === 1) await say(this, [this.lech('Ahora, más rápido. ¿Te animás?')])
      let misses = 0
      for (;;) {
        const ronda = rondas[r]
        const ms = ronda.ms + misses * 160
        // Muestra dónde está la pelotita
        ballHat = Phaser.Math.Between(0, 2)
        sync()
        await lift(ballHat, true)
        await this.wait(700)
        await lift(ballHat, false)
        if (misses > 0) glow.setFillStyle(0xffe9a8, 0.22)
        await this.wait(300)
        for (let s = 0; s < Math.max(2, ronda.swaps - misses); s++) {
          const a = Phaser.Math.Between(0, 2)
          let b = Phaser.Math.Between(0, 1)
          if (b >= a) b++
          const ax = hats[a].x
          const bx = hats[b].x
          sfx.click()
          this.tweens.add({ targets: hats[a], y: 494, duration: ms / 2, yoyo: true, ease: 'Sine.InOut' })
          await Promise.all([this.tween({ targets: hats[a], x: bx, duration: ms, ease: 'Sine.InOut' }), this.tween({ targets: hats[b], x: ax, duration: ms, ease: 'Sine.InOut' })])
        }
        // Elegir una galera
        let sel = 1
        const hatAt = (slot: number) => hats.findIndex((h) => Math.abs(h.x - SLOTS[slot]) < 2)
        const place = () => arrow.setPosition(SLOTS[sel] - 12, 410).setVisible(true)
        place()
        help.setVisible(true)
        const elegida = await new Promise<number>((resolve) => {
          const off = onKey(this, (code) => {
            if (code === 'ArrowLeft' || code === 'KeyA') sel = (sel + 2) % 3
            else if (code === 'ArrowRight' || code === 'KeyD') sel = (sel + 1) % 3
            else if (code === 'KeyE' || code === 'Space' || code === 'Enter') {
              off()
              resolve(hatAt(sel))
              return
            } else return
            sfx.click()
            place()
          })
        })
        arrow.setVisible(false)
        help.setVisible(false)
        glow.setFillStyle(0xffe9a8, 0)
        await lift(elegida, true)
        if (elegida === ballHat) {
          sfx.pickup()
          sfx.aplausos(1.8)
          await this.wait(400)
          await say(this, ronda.ok.map((t) => this.lech(t)))
          await lift(elegida, false)
          break
        }
        sfx.click()
        await this.wait(400)
        await lift(ballHat, true)
        misses++
        await say(this, [this.lech(misses === 1 ? '¡Uy! ¡Casi, casi!' : '¡Ah, la pelotita es muy rápida!'), this.lech('Vamos otra vez.')])
        await Promise.all([lift(elegida, false), lift(ballHat, false)])
      }
    }
    this.events.off('update', sync)
    await this.tween({ targets: [table, ball, ...hats], alpha: 0, duration: 500 })
    table.destroy()
    ball.destroy()
    hats.forEach((h) => h.destroy())
    glow.destroy()
    arrow.destroy()
    help.destroy()
  }

  private async numeroElefante() {
    const pc = POS.pista
    await say(this, [this.lech('Y ahora…'), this.lech('¡la estrella de la noche!')])
    sfx.redoble(1.4)
    await this.wait(1500)
    // Entra el elefante, tirado de una cadena por un cuidador sin cara
    const elef = this.add.image(4420, FLOOR - 96, 'elefante').setDepth(8)
    const cuidador = this.add.image(4300, FLOOR - 75, 'sombra').setDepth(9).setTint(0x8b8f9c)
    const cadena = this.add.graphics().setDepth(9)
    const tira = () => {
      cadena.clear()
      cadena.lineStyle(3, 0x9aa3b5).lineBetween(cuidador.x - 18, FLOOR - 70, elef.x - 64, FLOOR - 10)
    }
    this.events.on('update', tira)
    this.lechuga.setFlipX(true)
    await Promise.all([this.tween({ targets: elef, x: pc + 140, duration: 3200 }), this.tween({ targets: cuidador, x: pc + 20, duration: 3200 })])
    await say(this, [this.lech('¡El elefante más grande del mundo!')])
    sfx.aplausos(2)
    sfx.trompeta()
    await this.wait(900)
    // El número: subirse a un banquito. El látigo se oye, no se ve pegar
    const banco = this.add.graphics({ x: pc + 140, y: FLOOR }).setDepth(7)
    banco.fillStyle(0xb8322a).fillRect(-70, -36, 140, 36)
    banco.fillStyle(0xe0b04a).fillRect(-70, -36, 140, 6).fillRect(-70, -6, 140, 6)
    sfx.latigo()
    this.cameras.main.shake(80, 0.0015)
    await this.tween({ targets: elef, x: elef.x + 4, duration: 60, yoyo: true, repeat: 3 })
    await say(this, [this.lech('¡Arriba, arriba!')])
    await this.tween({ targets: elef, y: FLOOR - 132, duration: 1400, ease: 'Sine.InOut' })
    sfx.latigo()
    await this.tween({ targets: elef, angle: 8, duration: 700, ease: 'Sine.Out' })
    sfx.trompeta()
    sfx.aplausos(2)
    await say(this, [this.think('No quiere.'), this.think('Tiene una cadena en la pata.')])
    sfx.latigo()
    await this.tween({ targets: elef, x: elef.x - 3, duration: 50, yoyo: true, repeat: 3 })
    await say(this, [
      this.think('Cada vez que suena eso, tiembla.'),
      this.mamaSays('¿Te gusta, Jorgito?'),
      this.kid('No.'),
      this.vela('¿Qué sentís, Jorge?'),
      this.think('Que no tendría que estar acá.'),
    ])
    await this.tween({ targets: elef, angle: 0, y: FLOOR - 96, duration: 1000 })
    banco.destroy()
    elef.setFlipX(true)
    await Promise.all([this.tween({ targets: elef, x: 4440, duration: 3000 }), this.tween({ targets: cuidador, x: 4330, duration: 3000 })])
    this.events.off('update', tira)
    elef.destroy()
    cuidador.destroy()
    cadena.destroy()
    this.lechuga.setFlipX(false)
  }

  // ---------- Atrás de la carpa: sigilo ----------

  private async irAtras() {
    this.phase = 'sigilo'
    this.updateGoal()
    await this.fundido(() => {
      this.facing = 1
      this.player.setFlipX(false)
      this.setArea('atras')
    }, 600)
    this.vecina.setVisible(false)
    sfx.paper()
    await say(this, [
      this.think('Salí por abajo de la lona.'),
      this.think('Acá atrás están los animales.'),
      this.vela('Jorge, esperá.'),
      this.vela('Si ven mi luz, te van a ver a vos.'),
      this.vela('Me voy a hacer chiquito.'),
    ])
    // La llama se achica: se ve menos, pero no lo delata
    this.tweens.add({ targets: this.flame, scale: 0.7, duration: 900 })
    this.tweens.add({ targets: this.dark, scale: 0.72, duration: 900 })
    this.help('← → caminar   ·   E esconderse / examinar   ·   TAB diario')
  }

  private async introGuardia() {
    this.vioGuardia = true
    const g = this.guardias[0]
    this.face(g.x)
    await say(this, [
      this.think('Un señor con una linterna.'),
      this.think('Si me ve, me lleva con mamá.'),
      this.vela('Esperá a que mire para el otro lado.'),
      this.vela('Si se da vuelta, escondete atrás de las cajas.'),
    ])
  }

  private async introEnte() {
    this.vioEnte = true
    const e = this.entes[0]
    e.img.setVisible(true).setAlpha(0)
    sfx.estatica()
    await this.tween({ targets: e.img, alpha: 1, duration: 500 })
    this.face(e.x)
    await say(this, [
      this.think('¿Y eso?'),
      this.vela('Jorge, quieto.'),
      this.vela('Eso no es parte del recuerdo. Es una falla del sueño.'),
      this.vela('No lo podés tocar, ni él a vos. Esquivalo: escondete hasta que pase.'),
    ])
  }

  private async esconderse(x: number) {
    if (this.hidden) {
      this.hide(false)
      return
    }
    this.player.setX(x)
    this.hide(true)
    this.checkpoint = x
    this.checkpointHidden = true
  }

  private hide(on: boolean) {
    this.hidden = on
    this.player.setDepth(on ? 2 : 10).setTexture('chico0')
    this.flame.setAlpha(on ? 0.45 : 1)
    if (on) sfx.paper()
  }

  private async pillado(quien: 'guardia' | 'ente', g?: Guardia) {
    if (quien === 'guardia' && g) {
      this.fallasGuardia++
      g.cone.clear()
      sfx.click()
      const at = { x: g.img.x, y: g.img.getTopCenter().y }
      await say(this, [{ kind: 'speech', text: '¡Eh, nene! ¿Qué hacés acá atrás?', anchor: () => at }])
    } else {
      this.fallasEnte++
      sfx.estatica()
      this.cameras.main.shake(300, 0.006)
      this.cameras.main.flash(250, 255, 63, 216)
      await this.wait(400)
    }
    await this.fundido(() => {
      this.player.setX(this.checkpoint)
      this.flame.setX(this.checkpoint + 70 * this.facing)
      this.hide(this.checkpointHidden)
      // El cuidador vuelve a su punta, para no encontrarlo apenas vuelve
      if (quien === 'guardia' && g) {
        g.x = g.max
        g.dir = -1
        g.pause = 0
      }
    }, 400)
    this.safeUntil = this.time.now + 1200
    if (quien === 'guardia' && this.fallasGuardia === 1) await say(this, [this.vela('Despacio, Jorge. Esperá a que mire para el otro lado.')])
    if (quien === 'ente' && this.fallasEnte === 1) await say(this, [this.vela('No lo toques. Escondete en el carromato hasta que pase.')])
  }

  private async jaula(que: 'leon' | 'monos') {
    await say(this, que === 'leon'
      ? [this.think('Un león.'), this.think('Está muy flaco.'), this.think('Ni me mira.')]
      : [this.think('Monitos.'), this.think('Me miran.'), this.think('Ellos también quieren salir.')])
  }

  // ---------- El elefante ----------

  private async soltar() {
    this.phase = 'elefante'
    this.updateGoal()
    if (this.hidden) this.hide(false)
    this.elefante.clearTint()
    this.face(POS.elefante)
    await say(this, [this.kid('Hola.'), this.think('Es enorme.'), this.kid('Te voy a sacar de acá.'), this.think('La cadena está atada a un palito.'), this.think('Es chiquito.')])
    // Saca la estaca
    sfx.cadena()
    await this.tween({ targets: this.estaca, angle: -70, y: FLOOR + 4, duration: 500, ease: 'Back.In' })
    this.tweens.add({ targets: this.cadena, alpha: 0.4, duration: 400 })
    await say(this, [this.kid('¡Listo!'), this.kid('¡Sos libre!'), this.kid('Dale, andate.')])
    await this.wait(1400)
    await say(this, [this.kid('Dale…')])
    // Lo empuja de la pata: no se mueve
    await this.tween({ targets: this.player, x: POS.elefante - 80, duration: 500 })
    await this.tween({ targets: this.player, x: POS.elefante - 70, duration: 120, yoyo: true, repeat: 2 })
    await this.tween({ targets: this.player, x: POS.soltar, duration: 500 })
    this.face(POS.elefante)
    await say(this, [this.kid('¿Por qué no te vas?'), this.think('Está suelto.'), this.think('Y no se mueve.'), this.vela('Jorge…')])
    await this.fragmento('elefante', 'El elefante', 'Me escapé para soltar al elefante. Le saqué la estaca de la cadena: era un palito. Pero no se fue. Se quedó quieto.')
    await this.reproche()
  }

  // Lechuga le reprocha, de muy mala manera. El sueño lo deforma: crece, la llama se achica y hace frío. Después se rompe
  private async reproche() {
    this.music?.stop(0.3)
    this.music = undefined
    const view = this.cameras.main.worldView
    await say(this, [{ kind: 'speech', text: '¡¿QUÉ HACÉS, MOCOSO?!', anchor: () => ({ x: view.left + 60, y: 400 }) }])
    // Crece desde los pies
    this.lechuga.setTexture('lechugaEnojado').setOrigin(0.5, 1).setDepth(784).setVisible(true).setAlpha(1).setFlipX(false).setPosition(view.left - 40, FLOOR)
    this.face(POS.soltar - 200)
    await this.tween({ targets: this.lechuga, x: POS.soltar - 140, duration: 700, ease: 'Sine.Out' })
    // La llama se achica y hace frío, como cerca del papá
    this.frio = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x6fa8ff, 0).setOrigin(0).setScrollFactor(0).setDepth(785)
    this.tweens.add({ targets: this.frio, fillAlpha: 0.14, duration: 1200 })
    this.tweens.add({ targets: this.flame, scale: 0.4, duration: 1200 })
    this.flameGlow.setFillStyle(0x9fd6ff, 0.18)
    this.cameras.main.shake(200, 0.004)
    await say(this, [this.lech('¡¿Quién te dio permiso?!'), this.lech('¡Ese animal es mío! ¡MÍO!')])
    this.tweens.add({ targets: this.lechuga, scale: 1.2, duration: 600 })
    await say(this, [this.kid('Está triste…')])
    this.cameras.main.shake(250, 0.005)
    await say(this, [this.lech('¡¿Triste?! ¡Los animales no están tristes, nene! ¡Trabajan!'), this.lech('¿Y tu madre? ¿Dónde está tu madre? ¡Así te crían!')])
    this.tweens.add({ targets: this.lechuga, scale: 1.4, duration: 600 })
    this.cameras.main.shake(300, 0.006)
    await say(this, [this.lech('¡Mocoso metido! ¡Te vas a acordar de esto toda la vida!'), this.vela('Jorge… no lo mires a él.'), this.vela('Esto ya no es el recuerdo.')])
    // Lechuga se rompe: se vuelve una falla del sueño y desaparece
    sfx.estatica()
    for (let i = 0; i < 6; i++) {
      this.lechuga.setTexture(i % 2 ? 'ente' : 'lechugaEnojado').setX(this.lechuga.x + (i % 2 ? 8 : -8))
      await this.wait(110)
    }
    sfx.grieta()
    await this.tween({ targets: this.lechuga, alpha: 0, scaleX: 2, scaleY: 0.2, duration: 300 })
    this.lechuga.setVisible(false).setScale(1).setTexture('lechuga').setOrigin(0.5).setDepth(9).setY(FLOOR - 75)
    this.tweens.add({ targets: this.dark, scale: 0.55, duration: 1500 })
    await this.wait(900)
    await say(this, [
      this.think('Se rompió.'),
      this.think('Me quiero ir.'),
      this.think('No sé volver.'),
      this.think('¿Dónde está mamá?'),
      this.vela('Jorge. ¿Qué te dijo tu mamá en la entrada?'),
      this.think('Que me quede quieto…'),
      this.think('…donde estoy.'),
    ])
    this.phase = 'quieto'
    this.stillMs = this.movingMs = 0
    this.updateGoal()
  }

  // ---------- Final: la mamá lo encuentra ----------

  private async final() {
    this.phase = 'final'
    this.leaving = true
    this.goal.set(null)
    const view = this.cameras.main.worldView
    await say(this, [{ kind: 'speech', text: '¡Jorge!', anchor: () => ({ x: view.left + 30, y: 420 }) }])
    // Se hace la luz: se va el frío y todo el recuerdo aparece en color
    this.music = startCalesita()
    this.music.clear()
    if (this.frio) this.tweens.add({ targets: this.frio, fillAlpha: 0, duration: 1500 })
    this.tweens.add({ targets: this.flame, scale: 1, duration: 1500 })
    this.flameGlow.setFillStyle(0xffc56b, 0.18)
    this.tweens.add({ targets: this.dark, scale: 5, alpha: 0, duration: 3500, ease: 'Sine.InOut' })
    for (const o of this.objs) if (!o.revealed) this.revealNow(o)
    this.cameras.main.stopFollow()
    const mama = this.add.image(view.left - 60, FLOOR - 75, 'mama').setDepth(9)
    const glow = this.add.circle(mama.x, mama.getTopCenter().y + 22, 24, 0xfff3d6, 0.75).setDepth(9).setBlendMode(Phaser.BlendModes.ADD)
    const target = this.player.x - 80
    this.face(target)
    await this.tween({
      targets: [mama, glow],
      x: `+=${target - mama.x}`,
      duration: (Math.max(0, target - mama.x) / 150) * 1000,
      onUpdate: () => {
        mama.y = FLOOR - 75 - Math.abs(Math.sin(mama.x / 30)) * 3
      },
    })
    mama.setTexture('mamaAgachada').setY(FLOOR - 75)
    glow.setY(mama.getTopCenter().y + 58)
    await this.wait(500)
    const head = this.headOf(mama, 36)
    await say(this, [
      { kind: 'speech', text: '¡Acá estás!', anchor: head },
      { kind: 'speech', text: '¿Viste? Te quedaste quieto y te encontré.', anchor: head },
      this.kid('Mamá.'),
    ])
    // Abrazo
    await this.tween({ targets: this.player, x: mama.x + 34, duration: 500 })
    await this.wait(900)
    await say(this, [
      this.kid('Lo solté, mamá. Pero no se fue.'),
      { kind: 'speech', text: 'Vamos a casa.', anchor: head },
      this.think('No le puedo ver la cara.'),
      this.think('Pero sé que es ella.'),
      this.vela('Muy bien, Jorge. Ya está.'),
      this.vela('Ahora vas a despertar.'),
    ])
    state.lineaDeTiempo.push('Infancia: el circo')
    const cam = this.cameras.main
    cam.fadeOut(2500, 255, 248, 236)
    this.music?.stop(2.5)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    await this.wait(600)
    this.scene.start('Office', { despertar: true })
  }

  revealNow(o: Reveal) {
    o.revealed = true
    this.tweens.add({ targets: o.color, alpha: 1, duration: 1200 })
    o.onReveal?.()
  }

  // ---------- Ayudas ----------

  private face(x: number) {
    this.facing = x < this.player.x ? -1 : 1
    this.player.setFlipX(this.facing < 0)
  }

  // Jorge chico camina solo hasta `x` (en las cinemáticas)
  private async walkTo(x: number) {
    const from = this.player.x
    if (Math.abs(x - from) < 2) return
    this.face(x)
    await this.tween({
      targets: this.player,
      x,
      duration: (Math.abs(x - from) / WALK) * 1000,
      onUpdate: () => this.player.setTexture(Math.floor(Math.abs(this.player.x - from) / 16) % 2 === 0 ? 'chico1' : 'chico2'),
    })
    this.player.setTexture('chico0')
  }

  private wait(ms: number) {
    return new Promise<void>((r) => this.time.delayedCall(ms, r))
  }

  private tween(config: Phaser.Types.Tweens.TweenBuilderConfig) {
    return new Promise<void>((r) => this.tweens.add({ ...config, onComplete: () => r() }))
  }

  private async run(fn: () => Promise<void>) {
    this.busy = true
    this.prompt.setVisible(false)
    if (!this.hidden) this.player.setTexture('chico0')
    try {
      await fn()
    } finally {
      if (!this.leaving) {
        this.busy = false
        this.lockUntil = this.time.now + 200
      }
    }
  }

  // ---------- Bucle ----------

  // El cuidador camina de punta a punta con la linterna; el ente va y viene, titilando
  private patrullas(dt: number, time: number) {
    for (const g of this.guardias) {
      if (g.pause > 0) {
        g.pause -= dt
        if (g.pause <= 0) g.dir *= -1
      } else {
        g.x += g.dir * 70 * (dt / 1000)
        if (g.x <= g.min || g.x >= g.max) {
          g.x = Phaser.Math.Clamp(g.x, g.min, g.max)
          g.pause = 1500
        }
      }
      g.img.setX(g.x).setFlipX(g.dir < 0)
      g.cone.clear()
      g.cone.fillStyle(0xffe9a8, 0.13).fillTriangle(g.x + g.dir * 14, 488, g.x + g.dir * CONE, 430, g.x + g.dir * CONE, FLOOR)
      g.cone.fillStyle(0x2b2b2b).fillRect(g.x + g.dir * 14 - 4, 484, 8, 10)
    }
    for (const e of this.entes) {
      if (!e.img.visible) continue
      e.x += e.dir * 62 * (dt / 1000)
      if (e.x <= e.min || e.x >= e.max) {
        e.x = Phaser.Math.Clamp(e.x, e.min, e.max)
        e.dir *= -1
      }
      const jitter = Math.sin(time / 37) > 0.92 ? Phaser.Math.Between(-6, 6) : 0
      e.img.setPosition(e.x + jitter, FLOOR - 75).setAlpha(0.7 + Math.random() * 0.3).setFlipX(e.dir > 0)
    }
  }

  private detectar(dt: number): Guardia | 'ente' | null {
    if (this.hidden || this.time.now < this.safeUntil) return null
    const px = this.player.x
    for (const g of this.guardias) {
      const d = (px - g.x) * g.dir
      const enLuz = d > 0 && d < CONE
      if (enLuz || Math.abs(px - g.x) < 30) g.seenMs += dt
      else g.seenMs = 0
      if (g.seenMs > 200) {
        g.seenMs = 0
        return g
      }
    }
    for (const e of this.entes) if (e.img.visible && Math.abs(px - e.x) < 34) return 'ente'
    return null
  }

  update(time: number, delta: number) {
    const dt = Math.min(delta, 100)
    // La llama sigue a Jorge con un poco de atraso, flotando
    if (this.flameOn && this.phase !== 'final') {
      const tx = this.player.x + 70 * this.facing
      const ty = KID - 110 + Math.sin(time / 420) * 8
      const k = 1 - Math.exp(-dt / 260)
      this.flame.x += (tx - this.flame.x) * k
      if (!this.tweens.isTweening(this.flame)) this.flame.y += (ty - this.flame.y) * k
      this.flameGlow.setRadius(60 + Math.sin(time / 180) * 4 + (this.phase === 'quieto' ? (this.stillMs / STILL_MS) * 24 : 0))
      this.dark.setPosition(this.flame.x, this.flame.y)
      // Lo que la luz toca un rato, se recuerda
      for (const o of this.objs) {
        if (o.revealed) continue
        if (Math.abs(o.x - this.flame.x) < REVEAL) {
          o.lit += dt
          if (o.lit > 700) {
            sfx.reveal()
            this.revealNow(o)
          }
        } else o.lit = 0
      }
    } else if (!this.flameOn) {
      this.dark.setPosition(this.player.x, this.player.y - 30)
    }

    const k = this.keys
    const ePressed = Phaser.Input.Keyboard.JustDown(k.E)
    const tabPressed = Phaser.Input.Keyboard.JustDown(k.TAB)
    if (this.busy || time < this.lockUntil) return

    if (tabPressed) {
      void this.run(() => openDiary(this))
      return
    }

    // Sigilo: el cuidador y el ente se mueven, y si ven o tocan a Jorge, vuelve al último lugar seguro
    if (this.phase === 'sigilo') {
      this.patrullas(dt, time)
      const pillado = this.detectar(dt)
      if (pillado) {
        void this.run(() => (pillado === 'ente' ? this.pillado('ente') : this.pillado('guardia', pillado)))
        return
      }
      const px = this.player.x
      if (!this.vioGuardia && px > POS.leon + 40) {
        void this.run(() => this.introGuardia())
        return
      }
      if (!this.vioEnte && px > POS.monos + 60) {
        void this.run(() => this.introEnte())
        return
      }
      // Lugares seguros, entre una parte y otra
      if (!this.hidden) {
        if (px > 6800 && this.checkpoint < 6800) [this.checkpoint, this.checkpointHidden] = [6800, false]
        if (px > 7850 && this.checkpoint < 7850) [this.checkpoint, this.checkpointHidden] = [7850, false]
      }
    }

    const dir = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0)
    const movable = this.phase === 'afuera' || this.phase === 'escape' || this.phase === 'sigilo' || this.phase === 'quieto'
    if (dir !== 0 && movable) {
      if (this.hidden) this.hide(false)
      const A = AREA[this.area]
      const from = this.player.x
      this.player.x = Phaser.Math.Clamp(from + dir * WALK * (dt / 1000), A.min, A.max)
      const moved = Math.abs(this.player.x - from)
      this.facing = dir
      this.player.setFlipX(dir < 0)
      this.walkDist += moved
      this.stepDist += moved
      this.player.setTexture(Math.floor(this.walkDist / 16) % 2 === 0 ? 'chico1' : 'chico2')
      if (this.stepDist > 34) {
        this.stepDist = 0
        sfx.step()
      }
    } else if (!this.hidden) {
      this.player.setTexture('chico0')
    }

    // Al final: quedarse quieto
    if (this.phase === 'quieto') {
      if (dir === 0) {
        this.stillMs += dt
        if (this.stillMs > STILL_MS) {
          void this.run(() => this.final())
          return
        }
      } else {
        this.stillMs = 0
        this.movingMs += dt
        if (this.movingMs > 15000 && !this.hinted) {
          this.hinted = true
          void this.run(() => say(this, [this.vela('Jorge, pará un segundo.'), this.vela('Acordate de lo que te dijo tu mamá.')]))
          return
        }
      }
    }

    const spot = this.spots.find((s) => s.when() && Math.abs(this.player.x - s.x) < 80)
    if (spot) {
      this.prompt.setVisible(true).setPosition(spot.x, 300)
      this.promptLabel.setText(spot.label())
      if (ePressed) void this.run(spot.action)
    } else {
      this.prompt.setVisible(false)
    }
  }
}

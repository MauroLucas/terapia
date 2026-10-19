import * as Phaser from 'phaser'
import { FONT, HAND_FONT, makeTextures } from '../art'
import { sfx, startFeria } from '../audio'
import { addPista, state } from '../state'
import { eyelids, objective, onKey, say, text, toast, type Line, type Point } from '../ui'
import { openDiary } from './diary'
import { controlsHelp } from '../touch'

// Sesión 1: la feria. Primer sueño lúcido: un recuerdo de cuando Jorge, de chico, se perdió en una feria.
//   [entrada] … [algodón de azúcar] … [calesita] … [vuelta al mundo] →(vuelve a la entrada)
// Está todo a oscuras. El doctor Vela es una llama que acompaña a Jorge: lo que ilumina toma forma y color.
// Hay que recordar tres momentos (el algodón, la calesita y lo que dijo la mamá en la entrada) y, al final,
// quedarse quieto: así la mamá lo encuentra. Después todo se congela, se corta la comunicación con Vela y la gente
// sin cara se vuelve violenta: se pone negra, crece, se le parte la cabeza llena de dientes y grita. Jorge huye por
// las carpas de la feria hasta encontrar la salida (la sortija). Si lo agarran, vuelve a la primera puerta.
//   Huida: [feria: la carpa] → [callejón: entrada, espejos, caballos, la carpa de atrás, salida] → cada carpa es un cuarto
// Al despertar sigue en Office (modo despertar).
// No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const W = 4400
const FLOOR = 600
const KID = FLOOR - 52 // centro de Jorge chico parado
const WALK = 170 // un poco más lento que de grande
const REVEAL = 240 // hasta dónde llega la luz de la llama (px, en horizontal)
const STILL_MS = 5000 // cuánto hay que quedarse quieto al final

const POS = {
  arco: 420,
  algodon: 1150,
  inicio: 1820,
  banco: 1770,
  calesita: 2150,
  rueda: 3150,
  bucle: 4280, // pasando la vuelta al mundo, la feria vuelve a empezar
  vuelta: 700,
}
// Gente sin cara. Las que tienen `dice` se pueden "hablar"
const SOMBRAS: { x: number; flip?: boolean; dice?: string; piensa?: string }[] = [
  { x: 960, flip: true },
  { x: 1520, dice: '¿Y tu mamá, nene?', piensa: 'No tiene cara.' },
  { x: 2620, flip: true, dice: '…', piensa: 'Hablan, pero no se les entiende nada.' },
  { x: 2790 },
  { x: 3420, flip: true },
]

type Phase = 'intro' | 'explorar' | 'quieto' | 'final' | 'huida'

// La huida: la feria, el callejón de carpas y los cuartos (cada carpa es uno). Cada zona tiene su propio tramo del mundo
type Area = 'feria' | 'callejon' | 'espejos' | 'caballos' | 'emboscada' | 'salida'
const AREAS: Record<Area, { x: number; w: number }> = {
  feria: { x: 0, w: W },
  callejon: { x: 5200, w: 2600 },
  espejos: { x: 8400, w: 1280 },
  caballos: { x: 9900, w: 1280 },
  emboscada: { x: 11400, w: 1600 },
  salida: { x: 13300, w: 1800 },
}
const CARPA = 2860 // la carpa que aparece en la feria: la primera puerta
const ENTRADA = 5330 // donde se aparece Jorge en el callejón (y adonde vuelve si lo agarran)
interface Puerta {
  area: Area
  x: number
  label: string
  to: Area
  toX: number
}
const PUERTAS: Puerta[] = [
  { area: 'feria', x: CARPA, label: 'Entrar a la carpa', to: 'callejon', toX: ENTRADA + 90 },
  { area: 'callejon', x: 5900, label: 'Carpa', to: 'espejos', toX: AREAS.espejos.x + 230 },
  { area: 'callejon', x: 6500, label: 'Carpa', to: 'caballos', toX: AREAS.caballos.x + 230 },
  { area: 'callejon', x: 7100, label: 'Carpa', to: 'emboscada', toX: AREAS.emboscada.x + 230 },
  { area: 'callejon', x: 7620, label: 'Carpa', to: 'salida', toX: AREAS.salida.x + 230 },
  { area: 'espejos', x: AREAS.espejos.x + 140, label: 'Salir', to: 'callejon', toX: 5900 },
  { area: 'caballos', x: AREAS.caballos.x + 140, label: 'Salir', to: 'callejon', toX: 6500 },
  { area: 'emboscada', x: AREAS.emboscada.x + 140, label: 'Salir', to: 'callejon', toX: 7100 },
  { area: 'salida', x: AREAS.salida.x + 140, label: 'Salir', to: 'callejon', toX: 7620 },
]
const SORTIJA = AREAS.salida.x + 1580
const WALK_HUIDA = 215 // corriendo, con miedo
const SER_MAX = 178
const QUIETO_MS = 700 // cuánto tiene que estar quieto Jorge para que los seres lo pierdan
interface Ser {
  img: Phaser.GameObjects.Image
  area: Area | 'fuera' // 'fuera': está cruzando una puerta detrás de Jorge
  estado: 'dormido' | 'perseguir' | 'buscar'
  vel: number
  ms: number
  dir: number
  paso: number
  homeArea: Area
  homeX: number
}
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
  label: string
  when: () => boolean
  action: () => Promise<void>
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
  private music?: ReturnType<typeof startFeria>
  private objs: Reveal[] = []
  private spots: Spot[] = []
  private horses: Reveal[] = []
  private horseTweens: Phaser.Tweens.Tween[] = []
  private sortijaRing!: Phaser.GameObjects.Graphics
  private archLetters: Phaser.GameObjects.Text[] = []
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
  private looped = false
  private lastCall = 0
  private calls = 0
  private stillMs = 0
  private movingMs = 0
  private hinted = false
  private sombraImgs: { x: number; img: Phaser.GameObjects.Image }[] = []
  private area: Area = 'feria'
  private seres: Ser[] = []
  private quietoMs = 0
  private atrapadas = 0
  private glitchAt = 0
  private entrados = new Set<Area>()
  private seguir = 0 // para cancelar al ser que sigue a Jorge por una puerta
  private rojo!: Phaser.GameObjects.Rectangle

  constructor() {
    super('Dream')
  }

  create() {
    this.busy = true
    this.leaving = false
    this.phase = 'intro'
    this.facing = 1
    this.flameOn = false
    this.fragments = new Set()
    this.knowsMama = this.looped = this.hinted = false
    this.calls = this.stillMs = this.movingMs = 0
    this.lastCall = 0
    this.objs = []
    this.horses = []
    this.horseTweens = []
    this.archLetters = []
    this.sombraImgs = []
    this.seres = []
    this.area = 'feria'
    this.quietoMs = this.atrapadas = this.glitchAt = 0
    this.entrados = new Set()
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0d1120')
    this.drawFeria()
    this.drawCallejon()
    this.drawCuartos()

    this.player = this.add.image(POS.inicio, KID, 'chico0').setDepth(10)
    this.flameGlow = this.add.circle(0, 0, 60, 0xffc56b, 0.18).setBlendMode(Phaser.BlendModes.ADD)
    this.flame = this.add.container(POS.inicio + 70, -200, [this.flameGlow, this.add.image(0, 0, 'llama')]).setDepth(790).setVisible(false)
    this.dark = this.add.image(POS.inicio, KID - 40, this.darkness()).setDepth(780).setScale(0.55)
    // Un rojo que late, por encima de todo, cuando el sueño se descontrola
    this.rojo = this.add.rectangle(0, 0, 1280, 720, 0x8a0a14, 0).setOrigin(0).setScrollFactor(0).setDepth(777).setBlendMode(Phaser.BlendModes.MULTIPLY)

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
    cam.setBounds(0, 0, W, 720)
    cam.startFollow(this.player, true, 0.08, 0.08)
    cam.centerOn(this.player.x, 360)
    this.music = startFeria()
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

  private drawFeria() {
    const g = this.add.graphics()
    // Cielo de noche, pasto pisado y tierra
    g.fillStyle(0x141a2e).fillRect(0, 0, W, FLOOR)
    g.fillStyle(0x2a3326).fillRect(0, FLOOR, W, 120)
    g.fillStyle(0x3a4630).fillRect(0, FLOOR, W, 8)
    // Guirnaldas de lamparitas: siempre en color, la oscuridad las tapa
    const bulbs = [0xffd36a, 0xff8a6a, 0x9fd6ff, 0xb9f2a0]
    for (let x0 = 0; x0 < W; x0 += 600) {
      g.lineStyle(2, 0x2b2f3a)
      g.beginPath()
      for (let x = 0; x <= 600; x += 20) g.lineTo(x0 + x, 70 + Math.sin((x / 600) * Math.PI) * 50)
      g.strokePath()
      for (let x = 30; x < 600; x += 60) g.fillStyle(bulbs[(x / 60) % 4 | 0]).fillCircle(x0 + x, 74 + Math.sin((x / 600) * Math.PI) * 50, 5)
    }

    this.drawArco()
    this.reveal(POS.algodon, (g2, k) => this.paintAlgodon(g2, k, POS.algodon))
    this.reveal(POS.banco, (g2, k) => this.paintBanco(g2, k, POS.banco - 60))
    this.drawCalesita()
    this.reveal(POS.rueda, (g2, k) => this.paintRueda(g2, k, POS.rueda), 1)
    this.reveal(POS.rueda + 20, (g2, k) => this.paintBanco(g2, k, POS.rueda + 20))

    for (const s of SOMBRAS) this.sombraImgs.push({ x: s.x, img: this.add.image(s.x, FLOOR - 75, 'sombra').setFlipX(!!s.flip).setAlpha(0.85).setDepth(8) })
  }

  private drawArco() {
    const x = POS.arco
    this.reveal(x, (g, k) => {
      g.fillStyle(k(0x8a2f2f)).fillRect(x - 170, 300, 24, FLOOR - 300).fillRect(x + 146, 300, 24, FLOOR - 300)
      g.fillStyle(k(0xa83a3a)).fillRoundedRect(x - 190, 250, 380, 70, 10)
      g.lineStyle(3, k(0xe0b04a)).strokeRoundedRect(x - 190, 250, 380, 70, 10)
      for (let i = 0; i < 12; i++) g.fillStyle(k(0xffe08a)).fillCircle(x - 172 + i * 31.5, 258, 4)
    }, 3, () => this.archLetters.forEach((t) => t.setColor('#ffe08a')))
    // FERIA, con la "E" que se apaga y se prende
    const letters = ['F', 'E', 'R', 'I', 'A']
    letters.forEach((l, i) => {
      const t = text(this, x - 112 + i * 56, 290, l, 34, '#6f7280', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(4)
      this.archLetters.push(t)
      if (l === 'E') this.tweens.add({ targets: t, alpha: 0.15, duration: 900, yoyo: true, repeat: -1, repeatDelay: 1400 })
    })
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

  private paintRueda(g: Phaser.GameObjects.Graphics, k: Paint, x: number) {
    const cy = 300
    g.lineStyle(6, k(0x6f7889)).lineBetween(x, cy, x - 150, FLOOR).lineBetween(x, cy, x + 150, FLOOR)
    g.lineStyle(6, k(0x9aa3b5)).strokeCircle(x, cy, 220)
    g.lineStyle(3, k(0x9aa3b5)).strokeCircle(x, cy, 200)
    const cabins = [0xc0392b, 0x4c7bd1, 0xe0b04a, 0x4f9d4a, 0xe8a0b4, 0x9fb4c8, 0xe0842a, 0xf1ece0]
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2
      const px = x + Math.cos(a) * 210
      const py = cy + Math.sin(a) * 210
      g.lineStyle(2, k(0x9aa3b5)).lineBetween(x, cy, px, py)
      g.fillStyle(k(cabins[i])).fillRoundedRect(px - 18, py + 6, 36, 26, 6)
      g.lineStyle(2, k(0x6f7889)).lineBetween(px, py, px, py + 6)
    }
    g.fillStyle(k(0xd9dde5)).fillCircle(x, cy, 14)
  }

  // ---------- Personajes y líneas ----------

  private kidHead = (): Point => ({ x: this.player.x + 4 * this.facing, y: this.player.y - 52 })
  private think = (t: string): Line => ({ kind: 'thought', text: t, anchor: this.kidHead })
  // La voz del doctor llega por la máquina: globo de "portero eléctrico", desde la llama (o desde arriba, si todavía no está)
  private vela = (t: string): Line => ({
    kind: 'intercom',
    text: t,
    anchor: () => (this.flameOn ? { x: this.flame.x, y: this.flame.y - 20 } : { x: this.cameras.main.worldView.centerX, y: this.cameras.main.worldView.top + 160 }),
  })
  private headOf = (img: Phaser.GameObjects.Image, drop = 0) => (): Point => ({ x: img.x, y: img.getTopCenter().y + drop })
  private sayAt = (img: Phaser.GameObjects.Image, t: string, drop = 0): Line => ({ kind: 'speech', text: t, anchor: this.headOf(img, drop) })

  private setupSpots() {
    this.spots = [
      { x: POS.arco, label: 'Entrada', when: () => this.isRevealed(POS.arco), action: () => this.entrada() },
      { x: POS.algodon, label: 'Algodón de azúcar', when: () => this.isRevealed(POS.algodon), action: () => this.algodon() },
      { x: POS.calesita, label: this.fragments.has('calesita') ? 'Calesita' : 'Subirse a la calesita', when: () => this.isRevealed(POS.calesita), action: () => this.calesita() },
      ...SOMBRAS.filter((s) => s.dice).map((s) => ({ x: s.x, label: 'Alguien', when: () => this.flameOn, action: () => this.sombra(s.x, s.dice!, s.piensa!) })),
    ]
  }

  // ---------- Secuencia ----------

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
    this.phase = 'explorar'
    this.lastCall = this.time.now - 9000
    this.updateGoal()
    const help = text(this, 24, this.scale.height - 34, controlsHelp('← → / A D caminar   ·   E examinar   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa'), 16, '#aab2c4')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500 }))
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
    for (const [px, mirror] of [[470, false], [700, true]] as [number, boolean][]) {
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

  // ---------- Los tres recuerdos ----------

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
      this.facing = to < this.player.x ? -1 : 1
      this.player.setFlipX(this.facing < 0)
      const from = this.player.x
      await this.tween({
        targets: this.player,
        x: to,
        duration: (Math.abs(to - from) / WALK) * 1000,
        onUpdate: () => this.player.setTexture(Math.floor(Math.abs(this.player.x - from) / 16) % 2 === 0 ? 'chico1' : 'chico2'),
      })
      this.player.setTexture('chico0')
    }
    this.facing = mamaX > this.player.x ? 1 : -1
    this.player.setFlipX(this.facing < 0)
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
    await this.fragmento(
      'algodon',
      'El algodón de azúcar',
      this.knowsMama ? 'Fui a la feria con mamá. Me compró algodón de azúcar.' : 'Fui a la feria con una mujer. Me compró algodón de azúcar. No le puedo ver la cara.',
    )
  }

  private async entrada() {
    if (this.fragments.has('regla')) {
      await say(this, [this.think('Afuera no hay nada. Está todo negro.')])
      return
    }
    await this.memoria(POS.arco + 20, true, (m, c) => [
      this.sayAt(m, 'Jorge, mirame.', 36),
      this.sayAt(m, 'Si te perdés, no salgas a buscarme.', 36),
      this.sayAt(m, 'Quedate quieto donde estás, que yo te encuentro. ¿Sí?', 36),
      this.sayAt(c, 'Sí, mamá.'),
    ], POS.arco + 110)
    const before = this.fragments.size > 0
    this.knowsMama = true
    await say(this, [this.think('Mamá…'), this.think(before ? 'La mujer de la feria era mi mamá.' : 'Vine a la feria con mi mamá.')])
    await this.fragmento('regla', 'Lo que me dijo mamá', 'Al entrar a la feria, mamá me dijo: "Si te perdés, quedate quieto donde estás, que yo te encuentro."')
  }

  private async calesita() {
    if (this.fragments.has('calesita')) {
      await say(this, [this.think('La calesita se quedó quieta.')])
      return
    }
    await this.sortija()
    const ella = this.knowsMama ? 'mamá' : 'ella'
    await say(this, [this.think('Me bajé del otro lado.'), this.think(`Di la vuelta y ${ella} ya no estaba en el banco.`)])
    await this.fragmento(
      'calesita',
      'La calesita',
      `Saqué la sortija. ${this.knowsMama ? 'Mamá' : 'Ella'} me saludaba desde el banco. Me bajé del otro lado de la calesita y no la vi más.`,
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
    const track = this.add.rectangle(cx, y, 440, 14, 0x000000, 0.6).setStrokeStyle(2, 0x6c7385)
    const target = this.add.rectangle(cx, y, zone, 14, 0xe0b04a, 0.5)
    const ring = this.add.circle(cx, y, 11).setStrokeStyle(4, 0xe0b04a)
    ui.add([label, track, target, ring])
    let misses = 0
    const start = this.time.now
    const move = () => ring.setX(cx + Math.sin(((this.time.now - start) / 1000) * 2) * 205)
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
    await this.memoria(POS.banco - 60, false, (m) => [this.sayAt(m, '¡Muy bien, Jorge! ¡Te ganaste otra vuelta!')], null)
    // La calesita para
    this.horseTweens.forEach((t) => t.stop())
    this.horses.forEach((h) => this.tweens.add({ targets: [h.gray, h.color], y: 0, duration: 800 }))
    this.music?.clear()
    await this.wait(900)
    this.events.off('update', follow)
    rider.destroy()
    this.facing = 1
    this.player.setVisible(true).setFlipX(false).setX(POS.calesita + 330)
    await this.wait(300)
  }

  private async fragmento(id: string, titulo: string, texto: string) {
    this.fragments.add(id)
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
    this.updateGoal()
    const n = this.fragments.size
    if (n === 1) await say(this, [this.vela('Eso que viste es un recuerdo, Jorge. Lo veo en la pantalla.'), this.vela('Seguí buscando.')])
    else if (n === 2) await say(this, [this.vela('Vas muy bien. Falta poco.')])
    else {
      await say(this, [this.vela('Ya lo tenés, Jorge.'), this.vela('¿Qué te dijo tu mamá?'), this.think('Que me quede quieto…'), this.think('…donde estoy.')])
      this.phase = 'quieto'
      this.stillMs = this.movingMs = 0
      this.updateGoal()
    }
  }

  private updateGoal() {
    if (this.phase === 'quieto') this.goal.set('Quedarme quieto donde estoy')
    else if (this.phase === 'explorar') this.goal.set(`Seguir la luz y recordar qué pasó (${this.fragments.size}/3)`)
    else this.goal.set(null)
  }

  // ---------- Otros ----------

  private async sombra(x: number, dice: string, piensa: string) {
    const fake = { x, y: FLOOR - 150 }
    await say(this, [{ kind: 'speech', text: dice, anchor: () => fake }, this.think(piensa)])
  }

  // Pasando la vuelta al mundo, la feria vuelve a empezar
  private async bucle() {
    const cam = this.cameras.main
    cam.fadeOut(400, 5, 6, 12)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.player.setX(POS.vuelta)
    this.flame.setX(POS.vuelta + 70)
    cam.centerOn(POS.vuelta, 360)
    cam.fadeIn(400, 5, 6, 12)
    await this.wait(400)
    if (!this.looped) {
      this.looped = true
      await say(this, [this.think('Volví a la entrada.'), this.think('Esta feria no se termina nunca.')])
    }
  }

  // La voz de la mamá, lejos, de algún lado de la feria
  private callOut() {
    const side = Math.random() < 0.5 ? -1 : 1
    const t = text(this, side < 0 ? 140 : this.scale.width - 140, 150 + Math.random() * 80, '¡Jorge…!', 26, '#f2d7b0', { fontFamily: HAND_FONT, fontStyle: 'italic' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(955)
      .setAlpha(0)
    this.tweens.chain({
      targets: t,
      tweens: [
        { alpha: 0.85, x: t.x + side * -20, duration: 900 },
        { alpha: 0.85, duration: 1200 },
        { alpha: 0, x: t.x + side * -40, duration: 1200, onComplete: () => t.destroy() },
      ],
    })
  }

  private async primeraLlamada() {
    this.callOut()
    await this.wait(1600)
    await say(this, [this.think('Alguien me llama.'), this.think('Es una voz de mujer.'), this.vela('¿La escuchás? Tu sueño la está recordando. Seguí la luz.')])
  }

  private floatText(msg: string, x: number, y: number) {
    const t = text(this, x, y, msg, 18, '#f2d7b0', { fontFamily: HAND_FONT }).setOrigin(0.5).setDepth(960)
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 1100, onComplete: () => t.destroy() })
  }

  // ---------- Final: la mamá lo encuentra ----------

  private async final() {
    this.phase = 'final'
    this.leaving = true
    this.goal.set(null)
    const view = this.cameras.main.worldView
    await say(this, [{ kind: 'speech', text: '¡Jorge!', anchor: () => ({ x: view.left + 30, y: 420 }) }])
    // Se hace la luz: todo el recuerdo aparece en color
    this.music?.clear()
    this.tweens.add({ targets: this.dark, scale: 5, alpha: 0, duration: 3500, ease: 'Sine.InOut' })
    for (const o of this.objs) if (!o.revealed) this.revealNow(o)
    this.cameras.main.stopFollow()
    const mama = this.add.image(view.left - 60, FLOOR - 75, 'mama').setDepth(9)
    const glow = this.add.circle(mama.x, mama.getTopCenter().y + 22, 24, 0xfff3d6, 0.75).setDepth(9).setBlendMode(Phaser.BlendModes.ADD)
    const target = this.player.x - 80
    this.facing = -1
    this.player.setFlipX(true)
    await this.tween({
      targets: [mama, glow],
      x: `+=${target - mama.x}`,
      duration: ((target - mama.x) / 150) * 1000,
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
      { kind: 'speech', text: 'Mamá.', anchor: this.kidHead },
    ])
    // Abrazo
    await this.tween({ targets: this.player, x: mama.x + 34, duration: 500 })
    await this.wait(900)
    await say(this, [
      { kind: 'speech', text: 'Vamos a casa.', anchor: head },
      this.think('No le puedo ver la cara.'),
      this.think('Pero sé que es ella.'),
      this.vela('Muy bien, Jorge. Ya está.'),
    ])
    if (!state.lineaDeTiempo.includes('Infancia: la feria')) state.lineaDeTiempo.push('Infancia: la feria')
    await this.congelar(mama, glow)
  }

  // ---------- El final se descontrola ----------

  // Todo se congela: la música se frena, los caballitos se quedan quietos, la mamá también, y se va el color
  private async congelar(mama: Phaser.GameObjects.Image, glow: Phaser.GameObjects.Arc) {
    await say(this, [this.vela('Ahora vas a desp—')])
    sfx.congelar()
    this.music?.stop(0.2)
    this.tweens.killTweensOf(this.dark)
    this.horseTweens.forEach((t) => t.pause())
    this.tweens.killTweensOf(this.archLetters)
    this.cameras.main.shake(400, 0.004)
    for (const o of this.objs) this.tweens.add({ targets: o.color, alpha: 0.2, duration: 1600 })
    mama.setTint(0x6f7280)
    glow.setVisible(false)
    this.tweens.add({ targets: this.dark, scale: 0.95, alpha: 1, duration: 2500 })
    await this.wait(1600)
    await say(this, [this.think('¿Mamá?'), this.think('No se mueve.'), this.think('Nadie se mueve.')])
    // La llama tiembla y la voz de Vela se rompe
    this.tweens.add({ targets: this.flame, alpha: 0.25, duration: 90, yoyo: true, repeat: 7 })
    sfx.estatica()
    await say(this, [this.vela('Jor… ¿me escu…?'), this.vela('…ge… no te…')])
    // Jorge empieza a caminar solo, hacia una de las personas sin cara (la que tiene adelante, o si no, la de atrás)
    const px = this.player.x
    const adelante = this.sombraImgs.filter((s) => s.x > px + 300).sort((a, b) => a.x - b.x)[0]
    const atras = this.sombraImgs.filter((s) => s.x < px - 300).sort((a, b) => b.x - a.x)[0]
    const elegida = adelante ?? atras
    const ser = elegida.img
    const lado = adelante ? 1 : -1
    // La carpa va a aparecer detrás de Jorge, del lado contrario
    this.carpaX = Phaser.Math.Clamp(ser.x - lado * 560, 300, W - 300)
    this.carpaFeria.x = this.carpaX - CARPA
    for (const o of this.sombraImgs) if (o !== elegida) this.tweens.add({ targets: o.img, alpha: 0.25, duration: 1500 })
    await say(this, [this.think('Mis piernas caminan solas.')])
    this.player.setFlipX(lado < 0)
    this.facing = lado
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    const destino = ser.x - lado * 190
    let paso = 0
    await this.tween({
      targets: this.player,
      x: destino,
      duration: Math.max(800, (Math.abs(destino - this.player.x) / 110) * 1000),
      onUpdate: () => {
        paso++
        this.player.setTexture(Math.floor(paso / 6) % 2 === 0 ? 'chico1' : 'chico2')
        if (paso % 12 === 0) sfx.step()
      },
    })
    this.player.setTexture('chico0')
    await this.wait(600)
    await this.transformacion(ser)
  }

  // La gente sin cara se vuelve violenta: se pone negra, crece, se le parte la cabeza y grita al cielo
  private async transformacion(img: Phaser.GameObjects.Image) {
    const cam = this.cameras.main
    cam.stopFollow()
    cam.pan(img.x - 60, 330, 900, 'Sine.easeInOut')
    cam.zoomTo(1.35, 900, 'Sine.easeInOut')
    await this.wait(1000)
    await say(this, [this.think('Esa persona…'), this.think('Me está mirando. Sin cara.')])
    img.setOrigin(0.5, 1).setPosition(img.x, FLOOR).setAlpha(1).setFlipX(img.x > this.player.x)
    // Se pone negra
    for (let i = 0; i < 4; i++) {
      img.setTint(i % 2 ? 0x4d5363 : 0x060608)
      await this.wait(120)
    }
    img.setTint(0x060608)
    // Crece
    sfx.throb()
    await this.tween({ targets: img, scaleX: 1.45, scaleY: 1.7, duration: 1400, ease: 'Cubic.In' })
    // Se le parte la cabeza y grita al cielo
    img.clearTint().setTexture('serGrito').setScale(1.35).setFlipX(img.x > this.player.x)
    sfx.grito()
    cam.shake(1800, 0.012)
    this.tweens.add({ targets: this.rojo, fillAlpha: 0.55, duration: 300, yoyo: true, repeat: 2 })
    this.tweens.add({ targets: this.flame, alpha: 0, scale: 0.2, duration: 1200 })
    await this.wait(2200)
    this.flameOn = false
    this.flame.setVisible(false)
    cam.zoomTo(1, 700, 'Sine.easeInOut')
    cam.pan(this.player.x, 360, 700, 'Sine.easeInOut')
    await this.wait(800)
    // Detrás de Jorge aparece una carpa que antes no estaba
    this.tweens.add({ targets: this.carpaFeria, alpha: 1, duration: 900 })
    await say(this, [this.think('Tengo que salir de acá.'), this.think('Esa carpa… antes no estaba.')])
    img.setTexture('serCorre1').setScale(1.2)
    // El primero va adelante en la lista: es el que sigue a Jorge por las puertas
    this.seres.unshift({ img, area: 'feria', estado: 'perseguir', vel: 30, ms: 0, dir: -1, paso: 0, homeArea: 'callejon', homeX: 7650 })
    cam.startFollow(this.player, true, 0.1, 0.1)
    this.phase = 'huida'
    this.leaving = false // el final de la mamá ya pasó: Jorge vuelve a moverse
    this.goal.set('Escapar')
    this.glitchAt = this.time.now + 6000
    const help = text(this, 24, this.scale.height - 34, controlsHelp('← → correr   ·   E entrar   ·   quedarte quieto: no te ven'), 16, '#e8c0c0').setScrollFactor(0).setDepth(950)
    this.time.delayedCall(9000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1200 }))
  }

  private carpaFeria!: Phaser.GameObjects.Graphics
  private carpaX = CARPA

  // Una carpa de feria, a rayas, con la entrada abierta. `luz`: la de la salida tiene un brillo dorado
  private carpa(g: Phaser.GameObjects.Graphics, x: number, luz = false, tilt = 0) {
    const a = 0x5a1a1e
    const b = 0x16080a
    for (let i = 0; i < 6; i++) g.fillStyle(i % 2 ? a : b).fillTriangle(x + tilt, 250, x - 120 + i * 40, 360, x - 120 + (i + 1) * 40, 360)
    for (let i = 0; i < 6; i++) g.fillStyle(i % 2 ? b : a).fillRect(x - 120 + i * 40, 360, 40, FLOOR - 360)
    g.fillStyle(0x050304).fillTriangle(x - 46, FLOOR, x + 46, FLOOR, x, 420)
    if (luz) g.lineStyle(2, 0xe0b04a, 0.7).lineBetween(x - 46, FLOOR, x, 420).lineBetween(x, 420, x + 46, FLOOR)
  }

  // El callejón de carpas: la feria, pero roja y torcida
  private drawCallejon() {
    const { x: X, w: Wd } = AREAS.callejon
    const g = this.add.graphics()
    g.fillGradientStyle(0x2a0a10, 0x2a0a10, 0x0c0507, 0x0c0507, 1).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x1a1012).fillRect(X, FLOOR, Wd, 120)
    // Guirnaldas rotas: casi todas apagadas, alguna roja
    for (let x0 = X; x0 < X + Wd; x0 += 520) {
      g.lineStyle(2, 0x2b1a1e)
      g.beginPath()
      for (let x = 0; x <= 520; x += 20) g.lineTo(x0 + x, 90 + Math.sin((x / 520) * Math.PI) * 60 + (x0 % 3) * 6)
      g.strokePath()
      for (let x = 30; x < 520; x += 70) g.fillStyle((x / 70) % 3 === 0 ? 0xc0392b : 0x2b2224).fillCircle(x0 + x, 94 + Math.sin((x / 520) * Math.PI) * 60, 5)
    }
    this.carpa(g, ENTRADA, false, -10)
    PUERTAS.filter((p) => p.area === 'callejon').forEach((p, i) => this.carpa(g, p.x, p.to === 'salida', (i % 2 ? 1 : -1) * 18))
    // La salida: un brillo dorado apenas, en la entrada de la última carpa
    this.add.circle(7620, 520, 46, 0xffd36a, 0.12).setDepth(781).setBlendMode(Phaser.BlendModes.ADD)
    this.carpaFeria = this.add.graphics().setDepth(5).setAlpha(0)
    this.carpa(this.carpaFeria, CARPA, false, 12)
  }

  // Los cuartos: adentro de cada carpa
  private drawCuartos() {
    const g = this.add.graphics()
    const pared = (a: Area, color: number) => {
      const { x: X, w: Wd } = AREAS[a]
      g.fillStyle(color).fillRect(X, 0, Wd, FLOOR)
      g.fillStyle(0x0c0708).fillRect(X, FLOOR, Wd, 120)
      // La entrada, desde adentro: un triángulo con la luz roja del callejón
      g.fillStyle(0x3a0c12).fillTriangle(X + 94, FLOOR, X + 186, FLOOR, X + 140, 420)
    }
    // Espejos
    pared('espejos', 0x1a1424)
    for (let i = 0; i < 5; i++) {
      const mx = AREAS.espejos.x + 380 + i * 180
      g.fillStyle(0x8a8f99).fillRect(mx - 56, 300, 112, 280)
      g.fillStyle(0x1d2333).fillRect(mx - 48, 308, 96, 264)
      this.add.image(mx, 520, 'chico0').setTint(0x8a90a8).setAlpha(0.45).setFlipX(i % 2 === 1).setScale(i % 2 ? 0.7 : 1.1, i % 2 ? 1.5 : 0.8).setDepth(2)
    }
    // Caballitos de la calesita, colgados y quietos
    pared('caballos', 0x140e18)
    const dark: Paint = (c) => {
      const r = ((c >> 16) & 0xff) * 0.45
      const gg = ((c >> 8) & 0xff) * 0.4
      const b = (c & 0xff) * 0.45
      return (r << 16) | (gg << 8) | b
    }
    ;[0xf1ece0, 0xb07a4a, 0x9fb4c8, 0xe8a0b4].forEach((c, i) => {
      const hx = AREAS.caballos.x + 400 + i * 210
      g.lineStyle(3, 0x4a3a2a).lineBetween(hx, 0, hx, 440 - (i % 2) * 30)
      const h = this.add.graphics().setDepth(2)
      this.paintCaballo(h, dark, hx, c)
      h.y = -40 - (i % 2) * 30
    })
    // La carpa de atrás: vacía y larga, con uno agachado al fondo
    pared('emboscada', 0x120a0c)
    for (let bx = AREAS.emboscada.x + 300; bx < AREAS.emboscada.x + 1600; bx += 260) g.fillStyle(0x6a1a1e).fillCircle(bx, 110, 5)
    const agachado = this.add.image(AREAS.emboscada.x + 1380, FLOOR, 'serCorre1').setOrigin(0.5, 1).setScale(1.1, 0.75).setFlipX(true).setDepth(8)
    this.seres.push({ img: agachado, area: 'emboscada', estado: 'dormido', vel: 0, ms: 0, dir: -1, paso: 0, homeArea: 'emboscada', homeX: AREAS.emboscada.x + 1380 })
    // La salida: al fondo, la sortija dorada, colgada, con una luz blanca detrás
    pared('salida', 0x0e0a10)
    g.lineStyle(3, 0x8a5a3a).lineBetween(SORTIJA, 0, SORTIJA, 330)
    g.lineStyle(5, 0xe0b04a).strokeCircle(SORTIJA, 344, 13)
    this.add.circle(SORTIJA, 344, 70, 0xffe08a, 0.22).setDepth(781).setBlendMode(Phaser.BlendModes.ADD)
    this.add.rectangle(SORTIJA + 120, 450, 120, 300, 0xffffff, 0.1).setDepth(781).setBlendMode(Phaser.BlendModes.ADD)
  }

  private setArea(a: Area) {
    this.area = a
    const r = AREAS[a]
    this.cameras.main.setBounds(r.x, 0, r.w, 720)
    for (const s of this.seres) s.img.setVisible(s.area === a)
  }

  // Entrar o salir por una puerta (una carpa)
  private async entrar(p: Puerta) {
    const cam = this.cameras.main
    const desde = this.area
    sfx.door()
    cam.fadeOut(250, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.setArea(p.to)
    this.player.setX(p.toX)
    cam.centerOn(p.toX, 360)
    const ser0 = this.seres[0]
    const token = ++this.seguir
    if (ser0) {
      if (p.to === 'callejon' && desde === 'feria') {
        // Lo sigue por la carpa, un poco después
        ser0.img.setVisible(false)
        ser0.area = 'fuera'
        this.time.delayedCall(1900, () => {
          if (token !== this.seguir || this.area !== 'callejon') return
          ser0.area = 'callejon'
          ser0.img.setVisible(true).setX(ENTRADA)
          ser0.estado = 'perseguir'
          ser0.vel = 60
        })
      } else if (p.to === 'salida' && ser0.area === 'callejon') {
        // A la salida también lo sigue
        ser0.area = 'fuera'
        ser0.img.setVisible(false)
        this.time.delayedCall(1900, () => {
          if (token !== this.seguir || this.area !== 'salida') return
          ser0.area = 'salida'
          ser0.img.setVisible(true).setX(AREAS.salida.x + 150)
          ser0.estado = 'perseguir'
          ser0.vel = 60
        })
      } else if (desde === 'callejon' && ser0.area === 'callejon') {
        // Se queda en el callejón, esperando cerca de la carpa
        ser0.img.setX(Phaser.Math.Clamp(p.x + (p.x > 6400 ? -360 : 360), AREAS.callejon.x + 80, AREAS.callejon.x + AREAS.callejon.w - 80))
        ser0.estado = 'buscar'
        ser0.ms = 0
      } else if (p.to === 'callejon' && ser0.area === 'fuera') {
        ser0.area = 'callejon'
        ser0.img.setX(p.toX > 6400 ? p.toX - 420 : p.toX + 420)
        ser0.estado = 'buscar'
        ser0.ms = 2000
      }
      ser0.img.setVisible(ser0.area === this.area)
    }
    cam.fadeIn(250, 0, 0, 0)
    this.goal.set('Encontrar la salida')
    if (!this.entrados.has(p.to)) {
      this.entrados.add(p.to)
      const lines: Partial<Record<Area, string[]>> = {
        callejon: ['Carpas.', 'Ya no es la feria.'],
        espejos: ['Espejos.', 'No hay salida.'],
        caballos: ['Los caballitos de la calesita.', 'Quietos.', 'La sortija era dorada…'],
        salida: ['Una luz dorada.', 'La sortija.'],
      }
      const l = lines[p.to]
      if (l) await say(this, l.map((t) => this.think(t)))
    }
  }

  // Si lo agarran: todo se rompe y Jorge vuelve a la primera puerta
  private async atrapado() {
    this.atrapadas++
    const cam = this.cameras.main
    sfx.atrapado()
    cam.shake(500, 0.02)
    this.rojo.setFillStyle(0x8a0a14, 0.85)
    await this.wait(350)
    cam.fadeOut(500, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.rojo.setFillStyle(0x8a0a14, 0)
    this.seguir++
    // Todos vuelven a su lugar
    for (const s of this.seres) {
      s.area = s.homeArea
      s.img.setX(s.homeX).setScale(s.homeArea === 'emboscada' ? 1.1 : 1.2, s.homeArea === 'emboscada' ? 0.75 : 1.2).setTexture('serCorre1')
      s.estado = s.homeArea === 'emboscada' ? 'dormido' : 'buscar'
      s.ms = 0
      s.vel = 0
    }
    this.setArea('callejon')
    this.player.setX(ENTRADA + 90).setFlipX(false)
    this.facing = 1
    cam.centerOn(this.player.x, 360)
    await this.wait(400)
    cam.fadeIn(600, 0, 0, 0)
    await this.wait(600)
    await say(this, [this.think(this.atrapadas === 1 ? 'Otra vez en la entrada.' : 'Otra vez.')])
  }

  // La salida: la sortija. Vela vuelve y Jorge se despierta
  private async despertar() {
    this.phase = 'final'
    this.leaving = true
    this.goal.set(null)
    sfx.pickup()
    this.flame.setVisible(true).setAlpha(0).setScale(1).setPosition(this.player.x + 70, KID - 110)
    this.tweens.add({ targets: this.flame, alpha: 1, duration: 600 })
    sfx.flame()
    await say(this, [this.vela('¡Jorge! Te encontré.'), this.vela('Agarrala. Despertate.')])
    if (addPista('Los seres', 'Al final de la feria todo se congeló y la gente sin cara se volvió negra, enorme, con la cabeza partida y llena de dientes. Me perseguían. Escapé por las carpas hasta la sortija.')) toast(this, '✎ Nueva pista en el diario (TAB)')
    const cam = this.cameras.main
    cam.flash(400, 255, 255, 255)
    cam.fadeOut(2200, 255, 248, 236)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    await this.wait(600)
    this.scene.start('Office', { despertar: true })
  }

  // La voz de Vela, cortada, cada tanto: se perdió la comunicación
  private velaRota() {
    const frases = ['…Jor… ge…', '…¿me escu… chás?…', '…no te… veo…', '…desper… tate…', '…quieto… quedate…']
    const t = text(this, this.scale.width / 2 + (Math.random() - 0.5) * 300, 120 + Math.random() * 60, frases[Math.floor(Math.random() * frases.length)], 22, '#c9ced8', { fontStyle: 'italic' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(955)
      .setAlpha(0)
    sfx.estatica()
    this.tweens.add({ targets: t, alpha: 0.8, duration: 120, yoyo: true, repeat: 3, onComplete: () => t.destroy() })
  }

  // La huida: correr, entrar a las carpas, quedarse quieto para que no te vean
  private updateHuida(time: number, dt: number) {
    this.dark.setPosition(this.player.x, this.player.y - 30)
    const k = this.keys
    const ePressed = Phaser.Input.Keyboard.JustDown(k.E)
    if (this.busy || time < this.lockUntil) return
    if (Phaser.Input.Keyboard.JustDown(k.TAB)) {
      void this.run(() => openDiary(this))
      return
    }
    if (time > this.glitchAt) {
      this.glitchAt = time + 9000 + Math.random() * 6000
      this.velaRota()
    }
    const r = AREAS[this.area]
    const dir = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0)
    if (dir !== 0) {
      this.quietoMs = 0
      const from = this.player.x
      this.player.x = Phaser.Math.Clamp(from + dir * WALK_HUIDA * (dt / 1000), r.x + 60, r.x + r.w - 60)
      this.facing = dir
      this.player.setFlipX(dir < 0)
      this.walkDist += Math.abs(this.player.x - from)
      this.stepDist += Math.abs(this.player.x - from)
      this.player.setTexture(Math.floor(this.walkDist / 14) % 2 === 0 ? 'chico1' : 'chico2')
      if (this.stepDist > 30) {
        this.stepDist = 0
        sfx.step()
      }
    } else {
      this.quietoMs += dt
      this.player.setTexture('chico0')
    }
    const quieto = this.quietoMs > QUIETO_MS
    // Los seres
    let cerca = Infinity
    for (const s of this.seres) {
      if (s.area !== this.area) continue
      const dx = this.player.x - s.img.x
      const dist = Math.abs(dx)
      if (s.estado === 'dormido') {
        if (this.area === 'emboscada' && this.player.x > AREAS.emboscada.x + 650) {
          s.estado = 'perseguir'
          s.vel = 40
          s.img.setScale(1.2).setTexture('serGrito')
          sfx.grito(false)
          this.cameras.main.shake(600, 0.008)
          this.tweens.add({ targets: this.rojo, fillAlpha: 0.4, duration: 250, yoyo: true })
        }
        continue
      }
      if (s.estado === 'perseguir') {
        if (quieto) {
          // No lo ve: se frena y se aleja, buscando
          s.estado = 'buscar'
          s.ms = 0
          s.dir = -Math.sign(dx) || 1
        } else {
          s.vel = Math.min(SER_MAX, s.vel + dt * 0.18)
          s.img.x += Math.sign(dx) * s.vel * (dt / 1000)
          s.img.setFlipX(dx < 0)
          s.paso += s.vel * (dt / 1000)
          s.img.setTexture(Math.floor(s.paso / 26) % 2 === 0 ? 'serCorre1' : 'serCorre2')
        }
      } else if (s.estado === 'buscar') {
        s.ms += dt
        if (s.ms < 2600) {
          s.img.x += s.dir * 55 * (dt / 1000)
          s.img.setFlipX(s.dir < 0)
          s.paso += 55 * (dt / 1000)
          s.img.setTexture(Math.floor(s.paso / 26) % 2 === 0 ? 'serCorre1' : 'serCorre2')
        } else if (Math.floor(s.ms / 900) % 2 === 0) s.img.setFlipX(!s.img.flipX)
        // Si Jorge se mueve cerca, lo vuelve a ver
        if (!quieto && this.quietoMs === 0 && (dist < 470 || s.ms > 7000)) {
          s.estado = 'perseguir'
          s.vel = 70
        }
      }
      s.img.x = Phaser.Math.Clamp(s.img.x, r.x + 40, r.x + r.w - 40)
      if (dist < 36) {
        void this.run(() => this.atrapado())
        return
      }
      cerca = Math.min(cerca, dist)
    }
    // El corazón late más fuerte cuando están cerca
    this.rojo.fillAlpha += ((cerca < 500 ? 0.12 + (1 - cerca / 500) * 0.25 : 0.06) - this.rojo.fillAlpha) * (1 - Math.exp(-dt / 300))
    if (cerca < 400 && time > this.lastCall) {
      this.lastCall = time + 350 + (cerca / 400) * 500
      sfx.latido()
    }
    // Puertas y la sortija
    const p = PUERTAS.map((q) => (q.area === 'feria' ? { ...q, x: this.carpaX } : q)).find((q) => q.area === this.area && Math.abs(this.player.x - q.x) < 70)
    const enSortija = this.area === 'salida' && Math.abs(this.player.x - SORTIJA) < 90
    if (p || enSortija) {
      this.prompt.setVisible(true).setPosition(enSortija ? SORTIJA : p!.x, 300)
      this.promptLabel.setText(enSortija ? 'Agarrar la sortija' : p!.label)
      if (ePressed) void this.run(() => (enSortija ? this.despertar() : this.entrar(p!)))
    } else if (this.area === 'callejon' && Math.abs(this.player.x - ENTRADA) < 70) {
      this.prompt.setVisible(true).setPosition(ENTRADA, 300)
      this.promptLabel.setText('Volver')
      if (ePressed) void this.run(() => say(this, [this.think('No. Atrás está eso.')]))
    } else this.prompt.setVisible(false)
  }

  private revealNow(o: Reveal) {
    o.revealed = true
    this.tweens.add({ targets: o.color, alpha: 1, duration: 1200 })
    o.onReveal?.()
  }

  // ---------- Bucle ----------

  private wait(ms: number) {
    return new Promise<void>((r) => this.time.delayedCall(ms, r))
  }

  private tween(config: Phaser.Types.Tweens.TweenBuilderConfig) {
    return new Promise<void>((r) => this.tweens.add({ ...config, onComplete: () => r() }))
  }

  private async run(fn: () => Promise<void>) {
    this.busy = true
    this.prompt.setVisible(false)
    this.player.setTexture('chico0')
    try {
      await fn()
    } finally {
      if (!this.leaving) {
        this.busy = false
        this.lockUntil = this.time.now + 200
      }
    }
  }

  update(time: number, delta: number) {
    const dt = Math.min(delta, 100)
    if (this.phase === 'huida') {
      this.updateHuida(time, dt)
      return
    }
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

    // La voz de la mamá, cada tanto
    if (this.phase === 'explorar' && time - this.lastCall > 16000) {
      this.lastCall = time
      if (this.calls++ === 0) {
        void this.run(() => this.primeraLlamada())
        return
      }
      this.callOut()
    }

    const dir = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0)
    if (dir !== 0) {
      const from = this.player.x
      this.player.x = Phaser.Math.Clamp(from + dir * WALK * (dt / 1000), 170, W - 40)
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
      if (this.player.x > POS.bucle) {
        void this.run(() => this.bucle())
        return
      }
    } else {
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
      this.promptLabel.setText(spot.x === POS.calesita ? (this.fragments.has('calesita') ? 'Calesita' : 'Subirse a la calesita') : spot.label)
      if (ePressed) void this.run(spot.action)
    } else {
      this.prompt.setVisible(false)
    }
  }
}

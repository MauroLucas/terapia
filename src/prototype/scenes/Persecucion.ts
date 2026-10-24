import * as Phaser from 'phaser'
import { OJO_PERRO, addVignette, makeTextures, type PosePerro } from '../art'
import { sfx, startDrone } from '../audio'
import { controlsHelp } from '../touch'
import { objective, say, text, type Line, type Point } from '../ui'

// DEMO (en prueba): la persecución al final de la Sesión 1, estilo Limbo / Little Nightmares.
// Jorge acaba de soltar al elefante. Lechuga le reprocha, se rompe como un ente y se transforma en un perro gigante
// que lo persigue. Se corre de izquierda a derecha, de noche, entre la niebla, atrás de la carpa:
//   [elefante] … cajones · pozo · lona caída (agacharse) · ente que titila · cajón y pozo · [la reja] ·
//   caja para empujar · carromato · barriles (esconderse) · cajón · ente · guirnaldas caídas · pozo · [sin salida]
// Al final no hay salida: hay que quedarse quieto, como le dijo su mamá, y ella lo encuentra.
// Física propia y simple (sin Matter): gravedad, saltar, agacharse y empujar. Todo se mueve con `delta`.
// Si el perro lo alcanza, se corta a negro y se vuelve al último punto de control.

const FLOOR = 600
const END = 7400

// Jorge chico
const RUN = 255 // corriendo
const CROUCH_SPEED = 120 // agachado
const PUSH_SPEED = 95 // empujando la caja
const GRAVITY = 2000
const JUMP_V = 760 // salta ~145 px de alto y ~190 de largo
const COYOTE = 110 // ms en que todavía puede saltar después de salirse de un borde
const BUFFER = 130 // ms en que se recuerda un salto apretado un poco antes de tocar el piso
const HW = 12 // medio ancho del cuerpo
const H_STAND = 94
const H_CROUCH = 54

// El perro: sigue el rastro de Jorge con la nariz
const PERRO = 228 // velocidad normal, un poco menos que Jorge corriendo
const PERRO_FAR = 330 // si quedó muy lejos, alcanza (que la presión no se pierda)
const PERRO_NEAR = 200 // si está encima, afloja un poco (para que haya "casi")
const PERRO_SEARCH = 120 // buscando, en la parte de los barriles
const PERRO_SCALE = 1
const STILL_MS = 4500 // cuánto hay que quedarse quieto al final

type RectKind = 'solid' | 'box'
interface Rect {
  x0: number
  x1: number
  y0: number
  y1: number
  kind: RectKind
}
interface Ente {
  x: number
  period: number
  on: number
  offset: number
  img: Phaser.GameObjects.Image
}
type PerroMode = 'off' | 'intro' | 'chase' | 'stuck' | 'search' | 'final' | 'lunge'
type Section = 'intro' | 'huida' | 'reja' | 'caja' | 'barriles' | 'carrera' | 'quieto' | 'final'

// Pozos: donde el piso se rompe (una falla del sueño)
const GROUND: [number, number][] = [
  [-200, 1300],
  [1440, 2585],
  [2685, 6130],
  [6270, END + 200],
]
const BARRILES = [4330, 4720]
const REJA = 2950

// Puntos de control: dónde vuelve Jorge si lo agarran
interface Checkpoint {
  x: number
  section: Section
}
const CHECKPOINTS: Checkpoint[] = [
  { x: 640, section: 'huida' },
  { x: 3080, section: 'caja' },
  { x: 4090, section: 'barriles' },
  { x: 5080, section: 'carrera' },
  { x: 6720, section: 'quieto' },
]

export class Persecucion extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private flame!: Phaser.GameObjects.Container
  private flameGlow!: Phaser.GameObjects.Arc
  private dark!: Phaser.GameObjects.Image
  private red!: Phaser.GameObjects.Rectangle
  private grain!: Phaser.GameObjects.TileSprite
  private perro!: Phaser.GameObjects.Container
  private perroImg!: Phaser.GameObjects.Image
  private perroEyes!: Phaser.GameObjects.Graphics
  private lechuga!: Phaser.GameObjects.Image
  private boxG!: Phaser.GameObjects.Graphics
  private rejaG!: Phaser.GameObjects.Graphics
  private callout!: Phaser.GameObjects.Text
  private prompt!: Phaser.GameObjects.Text
  private goal!: ReturnType<typeof objective>
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private drone?: { stop: (fade?: number) => void }

  private rects: Rect[] = []
  private box!: Rect
  private reja?: Rect
  private entes: Ente[] = []

  // Estado de Jorge
  private vx = 0
  private vy = 0
  private grounded = true
  private crouch = false
  private coyote = 0
  private jumpBuf = 0
  private facing = 1
  private walkDist = 0
  private stepDist = 0
  private hidden = false
  private alive = true
  private busy = true

  // Estado del perro y de la secuencia
  private perroMode: PerroMode = 'off'
  private perroWait = 0
  private perroStep = 0
  private perroDir = 1
  private section: Section = 'intro'
  private cp = 0
  private said = new Set<string>()
  private stillMs = 0
  private searchDone = false
  private beat = 0
  private pisadasMs = 0
  private olfateoMs = 0
  private calloutUntil = 0
  private clock = 0 // reloj propio, hecho con `delta`: los entes titilan al mismo ritmo que se mueve Jorge, a cualquier FPS

  constructor() {
    super('Persecucion')
  }

  create() {
    this.rects = []
    this.entes = []
    this.reja = undefined
    this.said = new Set()
    this.vx = this.vy = this.stillMs = this.beat = this.pisadasMs = this.olfateoMs = this.clock = 0
    this.grounded = true
    this.crouch = this.hidden = this.searchDone = false
    this.alive = true
    this.busy = true
    this.cp = 0
    this.section = 'intro'
    this.perroMode = 'off'
    makeTextures(this)

    this.cameras.main.setBackgroundColor('#1b1f27')
    this.drawBackground()
    this.buildLevel()

    this.add.image(230, FLOOR, 'elefante').setOrigin(0.5, 1).setDepth(12).setTint(0x6c6e76)
    this.lechuga = this.add.image(-100, FLOOR, 'lechugaEnojado').setOrigin(0.5, 1).setDepth(19).setVisible(false)

    this.player = this.add.image(600, FLOOR, 'chico0').setOrigin(0.5, 1).setDepth(25).setTint(0xd6d6d6)
    this.flameGlow = this.add.circle(0, 0, 50, 0xffc56b, 0.16).setBlendMode(Phaser.BlendModes.ADD)
    this.flame = this.add.container(660, FLOOR - 160, [this.flameGlow, this.add.image(0, 0, 'llama')]).setDepth(790).setScale(0.75)

    this.perroImg = this.add.image(0, 0, 'perro-corre0').setOrigin(1, 1)
    this.perro = this.add.container(-900, FLOOR + 8, [this.perroImg]).setDepth(22).setScale(PERRO_SCALE).setVisible(false)
    // Los ojos brillan apenas, por encima de la oscuridad: se los ve antes que al bicho
    this.perroEyes = this.add.graphics().setDepth(782).setBlendMode(Phaser.BlendModes.ADD)

    this.dark = this.add.image(0, 0, this.darkness()).setDepth(780)
    this.red = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x8a0f0f, 0).setOrigin(0).setScrollFactor(0).setDepth(786)
    addVignette(this, 0.9)
    this.grain = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, this.grainTexture()).setOrigin(0).setScrollFactor(0).setDepth(890).setAlpha(0.08)

    this.callout = text(this, 0, 0, '', 18, '#cfe0ff', { fontStyle: 'italic', stroke: '#000', strokeThickness: 4, align: 'center' }).setOrigin(0.5, 1).setDepth(960).setAlpha(0)
    this.prompt = text(this, 0, 0, '', 15, '#e8e8e8', { stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(960).setVisible(false)
    this.goal = objective(this)

    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,SPACE,E') as Record<string, Phaser.Input.Keyboard.Key>
    const cam = this.cameras.main
    cam.setBounds(0, 0, END, 720)
    cam.startFollow(this.player, true, 0.09, 0.09, -this.scale.width * 0.14, 240)
    cam.centerOn(this.player.x + this.scale.width * 0.14, 360)

    this.drone = startDrone()
    this.events.once('shutdown', () => this.drone?.stop(0.5))
    void this.intro()
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __chase?: Persecucion }).__chase = this
  }

  // ---------- Escenario ----------

  private darkness() {
    const key = 'oscuridad-persecucion'
    if (this.textures.exists(key)) return key
    const w = 3200
    const h = 2000
    const tex = this.textures.createCanvas(key, w, h)!
    const ctx = tex.getContext()
    const grad = ctx.createRadialGradient(w / 2, h / 2, 150, w / 2, h / 2, 620)
    grad.addColorStop(0, 'rgba(4,5,8,0)')
    grad.addColorStop(0.5, 'rgba(4,5,8,0.45)')
    grad.addColorStop(1, 'rgba(4,5,8,0.86)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    tex.refresh()
    return key
  }

  private grainTexture() {
    const key = 'grano'
    if (this.textures.exists(key)) return key
    const tex = this.textures.createCanvas(key, 256, 256)!
    const ctx = tex.getContext()
    const img = ctx.createImageData(256, 256)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    tex.refresh()
    return key
  }

  // Cielo con niebla clara en el horizonte y siluetas en capas: lejos (carpas), al medio (postes, jaulas) y adelante (pasto)
  private drawBackground() {
    const { width, height } = this.scale
    const key = 'cielo-persecucion'
    if (!this.textures.exists(key)) {
      const tex = this.textures.createCanvas(key, width, height)!
      const ctx = tex.getContext()
      const g = ctx.createLinearGradient(0, 0, 0, height)
      g.addColorStop(0, '#0c0e13')
      g.addColorStop(0.55, '#3c414b')
      g.addColorStop(0.78, '#5a5f68')
      g.addColorStop(1, '#2a2d33')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, width, height)
      tex.refresh()
    }
    this.add.image(0, 0, key).setOrigin(0).setScrollFactor(0).setDepth(-10)

    // Lejos: carpas, banderines y guirnaldas apagadas
    const far = this.add.graphics().setScrollFactor(0.25).setDepth(-8)
    far.fillStyle(0x2f333b)
    for (let x = -100; x < END * 0.25 + width; x += 520) {
      const w = 300 + ((x * 7) % 140)
      const top = 300 + ((x * 3) % 60)
      far.fillTriangle(x, 560, x + w, 560, x + w / 2, top)
      far.fillRect(x + w / 2 - 3, top - 40, 6, 40)
      far.fillTriangle(x + w / 2 + 3, top - 40, x + w / 2 + 30, top - 32, x + w / 2 + 3, top - 24)
    }
    far.fillRect(-100, 556, END * 0.25 + width + 200, 200)

    // Al medio: postes, sogas que cuelgan y jaulas vacías
    const mid = this.add.graphics().setScrollFactor(0.55).setDepth(-6)
    mid.fillStyle(0x1d2027)
    mid.lineStyle(3, 0x1d2027)
    for (let x = 0; x < END * 0.55 + width; x += 380) {
      const h = 260 + ((x * 13) % 120)
      mid.fillRect(x, FLOOR - h, 12, h + 40)
      mid.beginPath()
      for (let t = 0; t <= 1; t += 0.1) mid.lineTo(x + 6 + t * 380, FLOOR - h + 10 + Math.sin(t * Math.PI) * 60)
      mid.strokePath()
      if ((x / 380) % 3 === 1) {
        mid.fillRect(x + 90, FLOOR - 120, 150, 10).fillRect(x + 90, FLOOR - 12, 150, 10)
        for (let b = 0; b <= 150; b += 18) mid.fillRect(x + 90 + b, FLOOR - 120, 4, 118)
      }
    }
    mid.fillRect(0, FLOOR - 4, END * 0.55 + width, 200)

    // Niebla que se mueve despacio
    for (let i = 0; i < 4; i++) {
      const fog = this.add.ellipse(i * 900, FLOOR - 40 - i * 30, 1400, 160, 0x7c828c, 0.1).setScrollFactor(0.4 + i * 0.1).setDepth(-5)
      this.tweens.add({ targets: fog, x: fog.x + 300, duration: 9000 + i * 2000, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
    }
  }

  private solid(x0: number, x1: number, y0: number, y1 = FLOOR, kind: RectKind = 'solid') {
    const r: Rect = { x0, x1, y0, y1, kind }
    this.rects.push(r)
    return r
  }

  private crate(g: Phaser.GameObjects.Graphics, x0: number, x1: number, h: number) {
    this.solid(x0, x1, FLOOR - h)
    g.fillStyle(0x0b0c0f).fillRect(x0, FLOOR - h, x1 - x0, h)
    g.lineStyle(2, 0x23262d)
    g.strokeRect(x0 + 3, FLOOR - h + 3, x1 - x0 - 6, h - 6)
    g.lineBetween(x0 + 3, FLOOR - h + 3, x1 - 3, FLOOR - 3)
    g.fillStyle(0x3a3f48, 0.6).fillRect(x0, FLOOR - h, x1 - x0, 2)
  }

  private buildLevel() {
    // El piso, con los pozos
    const ground = this.add.graphics().setDepth(14)
    for (const [x0, x1] of GROUND) {
      this.solid(x0, x1, FLOOR, FLOOR + 600)
      ground.fillStyle(0x07080a).fillRect(x0, FLOOR, x1 - x0, 140)
      ground.fillStyle(0x07080a)
      for (let x = x0; x < x1; x += 9) ground.fillTriangle(x, FLOOR + 1, x + 4, FLOOR - 6 - ((x * 7) % 9), x + 8, FLOOR + 1)
    }
    // Los bordes de los pozos: tablas rotas y estática
    for (let i = 0; i < GROUND.length - 1; i++) {
      const a = GROUND[i][1]
      const b = GROUND[i + 1][0]
      ground.fillStyle(0x07080a).fillTriangle(a, FLOOR, a + 26, FLOOR + 8, a, FLOOR + 40).fillTriangle(b, FLOOR, b - 22, FLOOR + 10, b, FLOOR + 36)
      ground.fillStyle(0x3ff2ff, 0.25).fillRect(a + 6, FLOOR + 30, b - a - 12, 2)
      ground.fillStyle(0xff3fd8, 0.2).fillRect(a + 12, FLOOR + 46, b - a - 24, 2)
    }

    // El elefante quedó suelto: la cadena en el piso y la estaca tirada
    const deco = this.add.graphics().setDepth(13)
    deco.lineStyle(3, 0x3a3d44)
    for (let x = 300; x < 400; x += 12) deco.strokeEllipse(x, FLOOR - 3, 12, 6)
    deco.lineStyle(5, 0x4a3a2a).lineBetween(402, FLOOR - 2, 440, FLOOR - 10)

    const g = this.add.graphics().setDepth(15)
    // Primer tramo: cajones y un escalón
    this.crate(g, 760, 840, 70)
    this.crate(g, 990, 1050, 55)
    this.crate(g, 1050, 1140, 110)
    // La lona caída: hay que pasar agachado
    this.solid(1680, 1880, -400, FLOOR - 62)
    g.fillStyle(0x0b0c0f).fillRect(1660, 120, 14, FLOOR - 120).fillRect(1886, 160, 14, FLOOR - 160)
    for (let x = 1680; x < 1880; x += 25) {
      g.fillStyle((x / 25) % 2 ? 0x2c3038 : 0x3b2a2c).fillRect(x, 140, 25, FLOOR - 62 - 140)
    }
    for (let x = 1680; x < 1880; x += 20) g.fillStyle(0x07080a).fillTriangle(x, FLOOR - 64, x + 20, FLOOR - 64, x + 10, FLOOR - 50 - ((x * 3) % 10))
    g.fillStyle(0x07080a).fillRect(1630, 120, 290, 22)
    // Un ente que titila: hay que pasar cuando se apaga
    this.ente(2190, 1400, 700, 0)
    this.crate(g, 2400, 2480, 90)

    // La reja: se cae detrás de Jorge (ver `rejaCae`). Por ahora, levantada
    this.rejaG = this.add.graphics().setDepth(24)
    this.rejaG.fillStyle(0x07080a).fillRect(REJA - 30, 100, 90, 18)
    for (let b = 0; b < 4; b++) this.rejaG.fillRect(REJA - 20 + b * 22, 118, 6, FLOOR - 118)
    this.rejaG.setY(-FLOOR + 110)
    g.fillStyle(0x07080a).fillRect(REJA - 46, 60, 16, FLOOR - 60).fillRect(REJA + 60, 60, 16, FLOOR - 60).fillRect(REJA - 46, 60, 122, 22)

    // La caja que se empuja y el carromato del cuidador
    this.box = this.solid(3230, 3320, FLOOR - 80, FLOOR, 'box')
    this.boxG = this.add.graphics().setDepth(16)
    this.drawBox()
    this.solid(3720, 4020, FLOOR - 190)
    g.fillStyle(0x0b0c0f).fillRect(3720, FLOOR - 190, 300, 150)
    g.fillStyle(0x0b0c0f).fillEllipse(3870, FLOOR - 190, 320, 70)
    g.fillStyle(0x07080a).fillCircle(3780, FLOOR - 30, 34).fillCircle(3960, FLOOR - 30, 34)
    g.lineStyle(3, 0x23262d).strokeCircle(3780, FLOOR - 30, 26).strokeCircle(3960, FLOOR - 30, 26)
    g.fillStyle(0xffc56b, 0.18).fillRect(3840, FLOOR - 160, 40, 34)
    g.fillStyle(0x3a3f48, 0.5).fillRect(3720, FLOOR - 190, 300, 2)

    // Los barriles: lugares para esconderse
    const front = this.add.graphics().setDepth(30)
    for (const bx of BARRILES) {
      front.fillStyle(0x090a0d).fillRoundedRect(bx - 46, FLOOR - 92, 92, 92, 14)
      front.lineStyle(3, 0x23262d).lineBetween(bx - 44, FLOOR - 66, bx + 44, FLOOR - 66).lineBetween(bx - 44, FLOOR - 26, bx + 44, FLOOR - 26)
      front.fillStyle(0x3a3f48, 0.5).fillRect(bx - 40, FLOOR - 92, 80, 2)
    }

    // Último tramo: cajón, ente, guirnaldas caídas (agacharse), cajón y pozo, cajón chico
    this.crate(g, 5250, 5330, 75)
    this.ente(5520, 1600, 800, 400)
    this.solid(5720, 5900, -400, FLOOR - 62)
    g.fillStyle(0x0b0c0f).fillRect(5700, 80, 12, FLOOR - 80).fillRect(5906, 60, 12, FLOOR - 60)
    g.fillStyle(0x15171c).fillRect(5720, 200, 180, FLOOR - 62 - 200)
    g.lineStyle(2, 0x07080a)
    for (let x = 5720; x < 5900; x += 18) g.lineBetween(x, 200, x + 9, FLOOR - 62)
    for (let x = 5728; x < 5900; x += 26) g.fillStyle([0x6a5a30, 0x5a3a3a, 0x3a5060][(x / 26) % 3 | 0]).fillCircle(x, FLOOR - 70 + ((x * 5) % 8), 4)
    this.crate(g, 5960, 6120, 90)
    this.crate(g, 6460, 6530, 60)

    // Sin salida: la calesita torcida y la lona de la carpa, que no se puede pasar
    g.fillStyle(0x0b0c0f)
    const cx = 6900
    for (let i = 0; i < 8; i++) g.fillTriangle(cx, 150 + i * 4, cx - 210 + i * 52, 290 - i * 6, cx - 210 + (i + 1) * 52, 290 - (i + 1) * 6)
    g.fillRect(cx - 6, 250, 12, FLOOR - 250)
    for (const px of [cx - 150, cx + 140]) g.fillRect(px - 2, 270, 4, FLOOR - 300)
    // Los caballitos, colgados y quietos
    for (const [hx, hy] of [[cx - 150, 450], [cx + 140, 420]]) {
      g.fillEllipse(hx, hy, 74, 30)
      g.fillTriangle(hx + 22, hy - 4, hx + 38, hy - 6, hx + 44, hy - 40)
      g.fillEllipse(hx + 50, hy - 42, 30, 16)
      g.lineStyle(5, 0x0b0c0f)
      g.lineBetween(hx - 24, hy + 10, hx - 34, hy + 40).lineBetween(hx - 10, hy + 12, hx - 6, hy + 42)
      g.lineBetween(hx + 14, hy + 12, hx + 22, hy + 40).lineBetween(hx + 26, hy + 10, hx + 40, hy + 32)
      g.lineBetween(hx - 36, hy - 4, hx - 52, hy + 16)
    }
    this.solid(7150, END + 200, -400)
    g.fillStyle(0x0b0c0f).fillRect(7150, 0, 400, FLOOR)
    for (let x = 7150; x < 7550; x += 50) g.fillStyle((x / 50) % 2 ? 0x1a1d23 : 0x2a1e20).fillRect(x, 0, 50, FLOOR)

    // Pasto de adelante, que tapa un poco a Jorge
    const fg = this.add.graphics().setScrollFactor(1.18).setDepth(760)
    fg.fillStyle(0x020203)
    for (let x = 0; x < END * 1.2; x += 140) {
      const h = 30 + ((x * 11) % 40)
      for (let k = 0; k < 6; k++) fg.fillTriangle(x + k * 9, 735, x + k * 9 + 5, 735 - h - k * 3, x + k * 9 + 10, 735)
    }
    fg.fillRect(0, 728, END * 1.2, 40)
  }

  private drawBox() {
    const b = this.box
    const g = this.boxG
    g.clear()
    g.fillStyle(0x0d0e11).fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0)
    g.lineStyle(2, 0x2a2e36).strokeRect(b.x0 + 4, b.y0 + 4, b.x1 - b.x0 - 8, b.y1 - b.y0 - 8)
    g.lineBetween(b.x0 + 4, b.y0 + 4, b.x1 - 4, b.y1 - 4).lineBetween(b.x1 - 4, b.y0 + 4, b.x0 + 4, b.y1 - 4)
    g.fillStyle(0x4a505a, 0.7).fillRect(b.x0, b.y0, b.x1 - b.x0, 2)
  }

  private ente(x: number, period: number, on: number, offset: number) {
    const img = this.add.image(x, FLOOR, 'ente').setOrigin(0.5, 1).setDepth(20)
    this.entes.push({ x, period, on, offset, img })
  }

  // ---------- Líneas y mensajes ----------

  private kidHead = (): Point => ({ x: this.player.x + 4 * this.facing, y: this.player.y - 104 })
  private think = (t: string): Line => ({ kind: 'thought', text: t, anchor: this.kidHead })
  private kid = (t: string): Line => ({ kind: 'speech', text: t, anchor: this.kidHead })
  private vela = (t: string): Line => ({ kind: 'intercom', text: t, anchor: () => ({ x: this.flame.x, y: this.flame.y - 20 }) })
  private lech = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: this.lechuga.x, y: this.lechuga.getTopCenter().y }) })

  // La voz de Vela durante la persecución: no frena el juego, se va sola
  private shout(t: string, ms = 2200) {
    this.callout.setText(t).setAlpha(1)
    this.calloutUntil = this.time.now + ms
    sfx.intercomTick()
  }

  private once(key: string, fn: () => void) {
    if (this.said.has(key)) return
    this.said.add(key)
    fn()
  }

  // ---------- Intro: Lechuga se rompe y se transforma en perro ----------

  private async intro() {
    this.goal.set(null)
    this.face(230)
    this.cameras.main.fadeIn(1200)
    await this.wait(1200)
    await say(this, [this.think('Está suelto.'), this.think('Y no se mueve.')])
    await say(this, [{ kind: 'speech', text: '¡¿QUÉ HACÉS, MOCOSO?!', anchor: () => ({ x: this.cameras.main.worldView.left + 80, y: 380 }) }])
    this.lechuga.setVisible(true).setPosition(this.cameras.main.worldView.left - 40, FLOOR)
    await this.tween({ targets: this.lechuga, x: 440, duration: 800, ease: 'Sine.Out' })
    this.cameras.main.shake(200, 0.004)
    await say(this, [this.lech('¡Ese animal es mío! ¡MÍO!')])
    this.tweens.add({ targets: this.lechuga, scale: 1.3, duration: 600 })
    await say(this, [this.lech('¡Te vas a acordar de esto toda la vida!')])
    // Se transforma: titila entre él y el perro, cada vez más grande, hasta que queda en cuatro patas
    this.drone?.stop(0.3)
    sfx.estatica()
    sfx.grunido(1.6)
    this.perroImg.setTexture('perro-corre1')
    this.perroFace(1)
    for (let i = 0; i < 12; i++) {
      const esPerro = i % 2 === 1 || i > 8
      const k = 0.35 + i * 0.055
      this.lechuga.setVisible(!esPerro).setTexture(i < 6 ? 'lechugaEnojado' : 'ente').setX(440 + (i % 2 ? 10 : -10)).setScale(1.3 + i * 0.12)
      this.perro.setVisible(esPerro).setAlpha(0.6 + Math.random() * 0.4).setScale(PERRO_SCALE * k).setPosition(440 + 300 * PERRO_SCALE * k, FLOOR + 8)
      await this.wait(90 + i * 10)
    }
    this.lechuga.setVisible(false)
    sfx.grieta()
    this.perro.setAlpha(1)
    this.perroImg.setTexture('perro-corre0')
    this.roar()
    await this.tween({ targets: this.perro, scale: PERRO_SCALE, x: 500, duration: 650, ease: 'Back.Out' })
    this.cameras.main.shake(500, 0.01)
    this.tweens.add({ targets: this.flame, scale: 0.5, duration: 600 })
    this.flameGlow.setFillStyle(0x9fd6ff, 0.18)
    this.drone = startDrone()
    await say(this, [this.vela('¡Jorge! ¡Corré!')])
    this.face(9999)
    this.section = 'huida'
    this.goal.set('Escapar')
    this.help()
    this.perroMode = 'intro'
    this.perroWait = 1500 // se planta y gruñe antes de salir: ventaja para Jorge
    this.tweens.add({ targets: this.perro, angle: -9, duration: 500, yoyo: true, hold: 400 })
    this.release()
  }

  private help() {
    const t = text(this, 24, this.scale.height - 34, controlsHelp('← → / A D correr   ·   ↑ W Espacio saltar   ·   ↓ S agacharse   ·   E esconderse   ·   F pantalla completa'), 16, '#aab2c4')
      .setScrollFactor(0)
      .setDepth(950)
    this.tweens.add({ targets: t, alpha: 0, delay: 9000, duration: 1500, onComplete: () => t.destroy() })
  }

  private roar() {
    sfx.golpe()
    sfx.ladrido()
    sfx.grunido(0.8)
  }

  // ---------- Momentos de la persecución ----------

  // Pasó la reja: se cae detrás de él y el perro queda trabado del otro lado
  private rejaCae() {
    this.reja = this.solid(REJA - 20, REJA + 40, 100, FLOOR)
    this.tweens.add({ targets: this.rejaG, y: 0, duration: 260, ease: 'Quad.In', onComplete: () => { sfx.golpe(); this.cameras.main.shake(250, 0.008) } })
  }

  private async finalQuieto() {
    this.section = 'quieto'
    this.stillMs = 0
    this.goal.set(null)
    this.shout('No hay salida…', 2000)
    await this.wait(2100)
    if (this.section !== 'quieto') return
    this.shout('Jorge. ¿Qué te dijo tu mamá en la entrada?', 2600)
    await this.wait(2700)
    if (this.section !== 'quieto') return
    this.goal.set('Quedarme quieto')
  }

  // Se quedó quieto: la mamá lo encuentra y el perro se deshace con la luz
  private async final() {
    this.section = 'final'
    this.busy = true
    this.goal.set(null)
    this.setKid('stand')
    const view = this.cameras.main.worldView
    await say(this, [{ kind: 'speech', text: '¡Jorge!', anchor: () => ({ x: view.left + 60, y: 400 }) }])
    this.drone?.stop(1.2)
    // La luz: el perro titila, se aplasta y se va como una falla del sueño
    sfx.estatica()
    for (let i = 0; i < 8; i++) {
      this.perroImg.setTexture(i % 2 ? 'ente' : 'perro-olfatea0')
      this.perro.setAlpha(0.5 + Math.random() * 0.5).setX(this.perro.x + (i % 2 ? 12 : -12))
      await this.wait(110)
    }
    sfx.grieta()
    await this.tween({ targets: this.perro, scaleY: 0.1, scaleX: PERRO_SCALE * 1.8, alpha: 0, duration: 320 })
    this.perro.setVisible(false)
    this.perroEyes.clear()
    this.perroMode = 'off'
    this.tweens.add({ targets: this.red, fillAlpha: 0, duration: 800 })
    this.tweens.add({ targets: this.dark, alpha: 0.35, duration: 2500 })
    this.tweens.add({ targets: this.flame, scale: 1, duration: 1500 })
    this.flameGlow.setFillStyle(0xffc56b, 0.18)
    this.cameras.main.stopFollow()
    const mama = this.add.image(view.left - 60, FLOOR, 'mama').setOrigin(0.5, 1).setDepth(24)
    const glow = this.add.circle(mama.x, FLOOR - 128, 24, 0xfff3d6, 0.75).setDepth(24).setBlendMode(Phaser.BlendModes.ADD)
    const target = this.player.x - 80
    this.face(target)
    await this.tween({ targets: [mama, glow], x: `+=${target - mama.x}`, duration: (Math.max(0, target - mama.x) / 160) * 1000 })
    mama.setTexture('mamaAgachada')
    glow.setY(FLOOR - 92)
    await this.wait(400)
    const head = () => ({ x: mama.x, y: FLOOR - 120 })
    await say(this, [
      { kind: 'speech', text: '¡Acá estás!', anchor: head },
      { kind: 'speech', text: '¿Viste? Te quedaste quieto y te encontré.', anchor: head },
      this.kid('Mamá…'),
      this.kid('Había un perro enorme.'),
      { kind: 'speech', text: 'Ya está. Ya pasó. Vamos a casa.', anchor: head },
      this.vela('Muy bien, Jorge.'),
    ])
    const cam = this.cameras.main
    cam.fadeOut(2200, 255, 248, 236)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.scene.start('LevelEnd', { titulo: 'Fin de la demo', locacion: 'La persecución (Sesión 1, en prueba)' })
  }

  // ---------- Morir y volver ----------

  private async die(por: 'perro' | 'pozo' | 'ente') {
    if (!this.alive) return
    this.alive = false
    this.busy = true
    const cam = this.cameras.main
    if (por === 'perro') {
      this.perroMode = 'lunge'
      this.roar()
      cam.shake(250, 0.02)
      await this.tween({ targets: this.perro, x: this.player.x + 40 * this.perroDir, duration: 160, ease: 'Quad.In' })
    } else if (por === 'ente') {
      sfx.estatica()
      cam.shake(200, 0.01)
      for (let i = 0; i < 4; i++) {
        this.player.setTexture(i % 2 ? 'ente' : 'chico0')
        await this.wait(70)
      }
    } else {
      sfx.grieta()
      await this.wait(350)
    }
    // Corte a negro y vuelta al último punto de control
    cam.fadeOut(120, 0, 0, 0)
    await this.wait(900)
    this.restore(this.cp)
    cam.fadeIn(450)
    await this.wait(300)
    this.alive = true
    this.release()
  }

  private restore(i: number) {
    const c = CHECKPOINTS[i]
    this.player.setPosition(c.x, FLOOR).setAlpha(1).setTint(0xd6d6d6).setDepth(25)
    this.vx = this.vy = 0
    this.grounded = true
    this.crouch = this.hidden = false
    this.setKid('stand')
    this.face(9999)
    this.section = c.section
    this.stillMs = 0
    this.flame.setPosition(c.x + 60, FLOOR - 160)
    this.perro.setVisible(true).setAlpha(1).setScale(PERRO_SCALE).setAngle(0)
    this.perroFace(1)
    this.red.fillAlpha = 0
    this.goal.set(c.section === 'caja' ? 'Subir al carromato' : c.section === 'barriles' ? 'Seguir sin que me vea' : c.section === 'quieto' ? null : 'Escapar')
    if (c.section === 'huida') {
      this.perro.setX(c.x - 560)
      this.perroMode = 'intro'
      this.perroWait = 700
    } else if (c.section === 'caja') {
      this.perro.setX(REJA - 24)
      this.perroMode = 'stuck'
    } else if (c.section === 'barriles') {
      this.perro.setVisible(false)
      this.perroMode = 'off'
      this.searchDone = false
      this.said.delete('busca')
    } else if (c.section === 'carrera') {
      this.perro.setX(c.x - 620)
      this.perroMode = 'intro'
      this.perroWait = 600
    } else if (c.section === 'quieto') {
      this.perro.setX(c.x - 700)
      this.perroMode = 'final'
      void this.finalQuieto()
    }
  }

  // ---------- Ayudas ----------

  private release() {
    this.busy = false
    // Que el Espacio con que se cerró el último globo no cuente como salto
    this.jumpBuf = 0
    this.keys.SPACE.reset()
    this.keys.UP.reset()
    this.keys.W.reset()
  }

  private face(x: number) {
    this.facing = x < this.player.x ? -1 : 1
    this.player.setFlipX(this.facing < 0)
  }

  private perroFace(dir: number) {
    this.perroDir = dir
    this.perroImg.setFlipX(dir < 0).setOrigin(dir < 0 ? 0 : 1, 1)
  }

  private setKid(pose: 'stand' | 'walk' | 'air' | 'crouch') {
    if (pose === 'crouch') this.player.setTexture('chicoAgachado')
    else if (pose === 'air') this.player.setTexture('chico1')
    else if (pose === 'walk') this.player.setTexture(Math.floor(this.walkDist / 18) % 2 === 0 ? 'chico1' : 'chico2')
    else this.player.setTexture('chico0')
  }

  private wait(ms: number) {
    return new Promise<void>((r) => this.time.delayedCall(ms, r))
  }

  private tween(config: Phaser.Types.Tweens.TweenBuilderConfig) {
    return new Promise<void>((r) => this.tweens.add({ ...config, onComplete: () => r() }))
  }

  private height() {
    return this.crouch ? H_CROUCH : H_STAND
  }

  private overlaps(r: Rect, x: number, y: number, h: number) {
    return x + HW > r.x0 && x - HW < r.x1 && y > r.y0 + 0.5 && y - h < r.y1 - 0.5
  }

  private canStand() {
    return !this.rects.some((r) => this.overlaps(r, this.player.x, this.player.y, H_STAND))
  }

  // ---------- Física de Jorge ----------

  private stepPlayer(dt: number, dir: number, jump: boolean, down: boolean) {
    const s = dt / 1000
    // Agacharse: solo en el piso. Si hay algo arriba, sigue agachado aunque suelte la tecla
    const wantCrouch = down && this.grounded
    if (wantCrouch) this.crouch = true
    else if (this.crouch && this.canStand()) this.crouch = false

    if (this.grounded) this.coyote = COYOTE
    else this.coyote -= dt
    if (jump) this.jumpBuf = BUFFER
    else this.jumpBuf -= dt
    if (this.jumpBuf > 0 && this.coyote > 0 && !this.crouch) {
      this.vy = -JUMP_V
      this.grounded = false
      this.coyote = this.jumpBuf = 0
      sfx.step()
    }

    const speed = this.crouch ? CROUCH_SPEED : RUN
    this.vx = dir * speed
    const h = this.height()

    // Horizontal, con la caja que se empuja
    let dx = this.vx * s
    let pushing = false
    if (dx !== 0) {
      const b = this.box
      const touching = this.grounded && this.player.y > b.y0 + 1 && (dx > 0 ? Math.abs(this.player.x + HW - b.x0) < 2 : Math.abs(this.player.x - HW - b.x1) < 2)
      if (touching) {
        pushing = true
        dx = Math.sign(dx) * Math.min(Math.abs(dx), PUSH_SPEED * s)
        const nx0 = b.x0 + dx
        const blocked = this.rects.some((r) => r !== b && r.y0 < b.y1 - 1 && r.y1 > b.y0 + 1 && nx0 + (b.x1 - b.x0) > r.x0 && nx0 < r.x1)
        if (!blocked && nx0 > 3100) {
          b.x1 += dx
          b.x0 = nx0
          this.drawBox()
          if (Math.random() < 0.08) sfx.kick('caja', 0.3)
        }
      }
    }
    let x = this.player.x + dx
    for (const r of this.rects) {
      if (!this.overlaps(r, x, this.player.y, h)) continue
      if (dx > 0) x = Math.min(x, r.x0 - HW)
      else if (dx < 0) x = Math.max(x, r.x1 + HW)
    }
    x = Phaser.Math.Clamp(x, 40, END - 40)
    const moved = Math.abs(x - this.player.x)
    this.player.x = x

    // Vertical
    const prevY = this.player.y
    this.vy = Math.min(this.vy + GRAVITY * s, 1400)
    let y = prevY + this.vy * s
    let landed = false
    for (const r of this.rects) {
      if (x + HW <= r.x0 || x - HW >= r.x1) continue
      if (this.vy >= 0 && prevY <= r.y0 + 0.01 && y >= r.y0) {
        y = r.y0
        landed = true
      } else if (this.vy < 0 && prevY - h >= r.y1 - 0.01 && y - h < r.y1) {
        y = r.y1 + h
        this.vy = 0
      }
    }
    if (landed) {
      if (!this.grounded && this.vy > 500) sfx.step()
      this.vy = 0
    }
    this.grounded = landed
    this.player.y = y

    // Pose y pasos
    if (dir !== 0) {
      this.facing = dir
      this.player.setFlipX(dir < 0)
    }
    if (!this.grounded) this.setKid('air')
    else if (this.crouch) this.setKid('crouch')
    else if (moved > 0.1) {
      this.walkDist += moved
      this.setKid('walk')
    } else this.setKid('stand')
    if (this.grounded && moved > 0.1) {
      this.stepDist += moved
      if (this.stepDist > (pushing ? 60 : 40)) {
        this.stepDist = 0
        sfx.step()
      }
    }
  }

  // ---------- El perro ----------

  private stepPerro(dt: number, time: number) {
    const s = dt / 1000
    const px = this.player.x
    let v = 0
    switch (this.perroMode) {
      case 'intro':
        this.perroWait -= dt
        if (this.perroWait <= 0) this.perroMode = 'chase'
        break
      case 'chase': {
        this.perroFace(1)
        const gap = px - this.perro.x
        v = gap > 650 ? PERRO_FAR : gap < 130 ? PERRO_NEAR : PERRO
        // No pasa la reja
        if (this.reja && this.perro.x < REJA && this.perro.x + v * s >= REJA - 24) {
          this.perro.x = REJA - 24
          this.perroMode = 'stuck'
          this.roar()
          this.cameras.main.shake(300, 0.012)
          this.once('trabada', () => this.time.delayedCall(700, () => this.shout('Se quedó trabado.')))
          v = 0
        }
        break
      }
      case 'stuck':
        // Golpea la reja
        if (Math.sin(time / 120) > 0.95) {
          this.perro.x = REJA - 24 - Math.random() * 10
          if (Math.random() < 0.05) sfx.golpe()
          if (Math.random() < 0.03) sfx.ladrido()
        }
        if (px > 3500) {
          this.perroMode = 'off'
          this.tweens.add({ targets: this.perro, alpha: 0, x: REJA - 300, duration: 1800, onComplete: () => this.perro.setVisible(false) })
          this.shout('Se fue… por ahora.')
        }
        break
      case 'search':
        this.perroFace(-1)
        v = -PERRO_SEARCH
        if (this.perro.x < 4120) {
          this.perroMode = 'off'
          this.searchDone = true
          this.tweens.add({ targets: this.perro, alpha: 0, duration: 900, onComplete: () => this.perro.setVisible(false) })
          this.time.delayedCall(800, () => this.shout('Ya pasó. Despacito…'))
        }
        break
      case 'final':
        this.perroFace(1)
        // Se acerca despacio y se queda olfateando, con la cabeza encima de Jorge
        if (this.perro.x < px - 30) v = this.perro.x < px - 500 ? 260 : 90
        break
    }
    this.perro.x += v * s
    const busca = this.perroMode === 'search' || (this.perroMode === 'final' && Math.abs(v) < 200)
    if (v !== 0) {
      this.perroStep += Math.abs(v) * s
      if (busca) {
        this.perroImg.setTexture(Math.floor(this.perroStep / 45) % 2 ? 'perro-olfatea1' : 'perro-olfatea0')
        this.perro.y = FLOOR + 8
      } else {
        // Galope: estirado y encogido, con un saltito
        const fase = Math.floor(this.perroStep / 70) % 2
        this.perroImg.setTexture(fase ? 'perro-corre1' : 'perro-corre0')
        this.perro.y = FLOOR + 8 - (fase ? 0 : 10)
      }
    } else if (this.perroMode === 'final' && this.perro.visible) {
      // Olfatea a Jorge, con la nariz encima
      this.perroImg.setTexture(Math.sin(time / 180) > 0 ? 'perro-olfatea1' : 'perro-olfatea0')
      this.perro.y = FLOOR + 8
    }
    if (busca && this.perro.visible) {
      this.olfateoMs -= dt
      if (this.olfateoMs <= 0) {
        sfx.olfateo()
        this.olfateoMs = 1100 + Math.random() * 500
      }
    }

    // Los ojos, apenas, por encima de la oscuridad
    this.perroEyes.clear()
    if (this.perro.visible && this.perro.alpha > 0.3) {
      const [ox, oy] = OJO_PERRO[this.perroImg.texture.key.slice(6) as PosePerro] ?? OJO_PERRO.corre0
      const ex = this.perro.x + (this.perroDir > 0 ? -1 : 1) * (600 - ox) * PERRO_SCALE * this.perro.scaleX
      const ey = this.perro.y - (320 - oy) * PERRO_SCALE * this.perro.scaleY
      this.perroEyes.fillStyle(0xd9a860, 0.35 * this.perro.alpha).fillCircle(ex, ey, 4)
    }
  }

  // Cerca del perro: latido más rápido, pantalla roja y las pisadas
  private fear(dt: number) {
    const active = this.perro.visible && (this.perroMode === 'chase' || this.perroMode === 'search' || this.perroMode === 'final' || this.perroMode === 'intro')
    const dist = active ? Math.abs(this.player.x - this.perro.x) : 9999
    const near = Phaser.Math.Clamp(1 - dist / 750, 0, 1)
    this.red.fillAlpha += (near * 0.22 - this.red.fillAlpha) * Math.min(1, dt / 200)
    this.beat -= dt
    if (near > 0.05 && this.beat <= 0) {
      sfx.latido()
      this.beat = 950 - near * 600
    }
    this.pisadasMs -= dt
    if (near > 0.3 && this.pisadasMs <= 0 && this.perroMode !== 'final' && this.perroMode !== 'search') {
      sfx.pisadas()
      this.pisadasMs = 520 - near * 200
    }
  }

  // ---------- Bucle ----------

  update(time: number, delta: number) {
    const dt = Math.min(delta, 50)
    this.clock += dt
    const clock = this.clock
    this.grain.setTilePosition(Math.random() * 256, Math.random() * 256)

    // La llama sigue a Jorge, flotando un poco atrás
    const tx = this.player.x - 50 * this.facing
    const ty = this.player.y - 150 + Math.sin(time / 380) * 7
    const k = 1 - Math.exp(-dt / 180)
    this.flame.x += (tx - this.flame.x) * k
    if (!this.tweens.isTweening(this.flame)) this.flame.y += (ty - this.flame.y) * k
    this.flameGlow.setRadius(50 + Math.sin(time / 160) * 4 + (this.section === 'quieto' ? (this.stillMs / STILL_MS) * 40 : 0))
    this.dark.setPosition(this.player.x, this.player.y - 60)
    this.callout.setPosition(this.flame.x, this.flame.y - 40)
    if (this.callout.alpha > 0 && time > this.calloutUntil) this.callout.setAlpha(Math.max(0, this.callout.alpha - dt / 400))

    // Los entes titilan: avisan un poco antes de prenderse
    for (const e of this.entes) {
      const t = (clock + e.offset) % e.period
      const on = t < e.on
      const warn = t > e.period - 260
      e.img.setVisible(on || warn).setAlpha(on ? 0.75 + Math.random() * 0.25 : 0.25).setX(e.x + (on && Math.random() < 0.15 ? Phaser.Math.Between(-5, 5) : 0))
    }

    if (this.section !== 'intro' && this.section !== 'final') {
      this.stepPerro(dt, clock)
      this.fear(dt)
    }
    if (this.busy || !this.alive) return

    const kb = this.keys
    const left = kb.LEFT.isDown || kb.A.isDown
    const right = kb.RIGHT.isDown || kb.D.isDown
    const dir = (left ? -1 : 0) + (right ? 1 : 0)
    const jump = Phaser.Input.Keyboard.JustDown(kb.SPACE) || Phaser.Input.Keyboard.JustDown(kb.UP) || Phaser.Input.Keyboard.JustDown(kb.W)
    const down = kb.DOWN.isDown || kb.S.isDown
    const ePressed = Phaser.Input.Keyboard.JustDown(kb.E)

    // Escondido atrás de un barril: no se mueve. E (o caminar) para salir
    const barril = BARRILES.find((b) => Math.abs(this.player.x - b) < 60)
    if (this.hidden) {
      if (ePressed || dir !== 0) {
        this.hidden = false
        this.player.setAlpha(1).setTint(0xd6d6d6).setDepth(25)
      } else {
        this.prompt.setVisible(true).setText('E  Salir').setPosition(this.player.x, FLOOR - 140)
        return
      }
    } else if (barril !== undefined && this.grounded && this.section === 'barriles') {
      this.prompt.setVisible(true).setText('E  Esconderme').setPosition(barril, FLOOR - 130)
      if (ePressed) {
        this.hidden = true
        this.crouch = true
        this.player.setX(barril).setTexture('chicoAgachado').setAlpha(0.55).setTint(0x7a7a7a).setDepth(29)
        return
      }
    } else this.prompt.setVisible(false)

    this.stepPlayer(dt, dir, jump, down)
    const px = this.player.x

    // Caídas y peligros
    if (this.player.y > FLOOR + 160) {
      void this.die('pozo')
      return
    }
    for (const e of this.entes) {
      if (e.img.visible && e.img.alpha > 0.5 && Math.abs(px - e.x) < 24 && this.player.y > FLOOR - 140) {
        void this.die('ente')
        return
      }
    }
    if (this.perro.visible && this.perroDir > 0 && (this.perroMode === 'chase' || this.perroMode === 'final') && this.perro.x >= px - 8) {
      void this.die('perro')
      return
    }

    // Lo que va pasando, según por dónde va
    if (this.section === 'huida') {
      if (px > 1180) this.once('pozo', () => this.shout('¡Saltá!', 1400))
      if (px > 1520) this.once('lona', () => this.shout('¡Agachate!', 1400))
      if (px > 2020) this.once('ente', () => this.shout('No lo toques. Esperá a que se apague.', 2400))
      if (px > REJA + 70 && !this.reja) {
        this.rejaCae()
        this.cp = 1
        this.section = 'caja'
        this.goal.set('Subir al carromato')
      }
    } else if (this.section === 'caja') {
      if (px > 3150) this.once('empujar', () => this.shout('Es muy alto. ¿Y esa caja?', 2600))
      if (px > 4060 && this.player.y >= FLOOR - 1) {
        this.cp = 2
        this.section = 'barriles'
        this.goal.set('Seguir sin que me vea')
      }
    } else if (this.section === 'barriles') {
      if (px > 4130) {
        this.once('busca', () => {
          this.perro.setVisible(true).setAlpha(0).setX(5450).setScale(PERRO_SCALE).setAngle(0)
          this.perroFace(-1)
          this.perroMode = 'search'
          this.tweens.add({ targets: this.perro, alpha: 1, duration: 1500 })
          this.shout('Algo viene… ¡Escondete!', 2600)
        })
      }
      // Buscando: si lo ve fuera del barril, se le tira encima
      if (this.perroMode === 'search' && !this.hidden && px > this.perro.x - 380 && px < this.perro.x + 120) {
        void this.die('perro')
        return
      }
      if (this.searchDone && px > 5040) {
        this.cp = 3
        this.section = 'carrera'
        this.goal.set('Escapar')
        this.perro.setVisible(true).setAlpha(1).setX(px - 760)
        this.perroMode = 'intro'
        this.perroWait = 500
        this.roar()
        this.cameras.main.shake(400, 0.01)
        this.shout('¡Te vio! ¡Corré!', 1800)
      }
    } else if (this.section === 'carrera') {
      if (px > 6700) {
        this.cp = 4
        if (this.perro.x < px - 900) this.perro.setX(px - 900)
        this.perroMode = 'final'
        void this.finalQuieto()
      }
    } else if (this.section === 'quieto') {
      const near = this.perro.x > px - 420
      const quieto = dir === 0 && !jump && !down && this.grounded
      if (quieto) {
        if (near) this.stillMs += dt
        if (this.stillMs > STILL_MS) {
          void this.final()
          return
        }
      } else {
        this.stillMs = 0
        // Si se mueve con el bicho encima, lo ve
        if (this.perro.x > px - 260) {
          void this.die('perro')
          return
        }
      }
    }
  }
}

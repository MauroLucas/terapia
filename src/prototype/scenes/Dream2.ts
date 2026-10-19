import * as Phaser from 'phaser'
import { FONT, makeTextures } from '../art'
import { sfx, startCity, startDetrasDeLaPuerta, startPajaros, startRoomTone } from '../audio'
import { showPage } from '../documents'
import { addPista, state } from '../state'
import { choose, eyelids, objective, say, text, toast, type Line, type Point } from '../ui'
import { openDiary } from './diary'
import { controlsHelp } from '../touch'

// Sesión 2: el boletín. Jorge tiene unos 15 años, en la casa de su mamá y en el barrio.
//   Casa:   [cuarto de Jorge] [pasillo] [comedor: silla y campera del papá] [cocina: mamá | puerta a la calle]
//   Barrio: [frente de la casa] [almacén] [vecina] [bar: el papá] [esquina] [plaza: María]
// Jorge necesita que su papá firme el boletín, y el papá no está. Lo que ilumina la llama de Vela se recuerda (pasa de
// gris a color). Cerca de las cosas del papá hace frío y la llama se achica; cerca de María, crece.
// A la noche el papá vuelve. La violencia no se ve: el recuerdo se corta, y Jorge termina en el piso de su cuarto,
// trabando la puerta con la espalda (la misma posición que en el baño, hoy). Sigue en Office (despertar de la Sesión 2).
// No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const FLOOR = 600
const TEEN = 0.92 // Jorge a los 15: un poco más chico que de grande
const FEET = FLOOR - 70 * TEEN
const WALK = 190
const REVEAL = 240

type Area = 'casa' | 'barrio'
const AREAS: Record<Area, { x: number; w: number }> = {
  casa: { x: 0, w: 2400 },
  barrio: { x: 3000, w: 3600 },
}
const POS = {
  cama: 250,
  escritorio: 540,
  puertaCuarto: 790,
  campera: 1370,
  mesa: 1640,
  sillaPapa: 1780,
  tele: 1920,
  mama: 2170,
  puertaCalle: 2330,
  salidaCasa: 3150,
  almacen: 3680,
  vecina: 4160,
  bar: 4760,
  puertaBar: 4900,
  farol: 5180,
  hamacas: 5800,
  maria: 5900,
  banco: 6250,
}
// Cosas del papá: cerca de ellas hace frío
const FRIO = [POS.campera, POS.sillaPapa, POS.bar]

type Phase = 'intro' | 'tarde' | 'noche' | 'cena' | 'cuarto' | 'fin'
type Paint = (c: number) => number
interface Reveal {
  x: number
  gray: Phaser.GameObjects.Graphics
  color: Phaser.GameObjects.Graphics
  lit: number
  revealed: boolean
}
interface Spot {
  area: Area
  x: number
  label: string
  when: () => boolean
  action: () => Promise<void>
}

const toGray: Paint = (c) => {
  const r = (c >> 16) & 0xff
  const g = (c >> 8) & 0xff
  const b = c & 0xff
  const l = Math.round((0.3 * r + 0.59 * g + 0.11 * b) * 0.6 + 22)
  return (l << 16) | (l << 8) | Math.min(255, l + 10)
}

export class Dream2 extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private flame!: Phaser.GameObjects.Container
  private flameGlow!: Phaser.GameObjects.Arc
  private dark!: Phaser.GameObjects.Image
  private cold!: Phaser.GameObjects.Rectangle
  private dusk!: Phaser.GameObjects.Rectangle
  private papa?: Phaser.GameObjects.Image
  private mama!: Phaser.GameObjects.Image
  private mamaGlow!: Phaser.GameObjects.Arc
  private maria!: Phaser.GameObjects.Image
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text
  private goal!: ReturnType<typeof objective>
  private objs: Reveal[] = []
  private spots: Spot[] = []
  private lamps: Phaser.GameObjects.Arc[] = []
  private area: Area = 'casa'
  private phase: Phase = 'intro'
  private busy = true
  private leaving = false
  private lockUntil = 0
  private facing = 1
  private walkDist = 0
  private stepDist = 0
  private flameScale = 1
  private f = { boletin: false, mama: false, almacen: false, vecina: false, bar: false, maria: false }
  private tone?: { stop: (fade?: number) => void }
  private birds?: { stop: (fade?: number) => void }
  private voces?: { stop: (fade?: number) => void }

  constructor() {
    super('Dream2')
  }

  create() {
    this.busy = true
    this.leaving = false
    this.phase = 'intro'
    this.facing = 1
    this.flameScale = 1
    this.objs = []
    this.lamps = []
    this.f = { boletin: false, mama: false, almacen: false, vecina: false, bar: false, maria: false }
    this.papa = undefined
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0b0c10')
    this.drawCasa()
    this.drawBarrio()

    this.mama = this.add.image(POS.mama, FLOOR - 75, 'mama').setDepth(8).setFlipX(true)
    this.mamaGlow = this.add.circle(POS.mama - 2, this.mama.getTopCenter().y + 23, 22, 0xfff3d6, 0.6).setDepth(8).setBlendMode(Phaser.BlendModes.ADD)
    this.maria = this.add.image(POS.maria, FLOOR - 70, 'maria0').setDepth(8).setFlipX(true)
    this.player = this.add.image(POS.cama + 120, FEET, 'jorge0').setScale(TEEN).setDepth(10)

    this.flameGlow = this.add.circle(0, 0, 60, 0xffc56b, 0.18).setBlendMode(Phaser.BlendModes.ADD)
    this.flame = this.add.container(this.player.x + 70, FEET - 110, [this.flameGlow, this.add.image(0, 0, 'llama')]).setDepth(790).setAlpha(0)
    this.dark = this.add.image(this.player.x, FEET - 40, this.darkness()).setDepth(780).setAlpha(0)
    this.dusk = this.add.rectangle(0, 0, 1280, 720, 0x1a1030, 0).setOrigin(0).setScrollFactor(0).setDepth(770)
    this.cold = this.add.rectangle(0, 0, 1280, 720, 0x3a5a8a, 0).setOrigin(0).setScrollFactor(0).setDepth(775).setBlendMode(Phaser.BlendModes.MULTIPLY)

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
    this.setArea('casa')
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.centerOn(this.player.x, 360)
    this.tone = startRoomTone()
    this.events.once('shutdown', () => {
      this.tone?.stop(0.5)
      this.birds?.stop()
      this.voces?.stop(0.3)
    })
    void this.run(() => this.intro())
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __dream2?: Dream2 }).__dream2 = this
  }

  // ---------- Escenario ----------

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

  private reveal(x: number, draw: (g: Phaser.GameObjects.Graphics, k: Paint) => void, depth = 2) {
    const gray = this.add.graphics().setDepth(depth)
    draw(gray, toGray)
    const color = this.add.graphics().setDepth(depth).setAlpha(0)
    draw(color, (c) => c)
    this.objs.push({ x, gray, color, lit: 0, revealed: false })
  }

  private isRevealed(x: number) {
    return this.objs.some((o) => o.x === x && o.revealed)
  }

  private label(x: number, y: number, str: string, size = 12, color = '#5a6172') {
    return this.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 2 }).setOrigin(0.5).setDepth(3)
  }

  private drawCasa() {
    const { x: X, w: Wd } = AREAS.casa
    const g = this.add.graphics()
    // Paredes con empapelado de los 80, piso de baldosas
    g.fillStyle(0x5a5446).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x4c4639).fillRect(X, 0, Wd, 70)
    g.lineStyle(1, 0x635c4d)
    for (let lx = X + 20; lx < X + Wd; lx += 40) g.lineBetween(lx, 70, lx, FLOOR - 120)
    g.fillStyle(0x3d3a33).fillRect(X, FLOOR - 120, Wd, 120)
    g.fillStyle(0x2a2620).fillRect(X, FLOOR, Wd, 120)
    for (let lx = X; lx < X + Wd; lx += 60) g.fillStyle(lx % 120 === 0 ? 0x332e27 : 0x2a2620).fillRect(lx, FLOOR, 60, 120)
    // Divisiones entre ambientes
    for (const wx of [820, 1300, 2000]) g.fillStyle(0x3a352c).fillRect(wx - 10, 70, 20, FLOOR - 70)

    // Cuarto de Jorge: cama, escritorio con el boletín, póster, ventana
    this.reveal(POS.cama, (gg, k) => {
      gg.fillStyle(k(0x6b4a2e)).fillRect(120, 520, 260, 30).fillRect(120, 470, 14, 130).fillRect(366, 500, 14, 100)
      gg.fillStyle(k(0x8a3a3a)).fillRoundedRect(134, 498, 232, 26, 6)
      gg.fillStyle(k(0xe8e2cf)).fillRoundedRect(140, 486, 56, 20, 6)
    })
    this.reveal(POS.escritorio, (gg, k) => {
      gg.fillStyle(k(0x7a5a3a)).fillRect(460, 500, 170, 12).fillRect(470, 512, 10, 88).fillRect(610, 512, 10, 88)
      gg.fillStyle(k(0xe8e2cf)).fillRect(520, 492, 40, 9)
      gg.fillStyle(k(0x6f8fc0)).fillRect(520, 492, 40, 2)
      gg.fillStyle(k(0x3a3f4d)).fillRect(590, 470, 26, 30)
      // Póster de una banda (inventada)
      gg.fillStyle(k(0x1d2b4a)).fillRect(300, 250, 110, 150)
      gg.fillStyle(k(0xe0b04a)).fillTriangle(320, 380, 355, 290, 390, 380)
    })
    this.label(355, 410, 'LOS VAGOS', 12, '#6f7280')
    g.fillStyle(0x8fb3d9).fillRect(640, 220, 110, 140)
    g.lineStyle(4, 0x3a352c).strokeRect(640, 220, 110, 140).lineBetween(695, 220, 695, 360)
    // Marco de la puerta del cuarto
    g.fillStyle(0x3a2f24).fillRect(POS.puertaCuarto - 50, 400, 100, 200)
    g.fillStyle(0x6b5232).fillRect(POS.puertaCuarto - 44, 406, 88, 194)
    g.fillStyle(0xc9b46a).fillCircle(POS.puertaCuarto - 30, 505, 4)

    // Comedor: perchero con la campera del papá, mesa, su silla en la cabecera, la tele
    this.reveal(POS.campera, (gg, k) => {
      gg.fillStyle(k(0x3b2a1f)).fillRect(POS.campera - 3, 300, 6, 300).fillRect(POS.campera - 30, 594, 60, 6)
      gg.fillStyle(k(0x4a3a2a)).fillRoundedRect(POS.campera - 26, 310, 52, 110, 10)
      gg.fillStyle(k(0x3a2c20)).fillRect(POS.campera - 4, 312, 8, 100)
    })
    this.reveal(POS.mesa, (gg, k) => {
      gg.fillStyle(k(0x6b4a2e)).fillRect(POS.mesa - 160, 480, 320, 14)
      gg.fillStyle(k(0x5a3e26)).fillRect(POS.mesa - 150, 494, 12, 106).fillRect(POS.mesa + 138, 494, 12, 106)
      gg.fillStyle(k(0xe8e2cf)).fillRect(POS.mesa - 150, 472, 300, 8)
      gg.fillStyle(k(0x5a3e26)).fillRect(POS.mesa - 200, 420, 10, 180).fillRect(POS.mesa - 230, 520, 40, 8)
    })
    this.reveal(POS.sillaPapa, (gg, k) => {
      gg.fillStyle(k(0x3b2a1f)).fillRect(POS.sillaPapa + 30, 380, 14, 220).fillRect(POS.sillaPapa - 10, 520, 54, 10).fillRect(POS.sillaPapa - 8, 530, 8, 70)
      // Cenicero en la mesa
      gg.fillStyle(k(0x9aa3b5)).fillEllipse(POS.sillaPapa - 40, 470, 26, 8)
    })
    this.reveal(POS.tele, (gg, k) => {
      gg.fillStyle(k(0x4a3628)).fillRect(POS.tele - 60, 520, 120, 80)
      gg.fillStyle(k(0x2b2b2b)).fillRoundedRect(POS.tele - 50, 430, 100, 90, 10)
      gg.fillStyle(k(0x6f8fa8)).fillRoundedRect(POS.tele - 40, 440, 70, 66, 8)
      gg.lineStyle(2, k(0x2b2b2b)).lineBetween(POS.tele - 10, 430, POS.tele - 30, 400).lineBetween(POS.tele + 10, 430, POS.tele + 30, 400)
    })
    // Cocina: mesada y puerta a la calle
    this.reveal(POS.mama, (gg, k) => {
      gg.fillStyle(k(0xd9dde5)).fillRect(2040, 500, 220, 100)
      gg.fillStyle(k(0x9aa3b5)).fillRect(2034, 492, 232, 10)
      gg.fillStyle(k(0x6b8f6b)).fillRect(2040, 280, 220, 80)
      gg.fillStyle(k(0xb5562f)).fillCircle(2230, 480, 12)
    })
    g.fillStyle(0x15171d).fillRect(POS.puertaCalle - 55, 392, 110, 208)
    g.fillStyle(0x553a28).fillRect(POS.puertaCalle - 48, 400, 96, 200)
    g.fillStyle(0xc9b46a).fillCircle(POS.puertaCalle - 32, 505, 5)
  }

  private drawBarrio() {
    const { x: X, w: Wd } = AREAS.barrio
    const g = this.add.graphics()
    // Cielo de la tarde, vereda y calle
    g.fillStyle(0xe8c79a).fillRect(X, 0, Wd, 260)
    g.fillStyle(0xd9a87a).fillRect(X, 260, Wd, FLOOR - 260)
    g.fillStyle(0x8a8f99).fillRect(X, FLOOR, Wd, 30)
    g.fillStyle(0x4a4f59).fillRect(X, FLOOR + 30, Wd, 90)
    g.lineStyle(1, 0x6f7480)
    for (let lx = X; lx < X + Wd; lx += 50) g.lineBetween(lx, FLOOR, lx, FLOOR + 30)

    // Frente de la casa de Jorge
    this.reveal(POS.salidaCasa, (gg, k) => {
      gg.fillStyle(k(0xe0d6c0)).fillRect(3000, 300, 380, 300)
      gg.fillStyle(k(0xb5562f)).fillTriangle(2990, 300, 3390, 300, 3190, 220)
      gg.fillStyle(k(0x553a28)).fillRect(POS.salidaCasa - 45, 410, 90, 190)
      gg.fillStyle(k(0x8fb3d9)).fillRect(3260, 400, 80, 80)
    })
    // Almacén
    this.reveal(POS.almacen, (gg, k) => {
      gg.fillStyle(k(0xd9c9a8)).fillRect(3500, 300, 360, 300)
      gg.fillStyle(k(0x4f9d4a)).fillRect(3490, 380, 380, 30)
      for (let i = 0; i < 9; i++) gg.fillStyle(k(i % 2 ? 0xf1efe8 : 0x4f9d4a)).fillTriangle(3490 + i * 42, 410, 3532 + i * 42, 410, 3511 + i * 42, 430)
      gg.fillStyle(k(0x2b2b2b)).fillRect(3620, 440, 120, 160)
      gg.fillStyle(k(0x8fb3d9)).fillRect(3520, 440, 80, 80).fillRect(3760, 440, 80, 80)
    })
    this.label(3680, 358, 'ALMACÉN', 22, '#4a3a2a')
    // Casa de la vecina
    this.reveal(POS.vecina, (gg, k) => {
      gg.fillStyle(k(0xc9d6e0)).fillRect(4000, 320, 340, 280)
      gg.fillStyle(k(0x6b8f6b)).fillRect(4000, 300, 340, 24)
      gg.fillStyle(k(0x3a4a5a)).fillRect(POS.vecina - 40, 420, 80, 180)
      gg.fillStyle(k(0xf2e3a0)).fillRect(4040, 400, 60, 60).fillRect(4250, 400, 60, 60)
      gg.fillStyle(k(0x6b8f6b)).fillRect(4020, 560, 60, 40)
    })
    // El bar: adentro, siluetas. Una es el papá
    this.reveal(POS.bar, (gg, k) => {
      gg.fillStyle(k(0x5a2e2e)).fillRect(4500, 280, 520, 320)
      gg.fillStyle(k(0x2a1a1a)).fillRect(4560, 380, 300, 150)
      gg.fillStyle(k(0xe0a23a)).fillRect(4566, 386, 288, 138)
      gg.fillStyle(k(0x3a2a20)).fillRect(4566, 480, 288, 44)
      gg.fillStyle(k(0x2a1a1a)).fillRect(POS.puertaBar - 40, 410, 80, 190)
    }, 2)
    this.label(4760, 320, 'BAR', 30, '#e0b04a').setFontStyle('bold')
    for (const [sx, sc] of [[4620, 0.55], [4700, 0.6], [4830, 0.55]] as [number, number][]) {
      this.add.image(sx, 470, 'sombra').setScale(sc).setDepth(2.5).setTint(0x2a2020)
    }
    // El papá: más grande, de espaldas
    this.add.image(POS.bar, 462, 'sombra').setScale(0.68).setDepth(2.5).setTint(0x101014)

    // El almacenero y la vecina: sin cara, como la gente de la feria
    this.add.image(POS.almacen, FLOOR - 75, 'sombra').setAlpha(0.9).setDepth(8)
    this.add.image(POS.vecina, FLOOR - 75, 'sombra').setAlpha(0.9).setDepth(8).setFlipX(true)

    // Esquina con farol
    g.fillStyle(0x3a3f4d).fillRect(POS.farol - 4, 300, 8, 300)
    g.fillStyle(0x3a3f4d).fillRect(POS.farol - 20, 292, 40, 10)
    this.lamps.push(this.add.circle(POS.farol, 306, 70, 0xffe2a8, 0).setDepth(781).setBlendMode(Phaser.BlendModes.ADD))

    // Plaza: árbol, hamacas, banco
    this.reveal(POS.hamacas, (gg, k) => {
      gg.fillStyle(k(0x5a8a4a)).fillRect(5300, FLOOR - 6, 1300, 6)
      gg.fillStyle(k(0x6b4a2e)).fillRect(5430, 330, 30, 270)
      gg.fillStyle(k(0x4f7a3f)).fillCircle(5445, 300, 110).fillCircle(5380, 340, 70).fillCircle(5510, 340, 70)
      gg.lineStyle(8, k(0xc0392b)).lineBetween(5700, FLOOR, 5740, 360).lineBetween(5900, FLOOR, 5860, 360).lineBetween(5740, 360, 5860, 360)
      gg.lineStyle(2, k(0x9aa3b5)).lineBetween(5765, 362, 5765, 520).lineBetween(5795, 362, 5795, 520).lineBetween(5815, 362, 5815, 520).lineBetween(5845, 362, 5845, 520)
      gg.fillStyle(k(0x6b4a2e)).fillRect(5755, 520, 50, 8).fillRect(5808, 520, 46, 8)
    })
    this.reveal(POS.banco, (gg, k) => {
      gg.fillStyle(k(0x4f9d4a)).fillRect(6180, 540, 140, 10).fillRect(6180, 508, 140, 8)
      gg.fillStyle(k(0x3a3f4d)).fillRect(6186, 550, 8, 50).fillRect(6306, 550, 8, 50)
    })
    g.fillStyle(0x3a3f4d).fillRect(6480 - 4, 300, 8, 300).fillRect(6460, 292, 40, 10)
    this.lamps.push(this.add.circle(6480, 306, 70, 0xffe2a8, 0).setDepth(781).setBlendMode(Phaser.BlendModes.ADD))
  }

  // ---------- Personajes y líneas ----------

  private jorgeHead = (): Point => {
    const sitting = this.player.texture.key === 'jorgeSentado'
    const t = this.player.getTopCenter()
    return { x: t.x + 6 * this.facing, y: t.y + (sitting ? 4 : 0) }
  }
  private think = (t: string): Line => ({ kind: 'thought', text: t, anchor: this.jorgeHead })
  private speak = (t: string): Line => ({ kind: 'speech', text: t, anchor: this.jorgeHead })
  private vela = (t: string): Line => ({ kind: 'intercom', text: t, anchor: () => ({ x: this.flame.x, y: this.flame.y - 20 }) })
  private at = (x: number, y: number, t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x, y }) })
  private mamaSays = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: this.mama.x, y: this.mama.getTopCenter().y }) })
  private mariaSays = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: this.maria.x, y: this.maria.getTopCenter().y }) })
  private papaSays = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: this.papa!.x, y: this.papa!.getTopCenter().y }) })

  private pista(titulo: string, texto: string) {
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
  }

  private setupSpots() {
    const tarde = () => this.phase === 'tarde'
    this.spots = [
      { area: 'casa', x: POS.escritorio, label: 'Boletín', when: () => tarde() && !this.f.boletin, action: () => this.boletin() },
      { area: 'casa', x: POS.campera, label: 'Campera', when: tarde, action: () => say(this, [this.think('Su campera.'), this.think('Huele a cigarrillo. Si está colgada acá, él no está.')]) },
      { area: 'casa', x: POS.sillaPapa, label: 'Silla', when: tarde, action: () => this.silla() },
      { area: 'casa', x: POS.tele, label: 'Tele', when: tarde, action: () => say(this, [this.think('La tele.'), this.think('Cuando él está, está siempre prendida. Para no hablar.')]) },
      { area: 'casa', x: POS.mama, label: 'Mamá', when: () => tarde() || this.phase === 'noche', action: () => this.hablarMama() },
      { area: 'casa', x: POS.puertaCalle, label: 'Salir', when: () => tarde() || this.phase === 'noche', action: () => this.salir() },
      { area: 'barrio', x: POS.salidaCasa, label: 'Casa', when: () => tarde() || this.phase === 'noche', action: () => this.entrar() },
      { area: 'barrio', x: POS.almacen, label: 'Almacenero', when: tarde, action: () => this.almacen() },
      { area: 'barrio', x: POS.vecina, label: 'Vecina', when: tarde, action: () => this.vecina() },
      { area: 'barrio', x: POS.bar, label: 'Bar', when: tarde, action: () => this.bar() },
      { area: 'barrio', x: POS.maria, label: this.f.maria ? 'María' : 'Chica', when: tarde, action: () => this.hablarMaria() },
      { area: 'casa', x: POS.sillaPapa - 70, label: 'Papá', when: () => this.phase === 'cena', action: () => this.darBoletin() },
    ]
  }

  private updateGoal() {
    if (this.phase === 'tarde') {
      if (!this.f.boletin) this.goal.set('Ver qué hay en el escritorio')
      else if (!this.f.bar) this.goal.set('Conseguir que papá firme el boletín')
      else if (!this.f.maria) this.goal.set('Hacer tiempo hasta que papá vuelva')
      else this.goal.set('Encontrar a papá')
    } else if (this.phase === 'noche') this.goal.set('Volver a casa')
    else if (this.phase === 'cena') this.goal.set('Darle el boletín a papá')
    else this.goal.set(null)
  }

  // ---------- Secuencia ----------

  private async intro() {
    const lids = eyelids(this, 0)
    await this.wait(900)
    await lids.to(0.35, 2000)
    await lids.to(0.2, 900)
    await lids.to(1, 2200)
    lids.destroy()
    await say(this, [this.think('Mi cuarto.'), this.think('En la casa de mamá.'), this.think('Soy más grande. Tengo… quince, dieciséis.')])
    this.flame.setPosition(this.player.x + 70, FEET - 260)
    sfx.flame()
    this.tweens.add({ targets: this.flame, alpha: 1, y: FEET - 110, duration: 1500, ease: 'Sine.Out' })
    await this.wait(1600)
    await say(this, [
      this.vela('Acá estoy, Jorge. Estás soñando otra vez.'),
      this.vela('Ya sabés cómo es: lo que ilumine, lo vas a poder recordar.'),
    ])
    this.phase = 'tarde'
    this.updateGoal()
    const help = text(this, 24, this.scale.height - 34, controlsHelp('← → / A D caminar   ·   E examinar / hablar   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa'), 16, '#aab2c4')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500 }))
  }

  private async boletin() {
    this.f.boletin = true
    sfx.paper()
    if (!state.inventario.includes('boletin')) state.inventario.push('boletin')
    await showPage(this, 'boletin', 0)
    await say(this, [
      this.think('El boletín. Un tres en matemática.'),
      this.think('La preceptora quiere hablar con mi papá. Tiene que firmarlo él.'),
      this.think('Y lo tengo que llevar mañana.'),
    ])
    this.pista('El boletín', 'Me saqué un tres en matemática. Lo tiene que firmar mi papá, y la preceptora quiere hablar con él.')
    this.updateGoal()
  }

  private async silla() {
    await say(this, [this.think('Su silla. En la cabecera.'), this.think('Nadie se sienta ahí. Ni cuando él no está.')])
    this.pista('La silla de papá', 'En la mesa, la silla de mi papá. Nadie se sienta ahí, ni cuando él no está.')
  }

  private async hablarMama() {
    if (this.phase === 'noche') {
      await say(this, [this.mamaSays('Ya está la comida. Lavate las manos, que tu papá ya llega.')])
      return
    }
    if (!this.f.boletin) {
      await say(this, [this.mamaSays('¿Ya hiciste la tarea?'), this.think('No le puedo ver la cara. Como en la feria.')])
      return
    }
    if (this.f.mama) {
      await say(this, [this.mamaSays('Ya va a venir, hijo.')])
      return
    }
    this.f.mama = true
    await say(this, [
      this.speak('Ma… ¿y papá?'),
      this.mamaSays('No sé, hijo. Ya va a venir.'),
      this.speak('Me tiene que firmar el boletín.'),
      this.mamaSays('Dámelo, lo firmo yo.'),
      this.speak('No. La preceptora quiere que lo firme él.'),
      this.mamaSays('…Bueno. Pero dáselo cuando esté tranquilo.'),
      this.think('¿Y cuándo está tranquilo?'),
    ])
    this.pista('Mamá', 'Mamá se ofreció a firmar el boletín ella. Me dijo que se lo dé a papá "cuando esté tranquilo".')
  }

  private async salir() {
    if (this.phase === 'tarde' && !this.f.boletin) {
      await say(this, [this.think('Antes… tengo algo en el escritorio que no quiero mirar.')])
      return
    }
    if (this.phase === 'noche') {
      await say(this, [this.think('Ya es de noche. Tiene que estar por llegar.')])
      return
    }
    await this.goTo('barrio', POS.salidaCasa + 70)
    if (!this.birds) this.birds = startPajaros()
  }

  private async entrar() {
    await this.goTo('casa', POS.puertaCalle - 70)
    if (this.phase === 'noche') {
      // Adentro, de noche, las luces de la casa están prendidas: se ve un poco más
      this.dusk.setFillStyle(0x1a1030, 0.2)
      this.dark.setAlpha(0.6)
      await this.llegaPapa()
    }
  }

  private async almacen() {
    const x = POS.almacen
    if (this.f.almacen) {
      await say(this, [this.at(x, 450, 'Saludos a tu mamá, pibe.')])
      return
    }
    this.f.almacen = true
    await say(this, [
      this.speak('¿Vio a mi papá?'),
      this.at(x, 450, '¿Tu viejo? Pasó temprano. Compró cigarrillos y siguió para el bar.'),
      this.think('El bar.'),
    ])
    this.pista('El almacenero', 'Papá pasó temprano por el almacén y siguió para el bar.')
  }

  private async vecina() {
    const x = POS.vecina
    if (this.f.vecina) {
      await say(this, [this.at(x, 430, 'Cuidate, Jorgito.')])
      return
    }
    this.f.vecina = true
    await say(this, [
      this.at(x, 430, 'Hola, Jorgito. ¿Tu mamá está bien?'),
      this.speak('Sí… ¿por?'),
      this.at(x, 430, 'Por nada. Decile que cualquier cosa, me golpea la pared.'),
      this.think('Todos saben. Nadie dice nada.'),
    ])
    this.pista('La vecina', 'La vecina me preguntó si mamá estaba bien. "Cualquier cosa, que me golpee la pared." Todos saben y nadie dice nada.')
  }

  private async bar() {
    if (this.f.bar) {
      await say(this, [this.think('No. Acá no.')])
      return
    }
    this.f.bar = true
    await say(this, [
      this.think('Ahí está. En la barra, de espaldas.'),
      this.think('Si entro con el boletín acá adentro…'),
      this.think('No. Mejor espero a que vuelva a casa.'),
    ])
    this.pista('El bar', 'Papá está en el bar del barrio. No me animé a entrar. Mejor espero a que vuelva a casa.')
    if (!this.f.maria) await say(this, [this.think('Voy a la plaza. Hasta que se haga de noche.')])
    this.updateGoal()
    await this.checkNoche()
  }

  private async hablarMaria() {
    if (this.f.maria) {
      await say(this, [this.mariaSays('Los martes estoy acá. No te olvides.')])
      return
    }
    this.f.maria = true
    this.maria.setFlipX(this.player.x < this.maria.x)
    await say(this, [
      this.mariaSays('¿Estás bien? Hace un rato que das vueltas.'),
      this.speak('Estoy esperando a mi viejo.'),
      this.mariaSays('¿Acá?'),
      this.speak('No. Que vuelva a casa.'),
      this.mariaSays('¿Y eso?'),
    ])
    await say(this, [this.think('Le muestro el boletín.')])
    await say(this, [
      this.mariaSays('¿Un tres en matemática? Yo tengo un dos.'),
      this.mariaSays('Soy María. Me mudé a la vuelta.'),
      this.speak('Jorge.'),
      this.mariaSays('¿Y por qué no lo firmás vos? Mi hermano lo hace siempre.'),
    ])
    const i = await choose(this, ['"Lo firmo yo."', '"No. Tiene que ser él."'], { x: 640, y: 640 })
    if (i === 0) await this.intentarFirmar()
    else await say(this, [this.speak('No. Tiene que ser él.'), this.mariaSays('Bueno. Vos sabrás.')])
    await say(this, [
      this.mariaSays('Si querés, te ayudo a estudiar. Los martes estoy acá.'),
      this.speak('Dale.'),
      this.think('María.'),
      this.think('Es la primera vez en todo el día que me olvido de mi casa.'),
    ])
    this.pista('María', 'La conocí en la plaza. Se mudó a la vuelta. Se ofreció a ayudarme con matemática los martes.')
    this.updateGoal()
    await this.checkNoche()
  }

  // El jugador puede intentar cambiar el recuerdo, pero no se puede: los recuerdos no mienten
  private async intentarFirmar() {
    state.intentoFirmar = true
    await say(this, [this.speak('Lo firmo yo.'), this.mariaSays('Dale, yo no digo nada.')])
    sfx.paper()
    const sign = text(this, this.player.x + 20, this.player.y - 120, 'J. ', 28, '#2b3140', { fontStyle: 'italic' }).setOrigin(0.5).setDepth(960)
    await this.wait(500)
    sign.setText('J. Pe')
    await this.wait(500)
    await this.tween({ targets: sign, alpha: 0, duration: 900 })
    sign.destroy()
    await say(this, [
      this.think('La tinta se borra.'),
      this.vela('No fue así, Jorge. Es un recuerdo: no se puede cambiar.'),
      this.speak('…Mejor no. Tiene que ser él.'),
    ])
  }

  private async checkNoche() {
    if (!this.f.bar || !this.f.maria || this.phase !== 'tarde') return
    await this.wait(600)
    await say(this, [this.vela('Se está haciendo de noche, Jorge.'), this.vela('Tenés que volver a tu casa.')])
    this.phase = 'noche'
    this.birds?.stop()
    this.birds = undefined
    this.tweens.add({ targets: this.dusk, fillAlpha: 0.55, duration: 2500 })
    this.tweens.add({ targets: this.dark, alpha: 1, duration: 2500 })
    this.tweens.add({ targets: this.lamps, fillAlpha: 0.35, duration: 2500 })
    this.tweens.add({ targets: this.maria, alpha: 0, duration: 1500 })
    this.updateGoal()
  }

  // A la noche, al entrar: la mamá pone la mesa y llega el auto del papá
  private async llegaPapa() {
    this.phase = 'cena'
    this.goal.set(null)
    await say(this, [this.mamaSays('Ya está la comida. Lavate las manos, que tu papá ya llega.')])
    const car = startCity()
    const light = this.add.rectangle(2000, 300, 260, 400, 0xfff2c0, 0.0).setDepth(779).setBlendMode(Phaser.BlendModes.ADD)
    await this.tween({ targets: light, fillAlpha: 0.25, x: 1300, duration: 1800, ease: 'Sine.InOut' })
    light.destroy()
    await this.wait(600)
    car.stop(1)
    sfx.door()
    // Entra: grande, oscuro, sin cara. Va a su silla
    this.papa = this.add.image(POS.puertaCalle, FLOOR - 86, 'sombra').setScale(1.15).setTint(0x14151b).setDepth(9).setFlipX(true)
    await this.tween({ targets: this.papa, x: POS.sillaPapa, duration: 2600 })
    await this.wait(500)
    await say(this, [this.think('Llegó.'), this.mamaSays('Hola…'), this.think('No contesta.')])
    this.updateGoal()
  }

  private async darBoletin() {
    this.phase = 'fin'
    this.leaving = true
    this.goal.set(null)
    this.facing = 1
    this.player.setFlipX(false)
    await say(this, [this.speak('Papá… me tenés que firmar el boletín.'), this.papaSays('A ver.')])
    await this.wait(1200)
    await say(this, [this.papaSays('¿Un tres?'), this.speak('La preceptora quiere hablar con vos.'), this.papaSays('¿Conmigo?')])
    await this.wait(900)
    await say(this, [this.papaSays('Mirame cuando te hablo.')])
    // El recuerdo se corta: no se muestra lo que pasó
    this.tone?.stop(0.05)
    const black = this.add.rectangle(0, 0, 1280, 720, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(1200)
    await this.wait(2800)
    await this.enElCuarto(black)
  }

  // Jorge en el piso de su cuarto, con la espalda contra la puerta. Del otro lado, el papá y la mamá
  private async enElCuarto(black: Phaser.GameObjects.Rectangle) {
    this.phase = 'cuarto'
    this.papa?.destroy()
    this.mama.setVisible(false)
    this.mamaGlow.setVisible(false)
    this.cameras.main.stopFollow()
    this.cameras.main.centerOn(560, 360)
    this.player.setTexture('jorgeSentado').setScale(TEEN).setOrigin(0.5, 1).setFlipX(true).setPosition(POS.puertaCuarto - 70, FLOOR)
    this.facing = -1
    this.flameScale = 0.4
    this.flame.setPosition(POS.puertaCuarto - 150, FLOOR - 170)
    this.cold.setFillStyle(0x3a5a8a, 0.55)
    this.voces = startDetrasDeLaPuerta()
    await this.tween({ targets: black, alpha: 0, duration: 1800 })
    black.destroy()
    const doorTalk = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: POS.puertaCuarto + 60, y: 420 }) })
    await this.wait(1500)
    await say(this, [this.think('Que se termine.')])
    await this.wait(2000)
    await say(this, [doorTalk('¡Basta!')])
    this.cameras.main.shake(140, 0.003)
    await this.wait(1800)
    await say(this, [this.think('Que se termine, por favor.'), this.vela('Estoy acá, Jorge.'), this.vela('No estás solo.')])
    await this.wait(1500)
    // Se va el auto
    this.voces.stop(1.5)
    const car = startCity()
    await this.wait(2500)
    car.stop(2.5)
    await this.wait(3000)
    sfx.kick('caja', 0.4)
    await this.wait(400)
    sfx.kick('caja', 0.4)
    await say(this, [doorTalk('Jorge… soy mamá.'), doorTalk('Ya se fue. Abrime, hijo.')])
    const i = await choose(this, ['Abrir la puerta', 'Quedarme acá'], { x: 640, y: 620 })
    if (i === 0) await say(this, [this.think('Quiero abrir.'), this.think('Pero esa noche no le abrí.')])
    else await say(this, [this.think('No puedo.')])
    await say(this, [doorTalk('Está bien. Te lo dejo acá.')])
    // Le pasa el boletín firmado por debajo de la puerta
    sfx.paper()
    const b = this.add.image(POS.puertaCuarto + 40, FLOOR - 4, 'boletin').setAngle(90).setDepth(11)
    await this.tween({ targets: b, x: POS.puertaCuarto - 20, duration: 1200, ease: 'Sine.Out' })
    await this.wait(500)
    b.destroy()
    await showPage(this, 'boletin', 1)
    await say(this, [
      this.think('Lo firmó ella.'),
      this.think('Como siempre.'),
      this.think('Me quedé así toda la noche. Sentado en el piso, trabando la puerta.'),
    ])
    this.pista('La firma', 'Esa noche mamá firmó el boletín y me lo pasó por debajo de la puerta. No le abrí. Me quedé toda la noche en el piso, trabando la puerta.')
    await this.wait(800)
    await say(this, [this.vela('Ya pasó, Jorge.'), this.vela('Vas a despertar.')])
    if (!state.lineaDeTiempo.includes('Adolescencia: el boletín')) state.lineaDeTiempo.push('Adolescencia: el boletín')
    const cam = this.cameras.main
    cam.fadeOut(2600, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    await this.wait(700)
    this.scene.start('Office', { despertar: true, sesion: 2 })
  }

  // ---------- Movimiento ----------

  private setArea(area: Area) {
    this.area = area
    const r = AREAS[area]
    this.cameras.main.setBounds(r.x, 0, r.w, 720)
  }

  private async goTo(area: Area, x: number) {
    sfx.door()
    const cam = this.cameras.main
    cam.fadeOut(250, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.player.setX(x)
    this.flame.setX(x + 70 * this.facing)
    this.setArea(area)
    cam.centerOn(x, 360)
    cam.fadeIn(250, 0, 0, 0)
    await this.wait(250)
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
    if (this.player.texture.key !== 'jorgeSentado') this.player.setTexture('jorge0')
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
    // La llama sigue a Jorge. Cerca de las cosas del papá se achica y hace frío; cerca de María, crece
    if (this.phase !== 'cuarto' && this.phase !== 'intro') {
      const tx = this.player.x + 70 * this.facing
      const ty = FEET - 110 + Math.sin(time / 420) * 8
      const k = 1 - Math.exp(-dt / 260)
      this.flame.x += (tx - this.flame.x) * k
      if (!this.tweens.isTweening(this.flame)) this.flame.y += (ty - this.flame.y) * k
      let frio = 0
      const frios = this.papa ? [...FRIO, this.papa.x] : FRIO
      if (this.phase !== 'noche' || this.papa) for (const fx of frios) frio = Math.max(frio, 1 - Math.abs(fx - this.player.x) / 420)
      const calor = this.phase === 'tarde' && this.area === 'barrio' ? Math.max(0, 1 - Math.abs(POS.maria - this.player.x) / 380) : 0
      const target = Phaser.Math.Clamp(1 - frio * 0.6 + calor * 0.5, 0.35, 1.5)
      this.flameScale += (target - this.flameScale) * k
      this.cold.setFillStyle(0x3a5a8a, Math.max(0, frio) * 0.45)
      // Lo que la luz toca un rato, se recuerda
      for (const o of this.objs) {
        if (o.revealed) continue
        if (Math.abs(o.x - this.flame.x) < REVEAL * this.flameScale) {
          o.lit += dt
          if (o.lit > 700) {
            o.revealed = true
            sfx.reveal()
            this.tweens.add({ targets: o.color, alpha: 1, duration: 1200 })
          }
        } else o.lit = 0
      }
    }
    this.flame.setScale(this.flameScale)
    this.flameGlow.setRadius(60 + Math.sin(time / 180) * 4)
    this.dark.setPosition(this.flame.x, this.flame.y).setScale(0.75 + this.flameScale * 0.35)

    const k = this.keys
    const ePressed = Phaser.Input.Keyboard.JustDown(k.E)
    const tabPressed = Phaser.Input.Keyboard.JustDown(k.TAB)
    if (this.busy || time < this.lockUntil) return

    if (tabPressed) {
      void this.run(() => openDiary(this))
      return
    }

    const r = AREAS[this.area]
    const dir = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0)
    if (dir !== 0) {
      const from = this.player.x
      this.player.x = Phaser.Math.Clamp(from + dir * WALK * (dt / 1000), r.x + 80, r.x + r.w - 80)
      const moved = Math.abs(this.player.x - from)
      this.facing = dir
      this.player.setFlipX(dir < 0)
      this.walkDist += moved
      this.stepDist += moved
      this.player.setTexture(Math.floor(this.walkDist / 18) % 2 === 0 ? 'jorge1' : 'jorge2')
      if (this.stepDist > 38) {
        this.stepDist = 0
        sfx.step()
      }
    } else {
      this.player.setTexture('jorge0')
    }

    const spot = this.spots.find((s) => s.area === this.area && s.when() && Math.abs(this.player.x - s.x) < 75)
    if (spot) {
      // Los objetos del recuerdo se examinan recién cuando la luz los ilumina (las personas y las puertas, siempre)
      const people = ['Mamá', 'Chica', 'María', 'Papá', 'Salir', 'Casa', 'Puerta']
      const lit = people.includes(spot.label) || !this.objs.some((o) => o.x === spot.x) || this.isRevealed(spot.x)
      this.prompt.setVisible(true).setPosition(spot.x, 300)
      this.promptLabel.setText(spot.x === POS.maria ? (this.f.maria ? 'María' : 'Chica') : spot.label)
      if (ePressed) {
        if (!lit) void this.run(() => say(this, [this.think('Todavía no lo veo bien.')]))
        else void this.run(spot.action)
      }
    } else {
      this.prompt.setVisible(false)
    }
  }
}

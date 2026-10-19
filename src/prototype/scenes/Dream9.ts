import * as Phaser from 'phaser'
import { FONT, HAND_FONT, makeTextures } from '../art'
import { sfx, startRoomTone } from '../audio'
import { showObjeto } from '../documents'
import { addPista, state } from '../state'
import { controlsHelp } from '../touch'
import { eyelids, objective, say, text, toast, type Line, type Point } from '../ui'
import { openDiary } from './diary'

// Sesión 9: el baño. La última. Jorge tiene 40 años. Es hoy.
//   Sueño, su casa:   [cuarto: la pizarra llena] | [pasillo: puerta del baño, portero, salida]
//   Recuerdo:         [la habitación del hospital, ahora sin tachar]
//   Real, el baño:    [Jorge en el piso, el celular] … [la puerta, trabada desde adentro]
//   Real, el pasillo: [puerta del baño] [portero]
//   Epílogo, cocina:  [la billetera] [el teléfono]
// En el sueño, Jorge vuelve a su casa esta noche. Suena el portero: primero la voz del chofer, después la de María.
// Vela le dice la verdad: no es un doctor, Neural no existe, es una parte de Jorge. El sueño se desarma y solo queda la
// puerta del baño, trabada desde adentro: Jorge está ahí, en el piso. Le mandó un mensaje a María y por eso ella vino.
// Con la voz de María vuelve el recuerdo del hospital, y esta vez se lee lo que dijo su mamá: "No vivas con rencor,
// hijo". Jorge se despierta en el piso del baño, se levanta, abre la puerta y atiende el portero. Epílogo: unos días
// después saca el papelito de la billetera y llama a su papá. Se corta en el "¿Hola?".
// Cuidado: no se muestra nada de lo que Jorge iba a hacer en el baño, ni el texto del mensaje. Solo se lo ve en el piso.
// No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const FLOOR = 600
const FEET = FLOOR - 70
const WALK = 180
const REVEAL = 260

type Area = 'depto' | 'recuerdo' | 'bano' | 'pasillo' | 'cocina'
const AREAS: Record<Area, { x: number; w: number }> = {
  depto: { x: 0, w: 2600 },
  recuerdo: { x: 3200, w: 1280 },
  bano: { x: 5200, w: 1280 },
  pasillo: { x: 6800, w: 1400 },
  cocina: { x: 8600, w: 1280 },
}
const POS = {
  cama: 320,
  pizarra: 920,
  puertaBano: 1700,
  portero: 2080,
  salida: 2420,
  camaHospital: 3900,
  jorgePiso: 5520,
  celular: 5640,
  puertaReal: 6300,
  banoPasillo: 7100,
  porteroReal: 7560,
  billetera: 9100,
  telefono: 9500,
}

type Phase = 'intro' | 'pizarra' | 'pasillo' | 'portero' | 'puerta' | 'recuerdo' | 'piso' | 'abrir' | 'atender' | 'epilogo' | 'llamar' | 'fin'
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

const TACHADO = '████ ██ ██████ ███ █████'

export class Dream9 extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private flame!: Phaser.GameObjects.Container
  private flameGlow!: Phaser.GameObjects.Arc
  private mama!: Phaser.GameObjects.Image
  private sueno!: Phaser.GameObjects.Rectangle
  private puertaLuz!: Phaser.GameObjects.Graphics
  private puertaReal!: Phaser.GameObjects.Graphics
  private celularLuz!: Phaser.GameObjects.Arc
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text
  private goal!: ReturnType<typeof objective>
  private objs: Reveal[] = []
  private spots: Spot[] = []
  private area: Area = 'depto'
  private phase: Phase = 'intro'
  private busy = true
  private leaving = false
  private lockUntil = 0
  private facing = 1
  private walkDist = 0
  private stepDist = 0
  private flameScale = 1
  private flameTarget = 1
  private intentos = 0
  private f = { celular: false, billetera: false, timbre: false }
  private ring?: Phaser.Time.TimerEvent
  private tone?: { stop: (fade?: number) => void }

  constructor() {
    super('Dream9')
  }

  create() {
    this.busy = true
    this.leaving = false
    this.phase = 'intro'
    this.facing = 1
    this.flameScale = this.flameTarget = 1
    this.intentos = 0
    this.objs = []
    this.f = { celular: false, billetera: false, timbre: false }
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0b0c10')
    this.drawDepto()
    this.drawRecuerdo()
    this.drawBano()
    this.drawPasillo()
    this.drawCocina()

    this.mama = this.add.image(POS.camaHospital, 470, 'mamaMayor0').setDepth(8).setAngle(-90)
    this.player = this.add.image(POS.cama + 140, FEET, 'jorge0').setDepth(10)

    this.flameGlow = this.add.circle(0, 0, 60, 0xffc56b, 0.18).setBlendMode(Phaser.BlendModes.ADD)
    this.flame = this.add.container(this.player.x + 70, FEET - 110, [this.flameGlow, this.add.image(0, 0, 'llama')]).setDepth(790).setAlpha(0)
    // Cuando el sueño se desarma, todo se oscurece menos la puerta del baño
    this.sueno = this.add.rectangle(AREAS.depto.x, 0, AREAS.depto.w, 720, 0x05060a, 0).setOrigin(0).setDepth(40)

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
    this.setArea('depto')
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.centerOn(this.player.x, 360)
    this.tone = startRoomTone()
    this.events.once('shutdown', () => this.tone?.stop(0.5))
    void this.run(() => this.intro())
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __dream9?: Dream9 }).__dream9 = this
  }

  // ---------- Escenario ----------

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

  private door(g: Phaser.GameObjects.Graphics, x: number, color: number) {
    g.fillStyle(0x15171d).fillRect(x - 55, 392, 110, 208)
    g.fillStyle(color).fillRect(x - 48, 400, 96, 200)
    g.fillStyle(0xc9ced8).fillCircle(x - 32, 505, 5)
  }

  // Su casa, en el sueño: la misma de siempre, de noche, en gris hasta que la llama la toca
  private drawDepto() {
    const { x: X, w: Wd } = AREAS.depto
    const g = this.add.graphics()
    g.fillStyle(0x2a3044).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x222738).fillRect(X, 0, Wd, 70)
    g.fillStyle(0x1e2230).fillRect(X, FLOOR, Wd, 120)
    g.fillStyle(0x1a1d28).fillRect(1300, 70, 20, FLOOR - 70)
    g.fillStyle(0x1d2a44).fillRect(560, 210, 140, 150)
    g.lineStyle(5, 0x15171d).strokeRect(560, 210, 140, 150).lineBetween(630, 210, 630, 360)
    this.reveal(POS.cama, (gg, k) => {
      gg.fillStyle(k(0x4a3628)).fillRect(POS.cama - 200, 520, 280, 30).fillRect(POS.cama - 200, 450, 14, 150).fillRect(POS.cama + 66, 500, 14, 100)
      gg.fillStyle(k(0x5a6a9a)).fillRoundedRect(POS.cama - 186, 498, 252, 26, 6)
      gg.fillStyle(k(0xb5bec8)).fillRoundedRect(POS.cama - 180, 486, 60, 18, 6)
    })
    // La pizarra, llena: ocho marcas de colores en la línea
    this.reveal(POS.pizarra, (gg, k) => {
      gg.fillStyle(k(0x9aa3b5)).fillRect(POS.pizarra - 100, 240, 200, 132)
      gg.fillStyle(k(0xe9e9e4)).fillRect(POS.pizarra - 94, 246, 188, 120)
      gg.lineStyle(2, k(0x2b3140)).lineBetween(POS.pizarra - 80, 320, POS.pizarra + 80, 320)
      const marks: [number, number][] = [[7, 0x3e7d3c], [15, 0x3e7d3c], [17, 0x3e7d3c], [20, 0x8a3a3a], [30, 0x3a5a8a], [38, 0xc9952e], [38.6, 0x2b2b2b], [39.2, 0x6a7080]]
      for (const [age, c] of marks) {
        const mx = POS.pizarra - 80 + (160 * age) / 40
        gg.fillStyle(k(c)).fillCircle(mx, 320, 4)
        gg.lineStyle(1.5, k(c)).lineBetween(mx, 316, mx, 290 - (age > 37 ? (age - 37) * 14 : 0))
      }
    })
    this.label(POS.pizarra, 262, 'MI VIDA', 12, '#2b3140').setDepth(3.5).setAlpha(0.6)
    this.door(g, POS.puertaBano, 0x3a3f4d)
    this.label(POS.puertaBano, 376, 'BAÑO', 12, '#6f7889')
    // La puerta del baño, que queda prendida cuando todo lo demás se apaga
    this.puertaLuz = this.add.graphics().setDepth(41).setAlpha(0)
    this.puertaLuz.fillStyle(0x15171d).fillRect(POS.puertaBano - 55, 392, 110, 208)
    this.puertaLuz.fillStyle(0x4a5068).fillRect(POS.puertaBano - 48, 400, 96, 200)
    this.puertaLuz.fillStyle(0xfff3d6, 0.85).fillRect(POS.puertaBano - 48, 596, 96, 4)
    this.puertaLuz.fillStyle(0xc9ced8).fillCircle(POS.puertaBano - 32, 505, 5)
    this.reveal(POS.portero, (gg, k) => {
      gg.fillStyle(k(0xd9d4c4)).fillRoundedRect(POS.portero - 22, 330, 44, 70, 6)
      gg.fillStyle(k(0x2b2b2b)).fillRect(POS.portero - 14, 342, 28, 16)
      gg.fillStyle(k(0x8a8f99)).fillCircle(POS.portero, 380, 6)
    })
    this.door(g, POS.salida, 0x553a28)
  }

  // El recuerdo del hospital, otra vez: la habitación, cálida, sin tachaduras
  private drawRecuerdo() {
    const { x: X, w: Wd } = AREAS.recuerdo
    const g = this.add.graphics()
    g.fillStyle(0xe8dcc4).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0xc9b896).fillRect(X, FLOOR - 140, Wd, 140)
    g.fillStyle(0xb5a688).fillRect(X, FLOOR, Wd, 120)
    g.fillStyle(0xd9c9a8).fillRect(POS.camaHospital - 150, 500, 300, 20).fillRect(POS.camaHospital - 140, 520, 10, 80).fillRect(POS.camaHospital + 130, 520, 10, 80)
    g.fillStyle(0xf6efe0).fillRoundedRect(POS.camaHospital - 150, 480, 300, 30, 6)
    g.fillStyle(0xd9c4a0).fillRoundedRect(POS.camaHospital - 60, 476, 210, 26, 6)
    g.fillStyle(0x8a7a5a).fillRoundedRect(POS.camaHospital - 530, 520, 60, 14, 4).fillRect(POS.camaHospital - 526, 534, 6, 66).fillRect(POS.camaHospital - 480, 534, 6, 66)
    g.fillStyle(0xf2dca0).fillRect(POS.camaHospital - 360, 220, 160, 140)
    this.add.rectangle(X, 0, Wd, 720, 0xffd9a0, 0.05).setOrigin(0).setDepth(31).setBlendMode(Phaser.BlendModes.ADD)
  }

  // El baño, de verdad: azulejos, el lavatorio, el espejo, la puerta trabada. A oscuras, con la luz del pasillo abajo
  private drawBano() {
    const { x: X, w: Wd } = AREAS.bano
    const g = this.add.graphics()
    g.fillStyle(0x1f2630).fillRect(X, 0, Wd, FLOOR)
    g.lineStyle(1, 0x2a333f)
    for (let ty = 120; ty < FLOOR; ty += 40) g.lineBetween(X, ty, X + Wd, ty)
    for (let tx = X; tx < X + Wd; tx += 40) g.lineBetween(tx, 120, tx, FLOOR)
    g.fillStyle(0x161b22).fillRect(X, FLOOR, Wd, 120)
    // Bañadera a la izquierda
    g.fillStyle(0x3a4250).fillRoundedRect(X + 40, 470, 260, 130, 10)
    g.fillStyle(0x2b313c).fillRect(X + 50, 470, 240, 14)
    // Lavatorio y espejo
    g.fillStyle(0x3a4250).fillRoundedRect(X + 820, 450, 140, 30, 8).fillRect(X + 870, 480, 40, 120)
    g.fillStyle(0x2c3644).fillRect(X + 830, 250, 120, 160)
    g.lineStyle(4, 0x3a4250).strokeRect(X + 830, 250, 120, 160)
    // La puerta, trabada desde adentro, con la luz del pasillo que entra por abajo
    this.puertaReal = this.add.graphics().setDepth(2)
    this.puertaReal.fillStyle(0x10141a).fillRect(POS.puertaReal - 55, 392, 110, 208)
    this.puertaReal.fillStyle(0x323848).fillRect(POS.puertaReal - 48, 400, 96, 200)
    this.puertaReal.fillStyle(0x8a8f99).fillRect(POS.puertaReal - 40, 470, 18, 8)
    this.add.rectangle(POS.puertaReal, 598, 96, 4, 0xffe2a8, 0.8).setDepth(3)
    // El celular en el piso, prendido
    g.fillStyle(0x111111).fillRoundedRect(POS.celular - 14, 592, 28, 8, 2)
    this.celularLuz = this.add.circle(POS.celular, 594, 16, 0x8fb3ff, 0.2).setDepth(31).setBlendMode(Phaser.BlendModes.ADD)
  }

  // El pasillo de su casa, de verdad, de noche: la puerta del baño abierta y el portero
  private drawPasillo() {
    const { x: X, w: Wd } = AREAS.pasillo
    const g = this.add.graphics()
    g.fillStyle(0x323a50).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x2a3044).fillRect(X, 0, Wd, 70)
    g.fillStyle(0x242836).fillRect(X, FLOOR, Wd, 120)
    g.fillStyle(0x15171d).fillRect(POS.banoPasillo - 55, 392, 110, 208)
    g.fillStyle(0x0b0e14).fillRect(POS.banoPasillo - 48, 400, 96, 200)
    g.fillStyle(0x3a3f4d).fillRect(POS.banoPasillo + 40, 400, 16, 200)
    this.label(POS.banoPasillo, 376, 'BAÑO', 12, '#8a90a0')
    g.fillStyle(0xd9d4c4).fillRoundedRect(POS.porteroReal - 22, 330, 44, 70, 6)
    g.fillStyle(0x2b2b2b).fillRect(POS.porteroReal - 14, 342, 28, 16)
    g.fillStyle(0x8a8f99).fillCircle(POS.porteroReal, 380, 6)
    this.door(g, POS.porteroReal + 360, 0x553a28)
  }

  // La cocina, unos días después, de día: la mesa con la billetera y el teléfono
  private drawCocina() {
    const { x: X, w: Wd } = AREAS.cocina
    const g = this.add.graphics()
    g.fillStyle(0xd9d4c4).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0xb5ad98).fillRect(X, FLOOR - 120, Wd, 120)
    g.fillStyle(0x8a7a64).fillRect(X, FLOOR, Wd, 120)
    g.fillStyle(0xf2e6b8).fillRect(X + 160, 200, 200, 170)
    g.lineStyle(6, 0xf4efe2).strokeRect(X + 160, 200, 200, 170).lineBetween(X + 260, 200, X + 260, 370)
    // Una maceta en la ventana: la cocina ya tiene una planta
    g.fillStyle(0xb5562f).fillRect(X + 290, 342, 30, 26)
    g.fillStyle(0x4f9d4a).fillCircle(X + 296, 330, 10).fillCircle(X + 310, 322, 12).fillCircle(X + 318, 334, 9)
    g.fillStyle(0x6b4a2e).fillRect(POS.billetera - 150, 480, 300, 14).fillRect(POS.billetera - 140, 494, 12, 106).fillRect(POS.billetera + 128, 494, 12, 106)
    g.fillStyle(0x3a2a1e).fillRoundedRect(POS.billetera - 20, 470, 40, 12, 3)
    g.fillStyle(0xd9cfb5).fillRoundedRect(POS.telefono - 22, 360, 44, 70, 6)
    g.fillStyle(0xb5a888).fillRoundedRect(POS.telefono - 16, 366, 12, 58, 5)
  }

  // ---------- Personajes y líneas ----------

  private jorgeHead = (): Point => {
    const k = this.player.texture.key
    const t = this.player.getTopCenter()
    return { x: t.x + 6 * this.facing, y: t.y + (k === 'jorgePiso' ? 40 : k === 'jorgeSentado' ? 4 : 0) }
  }
  private think = (t: string): Line => ({ kind: 'thought', text: t, anchor: this.jorgeHead })
  private speak = (t: string): Line => ({ kind: 'speech', text: t, anchor: this.jorgeHead })
  private vela = (t: string): Line => ({ kind: 'intercom', text: t, anchor: () => ({ x: this.flame.x, y: this.flame.y - 20 }) })
  private porteroSays = (t: string, x = POS.portero): Line => ({ kind: 'intercom', text: t, anchor: () => ({ x, y: 320 }) })
  private mamaSays = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: this.mama.x - 50, y: 450 }) })

  private pista(titulo: string, texto: string) {
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
  }

  private setupSpots() {
    this.spots = [
      { area: 'depto', x: POS.pizarra, label: 'Pizarra', when: () => this.phase === 'pizarra', action: () => this.mirarPizarra() },
      { area: 'depto', x: POS.puertaBano, label: 'Baño', when: () => this.phase === 'pasillo' || this.phase === 'portero', action: async () => say(this, [this.think('Trabada desde adentro. Como siempre.')]) },
      { area: 'depto', x: POS.portero, label: 'Portero eléctrico', when: () => this.phase === 'portero', action: () => this.atenderSueno() },
      { area: 'depto', x: POS.salida, label: 'Salida', when: () => this.phase === 'pasillo' || this.phase === 'portero', action: async () => say(this, [this.think('Hoy no hay remis. No hay a dónde ir.')]) },
      { area: 'depto', x: POS.puertaBano, label: 'Baño', when: () => this.phase === 'puerta', action: () => this.puertaBano() },
      { area: 'bano', x: POS.celular, label: 'Celular', when: () => this.phase === 'piso' && !this.f.celular, action: () => this.celular() },
      { area: 'bano', x: POS.jorgePiso, label: 'Levantarme', when: () => this.phase === 'piso', action: () => this.levantarse() },
      { area: 'bano', x: POS.puertaReal, label: 'Destrabar la puerta', when: () => this.phase === 'abrir', action: () => this.abrir() },
      { area: 'pasillo', x: POS.porteroReal, label: 'Portero eléctrico', when: () => this.phase === 'atender', action: () => this.atender() },
      { area: 'cocina', x: POS.billetera, label: 'Billetera', when: () => this.phase === 'epilogo' && !this.f.billetera, action: () => this.billetera() },
      { area: 'cocina', x: POS.telefono, label: 'Teléfono', when: () => this.phase === 'llamar', action: () => this.llamarPapa() },
    ]
  }

  private updateGoal() {
    const goals: Partial<Record<Phase, string>> = {
      pizarra: 'Mirar la pizarra',
      pasillo: 'Ir al pasillo',
      portero: 'Atender el portero',
      puerta: 'Ir hasta la puerta del baño',
      piso: 'Levantarme',
      abrir: 'Abrir la puerta',
      atender: 'Atender el portero',
      epilogo: 'Buscar el papelito',
      llamar: 'Llamar a papá',
    }
    this.goal.set(goals[this.phase] ?? null)
  }

  // ---------- Secuencia: el sueño ----------

  private async intro() {
    const bg = this.add.rectangle(0, 0, 1280, 720, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(1290)
    const card = text(this, this.scale.width / 2, 340, 'Hoy', 34, '#e8e8e8').setOrigin(0.5).setScrollFactor(0).setDepth(1300)
    const card2 = text(this, this.scale.width / 2, 388, 'La última sesión', 20, '#aab2c4').setOrigin(0.5).setScrollFactor(0).setDepth(1300)
    await this.wait(2600)
    card.destroy()
    card2.destroy()
    bg.destroy()
    const lids = eyelids(this, 0)
    await this.wait(700)
    await lids.to(0.35, 1800)
    await lids.to(0.2, 800)
    await lids.to(1, 2000)
    lids.destroy()
    await say(this, [this.think('Mi casa.'), this.think('Es de noche.'), this.think('Es hoy.')])
    this.flame.setPosition(this.player.x + 70, FEET - 260)
    sfx.flame()
    this.tweens.add({ targets: this.flame, alpha: 1, y: FEET - 110, duration: 1500, ease: 'Sine.Out' })
    await this.wait(1600)
    await say(this, [this.vela('Llegamos, Jorge.'), this.vela('Es la última.')])
    this.phase = 'pizarra'
    this.updateGoal()
    const help = text(this, 24, this.scale.height - 34, controlsHelp('← → / A D caminar   ·   E examinar / usar   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa'), 16, '#d8dce6')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500 }))
  }

  private async mirarPizarra() {
    await say(this, [
      this.think('La pizarra está llena.'),
      this.think('La feria. El boletín. La fiesta. La pelea.'),
      this.think('María en el bar. El viaje. Mamá. El velorio.'),
      this.think('Falta hoy.'),
      this.vela('Hoy es lo que más te costó mirar.'),
    ])
    this.phase = 'pasillo'
    this.updateGoal()
  }

  // Al entrar al pasillo suena el portero, como el primer día
  private async timbre() {
    this.f.timbre = true
    sfx.buzz()
    this.cameras.main.shake(200, 0.002)
    this.ring = this.time.addEvent({ delay: 7000, loop: true, callback: () => { sfx.buzz(); this.cameras.main.shake(200, 0.002) } })
    await this.wait(900)
    await say(this, [this.think('El portero.'), this.think('Como el primer día.')])
    this.phase = 'portero'
    this.updateGoal()
  }

  // Primero la voz del chofer; después, la de María. Y Vela le dice la verdad
  private async atenderSueno() {
    this.ring?.remove()
    await say(this, [this.speak('¿Hola?')])
    sfx.estatica()
    await say(this, [this.porteroSays('¿Jorge? El remis para Neural. Lo espero abajo.')])
    sfx.estatica()
    await this.wait(900)
    await say(this, [this.porteroSays('…Jorge… soy María.'), this.porteroSays('Abrime, por favor.'), this.speak('¿María?'), this.think('El chofer…'), this.think('Siempre fue ella.')])
    this.pista('La voz del portero', 'La voz del portero no era la del chofer. Siempre fue María.')
    await this.wait(800)
    // La llama se acerca más que nunca
    this.tweens.add({ targets: this.flame, x: this.player.x + 60, y: FEET - 150, duration: 1200, ease: 'Sine.InOut' })
    this.flameTarget = 1.3
    await this.wait(1200)
    this.phase = 'puerta'
    await say(this, [
      this.vela('Jorge. Tengo que decirte algo.'),
      this.vela('Yo no soy un doctor.'),
      this.vela('Neural no existe. No hay máquina, ni consultorio, ni sesiones.'),
      this.vela('Soy vos, Jorge. La parte de vos que quiere seguir.'),
      this.speak('¿Y dónde estoy?'),
      this.vela('Mirá la puerta del baño.'),
    ])
    this.pista('Vela', 'Vela no es un doctor y Neural no existe. Vela es una parte mía: la que quiere seguir.')
    await this.desarmar()
    this.updateGoal()
  }

  // El sueño se desarma: se apaga todo, menos la puerta del baño
  private async desarmar() {
    sfx.disolver()
    this.cameras.main.shake(900, 0.0015)
    for (const o of this.objs) this.tweens.add({ targets: [o.gray, o.color], alpha: 0, duration: 2600, ease: 'Sine.In' })
    this.tweens.add({ targets: this.sueno, fillAlpha: 0.9, duration: 3000 })
    await this.tween({ targets: this.puertaLuz, alpha: 1, duration: 3000 })
    await say(this, [this.think('Se apaga todo.'), this.think('Menos la puerta del baño.')])
  }

  private async puertaBano() {
    await say(this, [
      this.think('Está trabada desde adentro.'),
      this.vela('Porque estás adentro, Jorge.'),
      this.vela('En el piso. Hace horas.'),
      this.vela('Le mandaste un mensaje a María. Por eso vino.'),
      this.speak('No me acuerdo de qué le puse.'),
      this.vela('Ella sí.'),
    ])
    this.pista('La puerta del baño', 'La puerta del baño está trabada desde adentro porque yo estoy ahí, en el piso. Le mandé un mensaje a María y por eso vino.')
    sfx.buzz()
    await say(this, [this.porteroSays('Jorge, por favor.', POS.puertaBano + 120)])
    await this.recuerdo()
  }

  // Con la voz de María vuelve el recuerdo del hospital, y esta vez se lee lo que le dijo su mamá
  private async recuerdo() {
    const cam = this.cameras.main
    cam.fadeOut(1400, 255, 236, 200)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.phase = 'recuerdo'
    this.goal.set(null)
    this.setArea('recuerdo')
    this.player.setTexture('jorgeSentado').setOrigin(0.5, 1).setFlipX(false).setPosition(POS.camaHospital - 500, FLOOR - 2)
    this.facing = 1
    this.flame.setPosition(POS.camaHospital - 440, FEET - 170)
    cam.stopFollow()
    cam.centerOn(AREAS.recuerdo.x + AREAS.recuerdo.w / 2, 360)
    cam.fadeIn(1400, 255, 236, 200)
    await this.wait(1600)
    await say(this, [this.think('La habitación.'), this.think('La mano de mamá.')])
    await say(this, [this.mamaSays('Hijo…'), this.mamaSays(TACHADO)])
    await this.wait(700)
    sfx.reveal()
    await say(this, [this.mamaSays('No vivas con rencor, hijo.')])
    await this.wait(900)
    await say(this, [
      this.think('Eso me dijo.'),
      this.think('No vivas con rencor.'),
      this.think('Lo mismo que esa noche, con el papelito.'),
      this.vela('Ni con tu papá, Jorge. Ni con vos.'),
    ])
    this.pista('Lo que me dijo mamá', 'Ahora me acuerdo de lo último que me dijo mamá, en el hospital: "No vivas con rencor, hijo". Lo mismo que quería la noche de la pelea.')
    await this.wait(800)
    await say(this, [this.vela('Ahora despertate, Jorge.'), this.vela('Ella te está esperando.')])
    this.flameTarget = 2.2
    this.tweens.add({ targets: this.flame, alpha: 0, duration: 2600 })
    cam.fadeOut(2600, 255, 255, 255)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    await this.wait(800)
    await this.despertarBano()
  }

  // ---------- Secuencia: la realidad ----------

  private async despertarBano() {
    const cam = this.cameras.main
    this.flame.setVisible(false)
    this.tone?.stop(1)
    this.setArea('bano')
    this.player.setTexture('jorgePiso').setOrigin(0.5, 1).setFlipX(false).setPosition(POS.jorgePiso, FLOOR + 2)
    this.facing = 1
    cam.centerOn(AREAS.bano.x + AREAS.bano.w / 2, 360)
    cam.fadeIn(10, 0, 0, 0)
    const lids = eyelids(this, 0)
    await this.wait(1200)
    sfx.buzz()
    await lids.to(0.25, 2400)
    await lids.to(0.1, 1200)
    await lids.to(1, 2800)
    lids.destroy()
    await say(this, [this.think('El baño.'), this.think('Estoy en el piso.'), this.think('La puerta la trabé yo.')])
    this.ring = this.time.addEvent({ delay: 6000, loop: true, callback: () => sfx.buzz() })
    this.tweens.add({ targets: this.celularLuz, fillAlpha: 0.08, yoyo: true, repeat: -1, duration: 1400 })
    this.phase = 'piso'
    this.updateGoal()
  }

  private async celular() {
    this.f.celular = true
    await say(this, [this.think('El celular.'), this.think('Seis llamadas perdidas de María.'), this.think('Y el mensaje que le mandé.'), this.think('No lo quiero leer de nuevo.')])
    this.pista('El celular', 'En el piso del baño, el celular: seis llamadas perdidas de María.')
  }

  // Levantarse cuesta: hay que intentarlo tres veces
  private async levantarse() {
    this.intentos++
    if (this.intentos === 1) {
      await say(this, [this.think('Me pesa todo el cuerpo.')])
      this.tweens.add({ targets: this.player, y: FLOOR - 4, duration: 300, yoyo: true })
      return
    }
    if (this.intentos === 2) {
      await say(this, [this.think('"Si te perdés, quedate quieto donde estás, que yo te encuentro."')])
      this.tweens.add({ targets: this.player, y: FLOOR - 8, duration: 300, yoyo: true })
      return
    }
    await say(this, [this.think('Me quedé quieto mucho tiempo.'), this.think('Esta vez me vinieron a buscar.')])
    sfx.step()
    this.player.setTexture('jorge0').setOrigin(0.5).setPosition(POS.jorgePiso + 20, FEET)
    await this.wait(600)
    this.phase = 'abrir'
    this.updateGoal()
  }

  private async abrir() {
    this.ring?.remove()
    sfx.unlock()
    await this.wait(500)
    sfx.door()
    const luz = this.add.rectangle(POS.puertaReal, 500, 96, 200, 0xffe2a8, 0).setDepth(3)
    this.puertaReal.setVisible(false)
    await this.tween({ targets: luz, fillAlpha: 0.85, duration: 900 })
    const cam = this.cameras.main
    cam.fadeOut(900, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.setArea('pasillo')
    this.player.setX(POS.banoPasillo + 120).setFlipX(false)
    this.facing = 1
    cam.startFollow(this.player, true, 0.08, 0.08)
    cam.centerOn(this.player.x, 360)
    cam.fadeIn(1000, 0, 0, 0)
    await this.wait(1000)
    sfx.buzz()
    this.cameras.main.shake(200, 0.002)
    this.ring = this.time.addEvent({ delay: 5000, loop: true, callback: () => { sfx.buzz(); this.cameras.main.shake(200, 0.002) } })
    this.phase = 'atender'
    this.updateGoal()
  }

  private async atender() {
    this.ring?.remove()
    this.phase = 'fin'
    this.goal.set(null)
    sfx.click()
    const maria = (t: string) => this.porteroSays(t, POS.porteroReal)
    await say(this, [
      this.speak('¿María?'),
      maria('¡Jorge! ¿Estás bien?'),
      this.speak('…No.'),
      this.speak('Pero abrí.'),
      maria('Ya subo. Quedate ahí, que ya subo.'),
    ])
    sfx.buzz()
    await this.wait(900)
    await say(this, [this.think('Le abrí.'), this.think('No sé qué le voy a decir.'), this.think('Pero le abrí.')])
    this.pista('El portero', 'Me levanté, abrí la puerta del baño y atendí el portero. Era María. Le abrí.')
    if (!state.lineaDeTiempo.includes('Hoy: el baño')) state.lineaDeTiempo.push('Hoy: el baño')
    await this.negro(3000)
    await this.wait(1200)
    await this.epilogo()
  }

  // ---------- Epílogo: el papá ----------

  private async epilogo() {
    const card = text(this, this.scale.width / 2, 360, 'Unos días después', 30, '#e8e8e8').setOrigin(0.5).setScrollFactor(0).setDepth(1300)
    await this.wait(2400)
    card.destroy()
    const cam = this.cameras.main
    this.setArea('cocina')
    this.player.setTexture('jorge0').setVisible(true).setX(AREAS.cocina.x + 300).setFlipX(false)
    this.facing = 1
    cam.startFollow(this.player, true, 0.08, 0.08)
    cam.centerOn(this.player.x, 360)
    await this.aclarar(1800)
    await say(this, [this.think('La cocina.'), this.think('María me trajo una planta.')])
    this.phase = 'epilogo'
    this.leaving = false
    this.updateGoal()
  }

  private async billetera() {
    this.f.billetera = true
    sfx.paper()
    await say(this, [this.think('La foto de mamá. Y atrás, el papelito.')])
    await showObjeto(this, 'papelito')
    await say(this, [this.think('El número de papá.'), this.think('Veinte años en la billetera.')])
    this.phase = 'llamar'
    this.updateGoal()
  }

  // Llama a su papá. Se corta en el "¿Hola?"
  private async llamarPapa() {
    this.phase = 'fin'
    this.goal.set(null)
    this.leaving = true
    sfx.click()
    for (let i = 0; i < 8; i++) {
      sfx.tecla()
      await this.wait(260)
    }
    for (let i = 0; i < 3; i++) {
      await this.wait(700)
      sfx.llamando()
      await this.wait(2200)
    }
    await say(this, [this.porteroSays('¿Hola?', POS.telefono)])
    // Corte a negro
    await this.negro(10)
    this.pista('Papá', 'Llamé a papá, con el número del papelito.')
    await this.wait(2500)
    await this.cierre()
  }

  // El cierre: el título y, por el tema del juego, a quién llamar
  private async cierre() {
    const w = this.scale.width
    const t1 = text(this, w / 2, 250, 'Terapia', 44, '#e8e8e8').setOrigin(0.5).setScrollFactor(0).setDepth(1300).setAlpha(0)
    const t2 = text(this, w / 2, 330, 'Si estás pasando por un momento difícil, no estás solo.\nHablalo con alguien.', 20, '#c9ced8', { align: 'center', fontFamily: HAND_FONT }).setOrigin(0.5).setScrollFactor(0).setDepth(1300).setAlpha(0)
    const t3 = text(this, w / 2, 420, 'En Argentina, el Centro de Asistencia al Suicida atiende en el 135 (CABA y GBA)\ny en el (011) 5275-1135 o el 0800 345 1435 (todo el país).', 16, '#9aa3b5', { align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(1300).setAlpha(0)
    for (const [i, t] of [t1, t2, t3].entries()) this.tweens.add({ targets: t, alpha: 1, delay: i * 1400, duration: 1200 })
    await this.wait(9000)
    for (const t of [t1, t2, t3]) this.tweens.add({ targets: t, alpha: 0, duration: 1000 })
    await this.wait(1200)
    this.scene.start('LevelEnd', { titulo: 'Fin', locacion: this.registry.get('solo') ? 'Sesión 9: El baño' : 'Gracias por jugar' })
  }

  // Negro por encima de la escena pero debajo de los carteles (el fundido de la cámara taparía también los carteles)
  private telon?: Phaser.GameObjects.Rectangle
  private negro(ms: number) {
    this.telon ??= this.add.rectangle(0, 0, 1280, 720, 0x000000, 0).setOrigin(0).setScrollFactor(0).setDepth(1250)
    return this.tween({ targets: this.telon, fillAlpha: 1, duration: ms })
  }
  private aclarar(ms: number) {
    return this.telon ? this.tween({ targets: this.telon, fillAlpha: 0, duration: ms }) : Promise.resolve()
  }

  // ---------- Movimiento ----------

  private setArea(area: Area) {
    this.area = area
    const r = AREAS[area]
    this.cameras.main.setBounds(r.x, 0, r.w, 720)
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
    const k = this.player.texture.key
    if (k !== 'jorgeSentado' && k !== 'jorgePiso') this.player.setTexture('jorge0')
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
    const k = 1 - Math.exp(-dt / 260)
    const enSueno = this.area === 'depto'
    if (enSueno && this.phase !== 'intro' && !this.tweens.isTweening(this.flame)) {
      const tx = this.player.x + 70 * this.facing
      const ty = FEET - 110 + Math.sin(time / 420) * 8
      this.flame.x += (tx - this.flame.x) * k
      this.flame.y += (ty - this.flame.y) * k
    }
    if (enSueno && this.phase !== 'puerta') {
      for (const o of this.objs) {
        if (o.revealed) continue
        if (Math.abs(o.x - this.flame.x) < REVEAL * this.flameScale) {
          o.lit += dt
          if (o.lit > 600) {
            o.revealed = true
            sfx.reveal()
            this.tweens.add({ targets: o.color, alpha: 1, duration: 1200 })
          }
        } else o.lit = 0
      }
    }
    this.flameScale += (this.flameTarget - this.flameScale) * (1 - Math.exp(-dt / 900))
    this.flame.setScale(this.flameScale)
    this.flameGlow.setRadius(60 + Math.sin(time / 180) * 4)

    const keys = this.keys
    const ePressed = Phaser.Input.Keyboard.JustDown(keys.E)
    const tabPressed = Phaser.Input.Keyboard.JustDown(keys.TAB)
    if (this.busy || time < this.lockUntil) return

    if (tabPressed) {
      void this.run(() => openDiary(this))
      return
    }

    // Al llegar al pasillo, suena el portero
    if (this.phase === 'pasillo' && !this.f.timbre && this.player.x > 1360) {
      void this.run(() => this.timbre())
      return
    }

    const r = AREAS[this.area]
    const quieto = this.player.texture.key === 'jorgePiso' || this.player.texture.key === 'jorgeSentado'
    const dir = (keys.LEFT.isDown || keys.A.isDown ? -1 : 0) + (keys.RIGHT.isDown || keys.D.isDown ? 1 : 0)
    if (dir !== 0 && !quieto) {
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
    } else if (!quieto) {
      this.player.setTexture('jorge0')
    }

    const spot = this.spots.find((s) => s.area === this.area && s.when() && Math.abs(this.player.x - s.x) < (quieto ? 140 : 75))
    if (spot) {
      const lit = !enSueno || !this.objs.some((o) => o.x === spot.x) || this.isRevealed(spot.x) || this.phase === 'puerta'
      this.prompt.setVisible(true).setPosition(spot.x, 300)
      this.promptLabel.setText(spot.label)
      if (ePressed) {
        if (!lit) void this.run(() => say(this, [this.think('Todavía no lo veo bien.')]))
        else void this.run(spot.action)
      }
    } else {
      this.prompt.setVisible(false)
    }
  }
}

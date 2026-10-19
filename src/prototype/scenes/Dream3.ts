import * as Phaser from 'phaser'
import { FONT, makeTextures } from '../art'
import { sfx, startFiesta, startPajaros, startRoomTone } from '../audio'
import { showPage } from '../documents'
import { addPista, state } from '../state'
import { choose, eyelids, objective, say, text, toast, type Line, type Point } from '../ui'
import { openDiary } from './diary'
import { controlsHelp } from '../touch'

// Sesión 3: la fiesta. Jorge tiene unos 17 años. Es una sesión de respiro: no está el papá y no hace frío.
//   Plaza (de tarde):   [hamacas] [árbol] [banco: María] [kiosco]
//   Club (la fiesta):   [entrada] [mesa del ponche] [pista de baile: María] [el amigo con la cámara] [salida]
//   Casa de María:      [puerta] [cocina: su mamá] [mesa] [teléfono] [living: su papá] [sillón]
// Los martes en la plaza ya no son para estudiar: fantasean con un depto propio. El sábado, en la fiesta de egresados,
// bailan y un amigo les saca la foto que hoy falta en el portarretratos. Jorge no quiere volver a su casa y María lo
// lleva a la suya. Llama a su mamá, se queda a dormir en el sillón y ahí se dan el primer beso.
// Lo que ilumina la llama de Vela se recuerda (pasa de gris a color); cerca de María, la llama crece.
// Sigue en Office (despertar de la Sesión 3). No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const FLOOR = 600
const SCALE = 0.97 // Jorge a los 17: casi de su altura de grande
const FEET = FLOOR - 70 * SCALE
const WALK = 195
const REVEAL = 260

type Area = 'plaza' | 'club' | 'casa'
const AREAS: Record<Area, { x: number; w: number }> = {
  plaza: { x: 0, w: 1800 },
  club: { x: 2400, w: 2000 },
  casa: { x: 5000, w: 2000 },
}
const POS = {
  hamacas: 420,
  arbol: 760,
  banco: 1100,
  kiosco: 1550,
  entradaClub: 2520,
  ponche: 2900,
  pista: 3450,
  amigo: 3950,
  salidaClub: 4280,
  puertaCasa: 5120,
  mamaMaria: 5480,
  mesa: 5820,
  telefono: 6100,
  papaMaria: 6460,
  sillon: 6800,
}

type Phase = 'intro' | 'plaza' | 'fiesta' | 'casa' | 'fin'
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

export class Dream3 extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private flame!: Phaser.GameObjects.Container
  private flameGlow!: Phaser.GameObjects.Arc
  private dark!: Phaser.GameObjects.Image
  private warm!: Phaser.GameObjects.Rectangle
  private maria!: Phaser.GameObjects.Image
  private mamaMaria!: Phaser.GameObjects.Image
  private papaMaria!: Phaser.GameObjects.Image
  private bailarines: Phaser.GameObjects.Image[] = []
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text
  private goal!: ReturnType<typeof objective>
  private objs: Reveal[] = []
  private spots: Spot[] = []
  private area: Area = 'plaza'
  private phase: Phase = 'intro'
  private busy = true
  private leaving = false
  private lockUntil = 0
  private facing = 1
  private walkDist = 0
  private stepDist = 0
  private flameScale = 1
  private f = { maria: false, baile: false, foto: false, mama: false, papa: false, telefono: false }
  private tone?: { stop: (fade?: number) => void }
  private birds?: { stop: (fade?: number) => void }
  private music?: ReturnType<typeof startFiesta>

  constructor() {
    super('Dream3')
  }

  create() {
    this.busy = true
    this.leaving = false
    this.phase = 'intro'
    this.facing = 1
    this.flameScale = 1
    this.objs = []
    this.bailarines = []
    this.f = { maria: false, baile: false, foto: false, mama: false, papa: false, telefono: false }
    this.music = undefined
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0b0c10')
    this.drawPlaza()
    this.drawClub()
    this.drawCasa()

    this.maria = this.add.image(POS.banco + 40, FLOOR - 70, 'maria0').setDepth(8).setFlipX(true)
    this.mamaMaria = this.add.image(POS.mamaMaria, FLOOR - 70, 'mamaMaria').setDepth(8).setFlipX(true)
    this.papaMaria = this.add.image(POS.papaMaria, FLOOR - 70, 'papaMaria').setDepth(8).setFlipX(true)
    this.player = this.add.image(POS.hamacas + 160, FEET, 'jorge0').setScale(SCALE).setDepth(10)

    this.flameGlow = this.add.circle(0, 0, 60, 0xffc56b, 0.18).setBlendMode(Phaser.BlendModes.ADD)
    this.flame = this.add.container(this.player.x + 70, FEET - 110, [this.flameGlow, this.add.image(0, 0, 'llama')]).setDepth(790).setAlpha(0)
    this.dark = this.add.image(this.player.x, FEET - 40, this.darkness()).setDepth(780).setAlpha(0)
    this.warm = this.add.rectangle(0, 0, 1280, 720, 0xffb060, 0).setOrigin(0).setScrollFactor(0).setDepth(776).setBlendMode(Phaser.BlendModes.ADD)

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
    this.setArea('plaza')
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.centerOn(this.player.x, 360)
    this.tone = startRoomTone()
    this.birds = startPajaros()
    this.events.once('shutdown', () => {
      this.tone?.stop(0.5)
      this.birds?.stop()
      this.music?.stop(0.5)
    })
    void this.run(() => this.intro())
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __dream3?: Dream3 }).__dream3 = this
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

  private drawPlaza() {
    const { x: X, w: Wd } = AREAS.plaza
    const g = this.add.graphics()
    // Cielo de la tarde, pasto y vereda: la misma plaza de la Sesión 2, dos años después
    g.fillStyle(0xf0cf9e).fillRect(X, 0, Wd, 280)
    g.fillStyle(0xe2b483).fillRect(X, 280, Wd, FLOOR - 280)
    g.fillStyle(0x8a8f99).fillRect(X, FLOOR, Wd, 30)
    g.fillStyle(0x4a4f59).fillRect(X, FLOOR + 30, Wd, 90)
    this.reveal(POS.hamacas, (gg, k) => {
      gg.fillStyle(k(0x5a8a4a)).fillRect(X, FLOOR - 6, Wd, 6)
      gg.lineStyle(8, k(0xc0392b)).lineBetween(320, FLOOR, 360, 360).lineBetween(520, FLOOR, 480, 360).lineBetween(360, 360, 480, 360)
      gg.lineStyle(2, k(0x9aa3b5)).lineBetween(385, 362, 385, 520).lineBetween(415, 362, 415, 520).lineBetween(435, 362, 435, 520).lineBetween(465, 362, 465, 520)
      gg.fillStyle(k(0x6b4a2e)).fillRect(375, 520, 50, 8).fillRect(428, 520, 46, 8)
    })
    this.reveal(POS.arbol, (gg, k) => {
      gg.fillStyle(k(0x6b4a2e)).fillRect(POS.arbol - 15, 330, 30, 270)
      gg.fillStyle(k(0x4f7a3f)).fillCircle(POS.arbol, 300, 120).fillCircle(POS.arbol - 70, 350, 70).fillCircle(POS.arbol + 70, 340, 75)
      // Un corazón con iniciales en el tronco
      gg.fillStyle(k(0x3a2a1f)).fillCircle(POS.arbol - 5, 452, 5).fillCircle(POS.arbol + 5, 452, 5).fillTriangle(POS.arbol - 10, 454, POS.arbol + 10, 454, POS.arbol, 466)
    })
    this.reveal(POS.banco, (gg, k) => {
      gg.fillStyle(k(0x4f9d4a)).fillRect(POS.banco - 90, 540, 180, 10).fillRect(POS.banco - 90, 508, 180, 8)
      gg.fillStyle(k(0x3a3f4d)).fillRect(POS.banco - 84, 550, 8, 50).fillRect(POS.banco + 76, 550, 8, 50)
      // El cuaderno, cerrado, en el banco
      gg.fillStyle(k(0x3a5a8a)).fillRect(POS.banco - 60, 532, 34, 8)
    })
    this.reveal(POS.kiosco, (gg, k) => {
      gg.fillStyle(k(0xd9c9a8)).fillRect(POS.kiosco - 110, 360, 220, 240)
      gg.fillStyle(k(0x2f6fa0)).fillRect(POS.kiosco - 120, 340, 240, 30)
      gg.fillStyle(k(0x8fb3d9)).fillRect(POS.kiosco - 80, 410, 160, 90)
      gg.fillStyle(k(0xe0b04a)).fillRect(POS.kiosco - 70, 470, 40, 20).fillRect(POS.kiosco - 20, 470, 40, 20)
    })
    this.label(POS.kiosco, 355, 'KIOSCO', 18, '#f1efe8').setDepth(3)
  }

  private drawClub() {
    const { x: X, w: Wd } = AREAS.club
    const g = this.add.graphics()
    // Salón del club del barrio: paredes verdes, piso de parquet, guirnaldas
    g.fillStyle(0x2f4a3f).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x263d33).fillRect(X, 0, Wd, 80)
    g.fillStyle(0x5a3e26).fillRect(X, FLOOR, Wd, 120)
    for (let lx = X; lx < X + Wd; lx += 40) g.fillStyle(lx % 80 === 0 ? 0x664a30 : 0x5a3e26).fillRect(lx, FLOOR, 40, 120)
    this.label(POS.ponche, 140, 'CLUB SOCIAL Y DEPORTIVO', 26, '#7f9a86').setFontStyle('bold')
    this.label(POS.ponche, 180, '¡FELICIDADES, EGRESADOS!', 22, '#c9b46a')
    // Guirnaldas de luces de colores (se ven aunque esté oscuro)
    const colores = [0xe0b04a, 0xd9534f, 0x5aa7c8, 0x9ee07a]
    for (let i = 0; i < 50; i++) {
      const lx = X + 20 + i * 40
      const ly = 240 + Math.sin(i * 0.6) * 20
      this.add.circle(lx, ly, 5, colores[i % 4]).setDepth(786)
      this.add.circle(lx, ly, 16, colores[i % 4], 0.18).setDepth(786).setBlendMode(Phaser.BlendModes.ADD)
    }
    // Entrada y salida
    for (const dx of [POS.entradaClub, POS.salidaClub]) {
      g.fillStyle(0x15171d).fillRect(dx - 55, 392, 110, 208)
      g.fillStyle(0x3a2f24).fillRect(dx - 48, 400, 96, 200)
    }
    this.reveal(POS.ponche, (gg, k) => {
      gg.fillStyle(k(0xf1efe8)).fillRect(POS.ponche - 120, 500, 240, 100)
      gg.fillStyle(k(0xd9534f)).fillRect(POS.ponche - 120, 500, 240, 8)
      gg.fillStyle(k(0xc0392b)).fillEllipse(POS.ponche, 486, 70, 30)
      gg.fillStyle(k(0xe0e4ea)).fillRect(POS.ponche - 90, 478, 14, 20).fillRect(POS.ponche + 70, 478, 14, 20)
    })
    this.reveal(POS.pista, (gg, k) => {
      gg.fillStyle(k(0x3a2a40)).fillRect(POS.pista - 300, FLOOR - 4, 600, 4)
      // Bola de espejos
      gg.lineStyle(2, k(0x9aa3b5)).lineBetween(POS.pista, 80, POS.pista, 150)
      gg.fillStyle(k(0xd9dde5)).fillCircle(POS.pista, 172, 24)
      gg.fillStyle(k(0x9aa3b5)).fillRect(POS.pista - 14, 160, 8, 8).fillRect(POS.pista + 4, 176, 8, 8)
    })
    // Gente bailando: sin cara, como siempre en los sueños
    for (const sx of [3150, 3280, 3640, 3760, 2700]) {
      const b = this.add.image(sx, FLOOR - 75, 'sombra').setAlpha(0.85).setDepth(7).setFlipX(sx % 2 === 0)
      this.bailarines.push(b)
      this.tweens.add({ targets: b, y: b.y - 6, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: (sx % 7) * 60 })
    }
    // El amigo con la cámara descartable
    this.add.image(POS.amigo, FLOOR - 75, 'sombra').setAlpha(0.9).setDepth(7).setFlipX(true)
    g.fillStyle(0x2f6fa0).fillRect(POS.amigo - 30, 470, 22, 14)
    g.fillStyle(0xf2e35a).fillRect(POS.amigo - 28, 472, 6, 4)
    g.setDepth(1)
  }

  private drawCasa() {
    const { x: X, w: Wd } = AREAS.casa
    const g = this.add.graphics()
    // Casa de María, de noche: cálida, luz amarilla, empapelado claro
    g.fillStyle(0x6b5a46).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x5c4d3c).fillRect(X, 0, Wd, 70)
    g.lineStyle(1, 0x7a6852)
    for (let lx = X + 20; lx < X + Wd; lx += 40) g.lineBetween(lx, 70, lx, FLOOR - 120)
    g.fillStyle(0x56483a).fillRect(X, FLOOR - 120, Wd, 120)
    g.fillStyle(0x4a3628).fillRect(X, FLOOR, Wd, 120)
    for (const wx of [5320, 6260]) g.fillStyle(0x4c3f32).fillRect(wx - 10, 70, 20, FLOOR - 70)
    // Lámparas colgantes
    for (const lx of [5600, 6600]) {
      g.lineStyle(2, 0x2a2620).lineBetween(lx, 70, lx, 170)
      g.fillStyle(0xe0b04a).fillTriangle(lx - 30, 200, lx + 30, 200, lx, 170)
      this.add.circle(lx, 220, 160, 0xffd28a, 0.12).setDepth(781).setBlendMode(Phaser.BlendModes.ADD)
    }
    // Puerta de calle
    g.fillStyle(0x15171d).fillRect(POS.puertaCasa - 55, 392, 110, 208)
    g.fillStyle(0x6b4a2e).fillRect(POS.puertaCasa - 48, 400, 96, 200)
    g.fillStyle(0xc9b46a).fillCircle(POS.puertaCasa + 32, 505, 5)
    this.reveal(POS.mamaMaria, (gg, k) => {
      // Cocina: mesada, alacena, la olla en el fuego
      gg.fillStyle(k(0xf1efe8)).fillRect(5360, 500, 280, 100)
      gg.fillStyle(k(0x9aa3b5)).fillRect(5354, 492, 292, 10)
      gg.fillStyle(k(0xd9c9a8)).fillRect(5360, 280, 280, 90)
      gg.fillStyle(k(0x3a3f4d)).fillRoundedRect(5560, 456, 60, 36, 6)
      gg.fillStyle(k(0xb5562f)).fillCircle(5420, 480, 12)
    })
    this.reveal(POS.mesa, (gg, k) => {
      gg.fillStyle(k(0x8a6a4a)).fillRect(POS.mesa - 150, 480, 300, 14)
      gg.fillStyle(k(0x6b4a2e)).fillRect(POS.mesa - 140, 494, 12, 106).fillRect(POS.mesa + 128, 494, 12, 106)
      gg.fillStyle(k(0xd9534f)).fillRect(POS.mesa - 150, 472, 300, 8)
      gg.fillStyle(k(0xf1efe8)).fillEllipse(POS.mesa - 70, 468, 50, 10).fillEllipse(POS.mesa + 10, 468, 50, 10).fillEllipse(POS.mesa + 90, 468, 50, 10)
      // Dibujos y fotos de la familia en la pared
      gg.fillStyle(k(0xf4efe2)).fillRect(POS.mesa - 90, 300, 60, 46).fillRect(POS.mesa + 10, 290, 50, 60)
      gg.fillStyle(k(0x8fa7b8)).fillRect(POS.mesa - 84, 306, 48, 34)
      gg.fillStyle(k(0x9ee07a)).fillRect(POS.mesa + 16, 300, 38, 40)
    })
    this.reveal(POS.telefono, (gg, k) => {
      gg.fillStyle(k(0xe8e2cf)).fillRoundedRect(POS.telefono - 16, 380, 32, 50, 6)
      gg.fillStyle(k(0xc0392b)).fillRoundedRect(POS.telefono - 20, 372, 40, 14, 6)
      gg.lineStyle(2, k(0x2b2b2b)).beginPath().arc(POS.telefono + 10, 450, 18, -1.2, 1.4).strokePath()
    })
    this.reveal(POS.papaMaria, (gg, k) => {
      // Living: sillón individual y la tele
      gg.fillStyle(k(0x7a4a3a)).fillRoundedRect(POS.papaMaria - 50, 500, 110, 100, 14)
      gg.fillStyle(k(0x6a3e30)).fillRoundedRect(POS.papaMaria + 30, 440, 30, 160, 12)
      gg.fillStyle(k(0x4a3628)).fillRect(POS.papaMaria - 230, 520, 120, 80)
      gg.fillStyle(k(0x2b2b2b)).fillRoundedRect(POS.papaMaria - 220, 430, 100, 90, 10)
      gg.fillStyle(k(0x8fb8d0)).fillRoundedRect(POS.papaMaria - 210, 440, 70, 66, 8)
    })
    this.reveal(POS.sillon, (gg, k) => {
      gg.fillStyle(k(0x4f6f9a)).fillRoundedRect(POS.sillon - 130, 500, 260, 100, 16)
      gg.fillStyle(k(0x3f5a80)).fillRoundedRect(POS.sillon - 130, 450, 260, 60, 16)
      gg.fillStyle(k(0xe8e2cf)).fillRoundedRect(POS.sillon - 120, 486, 60, 22, 8)
      gg.fillStyle(k(0x9a6a8a)).fillRoundedRect(POS.sillon - 50, 494, 170, 18, 6)
    })
  }

  // ---------- Personajes y líneas ----------

  private jorgeHead = (): Point => {
    const t = this.player.getTopCenter()
    return { x: t.x + 6 * this.facing, y: t.y }
  }
  private think = (t: string): Line => ({ kind: 'thought', text: t, anchor: this.jorgeHead })
  private speak = (t: string): Line => ({ kind: 'speech', text: t, anchor: this.jorgeHead })
  private vela = (t: string): Line => ({ kind: 'intercom', text: t, anchor: () => ({ x: this.flame.x, y: this.flame.y - 20 }) })
  private at = (x: number, y: number, t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x, y }) })
  private says = (img: Phaser.GameObjects.Image) => (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: img.x, y: img.getTopCenter().y }) })
  private mariaSays = (t: string) => this.says(this.maria)(t)

  private pista(titulo: string, texto: string) {
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
  }

  private setupSpots() {
    const plaza = () => this.phase === 'plaza'
    const fiesta = () => this.phase === 'fiesta'
    const casa = () => this.phase === 'casa'
    this.spots = [
      { area: 'plaza', x: POS.hamacas, label: 'Hamacas', when: plaza, action: () => say(this, [this.think('Acá la conocí.'), this.think('Hace dos años. Parece mucho más.')]) },
      { area: 'plaza', x: POS.arbol, label: 'Árbol', when: plaza, action: () => say(this, [this.think('Un corazón en el tronco.'), this.think('No es nuestro. Todavía.')]) },
      { area: 'plaza', x: POS.banco, label: 'María', when: plaza, action: () => this.plazaMaria() },
      { area: 'plaza', x: POS.kiosco, label: 'Kiosco', when: plaza, action: () => say(this, [this.think('Los alfajores de siempre.'), this.think('Ella siempre parte uno a la mitad.')]) },
      { area: 'club', x: POS.ponche, label: 'Ponche', when: fiesta, action: () => say(this, [this.think('Ponche.'), this.think('Seguro alguien le puso algo.')]) },
      { area: 'club', x: POS.pista, label: 'María', when: () => fiesta() && !this.f.baile, action: () => this.bailar() },
      { area: 'club', x: POS.amigo, label: 'Amigo', when: () => fiesta() && !this.f.baile, action: () => say(this, [this.at(POS.amigo, 450, '¡Jorge! ¿Y María?'), this.at(POS.amigo, 450, 'Después les saco una, que me quedan fotos.')]) },
      { area: 'club', x: POS.salidaClub, label: 'Salir', when: fiesta, action: () => this.salirClub() },
      { area: 'casa', x: POS.mamaMaria, label: 'Mamá de María', when: casa, action: () => this.hablarMama() },
      { area: 'casa', x: POS.mesa, label: 'Mesa', when: casa, action: () => say(this, [this.think('Fotos de vacaciones. Dibujos de cuando María era chica.'), this.think('En esta casa nadie levanta la voz.')]) },
      { area: 'casa', x: POS.telefono, label: 'Teléfono', when: casa, action: () => this.telefono() },
      { area: 'casa', x: POS.papaMaria, label: 'Papá de María', when: casa, action: () => this.hablarPapa() },
      { area: 'casa', x: POS.sillon, label: 'Sillón', when: casa, action: () => this.sillon() },
      { area: 'casa', x: POS.puertaCasa, label: 'Puerta', when: casa, action: () => say(this, [this.think('A casa no. Hoy no.')]) },
    ]
  }

  private updateGoal() {
    if (this.phase === 'plaza') this.goal.set('Ir a ver a María')
    else if (this.phase === 'fiesta') this.goal.set(this.f.foto ? 'Irme de la fiesta con María' : 'Encontrar a María')
    else if (this.phase === 'casa') this.goal.set(!this.f.telefono ? (this.f.papa ? 'Llamar a mamá' : 'Saludar a la familia de María') : 'Ir a dormir al sillón')
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
    await say(this, [this.think('La plaza.'), this.think('Es martes.'), this.think('Soy más grande. Diecisiete.')])
    this.flame.setPosition(this.player.x + 70, FEET - 260)
    sfx.flame()
    this.tweens.add({ targets: this.flame, alpha: 1, y: FEET - 110, duration: 1500, ease: 'Sine.Out' })
    await this.wait(1600)
    await say(this, [this.vela('Hola, Jorge.'), this.vela('Hoy no hay nada que buscar. Mirá alrededor.')])
    this.phase = 'plaza'
    this.updateGoal()
    const help = text(this, 24, this.scale.height - 34, controlsHelp('← → / A D caminar   ·   E examinar / hablar   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa'), 16, '#aab2c4')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500 }))
  }

  // Los martes en la plaza ya no son para estudiar: fantasean con un depto propio
  private async plazaMaria() {
    this.f.maria = true
    this.maria.setFlipX(this.player.x < this.maria.x)
    await say(this, [
      this.mariaSays('Llegás tarde.'),
      this.mariaSays('Y ya no tenemos nada que estudiar, ¿sabés? Aprobaste.'),
      this.speak('Ya sé. Vengo igual.'),
      this.think('Los martes ya no son para matemática.'),
      this.mariaSays('Cuando termine el colegio me quiero ir de mi casa.'),
      this.mariaSays('Un depto chiquito. Con un balcón lleno de plantas.'),
    ])
    const i = await choose(this, ['"¿Y yo?"', '"Yo también me quiero ir."'], { x: 640, y: 640 })
    await say(this, [
      i === 0 ? this.speak('¿Y yo?') : this.speak('Yo también me quiero ir.'),
      this.mariaSays(i === 0 ? 'Vos traés la heladera.' : 'Entonces vos traés la heladera.'),
      this.think('Algún día.'),
      this.mariaSays('El sábado es la fiesta de egresados. ¿Vas a ir?'),
    ])
    const j = await choose(this, ['"Sí."', '"No sé bailar."'], { x: 640, y: 640 })
    await say(this, j === 0
      ? [this.speak('Sí.'), this.mariaSays('Más te vale.')]
      : [this.speak('No sé bailar.'), this.mariaSays('Te enseño. No es tan difícil.')])
    await say(this, [this.mariaSays('Pasame a buscar a las diez.')])
    this.pista('Los martes', 'Los martes con María ya no estudiamos: hablamos. Ella quiere un depto chiquito con un balcón lleno de plantas. Algún día.')
    await this.wait(500)
    await say(this, [this.vela('Vamos al sábado, Jorge.')])
    await this.alSabado()
  }

  // El recuerdo salta al sábado a la noche: la fiesta
  private async alSabado() {
    const cam = this.cameras.main
    cam.fadeOut(1400, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.birds?.stop()
    this.birds = undefined
    this.phase = 'fiesta'
    this.maria.setTexture('mariaFiesta0').setPosition(POS.pista + 60, FLOOR - 70).setFlipX(true)
    this.player.setX(POS.entradaClub + 90)
    this.flame.setPosition(this.player.x + 70, FEET - 110)
    this.setArea('club')
    this.dark.setAlpha(0.55)
    cam.centerOn(this.player.x, 360)
    this.music = startFiesta()
    this.music.setVolume(0.6)
    cam.fadeIn(1400, 0, 0, 0)
    await this.wait(1400)
    await say(this, [this.think('El club del barrio.'), this.think('La fiesta de egresados.')])
    this.updateGoal()
  }

  // Bailan. El jugador marca el paso con ← → (no se puede hacer mal)
  private async bailar() {
    this.f.baile = true
    this.goal.set(null)
    this.maria.setFlipX(true)
    await say(this, [this.mariaSays('Llegaste.'), this.mariaSays('¿Bailamos?'), this.speak('Te avisé que no sé.'), this.mariaSays('Seguime a mí.')])
    this.player.setX(POS.pista - 10)
    this.facing = 1
    this.player.setFlipX(false)
    this.music?.setVolume(1)
    const hint = text(this, this.scale.width / 2, this.scale.height - 90, '← →  bailar', 24, '#f1efe8', { stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(960)
    this.tweens.add({ targets: hint, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 })
    await new Promise<void>((resolve) => {
      let n = 0
      let last = 0
      const kb = this.input.keyboard!
      const onDown = (ev: KeyboardEvent) => {
        const d = ['ArrowLeft', 'KeyA'].includes(ev.code) ? -1 : ['ArrowRight', 'KeyD'].includes(ev.code) ? 1 : 0
        if (!d || d === last) return
        last = d
        n++
        // Un paso para cada lado: Jorge y María se mueven juntos
        this.tweens.add({ targets: [this.player, this.maria], x: `+=${d * 14}`, duration: 260, ease: 'Sine.InOut' })
        this.tweens.add({ targets: this.player, angle: d * 3, duration: 260, yoyo: true })
        this.flameScale = Math.min(1.8, this.flameScale + 0.08)
        sfx.step()
        if (n >= 10) {
          kb.off('keydown', onDown)
          resolve()
        }
      }
      kb.on('keydown', onDown)
    })
    hint.destroy()
    await say(this, [this.think('No sé bailar.'), this.think('Pero a ella no le importa.'), this.mariaSays('¿Ves? No era tan difícil.')])
    await this.foto()
  }

  // Un amigo les saca la foto: la que hoy falta en el portarretratos
  private async foto() {
    const amigo = (t: string) => this.at(POS.pista + 220, 450, t)
    await say(this, [amigo('¡Eh, ustedes dos! ¡Miren acá!')])
    this.maria.setFlipX(false)
    sfx.flash()
    await this.wait(300)
    const flash = this.add.rectangle(0, 0, 1280, 720, 0xffffff, 0.95).setOrigin(0).setScrollFactor(0).setDepth(1100)
    await this.tween({ targets: flash, alpha: 0, duration: 900 })
    flash.destroy()
    this.f.foto = true
    await showPage(this, 'fotoFiesta', 0)
    await say(this, [
      this.think('La foto.'),
      this.think('Esta foto la conozco.'),
      this.vela('Qué lindo recuerdo, Jorge.'),
    ])
    this.pista('La foto', 'En la fiesta de egresados, un amigo nos sacó una foto a María y a mí. Esa foto la conozco.')
    await this.wait(600)
    // Se prenden las luces: se termina la fiesta
    this.music?.stop(3)
    this.music = undefined
    this.tweens.add({ targets: this.dark, alpha: 0.2, duration: 2000 })
    for (const b of this.bailarines) this.tweens.add({ targets: b, alpha: 0, duration: 2000 })
    await this.wait(1500)
    await say(this, [
      this.think('Prendieron las luces.'),
      this.mariaSays('¿Te acompaño hasta tu casa?'),
      this.speak('No quiero volver todavía.'),
      this.think('A casa no. Hoy no.'),
      this.mariaSays('Vení a casa. Mi mamá siempre cocina de más.'),
    ])
    this.maria.setTexture('mariaFiesta0')
    this.updateGoal()
  }

  private async salirClub() {
    if (!this.f.foto) {
      await say(this, [this.think('Todavía no la encontré.')])
      return
    }
    const cam = this.cameras.main
    sfx.door()
    cam.fadeOut(1400, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.phase = 'casa'
    this.player.setX(POS.puertaCasa + 90)
    this.maria.setPosition(POS.mesa + 60, FLOOR - 70).setFlipX(true)
    this.flame.setPosition(this.player.x + 70, FEET - 110)
    this.setArea('casa')
    this.dark.setAlpha(0.15)
    this.warm.setFillStyle(0xffb060, 0.06)
    cam.centerOn(this.player.x, 360)
    sfx.door()
    cam.fadeIn(1400, 0, 0, 0)
    await this.wait(1400)
    await say(this, [this.think('La casa de María.'), this.think('Huele a comida. Está la tele prendida, pero bajita.')])
    this.updateGoal()
  }

  private async hablarMama() {
    const mama = this.says(this.mamaMaria)
    if (this.f.mama) {
      await say(this, [mama('Comé tranquilo, querido. Hay más.')])
      return
    }
    this.f.mama = true
    await say(this, [
      mama('¡Jorge! Pasá, querido.'),
      mama('¿Comiste algo? Sentate, que hay milanesas.'),
      this.speak('Gracias, señora.'),
      mama('Nada de señora, ¿eh? Acá sos de la casa.'),
      this.think('Me sirve el plato sin preguntar nada más.'),
    ])
    this.pista('La mamá de María', 'La mamá de María me recibió como si fuera de la casa. Me sirvió milanesas sin preguntar nada.')
    this.updateGoal()
  }

  private async hablarPapa() {
    const papa = this.says(this.papaMaria)
    if (this.f.papa) {
      await say(this, [papa(this.f.telefono ? 'Bien. Ahora a dormir, que es tarde.' : 'Llamá a tu casa, dale.')])
      return
    }
    this.f.papa = true
    await say(this, [
      papa('¿Vos sos el de matemática?'),
      papa('María dice que ahora sabés más que ella.'),
      this.speak('No tanto.'),
      papa('Es tarde. Quedate a dormir, te armamos el sillón.'),
      papa('Pero llamá a tu casa, que tu mamá se va a preocupar.'),
      this.think('Mi papá nunca me habló así.'),
    ])
    this.updateGoal()
  }

  // Jorge llama a su mamá desde el teléfono de la casa de María
  private async telefono() {
    if (!this.f.papa) {
      await say(this, [this.think('El teléfono.'), this.think('Primero saludo.')])
      return
    }
    if (this.f.telefono) {
      await say(this, [this.think('Ya la llamé.')])
      return
    }
    this.f.telefono = true
    sfx.telefono()
    await this.wait(1200)
    const mama = (t: string): Line => ({ kind: 'intercom', text: t, anchor: () => ({ x: POS.telefono, y: 360 }) })
    await say(this, [
      mama('¿Hola?'),
      this.speak('Ma, soy yo. Me quedo a dormir en lo de María.'),
      mama('¿Estás bien, hijo?'),
      this.speak('Sí, ma. Estoy bien.'),
      mama('Me alegro. Me alegro mucho.'),
      this.think('Hacía mucho que no le decía eso.'),
    ])
    this.pista('Mamá, por teléfono', 'Llamé a mamá desde la casa de María. Le dije que estaba bien. Hacía mucho que no se lo decía.')
    this.updateGoal()
  }

  // En el sillón: María lo saluda y se dan el primer beso
  private async sillon() {
    if (!this.f.telefono) {
      await say(this, [this.think(this.f.papa ? 'Primero llamo a mamá.' : 'Primero saludo.')])
      return
    }
    this.phase = 'fin'
    this.leaving = true
    this.goal.set(null)
    this.player.setX(POS.sillon - 60).setFlipX(false)
    this.facing = 1
    this.mamaMaria.setVisible(false)
    this.papaMaria.setVisible(false)
    this.cameras.main.stopFollow()
    this.cameras.main.pan(POS.sillon, 360, 1200, 'Sine.easeInOut')
    await this.tween({ targets: this.maria, x: POS.sillon + 20, duration: 1800 })
    this.maria.setTexture('mariaFiesta0').setFlipX(true)
    await say(this, [this.mariaSays('Mi mamá te dejó una frazada.'), this.mariaSays('Buenas noches, Jorge.')])
    const i = await choose(this, ['"Gracias por hoy."', '"María…"'], { x: 640, y: 640 })
    await say(this, [i === 0 ? this.speak('Gracias por hoy.') : this.speak('María…')])
    // El primer beso: se acercan, todo se llena de luz cálida
    await this.tween({ targets: this.maria, x: POS.sillon - 22, duration: 900, ease: 'Sine.InOut' })
    sfx.flame()
    this.tweens.add({ targets: this.warm, fillAlpha: 0.2, duration: 2200 })
    this.tweens.add({ targets: this.dark, alpha: 0, duration: 2200 })
    this.flameScale = 2
    await this.wait(2600)
    await say(this, [this.think('El primer beso.')])
    await this.tween({ targets: this.maria, x: POS.sillon + 120, alpha: 0, duration: 1600 })
    this.pista('El primer beso', 'Esa noche, en la casa de María, nos dimos el primer beso. Dormí en el sillón. Dormí tranquilo.')
    // Jorge se acuesta en el sillón
    this.player.setTexture('jorge0').setAngle(-90).setPosition(POS.sillon - 10, 476)
    await this.wait(900)
    await say(this, [this.think('Esa noche dormí tranquilo.'), this.vela('Quedate un rato más así, Jorge.'), this.vela('Después volvemos.')])
    if (!state.lineaDeTiempo.includes('Adolescencia: la fiesta')) state.lineaDeTiempo.push('Adolescencia: la fiesta')
    const lids = eyelids(this, 1)
    await lids.to(0.4, 2200)
    await lids.to(0.6, 1000)
    await lids.to(0, 2400)
    this.tone?.stop(2)
    await this.wait(1500)
    this.scene.start('Office', { despertar: true, sesion: 3 })
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
    if (this.player.angle === 0) this.player.setTexture('jorge0')
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
    // La llama sigue a Jorge. Cerca de María crece; hoy no hay frío
    if (this.phase !== 'intro' && this.phase !== 'fin') {
      const tx = this.player.x + 70 * this.facing
      const ty = FEET - 110 + Math.sin(time / 420) * 8
      const k = 1 - Math.exp(-dt / 260)
      this.flame.x += (tx - this.flame.x) * k
      if (!this.tweens.isTweening(this.flame)) this.flame.y += (ty - this.flame.y) * k
      const calor = this.maria.visible ? Math.max(0, 1 - Math.abs(this.maria.x - this.player.x) / 420) : 0
      const target = Phaser.Math.Clamp(1.1 + calor * 0.6 + (this.f.baile ? 0.2 : 0), 0.8, 1.8)
      this.flameScale += (target - this.flameScale) * k
      // Lo que la luz toca un rato, se recuerda
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
      const people = ['María', 'Amigo', 'Mamá de María', 'Papá de María', 'Salir', 'Puerta']
      const lit = people.includes(spot.label) || !this.objs.some((o) => o.x === spot.x) || this.isRevealed(spot.x)
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

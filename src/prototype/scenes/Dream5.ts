import * as Phaser from 'phaser'
import { FONT, makeTextures } from '../art'
import { sfx, startCity, startLluvia, startRoomTone } from '../audio'
import { showPage } from '../documents'
import { addPista, state } from '../state'
import { controlsHelp } from '../touch'
import { choose, eyelids, objective, say, text, toast, type Line, type Point } from '../ui'
import { openDiary } from './diary'

// Sesión 5: el reencuentro. Jorge tiene unos 30 años.
//   Esquina (al atardecer):  [kiosco] … [esquina: María] … [la vuelta: el bar]
//   Bar:                     [puerta] [barra: el mozo] [mesa junto a la ventana]
//   Calle (de noche, llueve): [salida del bar] [toldo] [toldo] [parada del colectivo]
//   Recuerdos (cinemáticas):  [la plaza, 15] [la fiesta, 17] [el sillón, 17] [el departamento, 20]
// Jorge se cruza a María de casualidad, siguen la charla en un bar y se hace tarde. Llueve: la acompaña a la parada.
// Con la lluvia la llama de Vela se achica; bajo los toldos y bajo el paraguas de María, crece. En la parada se acuerdan
// de cuando eran chicos (cinemáticas en sepia) y, de vuelta en el presente, se besan casi por inercia. Pero aparece
// el recuerdo de cuando ella se fue a Córdoba: Jorge no le cree, se aparta y se va bajo la lluvia.
// Sigue en Office (despertar de la Sesión 5). No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const FLOOR = 600
const FEET = FLOOR - 70
const WALK = 200
const REVEAL = 250

type Area = 'esquina' | 'bar' | 'lluvia' | 'recuerdo'
const AREAS: Record<Area, { x: number; w: number }> = {
  esquina: { x: 0, w: 2200 },
  bar: { x: 2800, w: 1800 },
  lluvia: { x: 5200, w: 2700 },
  recuerdo: { x: 8400, w: 5200 },
}
const POS = {
  inicio: 260,
  kiosco: 700,
  esquina: 1450,
  aLaVuelta: 2080,
  puertaBar: 2920,
  barra: 3320,
  mesa: 3980,
  salidaBar: 5320,
  toldos: [5850, 6650],
  parada: 7420,
  fin: 7780,
  recuerdos: [9050, 10350, 11650, 12950],
}

type Phase = 'intro' | 'esquina' | 'aBar' | 'bar' | 'charla' | 'salir' | 'lluvia' | 'parada' | 'irse' | 'fin'
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
// Los recuerdos de cuando eran chicos, en sepia
const sepia: Paint = (c) => {
  const r = (c >> 16) & 0xff
  const g = (c >> 8) & 0xff
  const b = c & 0xff
  const l = 0.3 * r + 0.59 * g + 0.11 * b
  return (Math.min(255, Math.round(l * 1.08 + 30)) << 16) | (Math.round(l * 0.92 + 18) << 8) | Math.round(l * 0.7 + 8)
}

export class Dream5 extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private flame!: Phaser.GameObjects.Container
  private flameGlow!: Phaser.GameObjects.Arc
  private dark!: Phaser.GameObjects.Image
  private warm!: Phaser.GameObjects.Rectangle
  private maria!: Phaser.GameObjects.Image
  private paraguas!: Phaser.GameObjects.Image
  private mozo!: Phaser.GameObjects.Image
  private drops: Phaser.GameObjects.Rectangle[] = []
  private ventana!: Phaser.GameObjects.Graphics
  private bars: Phaser.GameObjects.Rectangle[] = []
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text
  private goal!: ReturnType<typeof objective>
  private objs: Reveal[] = []
  private spots: Spot[] = []
  private area: Area = 'esquina'
  private phase: Phase = 'intro'
  private busy = true
  private leaving = false
  private lockUntil = 0
  private facing = 1
  private walkDist = 0
  private stepDist = 0
  private flameScale = 1
  private raining = false
  private rainInside = false
  private velaAvisoLluvia = false
  private mariaWalk = 0
  private tone?: { stop: (fade?: number) => void }
  private city?: { stop: (fade?: number) => void }
  private lluvia?: ReturnType<typeof startLluvia>

  constructor() {
    super('Dream5')
  }

  create() {
    this.busy = true
    this.leaving = false
    this.phase = 'intro'
    this.facing = 1
    this.flameScale = 1
    this.objs = []
    this.drops = []
    this.bars = []
    this.raining = this.rainInside = this.velaAvisoLluvia = false
    this.lluvia = undefined
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0b0c10')
    this.drawEsquina()
    this.drawBar()
    this.drawLluvia()
    this.drawRecuerdos()

    this.maria = this.add.image(POS.aLaVuelta, FLOOR - 70, 'maria30_0').setDepth(8).setFlipX(true).setVisible(false)
    this.paraguas = this.add.image(0, 0, 'paraguas').setDepth(9).setVisible(false)
    this.mozo = this.add.image(POS.barra, FLOOR - 75, 'sombra').setDepth(6).setFlipX(true).setTint(0x8a8070)
    this.player = this.add.image(POS.inicio, FEET, 'jorge0').setDepth(10)

    this.flameGlow = this.add.circle(0, 0, 60, 0xffc56b, 0.18).setBlendMode(Phaser.BlendModes.ADD)
    this.flame = this.add.container(this.player.x + 70, FEET - 110, [this.flameGlow, this.add.image(0, 0, 'llama')]).setDepth(790).setAlpha(0)
    this.dark = this.add.image(this.player.x, FEET - 40, this.darkness()).setDepth(780).setAlpha(0)
    this.warm = this.add.rectangle(0, 0, 1280, 720, 0xffb060, 0).setOrigin(0).setScrollFactor(0).setDepth(776).setBlendMode(Phaser.BlendModes.ADD)
    // Gotas de lluvia: rayitas que caen, por encima de todo menos la interfaz
    for (let i = 0; i < 150; i++) {
      this.drops.push(this.add.rectangle(Math.random() * 1280, Math.random() * 720, 2, 14 + Math.random() * 10, 0xaec4dd, 0.45).setScrollFactor(0).setDepth(786).setVisible(false))
    }

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
    this.setArea('esquina')
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.centerOn(this.player.x, 360)
    this.tone = startRoomTone()
    this.city = startCity()
    this.events.once('shutdown', () => {
      this.tone?.stop(0.5)
      this.city?.stop(0.5)
      this.lluvia?.stop(0.5)
    })
    void this.run(() => this.intro())
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __dream5?: Dream5 }).__dream5 = this
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

  // Una esquina del centro, al atardecer
  private drawEsquina() {
    const { x: X, w: Wd } = AREAS.esquina
    const g = this.add.graphics()
    g.fillGradientStyle(0xe8a87a, 0xe8a87a, 0x6a5a8a, 0x6a5a8a, 1).fillRect(X, 0, Wd, 330)
    g.fillStyle(0x4a4658).fillRect(X, 330, Wd, FLOOR - 330)
    // Edificios
    for (let bx = X; bx < X + Wd; bx += 220) {
      const h = 200 + ((bx * 7) % 140)
      g.fillStyle(0x3a3648).fillRect(bx, FLOOR - h - 60, 200, h + 60)
      for (let wy = FLOOR - h - 40; wy < FLOOR - 80; wy += 46) for (let wx = bx + 20; wx < bx + 180; wx += 44) g.fillStyle((wx + wy) % 3 ? 0xf2d79a : 0x2a2838).fillRect(wx, wy, 22, 26)
    }
    g.fillStyle(0x8a8f99).fillRect(X, FLOOR, Wd, 30)
    g.fillStyle(0x3a3f4d).fillRect(X, FLOOR + 30, Wd, 90)
    this.reveal(POS.kiosco, (gg, k) => {
      gg.fillStyle(k(0xd9c9a8)).fillRect(POS.kiosco - 90, 420, 180, 180)
      gg.fillStyle(k(0xc0392b)).fillRect(POS.kiosco - 100, 400, 200, 26)
      gg.fillStyle(k(0x8fb3d9)).fillRect(POS.kiosco - 70, 450, 140, 70)
      gg.fillStyle(k(0xe0b04a)).fillRect(POS.kiosco - 60, 500, 30, 14).fillRect(POS.kiosco - 20, 500, 30, 14)
    })
    this.label(POS.kiosco, 413, 'KIOSCO', 14, '#f1efe8').setDepth(3)
    this.reveal(POS.esquina, (gg, k) => {
      // Semáforo y cartel de la calle
      gg.fillStyle(k(0x2b2b2b)).fillRect(POS.esquina + 60, 330, 8, 270).fillRoundedRect(POS.esquina + 48, 300, 32, 72, 6)
      gg.fillStyle(k(0xd9534f)).fillCircle(POS.esquina + 64, 316, 8)
      gg.fillStyle(k(0x4f9d4a)).fillCircle(POS.esquina + 64, 354, 8)
      gg.fillStyle(k(0x2f5fb8)).fillRect(POS.esquina - 40, 380, 90, 22)
    })
    // Gente que pasa: sin cara
    for (const [sx, d] of [[500, 1], [1100, -1], [1800, 1]] as [number, number][]) {
      const s = this.add.image(sx, FLOOR - 75, 'sombra').setAlpha(0.8).setDepth(7).setFlipX(d < 0)
      this.tweens.add({ targets: s, x: sx + d * 260, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
    }
  }

  // El bar: madera, luz cálida, una mesa junto a la ventana
  private drawBar() {
    const { x: X, w: Wd } = AREAS.bar
    const g = this.add.graphics()
    g.fillStyle(0x5a3e2e).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x4a3226).fillRect(X, 0, Wd, 70)
    g.fillStyle(0x3a2a20).fillRect(X, FLOOR - 140, Wd, 140)
    g.fillStyle(0x2a1d16).fillRect(X, FLOOR, Wd, 120)
    for (const lx of [3300, 3980]) {
      g.lineStyle(2, 0x1a120c).lineBetween(lx, 70, lx, 190)
      g.fillStyle(0xe0b04a).fillTriangle(lx - 26, 214, lx + 26, 214, lx, 190)
      this.add.circle(lx, 230, 200, 0xffd28a, 0.1).setDepth(781).setBlendMode(Phaser.BlendModes.ADD)
    }
    g.fillStyle(0x15171d).fillRect(POS.puertaBar - 55, 392, 110, 208)
    g.fillStyle(0x6b4a2e).fillRect(POS.puertaBar - 48, 400, 96, 200)
    this.label(3600, 130, 'BAR', 34, '#e0b04a').setFontStyle('bold')
    this.reveal(POS.barra, (gg, k) => {
      gg.fillStyle(k(0x7a5236)).fillRect(POS.barra - 200, 470, 400, 130)
      gg.fillStyle(k(0x9a6a46)).fillRect(POS.barra - 210, 460, 420, 14)
      for (let i = 0; i < 9; i++) gg.fillStyle(k([0x4f9d4a, 0xa83232, 0xe0b04a][i % 3])).fillRect(POS.barra - 180 + i * 42, 300, 14, 50)
      gg.fillStyle(k(0x3a2a20)).fillRect(POS.barra - 200, 350, 400, 8)
    })
    // La ventana: afuera, la calle. Cuando llueve, se ve
    g.fillStyle(0x1e2838).fillRect(POS.mesa - 140, 230, 280, 200)
    this.ventana = this.add.graphics().setDepth(1)
    g.lineStyle(8, 0x3a2a20).strokeRect(POS.mesa - 140, 230, 280, 200).lineBetween(POS.mesa, 230, POS.mesa, 430)
    this.reveal(POS.mesa, (gg, k) => {
      gg.fillStyle(k(0x7a5236)).fillRect(POS.mesa - 70, 486, 140, 12).fillRect(POS.mesa - 8, 498, 16, 102)
      gg.fillStyle(k(0xf1efe8)).fillRect(POS.mesa - 40, 474, 18, 12).fillRect(POS.mesa + 22, 474, 18, 12)
      gg.fillStyle(k(0x6b4a2e)).fillRect(POS.mesa - 130, 500, 40, 10).fillRect(POS.mesa + 90, 500, 40, 10)
    })
  }

  // La calle de noche, bajo la lluvia: toldos y la parada del colectivo
  private drawLluvia() {
    const { x: X, w: Wd } = AREAS.lluvia
    const g = this.add.graphics()
    g.fillStyle(0x161a26).fillRect(X, 0, Wd, FLOOR)
    for (let bx = X; bx < X + Wd; bx += 260) {
      g.fillStyle(0x222838).fillRect(bx, 140, 240, FLOOR - 140)
      for (let wy = 170; wy < FLOOR - 120; wy += 60) for (let wx = bx + 24; wx < bx + 220; wx += 54) g.fillStyle((wx + wy) % 4 ? 0x2c3448 : 0x8a7a50).fillRect(wx, wy, 26, 32)
    }
    // Vereda mojada, con reflejos
    g.fillStyle(0x3a404e).fillRect(X, FLOOR, Wd, 30)
    g.fillStyle(0x22262f).fillRect(X, FLOOR + 30, Wd, 90)
    for (let lx = X + 40; lx < X + Wd; lx += 180) g.fillStyle(0x8a9ab8, 0.18).fillRect(lx, FLOOR + 6, 70, 3)
    g.fillStyle(0x15171d).fillRect(POS.salidaBar - 55, 392, 110, 208)
    g.fillStyle(0x6b4a2e).fillRect(POS.salidaBar - 48, 400, 96, 200)
    this.label(POS.salidaBar, 370, 'BAR', 20, '#e0b04a')
    for (const tx of POS.toldos) {
      this.reveal(tx, (gg, k) => {
        for (let i = 0; i < 8; i++) gg.fillStyle(k(i % 2 ? 0xf1efe8 : 0x2f6fa0)).fillRect(tx - 140 + i * 35, 340, 35, 40)
        gg.fillStyle(k(0x2f6fa0)).fillTriangle(tx - 140, 380, tx + 140, 380, tx, 396)
        gg.fillStyle(k(0x8fb3d9)).fillRect(tx - 110, 420, 220, 120)
      })
    }
    // Faroles
    for (const fx of [5600, 6250, 7050]) {
      g.fillStyle(0x3a3f4d).fillRect(fx - 4, 290, 8, 310).fillRect(fx - 20, 282, 40, 10)
      this.add.circle(fx, 296, 80, 0xffe2a8, 0.16).setDepth(781).setBlendMode(Phaser.BlendModes.ADD)
    }
    this.reveal(POS.parada, (gg, k) => {
      gg.fillStyle(k(0x9aa3b5)).fillRect(POS.parada - 160, 340, 320, 12).fillRect(POS.parada + 140, 352, 10, 248)
      gg.fillStyle(k(0x8fb3d9), 0.4).fillRect(POS.parada - 150, 352, 290, 180)
      gg.fillStyle(k(0xe0b04a)).fillRect(POS.parada + 160, 330, 60, 40)
    })
    this.label(POS.parada + 190, 350, 'PARADA', 11, '#2b2b2b').setDepth(3)
  }

  // Las cinemáticas: lo que se acuerdan en la parada, en sepia
  private drawRecuerdos() {
    const [p, f, s, d] = POS.recuerdos
    const g = this.add.graphics()
    const k = sepia
    // La plaza, a los 15
    g.fillStyle(k(0xe8c79a)).fillRect(p - 650, 0, 1300, 330)
    g.fillStyle(k(0xd9a87a)).fillRect(p - 650, 330, 1300, FLOOR - 330)
    g.fillStyle(k(0x8a8f99)).fillRect(p - 650, FLOOR, 1300, 120)
    g.fillStyle(k(0x6b4a2e)).fillRect(p - 300, 330, 30, 270)
    g.fillStyle(k(0x4f7a3f)).fillCircle(p - 285, 300, 110)
    g.fillStyle(k(0x4f9d4a)).fillRect(p - 90, 540, 180, 10).fillRect(p - 90, 508, 180, 8)
    // La fiesta, a los 17
    g.fillStyle(k(0x2f4a3f)).fillRect(f - 650, 0, 1300, FLOOR)
    g.fillStyle(k(0x5a3e26)).fillRect(f - 650, FLOOR, 1300, 120)
    for (let i = 0; i < 30; i++) g.fillStyle(k([0xe0b04a, 0xd9534f, 0x5aa7c8, 0x9ee07a][i % 4])).fillCircle(f - 620 + i * 42, 240 + Math.sin(i * 0.6) * 20, 5)
    // El sillón de la casa de María, a los 17
    g.fillStyle(k(0x6b5a46)).fillRect(s - 650, 0, 1300, FLOOR)
    g.fillStyle(k(0x4a3628)).fillRect(s - 650, FLOOR, 1300, 120)
    g.fillStyle(k(0x4f6f9a)).fillRoundedRect(s - 140, 500, 280, 100, 16).fillRoundedRect(s - 140, 450, 280, 60, 16)
    g.fillStyle(k(0xffd28a), 0.25).fillCircle(s, 220, 180)
    // El departamento vacío, a los 20: frío, en azul
    g.fillStyle(0x9aa8bf).fillRect(d - 650, 0, 1300, FLOOR)
    g.fillStyle(0x5a6478).fillRect(d - 650, FLOOR, 1300, 120)
    g.fillStyle(0xc9d6e8).fillRect(d - 100, 200, 200, 170)
    g.lineStyle(5, 0xe0e6f0).strokeRect(d - 100, 200, 200, 170).lineBetween(d, 200, d, 370)
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
  private says = (img: Phaser.GameObjects.Image) => (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: img.x, y: img.getTopCenter().y }) })
  private mariaSays = (t: string) => this.says(this.maria)(t)
  private at = (x: number, y: number, t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x, y }) })

  private pista(titulo: string, texto: string) {
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
  }

  private setupSpots() {
    this.spots = [
      { area: 'esquina', x: POS.kiosco, label: 'Kiosco', when: () => this.phase === 'esquina' || this.phase === 'aBar', action: () => say(this, [this.think('Cigarrillos, caramelos, el diario de la tarde.'), this.think('Paso por acá todos los días. Nunca la vi.')]) },
      { area: 'esquina', x: POS.aLaVuelta, label: 'Bar', when: () => this.phase === 'aBar', action: () => this.alBar() },
      { area: 'bar', x: POS.barra, label: 'Mozo', when: () => this.phase === 'bar', action: () => say(this, [this.says(this.mozo)('Siéntense donde quieran, chicos. Ya les llevo.')]) },
      { area: 'bar', x: POS.mesa, label: 'Sentarse', when: () => this.phase === 'bar', action: () => this.charla() },
      { area: 'bar', x: POS.puertaBar, label: 'Salir', when: () => this.phase === 'salir' || this.phase === 'bar', action: () => this.salirBar() },
    ]
  }

  private updateGoal() {
    const goals: Partial<Record<Phase, string>> = {
      esquina: 'Volver a casa',
      aBar: 'Ir al bar con María',
      bar: 'Sentarme con María',
      salir: 'Acompañar a María a la parada',
      lluvia: 'Acompañar a María a la parada',
      irse: 'Irme',
    }
    this.goal.set(goals[this.phase] ?? null)
  }

  // ---------- Secuencia ----------

  private async intro() {
    const lids = eyelids(this, 0)
    await this.wait(900)
    await lids.to(0.35, 2000)
    await lids.to(0.2, 900)
    await lids.to(1, 2200)
    lids.destroy()
    await say(this, [this.think('Una esquina del centro.'), this.think('Vuelvo del trabajo, como todos los días.'), this.think('Tengo… treinta.')])
    this.flame.setPosition(this.player.x + 70, FEET - 260)
    sfx.flame()
    this.tweens.add({ targets: this.flame, alpha: 1, y: FEET - 110, duration: 1500, ease: 'Sine.Out' })
    await this.wait(1600)
    await say(this, [this.vela('Hola, Jorge.'), this.vela('Hoy vamos diez años más adelante. Caminá.')])
    this.phase = 'esquina'
    this.updateGoal()
    const help = text(this, 24, this.scale.height - 34, controlsHelp('← → / A D caminar   ·   E examinar / hablar   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa'), 16, '#e8e8e8')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500 }))
  }

  // Se la cruza de casualidad en la esquina
  private async encuentro() {
    this.phase = 'aBar'
    this.goal.set(null)
    this.maria.setVisible(true).setPosition(POS.aLaVuelta, FLOOR - 70).setFlipX(true)
    await this.tween({ targets: this.maria, x: this.player.x + 120, duration: 1800 })
    this.facing = 1
    this.player.setFlipX(false)
    await say(this, [this.mariaSays('¿Jorge?'), this.think('Esa voz.'), this.speak('¿María?'), this.mariaSays('¡No lo puedo creer! ¿Cuánto hace?'), this.speak('Diez años.'), this.think('Diez años y dos meses.')])
    await say(this, [this.mariaSays('¿Tenés un rato? Hay un bar acá a la vuelta.')])
    const i = await choose(this, ['"Dale."', '"Tengo que irme…"'], { x: 640, y: 640 })
    await say(this, i === 0 ? [this.speak('Dale.')] : [this.think('Quise decirle que tenía que irme.'), this.speak('…Dale. Un rato.')])
    this.pista('La esquina', 'Me crucé a María de casualidad, en una esquina del centro. Diez años sin verla.')
    this.updateGoal()
  }

  private async alBar() {
    await this.goTo('bar', POS.puertaBar + 90)
    this.maria.setPosition(POS.puertaBar + 170, FLOOR - 70).setFlipX(false)
    this.city?.stop(1)
    this.city = undefined
    this.warm.setFillStyle(0xffb060, 0.05)
    this.phase = 'bar'
    await say(this, [this.think('Un bar de los de antes.'), this.mariaSays('Esa mesa, la de la ventana.')])
    this.updateGoal()
  }

  // La charla en la mesa: lo que el jugador pregunta y lo que ella pregunta
  private async charla() {
    this.phase = 'charla'
    this.goal.set(null)
    this.player.setTexture('jorgeSentado').setOrigin(0.5, 1).setFlipX(false).setPosition(POS.mesa - 110, FLOOR)
    this.maria.setTexture('maria30Sentada').setOrigin(0.5, 1).setFlipX(true).setPosition(POS.mesa + 110, FLOOR)
    this.facing = 1
    this.cameras.main.stopFollow()
    this.cameras.main.pan(POS.mesa, 360, 900, 'Sine.easeInOut')
    await this.wait(1000)
    await say(this, [this.at(POS.mesa, 420, 'Dos cafés.'), this.mariaSays('Contame. ¿Qué es de tu vida?'), this.speak('Nada nuevo. Trabajo, casa.')])
    const temas: Record<string, Line[]> = {
      cordoba: [
        this.speak('¿Cómo te fue en Córdoba?'),
        this.mariaSays('Bien. Me recibí. Me quedé allá un tiempo más… y después volví.'),
        this.think('Cinco años, dijo. Fueron siete.'),
      ],
      casada: [
        this.think('Tiene un anillo.'),
        this.speak('¿Estás casada?'),
        this.mariaSays('Sí. Hace dos años.'),
        this.mariaSays('Es un buen tipo.'),
        this.speak('Me alegro.'),
        this.think('No me alegro.'),
      ],
    }
    const primero = await choose(this, ['"¿Cómo te fue en Córdoba?"', '"¿Estás casada?"'], { x: 640, y: 640 })
    await say(this, primero === 0 ? temas.cordoba : temas.casada)
    await say(this, primero === 0 ? temas.casada : temas.cordoba)
    // Ella pregunta por la mamá
    await say(this, [this.mariaSays('¿Y tu mamá? ¿Cómo está?')])
    const m = await choose(this, ['"Bien, supongo."', '"No sé. No hablamos mucho."'], { x: 640, y: 640 })
    await say(this, m === 0
      ? [this.speak('Bien, supongo.'), this.mariaSays('¿Supongo?'), this.speak('Nos vemos poco.')]
      : [this.speak('No sé. No hablamos mucho.')])
    await say(this, [this.mariaSays('Llamala, Jorge.'), this.think('Todos me dicen lo mismo.')])
    // Y por el departamento: la servilleta
    await say(this, [
      this.mariaSays('¿Seguís en el departamento?'),
      this.speak('Sí. Lo alquilé igual. Solo.'),
      this.mariaSays('¿Y pusiste plantas en la ventana?'),
      this.speak('No.'),
      this.mariaSays('Así, mirá.'),
    ])
    sfx.paper()
    if (!state.inventario.includes('servilleta')) state.inventario.push('servilleta')
    await showPage(this, 'servilleta', 0)
    await say(this, [this.think('La ventana de la cocina. Con plantas.'), this.think('Me la guardo.')])
    this.pista('La servilleta', 'En el bar, María dibujó en una servilleta la ventana de la cocina del departamento, con plantas. Me la guardé.')
    // Afuera empezó a llover
    this.rainInside = true
    this.lluvia = startLluvia()
    this.lluvia.setVolume(0.3)
    await this.wait(1200)
    await say(this, [this.vela('Mirá afuera, Jorge.'), this.think('Llueve.')])
    await say(this, [
      this.says(this.mozo)('Chicos, vamos cerrando.'),
      this.mariaSays('¡Uy! ¿Ya es tan tarde?'),
      this.mariaSays('Y está lloviendo a cántaros.'),
      this.mariaSays('Tengo paraguas. ¿Me acompañás hasta la parada?'),
    ])
    this.player.setTexture('jorge0').setOrigin(0.5).setPosition(POS.mesa - 110, FEET)
    this.maria.setTexture('maria30_0').setOrigin(0.5).setPosition(POS.mesa + 60, FLOOR - 70)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.phase = 'salir'
    this.updateGoal()
  }

  private async salirBar() {
    if (this.phase === 'bar') {
      await say(this, [this.think('Me está esperando en la mesa.')])
      return
    }
    await this.goTo('lluvia', POS.salidaBar + 90)
    this.rainInside = false
    this.raining = true
    this.dark.setAlpha(0.85)
    this.maria.setPosition(POS.salidaBar + 150, FLOOR - 70).setFlipX(false)
    this.paraguas.setVisible(true)
    this.phase = 'lluvia'
    this.updateGoal()
  }

  // En la parada: se acuerdan, se besan casi por inercia, y Jorge se aparta
  private async parada() {
    this.phase = 'parada'
    this.goal.set(null)
    this.player.setX(POS.parada - 40).setFlipX(false)
    this.facing = 1
    await this.tween({ targets: this.maria, x: POS.parada + 40, duration: 700 })
    this.maria.setFlipX(true)
    this.paraguas.setVisible(false)
    this.flameScale = 1.1
    await say(this, [this.mariaSays('Acá es.'), this.mariaSays('Me hizo bien verte.'), this.speak('A mí también.'), this.mariaSays('¿Te acordás de la plaza?')])
    await this.recuerdos()
    // De vuelta en el presente: el beso, casi sin querer
    await this.tween({ targets: this.maria, x: POS.parada + 14, duration: 1200, ease: 'Sine.InOut' })
    sfx.flame()
    this.flameScale = 1.8
    this.tweens.add({ targets: this.warm, fillAlpha: 0.18, duration: 1500 })
    await this.wait(2200)
    await say(this, [this.think('…')])
    // Y el último recuerdo, frío: cuando ella se fue
    await this.flash(3, [
      { who: 'maria', t: 'Me salió la beca. En Córdoba.' },
      { who: 'maria', t: 'Son cinco años.' },
    ], 0x9fb4d8)
    this.warm.setFillStyle(0xffb060, 0)
    this.flameScale = 0.6
    await this.tween({ targets: this.player, x: POS.parada - 110, duration: 500 })
    await say(this, [
      this.speak('No, María.'),
      this.mariaSays('Jorge…'),
      this.speak('Vos ya te fuiste una vez.'),
      this.think('No le creo. No puedo.'),
      this.mariaSays('Eso fue hace diez años.'),
      this.speak('Para mí, no.'),
    ])
    this.pista('El beso', 'En la parada nos acordamos de cuando éramos chicos y nos besamos, casi sin querer. Pero ella ya se fue una vez. No le creo. Me fui.')
    this.phase = 'irse'
    this.updateGoal()
    this.paraguas.setVisible(true).setPosition(this.maria.x + 6, this.maria.getTopCenter().y - 10)
  }

  // Cinemáticas en sepia: la plaza, la fiesta, el sillón
  private async recuerdos() {
    await this.flash(0, [{ who: 'maria', t: '¿Un tres en matemática? Yo tengo un dos.' }])
    await this.flash(1, [{ who: 'maria', t: '¿Ves? No era tan difícil.' }])
    await this.flash(2, [{ who: 'maria', t: 'Buenas noches, Jorge.' }])
  }

  private async flash(i: number, lines: { who: 'maria' | 'jorge'; t: string }[], tint = 0xe8cfa0) {
    const cam = this.cameras.main
    cam.fadeOut(500, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    const x = POS.recuerdos[i]
    const textures = [
      ['jorge0', 'maria0'],
      ['jorge1', 'mariaFiesta0'],
      ['jorge0', 'mariaFiesta0'],
      ['jorge0', 'maria0'],
    ][i]
    const scale = i === 0 ? 0.92 : i === 3 ? 1 : 0.97
    const jor = this.add.image(x - 50, FLOOR - 70 * scale, textures[0]).setScale(scale).setDepth(10).setTint(tint)
    const mar = this.add.image(x + 50, FLOOR - 70, textures[1]).setDepth(10).setFlipX(true).setTint(tint)
    if (i === 1) {
      this.tweens.add({ targets: [jor, mar], x: '+=14', yoyo: true, repeat: -1, duration: 420, ease: 'Sine.InOut' })
    }
    // Bandas negras: es una cinemática
    if (this.bars.length === 0) {
      this.bars = [
        this.add.rectangle(0, 0, 1280, 70, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(1150),
        this.add.rectangle(0, 720 - 70, 1280, 70, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(1150),
      ]
    }
    const prev = { flame: this.flame.alpha, dark: this.dark.alpha, rain: this.raining }
    this.flame.setAlpha(0)
    this.dark.setAlpha(0)
    this.raining = false
    this.lluvia?.setVolume(0.15)
    const prevWarm = this.warm.fillAlpha
    this.warm.setFillStyle(tint === 0x9fb4d8 ? 0x9fb4d8 : 0xffd8a0, 0.16)
    this.setArea('recuerdo')
    cam.stopFollow()
    cam.centerOn(x, 360)
    cam.fadeIn(500, 0, 0, 0)
    await this.wait(700)
    const who = (w: 'maria' | 'jorge') => (w === 'maria' ? mar : jor)
    await say(this, lines.map((l) => ({ kind: 'speech' as const, text: l.t, anchor: () => ({ x: who(l.who).x, y: who(l.who).getTopCenter().y }) })))
    cam.fadeOut(500, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    jor.destroy()
    mar.destroy()
    this.warm.setFillStyle(0xffb060, prevWarm)
    this.setArea('lluvia')
    this.flame.setAlpha(prev.flame)
    this.dark.setAlpha(prev.dark)
    this.raining = prev.rain
    this.lluvia?.setVolume(1)
    cam.centerOn(POS.parada, 360)
    if (i === 3 || i === 2) {
      for (const b of this.bars) b.destroy()
      this.bars = []
    }
    cam.fadeIn(500, 0, 0, 0)
    await this.wait(500)
  }

  // Se va bajo la lluvia. María lo llama
  private async irse() {
    this.phase = 'fin'
    this.leaving = true
    this.goal.set(null)
    await say(this, [this.at(this.maria.x, this.maria.getTopCenter().y, '¡Jorge!')])
    const i = await choose(this, ['Darme vuelta', 'Seguir caminando'], { x: 640, y: 620 })
    await say(this, [this.think(i === 0 ? 'Quise darme vuelta.' : 'Seguí caminando.'), this.think('No me di vuelta.')])
    this.flameScale = 0.3
    await say(this, [this.vela('Jorge… te estás mojando.'), this.vela('Vamos. Vas a despertar.')])
    if (!state.lineaDeTiempo.includes('Los 30: el reencuentro')) state.lineaDeTiempo.push('Los 30: el reencuentro')
    const cam = this.cameras.main
    cam.fadeOut(2600, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.lluvia?.stop(1.5)
    await this.wait(900)
    this.scene.start('Office', { despertar: true, sesion: 5 })
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

  // ¿Está Jorge resguardado de la lluvia? Bajo un toldo, en la parada o bajo el paraguas de María
  private resguardado() {
    if (this.area !== 'lluvia') return true
    const x = this.player.x
    if (POS.toldos.some((t) => Math.abs(t - x) < 140) || Math.abs(POS.parada - x) < 150) return true
    return this.paraguas.visible && Math.abs(this.maria.x - x) < 100
  }

  update(time: number, delta: number) {
    const dt = Math.min(delta, 100)
    // La lluvia
    const llueve = this.raining && this.area === 'lluvia'
    for (const d of this.drops) {
      d.setVisible(llueve)
      if (!llueve) continue
      d.y += (dt / 1000) * 900
      d.x -= (dt / 1000) * 120
      if (d.y > 730) {
        d.y = -20
        d.x = Math.random() * 1340
      }
    }
    if (this.rainInside) {
      // La lluvia en la ventana del bar
      this.ventana.clear().lineStyle(1.5, 0xaec4dd, 0.6)
      for (let i = 0; i < 14; i++) {
        const vx = POS.mesa - 130 + Math.random() * 260
        const vy = 240 + Math.random() * 160
        this.ventana.lineBetween(vx, vy, vx - 3, vy + 18)
      }
    }
    if (this.phase !== 'intro' && this.phase !== 'charla') {
      const tx = this.player.x + 70 * this.facing
      const ty = FEET - 110 + Math.sin(time / 420) * 8
      const k = 1 - Math.exp(-dt / 260)
      this.flame.x += (tx - this.flame.x) * k
      if (!this.tweens.isTweening(this.flame)) this.flame.y += (ty - this.flame.y) * k
    }
    if (this.phase !== 'intro' && this.phase !== 'charla' && this.phase !== 'parada') {
      const k = 1 - Math.exp(-dt / 260)
      // Con lluvia la llama se achica; resguardada, crece. Cerca de María, también
      const cubierto = this.resguardado()
      const calor = this.maria.visible ? Math.max(0, 1 - Math.abs(this.maria.x - this.player.x) / 400) : 0
      let target = llueve ? (cubierto ? 1.1 : 0.45) : 1 + calor * 0.4
      if (this.phase === 'irse' || this.phase === 'fin') target = llueve && !cubierto ? 0.35 : 0.6
      this.flameScale += (target - this.flameScale) * k
      if (llueve) this.lluvia?.setVolume(cubierto ? 0.5 : 1)
      if (llueve && !cubierto && !this.velaAvisoLluvia && this.phase === 'lluvia' && !this.busy) {
        this.velaAvisoLluvia = true
        void this.run(() => say(this, [this.vela('La lluvia me apaga, Jorge.'), this.vela('Quedate cerca de ella.')]))
      }
      for (const o of this.objs) {
        if (o.revealed) continue
        if (Math.abs(o.x - this.flame.x) < REVEAL * Math.max(0.6, this.flameScale)) {
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
    // María camina al lado de Jorge (en la calle, bajo su paraguas)
    if ((this.phase === 'aBar' || this.phase === 'bar' || this.phase === 'salir' || this.phase === 'lluvia') && this.maria.visible && !this.tweens.isTweening(this.maria)) {
      const target = this.player.x + 70
      const dx = target - this.maria.x
      if (Math.abs(dx) > 30) {
        this.maria.x += Math.sign(dx) * Math.min(Math.abs(dx), WALK * 1.1 * (dt / 1000))
        this.mariaWalk += dt
        this.maria.setTexture(Math.floor(this.mariaWalk / 180) % 2 === 0 ? 'maria30_1' : 'maria30_2').setFlipX(dx < 0)
      } else this.maria.setTexture('maria30_0')
    }
    if (this.paraguas.visible) this.paraguas.setPosition(this.maria.x - 20, this.maria.getTopCenter().y - 18)

    const k = this.keys
    const ePressed = Phaser.Input.Keyboard.JustDown(k.E)
    const tabPressed = Phaser.Input.Keyboard.JustDown(k.TAB)
    if (this.busy || time < this.lockUntil) return

    // Momentos que se disparan al llegar a un lugar
    if (this.phase === 'esquina' && this.player.x > POS.esquina - 200) {
      void this.run(() => this.encuentro())
      return
    }
    if (this.phase === 'lluvia' && this.player.x > POS.parada - 60) {
      void this.run(() => this.parada())
      return
    }
    if (this.phase === 'irse' && this.player.x > POS.fin - 120) {
      void this.run(() => this.irse())
      return
    }

    if (tabPressed) {
      void this.run(() => openDiary(this))
      return
    }

    const r = AREAS[this.area]
    const dir = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0)
    if (dir !== 0 && this.player.texture.key !== 'jorgeSentado') {
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
    } else if (this.player.texture.key !== 'jorgeSentado') {
      this.player.setTexture('jorge0')
    }

    const spot = this.spots.find((s) => s.area === this.area && s.when() && Math.abs(this.player.x - s.x) < 75)
    if (spot) {
      const people = ['Mozo', 'Bar', 'Salir', 'Sentarse']
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

import * as Phaser from 'phaser'
import { FONT, makeTextures } from '../art'
import { sfx, startRoomTone } from '../audio'
import { addPista, state } from '../state'
import { controlsHelp } from '../touch'
import { choose, eyelids, objective, say, text, toast, type Line, type Point } from '../ui'
import { openDiary } from './diary'

// Sesión 7: la muerte de su mamá. Quince días después del viaje. Jorge tiene 38 años.
//   Casa de la mamá:  [puerta] [comedor: la mesa] | [cocina: heladera con la foto, silla, mesada, teléfono]
//   Hospital, noche:  [pasillo: sillas, el médico] [puerta] [habitación: la cama, la silla, el monitor]
// Desde el viaje, Jorge la visita los domingos. Mientras pone la mesa, a ella le da el segundo ACV. Él la sienta,
// llama a la ambulancia y se queda con ella. En el hospital, el médico le dice que puede ser esa noche. Jorge se sienta
// al lado de la cama y le agarra la mano. Ella le dice algo, lo último, y Jorge no se acuerda de qué: las palabras se
// ven tachadas, como en el informe. El monitor se va espaciando hasta callarse. Jorge está con ella cuando muere.
// Lo que le dijo se revela recién en el final del juego, después de que María lo va a buscar.
// Sigue en Office (despertar de la Sesión 7). No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const FLOOR = 600
const FEET = FLOOR - 70
const WALK = 190
const REVEAL = 260

type Area = 'casa' | 'hospital'
const AREAS: Record<Area, { x: number; w: number }> = {
  casa: { x: 0, w: 2400 },
  hospital: { x: 3000, w: 2000 },
}
const POS = {
  puertaCalle: 170,
  mesa: 720,
  tele: 1150,
  heladera: 1560,
  silla: 1800,
  mesada: 1980,
  telefono: 2240,
  entradaHospital: 3120,
  sillas: 3350,
  medico: 3700,
  puertaHabitacion: 4100,
  cama: 4620,
  sillaCama: 4400,
}

type Phase = 'intro' | 'casa' | 'mesa' | 'acv' | 'llamar' | 'esperar' | 'hospital' | 'habitacion' | 'mano' | 'fin'
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

// Lo último que le dice: Jorge lo escuchó, pero su mente lo tacha, como la causa del informe
const TACHADO = '████ ██ ██████ ███ █████'

export class Dream7 extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private flame!: Phaser.GameObjects.Container
  private flameGlow!: Phaser.GameObjects.Arc
  private warm!: Phaser.GameObjects.Rectangle
  private noche!: Phaser.GameObjects.Rectangle
  private mama!: Phaser.GameObjects.Image
  private medico!: Phaser.GameObjects.Image
  private platos!: Phaser.GameObjects.Graphics
  private taza!: Phaser.GameObjects.Graphics
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text
  private goal!: ReturnType<typeof objective>
  private objs: Reveal[] = []
  private spots: Spot[] = []
  private area: Area = 'casa'
  private phase: Phase = 'intro'
  private busy = true
  private leaving = false
  private lockUntil = 0
  private facing = 1
  private walkDist = 0
  private stepDist = 0
  private flameScale = 1
  private flameTarget = 1
  private f = { foto: false, medico: false }
  private latido?: Phaser.Time.TimerEvent
  private monitor?: Phaser.Time.TimerEvent
  private tone?: { stop: (fade?: number) => void }

  constructor() {
    super('Dream7')
  }

  create() {
    this.busy = true
    this.leaving = false
    this.phase = 'intro'
    this.facing = 1
    this.flameScale = this.flameTarget = 1
    this.objs = []
    this.f = { foto: false, medico: false }
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0b0c10')
    this.drawCasa()
    this.drawHospital()

    this.mama = this.add.image(POS.mesada + 50, FLOOR - 70, 'mamaMayor0').setDepth(8).setFlipX(true)
    this.medico = this.add.image(POS.medico, FLOOR - 75, 'sombra').setDepth(8).setFlipX(true).setTint(0xdfe3ea)
    this.player = this.add.image(POS.puertaCalle + 90, FEET, 'jorge0').setDepth(10)

    this.flameGlow = this.add.circle(0, 0, 60, 0xffc56b, 0.18).setBlendMode(Phaser.BlendModes.ADD)
    this.flame = this.add.container(this.player.x + 70, FEET - 110, [this.flameGlow, this.add.image(0, 0, 'llama')]).setDepth(790).setAlpha(0)
    this.warm = this.add.rectangle(0, 0, 1280, 720, 0xffb060, 0).setOrigin(0).setScrollFactor(0).setDepth(776).setBlendMode(Phaser.BlendModes.ADD)
    // El hospital, de noche: todo un poco más oscuro
    this.noche = this.add.rectangle(AREAS.hospital.x, 0, AREAS.hospital.w, 720, 0x0a1024, 0.38).setOrigin(0).setDepth(30)

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
    this.events.once('shutdown', () => this.tone?.stop(0.5))
    void this.run(() => this.intro())
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __dream7?: Dream7 }).__dream7 = this
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

  // La casa de la mamá, la misma de siempre: comedor y cocina. Es domingo al mediodía
  private drawCasa() {
    const { x: X, w: Wd } = AREAS.casa
    const g = this.add.graphics()
    g.fillStyle(0x5a5446).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x4c4639).fillRect(X, 0, Wd, 70)
    g.lineStyle(1, 0x635c4d)
    for (let lx = X + 20; lx < X + Wd; lx += 40) g.lineBetween(lx, 70, lx, FLOOR - 120)
    g.fillStyle(0x3d3a33).fillRect(X, FLOOR - 120, Wd, 120)
    g.fillStyle(0x2a2620).fillRect(X, FLOOR, Wd, 120)
    for (let lx = X; lx < X + Wd; lx += 60) g.fillStyle(lx % 120 === 0 ? 0x332e27 : 0x2a2620).fillRect(lx, FLOOR, 60, 120)
    g.fillStyle(0x3a352c).fillRect(1390, 70, 20, FLOOR - 70)
    // Puerta de la calle y una ventana con sol
    g.fillStyle(0x15171d).fillRect(POS.puertaCalle - 55, 392, 110, 208)
    g.fillStyle(0x553a28).fillRect(POS.puertaCalle - 48, 400, 96, 200)
    g.fillStyle(0xc9b46a).fillCircle(POS.puertaCalle + 32, 505, 5)
    g.fillStyle(0xf2dca0).fillRect(400, 210, 130, 150)
    g.lineStyle(4, 0x3a352c).strokeRect(400, 210, 130, 150).lineBetween(465, 210, 465, 360)
    this.add.rectangle(465, 470, 260, 260, 0xffe2a0, 0.06).setDepth(31).setBlendMode(Phaser.BlendModes.ADD)

    // Comedor: la mesa de siempre, la tele
    this.reveal(POS.mesa, (gg, k) => {
      gg.fillStyle(k(0x6b4a2e)).fillRect(POS.mesa - 160, 480, 320, 14)
      gg.fillStyle(k(0x5a3e26)).fillRect(POS.mesa - 150, 494, 12, 106).fillRect(POS.mesa + 138, 494, 12, 106)
      gg.fillStyle(k(0xe8e2cf)).fillRect(POS.mesa - 150, 472, 300, 8)
      gg.fillStyle(k(0x5a3e26)).fillRect(POS.mesa - 200, 420, 10, 180).fillRect(POS.mesa - 230, 520, 40, 8)
      gg.fillStyle(k(0x5a3e26)).fillRect(POS.mesa + 190, 420, 10, 180).fillRect(POS.mesa + 190, 520, 40, 8)
    })
    this.platos = this.add.graphics().setDepth(4).setVisible(false)
    this.platos.fillStyle(0xf4f1ea).fillEllipse(POS.mesa - 80, 470, 70, 12).fillEllipse(POS.mesa + 80, 470, 70, 12)
    this.platos.fillStyle(0xbfd6e0, 0.8).fillRect(POS.mesa - 30, 450, 12, 20).fillRect(POS.mesa + 18, 450, 12, 20)
    this.reveal(POS.tele, (gg, k) => {
      gg.fillStyle(k(0x4a3628)).fillRect(POS.tele - 70, 520, 140, 80)
      gg.fillStyle(k(0x2b2b2b)).fillRoundedRect(POS.tele - 60, 440, 120, 80, 8)
      gg.fillStyle(k(0x6f8fa8)).fillRoundedRect(POS.tele - 50, 448, 100, 62, 6)
    })

    // Cocina: la heladera con la foto del viaje, una silla, la mesada con la olla, el teléfono de pared
    this.reveal(POS.heladera, (gg, k) => {
      gg.fillStyle(k(0xe8e6e0)).fillRoundedRect(POS.heladera - 60, 300, 120, 300, 8)
      gg.lineStyle(2, k(0xb5b2aa)).lineBetween(POS.heladera - 60, 400, POS.heladera + 60, 400)
      gg.fillStyle(k(0x9aa3b5)).fillRect(POS.heladera + 40, 330, 6, 50).fillRect(POS.heladera + 40, 420, 6, 60)
      // La foto de San Rafael, con un imán
      gg.fillStyle(k(0xf6f3ea)).fillRect(POS.heladera - 40, 330, 52, 40)
      gg.fillStyle(k(0xd9b04a)).fillRect(POS.heladera - 36, 334, 44, 20)
      gg.fillStyle(k(0x6b8f3a)).fillRect(POS.heladera - 36, 354, 44, 12)
      gg.fillStyle(k(0xb5562f)).fillCircle(POS.heladera - 14, 330, 4)
    })
    this.reveal(POS.silla, (gg, k) => {
      gg.fillStyle(k(0x6b4a2e)).fillRect(POS.silla - 30, 520, 60, 10).fillRect(POS.silla - 28, 530, 8, 70).fillRect(POS.silla + 20, 530, 8, 70)
      gg.fillRect(POS.silla + 20, 440, 8, 80)
    })
    this.reveal(POS.mesada, (gg, k) => {
      gg.fillStyle(k(0xd9dde5)).fillRect(POS.mesada - 130, 500, 260, 100)
      gg.fillStyle(k(0x9aa3b5)).fillRect(POS.mesada - 136, 492, 272, 10)
      gg.fillStyle(k(0x6b8f6b)).fillRect(POS.mesada - 130, 280, 260, 80)
      // La olla de los ñoquis, con vapor
      gg.fillStyle(k(0x8a8f99)).fillRect(POS.mesada + 40, 462, 60, 30)
      gg.fillStyle(k(0x6b6f78)).fillRect(POS.mesada + 34, 458, 72, 6)
    })
    this.taza = this.add.graphics().setDepth(6)
    this.taza.fillStyle(0xe8e2cf).fillRect(POS.mesada - 60, 476, 16, 16)
    this.taza.lineStyle(3, 0xe8e2cf).strokeCircle(POS.mesada - 40, 484, 5)
    this.reveal(POS.telefono, (gg, k) => {
      gg.fillStyle(k(0xd9cfb5)).fillRoundedRect(POS.telefono - 22, 360, 44, 70, 6)
      gg.fillStyle(k(0xb5a888)).fillRoundedRect(POS.telefono - 16, 366, 12, 58, 5)
      gg.lineStyle(2, k(0x4a4639)).lineBetween(POS.telefono - 10, 424, POS.telefono - 14, 470).lineBetween(POS.telefono - 14, 470, POS.telefono - 6, 500)
    })
    g.fillStyle(0x15171d).fillRect(2300, 392, 110, 208)
  }

  // El hospital, de noche: pasillo con sillas y la habitación con la cama, una silla y el monitor
  private drawHospital() {
    const { x: X, w: Wd } = AREAS.hospital
    const g = this.add.graphics()
    g.fillStyle(0xdfe6ec).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x9fc4c8).fillRect(X, FLOOR - 140, Wd, 140)
    g.fillStyle(0xb5bec8).fillRect(X, FLOOR, Wd, 120)
    for (let lx = X + 100; lx < X + Wd; lx += 320) g.fillStyle(0xf8fbff).fillRect(lx, 40, 180, 10)
    g.fillStyle(0xc9d2da).fillRect(POS.puertaHabitacion + 40, 0, 20, FLOOR)
    this.label(3520, 160, 'TERAPIA INTENSIVA', 18, '#5a7a8a')
    // Ventanal del pasillo (de noche, oscuro)
    g.fillStyle(0x1d2a44).fillRect(3150, 210, 160, 150)
    g.lineStyle(5, 0xc9d2da).strokeRect(3150, 210, 160, 150).lineBetween(3230, 210, 3230, 360)
    for (const sx of [POS.sillas - 80, POS.sillas, POS.sillas + 80]) g.fillStyle(0x5a8aa0).fillRoundedRect(sx - 30, 520, 60, 14, 4).fillRect(sx - 26, 534, 6, 66).fillRect(sx + 20, 534, 6, 66)
    g.fillStyle(0x15171d).fillRect(POS.puertaHabitacion - 55, 392, 110, 208)
    g.fillStyle(0xf1efe8).fillRect(POS.puertaHabitacion - 48, 400, 96, 200)
    this.label(POS.puertaHabitacion, 380, '4', 16, '#2b3140')
    this.reveal(POS.cama, (gg, k) => {
      gg.fillStyle(k(0xb5bec8)).fillRect(POS.cama - 150, 500, 300, 20).fillRect(POS.cama - 140, 520, 10, 80).fillRect(POS.cama + 130, 520, 10, 80)
      gg.fillStyle(k(0xf1efe8)).fillRoundedRect(POS.cama - 150, 480, 300, 30, 6)
      gg.fillStyle(k(0x9fc4e8)).fillRoundedRect(POS.cama - 60, 476, 210, 26, 6)
      gg.fillStyle(k(0x2b2b2b)).fillRect(POS.cama + 190, 300, 100, 80).fillRect(POS.cama + 236, 380, 8, 220)
      gg.fillStyle(k(0x1a3a2a)).fillRect(POS.cama + 198, 308, 84, 64)
      gg.lineStyle(2, k(0x4fe07a)).lineBetween(POS.cama + 200, 340, POS.cama + 225, 340).lineBetween(POS.cama + 225, 340, POS.cama + 232, 322).lineBetween(POS.cama + 232, 322, POS.cama + 240, 352).lineBetween(POS.cama + 240, 352, POS.cama + 248, 340).lineBetween(POS.cama + 248, 340, POS.cama + 280, 340)
      // La silla de al lado
      gg.fillStyle(k(0x5a8aa0)).fillRoundedRect(POS.sillaCama - 30, 520, 60, 14, 4).fillRect(POS.sillaCama - 26, 534, 6, 66).fillRect(POS.sillaCama + 20, 534, 6, 66)
      gg.fillStyle(k(0x5a8aa0)).fillRect(POS.sillaCama - 30, 450, 8, 72)
    })
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
  private mamaSays = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => (this.mama.angle !== 0 ? { x: this.mama.x - 50, y: 450 } : { x: this.mama.x, y: this.mama.getTopCenter().y }) })
  private medicoSays = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: this.medico.x, y: this.medico.getTopCenter().y }) })

  private pista(titulo: string, texto: string) {
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
  }

  private setupSpots() {
    const casa = () => this.phase === 'casa' || this.phase === 'mesa'
    this.spots = [
      { area: 'casa', x: POS.heladera, label: 'Heladera', when: () => casa() && !this.f.foto, action: () => this.fotoHeladera() },
      { area: 'casa', x: POS.mesada - 20, label: 'Mamá', when: () => this.phase === 'casa', action: () => this.hablarMama() },
      { area: 'casa', x: POS.mesa, label: 'Poner la mesa', when: () => this.phase === 'mesa' && !this.platos.visible, action: () => this.ponerMesa() },
      { area: 'casa', x: POS.mesada - 20, label: 'Mamá', when: () => this.phase === 'mesa' && this.platos.visible, action: () => this.acv() },
      { area: 'casa', x: POS.mesada - 20, label: 'Ayudarla', when: () => this.phase === 'acv', action: () => this.sentarla() },
      { area: 'casa', x: POS.telefono, label: 'Teléfono', when: () => this.phase === 'llamar', action: () => this.llamar() },
      { area: 'casa', x: POS.silla, label: 'Mamá', when: () => this.phase === 'esperar', action: () => this.quedarse() },
      { area: 'hospital', x: POS.medico, label: 'Médico', when: () => this.phase === 'hospital', action: () => this.hablarMedico() },
      { area: 'hospital', x: POS.puertaHabitacion, label: 'Habitación 4', when: () => this.phase === 'hospital', action: () => this.entrarHabitacion() },
      { area: 'hospital', x: POS.sillaCama, label: 'Sentarme a su lado', when: () => this.phase === 'habitacion', action: () => this.sentarse() },
    ]
  }

  private updateGoal() {
    if (this.phase === 'casa') this.goal.set('Ir a la cocina con mamá')
    else if (this.phase === 'mesa') this.goal.set(this.platos.visible ? 'Avisarle a mamá que está la mesa' : 'Poner la mesa')
    else if (this.phase === 'acv') this.goal.set('Ayudarla a sentarse')
    else if (this.phase === 'llamar') this.goal.set('Llamar a una ambulancia')
    else if (this.phase === 'esperar') this.goal.set('Quedarme con ella')
    else if (this.phase === 'hospital') this.goal.set(this.f.medico ? 'Ir con mamá' : 'Hablar con el médico')
    else if (this.phase === 'habitacion') this.goal.set('Sentarme al lado de mamá')
    else this.goal.set(null)
  }

  // ---------- Secuencia ----------

  private async intro() {
    // Quince días después del viaje
    const bg = this.add.rectangle(0, 0, 1280, 720, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(1290)
    const card = text(this, this.scale.width / 2, 340, '27 de agosto', 30, '#e8e8e8').setOrigin(0.5).setScrollFactor(0).setDepth(1300)
    const card2 = text(this, this.scale.width / 2, 384, 'Quince días después del viaje', 20, '#aab2c4').setOrigin(0.5).setScrollFactor(0).setDepth(1300)
    await this.wait(2800)
    card.destroy()
    card2.destroy()
    bg.destroy()
    const lids = eyelids(this, 0)
    await this.wait(700)
    await lids.to(0.35, 1800)
    await lids.to(0.2, 800)
    await lids.to(1, 2000)
    lids.destroy()
    await say(this, [this.think('La casa de mamá.'), this.think('Desde el viaje vengo todos los domingos.'), this.think('Hoy es el segundo.')])
    this.flame.setPosition(this.player.x + 70, FEET - 260)
    sfx.flame()
    this.tweens.add({ targets: this.flame, alpha: 1, y: FEET - 110, duration: 1500, ease: 'Sine.Out' })
    await this.wait(1600)
    await say(this, [this.vela('Hola, Jorge.'), this.vela('Hoy no te voy a pedir que busques nada.'), this.vela('Solo quedate con ella.')])
    this.phase = 'casa'
    this.updateGoal()
    const help = text(this, 24, this.scale.height - 34, controlsHelp('← → / A D caminar   ·   E examinar / hablar   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa'), 16, '#d8dce6')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500 }))
  }

  private async fotoHeladera() {
    this.f.foto = true
    await say(this, [this.think('La foto de San Rafael.'), this.think('Se hizo una copia para ella.'), this.think('La puso en la heladera, con un imán.')])
    this.pista('La foto en la heladera', 'En la heladera de mamá estaba la foto de San Rafael. Se había hecho una copia para ella.')
  }

  private async hablarMama() {
    await say(this, [
      this.mamaSays('¡Llegaste! Hice ñoquis.'),
      this.speak('¿Ñoquis? Si no es 29.'),
      this.mamaSays('Ya sé. Pero tenía ganas.'),
      this.mamaSays('Poné la mesa, ¿querés? Como cuando eras chico.'),
    ])
    this.phase = 'mesa'
    this.updateGoal()
  }

  private async ponerMesa() {
    sfx.pickup()
    this.platos.setVisible(true)
    await this.wait(400)
    await say(this, [this.think('Dos platos. Dos vasos.'), this.think('Hacía veinte años que no ponía esta mesa.')])
    this.updateGoal()
  }

  // El segundo ACV
  private async acv() {
    this.goal.set(null)
    await say(this, [this.speak('Ma, ya está la mesa.'), this.mamaSays('Ya v…')])
    // Se le cae la taza
    sfx.taza()
    this.tweens.add({ targets: this.taza, y: 108, alpha: 0, duration: 260, ease: 'Quad.In' })
    this.cameras.main.shake(140, 0.002)
    this.tweens.add({ targets: this.mama, angle: -4, duration: 500, yoyo: true, repeat: 1, ease: 'Sine.InOut' })
    await this.wait(700)
    await say(this, [this.mamaSays('Jorge… no me… sien…'), this.speak('¿Ma? ¿Qué te pasa?'), this.think('No le sale la voz.'), this.think('Como la otra vez.')])
    this.latido = this.time.addEvent({ delay: 900, loop: true, callback: () => sfx.latido() })
    await say(this, [this.vela('Jorge. Ayudala a sentarse.')])
    this.phase = 'acv'
    this.updateGoal()
  }

  private async sentarla() {
    // Jorge la lleva hasta la silla
    this.mama.setAngle(0)
    await this.tween({ targets: this.mama, x: POS.silla + 6, duration: 1400, ease: 'Sine.InOut' })
    this.mama.setTexture('mamaMayorSentada').setOrigin(0.5, 1).setFlipX(true).setPosition(POS.silla + 4, FLOOR - 2)
    this.player.setX(POS.silla + 90).setFlipX(true)
    this.facing = -1
    await say(this, [this.speak('Despacio, ma. Acá. Sentate.'), this.speak('Ya está.'), this.vela('Ahora llamá, Jorge.')])
    this.phase = 'llamar'
    this.updateGoal()
  }

  private async llamar() {
    sfx.click()
    const voz = (t: string): Line => ({ kind: 'intercom', text: t, anchor: () => ({ x: POS.telefono, y: 330 }) })
    await say(this, [
      this.speak('¡Necesito una ambulancia!'),
      this.speak('Mi mamá. Tuvo un ACV hace dos semanas. Creo que es otro.'),
      voz('Ya sale una unidad.'),
      voz('No la deje sola. Quédese con ella.'),
    ])
    this.phase = 'esperar'
    this.updateGoal()
  }

  private async quedarse() {
    this.latido?.remove()
    this.player.setX(POS.silla + 70).setFlipX(true)
    this.facing = -1
    await say(this, [this.speak('Ya vienen, ma.'), this.speak('Ya vienen.'), this.think('Me agarró la mano.'), this.think('Fuerte. Como en la feria.')])
    this.pista('El segundo ACV', 'Quince días después del viaje, en su casa, mientras yo ponía la mesa, a mamá le dio otro ACV. La senté, llamé a la ambulancia y me quedé con ella.')
    sfx.sirena()
    await this.wait(1800)
    await this.alHospital()
  }

  private async alHospital() {
    const cam = this.cameras.main
    cam.fadeOut(1800, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    const card = text(this, this.scale.width / 2, 360, 'Esa noche', 30, '#e8e8e8').setOrigin(0.5).setScrollFactor(0).setDepth(1300)
    await this.wait(2000)
    card.destroy()
    this.phase = 'hospital'
    this.mama.setTexture('mamaMayor0').setOrigin(0.5).setFlipX(false).setAngle(-90).setPosition(POS.cama, 470).setVisible(false)
    this.player.setTexture('jorge0').setOrigin(0.5).setFlipX(false).setPosition(POS.entradaHospital + 80, FEET)
    this.facing = 1
    this.flame.setPosition(this.player.x + 70, FEET - 110)
    this.setArea('hospital')
    cam.centerOn(this.player.x, 360)
    cam.fadeIn(1500, 0, 0, 0)
    await this.wait(1500)
    await say(this, [this.think('El mismo hospital.'), this.think('Hace quince días estaba acá y me pedía ir a San Rafael.')])
    this.updateGoal()
  }

  private async hablarMedico() {
    this.f.medico = true
    await say(this, [
      this.medicoSays('Fue un segundo ACV. Mucho más grande que el primero.'),
      this.medicoSays('No le voy a mentir: puede ser esta noche.'),
      this.speak('…'),
      this.medicoSays('Quédese con ella. Aunque no hable, lo escucha.'),
    ])
    this.updateGoal()
  }

  private async entrarHabitacion() {
    if (!this.f.medico) {
      await say(this, [this.think('Primero tengo que saber cómo está.')])
      return
    }
    const cam = this.cameras.main
    sfx.door()
    cam.fadeOut(400, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.phase = 'habitacion'
    this.player.setX(POS.puertaHabitacion + 140)
    this.mama.setVisible(true)
    // En la habitación ya se ve todo
    for (const o of this.objs) {
      if (o.revealed || o.x !== POS.cama) continue
      o.revealed = true
      o.color.setAlpha(1)
    }
    cam.fadeIn(400, 0, 0, 0)
    this.monitor = this.time.addEvent({ delay: 1100, loop: true, callback: () => sfx.bip() })
    await this.wait(500)
    await say(this, [this.think('Está dormida.'), this.think('Le veo la cara. Desde el viaje se la veo.')])
    this.updateGoal()
  }

  // Al lado de la cama: le agarra la mano, ella le dice algo y se va
  private async sentarse() {
    this.phase = 'mano'
    this.goal.set(null)
    this.player.setTexture('jorgeSentado').setOrigin(0.5, 1).setFlipX(false).setPosition(POS.sillaCama - 8, FLOOR - 2)
    this.facing = 1
    const cam = this.cameras.main
    cam.stopFollow()
    cam.pan((POS.sillaCama + POS.cama) / 2, 360, 1000, 'Sine.easeInOut')
    this.flameTarget = 1.2
    this.tweens.add({ targets: this.flame, x: POS.sillaCama + 40, y: FEET - 170, duration: 1200, ease: 'Sine.InOut' })
    this.tweens.add({ targets: this.warm, fillAlpha: 0.06, duration: 1500 })
    await this.wait(1100)
    await choose(this, ['Agarrarle la mano'], { x: 640, y: 640 })
    await this.wait(600)
    await say(this, [this.mamaSays('…Jorge.'), this.speak('Acá estoy, ma.'), this.mamaSays('Hijo…')])
    await this.wait(700)
    // Lo último que le dice: Jorge lo escuchó, pero en el recuerdo aparece tachado
    await say(this, [this.mamaSays(TACHADO)])
    await this.wait(600)
    await say(this, [this.think('Me dijo algo.'), this.think('La escuché. Sé que la escuché.'), this.think('Pero no me acuerdo qué.')])
    // El monitor se va espaciando hasta callarse
    this.monitor?.remove()
    for (const d of [1400, 1800, 2400, 3200]) {
      await this.wait(d)
      sfx.bip()
    }
    this.flameTarget = 0.35
    this.tweens.add({ targets: this.warm, fillAlpha: 0, duration: 4000 })
    this.tweens.add({ targets: this.noche, fillAlpha: 0.55, duration: 4000 })
    await this.wait(4200)
    await say(this, [this.speak('Ma…')])
    await this.wait(1800)
    await say(this, [this.think('Se fue.')])
    await this.wait(1400)
    await say(this, [this.think('Yo estaba ahí.'), this.think('Le estaba agarrando la mano.'), this.vela('Estabas ahí, Jorge.')])
    this.pista('Sus últimas palabras', 'Esa noche, en el hospital, le agarré la mano a mamá. Me dijo algo antes de irse. Sé que lo escuché, pero no me acuerdo qué fue.')
    await this.amanecer()
  }

  // A la mañana, en el pasillo: lo que estaba tachado
  private async amanecer() {
    const cam = this.cameras.main
    cam.fadeOut(2500, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    await this.wait(1200)
    this.phase = 'fin'
    this.leaving = true
    this.player.setTexture('jorgeSentado').setOrigin(0.5, 1).setFlipX(false).setPosition(POS.sillas - 8, FLOOR - 2)
    this.medico.setVisible(false)
    this.noche.setFillStyle(0x0a1024, 0.12)
    // Por el ventanal entra el amanecer
    const vent = this.add.graphics().setDepth(1)
    vent.fillGradientStyle(0x8fa8d0, 0x8fa8d0, 0xf6c890, 0xf6c890, 1).fillRect(3152, 212, 156, 146)
    vent.lineStyle(5, 0xc9d2da).strokeRect(3150, 210, 160, 150).lineBetween(3230, 210, 3230, 360)
    this.add.rectangle(3230, 430, 340, 340, 0xffc890, 0.08).setDepth(31).setBlendMode(Phaser.BlendModes.ADD)
    this.flame.setPosition(POS.sillas + 90, FEET - 150)
    this.flameTarget = 0.6
    cam.centerOn(POS.sillas + 120, 360)
    cam.fadeIn(2500, 0, 0, 0)
    await this.wait(2800)
    await say(this, [this.think('Me quedé hasta que amaneció.'), this.think('No sabía a dónde ir.')])
    await this.wait(800)
    this.flameTarget = 1
    await say(this, [this.vela('Esto es lo que estaba tachado, Jorge.'), this.think('La muerte de mamá.'), this.vela('No tenías que verlo solo. Por eso estoy acá.')])
    if (!state.lineaDeTiempo.includes('La pérdida: la muerte de mamá')) state.lineaDeTiempo.push('La pérdida: la muerte de mamá')
    await this.wait(1200)
    await say(this, [this.vela('Vas a despertar.')])
    cam.fadeOut(3200, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    await this.wait(900)
    this.scene.start('Office', { despertar: true, sesion: 7 })
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
    const k = 1 - Math.exp(-dt / 260)
    if (this.phase !== 'intro' && this.phase !== 'mano' && this.phase !== 'fin') {
      const tx = this.player.x + 70 * this.facing
      const ty = FEET - 110 + Math.sin(time / 420) * 8
      this.flame.x += (tx - this.flame.x) * k
      if (!this.tweens.isTweening(this.flame)) this.flame.y += (ty - this.flame.y) * k
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
    // La llama se achica despacio cuando ella se va, y vuelve de a poco
    this.flameScale += (this.flameTarget - this.flameScale) * (1 - Math.exp(-dt / 1400))
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

    const r = AREAS[this.area]
    const sentado = this.player.texture.key === 'jorgeSentado'
    const dir = (keys.LEFT.isDown || keys.A.isDown ? -1 : 0) + (keys.RIGHT.isDown || keys.D.isDown ? 1 : 0)
    if (dir !== 0 && !sentado) {
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
    } else if (!sentado) {
      this.player.setTexture('jorge0')
    }

    const spot = this.spots.find((s) => s.area === this.area && s.when() && Math.abs(this.player.x - s.x) < 75)
    if (spot) {
      const people = ['Mamá', 'Ayudarla', 'Médico', 'Habitación 4']
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

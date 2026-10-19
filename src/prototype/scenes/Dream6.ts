import * as Phaser from 'phaser'
import { FONT, makeTextures } from '../art'
import { sfx, startPajaros, startRoomTone } from '../audio'
import { showPage } from '../documents'
import { addPista, state } from '../state'
import { controlsHelp } from '../touch'
import { choose, eyelids, objective, say, text, toast, type Line, type Point } from '../ui'
import { openDiary } from './diary'

// Sesión 6: el viaje del 12/08. Jorge tiene unos 38 años.
//   Oficina:      [escritorio: el teléfono] … [puerta]
//   Hospital:     [pasillo: el médico] [puerta] [habitación: la mamá en la cama]
//   San Rafael:   [viñedos] [álamos] [mirador del río] [banco frente al río]
// Jorge está trabajando cuando lo llaman del hospital: su mamá tuvo un ACV. El médico dice que tiene que estar
// tranquila, y ella le pide ir juntos a San Rafael. En el viaje caminan juntos al atardecer. En el banco, frente al
// río, Jorge intenta pedirle perdón por la pelea y no le salen las palabras. Ella le dice que ya sabe, y la luz que
// siempre le tapaba la cara se apaga: por primera vez se le ve. Después alguien les saca la foto de la billetera.
// Sigue en Office (despertar de la Sesión 6). No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const FLOOR = 600
const FEET = FLOOR - 70
const WALK = 190
const REVEAL = 260

type Area = 'oficina' | 'hospital' | 'sanrafael'
const AREAS: Record<Area, { x: number; w: number }> = {
  oficina: { x: 0, w: 1600 },
  hospital: { x: 2200, w: 2000 },
  sanrafael: { x: 4800, w: 2900 },
}
const POS = {
  escritorio: 560,
  puertaOficina: 1450,
  entradaHospital: 2320,
  medico: 2900,
  puertaHabitacion: 3300,
  cama: 3820,
  vinedos: 5250,
  alamos: 5900,
  mirador: 6600,
  banco: 7200,
}

type Phase = 'intro' | 'oficina' | 'hospital' | 'habitacion' | 'viaje' | 'banco' | 'fin'
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

export class Dream6 extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private flame!: Phaser.GameObjects.Container
  private flameGlow!: Phaser.GameObjects.Arc
  private warm!: Phaser.GameObjects.Rectangle
  private mama!: Phaser.GameObjects.Image
  private mamaGlow!: Phaser.GameObjects.Arc
  private medico!: Phaser.GameObjects.Image
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text
  private goal!: ReturnType<typeof objective>
  private objs: Reveal[] = []
  private spots: Spot[] = []
  private area: Area = 'oficina'
  private phase: Phase = 'intro'
  private busy = true
  private leaving = false
  private lockUntil = 0
  private facing = 1
  private walkDist = 0
  private stepDist = 0
  private flameScale = 1
  private mamaWalk = 0
  private visto = new Set<string>()
  private f = { telefono: false, medico: false }
  private ring?: Phaser.Time.TimerEvent
  private monitor?: Phaser.Time.TimerEvent
  private tone?: { stop: (fade?: number) => void }
  private birds?: { stop: (fade?: number) => void }

  constructor() {
    super('Dream6')
  }

  create() {
    this.busy = true
    this.leaving = false
    this.phase = 'intro'
    this.facing = 1
    this.flameScale = 1
    this.objs = []
    this.visto = new Set()
    this.f = { telefono: false, medico: false }
    this.birds = undefined
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0b0c10')
    this.drawOficina()
    this.drawHospital()
    this.drawSanRafael()

    this.medico = this.add.image(POS.medico, FLOOR - 75, 'sombra').setDepth(8).setFlipX(true).setTint(0xdfe3ea)
    this.mama = this.add.image(POS.cama, 470, 'mamaMayor0').setDepth(8).setAngle(-90).setVisible(false)
    this.mamaGlow = this.add.circle(0, 0, 22, 0xfff3d6, 0.85).setDepth(8.5).setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
    this.player = this.add.image(POS.escritorio - 8, FLOOR, 'jorgeSentado').setOrigin(0.5, 1).setDepth(10)

    this.flameGlow = this.add.circle(0, 0, 60, 0xffc56b, 0.18).setBlendMode(Phaser.BlendModes.ADD)
    this.flame = this.add.container(this.player.x + 70, FEET - 110, [this.flameGlow, this.add.image(0, 0, 'llama')]).setDepth(790).setAlpha(0)
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
    this.setArea('oficina')
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.centerOn(this.player.x, 360)
    this.tone = startRoomTone()
    this.events.once('shutdown', () => {
      this.tone?.stop(0.5)
      this.birds?.stop()
    })
    void this.run(() => this.intro())
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __dream6?: Dream6 }).__dream6 = this
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

  // La oficina: tubos de luz, escritorios, compañeros sin cara
  private drawOficina() {
    const { x: X, w: Wd } = AREAS.oficina
    const g = this.add.graphics()
    g.fillStyle(0xc9ccd2).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0xb5b9c2).fillRect(X, 0, Wd, 80)
    for (let lx = X + 120; lx < X + Wd; lx += 300) g.fillStyle(0xf4f6fa).fillRect(lx, 84, 160, 10)
    g.fillStyle(0x7a808c).fillRect(X, FLOOR, Wd, 120)
    g.fillStyle(0x9aa3b5).fillRect(X, FLOOR - 120, Wd, 6)
    g.fillStyle(0x8fb3d9).fillRect(900, 200, 300, 160)
    g.lineStyle(6, 0xe0e3e8).strokeRect(900, 200, 300, 160).lineBetween(1050, 200, 1050, 360)
    this.reveal(POS.escritorio, (gg, k) => {
      gg.fillStyle(k(0x8a8f99)).fillRect(POS.escritorio - 120, 470, 240, 14).fillRect(POS.escritorio - 110, 484, 10, 116).fillRect(POS.escritorio + 100, 484, 10, 116)
      // La computadora, un monitor de los gordos
      gg.fillStyle(k(0xd9d4c4)).fillRoundedRect(POS.escritorio + 10, 380, 90, 80, 6).fillRect(POS.escritorio + 40, 460, 30, 10)
      gg.fillStyle(k(0x2f5fb8)).fillRect(POS.escritorio + 20, 390, 70, 56)
      // El teléfono, al costado
      gg.fillStyle(k(0x2b2b2b)).fillRoundedRect(POS.escritorio - 90, 448, 50, 22, 5)
      gg.fillStyle(k(0x3a3a3a)).fillRoundedRect(POS.escritorio - 94, 440, 58, 12, 6)
      gg.fillStyle(k(0xf1efe8)).fillRect(POS.escritorio - 30, 462, 30, 8)
    })
    for (const sx of [250, 1150]) this.add.image(sx, FLOOR - 75, 'sombra').setAlpha(0.6).setDepth(6)
    g.fillStyle(0x6b6f78).fillRect(POS.puertaOficina - 48, 400, 96, 200)
    g.fillStyle(0xc9ced8).fillCircle(POS.puertaOficina - 32, 505, 5)
  }

  // El hospital: pasillo blanco y la habitación con la cama y el monitor
  private drawHospital() {
    const { x: X, w: Wd } = AREAS.hospital
    const g = this.add.graphics()
    g.fillStyle(0xdfe6ec).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x9fc4c8).fillRect(X, FLOOR - 140, Wd, 140)
    g.fillStyle(0xb5bec8).fillRect(X, FLOOR, Wd, 120)
    for (let lx = X + 100; lx < X + Wd; lx += 320) g.fillStyle(0xf8fbff).fillRect(lx, 40, 180, 10)
    g.fillStyle(0xc9d2da).fillRect(POS.puertaHabitacion + 40, 0, 20, FLOOR)
    this.label(2700, 160, 'GUARDIA · INTERNACIÓN', 18, '#5a7a8a')
    // Sillas de espera
    for (const sx of [2500, 2580, 2660]) g.fillStyle(0x5a8aa0).fillRoundedRect(sx - 30, 520, 60, 14, 4).fillRect(sx - 26, 534, 6, 66).fillRect(sx + 20, 534, 6, 66)
    g.fillStyle(0x15171d).fillRect(POS.puertaHabitacion - 55, 392, 110, 208)
    g.fillStyle(0xf1efe8).fillRect(POS.puertaHabitacion - 48, 400, 96, 200)
    this.label(POS.puertaHabitacion, 380, '12', 16, '#2b3140')
    this.reveal(POS.cama, (gg, k) => {
      gg.fillStyle(k(0xb5bec8)).fillRect(POS.cama - 150, 500, 300, 20).fillRect(POS.cama - 140, 520, 10, 80).fillRect(POS.cama + 130, 520, 10, 80)
      gg.fillStyle(k(0xf1efe8)).fillRoundedRect(POS.cama - 150, 480, 300, 30, 6)
      gg.fillStyle(k(0x9fc4e8)).fillRoundedRect(POS.cama - 60, 476, 210, 26, 6)
      // El monitor
      gg.fillStyle(k(0x2b2b2b)).fillRect(POS.cama + 190, 300, 100, 80).fillRect(POS.cama + 236, 380, 8, 220)
      gg.fillStyle(k(0x1a3a2a)).fillRect(POS.cama + 198, 308, 84, 64)
      gg.lineStyle(2, k(0x4fe07a)).lineBetween(POS.cama + 200, 340, POS.cama + 225, 340).lineBetween(POS.cama + 225, 340, POS.cama + 232, 318).lineBetween(POS.cama + 232, 318, POS.cama + 240, 356).lineBetween(POS.cama + 240, 356, POS.cama + 248, 340).lineBetween(POS.cama + 248, 340, POS.cama + 280, 340)
      gg.fillStyle(k(0x8fb3d9)).fillRect(POS.cama - 300, 220, 160, 140)
    })
  }

  // San Rafael, al atardecer: viñedos, álamos, el río y la montaña
  private drawSanRafael() {
    const { x: X, w: Wd } = AREAS.sanrafael
    const g = this.add.graphics()
    g.fillGradientStyle(0xf2b880, 0xf2b880, 0xf6dcb0, 0xf6dcb0, 1).fillRect(X, 0, Wd, 360)
    // Cordillera a lo lejos
    for (let i = 0; i < 9; i++) {
      const cx = X + i * 340 + 120
      g.fillStyle(0xa58a9a).fillTriangle(cx - 260, 360, cx + 260, 360, cx, 160 + (i % 3) * 40)
      g.fillStyle(0xf4efe8).fillTriangle(cx - 46, 196 + (i % 3) * 40, cx + 46, 196 + (i % 3) * 40, cx, 160 + (i % 3) * 40)
    }
    g.fillStyle(0xc9a26a).fillRect(X, 360, Wd, FLOOR - 360)
    g.fillStyle(0x8a6a4a).fillRect(X, FLOOR, Wd, 120)
    this.reveal(POS.vinedos, (gg, k) => {
      for (let r = 0; r < 4; r++) {
        for (let vx = POS.vinedos - 420; vx < POS.vinedos + 420; vx += 34) gg.fillStyle(k(r % 2 ? 0x4f7a3f : 0x5f8a4a)).fillCircle(vx, 470 + r * 30, 15)
        gg.lineStyle(2, k(0x6b4a2e)).lineBetween(POS.vinedos - 430, 476 + r * 30, POS.vinedos + 430, 476 + r * 30)
      }
    })
    this.reveal(POS.alamos, (gg, k) => {
      for (let i = 0; i < 6; i++) {
        const ax = POS.alamos - 250 + i * 100
        gg.fillStyle(k(0x6b4a2e)).fillRect(ax - 5, 330, 10, 270)
        gg.fillStyle(k(i % 2 ? 0xd9b04a : 0x6b8f3a)).fillEllipse(ax, 300, 50, 230)
      }
    })
    this.reveal(POS.mirador, (gg, k) => {
      // El río Atuel, abajo, y la baranda del mirador
      gg.fillStyle(k(0x4f8fb8)).fillRect(POS.mirador - 500, 440, 1300, 56)
      gg.fillStyle(k(0x8fc4e0)).fillRect(POS.mirador - 480, 456, 200, 4).fillRect(POS.mirador - 100, 470, 260, 4).fillRect(POS.mirador + 300, 452, 180, 4)
      gg.fillStyle(k(0xb58a5a)).fillRect(POS.mirador - 500, 496, 1300, 10)
      gg.lineStyle(5, k(0x6b4a2e)).lineBetween(POS.mirador - 300, 500, POS.mirador + 300, 500)
      for (let bx = POS.mirador - 300; bx <= POS.mirador + 300; bx += 60) gg.lineBetween(bx, 500, bx, 540)
    })
    this.label(POS.mirador, 430, 'MIRADOR · RÍO ATUEL', 14, '#5a4636')
    this.reveal(POS.banco, (gg, k) => {
      gg.fillStyle(k(0x7a5236)).fillRect(POS.banco - 90, 528, 180, 10).fillRect(POS.banco - 90, 498, 180, 8)
      gg.fillStyle(k(0x3a3f4d)).fillRect(POS.banco - 84, 538, 8, 62).fillRect(POS.banco + 76, 538, 8, 62)
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
  private at = (x: number, y: number, t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x, y }) })

  private pista(titulo: string, texto: string) {
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
  }

  private setupSpots() {
    const viaje = () => this.phase === 'viaje'
    this.spots = [
      { area: 'oficina', x: POS.escritorio, label: 'Teléfono', when: () => this.phase === 'oficina' && !this.f.telefono, action: () => this.telefono() },
      { area: 'oficina', x: POS.puertaOficina, label: 'Salir', when: () => this.phase === 'oficina' && this.f.telefono, action: () => this.alHospital() },
      { area: 'hospital', x: POS.medico, label: 'Médico', when: () => this.phase === 'hospital', action: () => this.hablarMedico() },
      { area: 'hospital', x: POS.puertaHabitacion, label: 'Habitación 12', when: () => this.phase === 'hospital', action: () => this.entrarHabitacion() },
      { area: 'hospital', x: POS.cama - 140, label: 'Mamá', when: () => this.phase === 'habitacion', action: () => this.hablarMamaCama() },
      { area: 'sanrafael', x: POS.vinedos, label: 'Viñedos', when: viaje, action: () => this.recorrer('vinedos') },
      { area: 'sanrafael', x: POS.alamos, label: 'Álamos', when: viaje, action: () => this.recorrer('alamos') },
      { area: 'sanrafael', x: POS.mirador, label: 'Mirador', when: viaje, action: () => this.recorrer('mirador') },
      { area: 'sanrafael', x: POS.banco, label: 'Banco', when: viaje, action: () => this.banco() },
    ]
  }

  private updateGoal() {
    if (this.phase === 'oficina') this.goal.set(this.f.telefono ? 'Ir al hospital' : 'Atender el teléfono')
    else if (this.phase === 'hospital') this.goal.set(this.f.medico ? 'Ver a mamá' : 'Encontrar a mamá')
    else if (this.phase === 'habitacion') this.goal.set('Hablar con mamá')
    else if (this.phase === 'viaje') this.goal.set(this.visto.size < 2 ? 'Pasear con mamá' : 'Sentarnos en el banco, frente al río')
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
    await say(this, [this.think('Mi oficina.'), this.think('Planillas, mails, el café frío.'), this.think('Tengo… treinta y ocho.')])
    this.flame.setPosition(this.player.x + 70, FEET - 260)
    sfx.flame()
    this.tweens.add({ targets: this.flame, alpha: 1, y: FEET - 110, duration: 1500, ease: 'Sine.Out' })
    await this.wait(1600)
    await say(this, [this.vela('Hola, Jorge.'), this.vela('Hoy es un día importante. Quedate cerca.')])
    // Suena el teléfono, y sigue sonando hasta que lo atiende
    sfx.telefono()
    this.ring = this.time.addEvent({ delay: 2600, loop: true, callback: () => sfx.telefono() })
    this.phase = 'oficina'
    this.updateGoal()
    const help = text(this, 24, this.scale.height - 34, controlsHelp('← → / A D caminar   ·   E examinar / hablar   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa'), 16, '#2b3140')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500 }))
  }

  // La llamada del hospital
  private async telefono() {
    this.f.telefono = true
    this.ring?.remove()
    sfx.click()
    const voz = (t: string): Line => ({ kind: 'intercom', text: t, anchor: () => ({ x: POS.escritorio - 70, y: 400 }) })
    await say(this, [
      this.speak('¿Hola?'),
      voz('¿Jorge? Lo llamamos del hospital.'),
      voz('Su mamá tuvo un ACV. Está estable.'),
      voz('Lo nombró a usted. Es el único contacto que tenemos.'),
      this.think('El único contacto.'),
      this.speak('Voy para allá.'),
    ])
    this.pista('El llamado', 'Me llamaron del hospital a la oficina: mamá tuvo un ACV. Está estable. Yo era su único contacto.')
    // Se levanta
    this.player.setTexture('jorge0').setOrigin(0.5).setPosition(POS.escritorio + 60, FEET)
    this.updateGoal()
  }

  private async alHospital() {
    const cam = this.cameras.main
    sfx.door()
    cam.fadeOut(1200, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.phase = 'hospital'
    this.player.setX(POS.entradaHospital + 60)
    this.flame.setPosition(this.player.x + 70, FEET - 110)
    this.setArea('hospital')
    cam.centerOn(this.player.x, 360)
    cam.fadeIn(1200, 0, 0, 0)
    await this.wait(1200)
    await say(this, [this.think('El hospital.'), this.think('Hace cuánto no la veo… ¿Un año?')])
    this.updateGoal()
  }

  private async hablarMedico() {
    this.f.medico = true
    await say(this, [
      this.medicoSays('¿Usted es el hijo?'),
      this.speak('Sí.'),
      this.medicoSays('Tuvo suerte. Llegó a tiempo.'),
      this.medicoSays('Pero a partir de ahora tiene que estar tranquila. Nada de disgustos.'),
      this.medicoSays('Está en la doce. Lo está esperando.'),
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
    this.player.setX(POS.puertaHabitacion + 160)
    this.mama.setVisible(true)
    this.mamaGlow.setVisible(true)
    cam.fadeIn(400, 0, 0, 0)
    // El monitor
    this.monitor = this.time.addEvent({ delay: 900, loop: true, callback: () => sfx.bip() })
    await this.wait(500)
    await say(this, [this.think('Está tan chiquita.'), this.think('Sigo sin poder verle la cara.')])
    this.updateGoal()
  }

  // En el hospital ella le pide el viaje
  private async hablarMamaCama() {
    await say(this, [
      this.mamaSays('Viniste.'),
      this.speak('Claro que vine, ma.'),
      this.mamaSays('El médico dice que tengo que estar tranquila.'),
      this.mamaSays('Yo siempre quise ir a San Rafael. Al río, a ver los álamos…'),
      this.mamaSays('¿Me acompañás?'),
    ])
    const i = await choose(this, ['"Sí, ma."', '"No sé si puedo, con el trabajo…"'], { x: 640, y: 640 })
    await say(this, i === 0
      ? [this.speak('Sí, ma. Vamos.')]
      : [this.speak('No sé si puedo, con el trabajo…'), this.mamaSays('Ya sé que estás ocupado.'), this.think('Me miró. Ya no me pidió nada más.'), this.speak('…Vamos. Sí. Vamos.')])
    this.pista('El hospital', 'Después del ACV, el médico dijo que mamá tenía que estar tranquila. Ella me pidió que la acompañara a San Rafael. Le dije que sí.')
    await say(this, [this.vela('Eso fue lo que ella pidió, Jorge.')])
    this.monitor?.remove()
    await this.alViaje()
  }

  private async alViaje() {
    const cam = this.cameras.main
    cam.fadeOut(1500, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    const card = text(this, this.scale.width / 2, 340, '12 de agosto', 30, '#e8e8e8').setOrigin(0.5).setScrollFactor(0).setDepth(1300)
    const card2 = text(this, this.scale.width / 2, 384, 'San Rafael, Mendoza', 20, '#aab2c4').setOrigin(0.5).setScrollFactor(0).setDepth(1300)
    await this.wait(2600)
    card.destroy()
    card2.destroy()
    this.phase = 'viaje'
    this.player.setX(POS.vinedos - 350)
    this.mama.setTexture('mamaMayor0').setAngle(0).setPosition(POS.vinedos - 280, FLOOR - 70)
    this.flame.setPosition(this.player.x + 70, FEET - 110)
    this.setArea('sanrafael')
    this.warm.setFillStyle(0xffb060, 0.06)
    cam.centerOn(this.player.x, 360)
    this.birds = startPajaros()
    cam.fadeIn(1500, 0, 0, 0)
    await this.wait(1500)
    await say(this, [this.think('San Rafael.'), this.mamaSays('¡Mirá eso, Jorge! La montaña tiene nieve.'), this.think('Hacía años que no la escuchaba así.')])
    this.updateGoal()
  }

  private async recorrer(id: string) {
    const lines: Record<string, Line[]> = {
      vinedos: [this.mamaSays('Tu abuelo decía que algún día íbamos a tener una viña.'), this.mamaSays('Nunca tuvimos ni una planta.'), this.think('Se ríe. Me había olvidado de cómo se ríe.')],
      alamos: [this.mamaSays('Los álamos. Parecen soldaditos, ¿no?'), this.mamaSays('Vos de chico les tenías miedo a los árboles altos.'), this.speak('¿Yo?'), this.mamaSays('Me agarrabas la mano y no me soltabas.')],
      mirador: [this.mamaSays('El Atuel.'), this.mamaSays('Qué lindo es esto, hijo. Gracias por traerme.'), this.think('No me agradezcas.')],
    }
    await say(this, lines[id])
    this.visto.add(id)
    this.updateGoal()
  }

  // En el banco, frente al río: el perdón que no le sale, y la cara
  private async banco() {
    if (this.visto.size < 2) {
      await say(this, [this.mamaSays('Esperá, que quiero ver un poco más.')])
      return
    }
    this.phase = 'banco'
    this.goal.set(null)
    this.player.setTexture('jorgeSentado').setOrigin(0.5, 1).setFlipX(false).setPosition(POS.banco - 50, FLOOR - 2)
    this.mama.setTexture('mamaMayorSentada').setOrigin(0.5, 1).setFlipX(true).setPosition(POS.banco + 50, FLOOR - 2)
    this.facing = 1
    this.cameras.main.stopFollow()
    this.cameras.main.pan(POS.banco, 360, 900, 'Sine.easeInOut')
    // El río y el banco ya se recuerdan enteros
    for (const o of this.objs) {
      if (o.revealed || Math.abs(o.x - POS.banco) > 900) continue
      o.revealed = true
      this.tweens.add({ targets: o.color, alpha: 1, duration: 1200 })
    }
    await this.wait(1000)
    await say(this, [this.mamaSays('Qué silencio que hay acá.'), this.think('Tengo que decírselo. Ahora.')])
    await choose(this, ['Pedirle perdón'], { x: 640, y: 640 })
    // No le salen las palabras: cada intento es más corto
    await say(this, [
      this.speak('Ma… lo de esa noche…'),
      this.speak('Cuando me fui de casa… yo…'),
      this.speak('Yo te…'),
      this.think('No me sale.'),
      this.think('Veinte años y no me sale.'),
    ])
    await this.wait(900)
    await say(this, [this.mamaSays('Ya sé, hijo.'), this.mamaSays('Ya sé.')])
    // La luz que siempre le tapaba la cara se apaga: por primera vez se le ve. La cámara se acerca a ella
    const cam = this.cameras.main
    cam.pan(this.mama.x - 10, this.mama.getTopCenter().y + 40, 2200, 'Sine.easeInOut')
    cam.zoomTo(2, 2200, 'Sine.easeInOut')
    await this.wait(1200)
    sfx.flame()
    this.flameScale = 1.6
    this.tweens.add({ targets: this.warm, fillAlpha: 0.14, duration: 2500 })
    await this.tween({ targets: this.mamaGlow, alpha: 0, scale: 0.4, duration: 3200, ease: 'Sine.InOut' })
    this.mamaGlow.setVisible(false)
    await this.wait(600)
    await say(this, [this.think('Mamá.'), this.think('Le veo la cara.'), this.think('Se está riendo.'), this.vela('Ahí está, Jorge.')])
    cam.zoomTo(1, 1800, 'Sine.easeInOut')
    cam.pan(POS.banco, 360, 1800, 'Sine.easeInOut')
    await this.wait(1900)
    this.pista('El banco, frente al río', 'En San Rafael, frente al río, quise pedirle perdón a mamá por esa noche. No me salieron las palabras. Ella me dijo "ya sé, hijo". Y por primera vez le vi la cara.')
    await this.foto()
  }

  // Alguien que pasa les saca la foto: la de la billetera
  private async foto() {
    const turista = this.add.image(POS.banco + 260, FLOOR - 75, 'sombra').setDepth(7).setFlipX(true).setAlpha(0)
    await this.tween({ targets: turista, alpha: 0.85, x: POS.banco + 200, duration: 1200 })
    await say(this, [this.at(POS.banco + 200, 450, '¿Les saco una foto?'), this.mamaSays('¡Sí! Dale, Jorge, acercate.')])
    sfx.flash()
    await this.wait(300)
    const flash = this.add.rectangle(0, 0, 1280, 720, 0xffffff, 0.95).setOrigin(0).setScrollFactor(0).setDepth(1100)
    await this.tween({ targets: flash, alpha: 0, duration: 900 })
    flash.destroy()
    await showPage(this, 'foto', 0)
    await showPage(this, 'foto', 1)
    await say(this, [this.think('La foto de la billetera.'), this.think('12/08.'), this.think('Por eso la llevo siempre encima.')])
    this.pista('La foto del 12/08', 'La foto de la billetera es de San Rafael. Nos la sacó alguien que pasaba, en el banco frente al río. Atrás, mamá escribió la fecha: 12/08.')
    this.tween({ targets: turista, alpha: 0, x: POS.banco + 320, duration: 1500 }).then(() => turista.destroy())
    await this.wait(800)
    await say(this, [this.mamaSays('Me hiciste muy feliz con este viaje, Jorge.'), this.vela('Quedate un rato acá, Jorge. Todo el que quieras.')])
    await this.wait(1500)
    await say(this, [this.vela('Vas a despertar.')])
    if (!state.lineaDeTiempo.includes('Adultez: el viaje')) state.lineaDeTiempo.push('Adultez: el viaje')
    this.phase = 'fin'
    this.leaving = true
    const cam = this.cameras.main
    cam.fadeOut(3200, 255, 236, 200)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.birds?.stop()
    await this.wait(900)
    this.scene.start('Office', { despertar: true, sesion: 6 })
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
    if (this.phase !== 'intro' && this.phase !== 'banco') {
      const tx = this.player.x + 70 * this.facing
      const ty = FEET - 110 + Math.sin(time / 420) * 8
      const k = 1 - Math.exp(-dt / 260)
      this.flame.x += (tx - this.flame.x) * k
      if (!this.tweens.isTweening(this.flame)) this.flame.y += (ty - this.flame.y) * k
      // Cerca de la mamá, la llama crece
      const calor = this.mama.visible ? Math.max(0, 1 - Math.abs(this.mama.x - this.player.x) / 420) : 0
      this.flameScale += (1 + calor * 0.5 - this.flameScale) * k
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
    // La luz que le tapa la cara a la mamá (hasta el banco)
    if (this.mamaGlow.visible) {
      const top = this.mama.angle !== 0 ? { x: this.mama.x - 48, y: this.mama.y } : { x: this.mama.x - 2, y: this.mama.getTopCenter().y + 23 }
      this.mamaGlow.setPosition(top.x, top.y)
    }
    // En el viaje, la mamá camina al lado de Jorge
    if (this.phase === 'viaje' && !this.tweens.isTweening(this.mama)) {
      const dx = this.player.x + 80 * this.facing - this.mama.x
      if (Math.abs(dx) > 40) {
        this.mama.x += Math.sign(dx) * Math.min(Math.abs(dx), WALK * 0.9 * (dt / 1000))
        this.mamaWalk += dt
        this.mama.setTexture(Math.floor(this.mamaWalk / 200) % 2 === 0 ? 'mamaMayor1' : 'mamaMayor2').setFlipX(dx < 0)
      } else this.mama.setTexture('mamaMayor0')
    }

    const k = this.keys
    const ePressed = Phaser.Input.Keyboard.JustDown(k.E)
    const tabPressed = Phaser.Input.Keyboard.JustDown(k.TAB)
    if (this.busy || time < this.lockUntil) return

    if (tabPressed) {
      void this.run(() => openDiary(this))
      return
    }

    const r = AREAS[this.area]
    const sentado = this.player.texture.key === 'jorgeSentado'
    const dir = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0)
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
      const people = ['Teléfono', 'Médico', 'Mamá', 'Salir', 'Habitación 12']
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

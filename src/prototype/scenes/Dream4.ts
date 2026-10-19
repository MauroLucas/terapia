import * as Phaser from 'phaser'
import { FONT, makeTextures } from '../art'
import { sfx, startDrone, startRoomTone } from '../audio'
import { showPage } from '../documents'
import { addPista, state } from '../state'
import { controlsHelp } from '../touch'
import { choose, eyelids, objective, say, text, toast, type Line, type Point } from '../ui'
import { openDiary } from './diary'

// Sesión 4: la pelea. Jorge tiene unos 20 años. Todo pasa el mismo día.
//   Departamento (de día, vacío): [cuarto] [pasillo: el inmobiliario | salida] [cocina: ventana]
//   Casa de la mamá (de noche):   [cuarto de Jorge: cama con el bolso, placard, escritorio] [pasillo] [puerta de calle]
// A la mañana, Jorge y María recorren el departamento que van a alquilar. Cuando el inmobiliario los deja solos,
// María le dice que se va a estudiar a Córdoba, y cortan. A la noche, mientras arma el bolso, la mamá le da el
// número del papá. Insiste, él se cierra, ella le dice que se está pareciendo a él, y la imagen se rompe:
// el jugador no hace el empujón. Lo siguiente es ella en el piso. Jorge se guarda el papelito y se va.
// Vela trata de hablarle, pero Jorge está nublado por el odio: su voz llega rota y la llama casi se apaga.
// Sigue en Office (despertar de la Sesión 4). No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const FLOOR = 600
const SCALE = 1 // Jorge a los 20: ya tiene su altura
const FEET = FLOOR - 70 * SCALE
const WALK = 200
const REVEAL = 250

type Area = 'depto' | 'casa'
const AREAS: Record<Area, { x: number; w: number }> = {
  depto: { x: 0, w: 2600 },
  casa: { x: 3200, w: 2200 },
}
const POS = {
  cama: 420,
  comoda: 760,
  inmobiliario: 1300,
  salidaDepto: 1560,
  heladera: 2050,
  ventana: 2380,
  camaJorge: 3500,
  placard: 3820,
  escritorio: 4120,
  puertaCuarto: 4380,
  mamaEntra: 4300,
  puertaCalle: 5250,
}

type Phase = 'intro' | 'visita' | 'solos' | 'casa' | 'pelea' | 'despues' | 'fin'
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

// La voz de Vela llega rota: Jorge no la puede escuchar. Se pierden letras, cada vez más
function romper(t: string, cuanto: number) {
  return t
    .split('')
    .map((ch) => (ch !== ' ' && Math.random() < cuanto ? '·' : ch))
    .join('')
}

export class Dream4 extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private flame!: Phaser.GameObjects.Container
  private flameGlow!: Phaser.GameObjects.Arc
  private flameImg!: Phaser.GameObjects.Image
  private dark!: Phaser.GameObjects.Image
  private rage!: Phaser.GameObjects.Rectangle
  private maria!: Phaser.GameObjects.Image
  private inmo!: Phaser.GameObjects.Image
  private mama!: Phaser.GameObjects.Image
  private mamaGlow!: Phaser.GameObjects.Arc
  private papelito?: Phaser.GameObjects.Image
  private bolso!: Phaser.GameObjects.Graphics
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
  private visto = new Set<string>()
  private bolsoCosas = new Set<string>()
  private f = { papelito: false, mama: false }
  private tone?: { stop: (fade?: number) => void }
  private drone?: { stop: (fade?: number) => void }

  constructor() {
    super('Dream4')
  }

  create() {
    this.busy = true
    this.leaving = false
    this.phase = 'intro'
    this.facing = 1
    this.flameScale = 1
    this.objs = []
    this.visto = new Set()
    this.bolsoCosas = new Set()
    this.f = { papelito: false, mama: false }
    this.papelito = undefined
    this.drone = undefined
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0b0c10')
    this.drawDepto()
    this.drawCasa()

    this.maria = this.add.image(POS.cama + 120, FLOOR - 70, 'maria0').setDepth(8).setFlipX(true)
    // El inmobiliario: sin cara, como la gente que no importa en los sueños. Con una carpeta
    this.inmo = this.add.image(POS.inmobiliario, FLOOR - 75, 'sombra').setDepth(8).setFlipX(true).setTint(0x8a90a0)
    this.add.rectangle(POS.inmobiliario - 22, FLOOR - 92, 26, 34, 0x2f5fb8).setDepth(8.5)
    this.mama = this.add.image(POS.mamaEntra, FLOOR - 75, 'mama').setDepth(8).setFlipX(true).setVisible(false)
    this.mamaGlow = this.add.circle(0, 0, 22, 0xfff3d6, 0.6).setDepth(8).setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
    this.player = this.add.image(POS.cama - 60, FEET, 'jorge0').setScale(SCALE).setDepth(10)

    this.flameGlow = this.add.circle(0, 0, 60, 0xffc56b, 0.18).setBlendMode(Phaser.BlendModes.ADD)
    this.flameImg = this.add.image(0, 0, 'llama')
    this.flame = this.add.container(this.player.x + 70, FEET - 110, [this.flameGlow, this.flameImg]).setDepth(790).setAlpha(0)
    this.dark = this.add.image(this.player.x, FEET - 40, this.darkness()).setDepth(780).setAlpha(0)
    this.rage = this.add.rectangle(0, 0, 1280, 720, 0x6a0a0a, 0).setOrigin(0).setScrollFactor(0).setDepth(777).setBlendMode(Phaser.BlendModes.MULTIPLY)

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
    this.events.once('shutdown', () => {
      this.tone?.stop(0.5)
      this.drone?.stop(0.5)
    })
    void this.run(() => this.intro())
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __dream4?: Dream4 }).__dream4 = this
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

  // El departamento de la Casa de Jorge, veinte años antes: vacío, con luz de día, lleno de planes
  private drawDepto() {
    const { x: X, w: Wd } = AREAS.depto
    const g = this.add.graphics()
    g.fillStyle(0xd9d6cc).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0xc9c5b8).fillRect(X, 0, Wd, 90)
    g.fillStyle(0x8a6a4a).fillRect(X, FLOOR, Wd, 120)
    for (let lx = X; lx < X + Wd; lx += 80) g.fillStyle(lx % 160 === 0 ? 0x94744f : 0x8a6a4a).fillRect(lx, FLOOR, 80, 120)
    for (const wx of [1000, 1800]) g.fillStyle(0xbfbbad).fillRect(wx - 10, 90, 20, FLOOR - 90)
    this.label(500, 120, 'CUARTO', 14, '#9a968a')
    this.label(1400, 120, 'PASILLO', 14, '#9a968a')
    this.label(2200, 120, 'COCINA', 14, '#9a968a')
    // Sol que entra por las ventanas
    for (const [wx, ww] of [[560, 200], [2380, 160]] as [number, number][]) {
      g.fillStyle(0x9fc4e8).fillRect(wx - ww / 2, 200, ww, 170)
      g.lineStyle(5, 0xf1efe8).strokeRect(wx - ww / 2, 200, ww, 170).lineBetween(wx, 200, wx, 370)
      this.add.rectangle(wx + 60, 470, ww + 80, 260, 0xfff2c0, 0.16).setDepth(1).setBlendMode(Phaser.BlendModes.ADD).setAngle(-8)
    }
    // Marcas en el piso y la pared: lo que todavía no hay
    this.reveal(POS.cama, (gg, k) => {
      gg.lineStyle(2, k(0xb5a990), 0.9)
      for (let i = 0; i < 6; i++) gg.lineBetween(POS.cama - 140 + i * 50, FLOOR - 4, POS.cama - 120 + i * 50, FLOOR - 4)
      gg.fillStyle(k(0xa5784a)).fillRect(POS.cama - 60, FLOOR - 26, 60, 26)
      gg.fillStyle(k(0xd8c49a)).fillRect(POS.cama - 60, FLOOR - 16, 60, 4)
    })
    this.reveal(POS.comoda, (gg, k) => {
      gg.fillStyle(k(0xe6e2d6)).fillRect(POS.comoda - 70, 300, 140, 110)
      gg.lineStyle(2, k(0xb5a990)).strokeRect(POS.comoda - 70, 300, 140, 110)
    })
    // El inmobiliario, la puerta de entrada
    g.fillStyle(0x6b5232).fillRect(POS.salidaDepto - 48, 400, 96, 200)
    g.fillStyle(0xc9b46a).fillCircle(POS.salidaDepto - 32, 505, 5)
    this.reveal(POS.heladera, (gg, k) => {
      gg.fillStyle(k(0xe0ddd2)).fillRect(1900, 500, 420, 100)
      gg.fillStyle(k(0x9aa3b5)).fillRect(1894, 492, 432, 10)
      gg.lineStyle(2, k(0xb5a990)).strokeRect(POS.heladera - 40, 340, 80, 260)
    })
    this.reveal(POS.ventana, (gg, k) => {
      gg.fillStyle(k(0x6b8f6b)).fillRect(POS.ventana - 70, 372, 140, 8)
    })
  }

  // La casa de la mamá, de noche: el cuarto de Jorge a medio vaciar
  private drawCasa() {
    const { x: X, w: Wd } = AREAS.casa
    const g = this.add.graphics()
    g.fillStyle(0x4a4639).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x3d3a30).fillRect(X, 0, Wd, 70)
    g.lineStyle(1, 0x55503f)
    for (let lx = X + 20; lx < X + Wd; lx += 40) g.lineBetween(lx, 70, lx, FLOOR - 120)
    g.fillStyle(0x34312a).fillRect(X, FLOOR - 120, Wd, 120)
    g.fillStyle(0x24211c).fillRect(X, FLOOR, Wd, 120)
    for (let lx = X; lx < X + Wd; lx += 60) g.fillStyle(lx % 120 === 0 ? 0x2c2822 : 0x24211c).fillRect(lx, FLOOR, 60, 120)
    g.fillStyle(0x3a352c).fillRect(POS.puertaCuarto + 40, 70, 20, FLOOR - 70)
    // Lámpara del cuarto
    this.add.circle(3800, 180, 240, 0xffd28a, 0.08).setDepth(781).setBlendMode(Phaser.BlendModes.ADD)
    this.reveal(POS.camaJorge, (gg, k) => {
      gg.fillStyle(k(0x6b4a2e)).fillRect(3380, 520, 260, 30).fillRect(3380, 470, 14, 130).fillRect(3626, 500, 14, 100)
      gg.fillStyle(k(0x8a3a3a)).fillRoundedRect(3394, 498, 232, 26, 6)
      // La caja con su nombre, todavía debajo de la cama
      gg.fillStyle(k(0x9a7a4e)).fillRect(3420, 560, 90, 36)
    })
    this.label(3465, 580, 'JORGE', 11, '#4a3622')
    this.bolso = this.add.graphics().setDepth(4)
    this.drawBolso()
    this.reveal(POS.placard, (gg, k) => {
      gg.fillStyle(k(0x7a5a3a)).fillRect(POS.placard - 90, 300, 180, 300)
      gg.lineStyle(2, k(0x4a3622)).lineBetween(POS.placard, 300, POS.placard, 600)
      gg.fillStyle(k(0x5b7fae)).fillRect(POS.placard + 10, 330, 60, 90)
      gg.fillStyle(k(0x3e7d3c)).fillRect(POS.placard - 70, 330, 50, 80)
    })
    this.reveal(POS.escritorio, (gg, k) => {
      gg.fillStyle(k(0x7a5a3a)).fillRect(POS.escritorio - 85, 500, 170, 12).fillRect(POS.escritorio - 75, 512, 10, 88).fillRect(POS.escritorio + 65, 512, 10, 88)
      // La foto de la fiesta, en un marquito
      gg.fillStyle(k(0x2a2238)).fillRect(POS.escritorio - 20, 470, 30, 30)
      gg.fillStyle(k(0x3e7d3c)).fillRect(POS.escritorio - 14, 482, 7, 16)
      gg.fillStyle(k(0x8a3048)).fillRect(POS.escritorio - 4, 482, 7, 16)
    })
    // Puerta del cuarto (abierta) y puerta de calle
    g.fillStyle(0x15171d).fillRect(POS.puertaCalle - 55, 392, 110, 208)
    g.fillStyle(0x553a28).fillRect(POS.puertaCalle - 48, 400, 96, 200)
    g.fillStyle(0xc9b46a).fillCircle(POS.puertaCalle - 32, 505, 5)
  }

  private drawBolso() {
    const n = this.bolsoCosas.size
    this.bolso.clear()
    this.bolso.fillStyle(0x2f3a52).fillRoundedRect(3470, 470 - n * 4, 120, 34 + n * 4, 10)
    this.bolso.lineStyle(3, 0x1b2233).strokeRoundedRect(3470, 470 - n * 4, 120, 34 + n * 4, 10)
    this.bolso.lineStyle(4, 0x1b2233).beginPath().arc(3530, 470 - n * 4, 26, Math.PI, 0).strokePath()
  }

  // ---------- Personajes y líneas ----------

  private jorgeHead = (): Point => {
    const t = this.player.getTopCenter()
    return { x: t.x + 6 * this.facing, y: t.y }
  }
  private think = (t: string): Line => ({ kind: 'thought', text: t, anchor: this.jorgeHead })
  private speak = (t: string): Line => ({ kind: 'speech', text: t, anchor: this.jorgeHead })
  private vela = (t: string): Line => ({ kind: 'intercom', text: t, anchor: () => ({ x: this.flame.x, y: this.flame.y - 20 }) })
  private says = (img: Phaser.GameObjects.Image) => (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: img.x, y: img.getTopCenter().y }) })
  private mariaSays = (t: string) => this.says(this.maria)(t)
  private inmoSays = (t: string) => this.says(this.inmo)(t)
  private mamaSays = (t: string) => this.says(this.mama)(t)

  private pista(titulo: string, texto: string) {
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
  }

  private setupSpots() {
    const visita = () => this.phase === 'visita'
    const casa = () => this.phase === 'casa'
    this.spots = [
      { area: 'depto', x: POS.cama, label: 'Cuarto', when: visita, action: () => this.planear('cama') },
      { area: 'depto', x: POS.comoda, label: 'Rincón', when: visita, action: () => this.planear('comoda') },
      { area: 'depto', x: POS.heladera, label: 'Cocina', when: visita, action: () => this.planear('heladera') },
      { area: 'depto', x: POS.ventana, label: 'Ventana', when: visita, action: () => this.planear('ventana') },
      { area: 'depto', x: POS.inmobiliario, label: 'Inmobiliario', when: visita, action: () => this.hablarInmo() },
      { area: 'depto', x: POS.salidaDepto, label: 'Salir', when: visita, action: () => say(this, [this.think('Todavía no. María quiere verlo todo.')]) },
      { area: 'casa', x: POS.placard, label: 'Placard', when: casa, action: () => this.guardar('ropa') },
      { area: 'casa', x: POS.camaJorge, label: 'Caja', when: casa, action: () => this.guardar('caja') },
      { area: 'casa', x: POS.escritorio, label: 'Foto', when: casa, action: () => this.guardar('foto') },
      { area: 'casa', x: POS.puertaCalle, label: 'Salir', when: () => casa() || this.phase === 'despues', action: () => this.salirCasa() },
      { area: 'casa', x: POS.mamaEntra - 120, label: 'Papelito', when: () => this.phase === 'despues' && !this.f.papelito, action: () => this.levantarPapelito() },
      { area: 'casa', x: POS.mamaEntra - 20, label: 'Mamá', when: () => this.phase === 'despues' && !this.f.mama, action: () => this.mamaEnElPiso() },
    ]
  }

  private updateGoal() {
    if (this.phase === 'visita') this.goal.set(`Recorrer el departamento con María (${Math.min(3, this.visto.size)}/3)`)
    else if (this.phase === 'casa') this.goal.set(`Armar el bolso (${this.bolsoCosas.size}/3)`)
    else if (this.phase === 'despues') this.goal.set(this.f.papelito ? 'Irme' : null)
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
    await say(this, [this.think('Este departamento…'), this.think('Es mi casa. Pero está vacía.'), this.think('Tengo veinte años.')])
    this.flame.setPosition(this.player.x + 70, FEET - 260)
    sfx.flame()
    this.tweens.add({ targets: this.flame, alpha: 1, y: FEET - 110, duration: 1500, ease: 'Sine.Out' })
    await this.wait(1600)
    await say(this, [
      this.vela('Estoy acá, Jorge.'),
      this.vela('Hoy va a ser un día largo. Pase lo que pase, no te suelto.'),
      this.mariaSays('¿Viste la luz que entra? Es perfecto.'),
      this.inmoSays('Luminoso, ¿eh? Ideal para una pareja que arranca.'),
    ])
    this.phase = 'visita'
    this.updateGoal()
    const help = text(this, 24, this.scale.height - 34, controlsHelp('← → / A D caminar   ·   E examinar / hablar   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa'), 16, '#2b3140')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500 }))
  }

  // María imagina cómo va a ser la casa de los dos
  private async planear(id: string) {
    const x = { cama: POS.cama, comoda: POS.comoda, heladera: POS.heladera, ventana: POS.ventana }[id]!
    await this.tween({ targets: this.maria, x: x + 90, duration: Math.min(1600, Math.abs(this.maria.x - x - 90) * 2 + 200) })
    this.maria.setFlipX(true)
    const lines: Record<string, Line[]> = {
      cama: [this.mariaSays('Acá va la cama. Mirando a la ventana.'), this.mariaSays('Para que el sol nos despierte.')],
      comoda: [this.mariaSays('Y en este rincón, una cómoda.'), this.mariaSays('Con la foto de la fiesta arriba.'), this.think('La del portarretratos.')],
      heladera: [this.mariaSays('Y acá va tu heladera.'), this.speak('La que traigo yo.'), this.mariaSays('Obvio. Era el trato.')],
      ventana: [this.mariaSays('No tiene balcón…'), this.mariaSays('Las plantas van en la ventana, entonces.')],
    }
    await say(this, lines[id])
    const nuevo = !this.visto.has(id)
    this.visto.add(id)
    this.updateGoal()
    if (nuevo && this.visto.size === 3) await this.solos()
  }

  private async hablarInmo() {
    await say(this, [
      this.inmoSays('Dos ambientes, expensas bajas, a dos cuadras del colectivo.'),
      this.inmoSays('Piénsenlo tranquilos. El lunes me avisan.'),
    ])
  }

  // El inmobiliario los deja solos y María corta
  private async solos() {
    this.phase = 'solos'
    this.goal.set(null)
    await say(this, [this.inmoSays('Los dejo solos un minuto, chicos.')])
    sfx.door()
    await this.tween({ targets: this.inmo, x: POS.salidaDepto, alpha: 0, duration: 1600 })
    await this.wait(600)
    this.maria.setFlipX(this.player.x < this.maria.x)
    await say(this, [
      this.mariaSays('Jorge… tengo que decirte algo.'),
      this.mariaSays('Me salió la beca. En Córdoba.'),
      this.mariaSays('Son cinco años.'),
      this.think('Cinco años.'),
      this.mariaSays('No quiero que me esperes. No sería justo para vos.'),
    ])
    const i = await choose(this, ['"No te vayas."', '"Andá. Es tu beca."'], { x: 640, y: 640 })
    // Elija lo que elija, lo que dijo ese día fue otra cosa: el recuerdo no se puede cambiar
    await say(this, [
      this.think(i === 0 ? 'Quise decirle que no se fuera.' : 'Quise decirle que estaba orgulloso.'),
      this.speak('Andate, entonces. Total, todos se van.'),
      this.vela('Así fue, Jorge. No se puede cambiar.'),
      this.mariaSays('No lo digas así…'),
      this.mariaSays('No quiero que terminemos así.'),
    ])
    await this.tween({ targets: this.maria, x: POS.salidaDepto, alpha: 0, duration: 2200 })
    sfx.door()
    this.flameScale = 0.7
    await this.wait(800)
    await say(this, [this.think('Se fue.'), this.think('Y yo me quedé acá. En la casa que iba a ser de los dos.')])
    this.pista('El departamento', 'Fuimos a ver el departamento con María. Ella imaginaba dónde iba cada cosa. Cuando nos quedamos solos, me dijo que se iba a Córdoba. Le dije "andate, entonces". Cortamos ahí.')
    await say(this, [this.vela('Ese mismo día, a la noche, volviste a la casa de tu mamá.')])
    await this.aLaNoche()
  }

  private async aLaNoche() {
    const cam = this.cameras.main
    cam.fadeOut(1600, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.phase = 'casa'
    this.player.setX(POS.camaJorge + 200)
    this.flame.setPosition(this.player.x + 70, FEET - 110)
    this.setArea('casa')
    this.dark.setAlpha(0.7)
    cam.centerOn(this.player.x, 360)
    cam.fadeIn(1600, 0, 0, 0)
    await this.wait(1600)
    await say(this, [this.think('Mi cuarto, en la casa de mamá.'), this.think('Me voy a vivir solo al departamento.'), this.think('Solo.')])
    this.updateGoal()
  }

  private async guardar(id: string) {
    if (this.bolsoCosas.has(id)) {
      await say(this, [this.think('Ya está en el bolso.')])
      return
    }
    const lines: Record<string, Line[]> = {
      ropa: [this.think('La ropa. Lo que entre.')],
      caja: [this.think('La caja con mi nombre.'), this.think('Mamá guardó todo esto. La sortija, el cuaderno…'), this.think('Me la llevo.')],
      foto: [this.think('La foto de la fiesta.'), this.think('No sé para qué me la llevo.'), this.think('Me la llevo igual.')],
    }
    sfx.paper()
    await say(this, lines[id])
    this.bolsoCosas.add(id)
    this.drawBolso()
    this.updateGoal()
    if (this.bolsoCosas.size === 3) await this.llegaMama()
  }

  // La mamá le da el número del papá. Insiste. Jorge se cierra, y Vela no llega a hablarle
  private async llegaMama() {
    this.phase = 'pelea'
    this.goal.set(null)
    await this.wait(700)
    sfx.kick('caja', 0.4)
    await this.wait(500)
    this.mama.setVisible(true).setPosition(POS.puertaCuarto, FLOOR - 75).setAlpha(0)
    this.mamaGlow.setVisible(true)
    await this.tween({ targets: this.mama, alpha: 1, x: POS.mamaEntra, duration: 1200 })
    this.facing = 1
    this.player.setFlipX(false)
    this.drone = startDrone()
    await say(this, [
      this.mamaSays('¿Ya te vas?'),
      this.speak('Sí.'),
      this.mamaSays('Jorge… tomá. Es el número de tu papá.'),
    ])
    // El papelito: se lo da, él no lo agarra
    this.papelito = this.add.image(POS.mamaEntra - 50, FLOOR - 110, 'papelito').setDepth(9)
    await say(this, [
      this.mamaSays('Está mal. Muy mal.'),
      this.mamaSays('No quiero que vivas con rencor, hijo. Ni con culpa.'),
      this.speak('No.'),
      this.vela(romper('Jorge, respirá. Escuchala.', 0.15)),
      this.mamaSays('Llamalo una vez. Una sola.'),
      this.think('Siempre lo mismo. Siempre él.'),
    ])
    this.tweens.add({ targets: this.rage, fillAlpha: 0.45, duration: 3000 })
    await say(this, [
      this.speak('¡Te dije que no!'),
      this.vela(romper('Jorge, mirame. Estoy acá.', 0.45)),
      this.mamaSays('Jorge, por favor…'),
      this.vela(romper('No es él. Es tu mamá.', 0.75)),
      this.mamaSays('Te estás pareciendo a él.'),
      this.mamaSays('Vas a terminar como tu padre.'),
    ])
    await this.romperImagen()
  }

  // La imagen se rompe como un vidrio. El jugador no hace el empujón: lo siguiente es ella en el piso
  private async romperImagen() {
    this.drone?.stop(0.1)
    const { width, height } = this.scale
    const cx = width / 2 + Phaser.Math.Between(-60, 60)
    const cy = height / 2 - 40
    const g = this.add.graphics().setScrollFactor(0).setDepth(1150)
    const grietas: [number, number][][] = []
    for (let i = 0; i < 11; i++) {
      const ang = (Math.PI * 2 * i) / 11 + Math.random() * 0.4
      const pts: [number, number][] = [[cx, cy]]
      let r = 0
      while (r < 900) {
        r += 60 + Math.random() * 90
        const a = ang + (Math.random() - 0.5) * 0.35
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
      }
      grietas.push(pts)
    }
    sfx.vidrio()
    this.cameras.main.shake(260, 0.012)
    // Las grietas aparecen en tres golpes, desde el centro
    for (let paso = 1; paso <= 3; paso++) {
      g.clear()
      g.lineStyle(2.5, 0xf2f4f8, 0.95)
      for (const pts of grietas) {
        const n = Math.ceil((pts.length * paso) / 3)
        g.beginPath()
        g.moveTo(pts[0][0], pts[0][1])
        for (let i = 1; i < n; i++) g.lineTo(pts[i][0], pts[i][1])
        g.strokePath()
      }
      g.lineStyle(1.5, 0xf2f4f8, 0.6)
      for (let k = 1; k <= paso; k++) g.strokeCircle(cx, cy, 70 * k + Math.random() * 20)
      await this.wait(180)
    }
    await this.wait(500)
    // Se cae a pedazos: todo a negro
    const black = this.add.rectangle(0, 0, width, height, 0x000000, 0).setOrigin(0).setScrollFactor(0).setDepth(1140)
    await this.tween({ targets: black, fillAlpha: 1, duration: 900 })
    await this.tween({ targets: g, alpha: 0, duration: 700 })
    g.destroy()
    this.tone?.stop(0.2)
    await this.wait(1800)
    // Después: ella en el piso. El papelito, en el piso también
    this.phase = 'despues'
    this.mama.setTexture('mamaAgachada').setPosition(POS.mamaEntra + 10, FLOOR - 70).setAngle(-8)
    this.papelito?.setPosition(POS.mamaEntra - 120, FLOOR - 6).setAngle(80)
    this.player.setX(POS.mamaEntra - 240)
    this.flameScale = 0.35
    this.rage.setFillStyle(0x6a0a0a, 0.3)
    this.tone = startRoomTone()
    await this.tween({ targets: black, fillAlpha: 0, duration: 1800 })
    black.destroy()
    await say(this, [this.think('¿Qué hice?'), this.mamaSays('Ay… mi brazo…')])
    this.updateGoal()
  }

  private async mamaEnElPiso() {
    this.f.mama = true
    const i = await choose(this, ['Ayudarla a levantarse', 'Pedirle perdón'], { x: 640, y: 620 })
    await say(this, [
      this.think(i === 0 ? 'Quise ayudarla a levantarse.' : 'Quise pedirle perdón.'),
      this.think('Pero esa noche no hice nada.'),
      this.mamaSays('Andá, Jorge. Andá.'),
    ])
    this.pista('La pelea', 'Mamá me dio el número de papá. Insistió. Me dijo que iba a terminar como él. La empujé. Se cayó y se lastimó el brazo. No la ayudé. Me fui.')
  }

  // Jorge se guarda el papelito: lo va a tener veinte años
  private async levantarPapelito() {
    this.f.papelito = true
    sfx.pickup()
    this.papelito?.destroy()
    if (!state.inventario.includes('papelito')) state.inventario.push('papelito')
    await showPage(this, 'papelito', 0)
    await say(this, [this.think('El número de papá.'), this.think('No sé por qué lo agarré.')])
    this.pista('El papelito', 'Me guardé el papelito con el número de papá. No lo llamé.')
    this.updateGoal()
  }

  private async salirCasa() {
    if (this.phase === 'casa') {
      await say(this, [this.think(this.bolsoCosas.size < 3 ? 'Primero el bolso.' : 'Ya está.')])
      return
    }
    if (!this.f.papelito) {
      await say(this, [this.think('El papelito quedó en el piso.')])
      return
    }
    this.phase = 'fin'
    this.leaving = true
    this.goal.set(null)
    if (!this.f.mama) await say(this, [this.mamaSays('Jorge…'), this.think('No me di vuelta.')])
    sfx.door()
    await this.wait(900)
    // Recién afuera, la voz de Vela vuelve a llegar entera
    this.tweens.add({ targets: this.rage, fillAlpha: 0, duration: 2500 })
    await say(this, [
      this.vela('Jorge. Jorge, ¿me escuchás?'),
      this.vela('Te estuve hablando todo el tiempo.'),
      this.vela('Ya está. Vas a despertar.'),
    ])
    if (!state.lineaDeTiempo.includes('Juventud: la pelea')) state.lineaDeTiempo.push('Juventud: la pelea')
    const cam = this.cameras.main
    cam.fadeOut(2600, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    await this.wait(700)
    this.scene.start('Office', { despertar: true, sesion: 4 })
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
    this.player.setTexture('jorge0')
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
    if (this.phase !== 'intro') {
      const tx = this.player.x + 70 * this.facing
      const ty = FEET - 110 + Math.sin(time / 420) * 8
      const k = 1 - Math.exp(-dt / 260)
      this.flame.x += (tx - this.flame.x) * k
      if (!this.tweens.isTweening(this.flame)) this.flame.y += (ty - this.flame.y) * k
      // En la pelea, el odio casi apaga la llama: se achica, titila y se pone roja
      const pelea = this.phase === 'pelea' || this.phase === 'despues'
      const calor = this.phase === 'visita' ? Math.max(0, 1 - Math.abs(this.maria.x - this.player.x) / 420) : 0
      const target = pelea ? 0.35 + Math.random() * 0.1 : Phaser.Math.Clamp(1 + calor * 0.4, 0.6, 1.5)
      if (this.phase !== 'solos' && this.phase !== 'fin') this.flameScale += (target - this.flameScale) * k
      this.flameImg.setTint(pelea ? 0xff6a4a : 0xffffff)
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
    this.mamaGlow.setPosition(this.mama.x - 2, this.mama.getTopCenter().y + 23)

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
      const people = ['Inmobiliario', 'Mamá', 'Salir', 'Papelito']
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

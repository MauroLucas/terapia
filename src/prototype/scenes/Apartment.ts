import * as Phaser from 'phaser'
import { addVignette, FONT, HAND_FONT, makeTextures } from '../art'
import { sfx, startClock, startRoomTone } from '../audio'
import { addPista, state } from '../state'
import { onKey, overlay, say, text, toast, type Line, type Point } from '../ui'
import { showObjeto, showPage } from '../documents'
import { openDiary } from './diary'

// Casa de Jorge. El departamento se divide en ambientes unidos por puertas:
//   Cuarto  →  Pasillo: [puerta cuarto] … [puerta cocina] [puerta baño] … [portero | salida]
//                         ↓
//                       Cocina
// Cada ambiente ocupa su propio tramo del mundo; la cámara se limita al ambiente actual.

const FLOOR = 600
const CEIL = 110
const STEP = 1000 / 60
const WALK = 3.4 // px por paso de física (≈ 204 px/s)

type RoomId = 'cuarto' | 'pasillo' | 'cocina'
const ROOMS: Record<RoomId, { x: number; w: number }> = {
  cuarto: { x: 0, w: 1280 },
  pasillo: { x: 1600, w: 1800 },
  cocina: { x: 3700, w: 1400 },
}
const WORLD_W = 5200
const P = ROOMS.pasillo.x
const K = ROOMS.cocina.x

// Puertas: dónde está cada una y a qué ambiente lleva
const DOORS = {
  cuartoAPasillo: 1160,
  pasilloACuarto: P + 130,
  pasilloACocina: P + 720,
  bano: P + 1060,
  portero: P + 1560,
  salida: P + 1690,
  cocinaAPasillo: K + 90,
}

const TABLE = { left: K + 780, right: K + 1040, top: 480 }
const CLOCK = { x: K + 352, y: 322 }
const CLOCK_RANGE = 520 // distancia a la que deja de escucharse

interface Interactable {
  id: string
  name: string
  room: RoomId
  x: number
  y: number
  range?: number
  door?: boolean // las puertas y el portero se pueden usar antes de atender
  action: () => Promise<void>
}

type Trash = Phaser.Physics.Matter.Image & { material?: string; lastSound?: number }

export class Apartment extends Phaser.Scene {
  private player!: Phaser.Physics.Matter.Sprite
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private room: RoomId = 'cuarto'
  private busy = true
  private leaving = false
  private lockUntil = 0
  private facing = 1
  private walkDist = 0
  private stepDist = 0
  private lastX = 0
  private acc = 0
  private items: Interactable[] = []
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text
  private tableTrash: Trash[] = []
  private tableCleared = false
  private calendarSeen = false
  private bannerRead = false
  private drawerNoteRead = false
  private answered = false
  private hallRang = false // el timbre ya sonó al salir del cuarto
  private pushedOnce = false
  private keySprite?: Phaser.GameObjects.Image
  private bannerGlow?: Phaser.GameObjects.Rectangle
  private fridgeNotes?: Phaser.GameObjects.Graphics
  private drawerNote?: Phaser.GameObjects.Graphics
  private bannerStrip?: Phaser.GameObjects.Graphics
  private inv!: Phaser.GameObjects.Container
  private roomTone?: { stop: (fade?: number) => void }
  private clock?: ReturnType<typeof startClock>
  private ring?: Phaser.Time.TimerEvent

  constructor() {
    super('Apartment')
  }

  create() {
    this.room = 'cuarto'
    this.busy = true
    this.leaving = false
    this.tableTrash = []
    this.tableCleared = this.calendarSeen = this.bannerRead = this.drawerNoteRead = this.answered = this.pushedOnce = this.hallRang = false
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0b0c10')
    this.drawCuarto()
    this.drawPasillo()
    this.drawCocina()
    this.setupPhysics()
    this.setupItems()
    this.setupHud()
    addVignette(this, 0.8)

    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,A,D,E,SPACE,TAB,ESC') as Record<string, Phaser.Input.Keyboard.Key>
    this.setCameraRoom('cuarto')
    this.roomTone = startRoomTone()
    this.clock = startClock()
    this.events.once('shutdown', () => {
      this.roomTone?.stop(0.5)
      this.clock?.stop()
    })
    void this.intro()
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __apt?: Apartment }).__apt = this
  }

  // ---------- Escenarios ----------

  private shell(g: Phaser.GameObjects.Graphics, room: RoomId, wall: number, label: string) {
    const { x, w } = ROOMS[room]
    g.fillStyle(0x0e0f13).fillRect(x, 0, w, CEIL)
    g.fillStyle(wall).fillRect(x, CEIL, w, FLOOR - CEIL)
    g.fillStyle(0x1c1e25).fillRect(x, FLOOR - 14, w, 14)
    g.fillStyle(0x2a2119).fillRect(x, FLOOR, w, 120)
    g.lineStyle(1, 0x1e1812)
    for (let lx = x; lx < x + w; lx += 90) g.lineBetween(lx, FLOOR, lx + 30, 720)
    g.fillStyle(0x0e0f13).fillRect(x, CEIL, 14, FLOOR - CEIL).fillRect(x + w - 14, CEIL, 14, FLOOR - CEIL)
    this.add.text(x + w / 2, CEIL + 16, label, { fontFamily: FONT, fontSize: '14px', color: '#4b5263', resolution: 2 }).setOrigin(0.5, 0)
  }

  private door(g: Phaser.GameObjects.Graphics, cx: number, color = 0x3a3f4d, w = 90, h = 190) {
    const x = cx - w / 2
    const y = FLOOR - h
    g.fillStyle(0x15171d).fillRect(x - 8, y - 8, w + 16, h + 8)
    g.fillStyle(color).fillRect(x, y, w, h)
    g.lineStyle(2, 0x1a1c22).strokeRect(x + 10, y + 12, w - 20, h / 2 - 20).strokeRect(x + 10, y + h / 2 + 4, w - 20, h / 2 - 20)
    g.fillStyle(0xb8b8b8).fillCircle(x + w - 14, y + h / 2 + 6, 5)
    g.fillStyle(0x0c0d10, 0.8).fillRect(x, FLOOR - 4, w, 4)
  }

  private drawCuarto() {
    const g = this.add.graphics()
    this.shell(g, 'cuarto', 0x2a2f3d, 'CUARTO')
    // Ventana con luz azul
    g.fillStyle(0x10141f).fillRect(500, 210, 140, 150)
    g.fillStyle(0x3d5a80, 0.5).fillRect(508, 218, 124, 134)
    g.lineStyle(4, 0x1a1d26).strokeRect(500, 210, 140, 150).lineBetween(570, 210, 570, 360)
    this.add.polygon(0, 0, [508, 352, 632, 352, 700, FLOOR, 440, FLOOR], 0x6f8fc0, 0.07).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD)
    // Cama
    g.fillStyle(0x3b2a20).fillRect(110, 520, 280, 40).fillRect(110, 450, 18, 150).fillRect(372, 500, 18, 100)
    g.fillStyle(0x56607a).fillRoundedRect(128, 500, 250, 30, 6)
    g.fillStyle(0x6e7896).fillRoundedRect(200, 492, 180, 34, 8)
    g.fillStyle(0xcfd3dc).fillRoundedRect(132, 486, 64, 22, 8)
    // Mesita de luz con lámpara y billetera
    g.fillStyle(0x4a3628).fillRect(405, 540, 66, 60)
    g.fillStyle(0x3a2a1f).fillRect(410, 556, 56, 3)
    g.fillStyle(0x7a6a50).fillRect(452, 512, 4, 28)
    g.fillStyle(0xd9c79a).fillTriangle(442, 512, 466, 512, 454, 496)
    g.fillStyle(0x5a3a22).fillRoundedRect(414, 533, 26, 8, 2)
    // Cómoda con portarretratos vacío
    g.fillStyle(0x4a3628).fillRect(650, 490, 160, 110)
    g.lineStyle(2, 0x3a2a1f).strokeRect(658, 498, 144, 44).strokeRect(658, 548, 144, 44)
    g.fillStyle(0x8a7350).fillRect(700, 446, 36, 44)
    g.fillStyle(0x1b1d24).fillRect(705, 451, 26, 34)
    // Cuadro en la pared
    g.fillStyle(0x3d3a33).fillRect(220, 260, 110, 80)
    // Pizarra con la línea de tiempo, casi vacía
    g.fillStyle(0x8a8d94).fillRect(876, 246, 188, 128)
    g.fillStyle(0xe9e9e4).fillRect(882, 252, 176, 116)
    g.lineStyle(2, 0x333844).lineBetween(900, 312, 1040, 312).lineBetween(900, 306, 900, 318).lineBetween(1040, 306, 1040, 318)
    g.fillStyle(0x6c7078).fillRect(940, 374, 60, 5)
    // Puerta al pasillo
    this.door(g, DOORS.cuartoAPasillo)
  }

  private drawPasillo() {
    const g = this.add.graphics()
    this.shell(g, 'pasillo', 0x262a35, 'PASILLO')
    // Alfombra larga y lámparas de techo
    g.fillStyle(0x3a2626).fillRect(P + 200, FLOOR + 6, 1400, 10)
    for (const lx of [P + 450, P + 900, P + 1350]) {
      g.fillStyle(0x15171d).fillRect(lx - 1, CEIL, 2, 30)
      g.fillStyle(0xe8dcb0).fillCircle(lx, CEIL + 34, 6)
      this.add.circle(lx, CEIL + 34, 150, 0xf0e2b0, 0.04).setBlendMode(Phaser.BlendModes.ADD)
    }
    // Perchero y cuadro
    g.fillStyle(0x3b2a20).fillRect(P + 380, 330, 6, 270).fillRect(P + 360, 330, 46, 6)
    g.fillStyle(0x2c3a2a).fillRoundedRect(P + 362, 340, 20, 90, 6)
    g.fillStyle(0x3d3a33).fillRect(P + 860, 300, 90, 60)
    // Puertas: cuarto, cocina, baño y salida
    this.door(g, DOORS.pasilloACuarto)
    this.door(g, DOORS.pasilloACocina, 0x40453a)
    this.door(g, DOORS.bano, 0x3a3f4d)
    for (const [x, label] of [[DOORS.pasilloACuarto, 'CUARTO'], [DOORS.pasilloACocina, 'COCINA'], [DOORS.bano, 'BAÑO']] as const) {
      this.add.text(x, FLOOR - 212, label, { fontFamily: FONT, fontSize: '12px', color: '#5a6172', resolution: 2 }).setOrigin(0.5)
    }
    // Salida al fondo, con el portero eléctrico al lado
    g.fillStyle(0x15171d).fillRect(DOORS.salida - 63, 392, 126, 208)
    g.fillStyle(0x553a28).fillRect(DOORS.salida - 55, 400, 110, 200)
    g.lineStyle(3, 0x2d1f15).strokeRect(DOORS.salida - 55, 400, 110, 200).strokeRect(DOORS.salida - 41, 416, 82, 70).strokeRect(DOORS.salida - 41, 500, 82, 84)
    g.fillStyle(0xc9b46a).fillCircle(DOORS.salida + 39, 505, 6)
    g.fillStyle(0x222222).fillRect(DOORS.salida + 33, 520, 8, 14)
    g.fillStyle(0xd0d0c8).fillRoundedRect(DOORS.portero - 15, 380, 30, 52, 4)
    g.fillStyle(0x333333).fillRect(DOORS.portero - 9, 388, 18, 14)
  }

  private drawCocina() {
    const g = this.add.graphics()
    this.shell(g, 'cocina', 0x2d3240, 'COCINA')
    this.door(g, DOORS.cocinaAPasillo, 0x40453a)
    // Heladera con notas
    g.fillStyle(0xbfc3c8).fillRoundedRect(K + 220, 390, 100, 210, 6)
    g.lineStyle(2, 0x8d9197).lineBetween(K + 220, 470, K + 320, 470)
    g.fillStyle(0x8d9197).fillRect(K + 230, 420, 4, 30).fillRect(K + 230, 490, 4, 40)
    // Las notas, el banner y la nota del cajón van aparte: desaparecen cuando Jorge se los guarda
    this.fridgeNotes = this.add.graphics()
    for (const [nx, ny, c] of [[250, 400, 0xf2e35a], [280, 425, 0xf2a65a], [255, 485, 0xf2e35a], [285, 505, 0x9ee07a]] as const) {
      this.fridgeNotes.fillStyle(c).fillRect(K + nx, ny, 24, 22)
    }
    // Reloj de pared, a la derecha de la heladera
    g.fillStyle(0x1a1c22).fillCircle(CLOCK.x, CLOCK.y, 26)
    g.fillStyle(0xe8e4da).fillCircle(CLOCK.x, CLOCK.y, 22)
    g.fillStyle(0x333333)
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2
      g.fillCircle(CLOCK.x + Math.cos(ang) * 17, CLOCK.y + Math.sin(ang) * 17, i % 3 === 0 ? 2 : 1)
    }
    g.lineStyle(3, 0x222222).lineBetween(CLOCK.x, CLOCK.y, CLOCK.x + 7, CLOCK.y - 8).lineBetween(CLOCK.x, CLOCK.y, CLOCK.x - 2, CLOCK.y - 14)
    const second = this.add.graphics({ x: CLOCK.x, y: CLOCK.y }).setDepth(1)
    second.lineStyle(1.5, 0xb02a2a).lineBetween(0, 3, 0, -17)
    this.time.addEvent({ delay: 1000, loop: true, callback: () => (second.rotation += Math.PI / 30) })
    // Mesada, bajo mesada y alacenas
    g.fillStyle(0x3e4350).fillRect(K + 390, 510, 230, 90)
    g.fillStyle(0x6b6f78).fillRect(K + 384, 500, 242, 12)
    g.fillStyle(0x3e4350).fillRect(K + 390, 260, 230, 90)
    g.lineStyle(2, 0x2c3039)
      .strokeRect(K + 390, 260, 115, 90).strokeRect(K + 505, 260, 115, 90)
      .strokeRect(K + 390, 520, 115, 80).strokeRect(K + 505, 520, 115, 80)
    // Frasco de pastillas
    g.fillStyle(0xd88a3a).fillRect(K + 482, 480, 16, 20)
    g.fillStyle(0xeeeeee).fillRect(K + 480, 474, 20, 7)
    // Calendario en la pared
    g.fillStyle(0xe8e4da).fillRect(K + 660, 300, 64, 82)
    g.fillStyle(0xaa3333).fillRect(K + 660, 300, 64, 14)
    g.lineStyle(1, 0x999999)
    for (let i = 1; i < 5; i++) g.lineBetween(K + 664, 314 + i * 13, K + 720, 314 + i * 13)
    g.lineStyle(2, 0xcc2222).strokeCircle(K + 700, 353, 7)
    // Mesa y silla
    g.fillStyle(0x5a4030).fillRect(TABLE.left, TABLE.top, TABLE.right - TABLE.left, 12)
    g.fillRect(TABLE.left + 12, TABLE.top + 12, 12, FLOOR - TABLE.top - 12).fillRect(TABLE.right - 24, TABLE.top + 12, 12, FLOOR - TABLE.top - 12)
    g.fillStyle(0x4a3427).fillRect(TABLE.left - 35, 520, 36, 8).fillRect(TABLE.left - 35, 480, 8, 120)
    // Aparador con cajón y candado
    g.fillStyle(0x4a3628).fillRect(K + 1150, 470, 140, 130)
    g.lineStyle(2, 0x3a2a1f).strokeRect(K + 1160, 482, 120, 34)
    g.fillStyle(0x9a8a60).fillRoundedRect(K + 1212, 506, 16, 18, 3)
    g.lineStyle(3, 0x9a8a60).strokeCircle(K + 1220, 504, 6)
    // Nota pegada en el cajón
    this.drawerNote = this.add.graphics().fillStyle(0xf2e35a).fillRect(K + 1244, 486, 22, 20)
    // Banner de Neural (debajo de la basura de la mesa)
    this.bannerStrip = this.add.graphics()
    this.bannerStrip.fillStyle(0xf1efe8).fillRect(TABLE.left + 40, TABLE.top - 4, 190, 5)
    this.bannerStrip.fillStyle(0x4c7bd1).fillRect(TABLE.left + 110, TABLE.top - 4, 40, 5)
    const mid = (TABLE.left + TABLE.right) / 2
    this.bannerGlow = this.add.rectangle(mid, TABLE.top - 2, 200, 14, 0xfff6c0, 0).setBlendMode(Phaser.BlendModes.ADD)
  }

  private setupPhysics() {
    const m = this.matter
    m.world.setBounds(0, -400, WORLD_W, FLOOR + 400, 64, true, true, false, true)
    // Paredes de cada ambiente
    for (const r of Object.values(ROOMS)) {
      m.add.rectangle(r.x + 7, FLOOR - 300, 14, 600, { isStatic: true })
      m.add.rectangle(r.x + r.w - 7, FLOOR - 300, 14, 600, { isStatic: true })
    }
    const catPlayer = m.world.nextCategory()
    const catTrash = m.world.nextCategory()
    const catTable = m.world.nextCategory()

    // Jorge empieza acostado: se muestra una imagen aparte hasta que se levanta
    this.player = m.add.sprite(430, FLOOR - 70, 'jorge0', undefined, {
      shape: { type: 'rectangle', width: 34, height: 136 },
      chamfer: { radius: 10 },
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0,
    })
    this.player.setFixedRotation().setMass(70).setCollisionCategory(catPlayer).setCollidesWith([1, catTrash])
    this.player.setVisible(false).setDepth(10)

    // Tapa de la mesa: solo choca con la basura (Jorge camina por delante)
    const top = m.add.rectangle((TABLE.left + TABLE.right) / 2, TABLE.top + 6, TABLE.right - TABLE.left, 12, { isStatic: true })
    top.collisionFilter.category = catTable
    top.collisionFilter.mask = catTrash

    const spawn = (key: string, x: number, y: number, material: string, onTable = false) => {
      const opts: Phaser.Types.Physics.Matter.MatterBodyConfig = { friction: 0.4, frictionAir: 0.01, restitution: 0.2 }
      if (key === 'bollo') Object.assign(opts, { shape: { type: 'circle', radius: 9 }, restitution: 0.35 })
      if (key === 'papel') Object.assign(opts, { frictionAir: 0.08, restitution: 0 })
      if (key === 'lata') Object.assign(opts, { chamfer: { radius: 6 }, restitution: 0.45 })
      const o = m.add.image(x, y, key, undefined, opts) as Trash
      o.setMass(key === 'caja' || key === 'delivery' ? 2 : key === 'papel' ? 0.15 : 0.6)
      o.setCollisionCategory(catTrash).setCollidesWith([1, catTrash, catPlayer, catTable])
      o.material = material
      o.setDepth(onTable ? 6 : 12)
      if (onTable) this.tableTrash.push(o)
      return o
    }

    // Basura mínima: un objeto suelto en el cuarto y otro en la cocina
    spawn('bollo', 900, FLOOR - 9, 'papel')
    spawn('lata', K + 560, FLOOR - 7, 'lata')
    // Mesa tapada (encima del banner)
    spawn('delivery', TABLE.left + 80, TABLE.top - 16, 'caja', true)
    spawn('papel', TABLE.left + 140, TABLE.top - 4, 'papel', true)
    spawn('lata', TABLE.left + 195, TABLE.top - 8, 'lata', true)

    // Patear: al chocar con Jorge en movimiento, la basura sale despedida
    m.world.on('collisionstart', (ev: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of ev.pairs) {
        const a = pair.bodyA.gameObject as Trash | null
        const b = pair.bodyB.gameObject as Trash | null
        const trash = a === (this.player as unknown) ? b : b === (this.player as unknown) ? a : null
        if (trash?.material) {
          const vx = this.player.body ? (this.player.body as MatterJS.BodyType).velocity.x : 0
          if (Math.abs(vx) > 0.5) {
            const dir = Math.sign(vx)
            trash.setVelocity(dir * Phaser.Math.FloatBetween(4, 8), -Phaser.Math.FloatBetween(2, 5))
            trash.setAngularVelocity(Phaser.Math.FloatBetween(-0.3, 0.3))
            sfx.kick(trash.material)
          }
          continue
        }
        // Rebotes de la basura contra el piso o entre sí
        for (const o of [a, b]) {
          if (!o?.material || !o.body) continue
          const v = (o.body as MatterJS.BodyType).velocity
          const speed = Math.hypot(v.x, v.y)
          const now = this.time.now
          if (speed > 2.5 && now - (o.lastSound ?? 0) > 150) {
            o.lastSound = now
            sfx.kick(o.material, speed / 8)
          }
        }
      }
    })
  }

  // ---------- Ambientes y puertas ----------

  private setCameraRoom(room: RoomId) {
    this.room = room
    const r = ROOMS[room]
    this.cameras.main.setBounds(r.x, 0, r.w, 720)
  }

  private async goTo(room: RoomId, x: number) {
    sfx.door()
    const cam = this.cameras.main
    cam.fadeOut(250, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.player.setPosition(x, FLOOR - 70)
    this.player.setVelocity(0, 0)
    this.lastX = x
    this.setCameraRoom(room)
    cam.centerOn(x, 360)
    cam.fadeIn(250, 0, 0, 0)
    await new Promise((r) => this.time.delayedCall(250, r))
  }

  // ---------- Objetos interactivos ----------

  private jorgeHead = (): Point => ({ x: this.player.x + 6 * this.facing, y: this.player.y - 70 })
  private think = (text: string): Line => ({ kind: 'thought', text, anchor: this.jorgeHead })
  private speak = (text: string): Line => ({ kind: 'speech', text, anchor: this.jorgeHead })
  private intercom = (text: string): Line => ({ kind: 'intercom', text, anchor: () => ({ x: DOORS.portero, y: 380 }) })

  private removeItem(id: string) {
    this.items = this.items.filter((it) => it.id !== id)
  }

  private pista(titulo: string, texto: string) {
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
  }

  private setupItems() {
    this.items = [
      // Cuarto
      { id: 'billetera', name: 'Billetera', room: 'cuarto', x: 430, y: 500, action: () => this.billetera() },
      {
        id: 'portarretratos', name: 'Portarretratos', room: 'cuarto', x: 718, y: 430,
        action: async () => {
          await say(this, [this.think('¿Qué foto había acá? ¿Por qué la saqué?')])
          this.pista('Portarretratos vacío', 'Falta una foto. La saqué yo… creo.')
        },
      },
      { id: 'pizarra', name: 'Pizarra', room: 'cuarto', x: 970, y: 300, action: () => this.pizarra() },
      { id: 'aPasillo', name: 'Puerta al pasillo', room: 'cuarto', x: DOORS.cuartoAPasillo, y: 400, door: true, action: () => this.salirDelCuarto() },

      // Pasillo
      { id: 'aCuarto', name: 'Cuarto', room: 'pasillo', x: DOORS.pasilloACuarto, y: 400, door: true, action: () => this.goTo('cuarto', DOORS.cuartoAPasillo) },
      {
        id: 'aCocina', name: 'Cocina', room: 'pasillo', x: DOORS.pasilloACocina, y: 400, door: true,
        // Hasta atender el portero no se puede entrar a la cocina
        action: () => (this.answered ? this.goTo('cocina', DOORS.cocinaAPasillo) : say(this, [this.think('No es momento de comida, debo atender el portero.')])),
      },
      {
        id: 'bano', name: 'Baño', room: 'pasillo', x: DOORS.bano, y: 400, door: true,
        action: async () => {
          sfx.handle()
          this.cameras.main.shake(120, 0.002)
          await say(this, [this.think('Parece bloqueada desde adentro.')])
          this.pista('Puerta del baño', 'Está trabada desde adentro.')
        },
      },
      { id: 'portero', name: 'Portero eléctrico', room: 'pasillo', x: DOORS.portero, y: 370, door: true, action: () => this.portero() },
      { id: 'salida', name: 'Salida', room: 'pasillo', x: DOORS.salida, y: 390, door: true, action: () => this.salida() },

      // Cocina
      { id: 'cocinaAPasillo', name: 'Pasillo', room: 'cocina', x: DOORS.cocinaAPasillo, y: 400, door: true, action: () => this.goTo('pasillo', DOORS.pasilloACocina) },
      { id: 'heladera', name: 'Notas de la heladera', room: 'cocina', x: K + 270, y: 380, action: () => this.heladera() },
      {
        id: 'pastillas', name: 'Pastillas', room: 'cocina', x: K + 490, y: 460,
        action: async () => {
          sfx.kick('botella', 0.5)
          await overlay(this, (c) => {
            c.add(this.add.rectangle(0, 0, 300, 340, 0xd88a3a))
            c.add(this.add.rectangle(0, -190, 320, 50, 0xeeeeee))
            c.add(this.add.rectangle(0, 10, 260, 180, 0xf6f1e4))
            c.add(text(this, 0, 10, 'MNEMOXINA 20 mg\n\nTomar 1 por la mañana.\n\nRecetado por: NEURAL', 22, '#222', { align: 'center' }).setOrigin(0.5))
          }, { w: 400, h: 460 })
          await say(this, [this.think('¿Ya me tomé la de hoy? …No tengo idea.')])
          this.pista('Pastillas', 'Tomo una medicación recetada por Neural.')
        },
      },
      { id: 'calendario', name: 'Calendario', room: 'cocina', x: K + 692, y: 290, action: () => this.calendario() },
      { id: 'mesa', name: 'Mesa', room: 'cocina', x: (TABLE.left + TABLE.right) / 2, y: 440, range: 150, action: () => this.mesa() },
      { id: 'cajon', name: 'Cajón con candado', room: 'cocina', x: K + 1220, y: 460, action: () => this.cajon() },
    ]

    const box = this.add.graphics()
    box.fillStyle(0xf6f3ea).fillRoundedRect(-16, -16, 32, 32, 7)
    box.lineStyle(2, 0x111111).strokeRoundedRect(-16, -16, 32, 32, 7)
    const key = this.add.text(0, 0, 'E', { fontFamily: FONT, fontSize: '18px', color: '#111', fontStyle: 'bold', resolution: 2 }).setOrigin(0.5)
    this.promptLabel = this.add.text(0, 26, '', { fontFamily: FONT, fontSize: '14px', color: '#d8dce6', resolution: 2, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0)
    this.prompt = this.add.container(0, 0, [box, key, this.promptLabel]).setDepth(800).setVisible(false)
    this.tweens.add({ targets: this.prompt, scale: 1.08, yoyo: true, repeat: -1, duration: 600 })
  }

  private nearest(): Interactable | null {
    let best: Interactable | null = null
    let bestD = Infinity
    for (const it of this.items) {
      if (it.room !== this.room) continue
      const d = Math.abs(this.player.x - it.x)
      if (d < (it.range ?? 75) && d < bestD) {
        best = it
        bestD = d
      }
    }
    return best
  }

  private async billetera() {
    await say(this, [this.think('Una billetera… Adentro hay una foto.')])
    await showPage(this, 'foto', 0)
    await say(this, [this.think('¿Quién es esta señora?'), this.think('Atrás tiene algo escrito.')])
    await showPage(this, 'foto', 1)
    await say(this, [this.think('Me la guardo.')])
    this.addInventory('foto')
    this.removeItem('billetera')
    this.pista('Foto en la billetera', 'Hay una señora conmigo en la foto. No sé quién es. Atrás dice "12/08".')
  }

  // Línea de tiempo de la vida de Jorge. Al principio solo tiene las dos puntas.
  private async pizarra() {
    await overlay(this, (c, w) => {
      const ink = '#2b3140'
      c.add(text(this, 0, -150, 'MI VIDA', 30, ink, { fontFamily: HAND_FONT, fontStyle: 'bold' }).setOrigin(0.5))
      const x0 = -w / 2 + 90
      const x1 = w / 2 - 90
      const g = this.add.graphics().lineStyle(4, 0x2b3140).lineBetween(x0, 0, x1, 0)
      for (let age = 0; age <= 30; age += 10) {
        const x = x0 + ((x1 - x0) * age) / 30
        g.lineBetween(x, -12, x, 12)
        c.add(text(this, x, 22, String(age), 16, '#7a8090', { fontFamily: HAND_FONT }).setOrigin(0.5, 0))
      }
      c.add(g)
      c.add(text(this, x0, -24, 'Nací', 22, ink, { fontFamily: HAND_FONT }).setOrigin(0.5, 1))
      c.add(text(this, x1, -24, 'HOY', 22, '#b11', { fontFamily: HAND_FONT, fontStyle: 'bold' }).setOrigin(0.5, 1))
    }, { w: 820, h: 420, paper: 0xe9e9e4 })
    await say(this, [this.think('Una línea, de punta a punta. "Nací"… y "hoy".'), this.think('En el medio no hay nada.')])
    this.pista('Pizarra', 'Tengo una línea de tiempo de mi vida en el cuarto. Está casi vacía.')
  }

  private async heladera() {
    await showObjeto(this, 'notas')
    await say(this, [this.think('Esta es mi letra… Me dejé notas a mí mismo.'), this.think('Me las llevo.')])
    this.fridgeNotes?.destroy()
    this.addInventory('notas')
    this.removeItem('heladera')
    this.pista('Notas en la heladera', 'Me dejo notas para no olvidarme de las cosas.')
  }

  private async calendario() {
    await overlay(this, (c, w, h) => {
      c.add(this.add.rectangle(0, -h / 2 + 35, w, 70, 0xaa3333))
      c.add(text(this, 0, -h / 2 + 35, 'ESTE MES', 30, '#fff', { fontStyle: 'bold' }).setOrigin(0.5))
      const cols = 7
      const cw = (w - 40) / cols
      const ch = 82
      const startY = -h / 2 + 90
      const marks: Record<number, string> = { 3: 'Neural 10:30', 5: 'Neural 10:30', 10: 'Neural 10:30', 12: 'Neural 10:30', 17: 'Neural 10:30' }
      for (let d = 1; d <= 30; d++) {
        const i = d - 1
        const x = -w / 2 + 20 + (i % cols) * cw
        const y = startY + Math.floor(i / cols) * ch
        c.add(this.add.rectangle(x, y, cw, ch, 0xffffff, 0).setOrigin(0).setStrokeStyle(1, 0xbbbbbb))
        c.add(text(this, x + 6, y + 4, String(d), 16, d > 19 ? '#aaa' : '#333'))
        if (d < 19) c.add(text(this, x + cw / 2, y + ch / 2, '✕', 30, '#c9c9c9').setOrigin(0.5))
        if (marks[d]) c.add(text(this, x + 6, y + 50, marks[d], 13, '#334', { fontFamily: HAND_FONT }))
        if (d === 19) {
          c.add(this.add.graphics().lineStyle(4, 0xcc2222).strokeEllipse(x + cw / 2, y + ch / 2, cw + 10, ch + 4))
          c.add(text(this, x + cw / 2, y + ch / 2 + 6, 'HOY — Neural\n10:30\nLLEVAR EL\nINFORME', 12, '#b11', { fontFamily: HAND_FONT, align: 'center', fontStyle: 'bold' }).setOrigin(0.5))
        }
      }
    }, { w: 760, h: 600, paper: 0xf2efe6 })
    await say(this, [this.think('Parece que voy seguido… pero no me acuerdo de haber ido nunca.'), this.think('¿Llevar el informe? ¿Qué informe?')])
    this.calendarSeen = true
    this.pista('Calendario', 'Voy seguido a Neural. Hoy tengo turno a las 10:30 y tengo que llevar el informe.')
  }

  private async mesa() {
    if (!this.tableCleared) {
      // Puzzle: tirar la basura de la mesa al piso
      for (const t of this.tableTrash) {
        if (t.y < TABLE.top + 5 && t.x > TABLE.left - 10 && t.x < TABLE.right + 10) {
          const side = t.x > this.player.x ? 1 : -1
          const dir = Math.abs(t.x - this.player.x) < 30 ? this.facing : side
          t.setVelocity(dir * Phaser.Math.FloatBetween(3, 7), -Phaser.Math.FloatBetween(2, 5))
          t.setAngularVelocity(Phaser.Math.FloatBetween(-0.2, 0.2))
        }
      }
      sfx.kick('caja')
      sfx.kick('lata', 0.6)
      if (!this.pushedOnce) {
        this.pushedOnce = true
        await say(this, [this.think('Hay un papel debajo de toda esta basura…')])
      }
      return
    }
    await this.leerBanner()
  }

  private async leerBanner() {
    await showObjeto(this, 'banner')

    if (this.bannerRead) return
    this.bannerRead = true
    this.bannerGlow?.setAlpha(0)
    this.bannerStrip?.destroy()
    this.addInventory('banner')
    this.removeItem('mesa')
    await say(this, [this.think('¿Tan mal estoy?')])
    this.pista('Banner de Neural', 'Neural es un centro para recuperar la memoria. Y yo soy paciente.')
    // Debajo del banner está la llave
    sfx.paper()
    this.keySprite = this.add.image((TABLE.left + TABLE.right) / 2, TABLE.top - 8, 'llave').setDepth(7)
    await new Promise((r) => this.time.delayedCall(500, r))
    this.tweens.add({ targets: this.keySprite, y: this.keySprite.y - 60, alpha: 0, duration: 500, onComplete: () => this.keySprite?.destroy() })
    sfx.pickup()
    this.addInventory('llave')
    await say(this, [this.think('Acá estaba la llave.')])
  }

  private async cajon() {
    if (!this.drawerNoteRead) {
      this.drawerNoteRead = true
      await say(this, [this.think('¿Por qué le puse un candado a esto?'), this.think('Tiene una nota pegada.')])
      await showObjeto(this, 'notaCajon')
      await say(this, [this.think('Es mi letra… ¿Mamá?'), this.think('Quizás encuentre el código en mi cuarto.'), this.think('Tengo que apresurarme, el chofer me está esperando.')])
      this.drawerNote?.destroy()
      this.addInventory('notaCajon')
      this.pista('Nota en el cajón', 'El cajón con candado tiene una nota con mi letra: "Te extraño, mamá".')
    }
    const ok = await this.candado()
    if (!ok) return
    sfx.unlock()
    await showObjeto(this, 'informe')
    await say(this, [this.think('¿Resistencia a qué? ¿Quién tachó esto… yo?')])
    this.addInventory('informe')
    this.removeItem('cajon')
    this.pista('Informe de Neural', 'Hay recuerdos que me resisto a recuperar. Alguien tachó la causa.')
  }

  // Candado de 4 números (fecha del dorso de la foto). ← → elegir, ↑ ↓ cambiar, Enter probar, Q salir.
  // Esc también sale, pero en pantalla completa el navegador lo usa para salir de la pantalla completa.
  private candado(): Promise<boolean> {
    return new Promise((resolve) => {
      const { width, height } = this.scale
      const digits = [0, 0, 0, 0]
      let sel = 0
      const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0)
      const body = this.add.graphics()
      body.lineStyle(18, 0x9a8a60).beginPath().arc(0, -120, 80, Math.PI, 0).strokePath()
      body.fillStyle(0xb8a66e).fillRoundedRect(-215, -120, 430, 230, 24)
      const boxes = digits.map((_, i) => {
        const x = -135 + i * 90
        const r = this.add.rectangle(x, 0, 70, 100, 0x2b2b2b).setStrokeStyle(3, 0x111111)
        const t = text(this, x, 0, '0', 52, '#f2f2f2', { fontStyle: 'bold' }).setOrigin(0.5)
        return { r, t }
      })
      const help = text(this, 0, 150, '← → elegir número · ↑ ↓ cambiar · Enter probar · Q salir', 17, '#cfd3dc').setOrigin(0.5)
      const c = this.add.container(width / 2, height / 2 + 20, [body, ...boxes.flatMap((b) => [b.r, b.t]), help])
      const root = this.add.container(0, 0, [dim, c]).setScrollFactor(0).setDepth(1010)
      const draw = () =>
        boxes.forEach((b, i) => {
          b.t.setText(String(digits[i]))
          b.r.setStrokeStyle(i === sel ? 5 : 3, i === sel ? 0x3e7d3c : 0x111111)
        })
      draw()
      const close = (ok: boolean) => {
        off()
        root.destroy()
        resolve(ok)
      }
      const off = onKey(this, (code) => {
        if (code === 'ArrowLeft' || code === 'KeyA') sel = (sel + 3) % 4
        else if (code === 'ArrowRight' || code === 'KeyD') sel = (sel + 1) % 4
        else if (code === 'ArrowUp' || code === 'KeyW') digits[sel] = (digits[sel] + 1) % 10
        else if (code === 'ArrowDown' || code === 'KeyS') digits[sel] = (digits[sel] + 9) % 10
        else if (code === 'KeyQ' || code === 'Escape' || code === 'Tab') return close(false)
        else if (code === 'Enter' || code === 'KeyE' || code === 'Space') {
          if (digits.join('') === '1208') return close(true)
          sfx.handle()
          this.tweens.add({ targets: c, x: c.x + 10, yoyo: true, repeat: 3, duration: 40 })
          return
        } else return
        sfx.click()
        draw()
      })
    })
  }

  // El portero insiste cada tanto hasta que Jorge lo atiende. Después no vuelve a sonar.
  private startRing() {
    this.ring?.remove()
    this.ring = this.time.addEvent({
      delay: 12000,
      loop: true,
      callback: () => {
        if (this.answered) return
        sfx.buzz()
        this.cameras.main.shake(200, 0.002)
      },
    })
  }

  // La primera vez que sale del cuarto, el timbre vuelve a sonar
  private async salirDelCuarto() {
    await this.goTo('pasillo', DOORS.pasilloACuarto)
    if (this.answered || this.hallRang) return
    this.hallRang = true
    sfx.buzz()
    this.cameras.main.shake(200, 0.002)
    this.startRing()
    await new Promise((r) => this.time.delayedCall(1300, r))
    await say(this, [this.think('Tengo que ver quién está tocando el timbre.')])
  }

  // Dolor de cabeza: la imagen late tres veces, lento y sin destellos
  private headache() {
    const { width, height } = this.scale
    const veil = this.add.rectangle(0, 0, width, height, 0xb3202c).setOrigin(0).setAlpha(0).setScrollFactor(0).setDepth(940)
    sfx.throb()
    this.tweens.add({ targets: veil, alpha: 0.34, duration: 450, yoyo: true, repeat: 2, ease: 'Sine.InOut', onComplete: () => veil.destroy() })
    this.tweens.add({ targets: this.cameras.main, zoom: 1.035, duration: 450, yoyo: true, repeat: 2, ease: 'Sine.InOut' })
  }

  // Lo primero que hace Jorge: atender el portero
  private async portero() {
    if (this.answered) {
      const hasKey = state.inventario.includes('llave')
      await say(this, [this.think(hasKey ? 'Ya tengo la llave. Tengo que bajar.' : 'Me está esperando abajo. Tengo que encontrar la llave.')])
      return
    }
    this.ring?.remove()
    await say(this, [
      this.speak('¿Quién es?'),
      this.intercom('Vengo a buscarlo, nos tenemos que ir a Neural.'),
      this.speak('Ok, pero no sé dónde está la llave.'),
      this.intercom('Bueno, lo espero acá abajo.'),
      this.think('Neural… ¿qué es eso?'),
      this.think('Debo apurarme y encontrar la llave.'),
    ])
    this.answered = true
    this.pista('Portero eléctrico', 'Un chofer me espera abajo para llevarme a Neural.')
  }

  private async salida() {
    if (!state.inventario.includes('llave')) {
      sfx.handle()
      await say(this, [this.think(this.answered ? 'Está cerrada con llave.' : 'Está cerrada… Primero veamos quién toca el timbre.')])
      return
    }
    // El cajón con candado es obligatorio: sin el informe no se sale
    if (!state.inventario.includes('informe')) {
      sfx.handle()
      await say(this, this.calendarSeen
        ? [this.think('El calendario decía que lleve el informe. Todavía no lo tengo.'), this.think('Quizás esté en ese cajón de la cocina.')]
        : [this.think('Quizás debería ver qué hay dentro de ese cajón en la cocina.')])
      return
    }
    sfx.door()
    this.leaving = true
    this.cameras.main.fadeOut(1200, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Stairs'))
  }

  // ---------- HUD: inventario y ayuda ----------

  private setupHud() {
    this.inv = this.add.container(this.scale.width - 30, 30).setScrollFactor(0).setDepth(950)
  }

  private addInventory(key: string) {
    if (!state.inventario.includes(key)) state.inventario.push(key)
    const i = this.inv.length / 2
    const bg = this.add.rectangle(-i * 60, 0, 50, 50, 0x000000, 0.45).setOrigin(1, 0).setStrokeStyle(2, 0x6c7385)
    const icon = this.add.image(-i * 60 - 25, 25, key)
    this.inv.add([bg, icon])
    icon.setScale(3)
    this.tweens.add({ targets: icon, scale: 1, duration: 400, ease: 'Back.Out' })
  }

  private async intro() {
    const lying = this.add.image(250, 488, 'jorge0').setAngle(-90).setDepth(5)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.centerOn(640, 360)
    this.cameras.main.fadeIn(2500, 0, 0, 0)
    // Duerme: las "z" suben desde la cabeza hasta que suena el timbre
    let n = 0
    const zzz = this.time.addEvent({
      delay: 650,
      loop: true,
      callback: () => {
        const z = text(this, 196, 462, n % 3 === 2 ? 'Z' : 'z', 20 + (n % 3) * 7, '#cfd6e6', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(20).setAlpha(0)
        n++
        this.tweens.add({ targets: z, x: z.x + 46, y: z.y - 80, duration: 1900, ease: 'Sine.Out', onComplete: () => z.destroy() })
        this.tweens.add({ targets: z, alpha: 0.9, duration: 350, yoyo: true, hold: 900 })
      },
    })
    await new Promise((r) => this.time.delayedCall(4600, r))
    zzz.remove()
    sfx.buzz()
    this.cameras.main.shake(300, 0.003)
    await new Promise((r) => this.time.delayedCall(1400, r))
    this.tweens.add({ targets: lying, angle: -70, duration: 300, yoyo: true })
    const enCama = (t: string): Line => ({ kind: 'thought', text: t, anchor: () => ({ x: 250, y: 470 }) })
    this.headache()
    await say(this, [enCama('Ay… se me parte la cabeza.'), enCama('Oh, Dios mío… ¿dónde estoy?')])
    // Se levanta
    this.tweens.add({ targets: lying, angle: 0, x: 430, y: FLOOR - 70, duration: 600, ease: 'Sine.InOut' })
    await new Promise((r) => this.time.delayedCall(650, r))
    lying.destroy()
    this.player.setVisible(true)
    this.lastX = this.player.x
    this.busy = false

    this.startRing()

    const help = text(this, 24, this.scale.height - 34, '← → / A D caminar   ·   E examinar / usar puertas   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa', 16, '#aab2c4')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500 }))
  }

  private async run(fn: () => Promise<void>) {
    this.busy = true
    this.player.setVelocityX(0)
    this.prompt.setVisible(false)
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
    // Física a paso fijo: misma velocidad con 30, 60 o 144 FPS
    this.acc += Math.min(delta, 100)
    while (this.acc >= STEP) {
      this.matter.world.step(STEP)
      this.acc -= STEP
    }
    const moved = Math.abs(this.player.x - this.lastX)
    this.lastX = this.player.x

    // Tic-tac del reloj: solo en la cocina, más fuerte cuanto más cerca está Jorge
    if (this.player.visible) {
      const d = CLOCK.x - this.player.x
      const near = this.room === 'cocina' ? Math.max(0, 1 - Math.abs(d) / CLOCK_RANGE) : 0
      this.clock?.setMix(near * near, Phaser.Math.Clamp(d / CLOCK_RANGE, -0.8, 0.8))
    }

    const k = this.keys
    const ePressed = Phaser.Input.Keyboard.JustDown(k.E)
    const tabPressed = Phaser.Input.Keyboard.JustDown(k.TAB)
    if (this.busy || time < this.lockUntil) {
      if (this.player.body) this.player.setVelocityX(0)
      return
    }

    if (tabPressed) {
      void this.run(() => openDiary(this))
      return
    }

    const dir = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0)
    this.player.setVelocityX(dir * WALK)
    if (dir !== 0) {
      this.facing = dir
      this.player.setFlipX(dir < 0)
      this.walkDist += moved
      this.stepDist += moved
      this.player.setTexture(Math.floor(this.walkDist / 20) % 2 === 0 ? 'jorge1' : 'jorge2')
      if (this.stepDist > 40) {
        this.stepDist = 0
        sfx.step()
      }
    } else {
      this.player.setTexture('jorge0')
    }

    // ¿Se despejó la mesa?
    if (!this.tableCleared && this.tableTrash.length) {
      const onTable = this.tableTrash.filter((t) => t.y < TABLE.top + 4 && t.x > TABLE.left - 4 && t.x < TABLE.right + 4)
      if (onTable.length === 0) {
        this.tableCleared = true
        this.bannerGlow?.setAlpha(0.35)
        this.tweens.add({ targets: this.bannerGlow, alpha: 0.1, yoyo: true, repeat: -1, duration: 700 })
        void this.run(() => say(this, [this.think('¿Cuánto hace que no limpio esto?')]))
        return
      }
    }

    const near = this.nearest()
    if (near) {
      // El ícono nunca tapa la cabeza de Jorge
      this.prompt.setVisible(true).setPosition(near.x, Math.min(near.y, FLOOR - 175))
      this.promptLabel.setText(near.id === 'mesa' && this.tableCleared ? 'Banner de Neural' : near.name)
      if (ePressed) {
        // Lo primero es atender el portero: hasta entonces solo se pueden usar puertas
        if (!this.answered && !near.door) {
          void this.run(() => say(this, [this.think('Primero tengo que ver quién toca el timbre.')]))
        } else {
          void this.run(near.action)
        }
      }
    } else {
      this.prompt.setVisible(false)
    }
  }
}

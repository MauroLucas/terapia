import * as Phaser from 'phaser'
import { addVignette, FONT, HAND_FONT, makeTextures } from '../art'
import { sfx, startClock, startRoomTone } from '../audio'
import { addPista, state } from '../state'
import { choose, eyelids, objective, onKey, overlay, say, text, toast, type Line, type Point } from '../ui'
import { showObjeto, showPage } from '../documents'
import { openDiary } from './diary'
import { controlsHelp } from '../touch'

// Casa de Jorge. El departamento se divide en ambientes unidos por puertas:
//   Cuarto  →  Pasillo: [puerta cuarto] … [puerta cocina] [puerta baño] … [portero | salida]
//                         ↓
//                       Cocina
// Cada ambiente ocupa su propio tramo del mundo; la cámara se limita al ambiente actual.
// Con `{ noche: true }` es La primera noche: Jorge vuelve de la Sesión 1, anota el recuerdo en la pizarra,
// encuentra la sortija, alguien toca el portero (no habla nadie) y se va a dormir.
// Con `{ noche: true, vuelta: 2 }` es La segunda noche: anota el boletín, encuentra el cuaderno de matemática con
// la letra de María y en el portero, entre la estática, una voz de mujer dice "¿Jorge?".
// Con `{ noche: true, vuelta: 3 }` es La tercera noche: anota la fiesta, encuentra en la caja la foto de la fiesta
// (la que faltaba en el portarretratos) y la vuelve a poner en su lugar.
// Con `{ manana: true }` es la Pre-sesión 2: una semana después, Jorge se despierta, suena el portero (el remis),
// puede repasar la pizarra y, al salir del cuarto, sigue directo en el consultorio (Office, sesión 2).
// Con `{ manana: true, vuelta: 2 }` es la Pre-sesión 3: lo mismo, después de La segunda noche (Office, sesión 3).
// Con `{ manana: true, vuelta: 3 }` es la Pre-sesión 4 (Office, sesión 4).
// Con `{ noche: true, vuelta: 4 }` es La cuarta noche: anota la pelea y, en la billetera, atrás de la foto de su mamá,
// encuentra el papelito con el número de su papá. Cuando suena el portero, no atiende.
// Con `{ manana: true, vuelta: 4 }` es la Pre-sesión 5 (Office, sesión 5).
// Con `{ noche: true, vuelta: 5 }` es La quinta noche: anota el reencuentro y, en la campera mojada, encuentra la
// servilleta que dibujó María. En el portero solo se escucha algo como lluvia.
// Con `{ manana: true, vuelta: 5 }` es la Pre-sesión 6 (Office, sesión 6).
// Con `{ noche: true, vuelta: 6 }` es La sexta noche: anota el viaje y, en el cajón de la cómoda, encuentra los
// boletos del micro a San Rafael. Cuando suena el portero, por un segundo cree que es su mamá.
// Con `{ manana: true, vuelta: 6 }` es la Pre-sesión 7 (Office, sesión 7).
// Con `{ noche: true, vuelta: 7 }` es La séptima noche: anota la muerte de su mamá y vuelve a leer el informe de
// Neural, que ahora se lee debajo de la tachadura. En el portero, una voz de mujer se corta antes de decir su nombre.
// Con `{ manana: true, vuelta: 7 }` es la Pre-sesión 8 (Office, sesión 8).
// Con `{ noche: true, vuelta: 8 }` es La octava noche: anota el velorio y, en el bolsillo del saco negro, encuentra
// el número nuevo de María. En el portero, la voz suena preocupada.
// Con `{ manana: true, vuelta: 8 }` es la Pre-sesión 9 (Office, sesión 9: la última).

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
  // La primera noche
  private noche = false
  private manana = false
  private vuelta = 1 // qué sesión vino antes: 1, 2 o 3 (de noche); en la mañana, la de la noche anterior
  private fotoPuesta = false
  private papelitoVisto = false
  private servilletaVista = false
  private boletoVisto = false
  private informeLeido = false
  private numeroVisto = false
  private goal?: ReturnType<typeof objective>
  private pizarraHecha = false
  private cajaVista = false
  private timbreNoche: 'no' | 'sonando' | 'atendido' = 'no'
  private caja?: Phaser.GameObjects.Graphics
  private roomTone?: { stop: (fade?: number) => void }
  private clock?: ReturnType<typeof startClock>
  private ring?: Phaser.Time.TimerEvent

  constructor() {
    super('Apartment')
  }

  create(data: { noche?: boolean; manana?: boolean; vuelta?: number } = {}) {
    this.noche = !!data.noche
    this.manana = !!data.manana
    this.vuelta = data.vuelta ?? 1
    this.pizarraHecha = this.cajaVista = this.fotoPuesta = this.papelitoVisto = this.servilletaVista = this.boletoVisto = this.informeLeido = this.numeroVisto = false
    this.timbreNoche = 'no'
    this.goal = undefined
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
    if (this.noche) this.setupNoche()
    if (this.manana) this.setupManana()
    addVignette(this, 0.8)

    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,A,D,E,SPACE,TAB,ESC') as Record<string, Phaser.Input.Keyboard.Key>
    this.setCameraRoom('cuarto')
    this.roomTone = startRoomTone()
    this.clock = startClock()
    this.events.once('shutdown', () => {
      this.roomTone?.stop(0.5)
      this.clock?.stop()
    })
    void (this.noche ? this.introNoche() : this.manana ? this.introManana() : this.intro())
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
    if (this.noche || this.manana) {
      // De noche, la basura de la mesa sigue en el piso, donde quedó a la mañana
      spawn('delivery', TABLE.left - 70, FLOOR - 15, 'caja')
      spawn('papel', TABLE.right + 60, FLOOR - 3, 'papel')
    } else {
      // Mesa tapada (encima del banner)
      spawn('delivery', TABLE.left + 80, TABLE.top - 16, 'caja', true)
      spawn('papel', TABLE.left + 140, TABLE.top - 4, 'papel', true)
      spawn('lata', TABLE.left + 195, TABLE.top - 8, 'lata', true)
    }

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

    if (this.noche) this.items = this.itemsNoche()
    if (this.manana) this.items = this.itemsManana()

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
      for (let age = 0; age <= 40; age += 10) {
        const x = x0 + ((x1 - x0) * age) / 40
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

  // ---------- La primera noche ----------

  // De noche: todo más oscuro, la lámpara de la mesita prendida, lo que Jorge se llevó a la mañana ya no está
  private setupNoche() {
    // Ya no hay nada que atender: se puede examinar todo desde el principio
    this.answered = true
    this.fridgeNotes?.destroy()
    this.drawerNote?.destroy()
    this.bannerStrip?.destroy()
    this.add.rectangle(0, 0, WORLD_W, 720, 0x0a1024, 0.4).setOrigin(0).setDepth(30)
    // Luz de la lámpara: un degradé redondo
    if (!this.textures.exists('luz-lampara')) {
      const tex = this.textures.createCanvas('luz-lampara', 360, 360)!
      const ctx = tex.getContext()
      const grad = ctx.createRadialGradient(180, 180, 0, 180, 180, 180)
      grad.addColorStop(0, 'rgba(255,217,160,0.32)')
      grad.addColorStop(0.4, 'rgba(255,217,160,0.12)')
      grad.addColorStop(1, 'rgba(255,217,160,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 360, 360)
      tex.refresh()
    }
    this.add.image(454, 510, 'luz-lampara').setDepth(31).setBlendMode(Phaser.BlendModes.ADD)
    // La caja de cosas de chico, que asoma debajo de la cama
    this.caja = this.add.graphics().setDepth(4)
    this.caja.fillStyle(0x9a7a4e).fillRect(270, 562, 96, 38)
    this.caja.fillStyle(0xb08d5c).fillRect(266, 556, 104, 10)
    this.caja.lineStyle(2, 0x6b5232).lineBetween(318, 556, 318, 566)
    this.add.text(318, 584, 'JORGE', { fontFamily: HAND_FONT, fontSize: '12px', color: '#4a3622', resolution: 2 }).setOrigin(0.5).setDepth(4)
    if (this.vuelta >= 2) {
      // La tapa de la caja quedó al costado, y lo que ya anotó está en la pizarra
      this.caja.fillStyle(0xb08d5c).fillRect(372, 590, 104, 10)
      this.marcasHasta(this.vuelta - 1)
    }
    if (this.vuelta === 5) {
      // La campera mojada, tirada sobre la cama
      const c = this.add.graphics().setDepth(6)
      c.fillStyle(0x2f3a52).fillRoundedRect(205, 478, 100, 30, 8).fillRoundedRect(292, 482, 40, 16, 6)
      c.fillStyle(0x8fb3d9, 0.5).fillCircle(232, 512, 3).fillCircle(270, 514, 2)
    }
    if (this.vuelta === 8) {
      // El saco negro del velorio, tirado sobre la cama
      const c = this.add.graphics().setDepth(6)
      c.fillStyle(0x1d1f26).fillRoundedRect(205, 478, 104, 30, 8).fillRoundedRect(296, 482, 40, 16, 6)
      c.fillStyle(0x2b2e38).fillRect(240, 484, 3, 22)
    }
    if (this.vuelta === 7) {
      // El informe de Neural, sobre la cómoda
      const inf = this.add.graphics().setDepth(6)
      inf.fillStyle(0xf7f6f1).fillRect(758, 482, 44, 8)
      inf.fillStyle(0x2f5fb8).fillRect(760, 482, 18, 3)
    }
    this.goal = objective(this)
  }

  // Marca de un recuerdo en la pizarra de la pared (la línea va de 0 a 40 años, de x 900 a 1040)
  private wallMark(age: number, color = 0x3e7d3c) {
    const x = 900 + (140 * age) / 40
    const m = this.add.graphics().setDepth(5)
    m.lineStyle(5, color, 0.5).lineBetween(900 + (140 * Math.floor(age / 10) * 10) / 40, 312, 900 + (140 * (Math.floor(age / 10) + 1) * 10) / 40, 312)
    m.fillStyle(color).fillCircle(x, 312, 4)
    m.lineStyle(1.5, color).lineBetween(x, 308, x, age < 10 ? 286 : age < 16 ? 280 : 272)
  }

  // Las marcas de lo que ya está anotado en la pizarra, y la foto en el portarretratos si ya la puso
  private marcasHasta(recuerdos: number) {
    if (recuerdos >= 1) this.wallMark(7)
    if (recuerdos >= 2) this.wallMark(15)
    if (recuerdos >= 3) {
      this.wallMark(17)
      this.drawFotoPortarretratos()
      this.fotoPuesta = true
    }
    if (recuerdos >= 4) this.wallMark(20, 0x8a3a3a)
    if (recuerdos >= 5) this.wallMark(30, 0x3a5a8a)
    if (recuerdos >= 6) this.wallMark(38, 0xc9952e)
    if (recuerdos >= 7) this.wallMark(39, 0x2b2b2b)
    if (recuerdos >= 8) this.wallMark(39.5, 0x6a7080)
  }

  private drawFotoPortarretratos() {
    const g = this.add.graphics().setDepth(5)
    g.fillStyle(0x2a2238).fillRect(705, 451, 26, 34)
    g.fillStyle(0x3e7d3c).fillRect(709, 464, 8, 18)
    g.fillStyle(0x8a3048).fillRect(719, 464, 8, 18)
    g.fillStyle(0xe7c09a).fillCircle(713, 460, 4).fillCircle(723, 460, 4)
  }

  private itemsNoche(): Interactable[] {
    const lejos = async () => say(this, [this.think('A esta hora no tengo nada que hacer acá.')])
    return [
      // Cuarto
      { id: 'billetera', name: 'Billetera', room: 'cuarto', x: 430, y: 500, action: () => this.fotoNoche() },
      { id: 'caja', name: 'Caja', room: 'cuarto', x: 318, y: 530, action: () => this.cajaNoche() },
      ...(this.vuelta === 5 ? [{ id: 'campera', name: 'Campera', room: 'cuarto' as RoomId, x: 254, y: 470, action: () => this.campera() }] : []),
      ...(this.vuelta === 6 ? [{ id: 'cajon', name: 'Cajón de la cómoda', room: 'cuarto' as RoomId, x: 780, y: 520, action: () => this.cajonBoletos() }] : []),
      ...(this.vuelta === 8 ? [{ id: 'saco', name: 'Saco negro', room: 'cuarto' as RoomId, x: 254, y: 470, action: () => this.sacoNumero() }] : []),
      ...(this.vuelta === 7 ? [{ id: 'informe', name: 'Informe de Neural', room: 'cuarto' as RoomId, x: 780, y: 480, action: () => this.informeNoche() }] : []),
      { id: 'cama', name: 'Dormir', room: 'cuarto', x: 190, y: 470, action: () => this.dormir() },
      { id: 'portarretratos', name: 'Portarretratos', room: 'cuarto', x: 718, y: 430, action: () => this.portarretratosNoche() },
      { id: 'pizarra', name: 'Pizarra', room: 'cuarto', x: 970, y: 300, action: () => this.pizarraNoche() },
      { id: 'aPasillo', name: 'Puerta al pasillo', room: 'cuarto', x: DOORS.cuartoAPasillo, y: 400, door: true, action: () => this.salirDelCuartoNoche() },
      // Pasillo
      { id: 'aCuarto', name: 'Cuarto', room: 'pasillo', x: DOORS.pasilloACuarto, y: 400, door: true, action: () => this.goTo('cuarto', DOORS.cuartoAPasillo) },
      { id: 'aCocina', name: 'Cocina', room: 'pasillo', x: DOORS.pasilloACocina, y: 400, door: true, action: () => this.goTo('cocina', DOORS.cocinaAPasillo) },
      {
        id: 'bano', name: 'Baño', room: 'pasillo', x: DOORS.bano, y: 400, door: true,
        action: async () => {
          sfx.handle()
          this.cameras.main.shake(120, 0.002)
          await say(this, [this.think('Parece bloqueada desde adentro.')])
          this.pista('Puerta del baño', 'Está trabada desde adentro.')
        },
      },
      { id: 'portero', name: 'Portero eléctrico', room: 'pasillo', x: DOORS.portero, y: 370, door: true, action: () => this.porteroNoche() },
      { id: 'salida', name: 'Salida', room: 'pasillo', x: DOORS.salida, y: 390, door: true, action: async () => say(this, [this.think('Ya es de noche. No tengo a dónde ir.')]) },
      // Cocina
      { id: 'cocinaAPasillo', name: 'Pasillo', room: 'cocina', x: DOORS.cocinaAPasillo, y: 400, door: true, action: () => this.goTo('pasillo', DOORS.pasilloACocina) },
      { id: 'calendario', name: 'Calendario', room: 'cocina', x: K + 692, y: 290, action: async () => say(this, this.vuelta >= 2 ? [this.think('Otra semana. Otra vez Neural.')] : [this.think('Hoy fui a Neural.'), this.think('La próxima cruz la pongo mañana.')]) },
      { id: 'heladera', name: 'Heladera', room: 'cocina', x: K + 270, y: 380, action: lejos },
      { id: 'cajon', name: 'Cajón', room: 'cocina', x: K + 1220, y: 460, action: async () => say(this, [this.think('El cajón quedó abierto. Está vacío.')]) },
    ]
  }

  private async introNoche() {
    const x = DOORS.salida - 80
    this.player.setPosition(x, FLOOR - 70).setVisible(true).setFlipX(true)
    this.facing = -1
    this.lastX = x
    this.setCameraRoom('pasillo')
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.centerOn(x, 360)
    this.cameras.main.fadeIn(2000, 0, 0, 0)
    sfx.door()
    await new Promise((r) => this.time.delayedCall(1800, r))
    await say(this, this.vuelta === 8
      ? [this.think('Volví.'), this.think('Todavía tengo puesto el olor de las flores.'), this.think('El velorio. María en la vereda.'), this.think('Tengo que anotarlo.')]
      : this.vuelta === 7
      ? [this.think('Volví.'), this.think('La casa está muy callada.'), this.think('Mamá se murió. Quince días después del viaje.'), this.think('Yo estaba con ella.'), this.think('Tengo que anotarlo.')]
      : this.vuelta === 6
      ? [this.think('Volví.'), this.think('San Rafael. El río. Los álamos.'), this.think('Le vi la cara a mamá.'), this.think('Tengo que anotarlo.')]
      : this.vuelta === 5
      ? [this.think('Volví.'), this.think('Estoy empapado.'), this.think('María. El bar. La lluvia.'), this.think('Y me fui.')]
      : this.vuelta === 4
      ? [this.think('Volví.'), this.think('El departamento vacío. María yéndose.'), this.think('Y mamá en el piso.'), this.think('Tengo que anotarlo. Aunque no quiera.')]
      : this.vuelta === 3
      ? [this.think('Volví.'), this.think('La plaza. La fiesta. La casa de María.'), this.think('Hoy no me duele nada.'), this.think('Tengo que anotarlo.')]
      : this.vuelta === 2
      ? [this.think('Volví.'), this.think('Mi papá. El boletín. Esa noche, en el piso de mi cuarto.'), this.think('Y María.'), this.think('Tengo que anotarlo.')]
      : [this.think('Ya está. Volví a casa.'), this.think('Mi mamá. La feria. La calesita.'), this.think('Tengo que anotarlo antes de que se me olvide.')])
    this.goal?.set('Anotar lo que recordé en la pizarra')
    this.busy = false
    const help = text(this, 24, this.scale.height - 34, controlsHelp('← → / A D caminar   ·   E examinar / usar puertas   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa'), 16, '#aab2c4')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500 }))
  }

  private nextGoal() {
    if (this.timbreNoche === 'sonando') this.goal?.set('Atender el portero')
    else if (!this.pizarraHecha) this.goal?.set('Anotar lo que recordé en la pizarra')
    else this.goal?.set('Irme a dormir')
  }

  // La pizarra: el jugador elige en qué parte de la línea va el recuerdo
  private pizarraOverlay(recuerdos: number) {
    const feria = recuerdos >= 1
    const boletin = recuerdos >= 2
    const fiesta = recuerdos >= 3
    return overlay(this, (c, w) => {
      const ink = '#2b3140'
      c.add(text(this, -w / 2 + 40, -180, 'MI VIDA', 30, ink, { fontFamily: HAND_FONT, fontStyle: 'bold' }).setOrigin(0, 0.5))
      const x0 = -w / 2 + 90
      const x1 = w / 2 - 90
      const g = this.add.graphics().lineStyle(4, 0x2b3140).lineBetween(x0, 0, x1, 0)
      for (let age = 0; age <= 40; age += 10) {
        const x = x0 + ((x1 - x0) * age) / 40
        g.lineBetween(x, -12, x, 12)
        c.add(text(this, x, 22, String(age), 16, '#7a8090', { fontFamily: HAND_FONT }).setOrigin(0.5, 0))
      }
      if (feria) {
        // Primer tramo: la infancia, con la feria marcada cerca de los 7 años
        const xa = x0 + ((x1 - x0) * 7) / 40
        g.lineStyle(10, 0x3e7d3c, 0.35).lineBetween(x0, 0, x0 + (x1 - x0) / 4, 0)
        g.fillStyle(0x3e7d3c).fillCircle(xa, 0, 9)
        g.lineStyle(2, 0x3e7d3c).lineBetween(xa, -10, xa, -62)
        c.add(text(this, xa, -66, 'La feria con mamá', 22, '#2e5f2c', { fontFamily: HAND_FONT }).setOrigin(0.5, 1))
        c.add(text(this, xa, 58, 'me perdí y\nella me encontró', 16, '#4a5060', { fontFamily: HAND_FONT, align: 'center' }).setOrigin(0.5, 0))
      }
      if (boletin) {
        // Segundo tramo: la adolescencia, con el boletín cerca de los 15 años
        const xb = x0 + ((x1 - x0) * 15) / 40
        g.lineStyle(10, 0x3e7d3c, 0.35).lineBetween(x0 + (x1 - x0) / 4, 0, x0 + (x1 - x0) / 2, 0)
        g.fillStyle(0x3e7d3c).fillCircle(xb, 0, 9)
        g.lineStyle(2, 0x3e7d3c).lineBetween(xb, -10, xb, -108)
        c.add(text(this, xb, -112, 'El boletín', 22, '#2e5f2c', { fontFamily: HAND_FONT }).setOrigin(0.5, 1))
        c.add(text(this, xb, 104, 'papá. Esa noche no\nle abrí a mamá.\nConocí a María', 16, '#4a5060', { fontFamily: HAND_FONT, align: 'center' }).setOrigin(0.5, 0))
      }
      if (recuerdos >= 8) {
        // Octavo recuerdo: el velorio, al otro día. En gris, arriba de todo
        const xh = x0 + ((x1 - x0) * 39.2) / 40
        g.fillStyle(0x6a7080).fillCircle(xh, 0, 6)
        g.lineStyle(2, 0x6a7080).lineBetween(xh, -10, xh, -192)
        c.add(text(this, xh - 6, -192, 'El velorio. María', 18, '#4a5060', { fontFamily: HAND_FONT }).setOrigin(1, 0.5))
      }
      if (recuerdos >= 7) {
        // Séptimo recuerdo: la muerte de mamá, quince días después del viaje. En negro, más arriba
        const xg = x0 + ((x1 - x0) * 38.6) / 40
        g.fillStyle(0x2b2b2b).fillCircle(xg, 0, 7)
        g.lineStyle(2, 0x2b2b2b).lineBetween(xg, -10, xg, -150)
        c.add(text(this, recuerdos >= 8 ? xg - 4 : xg + 14, -154, 'Mamá', 22, '#2b2b2b', { fontFamily: HAND_FONT }).setOrigin(1, 1))
        c.add(text(this, xg - 20, 152, 'Quince días después.\nEstaba con ella.', 16, '#2b2b2b', { fontFamily: HAND_FONT, align: 'center' }).setOrigin(0.5, 0))
      }
      if (recuerdos >= 6) {
        // Sexto recuerdo: el viaje, a los 38. En dorado
        const xf = x0 + ((x1 - x0) * 38) / 40
        g.fillStyle(0xc9952e).fillCircle(xf, 0, 9)
        g.lineStyle(2, 0xc9952e).lineBetween(xf, -10, xf, -106)
        // Con la marca de mamá al lado, el título del viaje se corre a la izquierda de su línea
        c.add(text(this, recuerdos >= 7 ? xf - 4 : xf, -110, 'El viaje', 22, '#8a6a1e', { fontFamily: HAND_FONT }).setOrigin(recuerdos >= 7 ? 1 : 0.5, 1))
        c.add(text(this, xf - 20, 104, 'San Rafael, con mamá.\n12/08. Le vi la cara.', 16, '#4a5060', { fontFamily: HAND_FONT, align: 'center' }).setOrigin(0.5, 0))
      }
      if (recuerdos >= 5) {
        // Quinto recuerdo: el reencuentro, a los 30. En azul
        const xe = x0 + ((x1 - x0) * 30) / 40
        g.lineStyle(10, 0x3a5a8a, 0.3).lineBetween(x0 + ((x1 - x0) * 3) / 4, 0, x1, 0)
        g.fillStyle(0x3a5a8a).fillCircle(xe, 0, 9)
        g.lineStyle(2, 0x3a5a8a).lineBetween(xe, -10, xe, -62)
        c.add(text(this, xe, -66, 'El reencuentro', 22, '#2e4f7a', { fontFamily: HAND_FONT }).setOrigin(0.5, 1))
        c.add(text(this, xe, 58, 'María, en un bar.\nLa lluvia. Me fui.', 16, '#4a5060', { fontFamily: HAND_FONT, align: 'center' }).setOrigin(0.5, 0))
      }
      if (recuerdos >= 4) {
        // Cuarto recuerdo: la pelea, a los 20. En otro color, y sin nada más escrito
        const xd = x0 + ((x1 - x0) * 20) / 40
        g.lineStyle(10, 0x8a3a3a, 0.3).lineBetween(x0 + (x1 - x0) / 2, 0, x0 + ((x1 - x0) * 3) / 4, 0)
        g.fillStyle(0x8a3a3a).fillCircle(xd, 0, 9)
        g.lineStyle(2, 0x8a3a3a).lineBetween(xd, -10, xd, -62)
        c.add(text(this, xd, -66, 'La pelea', 22, '#7a2e2e', { fontFamily: HAND_FONT }).setOrigin(0.5, 1))
      }
      if (fiesta) {
        // Tercer recuerdo: la fiesta, cerca de los 17 años. Más arriba y hacia la derecha, para no tapar el boletín
        const xc = x0 + ((x1 - x0) * 17) / 40
        g.fillStyle(0x3e7d3c).fillCircle(xc, 0, 9)
        g.lineStyle(2, 0x3e7d3c).lineBetween(xc, -10, xc, -146)
        c.add(text(this, xc - 6, -150, 'La fiesta', 22, '#2e5f2c', { fontFamily: HAND_FONT }).setOrigin(0, 1))
        c.add(text(this, xc + 10, 58, 'María. La foto.\nEl primer beso', 16, '#4a5060', { fontFamily: HAND_FONT }).setOrigin(0, 0))
      }
      c.add(g)
      c.add(text(this, x0, -24, 'Nací', 22, ink, { fontFamily: HAND_FONT }).setOrigin(0.5, 1))
      c.add(text(this, x1, -24, 'HOY', 22, '#b11', { fontFamily: HAND_FONT, fontStyle: 'bold' }).setOrigin(0.5, 1))
    }, { w: 820, h: 420, paper: 0xe9e9e4 })
  }

  private async pizarraNoche() {
    if (this.vuelta === 8) return this.pizarraNoche8()
    if (this.vuelta === 7) return this.pizarraNoche7()
    if (this.vuelta === 6) return this.pizarraNoche6()
    if (this.vuelta === 5) return this.pizarraNoche5()
    if (this.vuelta === 4) return this.pizarraNoche4()
    if (this.vuelta === 3) return this.pizarraNoche3()
    if (this.vuelta === 2) return this.pizarraNoche2()
    if (this.pizarraHecha) {
      await this.pizarraOverlay(1)
      await say(this, [this.think('Es lo único que hay. Pero ya no está vacía.')])
      return
    }
    await this.pizarraOverlay(0)
    await say(this, [this.think('¿Dónde va lo de la feria?')])
    for (;;) {
      const i = await choose(this, ['Entre los 0 y los 10 años', 'Entre los 10 y los 20', 'Entre los 20 y los 30', 'Entre los 30 y los 40'], { x: 640, y: 600 })
      if (i === 0) break
      await say(this, [this.think('No… Era chico. Tenía las manos chiquitas.')])
    }
    sfx.paper()
    await this.pizarraOverlay(1)
    await say(this, [this.think('"La feria con mamá."'), this.think('Es lo primero que anoto.')])
    this.pizarraHecha = true
    // En la pizarra de la pared también aparece la marca
    const mark = this.add.graphics().setDepth(5)
    mark.lineStyle(5, 0x3e7d3c, 0.5).lineBetween(900, 312, 935, 312)
    mark.fillStyle(0x3e7d3c).fillCircle(924, 312, 4)
    mark.lineStyle(1.5, 0x3e7d3c).lineBetween(924, 308, 924, 286)
    if (!state.lineaDeTiempo.includes('Infancia: la feria')) state.lineaDeTiempo.push('Infancia: la feria')
    this.pista('Pizarra', 'Anoté mi primer recuerdo: la feria con mamá, cuando era chico.')
    this.nextGoal()
  }

  // Segunda noche: el boletín va en la adolescencia
  private async pizarraNoche2() {
    if (this.pizarraHecha) {
      await this.pizarraOverlay(2)
      await say(this, [this.think('Dos cosas. Ya es algo.')])
      return
    }
    await this.pizarraOverlay(1)
    await say(this, [this.think('¿Dónde va lo del boletín?')])
    for (;;) {
      const i = await choose(this, ['Entre los 0 y los 10 años', 'Entre los 10 y los 20', 'Entre los 20 y los 30', 'Entre los 30 y los 40'], { x: 640, y: 600 })
      if (i === 1) break
      await say(this, [this.think(i === 0 ? 'No. Ya no era tan chico. Iba a la secundaria.' : 'No… Era más chico. Tenía quince, dieciséis.')])
    }
    sfx.paper()
    await this.pizarraOverlay(2)
    await say(this, [this.think('"El boletín."'), this.think('No quiero escribir más que eso.')])
    this.pizarraHecha = true
    this.wallMark(15)
    if (!state.lineaDeTiempo.includes('Adolescencia: el boletín')) state.lineaDeTiempo.push('Adolescencia: el boletín')
    this.pista('El boletín en la pizarra', 'Anoté el segundo recuerdo: el boletín, cuando tenía quince. Mi papá. Y María.')
    this.nextGoal()
  }

  // Tercera noche: la fiesta, a los 17, también va en la adolescencia
  private async pizarraNoche3() {
    if (this.pizarraHecha) {
      await this.pizarraOverlay(3)
      await say(this, [this.think('Tres cosas. Y la última es linda.')])
      return
    }
    await this.pizarraOverlay(2)
    await say(this, [this.think('¿Dónde va lo de la fiesta?')])
    for (;;) {
      const i = await choose(this, ['Entre los 0 y los 10 años', 'Entre los 10 y los 20', 'Entre los 20 y los 30', 'Entre los 30 y los 40'], { x: 640, y: 600 })
      if (i === 1) break
      await say(this, [this.think(i === 0 ? 'No. Ya era grande. Terminaba la secundaria.' : 'No… Todavía iba al colegio. Tenía diecisiete.')])
    }
    sfx.paper()
    await this.pizarraOverlay(3)
    await say(this, [this.think('"La fiesta."'), this.think('Esta vez quiero escribir todo.')])
    this.pizarraHecha = true
    this.wallMark(17)
    if (!state.lineaDeTiempo.includes('Adolescencia: la fiesta')) state.lineaDeTiempo.push('Adolescencia: la fiesta')
    this.pista('La fiesta en la pizarra', 'Anoté el tercer recuerdo: la fiesta de egresados, a los diecisiete. María, la foto, el primer beso.')
    this.nextGoal()
  }

  // Cuarta noche: la pelea, a los 20, en la juventud. No quiere escribir lo que pasó
  private async pizarraNoche4() {
    if (this.pizarraHecha) {
      await this.pizarraOverlay(4)
      await say(this, [this.think('"La pelea." Nada más.')])
      return
    }
    await this.pizarraOverlay(3)
    await say(this, [this.think('¿Dónde va lo de la pelea?')])
    for (;;) {
      const i = await choose(this, ['Entre los 0 y los 10 años', 'Entre los 10 y los 20', 'Entre los 20 y los 30', 'Entre los 30 y los 40'], { x: 640, y: 600 })
      if (i === 2) break
      await say(this, [this.think(i < 2 ? 'No. Ya había terminado el colegio. Tenía veinte.' : 'No… Fue hace mucho. Tenía veinte.')])
    }
    sfx.paper()
    await this.pizarraOverlay(4)
    await say(this, [this.think('"La pelea."'), this.think('No puedo escribir lo que hice.')])
    this.pizarraHecha = true
    this.wallMark(20, 0x8a3a3a)
    if (!state.lineaDeTiempo.includes('Juventud: la pelea')) state.lineaDeTiempo.push('Juventud: la pelea')
    this.pista('La pelea en la pizarra', 'Anoté el cuarto recuerdo: la pelea, a los veinte. No pude escribir nada más.')
    this.nextGoal()
  }

  // Quinta noche: el reencuentro, a los 30
  private async pizarraNoche5() {
    if (this.pizarraHecha) {
      await this.pizarraOverlay(5)
      await say(this, [this.think('Ya casi llego a hoy.')])
      return
    }
    await this.pizarraOverlay(4)
    await say(this, [this.think('¿Dónde va lo de María, en el bar?')])
    for (;;) {
      const i = await choose(this, ['Entre los 0 y los 10 años', 'Entre los 10 y los 20', 'Entre los 20 y los 30', 'Entre los 30 y los 40'], { x: 640, y: 600 })
      if (i === 3) break
      await say(this, [this.think(i === 2 ? 'No… Ya habían pasado diez años de Córdoba. Tenía treinta.' : 'No. Ya era grande. Tenía treinta.')])
    }
    sfx.paper()
    await this.pizarraOverlay(5)
    await say(this, [this.think('"El reencuentro."'), this.think('"Me fui."')])
    this.pizarraHecha = true
    this.wallMark(30, 0x3a5a8a)
    if (!state.lineaDeTiempo.includes('Los 30: el reencuentro')) state.lineaDeTiempo.push('Los 30: el reencuentro')
    this.pista('El reencuentro en la pizarra', 'Anoté el quinto recuerdo: el reencuentro con María, a los treinta. La lluvia. El beso. Me fui.')
    this.nextGoal()
  }

  // Sexta noche: el viaje, a los 38
  private async pizarraNoche6() {
    if (this.pizarraHecha) {
      await this.pizarraOverlay(6)
      await say(this, [this.think('Lo último es lo más cerca de hoy.'), this.think('Y después del viaje…'), this.think('No. Hoy no.')])
      return
    }
    await this.pizarraOverlay(5)
    await say(this, [this.think('¿Dónde va el viaje con mamá?')])
    for (;;) {
      const i = await choose(this, ['Entre los 0 y los 10 años', 'Entre los 10 y los 20', 'Entre los 20 y los 30', 'Entre los 30 y los 40'], { x: 640, y: 600 })
      if (i === 3) break
      await say(this, [this.think('No. Fue hace poco. Tenía treinta y ocho.')])
    }
    sfx.paper()
    await this.pizarraOverlay(6)
    await say(this, [this.think('"El viaje."'), this.think('"Le vi la cara."')])
    this.pizarraHecha = true
    this.wallMark(38, 0xc9952e)
    if (!state.lineaDeTiempo.includes('Adultez: el viaje')) state.lineaDeTiempo.push('Adultez: el viaje')
    this.pista('El viaje en la pizarra', 'Anoté el sexto recuerdo: el viaje a San Rafael con mamá, a los treinta y ocho. 12/08. Le vi la cara.')
    this.nextGoal()
  }

  // Séptima noche: la muerte de mamá, quince días después del viaje
  private async pizarraNoche7() {
    if (this.pizarraHecha) {
      await this.pizarraOverlay(7)
      await say(this, [this.think('"Mamá."'), this.think('No me salió escribir más.')])
      return
    }
    await this.pizarraOverlay(6)
    await say(this, [this.think('Al lado del viaje.'), this.think('¿Cuánto tiempo después fue?')])
    for (;;) {
      const i = await choose(this, ['Un año después', 'Seis meses después', 'Quince días después', 'Un mes después'], { x: 640, y: 600 })
      if (i === 2) break
      await say(this, [this.think('No. Fue enseguida. Quince días.')])
    }
    sfx.paper()
    await this.pizarraOverlay(7)
    await say(this, [this.think('"Mamá."'), this.think('"Estaba con ella."')])
    this.pizarraHecha = true
    this.wallMark(39, 0x2b2b2b)
    if (!state.lineaDeTiempo.includes('La pérdida: la muerte de mamá')) state.lineaDeTiempo.push('La pérdida: la muerte de mamá')
    this.pista('Mamá, en la pizarra', 'Anoté el séptimo recuerdo: la muerte de mamá, quince días después del viaje. Yo estaba con ella.')
    this.nextGoal()
  }

  // Octava noche: el velorio, al otro día de la muerte de mamá
  private async pizarraNoche8() {
    if (this.pizarraHecha) {
      await this.pizarraOverlay(8)
      await say(this, [this.think('"El velorio. María."'), this.think('Ya casi no queda lugar.')])
      return
    }
    await this.pizarraOverlay(7)
    await say(this, [this.think('¿Cuándo fue el velorio?')])
    for (;;) {
      const i = await choose(this, ['Una semana después', 'Al otro día', 'Un mes después', 'No fui'], { x: 640, y: 600 })
      if (i === 1) break
      await say(this, [this.think(i === 3 ? 'Fui. Aunque no quería estar ahí.' : 'No. Fue al otro día.')])
    }
    sfx.paper()
    await this.pizarraOverlay(8)
    await say(this, [this.think('"El velorio. María."'), this.think('No escribo lo que le dije.')])
    this.pizarraHecha = true
    this.wallMark(39.5, 0x6a7080)
    if (!state.lineaDeTiempo.includes('La pérdida: el velorio')) state.lineaDeTiempo.push('La pérdida: el velorio')
    this.pista('El velorio, en la pizarra', 'Anoté el octavo recuerdo: el velorio de mamá, al otro día. María vino a verme.')
    this.nextGoal()
  }

  // Octava noche: en el bolsillo del saco negro, el número nuevo de María
  private async sacoNumero() {
    if (this.numeroVisto) {
      await say(this, [this.think('"Llamame. A la hora que sea."')])
      return
    }
    this.numeroVisto = true
    sfx.paper()
    await say(this, [this.think('El saco del velorio.'), this.think('En el bolsillo hay un papel.')])
    this.addInventory('numeroMaria')
    await showObjeto(this, 'numeroMaria')
    await say(this, [
      this.think('El número de María.'),
      this.think('Como el papelito de papá.'),
      this.think('Otro número que guardo y no llamo.'),
    ])
    this.pista('El número, en el saco', 'En el bolsillo del saco negro estaba el número nuevo de María. Como el papelito de papá: otro número que guardo y no llamo.')
    this.nextGoal()
  }

  // Séptima noche: el informe de Neural, otra vez. Debajo de la tachadura ahora se lee
  private async informeNoche() {
    if (this.informeLeido) {
      await say(this, [this.think('"La muerte de su madre."'), this.think('Nadie lo tachó. Era yo el que no lo quería leer.')])
      return
    }
    this.informeLeido = true
    sfx.paper()
    await say(this, [this.think('El informe de Neural.'), this.think('La parte tachada…')])
    await showPage(this, 'informeClaro', 0)
    await say(this, [
      this.think('Ahora se lee.'),
      this.think('"Fuerte resistencia ante recuerdos vinculados a la muerte de su madre."'),
      this.think('Nadie lo tachó.'),
      this.think('Era yo el que no lo quería leer.'),
    ])
    this.pista('Lo que estaba tachado', 'Volví a leer el informe de Neural. Debajo de la tachadura ahora se lee: "la muerte de su madre".')
    this.nextGoal()
  }

  // Sexta noche: en el cajón de la cómoda, los boletos del micro a San Rafael
  private async cajonBoletos() {
    if (this.boletoVisto) {
      await say(this, [this.think('Asientos 23 y 24. Ella del lado de la ventana.')])
      return
    }
    this.boletoVisto = true
    sfx.paper()
    await say(this, [this.think('El cajón de la cómoda.'), this.think('Abajo de todo, dos papelitos de colores.')])
    this.addInventory('boleto')
    await showObjeto(this, 'boleto')
    await say(this, [
      this.think('Los boletos del micro a San Rafael.'),
      this.think('Los de la vuelta no los guardé. Estos sí.'),
      this.think('Los guardé.'),
    ])
    this.pista('Los boletos', 'En el cajón de la cómoda estaban los boletos del micro a San Rafael, el del viaje con mamá. Los guardé.')
    this.nextGoal()
  }

  // Quinta noche: en el bolsillo de la campera mojada, la servilleta del bar
  private async campera() {
    if (this.servilletaVista) {
      await say(this, [this.think('Todavía está mojada.')])
      return
    }
    this.servilletaVista = true
    sfx.paper()
    await say(this, [this.think('La campera. Empapada.'), this.think('En el bolsillo hay algo.')])
    this.addInventory('servilleta')
    await showObjeto(this, 'servilleta')
    await say(this, [
      this.think('La servilleta del bar.'),
      this.think('La ventana de la cocina, con plantas.'),
      this.think('La cocina no tiene ninguna.'),
    ])
    this.pista('La servilleta, en la campera', 'En la campera mojada estaba la servilleta que dibujó María en el bar: la ventana de la cocina con plantas. Mi cocina no tiene ninguna.')
    this.nextGoal()
  }

  private async fotoNoche() {
    if (this.vuelta >= 8) {
      await say(this, [this.think('San Rafael. La misma foto que pusieron arriba del cajón.')])
      return
    }
    if (this.vuelta >= 7) {
      await say(this, [this.think('San Rafael. 12/08.'), this.think('Quince días después ya no estaba.')])
      return
    }
    if (this.vuelta >= 5) {
      await say(this, [this.think('La foto de mamá. Y atrás, el papelito.'), this.think('"Llamala, Jorge", me dijo María.')])
      return
    }
    if (this.vuelta === 4) return this.billeteraPapelito()
    await showPage(this, 'foto', 0)
    await say(this, [
      this.think('La señora de la foto…'),
      this.think('En el sueño no le pude ver la cara.'),
      this.think('Pero algo me dice que es ella. Mi mamá.'),
    ])
    if (!state.inventario.includes('foto')) this.addInventory('foto')
    this.pista('La señora de la foto', 'Creo que es mi mamá: la misma que me encontró en la feria.')
    this.removeItem('billetera')
  }

  private async cajaNoche() {
    if (this.vuelta >= 4) {
      await say(this, [this.think('La caja con mi nombre.'), this.think('Esa noche me la llevé de la casa de mamá. En el mismo bolso.')])
      return
    }
    if (this.vuelta === 3) return this.fotoCaja()
    if (this.vuelta === 2) return this.cuaderno()
    if (this.cajaVista) {
      await say(this, [this.think('Cosas de cuando era chico.')])
      return
    }
    this.cajaVista = true
    sfx.paper()
    await say(this, [this.think('Una caja con mi nombre.'), this.think('Figuritas, un autito sin una rueda, dibujos…')])
    const s = this.add.image(318, 548, 'sortija').setDepth(32)
    await new Promise((r) => this.time.delayedCall(400, r))
    this.tweens.add({ targets: s, y: s.y - 60, alpha: 0, duration: 600, onComplete: () => s.destroy() })
    sfx.pickup()
    this.addInventory('sortija')
    await showObjeto(this, 'sortija')
    await say(this, [this.think('La sortija de la calesita.'), this.think('Fue real.'), this.think('Alguien la guardó todos estos años.')])
    this.pista('La sortija', 'En una caja de cosas de chico estaba la sortija de la calesita. El recuerdo fue real.')
  }

  // Segunda noche: abajo de todo en la caja, el cuaderno de matemática con la letra de María
  private async cuaderno() {
    if (this.cajaVista) {
      await say(this, [this.think('Mi cuaderno. Y la letra de María.')])
      return
    }
    this.cajaVista = true
    sfx.paper()
    await say(this, [this.think('La caja de cosas de chico.'), this.think('Abajo de todo hay algo más. Un cuaderno.')])
    this.addInventory('cuaderno')
    await showObjeto(this, 'cuaderno')
    await say(this, [
      this.think('Mi cuaderno de matemática.'),
      this.think('Esta letra no es mía.'),
      this.think('María. Los martes, en la plaza.'),
      this.think('Fue real.'),
    ])
    this.pista('El cuaderno', 'En la caja estaba mi cuaderno de matemática de cuando tenía quince. En los márgenes, la letra de María.')
  }

  // Cuarta noche: en la billetera, atrás de la foto de su mamá, el papelito con el número de su papá
  private async billeteraPapelito() {
    if (this.papelitoVisto) {
      await say(this, [this.think('El número de papá. Veinte años en la billetera.')])
      return
    }
    this.papelitoVisto = true
    await showPage(this, 'foto', 0)
    await say(this, [this.think('Mamá, en el viaje.'), this.think('Atrás de la foto hay algo doblado.')])
    sfx.paper()
    this.addInventory('papelito')
    await showObjeto(this, 'papelito')
    await say(this, [
      this.think('El papelito.'),
      this.think('El número de papá, con la letra de mamá.'),
      this.think('Lo guardé veinte años.'),
      this.think('Y nunca lo llamé.'),
    ])
    this.pista('El papelito, en la billetera', 'Atrás de la foto de mamá, en la billetera, estaba el papelito con el número de papá. Lo llevo encima hace veinte años y nunca lo llamé.')
    this.nextGoal()
  }

  // Tercera noche: abajo de todo en la caja, boca abajo, la foto de la fiesta
  private async fotoCaja() {
    if (this.cajaVista) {
      await say(this, [this.think(this.fotoPuesta ? 'Ya no queda nada abajo de todo.' : 'La foto de la fiesta. Su lugar es el portarretratos.')])
      return
    }
    this.cajaVista = true
    sfx.paper()
    await say(this, [this.think('La caja otra vez.'), this.think('Abajo del cuaderno hay una foto. Boca abajo.')])
    this.addInventory('fotoFiesta')
    await showObjeto(this, 'fotoFiesta')
    await say(this, [
      this.think('La foto de la fiesta.'),
      this.think('María y yo.'),
      this.think('Es la foto del portarretratos.'),
      this.think('La saqué yo. No me acuerdo por qué.'),
    ])
    this.pista('La foto de la fiesta', 'En la caja, boca abajo, estaba la foto de la fiesta de egresados: María y yo. Es la que faltaba en el portarretratos. La saqué yo y no me acuerdo por qué.')
  }

  // Tercera noche: la foto vuelve al portarretratos
  private async portarretratosNoche() {
    if (this.vuelta >= 8) {
      await say(this, [this.think('María a los diecisiete.'), this.think('En la vereda me miraba igual. Preocupada.')])
      return
    }
    if (this.vuelta >= 7) {
      await say(this, [this.think('María a los diecisiete.'), this.think('No la llamé cuando murió mamá.'), this.think('No llamé a nadie.')])
      return
    }
    if (this.vuelta >= 6) {
      await say(this, [this.think('María a los diecisiete.'), this.think('Y en la billetera, mamá a los sesenta y pico. Riéndose.')])
      return
    }
    if (this.vuelta >= 5) {
      await say(this, [this.think('María a los diecisiete.'), this.think('Hoy la vi a los treinta. Tiene la misma risa.')])
      return
    }
    if (this.vuelta >= 4) {
      await say(this, [this.think('María y yo.'), this.think('Esa misma tarde me dijo que se iba a Córdoba.')])
      return
    }
    if (this.vuelta !== 3 || !this.cajaVista) {
      await say(this, [this.think('Sigue vacío.')])
      return
    }
    if (this.fotoPuesta) {
      await say(this, [this.think('María y yo. Diecisiete años.')])
      return
    }
    await this.ponerFoto()
  }

  private async ponerFoto() {
    this.fotoPuesta = true
    sfx.pickup()
    this.drawFotoPortarretratos()
    await say(this, [this.think('Ahí está.'), this.think('Ahí estaba.')])
    this.pista('El portarretratos', 'Volví a poner la foto de la fiesta en el portarretratos. Ya no está vacío.')
  }

  // Después de la pizarra, al salir del cuarto, suena el portero
  private async salirDelCuartoNoche() {
    await this.goTo('pasillo', DOORS.pasilloACuarto)
    if (!this.pizarraHecha || this.timbreNoche !== 'no') return
    await new Promise((r) => this.time.delayedCall(700, r))
    this.timbreNoche = 'sonando'
    sfx.buzz()
    this.cameras.main.shake(200, 0.002)
    this.ring?.remove()
    this.ring = this.time.addEvent({
      delay: 9000,
      loop: true,
      callback: () => {
        if (this.timbreNoche !== 'sonando') return
        sfx.buzz()
        this.cameras.main.shake(200, 0.002)
      },
    })
    await new Promise((r) => this.time.delayedCall(1200, r))
    await say(this, [this.think('¿El portero? ¿A esta hora?')])
    this.nextGoal()
  }

  private async porteroNoche() {
    if (this.timbreNoche !== 'sonando') {
      await say(this, [this.think(this.timbreNoche === 'atendido' ? 'No volvió a sonar.' : 'Nadie toca.')])
      return
    }
    this.ring?.remove()
    this.timbreNoche = 'atendido'
    await say(this, [this.speak('¿Hola?')])
    sfx.estatica()
    if (this.vuelta === 8) {
      // La voz de siempre, pero preocupada
      sfx.estatica()
      await say(this, [this.intercom('…Jorge… ¿estás bien?…')])
      await say(this, [this.think('La misma voz de todas las noches.'), this.think('Hoy suena preocupada.')])
      await new Promise((r) => this.time.delayedCall(1300, r))
      await say(this, [this.think('Se cortó.')])
      this.pista('El portero, la octava noche', 'Sonó el portero. La voz de siempre preguntó si estaba bien. Sonaba preocupada.')
      this.nextGoal()
      return
    }
    if (this.vuelta === 7) {
      // Una voz de mujer, que se corta antes de decir su nombre
      sfx.estatica()
      await say(this, [this.intercom('…Jorge… soy…')])
      sfx.estatica()
      await say(this, [this.speak('¿Quién? No te escucho.')])
      await new Promise((r) => this.time.delayedCall(1400, r))
      await say(this, [this.think('Se cortó antes de que dijera el nombre.'), this.think('Esa voz la conozco.')])
      this.pista('El portero, la séptima noche', 'Sonó el portero. Una voz de mujer dijo "Jorge, soy…" y se cortó antes del nombre. La conozco.')
      this.nextGoal()
      return
    }
    if (this.vuelta === 6) {
      // Por un segundo, cree que es su mamá
      sfx.estatica()
      await say(this, [this.intercom('…Jorge…')])
      await say(this, [this.speak('¿Mamá?'), this.think('No.'), this.think('Por un segundo pensé que era ella.')])
      await new Promise((r) => this.time.delayedCall(1200, r))
      await say(this, [this.think('Se cortó.')])
      this.pista('El portero, la sexta noche', 'Sonó el portero y una voz dijo mi nombre. Por un segundo pensé que era mamá.')
      this.nextGoal()
      return
    }
    if (this.vuelta === 5) {
      // Atiende, pero del otro lado solo se escucha algo como lluvia
      sfx.estatica()
      await say(this, [this.intercom('…')])
      await say(this, [this.think('No es estática.'), this.think('Suena como lluvia.')])
      await new Promise((r) => this.time.delayedCall(1200, r))
      await say(this, [this.think('Afuera no llueve.')])
      this.pista('El portero, la quinta noche', 'Atendí el portero. Del otro lado se escuchaba algo como lluvia. Afuera no llovía.')
      this.nextGoal()
      return
    }
    if (this.vuelta === 4) {
      // Esta vez no atiende: como hacía con su mamá cuando lo buscaba
      sfx.estatica()
      await say(this, [this.intercom('…Jorge… ¿estás?…')])
      await say(this, [this.think('No contesto.'), this.think('Como hacía con mamá cuando me buscaba.')])
      await new Promise((r) => this.time.delayedCall(1200, r))
      await say(this, [this.think('Dejó de sonar.')])
      this.pista('El portero, la cuarta noche', 'Sonó el portero y la voz dijo mi nombre. No contesté. Como hacía con mamá cuando me llamaba.')
      this.nextGoal()
      return
    }
    if (this.vuelta === 3) {
      // Otra vez la voz de mujer. Esta vez Jorge no se asusta
      await say(this, [this.intercom('…Jorge…')])
      sfx.estatica()
      await say(this, [this.speak('¿Quién sos?')])
      await new Promise((r) => this.time.delayedCall(1500, r))
      await say(this, [this.think('Se cortó.'), this.think('Otra vez la voz.'), this.think('Hoy no me dio miedo.')])
      this.pista('El portero, la tercera noche', 'Otra vez la voz de mujer en el portero, entre la estática. Dijo mi nombre. Esta vez no me dio miedo.')
      this.nextGoal()
      return
    }
    if (this.vuelta === 2) {
      // Esta vez, entre la estática, se escucha una voz de mujer
      await say(this, [this.intercom('…¿Jorge…?')])
      sfx.estatica()
      await say(this, [this.speak('¿Hola? ¿Quién habla?')])
      await new Promise((r) => this.time.delayedCall(1500, r))
      await say(this, [this.think('Se cortó.'), this.think('Era una voz de mujer.'), this.think('La conozco. No sé de dónde.')])
      this.pista('El portero, otra noche', 'Otra vez tocaron el portero de noche. Entre la estática, una voz de mujer dijo mi nombre. La conozco y no sé de dónde.')
      this.nextGoal()
      return
    }
    await say(this, [this.intercom('…'), this.speak('¿Quién es?')])
    sfx.estatica()
    await new Promise((r) => this.time.delayedCall(1500, r))
    await say(this, [this.think('Se cortó.'), this.think('No habló nadie… pero había alguien.')])
    this.pista('El portero, de noche', 'Alguien tocó el portero de noche. Atendí y no habló nadie. Se cortó.')
    this.nextGoal()
  }

  private async dormir() {
    if (!this.pizarraHecha) {
      await say(this, [this.think('Antes de dormir tengo que anotar lo que recordé.')])
      return
    }
    if (this.timbreNoche === 'sonando') {
      await say(this, [this.think('Está sonando el portero.')])
      return
    }
    if (this.vuelta === 8 && !this.numeroVisto) {
      await say(this, [this.think('El saco está sobre la cama. Tiene algo en el bolsillo.')])
      await this.sacoNumero()
    } else if (this.vuelta === 7 && !this.informeLeido) {
      await say(this, [this.think('El informe, sobre la cómoda. Quiero leerlo otra vez.')])
      await this.informeNoche()
    } else if (this.vuelta === 6 && !this.boletoVisto) {
      await say(this, [this.think('La cómoda… Ahí guardé algo del viaje.')])
      await this.cajonBoletos()
    } else if (this.vuelta === 5 && !this.servilletaVista) {
      await say(this, [this.think('La campera está mojando la cama.')])
      await this.campera()
    } else if (this.vuelta === 4 && !this.papelitoVisto) {
      await say(this, [this.think('La billetera… La foto de mamá.')])
      await this.billeteraPapelito()
    } else if (this.vuelta < 4 && !this.cajaVista) {
      await say(this, [this.think(this.vuelta >= 2 ? 'La caja de abajo de la cama… ¿habrá algo más?' : 'Hay algo debajo de la cama.')])
      await this.cajaNoche()
    }
    if (this.vuelta === 3 && !this.fotoPuesta) {
      await say(this, [this.think('Antes, la foto.')])
      await this.ponerFoto()
    }
    this.goal?.set(null)
    this.leaving = true
    await say(this, this.vuelta === 8
      ? [this.think('"Supongo que no hay forma de reparar un corazón roto."'), this.think('Eso le dije.'), this.think('Y la dejé sola en la vereda.')]
      : this.vuelta === 7
      ? [this.think('Me dijo algo antes de irse.'), this.think('Ojalá me acuerde.')]
      : this.vuelta === 6
      ? [this.think('Le vi la cara.'), this.think('Se reía.'), this.think('No quiero pensar en lo que vino después.')]
      : this.vuelta === 5
      ? [this.think('Ella se fue una vez.'), this.think('Y esa noche, el que se fue fui yo.')]
      : this.vuelta === 4
      ? [this.think('La empujé.'), this.think('Y después, cada vez que me buscó, la esquivé.'), this.think('Nos veíamos tres veces por año. Nunca hablamos de esa noche.')]
      : this.vuelta === 3
      ? [this.think('La foto está otra vez en su lugar.'), this.think('Esta noche duermo tranquilo.'), this.think('Como en el sillón de María.')]
      : this.vuelta === 2
      ? [this.think('Esa noche me quedé trabando la puerta.'), this.think('Hoy no hay nadie del otro lado.'), this.think('¿O sí?')]
      : [this.think('Mañana capaz me olvido de todo.'), this.think('Pero está en la pizarra.')])
    // Se acuesta
    this.player.setVisible(false)
    this.add.image(250, 488, 'jorge0').setAngle(-90).setDepth(5)
    this.cameras.main.pan(400, 360, 1200, 'Sine.easeInOut')
    await new Promise((r) => this.time.delayedCall(1500, r))
    // La cuarta noche, después de revivir la pelea: algo enorme en el techo
    if (this.vuelta === 4) await this.cucaracha()
    const lids = eyelids(this, 1)
    await lids.to(0.5, 2200)
    await lids.to(0.7, 1200)
    await lids.to(0, 2800)
    this.roomTone?.stop(2)
    this.clock?.stop()
    await new Promise((r) => this.time.delayedCall(1500, r))
    if (this.vuelta === 8) {
      // Suelta termina acá; en el prototipo completo sigue la Pre-sesión 9
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'La octava noche' })
      else this.scene.start('Apartment', { manana: true, vuelta: 8 })
      return
    }
    if (this.vuelta === 7) {
      // Suelta termina acá; en el prototipo completo sigue la Pre-sesión 8
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'La séptima noche' })
      else this.scene.start('Apartment', { manana: true, vuelta: 7 })
      return
    }
    if (this.vuelta === 6) {
      // Suelta termina acá; en el prototipo completo sigue la Pre-sesión 7
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'La sexta noche' })
      else this.scene.start('Apartment', { manana: true, vuelta: 6 })
      return
    }
    if (this.vuelta === 5) {
      // Suelta termina acá; en el prototipo completo sigue la Pre-sesión 6
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'La quinta noche' })
      else this.scene.start('Apartment', { manana: true, vuelta: 5 })
      return
    }
    if (this.vuelta === 4) {
      // Suelta termina acá; en el prototipo completo sigue la Pre-sesión 5
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'La cuarta noche' })
      else this.scene.start('Apartment', { manana: true, vuelta: 4 })
      return
    }
    if (this.vuelta === 3) {
      // Suelta termina acá; en el prototipo completo sigue la Pre-sesión 4
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'La tercera noche' })
      else this.scene.start('Apartment', { manana: true, vuelta: 3 })
      return
    }
    if (this.vuelta === 2) {
      // Suelta termina acá; en el prototipo completo sigue la Pre-sesión 3
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'La segunda noche' })
      else this.scene.start('Apartment', { manana: true, vuelta: 2 })
      return
    }
    // Suelta termina acá; en el prototipo completo sigue la Pre-sesión 2 (la mañana, una semana después)
    if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'La primera noche' })
    else this.scene.start('Apartment', { manana: true })
  }

  // La cuarta noche: con el estrés, Jorge ve una cucaracha gigante en el techo, casi del tamaño del cuarto.
  // Parpadea y no está. Idea del usuario (algo que le pasó); la escena es provisoria
  private async cucaracha() {
    const enCama = (t: string): Line => ({ kind: 'thought', text: t, anchor: () => ({ x: 250, y: 470 }) })
    await new Promise((r) => this.time.delayedCall(1200, r))
    await say(this, [enCama('…'), enCama('Hay algo en el techo.')])
    const bicho = this.add.image(560, 235, 'cucaracha0').setDepth(32).setAlpha(0).setScale(0.85)
    sfx.patitas()
    await new Promise<void>((r) => this.tweens.add({ targets: bicho, alpha: 0.95, duration: 1400, onComplete: () => r() }))
    // Se mueve: las patas, un poco de costado, las antenas
    let paso = 0
    const patas = this.time.addEvent({ delay: 140, loop: true, callback: () => bicho.setTexture(`cucaracha${(paso = 1 - paso)}`) })
    sfx.patitas()
    this.tweens.add({ targets: bicho, x: 610, duration: 900, ease: 'Sine.InOut' })
    await new Promise((r) => this.time.delayedCall(900, r))
    patas.paused = true
    await say(this, [enCama('Una cucaracha.'), enCama('Del tamaño del cuarto.'), enCama('No me puedo mover.')])
    patas.paused = false
    sfx.patitas()
    this.tweens.add({ targets: bicho, x: 520, angle: -6, duration: 700, ease: 'Sine.InOut' })
    await new Promise((r) => this.time.delayedCall(700, r))
    patas.remove()
    // Parpadea, y ya no está
    const blink = eyelids(this, 1)
    await blink.to(0, 160)
    bicho.destroy()
    await new Promise((r) => this.time.delayedCall(400, r))
    await blink.to(1, 500)
    blink.destroy()
    await say(this, [enCama('No hay nada.'), enCama('Estoy muy cansado. Nada más.')])
    this.pista('El techo', 'La noche que recordé la pelea vi una cucaracha gigante en el techo, casi del tamaño del cuarto. Parpadeé y no estaba.')
  }

  // ---------- Pre-sesión 2: la mañana, una semana después ----------

  private setupManana() {
    this.answered = true
    this.fridgeNotes?.destroy()
    this.drawerNote?.destroy()
    this.bannerStrip?.destroy()
    // La caja de cosas de chico, ya abierta, y la marca de la feria en la pizarra
    const g = this.add.graphics().setDepth(4)
    g.fillStyle(0x9a7a4e).fillRect(270, 562, 96, 38)
    g.fillStyle(0xb08d5c).fillRect(372, 590, 104, 10)
    this.add.text(318, 584, 'JORGE', { fontFamily: HAND_FONT, fontSize: '12px', color: '#4a3622', resolution: 2 }).setOrigin(0.5).setDepth(4)
    this.marcasHasta(this.vuelta)
    this.goal = objective(this)
  }

  private itemsManana(): Interactable[] {
    return [
      { id: 'pizarra', name: 'Pizarra', room: 'cuarto', x: 970, y: 300, action: () => this.repasarPizarra() },
      { id: 'caja', name: 'Caja', room: 'cuarto', x: 318, y: 530, action: async () => say(this, this.vuelta >= 2 ? [this.think('Mi cuaderno de matemática.'), this.think(this.vuelta >= 3 ? 'Y abajo estaba la foto.' : 'La letra de María.')] : [this.think('Cosas de cuando era chico.'), this.think('La sortija de la calesita. Fue real.')]) },
      { id: 'portarretratos', name: 'Portarretratos', room: 'cuarto', x: 718, y: 430, action: async () => say(this, [this.think(this.vuelta >= 3 ? 'María y yo. Diecisiete años.' : 'Sigue vacío.')]) },
      { id: 'cama', name: 'Cama', room: 'cuarto', x: 190, y: 470, action: async () => say(this, [this.think('No. Me están esperando.')]) },
      { id: 'aPasillo', name: 'Puerta al pasillo', room: 'cuarto', x: DOORS.cuartoAPasillo, y: 400, door: true, action: () => this.salirManana() },
    ]
  }

  private async introManana() {
    // Una semana después
    const card = text(this, this.scale.width / 2, 360, 'Una semana después', 30, '#e8e8e8').setOrigin(0.5).setScrollFactor(0).setDepth(1300).setAlpha(0)
    const bg = this.add.rectangle(0, 0, 1280, 720, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(1290)
    await new Promise<void>((r) => this.tweens.add({ targets: card, alpha: 1, duration: 900, onComplete: () => r() }))
    await new Promise((r) => this.time.delayedCall(1600, r))
    await new Promise<void>((r) => this.tweens.add({ targets: card, alpha: 0, duration: 700, onComplete: () => r() }))
    bg.destroy()
    card.destroy()
    // Duerme, igual que la primera mañana, hasta que suena el portero
    const lying = this.add.image(250, 488, 'jorge0').setAngle(-90).setDepth(5)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.centerOn(640, 360)
    this.cameras.main.fadeIn(2000, 0, 0, 0)
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
    await new Promise((r) => this.time.delayedCall(3200, r))
    zzz.remove()
    sfx.buzz()
    this.cameras.main.shake(300, 0.003)
    await new Promise((r) => this.time.delayedCall(1200, r))
    const enCama = (t: string): Line => ({ kind: 'thought', text: t, anchor: () => ({ x: 250, y: 470 }) })
    await say(this, [enCama('El portero.'), enCama('Debe ser el remis.')])
    this.tweens.add({ targets: lying, angle: 0, x: 430, y: FLOOR - 70, duration: 600, ease: 'Sine.InOut' })
    await new Promise((r) => this.time.delayedCall(650, r))
    lying.destroy()
    this.player.setVisible(true)
    this.lastX = this.player.x
    await say(this, [this.think('Quizás pueda repasar un poco mis recuerdos de la pizarra.')])
    this.goal?.set('Salir: me espera el remis')
    // El portero sigue sonando cada tanto
    this.ring?.remove()
    this.ring = this.time.addEvent({ delay: 11000, loop: true, callback: () => { sfx.buzz(); this.cameras.main.shake(200, 0.002) } })
    this.busy = false
  }

  private async repasarPizarra() {
    await this.pizarraOverlay(this.vuelta)
    await say(this, this.vuelta >= 8
      ? [this.think('Está todo.'), this.think('Menos hoy.')]
      : this.vuelta >= 7
      ? [this.think('El viaje. Y quince días después, mamá.'), this.think('Lo que vino después todavía no lo anoté.')]
      : this.vuelta >= 6
      ? [this.think('El viaje. Le vi la cara.'), this.think('Después del viaje hay un espacio vacío.'), this.think('No quiero mirarlo.')]
      : this.vuelta >= 5
      ? [this.think('Ya casi llego a hoy.'), this.think('El reencuentro. Me fui.')]
      : this.vuelta >= 4
      ? [this.think('La feria. El boletín. La fiesta.'), this.think('Y la pelea. No quiero mirarla mucho.')]
      : this.vuelta >= 3
      ? [this.think('La feria. El boletín. La fiesta.'), this.think('Lo último que anoté es lindo. Ojalá lo que sigue también.')]
      : this.vuelta >= 2
      ? [this.think('"La feria con mamá." "El boletín."'), this.think('Y María, en la plaza. Todavía está.')]
      : [this.think('"La feria con mamá." Me perdí y ella me encontró.'), this.think('Todavía está. No me lo olvidé.')])
  }

  // Al salir del cuarto, sigue directo en la sesión con el doctor Vela
  private async salirManana() {
    this.ring?.remove()
    this.goal?.set(null)
    this.leaving = true
    sfx.door()
    const cam = this.cameras.main
    cam.fadeOut(1500, 0, 0, 0)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    this.scene.start('Office', { sesion: this.vuelta + 1 })
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

    const help = text(this, 24, this.scale.height - 34, controlsHelp('← → / A D caminar   ·   E examinar / usar puertas   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa'), 16, '#aab2c4')
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

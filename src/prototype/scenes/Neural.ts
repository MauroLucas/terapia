import * as Phaser from 'phaser'
import { addVignette, FONT, GASEOSAS, makeTextures } from '../art'
import { sfx, startElevator, startRoomTone } from '../audio'
import { addPista, state } from '../state'
import { choose, objective, say, text, toast, type Line, type Point } from '../ui'
import { openDiary } from './diary'

// Hall del edificio. Jorge llega sin el carnet y tiene que buscar otra forma de entrar:
//   Hall: [entrada] [baño] [maestranza] [máquina de bebidas] [espera] … [recepción] … [seguridad | molinetes]
//           ↓        ↓
//         Baño: lavatorios y cuatro cubículos (uno trabado, con alguien adentro)
//         Maestranza: cuarto de limpieza, con los rollos de papel higiénico
// Cadena del puzzle: papel higiénico → fichas → la gaseosa "de siempre" del de seguridad → saltar los molinetes.
// Cuál es la gaseosa hay que deducirlo: el tacho al lado de su puesto está lleno de latas iguales.
// Después de los molinetes: secuencia del ascensor, con los pensamientos de Jorge. Sigue en Corridor (el pasillo).
// No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const FLOOR = 600
const FEET = FLOOR - 70 // centro de Jorge parado
const WALK = 204 // px/s, igual que en la Casa de Jorge

type RoomId = 'hall' | 'bano' | 'limpieza'
// `pad`: margen sin caminar a cada lado (el cuarto de limpieza es más angosto que la pantalla)
const ROOMS: Record<RoomId, { x: number; w: number; pad?: number }> = {
  hall: { x: 0, w: 3400 },
  bano: { x: 3700, w: 1280 },
  limpieza: { x: 5300, w: 1280, pad: 300 },
}
const B = ROOMS.bano.x
const L = ROOMS.limpieza.x

const POS = {
  entrada: 120,
  banoDoor: 430,
  limpiezaDoor: 560,
  maquina: 780,
  senora: 1105,
  joven: 1385,
  recepcion: 2050,
  tacho: 2590,
  guardia: 2850,
  molinetes: 2960,
  banoSalida: B + 120,
  limpiezaSalida: L + 350,
  escobas: L + 560,
  estante: L + 830,
}
const BLOCK_X = 2770 // hasta acá llega Jorge mientras el de seguridad está en su puesto
const TURNSTILE_X = 2895 // tope contra los molinetes
const GUARD_SPEED = 260
const GUARD_DRINK = 1 // índice en GASEOSAS: la que toma siempre el de seguridad

const STALLS = [B + 640, B + 790, B + 940, B + 1090]
const STALL_LOCKED = 2
const STALL_W = 120

// Ascensor: vista en corte. La cabina queda quieta en pantalla y los pisos bajan por detrás.
const LIFT = { x: 6900, floor: 480, h: 360, speed: 150 }

interface Interactable {
  id: string
  name: string
  room: RoomId
  x: number
  y: number
  range?: number
  action: () => Promise<void>
}

export class Neural extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private guard!: Phaser.GameObjects.Image
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private room: RoomId = 'hall'
  private busy = true
  private leaving = false
  private lockUntil = 0
  private facing = 1
  private walkDist = 0
  private stepDist = 0
  private items: Interactable[] = []
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text
  private inv!: Phaser.GameObjects.Container
  private stallDoors: Phaser.GameObjects.Container[] = []
  private stallOpen: boolean[] = []
  private roll?: Phaser.GameObjects.Image
  private tone?: { stop: (fade?: number) => void }
  // Avance de la locación
  private announced = false // ya habló con la recepción
  private guardMet = false
  private guardAtPost = true
  private blockArmed = true
  private manAsked = false
  private fichaGiven = false
  private limpiezaSeen = false
  private senoraMet = false
  private jovenMet = false
  private jovenHint = false
  private drinkAsked = false // el de seguridad ya pidió "la de siempre"
  private drink = -1 // gaseosa que lleva Jorge (índice en GASEOSAS)
  private lift?: { rows: Phaser.GameObjects.Graphics; scroll: number; speed: number }
  private goal!: ReturnType<typeof objective>
  private goalOn = false // se muestra después de la intro y hasta saltar los molinetes

  constructor() {
    super('Neural')
  }

  create() {
    this.room = 'hall'
    this.busy = true
    this.leaving = false
    this.facing = 1
    this.stallDoors = []
    this.stallOpen = STALLS.map(() => false)
    this.announced = this.guardMet = this.manAsked = this.fichaGiven = false
    this.limpiezaSeen = this.senoraMet = this.jovenMet = this.jovenHint = false
    this.guardAtPost = this.blockArmed = true
    this.drinkAsked = false
    this.drink = -1
    this.lift = undefined
    this.goalOn = false
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0b0c10')
    this.drawHall()
    this.drawBano()
    this.drawLimpieza()

    this.guard = this.add.image(POS.guardia, FEET, 'guardia').setFlipX(true).setDepth(9)
    this.player = this.add.image(POS.entrada + 90, FEET, 'jorge0').setDepth(10)
    this.setupItems()
    this.inv = this.add.container(this.scale.width - 30, 30).setScrollFactor(0).setDepth(950)
    this.goal = objective(this)
    addVignette(this, 0.6)

    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,A,D,E,SPACE,TAB,ESC') as Record<string, Phaser.Input.Keyboard.Key>
    this.setCameraRoom('hall')
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.tone = startRoomTone()
    this.events.once('shutdown', () => this.tone?.stop(0.5))
    void this.intro()
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __neural?: Neural }).__neural = this
  }

  // ---------- Escenarios ----------

  private label(x: number, y: number, str: string, size = 12, color = '#5a6172') {
    return this.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 2 }).setOrigin(0.5)
  }

  private drawHall() {
    const { w } = ROOMS.hall
    const g = this.add.graphics()
    // Hall grande: pared alta, ventanales y piso brillante
    g.fillStyle(0x3d4554).fillRect(0, 0, w, FLOOR)
    g.fillStyle(0x333a47).fillRect(0, 0, w, 60)
    g.fillStyle(0x23272f).fillRect(0, FLOOR, w, 120)
    g.fillStyle(0x4c7bd1, 0.5).fillRect(0, FLOOR - 6, w, 6)
    g.lineStyle(1, 0x2e333d)
    for (let lx = 0; lx < w; lx += 160) g.lineBetween(lx, FLOOR, lx + 40, 720)
    for (const wx of [900, 1180, 1460, 2300, 2520]) {
      g.fillStyle(0x7f9cc4, 0.35).fillRect(wx, 110, 200, 300)
      g.lineStyle(4, 0x2b313c).strokeRect(wx, 110, 200, 300).lineBetween(wx + 100, 110, wx + 100, 410)
      this.add.polygon(0, 0, [wx, 410, wx + 200, 410, wx + 300, FLOOR, wx - 100, FLOOR], 0xbcd0f0, 0.05).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD)
    }
    for (const cx of [620, 1740, 2700]) g.fillStyle(0x2f3541).fillRect(cx, 60, 46, FLOOR - 60)

    // Puerta de maestranza: de servicio, al lado de los baños
    g.fillStyle(0x1a1d24).fillRect(POS.limpiezaDoor - 53, 402, 106, 198)
    g.fillStyle(0x4a505b).fillRect(POS.limpiezaDoor - 45, 410, 90, 190)
    g.fillStyle(0xc9ced8).fillCircle(POS.limpiezaDoor + 31, 510, 5)
    g.fillStyle(0xd9c27a).fillRect(POS.limpiezaDoor - 30, 440, 60, 22)
    this.label(POS.limpiezaDoor, 451, 'SOLO PERSONAL', 7, '#333')
    this.label(POS.limpiezaDoor, 388, 'MAESTRANZA')

    // Entrada: puertas de vidrio a la calle
    g.fillStyle(0x1a1d24).fillRect(POS.entrada - 100, 330, 200, 270)
    g.fillStyle(0x9fb7d8, 0.45).fillRect(POS.entrada - 92, 338, 88, 262).fillRect(POS.entrada + 4, 338, 88, 262)
    g.fillStyle(0xc9ced8).fillRect(POS.entrada - 14, 450, 4, 50).fillRect(POS.entrada + 10, 450, 4, 50)
    this.label(POS.entrada, 312, 'SALIDA')

    // Puerta del baño
    g.fillStyle(0x1a1d24).fillRect(POS.banoDoor - 53, 402, 106, 198)
    g.fillStyle(0x566070).fillRect(POS.banoDoor - 45, 410, 90, 190)
    g.fillStyle(0xc9ced8).fillCircle(POS.banoDoor + 31, 510, 5)
    this.label(POS.banoDoor, 388, 'BAÑOS')

    // Máquina de bebidas
    g.fillStyle(0x1a1d24).fillRect(POS.maquina - 64, 366, 128, 234)
    g.fillStyle(0xa83232).fillRect(POS.maquina - 58, 372, 116, 228)
    g.fillStyle(0x15171d).fillRect(POS.maquina - 48, 384, 70, 140).fillRect(POS.maquina - 40, 548, 80, 30)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const gas = GASEOSAS[(r * 3 + c) % GASEOSAS.length]
        g.fillStyle(gas.color).fillRect(POS.maquina - 42 + c * 21, 392 + r * 32, 14, 22)
        if (gas.banda) g.fillStyle(gas.banda).fillRect(POS.maquina - 42 + c * 21, 400 + r * 32, 14, 6)
      }
    }
    g.fillStyle(0xd9dde5).fillRect(POS.maquina + 30, 400, 20, 44)
    g.fillStyle(0x111111).fillRect(POS.maquina + 38, 408, 4, 12)
    this.label(POS.maquina + 40, 458, 'FICHAS', 9, '#f1efe8')

    // Sillones y plantas de la espera
    for (const sx of [1010, 1290]) {
      g.fillStyle(0x2b3f66).fillRoundedRect(sx, 520, 190, 60, 10).fillRoundedRect(sx, 480, 190, 50, 10)
      g.fillStyle(0x1f2c47).fillRect(sx + 10, 580, 10, 20).fillRect(sx + 170, 580, 10, 20)
    }
    for (const px of [960, 1560, 2420]) {
      g.fillStyle(0x6b6f78).fillRect(px - 16, 550, 32, 50)
      g.fillStyle(0x3f6b45).fillEllipse(px, 510, 54, 90).fillEllipse(px - 18, 530, 30, 60).fillEllipse(px + 18, 530, 30, 60)
    }

    // Pacientes que esperan: una señora mayor (con el carnet colgado) y un joven
    this.sentado(g, POS.senora, { skin: 0xe2c3a6, hair: 0xb9bcc4, top: 0x8f7aa8, legs: 0x4a4458 })
    g.fillStyle(0xb9bcc4).fillCircle(POS.senora - 15, 438, 8)
    g.lineStyle(1, 0x2b313c).lineBetween(POS.senora - 4, 470, POS.senora + 6, 488).lineBetween(POS.senora + 8, 470, POS.senora + 6, 488)
    g.fillStyle(0xf1efe8).fillRect(POS.senora + 1, 488, 10, 13)
    g.fillStyle(0x4c7bd1).fillRect(POS.senora + 1, 488, 10, 4)
    this.sentado(g, POS.joven, { skin: 0xd8b08a, hair: 0x2a2019, top: 0xb8743a, legs: 0x2f3a52 })

    // Recepción: logo en la pared, la recepcionista y el mostrador por delante
    text(this, POS.recepcion, 250, 'NEURAL', 64, '#4c7bd1', { fontStyle: 'bold' }).setOrigin(0.5)
    this.label(POS.recepcion, 300, 'Centro de Rehabilitación de la Memoria', 15, '#aab2c4')
    g.fillStyle(0x8a5a7a).fillRoundedRect(POS.recepcion - 22, 462, 44, 70, 12)
    g.fillStyle(0xe2b996).fillCircle(POS.recepcion, 440, 17)
    g.fillStyle(0x4a2f22).slice(POS.recepcion, 437, 18, Math.PI, Math.PI * 2, false).fillPath()
    g.fillRect(POS.recepcion + 8, 432, 10, 30)
    g.fillStyle(0x111111).fillCircle(POS.recepcion - 7, 440, 2)
    g.fillStyle(0xd9dde5).fillRoundedRect(POS.recepcion - 170, 500, 340, 100, 8)
    g.fillStyle(0x4c7bd1).fillRect(POS.recepcion - 170, 500, 340, 10)
    g.fillStyle(0x15171d).fillRect(POS.recepcion + 70, 462, 60, 38).fillRect(POS.recepcion + 96, 496, 8, 6)
    g.fillStyle(0xf1efe8).fillRect(POS.recepcion - 140, 474, 56, 26)
    this.label(POS.recepcion - 112, 487, 'PRESENTAR\nCARNET', 8, '#333').setAlign('center')
    this.label(POS.recepcion, 555, 'RECEPCIÓN', 16, '#4c7bd1')

    // Molinetes y, del otro lado, el pasillo a los consultorios
    g.fillStyle(0x2b313c).fillRect(TURNSTILE_X + 20, 60, 12, 440)
    g.fillStyle(0x9fb7d8, 0.14).fillRect(TURNSTILE_X + 32, 60, 190, 440)
    this.label(POS.molinetes + 20, 380, 'ACCESO SOLO CON CARNET', 13, '#aab2c4')
    for (const mx of [TURNSTILE_X + 26, TURNSTILE_X + 96, TURNSTILE_X + 166]) {
      g.fillStyle(0xb9c0cc).fillRoundedRect(mx - 12, 500, 24, 100, 5)
      g.fillStyle(0x4c7bd1).fillRect(mx - 8, 508, 16, 8)
      if (mx < TURNSTILE_X + 166) g.fillStyle(0x8d9197).fillRect(mx + 12, 530, 46, 6).fillRect(mx + 12, 556, 46, 6)
    }
    // Tacho al lado del puesto de seguridad: desborda de latas, casi todas de la misma gaseosa.
    // Va por delante de Jorge para que las latas se vean siempre.
    const tx = POS.tacho
    const bin = this.add.graphics().setDepth(11)
    bin.fillStyle(0x6b7280).fillRect(tx - 32, 520, 64, 80)
    bin.fillStyle(0x596070).fillRect(tx - 32, 520, 10, 80)
    bin.fillStyle(0x8d9197).fillRect(tx - 36, 512, 72, 10)
    const latas: [number, number, number, number][] = [
      [-18, 500, 15, GUARD_DRINK], [14, 498, -20, GUARD_DRINK], [-2, 482, 75, GUARD_DRINK], [24, 480, 5, 3], [-26, 480, -35, GUARD_DRINK],
      [2, 462, -8, GUARD_DRINK], [-62, 589, 0, GUARD_DRINK], [60, 581, 90, 4], [90, 589, 0, GUARD_DRINK], [-98, 589, 0, GUARD_DRINK],
    ]
    for (const [dx, y, angle, tipo] of latas) this.add.image(tx + dx, y, `gaseosa${tipo}`).setAngle(angle).setScale(1.6).setDepth(11)

    g.fillStyle(0x1a1d24).fillRect(3190, 392, 126, 208)
    g.fillStyle(0x566070).fillRect(3198, 400, 110, 200)
    this.label(3253, 378, 'CONSULTORIOS')
  }

  // Persona sentada en un sillón de la espera, mirando hacia la recepción
  private sentado(g: Phaser.GameObjects.Graphics, x: number, c: { skin: number; hair: number; top: number; legs: number }) {
    g.fillStyle(c.legs).fillRoundedRect(x - 8, 516, 46, 14, 6).fillRect(x + 26, 522, 12, 66)
    g.fillStyle(0x0a0a0c).fillRoundedRect(x + 24, 586, 20, 8, 3)
    g.fillStyle(c.top).fillRoundedRect(x - 16, 468, 32, 58, 9)
    g.fillStyle(c.skin).fillRect(x - 5, 460, 10, 10).fillCircle(x, 448, 15).fillCircle(x + 16, 514, 5)
    g.fillStyle(c.hair).slice(x - 1, 446, 16, Math.PI, Math.PI * 2, false).fillPath()
    g.fillRect(x - 17, 443, 8, 12)
    g.fillStyle(0x111111).fillCircle(x + 8, 448, 2)
  }

  private drawBano() {
    const { x, w } = ROOMS.bano
    const g = this.add.graphics()
    g.fillStyle(0x0e0f13).fillRect(x, 0, w, 110)
    g.fillStyle(0x56616b).fillRect(x, 110, w, FLOOR - 110)
    g.lineStyle(1, 0x4a545e)
    for (let ty = 150; ty < FLOOR; ty += 40) g.lineBetween(x, ty, x + w, ty)
    for (let tx = x; tx < x + w; tx += 40) g.lineBetween(tx, 110, tx, FLOOR)
    g.fillStyle(0x2c3138).fillRect(x, FLOOR, w, 120)
    g.fillStyle(0x0e0f13).fillRect(x, 110, 14, FLOOR - 110).fillRect(x + w - 14, 110, 14, FLOOR - 110)
    this.label(x + w / 2, 126, 'BAÑO', 14, '#4b5263')

    // Puerta al hall
    g.fillStyle(0x1a1d24).fillRect(POS.banoSalida - 53, 402, 106, 198)
    g.fillStyle(0x566070).fillRect(POS.banoSalida - 45, 410, 90, 190)
    g.fillStyle(0xc9ced8).fillCircle(POS.banoSalida - 31, 510, 5)

    // Lavatorios con espejo
    g.fillStyle(0x9fb7d8, 0.4).fillRect(B + 260, 300, 260, 130)
    g.lineStyle(4, 0x2b313c).strokeRect(B + 260, 300, 260, 130)
    for (const lx of [B + 320, B + 460]) {
      g.fillStyle(0xe8e8e4).fillRoundedRect(lx - 45, 480, 90, 26, 8)
      g.fillStyle(0xbfc3c8).fillRect(lx - 6, 506, 12, 94).fillRect(lx - 3, 462, 6, 18)
    }

    // Cubículos: el interior queda tapado por la puerta hasta que Jorge la abre
    STALLS.forEach((sx, i) => {
      g.fillStyle(0x23272f).fillRect(sx - STALL_W / 2, 380, STALL_W, 220)
      g.fillStyle(0xe8e8e4).fillRoundedRect(sx - 24, 520, 48, 22, 8).fillRect(sx - 16, 542, 32, 58).fillRect(sx - 22, 476, 44, 46)
      g.fillStyle(0x8d9197).fillRect(sx + 34, 500, 16, 5)
      if (i === 1) g.lineStyle(5, 0xd9c27a).lineBetween(sx - 40, 470, sx + 40, 560).lineBetween(sx + 40, 470, sx - 40, 560)
      g.fillStyle(0x3a424d).fillRect(sx - STALL_W / 2 - 8, 370, 8, 230).fillRect(sx + STALL_W / 2, 370, 8, 230)
      g.fillRect(sx - STALL_W / 2 - 8, 370, STALL_W + 16, 10)

      const door = this.add.container(sx, 0).setDepth(5)
      door.add(this.add.rectangle(0, 487, STALL_W, 206, 0x7d8894).setStrokeStyle(2, 0x5d6772))
      door.add(this.add.circle(STALL_W / 2 - 16, 490, 5, i === STALL_LOCKED ? 0xb02a2a : 0x3e7d3c))
      this.stallDoors.push(door)
    })
  }

  private drawLimpieza() {
    const { x, w } = ROOMS.limpieza
    const x0 = x + 250
    const rw = w - 500
    const g = this.add.graphics()
    // Cuarto chico y sin ventanas: una sola lamparita
    g.fillStyle(0x0e0f13).fillRect(x, 0, w, 720)
    g.fillStyle(0x4b4f4d).fillRect(x0, 150, rw, FLOOR - 150)
    g.fillStyle(0x3f4341).fillRect(x0, 150, rw, 24)
    g.fillStyle(0x2a2c2f).fillRect(x0, FLOOR, rw, 120)
    g.lineStyle(2, 0x1a1d24).lineBetween(x + w / 2, 150, x + w / 2, 214)
    g.fillStyle(0xf2e9c0).fillCircle(x + w / 2, 224, 10)
    for (const r of [90, 170, 260, 360]) this.add.circle(x + w / 2, 224, r, 0xf2e9c0, 0.018).setBlendMode(Phaser.BlendModes.ADD)
    this.label(x + w / 2, 132, 'MAESTRANZA', 14, '#4b5263')

    // Puerta al hall
    g.fillStyle(0x1a1d24).fillRect(POS.limpiezaSalida - 53, 402, 106, 198)
    g.fillStyle(0x4a505b).fillRect(POS.limpiezaSalida - 45, 410, 90, 190)
    g.fillStyle(0xc9ced8).fillCircle(POS.limpiezaSalida - 31, 510, 5)

    // Escobas y lampazo contra la pared, baldes y el cartel de piso mojado
    const ex = POS.escobas
    g.lineStyle(5, 0xa5784a).lineBetween(ex - 60, 300, ex - 40, 584).lineBetween(ex - 22, 290, ex - 12, 580)
    g.fillStyle(0xd9c27a).fillRect(ex - 58, 580, 36, 20)
    g.fillStyle(0xb9c0cc).fillRect(ex - 30, 576, 36, 24)
    g.lineStyle(5, 0x8d9197).lineBetween(ex + 16, 320, ex + 30, 590)
    g.fillStyle(0x4c7bd1).fillPoints([{ x: ex + 20, y: 548 }, { x: ex + 76, y: 548 }, { x: ex + 68, y: 600 }, { x: ex + 28, y: 600 }], true)
    g.fillStyle(0xa83232).fillPoints([{ x: ex + 86, y: 558 }, { x: ex + 134, y: 558 }, { x: ex + 127, y: 600 }, { x: ex + 93, y: 600 }], true)
    g.lineStyle(2, 0x8d9197).strokeEllipse(ex + 48, 548, 56, 10).strokeEllipse(ex + 110, 558, 48, 9)
    g.fillStyle(0xe6c530).fillTriangle(ex + 140, 600, ex + 160, 520, ex + 180, 600)
    g.fillStyle(0x111111).fillRect(ex + 157, 548, 6, 26)

    // Estantería metálica: productos de limpieza y los rollos de papel higiénico
    const sx = POS.estante
    g.fillStyle(0x2b313c).fillRect(sx - 104, 290, 8, 310).fillRect(sx + 96, 290, 8, 310)
    for (const sy of [350, 440, 530]) g.fillStyle(0x6b6f78).fillRect(sx - 104, sy, 208, 8)
    for (let i = 0; i < 4; i++) {
      g.fillStyle([0xf1efe8, 0x7fb0c8, 0x9ee07a, 0xf1efe8][i]).fillRoundedRect(sx - 88 + i * 30, 306, 20, 44, 4)
      g.fillStyle(0x2f6fa0).fillRect(sx - 82 + i * 30, 298, 8, 8)
    }
    g.fillStyle(0xa5784a).fillRect(sx + 34, 312, 52, 38).fillRect(sx - 90, 490, 70, 40)
    g.fillStyle(0xd8c49a).fillRect(sx + 34, 328, 52, 4).fillRect(sx - 90, 506, 70, 4)
    for (let i = 0; i < 5; i++) this.add.image(sx - 74 + i * 30, 429, 'papelHigienico').setDepth(4)
    for (let i = 0; i < 3; i++) this.add.image(sx - 58 + i * 30, 407, 'papelHigienico').setDepth(4)
    this.roll = this.add.image(sx + 76, 429, 'papelHigienico').setDepth(4)
    g.fillStyle(0xd9dde5).fillRoundedRect(sx + 6, 494, 26, 36, 4).fillRoundedRect(sx + 40, 494, 26, 36, 4)

    g.fillStyle(0x0e0f13).fillRect(x0 - 14, 150, 14, FLOOR - 150).fillRect(x0 + rw, 150, 14, FLOOR - 150)
  }

  // El ascensor en corte: el hueco al centro, la cabina fija y los pisos que bajan por detrás
  private drawLift() {
    const E = LIFT.x
    const top = LIFT.floor - 250
    const g = this.add.graphics().setDepth(1)
    g.fillStyle(0x1c2028).fillRect(E, 0, 1280, 720)
    g.fillStyle(0x0c0d11).fillRect(E + 470, 0, 340, 720)

    const rows = this.add.graphics().setDepth(2)
    for (let k = -2; k <= 1; k++) {
      const y = LIFT.floor + k * LIFT.h
      rows.fillStyle(0x14171c).fillRect(E, y + 18, 470, 50).fillRect(E + 810, y + 18, 470, 50)
      rows.fillStyle(0x3a404c).fillRect(E, y, 470, 18).fillRect(E + 810, y, 470, 18)
      rows.fillStyle(0x2b313c).fillRect(E + 340, y - 210, 116, 210).fillRect(E + 824, y - 210, 116, 210)
      rows.fillStyle(0x39414e).fillRect(E + 348, y - 202, 100, 202).fillRect(E + 832, y - 202, 100, 202)
      rows.fillStyle(0xbcd0f0, 0.45).fillRect(E + 150, y - 250, 70, 8).fillRect(E + 1060, y - 250, 70, 8)
      rows.fillStyle(0x1d2027).fillRect(E + 470, y + 4, 340, 8).fillRect(E + 470, y - 176, 340, 5)
    }

    // Cables, cabina y luz
    const c = this.add.graphics().setDepth(3)
    c.lineStyle(3, 0x3a404c).lineBetween(E + 610, 0, E + 610, top).lineBetween(E + 670, 0, E + 670, top)
    c.fillStyle(0x565d6b).fillRect(E + 490, top, 300, 250)
    c.fillStyle(0x4b515e).fillRect(E + 590, top, 4, 250).fillRect(E + 690, top, 4, 250)
    c.fillStyle(0xf1efe8).fillRect(E + 530, top + 6, 220, 8)
    c.fillStyle(0x8d9197).fillRect(E + 500, LIFT.floor - 96, 280, 5)
    c.fillStyle(0x2b313c).fillRect(E + 744, LIFT.floor - 170, 24, 60)
    for (let i = 0; i < 4; i++) c.fillStyle(i === 0 ? 0xe0a23a : 0x8d9197).fillCircle(E + 756, LIFT.floor - 160 + i * 13, 3)
    c.fillStyle(0x2b313c).fillRect(E + 484, top - 10, 312, 10).fillRect(E + 484, LIFT.floor, 312, 10)
    this.add.rectangle(E + 640, top + 125, 300, 250, 0xf2e9c0, 0.07).setDepth(11).setBlendMode(Phaser.BlendModes.ADD)
    const arrow = this.add.text(E + 640, top + 30, '▲', { fontFamily: FONT, fontSize: '16px', color: '#e0a23a', resolution: 2 }).setOrigin(0.5).setDepth(4).setAlpha(0.25)

    const doorL = this.add.rectangle(E + 494, top, 8, 250, 0x8d9197).setOrigin(0.5, 0).setDepth(12)
    const doorR = this.add.rectangle(E + 786, top, 8, 250, 0x8d9197).setOrigin(0.5, 0).setDepth(12)
    this.lift = { rows, scroll: 0, speed: 0 }
    return { doorL, doorR, arrow }
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
    this.player.setPosition(x, FEET)
    this.setCameraRoom(room)
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

  // ---------- Objetos y personajes ----------

  private jorgeHead = (): Point => ({ x: this.player.x + 6 * this.facing, y: this.player.y - 70 })
  private think = (t: string): Line => ({ kind: 'thought', text: t, anchor: this.jorgeHead })
  private speak = (t: string): Line => ({ kind: 'speech', text: t, anchor: this.jorgeHead })
  private recep = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: POS.recepcion, y: 424 }) })
  private segu = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: this.guard.x, y: this.guard.y - 72 }) })
  private voz = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: STALLS[STALL_LOCKED], y: 400 }) })
  private senora = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: POS.senora, y: 430 }) })
  private joven = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: POS.joven, y: 430 }) })

  private pista(titulo: string, texto: string) {
    if (addPista(titulo, texto)) toast(this, '✎ Nueva pista en el diario (TAB)')
  }

  private has(key: string) {
    return state.inventario.includes(key)
  }

  private setInventory(key: string, on: boolean) {
    state.inventario = state.inventario.filter((k) => k !== key)
    if (on) state.inventario.push(key)
    // Íconos de lo que Jorge junta en esta locación
    this.inv.removeAll(true)
    ;['papelHigienico', 'ficha', 'gaseosa'].filter((k) => this.has(k)).forEach((k, i) => {
      const bg = this.add.rectangle(-i * 60, 0, 50, 50, 0x000000, 0.45).setOrigin(1, 0).setStrokeStyle(2, 0x6c7385)
      const icon = this.add.image(-i * 60 - 25, 25, k === 'gaseosa' ? `gaseosa${this.drink}` : k)
      this.inv.add([bg, icon])
      if (k === key) {
        icon.setScale(3)
        this.tweens.add({ targets: icon, scale: 1, duration: 400, ease: 'Back.Out' })
      }
    })
  }

  private setupItems() {
    this.items = [
      { id: 'entrada', name: 'Salida a la calle', room: 'hall', x: POS.entrada, y: 320, action: () => this.entrada() },
      { id: 'aBano', name: 'Baños', room: 'hall', x: POS.banoDoor, y: 400, action: () => this.goTo('bano', POS.banoSalida) },
      { id: 'aLimpieza', name: 'Maestranza', room: 'hall', x: POS.limpiezaDoor, y: 400, range: 60, action: () => this.maestranza() },
      { id: 'maquina', name: 'Máquina de bebidas', room: 'hall', x: POS.maquina, y: 320, action: () => this.maquina() },
      { id: 'senora', name: 'Señora', room: 'hall', x: POS.senora, y: 380, action: () => this.hablarSenora() },
      { id: 'joven', name: 'Joven', room: 'hall', x: POS.joven, y: 380, action: () => this.hablarJoven() },
      { id: 'tacho', name: 'Tacho', room: 'hall', x: POS.tacho, y: 440, range: 60, action: () => this.tacho() },
      { id: 'recepcion', name: 'Recepción', room: 'hall', x: POS.recepcion, y: 400, range: 110, action: () => this.recepcion() },
      { id: 'guardia', name: 'Seguridad', room: 'hall', x: POS.guardia, y: 400, range: 110, action: () => this.seguridad() },
      { id: 'molinetes', name: 'Molinetes', room: 'hall', x: POS.molinetes, y: 400, range: 90, action: () => this.saltar() },
      { id: 'aHall', name: 'Hall', room: 'bano', x: POS.banoSalida, y: 400, action: () => this.goTo('hall', POS.banoDoor) },
      ...STALLS.map((x, i): Interactable => ({ id: `cubiculo${i}`, name: 'Cubículo', room: 'bano', x, y: 370, range: 60, action: () => this.cubiculo(i) })),
      { id: 'aHallL', name: 'Hall', room: 'limpieza', x: POS.limpiezaSalida, y: 400, action: () => this.goTo('hall', POS.limpiezaDoor) },
      { id: 'escobas', name: 'Escobas y baldes', room: 'limpieza', x: POS.escobas, y: 400, range: 110, action: () => this.escobas() },
      { id: 'estante', name: 'Estantería', room: 'limpieza', x: POS.estante, y: 290, range: 110, action: () => this.estante() },
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

  private async entrada() {
    await say(this, [this.think(this.announced ? 'Si vuelvo a casa, pierdo el turno. Tengo que buscar otra forma de ingresar.' : 'Recién llego. La recepción está al fondo.')])
  }

  private async maquina() {
    if (!this.has('ficha')) {
      await say(this, [this.think('Una máquina de bebidas. No acepta plata: funciona con fichas.')])
      return
    }
    if (!this.drinkAsked) {
      await say(this, [this.think('Tengo fichas, pero no tengo sed. Mejor las guardo.')])
      return
    }
    if (!this.guardAtPost) {
      await say(this, [this.think('Ya está. No necesito otra.')])
      return
    }
    await say(this, [this.think('Seis gaseosas distintas. ¿Cuál será "la de siempre"?')])
    const i = await choose(this, [...GASEOSAS.map((g) => `${g.nombre} (${g.lata})`), '(Todavía no)'], { x: 780, y: 700 })
    if (i === GASEOSAS.length) return
    sfx.click()
    await this.wait(350)
    sfx.kick('lata')
    const otra = this.drink >= 0
    this.drink = i
    this.setInventory('gaseosa', true)
    await say(this, [this.think(`Salió una lata de ${GASEOSAS[i].nombre}.`), ...(otra ? [this.think('La otra la dejo arriba de la máquina.')] : [])])
  }

  private async tacho() {
    await say(this, [this.think('Un tacho lleno de latas vacías.'), this.think('Casi todas iguales: rojas, con una franja plateada.')])
    this.pista('El tacho de seguridad', 'Está lleno de latas vacías, casi todas iguales: rojas, con una franja plateada. Alguien toma siempre la misma.')
  }

  private async maestranza() {
    if (!this.limpiezaSeen) {
      this.limpiezaSeen = true
      await say(this, [this.think('"Solo personal".'), this.think('Está sin llave. Y no mira nadie.')])
    }
    await this.goTo('limpieza', POS.limpiezaSalida)
  }

  private async escobas() {
    await say(this, [this.think('Escobas, baldes, un trapo de piso.'), this.think('Olor a lavandina.')])
  }

  private async estante() {
    if (!this.roll) {
      await say(this, [this.think('Con un rollo alcanza.')])
    } else if (!this.manAsked) {
      await say(this, [this.think('Productos de limpieza y rollos de papel higiénico.'), this.think('No necesito nada de esto.')])
    } else {
      this.roll.destroy()
      this.roll = undefined
      sfx.pickup()
      this.setInventory('papelHigienico', true)
      await say(this, [this.think('Rollos de papel higiénico. Me llevo uno.'), this.think('Fui directo al estante. Como si ya supiera dónde estaban.')])
    }
  }

  // Sala de espera: la señora conoce a Jorge de cruzarlo en cada turno. Es la única del hall que lo reconoce
  private async hablarSenora() {
    if (!this.senoraMet) {
      this.senoraMet = true
      await say(this, [
        this.senora('¡Jorge! Buen día, querido.'),
        this.think('Me conoce. Yo a ella no.'),
        this.speak('Buen día… Disculpe, ¿nos conocemos?'),
        this.senora('Ay, no te preocupes. Acá a todos nos pasa lo mismo.'),
        this.senora('Nos cruzamos siempre en esta sala. Vos tenés el turno de las diez y media; yo, el de las once.'),
      ])
      this.pista('La señora de la sala de espera', 'Me conoce: dice que nos cruzamos siempre acá, que tengo el turno de las 10:30. Yo no me acuerdo de ella.')
    } else {
      await say(this, [this.senora('¿Todo bien, querido?')])
    }
    for (;;) {
      const opts: { label: string; lines: Line[] }[] = [
        {
          label: '"¿Hace mucho que vengo?"',
          lines: [
            this.speak('¿Hace mucho que vengo?'),
            this.senora('Uf, hace rato. Cuando yo empecé, vos ya venías.'),
            this.senora('Siempre calladito, siempre en ese sillón.'),
            this.think('Vengo hace rato. Y no me acuerdo de ninguna vez.'),
          ],
        },
        {
          label: '"¿A usted le sirve venir?"',
          lines: [
            this.speak('¿A usted le sirve venir?'),
            this.senora('Algunos días sí. La semana pasada me acordé del nombre de mi perro, mirá vos.'),
            this.senora('Otros días salgo y no sé ni dónde dejé el paraguas.'),
            this.senora('Pero hay que venir igual. Esto es de a poquito.'),
          ],
        },
        {
          label: '"No traje el carnet."',
          lines: [
            this.speak('No traje el carnet.'),
            this.senora('Uy, otra vez. La chica de recepción es un amor, pero con el carnet no afloja.'),
            this.senora('Yo el mío lo llevo colgado, ¿ves? Si no, lo pierdo.'),
          ],
        },
      ]
      if (this.drinkAsked && this.guardAtPost) {
        opts.push({
          label: '"¿Sabe qué gaseosa toma el de seguridad?"',
          lines: [
            this.speak('¿Sabe qué gaseosa toma el de seguridad?'),
            this.senora('Ay, ni idea, querido. Yo tomo té.'),
            this.senora('Pero fijate en el tacho que tiene al lado: ese hombre vive tirando latas.'),
          ],
        })
      }
      const i = await choose(this, [...opts.map((o) => o.label), '(Irse)'], { x: 780, y: 700 })
      if (i === opts.length) return
      await say(this, opts[i].lines)
    }
  }

  // El joven viene por primera vez. Si Jorge ya busca papel, le marca la puerta de maestranza.
  private async hablarJoven() {
    const first = !this.jovenMet
    if (first) {
      this.jovenMet = true
      await say(this, [
        this.speak('¿Estás bien?'),
        this.joven('Sí. No. Es la primera vez que vengo.'),
        this.joven('Dicen que acá te miran los sueños. No sé si quiero que alguien vea los míos.'),
        this.think('Yo tampoco sé qué van a encontrar en los míos.'),
        this.joven('¿Vos ya viniste antes?'),
        this.speak('Parece que sí.'),
      ])
    }
    if (this.manAsked && this.roll && !this.jovenHint) {
      this.jovenHint = true
      await say(this, [
        this.speak('Una pregunta: ¿sabés dónde puedo conseguir papel higiénico?'),
        this.joven('¿Papel? En el baño no hay nunca.'),
        this.joven('Recién vi al de limpieza salir de la puerta de al lado de los baños. Me parece que la dejó sin llave.'),
        this.think('Maestranza. Ahí tiene que haber.'),
      ])
    } else if (!first) {
      await say(this, [this.joven('Perdoná, estoy nervioso. Prefiero esperar callado.')])
    }
  }

  private async recepcion() {
    if (this.announced) {
      await say(this, [this.recep('Sin el carnet el sistema no me deja anunciarlo, señor. Lo siento.'), this.think('Tengo que buscar otra forma de ingresar.')])
      return
    }
    await say(this, [
      this.speak('Buen día. Soy Jorge, tengo turno para hoy a las…'),
      this.recep('Buen día. A ver… Jorge, sí: tiene turno con el doctor Vela a las diez y media.'),
      this.think('El doctor Vela…'),
      this.recep('¿Me permite su carnet?'),
      this.think('¿Carnet? …No lo tengo encima.'),
      this.speak('No lo traje.'),
      this.recep('Sin el carnet el sistema no me deja anunciarlo. Va a tener que volver a su casa a buscarlo.'),
      this.think('Fueron veinte minutos de viaje. Si vuelvo a casa, pierdo el turno.'),
      this.think('Tengo que buscar otra forma de ingresar.'),
    ])
    this.announced = true
    addPista('El doctor Vela', 'Tengo turno con él a las 10:30. Me espera en su consultorio.')
    this.pista('Recepción de Neural', 'Tengo turno, pero sin el carnet no me dejan pasar. Si vuelvo a casa a buscarlo, pierdo el turno: tengo que entrar de otra forma.')
  }

  // El de seguridad frena a Jorge si intenta pasar de largo. Después de la recepción, la charla sigue
  // directo con las preguntas, para que el jugador no se vaya sin enterarse del pedido.
  private async alto() {
    sfx.handle()
    if (!this.announced) {
      await say(this, [this.segu('Alto ahí, jefe. Primero por recepción.')])
      return
    }
    if (!this.guardMet) {
      this.guardMet = true
      await say(this, [
        this.segu('Alto ahí, jefe. Sin carnet no pasa nadie.'),
        this.speak('No lo traje. Pero tengo turno a las 10:30.'),
        this.segu('No lo dudo, jefe. Pero las reglas son las reglas. No es personal.'),
        this.segu('Uf… lo que daría por una gaseosa bien fría.'),
      ])
    } else {
      await say(this, [this.segu('Alto ahí, jefe. Sin carnet no pasa nadie.')])
    }
    await this.preguntasSeguridad()
  }

  private async seguridad() {
    if (!this.guardAtPost) {
      await say(this, [this.segu('Usted no vio nada.')])
      return
    }
    if (!this.announced) {
      await say(this, [this.segu('Buen día, jefe. Primero tiene que pasar por recepción.')])
      return
    }
    if (!this.guardMet) {
      this.guardMet = true
      await say(this, [
        this.segu('¿Carnet?'),
        this.speak('No lo traje. Pero tengo turno a las 10:30.'),
        this.segu('No lo dudo, jefe. Pero sin carnet no pasa nadie. No es personal.'),
        this.segu('Uf… lo que daría por una gaseosa bien fría.'),
      ])
    }
    await this.preguntasSeguridad()
  }

  // Preguntas al de seguridad, hasta que Jorge elige "(Irse)" o le da la gaseosa correcta
  private async preguntasSeguridad() {
    for (;;) {
      const opts: { label: string; run: () => Promise<boolean> }[] = []
      if (this.has('gaseosa')) opts.push({ label: '"Tome, le traje una gaseosa."', run: () => this.darGaseosa() })
      opts.push(
        {
          label: '"¿Y por qué no se toma una gaseosa?"',
          run: async () => {
            await say(this, [
              this.speak('¿Y por qué no se toma una gaseosa?'),
              this.segu('La máquina está en la otra punta y yo de acá no me puedo mover.'),
              this.segu('Si alguien me alcanzara la de siempre, me escapo dos minutos a tomarla tranquilo.'),
              this.speak('¿Cuál es la de siempre?'),
              this.segu('Ah, eso no se lo voy a decir, jefe. Si mira un poco, se da cuenta.'),
              this.think('No tengo idea de cuál es.'),
              this.think('Pero si se la llevo, deja los molinetes solos…'),
            ])
            this.drinkAsked = true
            this.pista('El de seguridad', 'Quiere una gaseosa: "la de siempre". No sé cuál es. La máquina anda con fichas. Si se la llevo, se va un rato.')
            return false
          },
        },
        {
          label: '"¿Hace mucho que trabaja acá?"',
          run: async () => {
            await say(this, [this.speak('¿Hace mucho que trabaja acá?'), this.segu('Tanto que ya ni cuento. Acá adentro los días son todos iguales.')])
            return false
          },
        },
        {
          label: '"¿Qué hay del otro lado?"',
          run: async () => {
            await say(this, [this.speak('¿Qué hay del otro lado?'), this.segu('Consultorios, pasillos, más puertas. Yo nunca pasé de acá: lo mío es este molinete.')])
            return false
          },
        },
        {
          label: '"¿No me deja pasar? Es un minuto."',
          run: async () => {
            await say(this, [this.speak('¿No me deja pasar? Es un minuto.'), this.segu('Si lo dejo pasar a usted, tengo que dejar pasar a todos. Y la cámara me mira a mí.')])
            return false
          },
        },
        { label: '(Irse)', run: async () => true },
      )
      const i = await choose(this, opts.map((o) => o.label), { x: 780, y: 700 })
      if (await opts[i].run()) return
    }
  }

  private async darGaseosa() {
    if (this.drink !== GUARD_DRINK) {
      // Se equivocó de gaseosa: no pasa nada, puede sacar otra
      await say(this, [
        this.speak('Tome, le traje una gaseosa.'),
        this.segu(`¿${GASEOSAS[this.drink].nombre}? Esa no es la mía, jefe.`),
        this.segu(this.drink === 0 ? 'Casi. Pero el médico me tiene a dieta.' : 'La de siempre, jefe. Fíjese bien.'),
        this.think('No era esa. Tengo que fijarme mejor cuál toma.'),
      ])
      return false
    }
    await say(this, [
      this.speak('Tome, le traje una gaseosa.'),
      this.segu('Esa es. Usted sí que es observador, jefe.'),
      this.segu('Acá no puedo: está la cámara.'),
      this.segu('Dos minutos. Usted no vio nada.'),
    ])
    this.setInventory('gaseosa', false)
    this.drink = -1
    this.guardAtPost = false
    // Se va a tomarla a la otra punta del hall, lejos de la cámara
    const dest = POS.maquina - 80
    void this.tween({ targets: this.guard, x: dest, duration: ((POS.guardia - dest) / GUARD_SPEED) * 1000 }).then(() => {
      this.guard.setFlipX(false)
      sfx.kick('lata')
    })
    await this.wait(1800)
    await say(this, [this.think('Se fue. Es ahora.')])
    return true
  }

  private async saltar() {
    await say(this, [this.think('Sin carnet no gira.'), this.think('Pero ahora no mira nadie…')])
    this.goalOn = false
    this.goal.set(null)
    this.leaving = true
    this.facing = 1
    this.player.setFlipX(false).setTexture('jorge1')
    sfx.step()
    await this.tween({ targets: this.player, x: TURNSTILE_X + 60, y: FEET - 110, duration: 320, ease: 'Sine.Out' })
    await this.tween({ targets: this.player, x: TURNSTILE_X + 130, y: FEET, duration: 280, ease: 'Sine.In' })
    sfx.step()
    this.cameras.main.fadeOut(1800, 0, 0, 0)
    await this.tween({ targets: this.player, x: 3300, duration: 1800 })
    await this.wait(300)
    await this.ascensor()
  }

  // Camina solo hasta x (para las secuencias sin control)
  private async walkTo(x: number) {
    const from = this.player.x
    let lastStep = 0
    await this.tween({
      targets: this.player,
      x,
      duration: (Math.abs(x - from) / WALK) * 1000,
      onUpdate: () => {
        const d = Math.abs(this.player.x - from)
        this.player.setTexture(Math.floor(d / 20) % 2 === 0 ? 'jorge1' : 'jorge2')
        if (d - lastStep > 40) {
          lastStep = d
          sfx.step()
        }
      },
    })
    this.player.setTexture('jorge0')
  }

  // Secuencia larga, sin control: Jorge sube en el ascensor y piensa
  private async ascensor() {
    const E = LIFT.x
    const cam = this.cameras.main
    const { doorL, doorR, arrow } = this.drawLift()
    const lift = this.lift!
    cam.stopFollow()
    cam.setBounds(E, 0, 1280, 720)
    cam.setScroll(E, 0)
    doorL.setScale(1, 0)
    this.facing = 1
    this.player.setPosition(E + 120, LIFT.floor - 70).setFlipX(false)
    cam.fadeIn(1200, 0, 0, 0)
    await this.walkTo(E + 640)
    sfx.door()
    await this.tween({ targets: doorL, scaleY: 1, duration: 350 })
    await this.wait(600)
    await say(this, [this.think('Un ascensor. Los consultorios deben estar arriba.'), this.think('Tengo que encontrar el consultorio del doctor Vela.')])

    sfx.click()
    const hum = startElevator()
    this.events.once('shutdown', () => hum.stop(0.3))
    const blink = this.tweens.add({ targets: arrow, alpha: 1, yoyo: true, repeat: -1, duration: 500 })
    this.tweens.add({ targets: lift, speed: LIFT.speed, duration: 1800, ease: 'Sine.In' })
    await this.wait(4000)
    await say(this, [this.think('Dios mío… ¿por qué no puedo recordar nada?')])
    await this.wait(3500)
    await say(this, [this.think('Apreté el piso sin pensarlo. Como si la mano ya supiera.'), this.think('Siento que estoy actuando por inercia.')])
    await this.wait(3500)
    await say(this, [
      this.think('De momento voy a seguir la corriente.'),
      this.think('No sé bien qué estoy haciendo…'),
      this.think('…pero espero que me puedan ayudar.'),
    ])
    await this.wait(2500)

    // Frena justo en el piso siguiente
    lift.speed = 0
    let rest = LIFT.h - (lift.scroll % LIFT.h)
    if (rest < 200) rest += LIFT.h
    await this.tween({ targets: lift, scroll: lift.scroll + rest, duration: ((2 * rest) / LIFT.speed) * 1000, ease: 'Quad.Out' })
    hum.stop(0.6)
    blink.stop()
    arrow.setAlpha(1)
    sfx.ding()
    await this.wait(900)
    sfx.door()
    await this.tween({ targets: doorR, scaleY: 0, duration: 350 })
    await this.wait(500)
    cam.fadeOut(2000, 0, 0, 0)
    await this.walkTo(E + 1010)
    await this.wait(500)
    this.ending()
  }

  private async cubiculo(i: number) {
    if (i === STALL_LOCKED) return this.ocupado()
    if (!this.stallOpen[i]) {
      this.stallOpen[i] = true
      sfx.door()
      this.stallDoors[i].setVisible(false)
      await this.wait(250)
    }
    await say(this, [this.think(['Vacío. Ni papel hay.', 'Este está clausurado.', '', 'Tampoco hay papel acá.'][i])])
  }

  // El cubículo trabado: adentro hay alguien que necesita papel
  private async ocupado() {
    if (this.fichaGiven) {
      await say(this, [this.voz('Gracias de nuevo, eh. Ahora… ¿me dejás solo?')])
    } else if (this.has('papelHigienico')) {
      await say(this, [this.speak('Acá tiene. Se lo paso por abajo.')])
      sfx.paper()
      this.setInventory('papelHigienico', false)
      await say(this, [this.voz('¡Me salvaste! Tomá, lo prometido.'), this.voz('Llevate varias: tengo los bolsillos llenos.')])
      const ficha = this.add.image(STALLS[STALL_LOCKED], FLOOR - 8, 'ficha').setDepth(7)
      sfx.pickup()
      await this.tween({ targets: ficha, y: ficha.y - 60, alpha: 0, duration: 500 })
      ficha.destroy()
      this.fichaGiven = true
      this.setInventory('ficha', true)
      await say(this, [this.think('Fichas para la máquina de bebidas.')])
    } else if (!this.manAsked) {
      sfx.handle()
      this.cameras.main.shake(120, 0.002)
      await say(this, [
        this.think('Está cerrada por dentro.'),
        this.voz('¡Ocupado!'),
        this.speak('Perdón.'),
        this.voz('Pará, pará. ¿Me hacés un favor?'),
        this.voz('Acá no hay papel, para variar. Si me conseguís un rollo, te regalo una ficha para la máquina de bebidas.'),
        this.think('Una ficha… Puede servir.'),
      ])
      this.manAsked = true
      this.pista('Alguien en el baño', 'Está encerrado en un cubículo, sin papel higiénico. Si le consigo un rollo, me da una ficha para la máquina de bebidas.')
    } else {
      await say(this, [this.voz('¿Y? ¿Conseguiste papel?'), this.think('En los cubículos no hay. Tiene que haber en algún otro lado.')])
    }
  }

  // ---------- Inicio y final ----------

  private async intro() {
    this.cameras.main.centerOn(this.player.x, 360)
    this.cameras.main.fadeIn(1500, 0, 0, 0)
    await this.wait(1600)
    await say(this, [this.think('Así que esto es Neural.'), this.think('La recepción debe estar al fondo.')])
    this.goalOn = true
    this.busy = false
    const help = text(this, 24, this.scale.height - 34, '← → / A D caminar   ·   E hablar / examinar / usar puertas   ·   Espacio avanzar texto   ·   TAB diario   ·   F pantalla completa', 16, '#aab2c4')
      .setScrollFactor(0)
      .setDepth(950)
    this.time.delayedCall(12000, () => this.tweens.add({ targets: help, alpha: 0, duration: 1500 }))
  }

  // Jugando el Hall suelto, termina acá; en el prototipo completo sigue al pasillo de los consultorios
  private ending() {
    this.lift = undefined
    if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Hall del edificio' })
    else this.scene.start('Corridor')
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

  // Objetivo resumido de la locación: se recalcula según lo que Jorge ya sabe y lo que lleva
  private currentGoal(): string {
    if (!this.announced) return 'Anunciarme en la recepción'
    if (!this.guardAtPost) return 'Saltar los molinetes'
    if (this.has('gaseosa') && this.drinkAsked) return 'Darle la gaseosa al de seguridad'
    if (this.drinkAsked && this.has('ficha')) return 'Sacar "la de siempre" de la máquina'
    if (this.manAsked && !this.fichaGiven) {
      return this.has('papelHigienico') ? 'Llevarle el papel al del baño' : 'Conseguir papel higiénico'
    }
    if (this.drinkAsked) return 'Conseguir fichas para la máquina'
    return 'Pasar los molinetes sin carnet'
  }

  update(time: number, delta: number) {
    if (this.goalOn) this.goal.set(this.currentGoal())
    const k = this.keys
    const ePressed = Phaser.Input.Keyboard.JustDown(k.E)
    const tabPressed = Phaser.Input.Keyboard.JustDown(k.TAB)
    if (this.lift) {
      this.lift.scroll += this.lift.speed * (Math.min(delta, 100) / 1000)
      this.lift.rows.y = this.lift.scroll % LIFT.h
    }
    if (this.busy || time < this.lockUntil) return

    if (tabPressed) {
      void this.run(() => openDiary(this))
      return
    }

    const dir = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0)
    if (dir !== 0) {
      const r = ROOMS[this.room]
      const pad = r.pad ?? 50
      const max = this.room === 'hall' ? (this.guardAtPost ? BLOCK_X : TURNSTILE_X) : r.x + r.w - pad
      const from = this.player.x
      this.player.x = Phaser.Math.Clamp(from + dir * WALK * (Math.min(delta, 100) / 1000), r.x + pad, max)
      const moved = Math.abs(this.player.x - from)
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

    // Si intenta pasar con el de seguridad en su puesto, lo frena
    if (this.room === 'hall' && this.guardAtPost) {
      if (this.player.x < BLOCK_X - 100) this.blockArmed = true
      else if (this.blockArmed && dir > 0 && this.player.x >= BLOCK_X) {
        this.blockArmed = false
        void this.run(() => this.alto())
        return
      }
    }

    const guardItem = this.items.find((it) => it.id === 'guardia')
    if (guardItem) guardItem.x = this.guard.x

    const near = this.nearest()
    if (near) {
      // El ícono nunca tapa la cabeza de Jorge
      this.prompt.setVisible(true).setPosition(near.x, Math.min(near.y, FLOOR - 175))
      this.promptLabel.setText(near.name)
      if (ePressed) void this.run(near.action)
    } else {
      this.prompt.setVisible(false)
    }
  }
}

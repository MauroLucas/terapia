import * as Phaser from 'phaser'
import { addVignette, FONT, makeTextures } from '../art'
import { sfx, startMachine, startRoomTone } from '../audio'
import { addPista, state } from '../state'
import { choose, eyelids, objective, say, toast, type Line, type Point } from '../ui'
import { openDiary } from './diary'

// Consultorio (locación 3), segunda parte: adentro del consultorio del doctor Vela.
//   Consultorio: [puerta al pasillo] [biblioteca] [ventana] [sillón de Jorge | escritorio | silla de Vela] [puerta a inducción]
//   Cuarto de inducción: [puerta] [pantalla grande] [camilla con casco] [consola]
// Vela recibe a Jorge, le hace preguntas (Jorge puede decir la verdad o mentir), lo lleva al cuarto de inducción,
// le explica el tratamiento y Jorge se acuesta en la camilla. Se le cierran los ojos y sigue en Dream (la primera sesión).
// Con `{ despertar: true }` arranca en la camilla, después del sueño: Jorge abre los ojos y Vela cierra la sesión.
// No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const FLOOR = 600
const FEET = FLOOR - 70 // centro de Jorge parado
const WALK = 204 // px/s, igual que en las otras locaciones
const VELA_WALK = 150

type RoomId = 'consultorio' | 'induccion'
const ROOMS: Record<RoomId, { x: number; w: number }> = {
  consultorio: { x: 0, w: 1640 },
  induccion: { x: 2000, w: 1400 },
}
const POS = {
  entrada: 170,
  velaRecibe: 470,
  sillon: 820, // donde se sienta Jorge
  escritorio: 990,
  sillaVela: 1165,
  puertaInduccion: 1520,
  entradaInduccion: 2150,
  camilla: 2700, // centro de la camilla
  consola: 3160,
}
const HELMET = { x: 2618, up: 300, down: 430 }

type Phase = 'llegada' | 'sentarse' | 'preguntas' | 'seguir' | 'camilla' | 'fin'

interface Spot {
  room: RoomId
  x: number
  label: string
  when: () => boolean
  action: () => Promise<void>
}

// Preguntas del doctor. Jorge no recuerda nada: la verdad es decirlo; mentir es seguirle la corriente. Textos provisorios.
interface Respuesta {
  dice: string
  vela: string[]
  piensa?: string
}
interface Pregunta {
  id: string
  q: string
  verdad: Respuesta
  mentira: Respuesta
}

const PRIMERAS: Pregunta[] = [
  {
    id: 'como-te-sentis',
    q: '¿Cómo te sentís hoy?',
    verdad: { dice: 'Perdido. No me acuerdo de nada.', vela: ['Gracias por decírmelo. Para eso estamos.'] },
    mentira: { dice: 'Bien. Como siempre.', vela: ['Me alegra. Igual vamos a ver qué dicen tus sueños.'] },
  },
  {
    id: 'mejoria',
    q: '¿Sentís alguna mejoría desde la última sesión?',
    verdad: { dice: 'No sabría decirle. No me acuerdo de la última sesión.', vela: ['Mm. Lo anoto.'] },
    mentira: { dice: 'Sí, creo que sí. Un poco.', vela: ['Bien. De a poquito.'] },
  },
]
// De estas se eligen dos al azar en cada partida
const EXTRAS: Pregunta[] = [
  {
    id: 'durmiendo',
    q: '¿Cómo venís durmiendo?',
    verdad: { dice: 'Hoy me desperté vestido. No sabía dónde estaba.', vela: ['¿Vestido? Bueno… eso también lo vamos a mirar.'] },
    mentira: { dice: 'Bien. De corrido.', vela: ['Qué bueno. El descanso ayuda mucho.'] },
  },
  {
    id: 'hablaste-con-alguien',
    q: '¿Hablaste con alguien esta semana?',
    verdad: { dice: 'No que me acuerde. Hoy me vino a buscar un chofer, nada más.', vela: ['Un chofer… Está bien.'] },
    mentira: { dice: 'Sí, con unos amigos.', vela: ['Bien. Te hace bien estar acompañado.'] },
  },
  {
    id: 'caminar',
    q: '¿Pudiste salir a caminar, como habíamos hablado?',
    verdad: { dice: 'No me acuerdo de que lo hayamos hablado.', vela: ['No pasa nada. Te lo vuelvo a pedir: un ratito por día.'] },
    mentira: { dice: 'Sí, un par de veces.', vela: ['Muy bien. Seguí así.'] },
  },
  {
    id: 'que-soñaste',
    q: '¿Te acordás de qué soñaste anoche?',
    verdad: { dice: 'No. No me acuerdo ni de anoche.', vela: ['Tranquilo. Hoy lo vamos a ver juntos.'] },
    mentira: { dice: 'Algo… no mucho.', vela: ['Bueno. Hoy lo vamos a ver juntos.'] },
  },
]
const ULTIMA: Pregunta = {
  id: 'medicacion',
  q: '¿Estás tomando la medicación?',
  verdad: {
    dice: 'No sé. No me acuerdo de estar tomando nada.',
    vela: ['¿No te acordás? Bueno, después lo vemos con calma.', 'Pero no la dejes, ¿eh?'],
    piensa: '¿Qué medicación?',
  },
  mentira: { dice: 'Sí, todos los días.', vela: ['Bien. No la dejes, ¿eh?'], piensa: '¿Qué medicación?' },
}

export class Office extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private vela!: Phaser.GameObjects.Image
  private helmet!: Phaser.GameObjects.Container
  private cable!: Phaser.GameObjects.Graphics
  private screenGlow!: Phaser.GameObjects.Rectangle
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text
  private goal!: ReturnType<typeof objective>
  private spots: Spot[] = []
  private room: RoomId = 'consultorio'
  private phase: Phase = 'llegada'
  private busy = true
  private leaving = false
  private lockUntil = 0
  private facing = 1
  private walkDist = 0
  private stepDist = 0
  private tone?: { stop: (fade?: number) => void }
  private machine?: { stop: (fade?: number) => void }

  constructor() {
    super('Office')
  }

  create(data: { despertar?: boolean } = {}) {
    const despertar = !!data.despertar
    this.busy = true
    this.leaving = false
    this.facing = 1
    this.phase = 'llegada'
    if (!despertar) state.consulta = []
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#0b0c10')
    this.drawConsultorio()
    this.drawInduccion()

    this.vela = this.add.image(POS.velaRecibe, FEET, 'vela0').setFlipX(true).setDepth(9)
    this.player = this.add.image(POS.entrada, FEET, 'jorge0').setDepth(10)

    const box = this.add.graphics()
    box.fillStyle(0xf6f3ea).fillRoundedRect(-16, -16, 32, 32, 7)
    box.lineStyle(2, 0x111111).strokeRoundedRect(-16, -16, 32, 32, 7)
    const key = this.add.text(0, 0, 'E', { fontFamily: FONT, fontSize: '18px', color: '#111', fontStyle: 'bold', resolution: 2 }).setOrigin(0.5)
    this.promptLabel = this.add.text(0, 26, '', { fontFamily: FONT, fontSize: '14px', color: '#d8dce6', resolution: 2, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0)
    this.prompt = this.add.container(0, 0, [box, key, this.promptLabel]).setDepth(800).setVisible(false)
    this.tweens.add({ targets: this.prompt, scale: 1.08, yoyo: true, repeat: -1, duration: 600 })
    addVignette(this, 0.45)
    this.goal = objective(this)
    this.setupSpots()

    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,A,D,E,SPACE,TAB,ESC') as Record<string, Phaser.Input.Keyboard.Key>
    const cam = this.cameras.main
    this.setCameraRoom('consultorio')
    cam.startFollow(this.player, true, 0.08, 0.08)
    cam.centerOn(this.player.x, 360)
    this.tone = startRoomTone()
    this.events.once('shutdown', () => {
      this.tone?.stop(0.5)
      this.machine?.stop(0.5)
    })
    if (despertar) {
      void this.run(() => this.despertar())
    } else {
      cam.fadeIn(1500, 0, 0, 0)
      void this.run(() => this.llegada())
    }
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __office?: Office }).__office = this
  }

  // ---------- Escenario ----------

  private label(x: number, y: number, str: string, size = 12, color = '#5a6172') {
    return this.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 2 }).setOrigin(0.5)
  }

  private drawConsultorio() {
    const { x: X, w: Wd } = ROOMS.consultorio
    const g = this.add.graphics()
    // Paredes cálidas y piso de madera: más acogedor que el resto de Neural
    g.fillStyle(0x5b5149).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x4b423b).fillRect(X, 0, Wd, 60)
    g.fillStyle(0x6a5f55).fillRect(X, FLOOR - 120, Wd, 6)
    g.fillStyle(0x3a2c22).fillRect(X, FLOOR, Wd, 120)
    g.lineStyle(1, 0x2c2119)
    for (let lx = X; lx < X + Wd; lx += 120) g.lineBetween(lx, FLOOR, lx + 30, 720)
    g.fillStyle(0xe8b04a, 0.6).fillRect(X, FLOOR - 6, Wd, 6)

    // Puerta al pasillo (por acá entra Jorge)
    g.fillStyle(0x1a1d24).fillRect(POS.entrada - 60, 402, 120, 198)
    g.fillStyle(0x5b6474).fillRect(POS.entrada - 52, 410, 104, 190)
    g.fillStyle(0xc9ced8).fillCircle(POS.entrada + 36, 510, 5)

    // Biblioteca
    g.fillStyle(0x3b2a1f).fillRect(300, 250, 200, 350)
    const lomos = [0x7a3b33, 0x2f4f6b, 0x4f6b3a, 0xb08a4a, 0x5a3f6b, 0x8a8f99]
    for (let row = 0; row < 4; row++) {
      const y = 270 + row * 82
      g.fillStyle(0x2a1e16).fillRect(306, y + 60, 188, 8)
      let bx = 312
      for (let i = 0; bx < 480; i++) {
        const bw = 12 + ((i * 7 + row * 5) % 10)
        const bh = 40 + ((i * 13 + row * 3) % 18)
        g.fillStyle(lomos[(i + row) % lomos.length]).fillRect(bx, y + 60 - bh, bw, bh)
        bx += bw + 2
      }
    }

    // Ventana con persiana
    g.fillStyle(0xa9c0dc).fillRect(560, 150, 200, 220)
    g.fillStyle(0x8aa2c0).fillRect(560, 290, 200, 80)
    g.lineStyle(5, 0x2b313c).strokeRect(560, 150, 200, 220)
    g.lineStyle(2, 0xd9dde5, 0.8)
    for (let y = 160; y < 300; y += 14) g.lineBetween(564, y, 756, y)

    // Diploma y cuadro
    g.fillStyle(0x2a1e16).fillRect(1110, 220, 110, 80)
    g.fillStyle(0xf1ece0).fillRect(1118, 228, 94, 64)
    g.lineStyle(1, 0x9a8f7a).lineBetween(1130, 250, 1200, 250).lineBetween(1130, 262, 1200, 262).lineBetween(1140, 274, 1190, 274)
    this.label(1165, 240, 'DIPLOMA', 9, '#6b5f4a')

    // Escritorio con lámpara y papeles
    g.fillStyle(0x4a3326).fillRect(POS.escritorio - 140, 470, 280, 20)
    g.fillStyle(0x3b2a1f).fillRect(POS.escritorio - 130, 490, 20, 110).fillRect(POS.escritorio + 110, 490, 20, 110).fillRect(POS.escritorio + 30, 490, 80, 80)
    g.fillStyle(0xf1efe8).fillRect(POS.escritorio - 60, 462, 60, 8)
    g.fillStyle(0x2b313c).fillRect(POS.escritorio + 60, 440, 6, 30).fillTriangle(POS.escritorio + 48, 440, POS.escritorio + 84, 440, POS.escritorio + 66, 420)
    this.add.circle(POS.escritorio + 66, 450, 70, 0xffe7a8, 0.08).setBlendMode(Phaser.BlendModes.ADD)

    // Sillón del paciente (izquierda) y silla del doctor (derecha)
    g.fillStyle(0x6b3f2f).fillRoundedRect(POS.sillon - 52, 430, 26, 152, 8)
    g.fillStyle(0x7d4a37).fillRoundedRect(POS.sillon - 44, 556, 92, 28, 8)
    g.fillStyle(0x2a1e16).fillRect(POS.sillon - 38, 584, 8, 16).fillRect(POS.sillon + 34, 584, 8, 16)
    g.fillStyle(0x2b313c).fillRoundedRect(POS.sillaVela + 28, 440, 22, 124, 6)
    g.fillStyle(0x363d4a).fillRoundedRect(POS.sillaVela - 44, 556, 92, 24, 6)
    g.fillStyle(0x1a1d24).fillRect(POS.sillaVela - 3, 580, 6, 14).fillRect(POS.sillaVela - 34, 594, 68, 6)

    // Planta y puerta al cuarto de inducción
    g.fillStyle(0x6b6f78).fillRect(1340, 550, 32, 50)
    g.fillStyle(0x3f6b45).fillEllipse(1356, 510, 54, 90).fillEllipse(1338, 530, 30, 60).fillEllipse(1374, 530, 30, 60)
    g.fillStyle(0x1a1d24).fillRect(POS.puertaInduccion - 60, 402, 120, 198)
    g.fillStyle(0xd9dde5).fillRect(POS.puertaInduccion - 52, 410, 104, 190)
    g.fillStyle(0x8a8f99).fillCircle(POS.puertaInduccion - 36, 510, 5)
    g.fillStyle(0xd9dde5).fillRoundedRect(POS.puertaInduccion - 80, 344, 160, 40, 4)
    g.fillStyle(0x4c7bd1).fillRect(POS.puertaInduccion - 80, 344, 160, 5)
    this.label(POS.puertaInduccion, 368, 'INDUCCIÓN AL SUEÑO', 11, '#1c2028')
  }

  private drawInduccion() {
    const { x: X, w: Wd } = ROOMS.induccion
    const g = this.add.graphics()
    // Clínico y en penumbra: azules fríos
    g.fillStyle(0x283041).fillRect(X, 0, Wd, FLOOR)
    g.fillStyle(0x1e2532).fillRect(X, 0, Wd, 60)
    g.fillStyle(0x161a22).fillRect(X, FLOOR, Wd, 120)
    g.lineStyle(1, 0x222833)
    for (let lx = X; lx < X + Wd; lx += 160) g.lineBetween(lx, FLOOR, lx + 40, 720)
    g.fillStyle(0x4c7bd1, 0.5).fillRect(X, FLOOR - 6, Wd, 6)

    // Puerta por la que entra Jorge
    g.fillStyle(0x1a1d24).fillRect(POS.entradaInduccion - 60, 402, 120, 198)
    g.fillStyle(0xd9dde5).fillRect(POS.entradaInduccion - 52, 410, 104, 190)
    g.fillStyle(0x8a8f99).fillCircle(POS.entradaInduccion + 36, 510, 5)

    // Pantalla grande donde se proyectan los sueños: apagada hasta que arranca la máquina
    g.fillStyle(0x0d0f14).fillRect(2440, 110, 560, 270)
    g.lineStyle(6, 0x3a4252).strokeRect(2440, 110, 560, 270)
    this.screenGlow = this.add.rectangle(2443, 113, 554, 264, 0x7fa6e0, 0).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD)

    // Camilla
    g.fillStyle(0xd9dde5).fillRoundedRect(POS.camilla - 125, 455, 250, 22, 8)
    g.fillStyle(0xbfc4cc).fillRoundedRect(POS.camilla - 125, 442, 60, 16, 8)
    g.fillStyle(0x8a8f99).fillRect(POS.camilla - 100, 477, 14, 100).fillRect(POS.camilla + 86, 477, 14, 100)
    g.fillStyle(0x5b6474).fillRect(POS.camilla - 115, 576, 230, 10)
    g.fillStyle(0x1a1d24).fillCircle(POS.camilla - 105, 592, 8).fillCircle(POS.camilla + 105, 592, 8)

    // Brazo del casco, que baja desde el techo
    g.fillStyle(0x5b6474).fillRect(HELMET.x - 5, 60, 10, 80)
    g.fillStyle(0x3a4252).fillRect(HELMET.x - 30, 60, 60, 12)
    this.cable = this.add.graphics()
    const casco = this.add.graphics()
    casco.fillStyle(0xc9ced8).fillEllipse(0, 0, 70, 50)
    casco.fillStyle(0x3a4252).fillRect(-35, 6, 70, 8)
    casco.fillStyle(0x4c7bd1).fillCircle(-18, -8, 4).fillCircle(0, -14, 4).fillCircle(18, -8, 4)
    this.helmet = this.add.container(HELMET.x, HELMET.up, [this.cable, casco]).setDepth(11)
    this.drawCable()

    // Consola con monitor y luces
    g.fillStyle(0x1e2532).fillRect(POS.consola - 70, 440, 140, 160)
    g.fillStyle(0x3a4252).fillRect(POS.consola - 60, 380, 120, 70)
    g.fillStyle(0x7fa6e0, 0.5).fillRect(POS.consola - 54, 386, 108, 58)
    g.lineStyle(2, 0xd9e6ff, 0.7)
    for (let i = 0; i < 4; i++) {
      const y = 396 + i * 12
      g.beginPath()
      g.moveTo(POS.consola - 50, y)
      for (let x = 0; x <= 100; x += 10) g.lineTo(POS.consola - 50 + x, y + Math.sin((x + i * 25) / 9) * 4)
      g.strokePath()
    }
    for (const [lx, c] of [[-40, 0x4f9d4a], [-20, 0xe0a23a], [0, 0x4f9d4a], [20, 0xa83232]] as [number, number][]) g.fillStyle(c).fillCircle(POS.consola + lx, 470, 4)
    this.label(POS.consola, 362, 'NEURAL', 12, '#9aa3b5')
  }

  // El cable del casco llega siempre hasta el brazo del techo
  private drawCable() {
    this.cable.clear()
    this.cable.lineStyle(4, 0x2b313c).lineBetween(0, -(this.helmet.y - 140), 0, -20)
  }

  // ---------- Personajes y líneas ----------

  private jorgeHead = (): Point => {
    const t = this.player.getTopCenter()
    return { x: t.x + 6 * this.facing, y: t.y + (this.player.texture.key === 'jorgeSentado' ? 4 : 0) }
  }
  private think = (t: string): Line => ({ kind: 'thought', text: t, anchor: this.jorgeHead })
  private speak = (t: string): Line => ({ kind: 'speech', text: t, anchor: this.jorgeHead })
  private doc = (t: string): Line => ({
    kind: 'speech',
    text: t,
    anchor: () => {
      const top = this.vela.getTopCenter()
      return { x: top.x, y: top.y + (this.vela.texture.key === 'velaSentado' ? 4 : 0) }
    },
  })

  private setupSpots() {
    this.spots = [
      { room: 'consultorio', x: POS.entrada, label: 'Pasillo', when: () => this.phase !== 'llegada', action: () => this.salirAlPasillo() },
      { room: 'consultorio', x: POS.sillon, label: 'Sentarse', when: () => this.phase === 'sentarse', action: () => this.sentarse() },
      { room: 'consultorio', x: POS.sillaVela, label: 'Doctor Vela', when: () => this.phase === 'sentarse', action: () => this.charlaVela() },
      { room: 'consultorio', x: POS.puertaInduccion, label: 'Inducción al sueño', when: () => this.phase === 'seguir', action: () => this.entrarInduccion() },
      { room: 'induccion', x: POS.camilla, label: 'Acostarse', when: () => this.phase === 'camilla', action: () => this.acostarse() },
      { room: 'induccion', x: POS.consola, label: 'Doctor Vela', when: () => this.phase === 'camilla', action: () => this.recordarCamilla() },
    ]
  }

  // ---------- Secuencia ----------

  private async llegada() {
    await this.wait(1500)
    await say(this, [
      this.doc('¡Jorge! Te estaba esperando.'),
      this.doc('Según el sistema, nunca ingresaste. Qué raro…'),
      this.doc('Estas cosas de la tecnología no son lo mío.'),
      this.think('Nunca ingresé… porque salté los molinetes.'),
      this.doc('Vení, pasá.'),
    ])
    // Vela vuelve a su silla, detrás del escritorio, y se sienta
    this.vela.setFlipX(false)
    await this.walkVela(POS.sillaVela)
    this.vela.setTexture('velaSentado').setFlipX(true).setOrigin(0.5, 1).setPosition(POS.sillaVela + 8, FLOOR)
    this.phase = 'sentarse'
    this.goal.set('Sentarme frente al doctor Vela')
  }

  private async salirAlPasillo() {
    await say(this, [this.think('No vine hasta acá para irme ahora.')])
  }

  private async charlaVela() {
    await say(this, [this.doc('Sentate, Jorge. Ponete cómodo.')])
  }

  private async sentarse() {
    this.phase = 'preguntas'
    this.goal.set(null)
    this.facing = 1
    this.player.setFlipX(false).setTexture('jorgeSentado').setOrigin(0.5, 1).setPosition(POS.sillon - 8, FLOOR)
    sfx.kick('caja', 0.4)
    await this.wait(600)
    await say(this, [this.doc('Bueno, contame.')])

    const extras = Phaser.Utils.Array.Shuffle([...EXTRAS]).slice(0, 2)
    for (const p of [...PRIMERAS, ...extras, ULTIMA]) await this.preguntar(p)

    await say(this, [this.doc('Bien. Gracias, Jorge.'), this.doc('Acompañame al cuarto de inducción al sueño.')])
    // Vela se levanta y se va por la puerta del fondo
    this.vela.setTexture('vela0').setOrigin(0.5).setY(FEET).setFlipX(false)
    await this.wait(300)
    this.player.setTexture('jorge0').setOrigin(0.5).setPosition(POS.sillon, FEET)
    await this.walkVela(POS.puertaInduccion)
    sfx.door()
    await this.tween({ targets: this.vela, alpha: 0, duration: 300 })
    this.vela.setVisible(false)
    this.phase = 'seguir'
    this.goal.set('Seguir al doctor Vela')
  }

  private async preguntar(p: Pregunta) {
    await say(this, [this.doc(p.q)])
    // El orden de las dos respuestas cambia, para que la verdad no esté siempre en el mismo lugar
    const opts = Phaser.Utils.Array.Shuffle([
      { verdad: true, r: p.verdad },
      { verdad: false, r: p.mentira },
    ])
    const i = await choose(this, opts.map((o) => `"${o.r.dice}"`), { x: 560, y: 700 })
    const { verdad, r } = opts[i]
    state.consulta.push({ pregunta: p.id, verdad })
    const lines: Line[] = [this.speak(r.dice)]
    if (r.piensa) lines.push(this.think(r.piensa))
    await say(this, [...lines, ...r.vela.map((v) => this.doc(v))])
  }

  private async entrarInduccion() {
    await this.goTo('induccion', POS.entradaInduccion + 70)
    this.vela.setVisible(true).setAlpha(1).setTexture('vela0').setPosition(POS.consola - 90, FEET).setFlipX(true)
    this.goal.set(null)
    await this.wait(400)
    await say(this, [
      this.doc('Bueno. Como siempre, te repaso cómo funciona, así vas tranquilo.'),
      this.doc('Esta máquina lee las ondas de tu cerebro mientras dormís.'),
      this.doc('Lo que soñás aparece en esa pantalla, como si fuera una película.'),
      this.doc('Además, con unas ondas electromagnéticas te induzco un sueño lúcido: vas a saber que estás soñando.'),
      this.doc('Y como veo todo en tiempo real, puedo hablarte e interactuar con vos ahí adentro.'),
      this.think('¿Y qué va a ver en los míos?'),
      this.doc('Dale, acostate en la camilla.'),
    ])
    if (addPista('El tratamiento', 'Una máquina lee las ondas de mi cerebro y muestra mis sueños en una pantalla, como una película. Con ondas electromagnéticas me inducen un sueño lúcido, y el doctor Vela puede hablarme ahí adentro, en tiempo real.')) {
      toast(this, '✎ Nueva pista en el diario (TAB)')
    }
    this.phase = 'camilla'
    this.goal.set('Acostarme en la camilla')
  }

  private async recordarCamilla() {
    await say(this, [this.doc('En la camilla, Jorge. Yo me ocupo del resto.')])
  }

  private async acostarse() {
    this.phase = 'fin'
    this.goal.set(null)
    this.leaving = true
    this.cameras.main.stopFollow()
    this.cameras.main.pan(POS.camilla + 120, 360, 1200, 'Sine.easeInOut')
    // Jorge se acuesta: cabeza hacia el casco, mirando al techo
    sfx.step()
    this.player.setTexture('jorge0').setFlipX(false).setAngle(-90).setPosition(POS.camilla - 40, 455 - 26)
    await this.wait(700)
    await say(this, [this.doc('Así. Quedate quieto.')])
    sfx.handle()
    await this.tween({ targets: this.helmet, y: HELMET.down, duration: 2200, ease: 'Sine.InOut', onUpdate: () => this.drawCable() })
    sfx.click()
    this.machine = startMachine()
    this.tweens.add({ targets: this.screenGlow, fillAlpha: 0.35, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
    await this.wait(1200)
    await say(this, [this.doc('Vos relajate.')])
    await this.closeEyes()
    this.tone?.stop(2)
    this.machine?.stop(3)
    await this.wait(1500)
    // Jugando el Consultorio suelto, termina acá; en el prototipo completo sigue en el sueño
    if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Consultorio' })
    else this.scene.start('Dream')
  }

  // Después de la primera sesión: Jorge abre los ojos en la camilla
  private async despertar() {
    this.phase = 'fin'
    this.leaving = true
    this.goal.set(null)
    const cam = this.cameras.main
    this.setCameraRoom('induccion')
    cam.stopFollow()
    cam.centerOn(POS.camilla + 120, 360)
    this.player.setTexture('jorge0').setFlipX(false).setAngle(-90).setPosition(POS.camilla - 40, 455 - 26)
    this.helmet.setY(HELMET.down)
    this.drawCable()
    this.vela.setTexture('vela0').setPosition(POS.consola - 90, FEET).setFlipX(true)
    this.machine = startMachine()
    this.screenGlow.setFillStyle(0xffc48a, 0.3)
    this.tweens.add({ targets: this.screenGlow, fillAlpha: 0.08, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
    const lids = eyelids(this, 0)
    await this.wait(1500)
    await lids.to(0.3, 2400)
    await lids.to(0.1, 1200)
    await lids.to(1, 2600)
    lids.destroy()
    await say(this, [
      this.doc('Despacio. Ya estás acá.'),
      this.doc('Lo vi todo en la pantalla: la feria, la calesita… tu mamá.'),
      this.think('Mi mamá.'),
      this.think('No le pude ver la cara.'),
      this.doc('Es normal. Los recuerdos vuelven de a poco.'),
    ])
    this.machine.stop(1.5)
    sfx.handle()
    await this.tween({ targets: this.helmet, y: HELMET.up, duration: 2000, ease: 'Sine.InOut', onUpdate: () => this.drawCable() })
    sfx.click()
    toast(this, '✎ Línea de tiempo: Infancia · La feria')
    await this.wait(800)
    await say(this, [this.doc('Por hoy alcanza, Jorge.'), this.doc('La semana que viene seguimos.')])
    cam.fadeOut(2000, 0, 0, 0)
    this.tone?.stop(2)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    await this.wait(600)
    this.scene.start('LevelEnd', { titulo: this.registry.get('solo') ? 'Fin de la locación' : 'Fin del prototipo', locacion: 'Sesión 1: La feria' })
  }

  // Se le cierran los ojos muy despacio: dos párpados que bajan y suben, cada vez más pesados
  private async closeEyes() {
    const lids = eyelids(this, 1)
    await this.wait(800)
    await lids.to(0.55, 2600)
    await lids.to(0.8, 1400)
    await lids.to(0.3, 2600)
    await lids.to(0.5, 1500)
    await lids.to(0, 3200)
  }

  // ---------- Movimiento y ambientes ----------

  private async walkVela(x: number) {
    const from = this.vela.x
    this.vela.setFlipX(x < from)
    await this.tween({
      targets: this.vela,
      x,
      duration: (Math.abs(x - from) / VELA_WALK) * 1000,
      onUpdate: () => this.vela.setTexture(Math.floor(Math.abs(this.vela.x - from) / 20) % 2 === 0 ? 'vela1' : 'vela2'),
    })
    this.vela.setTexture('vela0')
  }

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

  private async run(fn: () => Promise<void>) {
    this.busy = true
    this.prompt.setVisible(false)
    if (this.player.texture.key !== 'jorgeSentado' && this.player.angle === 0) this.player.setTexture('jorge0')
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
    const k = this.keys
    const ePressed = Phaser.Input.Keyboard.JustDown(k.E)
    const tabPressed = Phaser.Input.Keyboard.JustDown(k.TAB)
    if (this.busy || time < this.lockUntil) return

    if (tabPressed) {
      void this.run(() => openDiary(this))
      return
    }

    const r = ROOMS[this.room]
    const dir = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0)
    if (dir !== 0) {
      const from = this.player.x
      this.player.x = Phaser.Math.Clamp(from + dir * WALK * (Math.min(delta, 100) / 1000), r.x + 90, r.x + r.w - 90)
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

    const spot = this.spots.find((s) => s.room === this.room && s.when() && Math.abs(this.player.x - s.x) < 70)
    if (spot) {
      this.prompt.setVisible(true).setPosition(spot.x, 300)
      this.promptLabel.setText(spot.label)
      if (ePressed) void this.run(spot.action)
    } else {
      this.prompt.setVisible(false)
    }
  }
}

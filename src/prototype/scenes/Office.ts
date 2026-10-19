import * as Phaser from 'phaser'
import { addVignette, FONT, makeTextures } from '../art'
import { sfx, startMachine, startRoomTone } from '../audio'
import { addPista, state } from '../state'
import { choose, eyelids, objective, say, text, toast, type Line, type Point } from '../ui'
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
// Preguntas de la consulta antes de la Sesión 2 (provisorias)
const SEGUNDA: Pregunta[] = [
  {
    id: 's2-semana',
    q: '¿Cómo estuviste esta semana?',
    verdad: { dice: 'Raro. Me acuerdo de la feria, pero de casi nada más.', vela: ['Es un comienzo, Jorge.'] },
    mentira: { dice: 'Bien. Tranquilo.', vela: ['Me alegra.'] },
  },
  {
    id: 's2-pizarra',
    q: '¿Pudiste anotar algo de lo que viste?',
    verdad: { dice: 'Sí. En la pizarra de mi cuarto: la feria con mi mamá.', vela: ['Muy bien. Eso es tuyo: ya no se pierde.'] },
    mentira: { dice: 'No, nada.', vela: ['No importa. Lo vamos a ir armando juntos.'] },
  },
]

// Preguntas de la consulta antes de la Sesión 3 (provisorias)
const TERCERA: Pregunta[] = [
  {
    id: 's3-semana',
    q: '¿Cómo te sentiste después de la última vez?',
    verdad: { dice: 'Mal. Lo de mi papá no me lo saco de la cabeza.', vela: ['Lo sé. Fue mucho.', 'Hoy vamos a ir a un lugar más tranquilo.'] },
    mentira: { dice: 'Bien. Ya pasó.', vela: ['Bueno. Igual hoy vamos a ir a un lugar más tranquilo.'] },
  },
  {
    id: 's3-maria',
    q: '¿Te acordaste de algo más de María?',
    verdad: { dice: 'Encontré mi cuaderno. Tiene su letra.', vela: ['Entonces ya sabés por dónde seguir.'] },
    mentira: { dice: 'No. De nada.', vela: ['Ya va a venir.'] },
  },
]

// Preguntas de la consulta antes de la Sesión 4 (provisorias)
const CUARTA: Pregunta[] = [
  {
    id: 's4-foto',
    q: '¿Encontraste algo más en tu casa?',
    verdad: { dice: 'Una foto con María. La puse en el portarretratos.', vela: ['Qué bien, Jorge.', 'Un lugar menos vacío.'] },
    mentira: { dice: 'No. Nada.', vela: ['Bueno. Ya va a aparecer.'] },
  },
  {
    id: 's4-mama',
    q: '¿Pensaste en tu mamá esta semana?',
    verdad: { dice: 'Sí. No me acuerdo de qué pasó después. Pero algo pasó.', vela: ['Hoy vamos a ir ahí.'] },
    mentira: { dice: 'No mucho.', vela: ['Hoy vamos a ir ahí igual.'] },
  },
]

// Preguntas de la consulta antes de la Sesión 5 (provisorias)
const QUINTA: Pregunta[] = [
  {
    id: 's5-semana',
    q: '¿Cómo estás después de lo de la semana pasada?',
    verdad: { dice: 'Mal. Duermo mal. La veo en el piso.', vela: ['Lo sé, Jorge. No te voy a apurar.'] },
    mentira: { dice: 'Bien. Ya está.', vela: ['Bueno. Si no está, también está bien.'] },
  },
  {
    id: 's5-maria',
    q: '¿Volviste a ver a María alguna vez, de grande?',
    verdad: { dice: 'No sé. Creo que sí. No me acuerdo.', vela: ['Hoy vamos a averiguarlo.'] },
    mentira: { dice: 'No. Nunca.', vela: ['¿Seguro? Hoy vamos a ver.'] },
  },
]

// Preguntas de la consulta antes de la Sesión 6 (provisorias)
const SEXTA: Pregunta[] = [
  {
    id: 's6-maria',
    q: '¿Seguís pensando en María?',
    verdad: { dice: 'Sí. En la parada. En que me fui.', vela: ['Ya vamos a volver a eso.'] },
    mentira: { dice: 'No. Ya fue.', vela: ['Bueno.'] },
  },
  {
    id: 's6-foto',
    q: '¿Tenés alguna foto de tu mamá?',
    verdad: { dice: 'Una. En la billetera. Atrás dice 12/08.', vela: ['Hoy vamos ahí, Jorge.'] },
    mentira: { dice: 'No. Ninguna.', vela: ['¿Seguro? Fijate en la billetera.', 'Hoy vamos ahí.'] },
  },
]

// Preguntas de la consulta antes de la Sesión 7 (provisorias)
const SEPTIMA: Pregunta[] = [
  {
    id: 's7-viaje',
    q: '¿Qué pasó después del viaje, Jorge?',
    verdad: { dice: 'No sé. Hay un espacio vacío. No quiero mirarlo.', vela: ['Lo sé.', 'Hoy vamos a mirarlo juntos.'] },
    mentira: { dice: 'Nada. Volví a la oficina.', vela: ['¿Seguro?', 'Hoy vamos a ver.'] },
  },
  {
    id: 's7-informe',
    q: '¿Te acordás del informe que trajiste el primer día? Lo que estaba tachado.',
    verdad: { dice: 'Sí. Me da miedo saber qué es.', vela: ['Es normal tener miedo.'] },
    mentira: { dice: 'No me importa.', vela: ['Bueno.', 'Hoy lo vamos a leer igual.'] },
  },
]

// Preguntas de la consulta antes de la Sesión 8 (provisorias)
const OCTAVA: Pregunta[] = [
  {
    id: 's8-velorio',
    q: '¿Te acordás del velorio de tu mamá?',
    verdad: { dice: 'Poco. Mucha gente. Yo no quería estar ahí.', vela: ['Hoy vamos a volver un rato.'] },
    mentira: { dice: 'No fui.', vela: ['Fuiste, Jorge.', 'Hoy lo vas a ver.'] },
  },
  {
    id: 's8-solo',
    q: 'Ese día, ¿estuviste con alguien?',
    verdad: { dice: 'Creo que vino María. No me acuerdo bien.', vela: ['Vino, sí.'] },
    mentira: { dice: 'No. Estuve solo.', vela: ['Mmm.', 'No tan solo como te acordás.'] },
  },
]

// Preguntas de la consulta antes de la Sesión 9, la última (provisorias)
const NOVENA: Pregunta[] = [
  {
    id: 's9-maria',
    q: '¿La llamaste a María?',
    verdad: { dice: 'No. Tengo su número en la billetera, al lado del de papá.', vela: ['Dos números que no llamás.'] },
    mentira: { dice: 'Sí. Hablamos.', vela: ['¿Seguro, Jorge?', 'Hoy vamos a ver.'] },
  },
  {
    id: 's9-bano',
    q: '¿Pudiste abrir la puerta del baño?',
    verdad: { dice: 'No. Sigue trabada desde adentro.', vela: ['Hoy la vamos a abrir.'] },
    mentira: { dice: 'Sí. No había nada.', vela: ['Mmm.', 'Hoy la vamos a abrir igual.'] },
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

  private sesion = 1

  create(data: { despertar?: boolean; sesion?: number } = {}) {
    const despertar = !!data.despertar
    this.sesion = data.sesion ?? 1
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
    } else if (this.sesion >= 2) {
      void this.run(() => this.llegada2())
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

  // Pre-sesión 2: Jorge ya está sentado frente a Vela
  private async llegada2() {
    this.phase = 'preguntas'
    this.goal.set(null)
    this.facing = 1
    this.player.setFlipX(false).setTexture('jorgeSentado').setOrigin(0.5, 1).setPosition(POS.sillon - 8, FLOOR)
    this.vela.setTexture('velaSentado').setFlipX(true).setOrigin(0.5, 1).setPosition(POS.sillaVela + 8, FLOOR)
    const cam = this.cameras.main
    cam.stopFollow()
    cam.centerOn((POS.sillon + POS.sillaVela) / 2, 360)
    cam.fadeIn(1500, 0, 0, 0)
    await this.wait(1600)
    await say(this, [this.doc('Hola, Jorge. Pasó una semana.')])
    await this.testAntes()
    const preguntas = this.sesion === 9 ? NOVENA : this.sesion === 8 ? OCTAVA : this.sesion === 7 ? SEPTIMA : this.sesion === 6 ? SEXTA : this.sesion === 5 ? QUINTA : this.sesion === 4 ? CUARTA : this.sesion === 3 ? TERCERA : SEGUNDA
    for (const p of preguntas) await this.preguntar(p)
    await this.testDespues()
    // Antes de la última sesión, Vela le hace unos juegos de memoria
    if (this.sesion === 9) await this.juegosMemoria()
    await say(this, this.sesion === 9
      ? [this.doc('Bien.'), this.doc('Hoy no vamos al pasado, Jorge.'), this.doc('Acompañame.')]
      : this.sesion === 8
      ? [this.doc('Bien.'), this.doc('Hoy vamos al día siguiente.'), this.doc('Acompañame.')]
      : this.sesion === 7
      ? [this.doc('Bien.'), this.doc('Hoy vamos a ir a lo que estaba tachado.'), this.doc('Acompañame.')]
      : [this.doc('Bien.'), this.doc('Hoy vamos a ir un poco más adelante en tu vida.'), this.doc('Acompañame.')])
    cam.startFollow(this.player, true, 0.08, 0.08)
    await this.irseVela()
  }

  // ---------- Tests de memoria: uno corto en cada consulta (provisorios) ----------
  // No tienen consecuencias en la historia: el resultado se guarda en `state.consulta` (`sN-test`).

  // Una pregunta con opciones. `ok` es el índice de la correcta en `opciones`; se mezclan salvo que `fijas`
  private async testPregunta(id: string, q: string, opciones: string[], ok: number, bien: Line[], mal: Line[], fijas = false) {
    await say(this, [this.doc(q)])
    const opts = opciones.map((t, k) => ({ t, ok: k === ok }))
    if (!fijas) Phaser.Utils.Array.Shuffle(opts)
    const i = await choose(this, opts.map((o) => `"${o.t}"`), { x: 560, y: 700 })
    state.consulta.push({ pregunta: id, verdad: opts[i].ok })
    await say(this, [this.speak(`${opts[i].t}.`), ...(opts[i].ok ? bien : mal)])
    return opts[i].ok
  }

  // Muestra cosas en un cartel, de a una (`juntos` = false) o las tres juntas. Sin `key`, muestra el texto en grande
  private async cartel(items: { key?: string; label: string }[], juntos = false) {
    const W = this.scale.width
    const panel = this.add.rectangle(W / 2, 300, juntos ? Math.min(620, W - 20) : 260, 220, 0xf6f3ea).setScrollFactor(0).setDepth(1050).setStrokeStyle(3, 0x2b3140).setAlpha(0)
    await this.tween({ targets: panel, alpha: 1, duration: 200 })
    const crear = (it: { key?: string; label: string }, x: number) => {
      const objs: Phaser.GameObjects.GameObject[] = []
      if (it.key) {
        objs.push(this.add.image(x, 280, it.key).setScrollFactor(0).setDepth(1051).setScale(3).setAlpha(0))
        objs.push(text(this, x, 370, it.label, 20, '#2b3140').setOrigin(0.5).setScrollFactor(0).setDepth(1051).setAlpha(0))
      } else objs.push(text(this, x, 300, it.label, 72, '#2b3140', { fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(1051).setAlpha(0))
      return objs
    }
    if (juntos) {
      const paso = Math.min(200, (W - 80) / 3)
      const todos = items.flatMap((it, k) => crear(it, W / 2 + (k - 1) * paso))
      sfx.click()
      await this.tween({ targets: todos, alpha: 1, duration: 250 })
      await this.wait(2600)
      await this.tween({ targets: todos, alpha: 0, duration: 250 })
      for (const o of todos) o.destroy()
    } else {
      for (const it of items) {
        const objs = crear(it, W / 2)
        sfx.click()
        await this.tween({ targets: objs, alpha: 1, duration: 250 })
        await this.wait(900)
        await this.tween({ targets: objs, alpha: 0, duration: 250 })
        for (const o of objs) o.destroy()
      }
    }
    await this.tween({ targets: panel, alpha: 0, duration: 200 })
    panel.destroy()
  }

  // Al empezar la consulta
  private async testAntes() {
    const n = this.sesion
    const doc = (...t: string[]) => say(this, t.map((x) => this.doc(x)))
    if (n === 1) {
      // Las tres palabras: se las pide al final de la consulta, y otra vez la semana que viene
      await doc('Antes de empezar, un ejercicio. Es parte del tratamiento.', 'Te voy a decir tres palabras. Acordátelas, que después te las pido.', 'Mate. Colectivo. Paraguas.')
      await say(this, [this.think('Mate, colectivo, paraguas.')])
    } else if (n === 2) {
      await doc('¿Te acordás de las tres palabras que te dije la semana pasada?')
      await say(this, [this.think('Las palabras…')])
      await this.testPregunta('s2-test', '¿Cuáles eran?', ['Mate, colectivo, paraguas', 'Mate, tren, paraguas', 'Café, colectivo, sombrero'], 0,
        [this.doc('Muy bien. Una semana entera, y te acordaste.')],
        [this.doc('Eran mate, colectivo y paraguas.'), this.think('Me las había olvidado. Como todo.'), this.doc('No pasa nada. Para eso estamos.')])
    } else if (n === 3) {
      await doc('Hoy, números. Te muestro unos y después me los repetís.')
      await this.cartel(['4', '9', '2', '7'].map((label) => ({ label })))
      await this.testPregunta('s3-test', '¿Cuáles eran, en orden?', ['4, 9, 2, 7', '4, 2, 9, 7', '4, 9, 7, 2'], 0,
        [this.doc('Perfecto.')], [this.doc('Casi. Eran cuatro, nueve, dos, siete.')])
    } else if (n === 4) {
      await doc('Hoy, cosas. Te muestro cuatro. Mirá bien.')
      await this.cartel([{ key: 'sortija', label: 'La sortija' }, { key: 'cuaderno', label: 'El cuaderno' }, { key: 'fotoFiesta', label: 'La foto' }, { key: 'llave', label: 'La llave' }])
      await this.testPregunta('s4-test', '¿Cuál de estas no te mostré?', ['La llave', 'El boletín', 'La sortija'], 1,
        [this.doc('Bien. El boletín no estaba.')], [this.doc('Esa sí estaba. La que faltaba era el boletín.')])
    } else if (n === 5) {
      await doc('Números otra vez.', 'Pero ahora me los decís al revés: del último al primero.')
      await this.cartel(['3', '8', '1', '6'].map((label) => ({ label })))
      const ok = await this.testPregunta('s5-test', 'Al revés.', ['6, 1, 8, 3', '6, 8, 1, 3', '3, 8, 1, 6'], 0,
        [this.doc('Muy bien. Eso cuesta.')], [this.doc('No. Era seis, uno, ocho, tres.')])
      if (!ok) await say(this, [this.think('Me cuesta pensar al revés.')])
    } else if (n === 6) {
      await doc('Hoy te pregunto por algo que recordaste.')
      await this.testPregunta('s6-test', '¿Qué te dibujó María en la servilleta?', ['Una ventana con plantas', 'Un balcón con plantas', 'Un corazón'], 0,
        [this.doc('Bien. La ventana de la cocina.')], [this.doc('No. Era una ventana. La de la cocina, con plantas.'), this.think('El balcón era lo que quería a los diecisiete.')])
    } else if (n === 7) {
      await doc('Te muestro tres cosas juntas. Fijate dónde está cada una.')
      await this.cartel([{ key: 'papelito', label: 'El papelito' }, { key: 'servilleta', label: 'La servilleta' }, { key: 'boleto', label: 'Los boletos' }], true)
      await this.testPregunta('s7-test', '¿Dónde estaba la servilleta?', ['A la izquierda', 'En el medio', 'A la derecha'], 1,
        [this.doc('Bien.')], [this.doc('En el medio, Jorge.')], true)
    } else if (n === 8) {
      await doc('Hoy no te voy a pedir mucho.', 'Tres palabras, como la primera vez. Después te las pido.', 'Río. Álamo. Banco.')
      await say(this, [this.think('Río, álamo, banco.')])
    }
  }

  // Al final de la consulta (solo las que piden recordar algo de antes)
  private async testDespues() {
    if (this.sesion === 1) {
      await this.testPregunta('s1-test', 'Antes de irnos: ¿cuáles eran las tres palabras?', ['Mate, colectivo, paraguas', 'Mate, colectivo, ventana', 'Café, colectivo, paraguas'], 0,
        [this.doc('Muy bien.')], [this.doc('Casi. Eran mate, colectivo y paraguas.')])
      await say(this, [this.doc('Acordátelas, eh. La semana que viene te las vuelvo a pedir.')])
    } else if (this.sesion === 8) {
      await this.testPregunta('s8-test', 'Las tres palabras, Jorge.', ['Río, álamo, banco', 'Río, viñedo, banco', 'Mar, álamo, banco'], 0,
        [this.doc('Bien, Jorge.')], [this.doc('Río, álamo y banco.')])
      await say(this, [this.think('San Rafael.')])
    }
  }

  // Pre-sesión 9: tres juegos cortos para ver cómo está la memoria de Jorge. No tienen consecuencias (provisorio)
  private async juegosMemoria() {
    await say(this, [this.doc('Antes de entrar, quiero hacerte unos juegos.'), this.doc('Para ver cómo está esa memoria.'), this.think('¿Juegos?')])
    let bien = 0
    // 1. ¿Qué vino antes?
    await say(this, [this.doc('Primero: te digo dos recuerdos y vos me decís cuál vino antes.')])
    const pares: [string, string, number][] = [['La fiesta', 'El boletín', 1], ['El viaje', 'El reencuentro', 1], ['La pelea', 'La fiesta', 1]]
    for (const [a, b, ok] of pares) {
      await say(this, [this.doc(`¿Qué vino antes: ${a.toLowerCase()} o ${b.toLowerCase()}?`)])
      const i = await choose(this, [`"${a}."`, `"${b}."`], { x: 560, y: 700 })
      if (i === ok) bien++
      await say(this, [this.speak(`${[a, b][i]}.`), this.doc(i === ok ? 'Bien.' : 'No. Fue al revés.')])
    }
    // 2. Las cosas
    await say(this, [this.doc('Ahora, cosas.'), this.doc('¿Qué te dio tu mamá la noche de la pelea?')])
    let i = await choose(this, ['"El papelito con el número de papá."', '"Una foto."', '"La llave del departamento."'], { x: 560, y: 700 })
    if (i === 0) bien++
    await say(this, i === 0 ? [this.speak('El papelito con el número de papá.'), this.doc('Bien.')] : [this.speak(i === 1 ? 'Una foto.' : 'La llave del departamento.'), this.doc('No, Jorge. Fue el papelito. El número de tu papá.')])
    await say(this, [this.doc('¿Qué fecha está escrita atrás de la foto de la billetera?')])
    i = await choose(this, ['"12/08."', '"27/08."', '"28/08."'], { x: 560, y: 700 })
    if (i === 0) bien++
    await say(this, i === 0
      ? [this.speak('12/08.'), this.doc('Bien. El viaje.')]
      : [this.speak(i === 1 ? '27/08.' : '28/08.'), this.doc('No. Esa es otra fecha.'), this.think(i === 1 ? 'El día que murió.' : 'El velorio.')])
    // 3. La secuencia: cuatro cosas, una detrás de otra
    await say(this, [this.doc('Último. Te voy a mostrar cuatro cosas, una por una.'), this.doc('Acordate el orden.')])
    const cosas: [string, string][] = [['sortija', 'La sortija'], ['boletin', 'El boletín'], ['fotoFiesta', 'La foto'], ['boleto', 'Los boletos']]
    const panel = this.add.rectangle(this.scale.width / 2, 300, 260, 220, 0xf6f3ea).setScrollFactor(0).setDepth(1050).setStrokeStyle(3, 0x2b3140)
    for (const [key, nombre] of cosas) {
      const img = this.add.image(this.scale.width / 2, 280, key).setScrollFactor(0).setDepth(1051).setScale(3).setAlpha(0)
      const lbl = text(this, this.scale.width / 2, 370, nombre, 20, '#2b3140').setOrigin(0.5).setScrollFactor(0).setDepth(1051).setAlpha(0)
      sfx.click()
      await this.tween({ targets: [img, lbl], alpha: 1, duration: 250 })
      await this.wait(900)
      await this.tween({ targets: [img, lbl], alpha: 0, duration: 250 })
      img.destroy()
      lbl.destroy()
    }
    panel.destroy()
    await say(this, [this.doc('¿En qué orden aparecieron?')])
    const orden = (ks: number[]) => ks.map((k) => cosas[k][1].toLowerCase()).join(', ')
    const opciones = Phaser.Utils.Array.Shuffle([
      { ok: true, t: orden([0, 1, 2, 3]) },
      { ok: false, t: orden([0, 2, 1, 3]) },
      { ok: false, t: orden([1, 0, 2, 3]) },
    ])
    i = await choose(this, opciones.map((o) => `"${o.t[0].toUpperCase()}${o.t.slice(1)}."`), { x: 560, y: 700 })
    if (opciones[i].ok) bien++
    await say(this, [this.doc(opciones[i].ok ? 'Bien. En el orden en que las recordaste.' : 'Casi. Era: la sortija, el boletín, la foto y los boletos. En el orden en que las recordaste.')])
    state.consulta.push({ pregunta: 's9-juegos', verdad: bien >= 4 })
    await say(this, [
      this.doc(bien >= 5 ? 'Te acordás de casi todo, Jorge.' : bien >= 3 ? 'Te acordás de bastante, Jorge.' : 'Está bien, Jorge. Para eso vinimos.'),
      this.doc('De todo, menos de hoy.'),
      this.think('¿De hoy?'),
    ])
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
    await this.testAntes()
    await say(this, [this.doc('Bueno, contame.')])

    const extras = Phaser.Utils.Array.Shuffle([...EXTRAS]).slice(0, 2)
    for (const p of [...PRIMERAS, ...extras, ULTIMA]) await this.preguntar(p)
    await this.testDespues()

    await say(this, [this.doc('Bien. Gracias, Jorge.'), this.doc('Acompañame al cuarto de inducción al sueño.')])
    await this.irseVela()
  }

  // Vela se levanta y se va por la puerta del fondo; Jorge lo tiene que seguir
  private async irseVela() {
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
    if (this.sesion === 9) {
      await say(this, [this.doc('Es la última, Jorge.'), this.doc('Hoy vamos a hoy.'), this.doc('Acostate. Yo voy con vos.')])
      this.phase = 'camilla'
      this.goal.set('Acostarme en la camilla')
      return
    }
    if (this.sesion === 8) {
      await say(this, [this.doc('Hoy vas a ver a mucha gente, Jorge.'), this.doc('Y a alguien que te quiere.'), this.doc('Intentá escucharme. Acostate.')])
      this.phase = 'camilla'
      this.goal.set('Acostarme en la camilla')
      return
    }
    if (this.sesion === 7) {
      await say(this, [this.doc('Esta es la más difícil, Jorge.'), this.doc('No vas a tener que hacer nada. Solo estar.'), this.doc('Yo voy a estar con vos. Acostate.')])
      this.phase = 'camilla'
      this.goal.set('Acostarme en la camilla')
      return
    }
    if (this.sesion === 6) {
      await say(this, [this.doc('Hoy vas a ver a tu mamá, Jorge.'), this.doc('Mirala bien.'), this.doc('Acostate.')])
      this.phase = 'camilla'
      this.goal.set('Acostarme en la camilla')
      return
    }
    if (this.sesion === 5) {
      await say(this, [this.doc('Hoy vamos diez años más adelante.'), this.doc('Ya sos grande, Jorge. Casi como ahora.'), this.doc('Acostate.')])
      this.phase = 'camilla'
      this.goal.set('Acostarme en la camilla')
      return
    }
    if (this.sesion === 4) {
      await say(this, [this.doc('Hoy va a ser difícil, Jorge.'), this.doc('Voy a estar con vos todo el tiempo. Aunque no me escuches.'), this.doc('Acostate.')])
      this.phase = 'camilla'
      this.goal.set('Acostarme en la camilla')
      return
    }
    if (this.sesion === 3) {
      await say(this, [this.doc('Hoy no hay nada que buscar, Jorge.'), this.doc('Solo quiero que te acuerdes de algo lindo.'), this.doc('Acostate.')])
      this.phase = 'camilla'
      this.goal.set('Acostarme en la camilla')
      return
    }
    if (this.sesion === 2) {
      await say(this, [this.doc('Ya sabés cómo es.'), this.doc('Hoy vas a ser un poco más grande. Yo voy a estar con vos.'), this.doc('Acostate, Jorge.')])
      this.phase = 'camilla'
      this.goal.set('Acostarme en la camilla')
      return
    }
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
    if (this.sesion === 9) {
      // Pre-sesión 9: suelta termina acá; en el prototipo completo sigue el sueño de la Sesión 9, la última
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Pre-sesión 9' })
      else this.scene.start('Dream9')
      return
    }
    if (this.sesion === 8) {
      // Pre-sesión 8: suelta termina acá; en el prototipo completo sigue el sueño de la Sesión 8
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Pre-sesión 8' })
      else this.scene.start('Dream8')
      return
    }
    if (this.sesion === 7) {
      // Pre-sesión 7: suelta termina acá; en el prototipo completo sigue el sueño de la Sesión 7
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Pre-sesión 7' })
      else this.scene.start('Dream7')
      return
    }
    if (this.sesion === 6) {
      // Pre-sesión 6: suelta termina acá; en el prototipo completo sigue el sueño de la Sesión 6
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Pre-sesión 6' })
      else this.scene.start('Dream6')
      return
    }
    if (this.sesion === 5) {
      // Pre-sesión 5: suelta termina acá; en el prototipo completo sigue el sueño de la Sesión 5
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Pre-sesión 5' })
      else this.scene.start('Dream5')
      return
    }
    if (this.sesion === 4) {
      // Pre-sesión 4: suelta termina acá; en el prototipo completo sigue el sueño de la Sesión 4
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Pre-sesión 4' })
      else this.scene.start('Dream4')
      return
    }
    if (this.sesion === 3) {
      // Pre-sesión 3: suelta termina acá; en el prototipo completo sigue el sueño de la Sesión 3
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Pre-sesión 3' })
      else this.scene.start('Dream3')
      return
    }
    if (this.sesion === 2) {
      // Pre-sesión 2: suelta termina acá; en el prototipo completo sigue el sueño de la Sesión 2
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Pre-sesión 2' })
      else this.scene.start('Dream2')
      return
    }
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
    if (this.sesion === 8) {
      await say(this, [
        this.doc('Despacio. Ya estás acá.'),
        this.doc('Ella fue a buscarte, Jorge.'),
        this.think('Y yo la dejé en la vereda.'),
        this.doc('¿Lo creés? Lo que le dijiste.'),
        this.think('…'),
      ])
    } else if (this.sesion === 7) {
      await say(this, [
        this.doc('Despacio, Jorge. Ya estás acá.'),
        this.doc('Estuviste con ella. Hasta el final.'),
        this.think('Me dijo algo.'),
        this.think('Y no me acuerdo qué.'),
        this.doc('Te vas a acordar. Cuando puedas.'),
      ])
    } else if (this.sesion === 6) {
      await say(this, [
        this.doc('Despacio. Ya estás acá.'),
        this.doc('La viste, Jorge. Le viste la cara.'),
        this.think('Se reía.'),
        this.doc('Fue un buen viaje.'),
        this.think('Fue el último.'),
      ])
    } else if (this.sesion === 5) {
      await say(this, [
        this.doc('Despacio. Ya estás acá.'),
        this.doc('Estás empapado, Jorge. En el sueño, digo.'),
        this.think('Ella se fue una vez.'),
        this.think('Esa noche, el que se fue fui yo.'),
        this.doc('¿Y si esa vez no se fue de vos?'),
        this.think('…'),
      ])
    } else if (this.sesion === 4) {
      await say(this, [
        this.doc('Jorge. Jorge, mirame.'),
        this.doc('Ya estás acá.'),
        this.doc('Te hablé todo el tiempo. No me escuchabas.'),
        this.think('La empujé.'),
        this.think('Y nunca le pedí perdón.'),
        this.doc('Respirá. Lo que viste ya pasó.'),
        this.doc('Lo que hagas con eso, todavía no.'),
      ])
    } else if (this.sesion === 3) {
      await say(this, [
        this.doc('Despacio. Ya estás acá.'),
        this.doc('Hoy no tuve que cortar nada, Jorge.'),
        this.doc('Se te veía bien. Hacía mucho que no te veía así.'),
        this.think('La fiesta. La foto.'),
        this.think('María.'),
      ])
    } else if (this.sesion === 2) {
      await say(this, [
        this.doc('Despacio. Ya estás acá.'),
        this.doc('Lo vi en la pantalla, Jorge. Tu papá.'),
        this.think('No quiero hablar de eso.'),
        this.doc('No hace falta. Hoy no.'),
        this.doc('Pero también la vi a ella. A María.'),
        this.think('María…'),
      ])
    } else {
      await say(this, [
        this.doc('Despacio. Ya estás acá.'),
        this.doc('Lo vi todo en la pantalla: la feria, la calesita… tu mamá.'),
        this.think('Mi mamá.'),
        this.think('No le pude ver la cara.'),
        this.doc('Es normal. Los recuerdos vuelven de a poco.'),
      ])
    }
    this.machine.stop(1.5)
    sfx.handle()
    await this.tween({ targets: this.helmet, y: HELMET.up, duration: 2000, ease: 'Sine.InOut', onUpdate: () => this.drawCable() })
    sfx.click()
    toast(this, ['✎ Línea de tiempo: Infancia · La feria', '✎ Línea de tiempo: Adolescencia · El boletín', '✎ Línea de tiempo: Adolescencia · La fiesta', '✎ Línea de tiempo: Juventud · La pelea', '✎ Línea de tiempo: Los 30 · El reencuentro', '✎ Línea de tiempo: Adultez · El viaje del 12/08', '✎ Línea de tiempo: La pérdida · La muerte de mamá', '✎ Línea de tiempo: La pérdida · El velorio'][this.sesion - 1])
    await this.wait(800)
    await say(this, this.sesion === 7
      ? [this.doc('Por hoy alcanza, Jorge.'), this.doc('Andá a tu casa. Descansá.')]
      : [this.doc('Por hoy alcanza, Jorge.'), this.doc('La semana que viene seguimos.')])
    cam.fadeOut(2000, 0, 0, 0)
    this.tone?.stop(2)
    await new Promise((r) => cam.once('camerafadeoutcomplete', r))
    await this.wait(600)
    // Después de la Sesión 8: suelta termina acá; en el prototipo completo sigue La octava noche
    if (this.sesion === 8) {
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Sesión 8: El velorio' })
      else this.scene.start('Apartment', { noche: true, vuelta: 8 })
      return
    }
    // Después de la Sesión 7: suelta termina acá; en el prototipo completo sigue La séptima noche
    if (this.sesion === 7) {
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Sesión 7: La muerte de su mamá' })
      else this.scene.start('Apartment', { noche: true, vuelta: 7 })
      return
    }
    // Después de la Sesión 6: suelta termina acá; en el prototipo completo sigue La sexta noche
    if (this.sesion === 6) {
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Sesión 6: El viaje del 12/08' })
      else this.scene.start('Apartment', { noche: true, vuelta: 6 })
      return
    }
    // Después de la Sesión 5: suelta termina acá; en el prototipo completo sigue La quinta noche
    if (this.sesion === 5) {
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Sesión 5: El reencuentro' })
      else this.scene.start('Apartment', { noche: true, vuelta: 5 })
      return
    }
    // Después de la Sesión 4: suelta termina acá; en el prototipo completo sigue La cuarta noche
    if (this.sesion === 4) {
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Sesión 4: La pelea' })
      else this.scene.start('Apartment', { noche: true, vuelta: 4 })
      return
    }
    // Después de la Sesión 3: suelta termina acá; en el prototipo completo sigue La tercera noche
    if (this.sesion === 3) {
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Sesión 3: La fiesta' })
      else this.scene.start('Apartment', { noche: true, vuelta: 3 })
      return
    }
    // Después de la Sesión 2: suelta termina acá; en el prototipo completo sigue La segunda noche
    if (this.sesion === 2) {
      if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Sesión 2: El boletín' })
      else this.scene.start('Apartment', { noche: true, vuelta: 2 })
      return
    }
    // Jugando la Sesión 1 suelta, termina acá; en el prototipo completo Jorge vuelve a su casa
    if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Sesión 1: La feria' })
    else this.scene.start('Apartment', { noche: true })
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

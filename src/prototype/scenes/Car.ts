import * as Phaser from 'phaser'
import { addVignette, C } from '../art'
import { startCity, startRadio, sfx } from '../audio'
import { state } from '../state'
import { choose, say, text, type Line } from '../ui'

// Cinemática del auto con diálogo de opciones. Las respuestas no cambian la historia:
// solo la última decide si suena la radio o viajan en silencio.

const CAR_X = 560
const CAR_Y = 560

interface Step {
  pregunta: string
  opciones: { jorge: string | null; label: string; respuesta: string }[]
}

const DIALOGO: Step[] = [
  {
    pregunta: 'Buen día. ¿Todo bien? Tardó un poco en bajar.',
    opciones: [
      { label: '"Perdón, no encontraba la llave."', jorge: 'Perdón, no encontraba la llave.', respuesta: 'Le pasa a cualquiera. Vamos, que llegamos justo.' },
      { label: '"Sí, todo bien."', jorge: 'Sí, todo bien.', respuesta: 'Me alegro. Vamos, que llegamos justo.' },
      { label: '(Quedarse callado)', jorge: null, respuesta: 'Bueno… vamos, que llegamos justo.' },
    ],
  },
  {
    pregunta: '¿Es la primera vez que va a Neural?',
    opciones: [
      { label: '"Creo que no… no me acuerdo."', jorge: 'Creo que no… no me acuerdo.', respuesta: 'Ah… claro. Perdón, no quise incomodarlo.' },
      { label: '"¿Usted me llevó otras veces?"', jorge: '¿Usted me llevó otras veces?', respuesta: 'Llevo a tanta gente que ya ni sé. Puede ser.' },
      { label: '"Prefiero no hablar."', jorge: 'Prefiero no hablar.', respuesta: 'Como quiera.' },
    ],
  },
]

export class Car extends Phaser.Scene {
  private speed = 6
  private layers: { objs: Phaser.GameObjects.GameObject[]; factor: number }[] = []
  private wheels: Phaser.GameObjects.Graphics[] = []
  private neural?: Phaser.GameObjects.Container
  private arriving = false

  constructor() {
    super('Car')
  }

  create() {
    this.speed = 6
    this.arriving = false
    this.layers = []
    this.wheels = []
    this.cameras.main.setBackgroundColor('#141824')
    this.drawCity()
    this.drawCar()
    addVignette(this, 0.7)

    const city = startCity()
    let radio: { stop: () => void } | null = null
    const drone = this.registry.get('drone') as { stop: (f?: number) => void } | undefined
    drone?.stop(6)
    this.events.once('shutdown', () => {
      city.stop(1)
      radio?.stop()
    })

    // En una pantalla angosta (el celular en vertical), la cámara se centra en el auto
    if (this.scale.width < 1280) this.cameras.main.centerOn(CAR_X, 360)
    this.cameras.main.fadeIn(1500, 0, 0, 0)
    sfx.door()

    void (async () => {
      await this.wait(2200)
      for (const step of DIALOGO) {
        await say(this, [this.chofer(step.pregunta)])
        const i = await choose(this, step.opciones.map((o) => o.label), { x: 840, y: 700 })
        const o = step.opciones[i]
        if (o.jorge) await say(this, [this.jorge(o.jorge)])
        await say(this, [this.chofer(o.respuesta)])
        await this.wait(600)
      }
      await say(this, [this.chofer('¿Le molesta si pongo un poco de música?')])
      const r = await choose(this, ['"Dale, poné."', '"Prefiero silencio."'], { x: 840, y: 700 })
      await say(this, [this.jorge(r === 0 ? 'Dale, poné.' : 'Prefiero silencio.')])
      state.radio = r === 0
      if (state.radio) {
        await this.wait(400)
        radio = startRadio()
      }
      await this.wait(5000)
      this.arrive()
      await this.wait(7000)
      radio?.stop()
      city.stop(3)
      this.cameras.main.fadeOut(3500, 0, 0, 0)
      // Jugando la Casa de Jorge suelta, termina acá; en el prototipo completo sigue al Hall del edificio
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.registry.get('solo')) this.scene.start('LevelEnd', { titulo: 'Fin de la locación', locacion: 'Casa de Jorge' })
        else this.scene.start('Neural')
      })
    })()
  }

  private wait(ms: number) {
    return new Promise<void>((r) => this.time.delayedCall(ms, r))
  }

  private chofer = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: CAR_X + 120, y: CAR_Y - 120 }) })
  private jorge = (t: string): Line => ({ kind: 'speech', text: t, anchor: () => ({ x: CAR_X - 50, y: CAR_Y - 118 }) })

  private drawCity() {
    // Cielo nublado de mañana
    const sky = this.add.graphics()
    sky.fillGradientStyle(0x2a3348, 0x2a3348, 0x4a5568, 0x4a5568, 1).fillRect(0, 0, 1280, 720)

    const far: Phaser.GameObjects.GameObject[] = []
    const near: Phaser.GameObjects.GameObject[] = []
    for (let x = 0; x < 1280 + 400; x += 140) {
      const h = Phaser.Math.Between(180, 340)
      far.push(this.add.rectangle(x, 470, 120, h, 0x262d3d).setOrigin(0, 1))
    }
    for (let x = 0; x < 1280 + 400; x += 230) {
      const h = Phaser.Math.Between(220, 380)
      const b = this.add.container(x, 520)
      b.add(this.add.rectangle(0, 0, 200, h, 0x1c212d).setOrigin(0, 1))
      for (let wy = -h + 20; wy < -30; wy += 40) {
        for (let wx = 20; wx < 180; wx += 40) {
          const lit = Math.random() < 0.25
          b.add(this.add.rectangle(wx, wy, 18, 22, lit ? 0xd9c27a : 0x2a3140, lit ? 0.7 : 1).setOrigin(0))
        }
      }
      near.push(b)
    }
    this.layers.push({ objs: far, factor: 0.2 }, { objs: near, factor: 0.55 })

    // Calle con líneas que pasan
    this.add.rectangle(0, 520, 1280, 200, 0x22252c).setOrigin(0)
    this.add.rectangle(0, 520, 1280, 8, 0x3a3e48).setOrigin(0)
    const lines: Phaser.GameObjects.GameObject[] = []
    for (let x = 0; x < 1280 + 200; x += 160) lines.push(this.add.rectangle(x, 650, 80, 6, 0xcfc9a8, 0.7).setOrigin(0))
    this.layers.push({ objs: lines, factor: 1 })
  }

  private drawCar() {
    const g = this.add.graphics().setDepth(5)
    const x = CAR_X
    const y = CAR_Y
    // Carrocería
    g.fillStyle(0x2c3e5a)
    g.fillRoundedRect(x - 230, y - 60, 460, 80, 22)
    g.fillPoints([
      new Phaser.Math.Vector2(x - 150, y - 60), new Phaser.Math.Vector2(x - 110, y - 140),
      new Phaser.Math.Vector2(x + 120, y - 140), new Phaser.Math.Vector2(x + 175, y - 60),
    ], true)
    // Interior oscuro
    g.fillStyle(0x151b26)
    g.fillPoints([
      new Phaser.Math.Vector2(x - 135, y - 66), new Phaser.Math.Vector2(x - 102, y - 130),
      new Phaser.Math.Vector2(x + 112, y - 130), new Phaser.Math.Vector2(x + 160, y - 66),
    ], true)
    // Ventanillas (vidrio por encima de los pasajeros)
    const glass = this.add.graphics().setDepth(7)
    glass.fillStyle(0x9fb4c8, 0.18)
    glass.lineStyle(6, 0x2c3e5a).lineBetween(x, y - 132, x, y - 64)
    glass.fillPoints([
      new Phaser.Math.Vector2(x - 135, y - 66), new Phaser.Math.Vector2(x - 102, y - 130),
      new Phaser.Math.Vector2(x - 5, y - 130), new Phaser.Math.Vector2(x - 5, y - 66),
    ], true)
    glass.fillPoints([
      new Phaser.Math.Vector2(x + 5, y - 66), new Phaser.Math.Vector2(x + 5, y - 130),
      new Phaser.Math.Vector2(x + 112, y - 130), new Phaser.Math.Vector2(x + 160, y - 66),
    ], true)
    // Jorge atrás, mirando por la ventanilla
    const pj = this.add.graphics().setDepth(6)
    pj.fillStyle(C.sweater).fillRoundedRect(x - 80, y - 82, 50, 40, 10)
    pj.fillStyle(C.skin).fillCircle(x - 52, y - 100, 15)
    pj.fillStyle(C.hair).slice(x - 53, y - 103, 16, Math.PI, Math.PI * 2, false).fillPath()
    pj.fillStyle(C.ink).fillCircle(x - 44, y - 101, 2)
    // Chofer adelante
    pj.fillStyle(0x3b3b44).fillRoundedRect(x + 50, y - 82, 50, 40, 10)
    pj.fillStyle(0xd8b08a).fillCircle(x + 78, y - 100, 15)
    pj.fillStyle(0x222228).fillRect(x + 60, y - 120, 36, 9).fillRect(x + 84, y - 114, 18, 4)
    // Detalles
    g.fillStyle(0xf2e6b0).fillRoundedRect(x + 212, y - 40, 18, 14, 4)
    g.fillStyle(0xb03030).fillRoundedRect(x - 230, y - 40, 12, 14, 3)
    g.lineStyle(2, 0x1f2c40).lineBetween(x, y - 60, x, y + 10)

    for (const wx of [x - 140, x + 140]) {
      const w = this.add.graphics({ x: wx, y: y + 22 }).setDepth(6)
      w.fillStyle(0x111111).fillCircle(0, 0, 34)
      w.fillStyle(0x777b84).fillCircle(0, 0, 16)
      w.lineStyle(3, 0x333333).lineBetween(-16, 0, 16, 0).lineBetween(0, -16, 0, 16)
      this.wheels.push(w)
    }
  }

  private arrive() {
    this.arriving = true
    // Edificio de Neural que entra por la derecha
    const b = this.add.container(1500, 520).setDepth(3)
    b.add(this.add.rectangle(0, 0, 420, 420, 0xd9dde5).setOrigin(0, 1))
    b.add(this.add.rectangle(0, -420, 420, 12, 0xb9c0cc).setOrigin(0, 0))
    for (let wy = -380; wy < -80; wy += 60) b.add(this.add.rectangle(30, wy, 360, 34, 0x9fb7d8, 0.8).setOrigin(0))
    b.add(this.add.rectangle(160, 0, 100, 70, 0x4c7bd1, 0.6).setOrigin(0, 1))
    const sign = text(this, 210, -440, 'NEURAL', 46, '#4c7bd1', { fontStyle: 'bold' }).setOrigin(0.5, 1)
    b.add(sign)
    this.tweens.add({ targets: sign, alpha: 0.6, yoyo: true, repeat: -1, duration: 1200 })
    this.neural = b
  }

  update(_time: number, delta: number) {
    const f = Math.min(delta, 100) / (1000 / 60)
    if (this.arriving) {
      this.speed = Math.max(0, this.speed - 0.012 * f)
      if (this.neural && this.neural.x > 640) this.neural.x -= this.speed * 0.55 * f
    }
    for (const layer of this.layers) {
      for (const o of layer.objs) {
        const go = o as unknown as Phaser.GameObjects.Components.Transform
        go.x -= this.speed * layer.factor * f
        if (go.x < -260) go.x += 1280 + 400
      }
    }
    for (const w of this.wheels) w.rotation += this.speed * 0.02 * f
  }
}

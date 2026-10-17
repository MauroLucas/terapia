import * as Phaser from 'phaser'
import { addVignette, FONT, makeTextures } from '../art'
import { sfx, startRoomTone } from '../audio'
import { say, type Line } from '../ui'
import { openDiary } from './diary'

// Consultorio (locación 3), primera parte: el pasillo de los consultorios.
//   [ascensor] [1] ▢▢ [2] ▢▢ [3] ▢▢ [4] ▢▢ [5: Dr. Vela]
// Un pasillo largo con ventanales a la ciudad. Cada puerta tiene su placa y hay que encontrar la del doctor Vela,
// que es la última. Jorge no dice nada hasta llegar. Al entrar funde a negro: el consultorio todavía no está diseñado.
// No usa física: todo se mueve con `delta`, igual a cualquier FPS.

const W = 4500
const FLOOR = 600
const FEET = FLOOR - 70 // centro de Jorge parado
const WALK = 204 // px/s, igual que en las otras locaciones
const WIN = { top: 110, bottom: 430, w: 290 }

// Los nombres de los otros doctores son provisorios
const DOORS = [
  { x: 560, name: 'Dra. Ibarra' },
  { x: 1460, name: 'Dr. Quiroga' },
  { x: 2360, name: 'Dra. Salas' },
  { x: 3260, name: 'Dr. Montes' },
  { x: 4160, name: 'Dr. Vela' },
]
const VELA = DOORS.length - 1
// Dos ventanales entre puerta y puerta
const WINDOWS = DOORS.slice(0, -1).flatMap((d) => [d.x + 150, d.x + 470])

export class Corridor extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private busy = true
  private leaving = false
  private lockUntil = 0
  private facing = 1
  private walkDist = 0
  private stepDist = 0
  private prompt!: Phaser.GameObjects.Container
  private promptLabel!: Phaser.GameObjects.Text
  private tone?: { stop: (fade?: number) => void }

  constructor() {
    super('Corridor')
  }

  create() {
    this.busy = true
    this.leaving = false
    this.facing = 1
    makeTextures(this)
    this.cameras.main.setBackgroundColor('#a9c0dc')
    this.drawCity()
    this.drawCorridor()

    this.player = this.add.image(230, FEET, 'jorge0').setDepth(10)
    const box = this.add.graphics()
    box.fillStyle(0xf6f3ea).fillRoundedRect(-16, -16, 32, 32, 7)
    box.lineStyle(2, 0x111111).strokeRoundedRect(-16, -16, 32, 32, 7)
    const key = this.add.text(0, 0, 'E', { fontFamily: FONT, fontSize: '18px', color: '#111', fontStyle: 'bold', resolution: 2 }).setOrigin(0.5)
    this.promptLabel = this.add.text(0, 26, '', { fontFamily: FONT, fontSize: '14px', color: '#d8dce6', resolution: 2, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0)
    this.prompt = this.add.container(0, 0, [box, key, this.promptLabel]).setDepth(800).setVisible(false)
    this.tweens.add({ targets: this.prompt, scale: 1.08, yoyo: true, repeat: -1, duration: 600 })
    addVignette(this, 0.45)

    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,A,D,E,SPACE,TAB,ESC') as Record<string, Phaser.Input.Keyboard.Key>
    const cam = this.cameras.main
    cam.setBounds(0, 0, W, 720)
    cam.startFollow(this.player, true, 0.08, 0.08)
    cam.centerOn(this.player.x, 360)
    this.tone = startRoomTone()
    this.events.once('shutdown', () => this.tone?.stop(0.5))
    cam.fadeIn(1500, 0, 0, 0)
    this.time.delayedCall(1500, () => (this.busy = false))
    // Solo en desarrollo: acceso para pruebas automáticas
    if (import.meta.env.DEV) (window as unknown as { __corridor?: Corridor }).__corridor = this
  }

  // ---------- Escenario ----------

  // La ciudad vista desde arriba: dos capas de edificios que casi no se mueven al caminar
  private drawCity() {
    const layers = [
      { factor: 0.1, color: 0x93a8c2, base: 300, step: 97 },
      { factor: 0.24, color: 0x74879f, base: 350, step: 131 },
    ]
    for (const l of layers) {
      const g = this.add.graphics().setScrollFactor(l.factor, 1)
      const width = 1280 + W * l.factor
      let x = -20
      for (let i = 0; x < width; i++) {
        const bw = 60 + ((i * l.step) % 90)
        const top = l.base + ((i * l.step * 7) % 110)
        g.fillStyle(l.color).fillRect(x, top, bw, WIN.bottom - top + 10)
        g.fillStyle(0xdfe8f3, 0.25)
        for (let wy = top + 14; wy < WIN.bottom - 10; wy += 22) {
          for (let wx = x + 10; wx < x + bw - 12; wx += 18) if ((wx + wy + i) % 3 !== 0) g.fillRect(wx, wy, 7, 10)
        }
        x += bw + 6
      }
    }
  }

  private label(x: number, y: number, str: string, size = 12, color = '#5a6172') {
    return this.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 2 }).setOrigin(0.5)
  }

  private drawCorridor() {
    const g = this.add.graphics()
    // La pared se dibuja alrededor de los ventanales, para que la ciudad se vea por detrás
    g.fillStyle(0x464e5d).fillRect(0, 0, W, WIN.top).fillRect(0, WIN.bottom, W, FLOOR - WIN.bottom)
    let from = 0
    for (const wx of WINDOWS) {
      g.fillRect(from, WIN.top, wx - from, WIN.bottom - WIN.top)
      from = wx + WIN.w
    }
    g.fillRect(from, WIN.top, W - from, WIN.bottom - WIN.top)
    g.fillStyle(0x363d4a).fillRect(0, 0, W, 60)
    g.fillStyle(0x23272f).fillRect(0, FLOOR, W, 120)
    g.fillStyle(0x4c7bd1, 0.5).fillRect(0, FLOOR - 6, W, 6)
    g.lineStyle(1, 0x2e333d)
    for (let lx = 0; lx < W; lx += 160) g.lineBetween(lx, FLOOR, lx + 40, 720)
    for (let lx = 200; lx < W; lx += 450) g.fillStyle(0xf1efe8, 0.8).fillRect(lx, 56, 120, 6)

    // Ventanales: vidrio, marco y la luz que entra sobre el piso
    for (const wx of WINDOWS) {
      g.fillStyle(0xdfe8f3, 0.1).fillRect(wx, WIN.top, WIN.w, WIN.bottom - WIN.top)
      g.lineStyle(5, 0x2b313c).strokeRect(wx, WIN.top, WIN.w, WIN.bottom - WIN.top)
      g.lineStyle(3, 0x2b313c).lineBetween(wx + WIN.w / 2, WIN.top, wx + WIN.w / 2, WIN.bottom)
      this.add.polygon(0, 0, [wx, WIN.bottom, wx + WIN.w, WIN.bottom, wx + WIN.w + 110, FLOOR, wx - 110, FLOOR], 0xdfe8f3, 0.07).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD)
      this.add.polygon(0, 0, [wx - 110, FLOOR, wx + WIN.w + 110, FLOOR, wx + WIN.w + 150, 720, wx - 150, 720], 0xdfe8f3, 0.05).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD)
    }

    // Ascensor por el que llegó Jorge
    g.fillStyle(0x1a1d24).fillRect(70, 372, 140, 228)
    g.fillStyle(0x8d9197).fillRect(78, 380, 60, 220).fillRect(142, 380, 60, 220)
    g.fillStyle(0x2b313c).fillRect(222, 470, 14, 22)
    g.fillStyle(0xe0a23a).fillCircle(229, 481, 3)
    this.label(140, 358, 'ASCENSOR')

    // Consultorios: todas las puertas iguales, cada una con su placa
    DOORS.forEach((d, i) => {
      g.fillStyle(0x1a1d24).fillRect(d.x - 53, 402, 106, 198)
      g.fillStyle(0x5b6474).fillRect(d.x - 45, 410, 90, 190)
      g.fillStyle(0xc9ced8).fillCircle(d.x + 31, 510, 5)
      g.fillStyle(0xd9dde5).fillRoundedRect(d.x - 70, 340, 140, 46, 4)
      g.fillStyle(0x4c7bd1).fillRect(d.x - 70, 340, 140, 5)
      this.label(d.x, 356, `CONSULTORIO ${i + 1}`, 10, '#5a6172')
      this.label(d.x, 372, d.name, 16, '#1c2028')
    })

    // Plantas y fin del pasillo
    for (const px of [360, 1260, 2160, 3060, 3960]) {
      g.fillStyle(0x6b6f78).fillRect(px - 16, 550, 32, 50)
      g.fillStyle(0x3f6b45).fillEllipse(px, 510, 54, 90).fillEllipse(px - 18, 530, 30, 60).fillEllipse(px + 18, 530, 30, 60)
    }
    g.fillStyle(0x2f3541).fillRect(W - 40, 60, 40, FLOOR - 60)
  }

  // ---------- Puertas ----------

  private think = (t: string): Line => ({ kind: 'thought', text: t, anchor: () => ({ x: this.player.x + 6 * this.facing, y: this.player.y - 70 }) })

  private async door(i: number) {
    if (i !== VELA) {
      // No es el suyo: está cerrado. Jorge no dice nada.
      sfx.handle()
      await new Promise<void>((r) => this.time.delayedCall(350, r))
      return
    }
    await say(this, [this.think('Bueno, acá estoy…')])
    this.leaving = true
    sfx.door()
    const cam = this.cameras.main
    cam.fadeOut(1800, 0, 0, 0)
    cam.once('camerafadeoutcomplete', () =>
      this.scene.start('LevelEnd', { titulo: this.registry.get('solo') ? 'Fin de la locación' : 'Fin del prototipo', locacion: 'Consultorio' }),
    )
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
    const k = this.keys
    const ePressed = Phaser.Input.Keyboard.JustDown(k.E)
    const tabPressed = Phaser.Input.Keyboard.JustDown(k.TAB)
    if (this.busy || time < this.lockUntil) return

    if (tabPressed) {
      void this.run(() => openDiary(this))
      return
    }

    const dir = (k.LEFT.isDown || k.A.isDown ? -1 : 0) + (k.RIGHT.isDown || k.D.isDown ? 1 : 0)
    if (dir !== 0) {
      const from = this.player.x
      this.player.x = Phaser.Math.Clamp(from + dir * WALK * (Math.min(delta, 100) / 1000), 250, W - 90)
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

    const i = DOORS.findIndex((d) => Math.abs(this.player.x - d.x) < 70)
    if (i >= 0) {
      this.prompt.setVisible(true).setPosition(DOORS[i].x, 288)
      this.promptLabel.setText('Puerta')
      if (ePressed) void this.run(() => this.door(i))
    } else {
      this.prompt.setVisible(false)
    }
  }
}

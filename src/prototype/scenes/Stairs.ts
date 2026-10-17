import * as Phaser from 'phaser'
import { addVignette, FONT } from '../art'
import { sfx, startDrone } from '../audio'

// Secuencia de títulos: Jorge baja 5 pisos y aparecen "TERAPIA" y "Creado por Mauro Pereyra".
// Jorge sigue un recorrido fijo (zigzag de escaleras). → / ↓ bajar, ← / ↑ volver.

const H = 220
const Y0 = 300
const ys = [0, 1, 2, 3, 4, 5].map((i) => Y0 + i * H)
const LABELS = ['5', '4', '3', '2', '1', 'PB']

// Recorrido: rellano, tramo, rellano, tramo... hasta la puerta de planta baja
const PATH: [number, number][] = [
  [150, ys[0]], [320, ys[0]],
  [960, ys[1]], [1100, ys[1]],
  [460, ys[2]], [320, ys[2]],
  [960, ys[3]], [1100, ys[3]],
  [460, ys[4]], [320, ys[4]],
  [960, ys[5]], [1170, ys[5]],
]

// Títulos al entrar a ciertos tramos (4.º → 3.º y 2.º → 1.º)
const TITLES: Record<number, { text: string; size: number }> = {
  3: { text: 'TERAPIA', size: 110 },
  7: { text: 'Creado por Mauro Pereyra', size: 40 },
}

export class Stairs extends Phaser.Scene {
  private jorge!: Phaser.GameObjects.Image
  private s = 0
  private lengths: number[] = []
  private total = 0
  private shown = new Set<number>()
  private walk = 0
  private step = 0
  private done = false
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private drone?: { stop: (fade?: number) => void }

  constructor() {
    super('Stairs')
  }

  create() {
    this.s = 0
    this.done = false
    this.shown.clear()
    this.lengths = []
    for (let i = 0; i < PATH.length - 1; i++) {
      this.lengths.push(Phaser.Math.Distance.Between(...PATH[i], ...PATH[i + 1]))
    }
    this.total = this.lengths.reduce((a, b) => a + b, 0)

    this.drawBuilding()
    this.jorge = this.add.image(PATH[0][0], PATH[0][1], 'jorge0').setOrigin(0.5, 1).setDepth(10)
    addVignette(this, 0.85)

    const cam = this.cameras.main
    cam.setBounds(0, 0, 1280, ys[5] + 200)
    cam.setBackgroundColor('#08090c')
    cam.startFollow(this.jorge, true, 0.06, 0.06, 0, 60)
    cam.fadeIn(1200, 0, 0, 0)
    sfx.door()
    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S') as Record<string, Phaser.Input.Keyboard.Key>
  }

  private drawBuilding() {
    const g = this.add.graphics()
    // Pared del hueco de escalera
    g.fillStyle(0x1d2029).fillRect(60, ys[0] - 250, 1160, ys[5] - ys[0] + 290)
    g.fillStyle(0x23262f)
    for (let i = 0; i < 6; i++) g.fillRect(60, ys[i] - 250 + 40, 1160, 6)

    const steps = (x1: number, y1: number, x2: number, y2: number) => {
      const n = 14
      const dx = (x2 - x1) / n
      const dy = (y2 - y1) / n
      // Zanca (estructura del tramo)
      g.fillStyle(0x15171d)
      g.fillPoints([
        new Phaser.Math.Vector2(x1, y1), new Phaser.Math.Vector2(x2, y2),
        new Phaser.Math.Vector2(x2, y2 + 30), new Phaser.Math.Vector2(x1, y1 + 30),
      ], true)
      g.fillStyle(0x4a4f5c)
      for (let i = 0; i < n; i++) {
        const x = x1 + dx * i
        const y = y1 + dy * i
        g.fillRect(Math.min(x, x + dx), y, Math.abs(dx), dy + 2)
      }
      // Baranda
      g.lineStyle(3, 0x6b707c)
      g.lineBetween(x1, y1 - 70, x2, y2 - 70)
      for (let i = 0; i <= n; i += 2) g.lineBetween(x1 + dx * i, y1 + dy * i - 70, x1 + dx * i, y1 + dy * i)
    }
    const landing = (x1: number, x2: number, y: number) => {
      g.fillStyle(0x3d414c).fillRect(x1, y, x2 - x1, 16)
      g.fillStyle(0x15171d).fillRect(x1, y + 16, x2 - x1, 14)
    }

    landing(80, 330, ys[0])
    for (let i = 0; i < 5; i++) {
      const down = i % 2 === 0
      if (down) steps(320, ys[i], 960, ys[i + 1])
      else steps(1100, ys[i], 460, ys[i + 1])
      if (down) landing(950, 1200, ys[i + 1])
      else landing(80, 470, ys[i + 1])
    }

    // Número de piso pintado en la pared, puertas de departamentos
    for (let i = 0; i < 6; i++) {
      const left = i % 2 === 0
      const x = left ? 200 : 1080
      if (i < 5) {
        g.fillStyle(0x3a2a20).fillRect(x - 40, ys[i] - 150, 70, 150)
        g.fillStyle(0xc9b46a).fillCircle(x + 20, ys[i] - 75, 4)
      }
      this.add.text(left ? 110 : 1150, ys[i] - 200, LABELS[i], { fontFamily: FONT, fontSize: '54px', color: '#3b404d', fontStyle: 'bold', resolution: 2 }).setOrigin(0.5)
    }
    // Puerta del edificio con luz de la calle
    g.fillStyle(0xd8e2f0, 0.25).fillRect(1180, ys[5] - 170, 40, 170)
    const glow = this.add.rectangle(1160, ys[5] - 85, 120, 200, 0xbfd2f0, 0.12).setBlendMode(Phaser.BlendModes.ADD)
    this.tweens.add({ targets: glow, alpha: 0.05, yoyo: true, repeat: -1, duration: 1800 })
    // Lámparas de cada piso
    for (let i = 0; i < 6; i++) {
      const lx = i % 2 === 0 ? 640 : 700
      g.fillStyle(0xe8dcb0).fillCircle(lx, ys[i] - 200, 6)
      const l = this.add.circle(lx, ys[i] - 200, 160, 0xf0e2b0, 0.05).setBlendMode(Phaser.BlendModes.ADD)
      if (i === 2) this.tweens.add({ targets: l, alpha: 0, yoyo: true, repeat: -1, duration: 90, repeatDelay: 2600 })
    }
  }

  // Posición y segmento a partir de la distancia recorrida
  private at(s: number) {
    let rest = Phaser.Math.Clamp(s, 0, this.total)
    for (let i = 0; i < this.lengths.length; i++) {
      if (rest <= this.lengths[i] || i === this.lengths.length - 1) {
        const t = this.lengths[i] ? rest / this.lengths[i] : 0
        const [x1, y1] = PATH[i]
        const [x2, y2] = PATH[i + 1]
        return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, seg: i }
      }
      rest -= this.lengths[i]
    }
    return { x: PATH[0][0], y: PATH[0][1], seg: 0 }
  }

  private segDir(s: number) {
    const { seg } = this.at(Phaser.Math.Clamp(s, 0.01, this.total - 0.01))
    return Math.sign(PATH[seg + 1][0] - PATH[seg][0])
  }

  private showTitle(i: number) {
    const t = TITLES[i]
    const { width, height } = this.scale
    const title = this.add
      .text(width / 2, height * 0.32, t.text, {
        fontFamily: FONT,
        fontSize: `${t.size}px`,
        color: '#e9ecf2',
        fontStyle: i === 3 ? 'bold' : 'normal',
        resolution: 2,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(950)
      .setAlpha(0)
    if (i === 3) {
      title.setLetterSpacing(28)
      this.drone = startDrone()
      this.registry.set('drone', this.drone)
    }
    this.tweens.chain({
      targets: title,
      tweens: [
        { alpha: 1, duration: 2500 },
        { alpha: 1, duration: 3000 },
        { alpha: 0, duration: 2500, onComplete: () => title.destroy() },
      ],
    })
  }

  update(_time: number, dt: number) {
    if (this.done) return
    const k = this.keys
    const right = k.RIGHT.isDown || k.D.isDown
    const left = k.LEFT.isDown || k.A.isDown
    const down = k.DOWN.isDown || k.S.isDown
    const up = k.UP.isDown || k.W.isDown
    const speed = (170 * Math.min(dt, 100)) / 1000
    const fwd = this.segDir(this.s + 0.5)
    const back = this.segDir(this.s - 0.5)
    let delta = 0
    if (down || (right && fwd > 0) || (left && fwd < 0)) delta = speed
    else if (up || (left && back > 0) || (right && back < 0)) delta = -speed
    this.s = Phaser.Math.Clamp(this.s + delta, 0, this.total)

    const p = this.at(this.s)
    this.jorge.setPosition(p.x, p.y + 2)
    if (delta !== 0) {
      const moveDir = delta > 0 ? fwd : -back
      if (moveDir !== 0) this.jorge.setFlipX(moveDir < 0)
      this.walk += speed
      this.step += speed
      this.jorge.setTexture(Math.floor(this.walk / 20) % 2 === 0 ? 'jorge1' : 'jorge2')
      if (this.step > 34) {
        this.step = 0
        sfx.step()
      }
    } else {
      this.jorge.setTexture('jorge0')
    }

    if (TITLES[p.seg] && !this.shown.has(p.seg)) {
      this.shown.add(p.seg)
      this.showTitle(p.seg)
    }

    if (this.s >= this.total - 1) {
      this.done = true
      sfx.door()
      this.cameras.main.fadeOut(1500, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Car'))
    }
  }
}

import * as Phaser from 'phaser'
import { sfx } from './audio'
import { FONT, HAND_FONT } from './art'

// Globos de cómic, lectura de documentos y opciones de diálogo.

export type BubbleKind = 'thought' | 'speech' | 'intercom'
export type Point = { x: number; y: number }

export interface Line {
  kind: BubbleKind
  text: string
  anchor: () => Point
}

const ADVANCE = ['Space', 'KeyE', 'Enter', 'NumpadEnter']
const UI_DEPTH = 1000

export function text(scene: Phaser.Scene, x: number, y: number, str: string, size: number, color = '#e8e8e8', extra: Phaser.Types.GameObjects.Text.TextStyle = {}) {
  return scene.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 2, ...extra })
}

function onKey(scene: Phaser.Scene, handler: (code: string) => void) {
  const kb = scene.input.keyboard!
  const h = (e: KeyboardEvent) => handler(e.code)
  kb.on('keydown', h)
  return () => kb.off('keydown', h)
}

function jagged(g: Phaser.GameObjects.Graphics, w: number, h: number) {
  const pts: Phaser.Math.Vector2[] = []
  const step = 14
  const amp = 6
  const edge = (x1: number, y1: number, x2: number, y2: number, nx: number, ny: number) => {
    const len = Math.hypot(x2 - x1, y2 - y1)
    const n = Math.max(2, Math.round(len / step))
    for (let i = 0; i < n; i++) {
      const t = i / n
      const o = i % 2 === 0 ? amp : -amp / 2
      pts.push(new Phaser.Math.Vector2(x1 + (x2 - x1) * t + nx * o, y1 + (y2 - y1) * t + ny * o))
    }
  }
  const hw = w / 2
  const hh = h / 2
  edge(-hw, -hh, hw, -hh, 0, -1)
  edge(hw, -hh, hw, hh, 1, 0)
  edge(hw, hh, -hw, hh, 0, 1)
  edge(-hw, hh, -hw, -hh, -1, 0)
  g.fillPoints(pts, true)
  g.strokePoints(pts, true)
}

// Muestra un globo con efecto máquina de escribir. Se resuelve cuando el jugador avanza.
export function bubble(scene: Phaser.Scene, line: Line): Promise<void> {
  return new Promise((resolve) => {
    const anchor = line.anchor()
    const color = line.kind === 'thought' ? '#2b2f38' : '#151515'
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: line.kind === 'thought' ? HAND_FONT : FONT,
      fontSize: line.kind === 'thought' ? '21px' : '22px',
      color,
      align: 'center',
      wordWrap: { width: 360, useAdvancedWrap: true },
      resolution: 2,
    }
    if (line.kind === 'thought') style.fontStyle = 'italic'
    const t = scene.add.text(0, 0, line.text, style).setOrigin(0.5)
    const w = Math.max(90, t.width + 44)
    const h = t.height + 34
    t.setText('')

    const view = scene.cameras.main.worldView
    const lift = line.kind === 'thought' ? 64 : 40
    const cx = Phaser.Math.Clamp(anchor.x, view.left + w / 2 + 14, view.right - w / 2 - 14)
    const cy = Math.max(view.top + h / 2 + 14, anchor.y - lift - h / 2)

    const g = scene.add.graphics()
    const ax = anchor.x - cx
    const ay = anchor.y - cy
    const bottom = h / 2

    if (line.kind === 'thought') {
      g.fillStyle(0xdfe3ea, 0.95)
      g.lineStyle(2, 0x4a5060, 0.9)
      g.fillRoundedRect(-w / 2, -h / 2, w, h, Math.min(h / 2, 28))
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, Math.min(h / 2, 28))
      // Burbujitas hacia la cabeza
      const dirX = Phaser.Math.Clamp(ax, -w / 2 + 20, w / 2 - 20)
      const steps: [number, number][] = [[0.25, 9], [0.55, 6], [0.8, 4]]
      for (const [k, r] of steps) {
        const bx = dirX * (1 - k) + ax * k * 0.6
        const by = bottom + (ay - bottom) * k * 0.7
        g.fillCircle(bx, by, r)
        g.strokeCircle(bx, by, r)
      }
    } else if (line.kind === 'speech') {
      g.fillStyle(0xf6f3ea)
      g.lineStyle(3, 0x111111)
      const tx = Phaser.Math.Clamp(ax, -w / 2 + 22, w / 2 - 22)
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 16)
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16)
      g.fillTriangle(tx - 10, bottom - 2, tx + 10, bottom - 2, ax * 0.5 + tx * 0.5, ay - 6)
      g.lineBetween(tx - 10, bottom, ax * 0.5 + tx * 0.5, ay - 6)
      g.lineBetween(tx + 10, bottom, ax * 0.5 + tx * 0.5, ay - 6)
    } else {
      // Portero eléctrico: borde dentado y rayo hacia el aparato
      g.fillStyle(0xf2f0d8)
      g.lineStyle(3, 0x111111)
      jagged(g, w, h)
      const tx = Phaser.Math.Clamp(ax, -w / 2 + 22, w / 2 - 22)
      g.lineStyle(3, 0x111111)
      g.beginPath()
      g.moveTo(tx, bottom + 4)
      g.lineTo(tx + (ax - tx) * 0.35 + 8, bottom + (ay - bottom) * 0.35)
      g.lineTo(tx + (ax - tx) * 0.55 - 8, bottom + (ay - bottom) * 0.55)
      g.lineTo(ax, ay - 4)
      g.strokePath()
    }

    const more = scene.add.text(w / 2 - 18, h / 2 - 16, '▼', { fontSize: '12px', color: '#666', resolution: 2 }).setOrigin(0.5).setVisible(false)
    const box = scene.add.container(cx, cy, [g, t, more]).setDepth(UI_DEPTH - 10)
    box.setScale(0.85)
    scene.tweens.add({ targets: box, scale: 1, duration: 140, ease: 'Back.Out' })

    let i = 0
    let done = false
    const full = line.text
    const tick = line.kind === 'thought' ? sfx.thoughtTick : line.kind === 'intercom' ? sfx.intercomTick : sfx.textTick
    const timer = scene.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        i++
        t.setText(full.slice(0, i))
        if (i % 3 === 0 && full[i - 1] !== ' ') tick()
        if (i >= full.length) finish()
      },
    })
    const finish = () => {
      done = true
      timer.remove()
      t.setText(full)
      more.setVisible(true)
      scene.tweens.add({ targets: more, y: more.y + 3, yoyo: true, repeat: -1, duration: 400 })
    }
    const off = onKey(scene, (code) => {
      if (!ADVANCE.includes(code)) return
      if (!done) return finish()
      off()
      box.destroy()
      resolve()
    })
  })
}

export async function say(scene: Phaser.Scene, lines: Line[]) {
  for (const l of lines) await bubble(scene, l)
}

// Panel a pantalla completa para leer documentos (banner, notas, informe...).
export function overlay(
  scene: Phaser.Scene,
  build: (c: Phaser.GameObjects.Container, w: number, h: number) => void,
  opts: { w?: number; h?: number; paper?: number; closeKeys?: string[] } = {},
): Promise<void> {
  return new Promise((resolve) => {
    const { width, height } = scene.scale
    const w = opts.w ?? 760
    const h = opts.h ?? 600
    const dim = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0)
    const c = scene.add.container(width / 2, height / 2)
    if (opts.paper !== undefined) {
      const panel = scene.add.graphics()
      panel.fillStyle(0x000000, 0.4).fillRect(-w / 2 + 8, -h / 2 + 10, w, h)
      panel.fillStyle(opts.paper).fillRect(-w / 2, -h / 2, w, h)
      c.add(panel)
    }
    build(c, w, h)
    const hint = text(scene, width / 2, height - 22, 'E / Espacio para cerrar', 15, '#9aa3b5').setOrigin(0.5)
    const root = scene.add.container(0, 0, [dim, c, hint]).setScrollFactor(0).setDepth(UI_DEPTH + 10)
    root.setAlpha(0)
    scene.tweens.add({ targets: root, alpha: 1, duration: 180 })
    sfx.paper()
    const keys = opts.closeKeys ?? [...ADVANCE, 'KeyQ', 'Escape']
    const off = onKey(scene, (code) => {
      if (!keys.includes(code)) return
      off()
      scene.tweens.add({ targets: root, alpha: 0, duration: 150, onComplete: () => root.destroy() })
      resolve()
    })
  })
}

// Opciones de respuesta: globos chicos apilados. Devuelve el índice elegido.
export function choose(scene: Phaser.Scene, options: string[], at: Point): Promise<number> {
  return new Promise((resolve) => {
    let sel = 0
    const items = options.map((o) => {
      const t = text(scene, 0, 0, o, 20, '#151515', { wordWrap: { width: 420 } }).setOrigin(0, 0.5)
      const g = scene.add.graphics()
      return { t, g, w: t.width + 44, h: t.height + 18 }
    })
    const gap = 10
    const total = items.reduce((s, it) => s + it.h + gap, -gap)
    const c = scene.add.container(at.x, at.y - total).setScrollFactor(0).setDepth(UI_DEPTH)
    let y = 0
    for (const it of items) {
      it.g.y = y
      it.t.setPosition(30, y + it.h / 2)
      c.add([it.g, it.t])
      y += it.h + gap
    }
    const draw = () => {
      items.forEach((it, i) => {
        const on = i === sel
        it.g.clear()
        it.g.fillStyle(on ? 0xf6f3ea : 0xc9ccd2, on ? 1 : 0.85)
        it.g.lineStyle(on ? 3 : 2, on ? 0x3e7d3c : 0x555b66)
        it.g.fillRoundedRect(0, 0, it.w, it.h, 14)
        it.g.strokeRoundedRect(0, 0, it.w, it.h, 14)
        if (on) it.g.fillStyle(0x3e7d3c).fillTriangle(10, it.h / 2 - 6, 10, it.h / 2 + 6, 19, it.h / 2)
      })
    }
    draw()
    const off = onKey(scene, (code) => {
      if (code === 'ArrowUp' || code === 'KeyW') sel = (sel + options.length - 1) % options.length
      else if (code === 'ArrowDown' || code === 'KeyS') sel = (sel + 1) % options.length
      else if (ADVANCE.includes(code)) {
        off()
        sfx.click()
        c.destroy()
        resolve(sel)
        return
      } else return
      sfx.click()
      draw()
    })
  })
}

// Aviso chico abajo a la derecha (por ejemplo, "Nueva pista en el diario")
export function toast(scene: Phaser.Scene, msg: string) {
  const { width, height } = scene.scale
  const t = text(scene, width - 24, height - 70, msg, 17, '#cfe8cc', { fontFamily: HAND_FONT })
    .setOrigin(1, 0.5)
    .setScrollFactor(0)
    .setDepth(UI_DEPTH)
    .setAlpha(0)
  scene.tweens.chain({
    targets: t,
    tweens: [
      { alpha: 1, y: t.y - 10, duration: 300 },
      { alpha: 1, duration: 2200 },
      { alpha: 0, duration: 600, onComplete: () => t.destroy() },
    ],
  })
}

// Objetivo de la locación, arriba a la izquierda. `set` lo cambia con un destello; `null` lo esconde.
export function objective(scene: Phaser.Scene) {
  const box = scene.add.container(24, 24).setScrollFactor(0).setDepth(950).setAlpha(0)
  const bg = scene.add.rectangle(0, 0, 10, 10, 0x000000, 0.45).setOrigin(0, 0).setStrokeStyle(2, 0x6c7385)
  const label = text(scene, 14, 9, 'OBJETIVO', 12, '#8e97ab', { letterSpacing: 2 })
  const body = text(scene, 14, 27, '', 18, '#e8e8e8', { fontFamily: HAND_FONT, wordWrap: { width: 380 } })
  box.add([bg, label, body])
  let current: string | null = null
  return {
    set(msg: string | null) {
      if (msg === current) return
      const first = current === null
      current = msg
      scene.tweens.killTweensOf([box, body])
      if (msg === null) {
        scene.tweens.add({ targets: box, alpha: 0, duration: 300 })
        return
      }
      body.setText(msg)
      bg.setSize(Math.max(label.width, body.width) + 28, body.y + body.height + 10)
      box.setAlpha(1)
      body.setColor('#cfe8cc')
      if (first) {
        box.setAlpha(0)
        scene.tweens.add({ targets: box, alpha: 1, duration: 500 })
      } else {
        body.setAlpha(0)
        scene.tweens.add({ targets: body, alpha: 1, duration: 450 })
      }
      scene.time.delayedCall(1800, () => body.setColor('#e8e8e8'))
    },
  }
}

export { onKey, ADVANCE }

import * as Phaser from 'phaser'
import { FONT } from '../art'
import { sfx } from '../audio'
import { isTouch, waitTap } from '../touch'
import { ADVANCE, onKey } from '../ui'

// Caja de texto estilo RPG de Game Boy Advance (Pokémon): abajo, de lado a lado, con el nombre de quién habla
// y la flechita ▼ cuando termina de escribirse. Los pensamientos van en cursiva.

export type Who = 'jorge' | 'piensa' | 'chofer' | 'portero' | 'nadie'
export interface Msg {
  who: Who
  text: string
}

const DEPTH = 1000
const NAMES: Record<Who, string> = { jorge: 'Jorge', piensa: 'Jorge (piensa)', chofer: 'Chofer', portero: 'Portero', nadie: '' }

function frame(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
  const g = scene.add.graphics()
  g.fillStyle(0x000000, 0.35).fillRoundedRect(x + 4, y + 6, w, h, 14)
  g.fillStyle(0x2f3b52).fillRoundedRect(x, y, w, h, 14)
  g.fillStyle(0xf8f8f2).fillRoundedRect(x + 6, y + 6, w - 12, h - 12, 9)
  g.lineStyle(3, 0x8fa3b8).strokeRoundedRect(x + 10, y + 10, w - 20, h - 20, 7)
  return g
}

// Mientras la caja espera, tocar la pantalla avanza (en el celular)
function holdTap(scene: Phaser.Scene) {
  let held = true
  waitTap(true)
  const release = () => {
    if (!held) return
    held = false
    waitTap(false)
  }
  scene.events.once('shutdown', release)
  return release
}

function box(scene: Phaser.Scene) {
  const { width, height } = scene.scale
  const w = Math.min(width - 32, 1120)
  const h = isTouch() && height > width ? 170 : 150
  const x = (width - w) / 2
  const y = height - h - 16
  return { x, y, w, h }
}

export function say(scene: Phaser.Scene, msgs: Msg[]): Promise<void> {
  return msgs.reduce((p, m) => p.then(() => line(scene, m)), Promise.resolve())
}

function line(scene: Phaser.Scene, m: Msg): Promise<void> {
  return new Promise((resolve) => {
    const { x, y, w, h } = box(scene)
    const parts: Phaser.GameObjects.GameObject[] = [frame(scene, x, y, w, h)]
    const name = NAMES[m.who]
    if (name) {
      const tag = scene.add.text(x + 30, y - 6, name, { fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: '#f8f8f2', resolution: 2 }).setOrigin(0, 1)
      const tg = scene.add.graphics()
      tg.fillStyle(m.who === 'piensa' ? 0x3e7d3c : m.who === 'portero' ? 0x6b5643 : 0x2f3b52).fillRoundedRect(x + 18, y - 34, tag.width + 24, 34, { tl: 9, tr: 9, bl: 0, br: 0 })
      parts.push(tg, tag)
    }
    const thought = m.who === 'piensa'
    const t = scene.add.text(x + 34, y + 30, '', {
      fontFamily: FONT,
      fontSize: '25px',
      fontStyle: thought ? 'italic' : 'normal',
      color: thought ? '#3c4a5e' : '#202024',
      wordWrap: { width: w - 90, useAdvancedWrap: true },
      lineSpacing: 6,
      resolution: 2,
    })
    const more = scene.add.text(x + w - 40, y + h - 34, '▼', { fontFamily: FONT, fontSize: '18px', color: '#c0392b', resolution: 2 }).setVisible(false)
    parts.push(t, more)
    const root = scene.add.container(0, 0, parts).setScrollFactor(0).setDepth(DEPTH)

    const full = m.text
    let i = 0
    let done = false
    const tick = thought ? sfx.thoughtTick : m.who === 'portero' ? sfx.intercomTick : sfx.textTick
    const timer = scene.time.addEvent({
      delay: 24,
      loop: true,
      callback: () => {
        i++
        t.setText(full.slice(0, i))
        if (i % 3 === 0 && full[i - 1] !== ' ') tick()
        if (i >= full.length) finish()
      },
    })
    const finish = () => {
      if (done) return
      done = true
      timer.remove()
      t.setText(full)
      more.setVisible(true)
      scene.tweens.add({ targets: more, y: more.y + 4, yoyo: true, repeat: -1, duration: 350 })
    }
    const release = holdTap(scene)
    const off = onKey(scene, (code) => {
      if (!ADVANCE.includes(code)) return
      if (!done) return finish()
      off()
      release()
      root.destroy()
      resolve()
    })
  })
}

// Menú de opciones a la derecha, arriba de la caja de texto, con el cursor ▶. Devuelve el índice elegido
export function menu(scene: Phaser.Scene, options: string[]): Promise<number> {
  return new Promise((resolve) => {
    const { width } = scene.scale
    const b = box(scene)
    const texts = options.map((o) => scene.add.text(0, 0, o, { fontFamily: FONT, fontSize: '23px', color: '#202024', resolution: 2 }))
    const w = Math.min(width - 32, Math.max(...texts.map((t) => t.width)) + 90)
    const lh = 42
    const h = options.length * lh + 34
    const x = b.x + b.w - w
    const y = b.y - h - 10
    const cursor = scene.add.text(x + 22, 0, '▶', { fontFamily: FONT, fontSize: '20px', color: '#c0392b', resolution: 2 })
    texts.forEach((t, i) => t.setPosition(x + 50, y + 18 + i * lh))
    const root = scene.add.container(0, 0, [frame(scene, x, y, w, h), ...texts, cursor]).setScrollFactor(0).setDepth(DEPTH + 5)
    let sel = 0
    const draw = () => cursor.setY(y + 20 + sel * lh)
    draw()
    const pick = () => {
      off()
      sfx.click()
      root.destroy()
      resolve(sel)
    }
    texts.forEach((t, i) => {
      t.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (!root.active) return
        sel = i
        pick()
      })
    })
    const off = onKey(scene, (code) => {
      if (code === 'ArrowUp' || code === 'KeyW') sel = (sel + options.length - 1) % options.length
      else if (code === 'ArrowDown' || code === 'KeyS') sel = (sel + 1) % options.length
      else if (ADVANCE.includes(code)) return pick()
      else return
      sfx.click()
      draw()
    })
  })
}

// Cartel grande en el centro (los títulos de las escaleras). No frena el juego
export function title(scene: Phaser.Scene, str: string, size = 72) {
  const { width, height } = scene.scale
  const t = scene.add
    .text(width / 2, height * 0.32, str, { fontFamily: '"Georgia", "Times New Roman", serif', fontSize: `${size}px`, color: '#f2efe6', resolution: 2, stroke: '#0b0a0e', strokeThickness: 8, align: 'center' })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(DEPTH - 20)
    .setAlpha(0)
  scene.tweens.chain({
    targets: t,
    tweens: [
      { alpha: 1, duration: 1400 },
      { alpha: 1, duration: 2600 },
      { alpha: 0, duration: 1600, onComplete: () => t.destroy() },
    ],
  })
}

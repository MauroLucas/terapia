import type * as Phaser from 'phaser'
import { HAND_FONT } from '../art'
import { OBJETOS, showObjeto, type ObjetoId } from '../documents'
import { sfx } from '../audio'
import { state } from '../state'
import { onKey, text } from '../ui'

// Diario de Jorge, escrito con su letra. Dos pestañas:
//   Pistas:  lo que fue descubriendo (solo lo encontrado).
//   Objetos: lo que se guardó (foto, notas, informe...). Se pueden volver a ver.
// ← → cambiar pestaña · ↑ ↓ elegir objeto o recorrer pistas · E ver · TAB / Q cerrar (Esc también, fuera de pantalla completa).

const W = 760
const H = 600
const TABS = ['Pistas', 'Objetos'] as const

export function openDiary(scene: Phaser.Scene): Promise<void> {
  return new Promise((resolve) => {
    const { width, height } = scene.scale
    let tab = 0
    let sel = 0
    let scroll = 0 // primera pista visible
    let pistasMore = false
    const objetos = () => state.inventario.filter((k): k is ObjetoId => k in OBJETOS)

    const dim = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0)
    const page = scene.add.container(width / 2, height / 2)
    const hint = text(scene, width / 2, height - 22, '', 15, '#9aa3b5').setOrigin(0.5)
    const root = scene.add.container(0, 0, [dim, page, hint]).setScrollFactor(0).setDepth(1010)

    const draw = () => {
      page.removeAll(true)
      const g = scene.add.graphics()
      g.fillStyle(0x000000, 0.4).fillRect(-W / 2 + 8, -H / 2 + 10, W, H)
      g.fillStyle(0xf5f1e6).fillRect(-W / 2, -H / 2, W, H)
      g.lineStyle(1, 0x9fb6d6, 0.6)
      for (let y = -H / 2 + 90; y < H / 2 - 20; y += 34) g.lineBetween(-W / 2 + 30, y, W / 2 - 30, y)
      g.lineStyle(2, 0xd77, 0.6).lineBetween(-W / 2 + 70, -H / 2 + 10, -W / 2 + 70, H / 2 - 10)
      page.add(g)

      // Pestañas
      TABS.forEach((name, i) => {
        const x = (i - 0.5) * 180
        const on = i === tab
        page.add(text(scene, x, -H / 2 + 40, name, on ? 34 : 28, on ? '#2a2a2a' : '#9a9a9a', { fontFamily: HAND_FONT, fontStyle: on ? 'bold' : 'normal' }).setOrigin(0.5))
        if (on) page.add(scene.add.graphics().lineStyle(3, 0x3e7d3c).lineBetween(x - 55, -H / 2 + 64, x + 55, -H / 2 + 64))
      })

      if (tab === 0) drawPistas()
      else drawObjetos()
      const canView = tab === 1 && objetos().length > 0
      const canScroll = tab === 0 && (scroll > 0 || pistasMore)
      hint.setText(`← → cambiar pestaña${canView ? ' · ↑ ↓ elegir · E ver' : ''}${canScroll ? ' · ↑ ↓ ver más' : ''} · TAB / Q cerrar`)
    }

    const drawPistas = () => {
      if (state.pistas.length === 0) {
        page.add(text(scene, 0, 0, 'Todavía no anoté nada.', 22, '#555', { fontFamily: HAND_FONT }).setOrigin(0.5))
        return
      }
      // Si no entran todas, se recorren con ↑ ↓
      let y = -H / 2 + 96
      pistasMore = false
      for (let i = scroll; i < state.pistas.length; i++) {
        const p = state.pistas[i]
        const t = text(scene, -W / 2 + 90, y, `${p.titulo}: ${p.texto}`, 19, '#26324a', { fontFamily: HAND_FONT, wordWrap: { width: W - 130 } })
        if (y + t.height > H / 2 - 40) {
          t.destroy()
          pistasMore = true
          break
        }
        page.add(t)
        y += Math.max(34, Math.ceil(t.height / 34) * 34) + 4
      }
      if (scroll > 0) page.add(text(scene, W / 2 - 40, -H / 2 + 96, '▲', 18, '#3e7d3c').setOrigin(0.5, 0))
      if (pistasMore) page.add(text(scene, W / 2 - 40, H / 2 - 36, '▼', 18, '#3e7d3c').setOrigin(0.5, 0))
    }

    const drawObjetos = () => {
      const list = objetos()
      if (list.length === 0) {
        page.add(text(scene, 0, 0, 'Todavía no guardé nada.', 22, '#555', { fontFamily: HAND_FONT }).setOrigin(0.5))
        return
      }
      sel = Math.min(sel, list.length - 1)
      list.forEach((id, i) => {
        const y = -H / 2 + 112 + i * 68
        const on = i === sel
        if (on) page.add(scene.add.rectangle(-W / 2 + 80, y, 300, 60, 0x3e7d3c, 0.15).setOrigin(0, 0.5).setStrokeStyle(2, 0x3e7d3c))
        const icon = scene.add.image(-W / 2 + 115, y, id)
        icon.setScale(Math.min(1.4, 40 / icon.width, 40 / icon.height))
        page.add(icon)
        page.add(text(scene, -W / 2 + 150, y, OBJETOS[id].nombre, 21, '#26324a', { fontFamily: HAND_FONT }).setOrigin(0, 0.5))
      })
      // Detalle del objeto elegido
      const o = OBJETOS[list[sel]]
      const x = -W / 2 + 410
      page.add(text(scene, x, -H / 2 + 96, o.nombre, 26, '#2a2a2a', { fontFamily: HAND_FONT, fontStyle: 'bold', wordWrap: { width: 300 } }))
      page.add(text(scene, x, -H / 2 + 140, o.texto, 20, '#26324a', { fontFamily: HAND_FONT, wordWrap: { width: 300 } }))
      if (o.pages.length > 0) page.add(text(scene, x, H / 2 - 60, 'E para verlo de cerca', 18, '#3e7d3c', { fontFamily: HAND_FONT }))
    }

    let off = () => {}
    const listen = () => {
      off = onKey(scene, (code) => {
        const list = objetos()
        if (code === 'Tab' || code === 'KeyQ' || code === 'Escape') {
          off()
          scene.tweens.add({ targets: root, alpha: 0, duration: 150, onComplete: () => root.destroy() })
          resolve()
          return
        }
        if (code === 'ArrowLeft' || code === 'KeyA' || code === 'ArrowRight' || code === 'KeyD') tab = 1 - tab
        else if (tab === 0 && scroll > 0 && (code === 'ArrowUp' || code === 'KeyW')) scroll--
        else if (tab === 0 && pistasMore && (code === 'ArrowDown' || code === 'KeyS')) scroll++
        else if (tab === 1 && list.length > 0 && (code === 'ArrowUp' || code === 'KeyW')) sel = (sel + list.length - 1) % list.length
        else if (tab === 1 && list.length > 0 && (code === 'ArrowDown' || code === 'KeyS')) sel = (sel + 1) % list.length
        else if (tab === 1 && list.length > 0 && ['KeyE', 'Enter', 'Space'].includes(code) && OBJETOS[list[sel]].pages.length > 0) {
          // Ver el objeto de cerca y volver al diario
          off()
          root.setVisible(false)
          scene.time.delayedCall(50, async () => {
            await showObjeto(scene, list[sel])
            root.setVisible(true)
            listen()
          })
          return
        } else return
        sfx.click()
        draw()
      })
    }

    draw()
    root.setAlpha(0)
    scene.tweens.add({ targets: root, alpha: 1, duration: 180 })
    sfx.paper()
    listen()
  })
}

import * as Phaser from 'phaser'
import { resetState, state } from '../state'
import { isTouch } from '../touch'
import { text } from '../ui'

// Cierre de una locación cuando se juega suelta (por ejemplo, `#/casa-de-jorge`): en el prototipo completo no aparece.
export class LevelEnd extends Phaser.Scene {
  constructor() {
    super('LevelEnd')
  }

  create(data: { titulo?: string; locacion?: string }) {
    const { width, height } = this.scale
    const lines = [
      text(this, width / 2, height / 2 - 60, data.titulo ?? 'Fin de la locación', 40, '#e8e8e8').setOrigin(0.5),
      text(this, width / 2, height / 2, data.locacion ?? '', 22, '#9aa3b5').setOrigin(0.5),
      text(this, width / 2, height / 2 + 40, `Pistas anotadas: ${state.pistas.length}`, 18, '#9aa3b5').setOrigin(0.5),
      text(this, width / 2, height / 2 + 110, isTouch() ? 'Tocá la pantalla para volver a empezar' : 'R para volver a empezar', 18, '#6f7889').setOrigin(0.5),
    ]
    lines.forEach((l, i) => {
      l.setAlpha(0)
      this.tweens.add({ targets: l, alpha: 1, delay: 400 + i * 500, duration: 800 })
    })
    const again = () => {
      resetState()
      this.scene.start('Warning')
    }
    this.input.keyboard!.once('keydown-R', again)
    // Con el dedo: tocar la pantalla, cuando ya apareció todo
    this.time.delayedCall(2500, () => this.input.once('pointerdown', again))
  }
}

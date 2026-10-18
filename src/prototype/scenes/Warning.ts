import * as Phaser from 'phaser'
import { initAudio } from '../audio'
import { makeTextures } from '../art'
import { text } from '../ui'

// Aviso de contenido. La primera tecla también habilita el audio del navegador.
// Después sigue la escena indicada en el registro (`start`); por defecto, la Casa de Jorge.
export class Warning extends Phaser.Scene {
  constructor() {
    super('Warning')
  }

  create() {
    makeTextures(this)
    const { width, height } = this.scale
    this.cameras.main.setBackgroundColor('#000000')
    text(this, width / 2, height / 2 - 140, 'AVISO DE CONTENIDO', 28, '#e8e8e8', { fontStyle: 'bold' }).setOrigin(0.5)
    text(this, width / 2, height / 2 - 50,
      'Este juego trata temas de salud mental,\npérdida de memoria e ideación suicida.', 22, '#c9ced8', { align: 'center' }).setOrigin(0.5)
    text(this, width / 2, height / 2 + 30,
      'Si estás pasando por un momento difícil, no estás solo: buscá ayuda.', 18, '#9aa3b5', { align: 'center' }).setOrigin(0.5)
    const start = text(this, width / 2, height / 2 + 150, 'PROTOTIPO · Presioná cualquier tecla para empezar', 18, '#6f7889').setOrigin(0.5)
    this.tweens.add({ targets: start, alpha: 0.3, yoyo: true, repeat: -1, duration: 900 })
    this.cameras.main.fadeIn(800)

    const go = () => {
      initAudio()
      this.cameras.main.fadeOut(900, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start((this.registry.get('start') as string | undefined) ?? 'Apartment', this.registry.get('startData') as object | undefined))
    }
    this.input.keyboard!.once('keydown', go)
    this.input.once('pointerdown', go)
  }
}

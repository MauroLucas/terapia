import * as Phaser from 'phaser'
import { Apartment } from './scenes/Apartment'
import { Car } from './scenes/Car'
import { Corridor } from './scenes/Corridor'
import { Dream } from './scenes/Dream'
import { Dream2 } from './scenes/Dream2'
import { LevelEnd } from './scenes/LevelEnd'
import { Neural } from './scenes/Neural'
import { Office } from './scenes/Office'
import { Stairs } from './scenes/Stairs'
import { Warning } from './scenes/Warning'
import { resetState } from './state'

function baseConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, fullscreenTarget: parent },
  }
}

// F: pantalla completa (el navegador lo permite porque viene de una tecla)
function fullscreenKey(game: Phaser.Game) {
  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'KeyF' && !e.repeat) game.scale.toggleFullscreen()
  }
  window.addEventListener('keydown', onKey)
  game.events.once(Phaser.Core.Events.DESTROY, () => window.removeEventListener('keydown', onKey))
  // En pantalla completa, Esc es del navegador: sale de la pantalla completa y el juego no lo recibe.
  // Donde el navegador lo permite (Chrome, Edge), se lo pedimos: Esc llega al juego y para salir hay que mantenerlo apretado.
  // En los demás no se puede, por eso todos los paneles se cierran también con Q.
  const keyboard = (navigator as Navigator & { keyboard?: { lock?: (keys: string[]) => Promise<void>; unlock?: () => void } }).keyboard
  game.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, () => void keyboard?.lock?.(['Escape']).catch(() => {}))
  game.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, () => keyboard?.unlock?.())
  return game
}

// La física se avanza a paso fijo desde la escena (ver Apartment.update)
const matter: Phaser.Types.Core.PhysicsConfig = { default: 'matter', matter: { gravity: { x: 0, y: 1 }, autoUpdate: false, debug: false } }

// Prototipo: el juego completo, todas las locaciones de corrido. Cada locación nueva se suma acá.
export function createGame(parent: HTMLElement) {
  resetState()
  return fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, Stairs, Car, Neural, Corridor, Office, Dream, Dream2, LevelEnd] }))
}

// Las locaciones sueltas marcan `solo` en el registro: al terminar muestran su cierre en vez de seguir a la locación siguiente.
// El aviso de contenido se mantiene en todas.

// Casa de Jorge sola: departamento → escaleras → auto
export function createLevel1Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, Stairs, Car, LevelEnd] }))
  game.registry.set('solo', true)
  return game
}

// Hall del edificio solo, sin pasar por la Casa de Jorge
export function createLevel2Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), scene: [Warning, Neural, LevelEnd] }))
  game.registry.set('start', 'Neural')
  game.registry.set('solo', true)
  return game
}

// Consultorio solo: el pasillo de los consultorios y, adentro, el consultorio del doctor Vela
export function createLevel3Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), scene: [Warning, Corridor, Office, LevelEnd] }))
  game.registry.set('start', 'Corridor')
  game.registry.set('solo', true)
  return game
}

// La primera noche sola: la vuelta a la Casa de Jorge después de la Sesión 1
export function createLevel5Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { noche: true })
  game.registry.set('solo', true)
  return game
}

// Pre-sesión 2 sola: la mañana, una semana después, y la consulta con Vela antes del sueño
export function createLevel7Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, Office, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { manana: true })
  game.registry.set('solo', true)
  return game
}

// Sesión 2 sola (el boletín): el sueño y el despertar en la camilla
export function createLevel6Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), scene: [Warning, Dream2, Office, LevelEnd] }))
  game.registry.set('start', 'Dream2')
  game.registry.set('solo', true)
  return game
}

// Sesión 1 sola (la feria): el sueño y el despertar en la camilla
export function createLevel4Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), scene: [Warning, Dream, Office, LevelEnd] }))
  game.registry.set('start', 'Dream')
  game.registry.set('solo', true)
  return game
}


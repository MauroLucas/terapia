import * as Phaser from 'phaser'
import { Apartment } from './scenes/Apartment'
import { Car } from './scenes/Car'
import { Corridor } from './scenes/Corridor'
import { Dream } from './scenes/Dream'
import { Dream2 } from './scenes/Dream2'
import { Dream3 } from './scenes/Dream3'
import { Dream4 } from './scenes/Dream4'
import { Dream5 } from './scenes/Dream5'
import { Dream6 } from './scenes/Dream6'
import { Dream7 } from './scenes/Dream7'
import { Dream8 } from './scenes/Dream8'
import { LevelEnd } from './scenes/LevelEnd'
import { Neural } from './scenes/Neural'
import { Office } from './scenes/Office'
import { Stairs } from './scenes/Stairs'
import { Warning } from './scenes/Warning'
import { resetState } from './state'
import { gameWidth, mountFrame, mountTouch, toggleFull } from './touch'

// El marco de la página (`parent`) tiene adentro la pantalla del juego y, en el celular, los controles táctiles
function baseConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  const screen = mountFrame(parent)
  return {
    type: Phaser.AUTO,
    parent: screen,
    width: gameWidth(),
    height: 720,
    backgroundColor: '#000000',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, fullscreenTarget: parent },
  }
}

// F: pantalla completa (el navegador lo permite porque viene de una tecla). En el celular, también los controles táctiles
function fullscreenKey(game: Phaser.Game) {
  const screen = game.config.parent as HTMLElement
  const frame = screen.parentElement as HTMLElement
  const real = game.scale.toggleFullscreen.bind(game.scale)
  const toggle = () => toggleFull(frame, () => real(), () => game.scale.refresh())
  // Los botones de pantalla completa de las páginas usan esto: así también funciona donde el navegador no la deja (iPhone)
  game.scale.toggleFullscreen = toggle
  const offTouch = mountTouch(frame, screen, toggle, () => game.scale.refresh())
  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'KeyF' && !e.repeat) toggle()
  }
  window.addEventListener('keydown', onKey)
  game.events.once(Phaser.Core.Events.DESTROY, () => {
    window.removeEventListener('keydown', onKey)
    offTouch()
    frame.classList.remove('pseudo-full', 'has-touch', 'portrait', 'landscape')
  })
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
  return fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, Stairs, Car, Neural, Corridor, Office, Dream, Dream2, Dream3, Dream4, Dream5, Dream6, Dream7, Dream8, LevelEnd] }))
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

// La segunda noche sola: la vuelta a casa después de la Sesión 2
export function createLevel8Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { noche: true, vuelta: 2 })
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

// Pre-sesión 3 sola: la mañana después de La segunda noche y la consulta con Vela antes del sueño
export function createLevel9Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, Office, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { manana: true, vuelta: 2 })
  game.registry.set('solo', true)
  return game
}

// Sesión 3 sola (la fiesta): el sueño y el despertar en la camilla
export function createLevel10Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), scene: [Warning, Dream3, Office, LevelEnd] }))
  game.registry.set('start', 'Dream3')
  game.registry.set('solo', true)
  return game
}

// La tercera noche sola: la vuelta a casa después de la Sesión 3
export function createLevel11Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { noche: true, vuelta: 3 })
  game.registry.set('solo', true)
  return game
}

// Pre-sesión 4 sola: la mañana después de La tercera noche y la consulta con Vela antes del sueño
export function createLevel12Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, Office, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { manana: true, vuelta: 3 })
  game.registry.set('solo', true)
  return game
}

// Sesión 4 sola (la pelea): el sueño y el despertar en la camilla
export function createLevel13Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), scene: [Warning, Dream4, Office, LevelEnd] }))
  game.registry.set('start', 'Dream4')
  game.registry.set('solo', true)
  return game
}

// La cuarta noche sola: la vuelta a casa después de la Sesión 4
export function createLevel14Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { noche: true, vuelta: 4 })
  game.registry.set('solo', true)
  return game
}

// Pre-sesión 5 sola: la mañana después de La cuarta noche y la consulta con Vela antes del sueño
export function createLevel15Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, Office, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { manana: true, vuelta: 4 })
  game.registry.set('solo', true)
  return game
}

// Sesión 5 sola (el reencuentro): el sueño y el despertar en la camilla
export function createLevel16Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), scene: [Warning, Dream5, Office, LevelEnd] }))
  game.registry.set('start', 'Dream5')
  game.registry.set('solo', true)
  return game
}

// La quinta noche sola: la vuelta a casa después de la Sesión 5
export function createLevel17Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { noche: true, vuelta: 5 })
  game.registry.set('solo', true)
  return game
}

// Pre-sesión 6 sola: la mañana después de La quinta noche y la consulta con Vela antes del sueño
export function createLevel18Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, Office, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { manana: true, vuelta: 5 })
  game.registry.set('solo', true)
  return game
}

// Sesión 6 sola (el viaje del 12/08): el sueño y el despertar en la camilla
export function createLevel19Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), scene: [Warning, Dream6, Office, LevelEnd] }))
  game.registry.set('start', 'Dream6')
  game.registry.set('solo', true)
  return game
}

// La sexta noche sola: la vuelta a casa después de la Sesión 6
export function createLevel20Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { noche: true, vuelta: 6 })
  game.registry.set('solo', true)
  return game
}

// Pre-sesión 7 sola: la mañana después de La sexta noche y la consulta con Vela antes del sueño
export function createLevel21Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, Office, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { manana: true, vuelta: 6 })
  game.registry.set('solo', true)
  return game
}

// Sesión 7 sola (la muerte de su mamá): el sueño y el despertar en la camilla
export function createLevel22Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), scene: [Warning, Dream7, Office, LevelEnd] }))
  game.registry.set('start', 'Dream7')
  game.registry.set('solo', true)
  return game
}

// La séptima noche sola: la vuelta a casa después de la Sesión 7
export function createLevel23Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { noche: true, vuelta: 7 })
  game.registry.set('solo', true)
  return game
}

// Pre-sesión 8 sola: la mañana después de La séptima noche y la consulta con Vela antes del sueño
export function createLevel24Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, Office, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { manana: true, vuelta: 7 })
  game.registry.set('solo', true)
  return game
}

// Sesión 8 sola (el velorio): el sueño y el despertar en la camilla
export function createLevel25Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), scene: [Warning, Dream8, Office, LevelEnd] }))
  game.registry.set('start', 'Dream8')
  game.registry.set('solo', true)
  return game
}

// La octava noche sola: la vuelta a casa después de la Sesión 8
export function createLevel26Game(parent: HTMLElement) {
  resetState()
  const game = fullscreenKey(new Phaser.Game({ ...baseConfig(parent), physics: matter, scene: [Warning, Apartment, LevelEnd] }))
  game.registry.set('start', 'Apartment')
  game.registry.set('startData', { noche: true, vuelta: 8 })
  game.registry.set('solo', true)
  return game
}

// El juego solo, a pantalla completa, sin el GDD alrededor (juego/index.html).
// Es el mismo juego completo que la página "Prototipo" del GDD: todas las locaciones de corrido.
import { createGame } from './prototype'
import './juego.css'

const game = createGame(document.getElementById('juego')!)
// Sin la etiqueta "PROTOTIPO" en el aviso de inicio
game.registry.set('final', true)

// Controles táctiles para jugar en el celular. No usa Phaser: son botones del navegador encima (o debajo) del juego
// que se aprietan como si fueran teclas. Así todas las escenas funcionan igual con teclado o con los dedos.
//   Apaisado: los botones van sobre el juego, semitransparentes, en las esquinas de abajo.
//   Vertical: el juego va arriba, más angosto (640 × 720), y los botones abajo, como en una consola portátil.
// Tocar la pantalla del juego avanza los diálogos y cierra los documentos (solo cuando hay algo para avanzar).

export function isTouch() {
  return typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0)
}

export function isPortrait() {
  return window.matchMedia('(orientation: portrait)').matches
}

// Ancho del juego: 1280 × 720 en apaisado; en un celular en vertical, 640 × 720 (se ve menos a los costados)
export function gameWidth() {
  return isTouch() && isPortrait() ? 640 : 1280
}

// Texto de ayuda de los controles, según cómo se juega
export function controlsHelp(keyboard: string) {
  return isTouch() ? '◀ ▶ caminar   ·   E examinar / usar   ·   tocá la pantalla para avanzar' : keyboard
}

// Cuántas cosas esperan que el jugador avance (globos y documentos abiertos). Solo ahí tocar la pantalla avanza
let waiting = 0
export function waitTap(on: boolean) {
  waiting = Math.max(0, waiting + (on ? 1 : -1))
}

const KEYS: Record<string, number> = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, KeyE: 69, Space: 32, Tab: 9, KeyQ: 81, KeyR: 82 }

// Simula una tecla: Phaser escucha el teclado en `window` y usa `keyCode`, que hay que definir a mano
function key(code: string, down: boolean) {
  const ev = new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code, bubbles: true, cancelable: true })
  Object.defineProperty(ev, 'keyCode', { get: () => KEYS[code] })
  Object.defineProperty(ev, 'which', { get: () => KEYS[code] })
  window.dispatchEvent(ev)
}

function tap(code: string) {
  key(code, true)
  setTimeout(() => key(code, false), 60)
}

function button(label: string, code: string, cls: string, hold: boolean, title: string) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = `tp-btn ${cls}`
  b.textContent = label
  b.setAttribute('aria-label', title)
  let pressed = false
  const release = () => {
    if (!pressed) return
    pressed = false
    b.classList.remove('on')
    if (hold) key(code, false)
  }
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      b.setPointerCapture(e.pointerId)
    } catch {
      // Sin captura igual funciona: se suelta con pointerup
    }
    pressed = true
    b.classList.add('on')
    if (hold) key(code, true)
    else tap(code)
  })
  b.addEventListener('pointerup', release)
  b.addEventListener('pointercancel', release)
  b.addEventListener('lostpointercapture', release)
  b.addEventListener('contextmenu', (e) => e.preventDefault())
  return b
}

// Pantalla completa: la de verdad donde el navegador la deja (Android); si no (iPhone), el juego ocupa toda la página
export function toggleFull(frame: HTMLElement, real: () => void, refresh: () => void) {
  if (document.fullscreenEnabled) {
    real()
    return
  }
  frame.classList.toggle('pseudo-full')
  document.body.classList.toggle('no-scroll', frame.classList.contains('pseudo-full'))
  setTimeout(refresh, 50)
}

// Prepara el marco del juego: adentro, la pantalla (donde va el canvas) y, si es táctil, los controles
export function mountFrame(frame: HTMLElement) {
  frame.replaceChildren()
  const screen = document.createElement('div')
  screen.className = 'game-screen'
  frame.append(screen)
  return screen
}

export function mountTouch(frame: HTMLElement, screen: HTMLElement, onFull: () => void, refresh: () => void) {
  if (!isTouch()) return () => {}
  frame.classList.add('has-touch')
  const orient = () => {
    frame.classList.toggle('portrait', isPortrait())
    frame.classList.toggle('landscape', !isPortrait())
    setTimeout(refresh, 100)
  }
  orient()
  const mq = window.matchMedia('(orientation: portrait)')
  mq.addEventListener('change', orient)

  const pad = document.createElement('div')
  pad.className = 'touch-pad'
  const left = document.createElement('div')
  left.className = 'tp-dpad'
  left.append(
    button('▲', 'ArrowUp', 'up', true, 'Arriba'),
    button('◀', 'ArrowLeft', 'left', true, 'Izquierda'),
    button('▶', 'ArrowRight', 'right', true, 'Derecha'),
    button('▼', 'ArrowDown', 'down', true, 'Abajo'),
  )
  const right = document.createElement('div')
  right.className = 'tp-actions'
  const small = document.createElement('div')
  small.className = 'tp-small'
  const full = document.createElement('button')
  full.type = 'button'
  full.className = 'tp-btn tp-mini'
  full.textContent = '⛶'
  full.setAttribute('aria-label', 'Pantalla completa')
  full.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onFull()
  })
  small.append(button('Diario', 'Tab', 'tp-mini', false, 'Diario'), button('Cerrar', 'KeyQ', 'tp-mini', false, 'Cerrar'), full)
  right.append(small, button('E', 'KeyE', 'tp-e', true, 'Examinar o usar'))
  pad.append(left, right)
  frame.append(pad)

  // Tocar la pantalla del juego: avanza el diálogo o cierra el documento abierto
  const onScreen = () => {
    if (waiting > 0) tap('Space')
  }
  screen.addEventListener('pointerdown', onScreen)
  return () => {
    mq.removeEventListener('change', orient)
    screen.removeEventListener('pointerdown', onScreen)
    document.body.classList.remove('no-scroll')
  }
}

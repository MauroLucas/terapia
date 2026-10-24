import { useEffect, useRef } from 'react'
import type * as Phaser from 'phaser'

export function DemoPersecucionPage() {
  const ref = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    let cancelled = false
    // Phaser se carga solo al entrar a esta página
    import('../prototype').then(({ createDemoPersecucionGame }) => {
      if (!cancelled && ref.current) gameRef.current = createDemoPersecucionGame(ref.current)
    })
    return () => {
      cancelled = true
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <article className="content prototype">
      <header className="section-header">
        <span className="section-icon">🪳</span>
        <h1>Prototipo: la persecución</h1>
      </header>
      <p>
        <strong>En prueba</strong> (sección Prototipos: ideas sueltas que todavía no están en el juego completo). Una idea para el final de la Sesión 1, estilo <em>Limbo</em> o <em>Little Nightmares</em>: después de soltar al
        elefante, Lechuga se rompe como un ente y de la falla sale una cucaracha gigante que persigue a Jorge. Hay obstáculos (saltar, agacharse,
        empujar una caja, esconderse) y al final no hay salida: hay que quedarse quieto, como le dijo su mamá. No está en el prototipo completo.
        Ver "Locaciones" → Sesión 1: El circo → Demo: la persecución.
      </p>
      <div className="game-frame" ref={ref} />
      <div className="game-actions">
        <button onClick={() => gameRef.current?.scale.toggleFullscreen()}>⛶ Pantalla completa</button>
        <span className="empty">También con la tecla F. Esc para salir (en Chrome y Edge, mantenelo apretado).</span>
      </div>
      <table>
        <tbody>
          <tr><td>Correr</td><td>← → o A D</td></tr>
          <tr><td>Saltar</td><td>↑, W o Espacio</td></tr>
          <tr><td>Agacharse</td><td>↓ o S</td></tr>
          <tr><td>Empujar la caja</td><td>Caminar contra ella</td></tr>
          <tr><td>Esconderse / salir</td><td>E, al lado de un barril</td></tr>
          <tr><td>Avanzar texto</td><td>Espacio, E o Enter</td></tr>
          <tr><td>Pantalla completa</td><td>F</td></tr>
        </tbody>
      </table>
      <p className="empty">Gráficos, sonidos y diálogos provisorios. Si la cucaracha te agarra, volvés al último punto de control.</p>
    </article>
  )
}

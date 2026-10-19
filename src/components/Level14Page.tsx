import { useEffect, useRef } from 'react'
import type * as Phaser from 'phaser'

export function Level14Page() {
  const ref = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    let cancelled = false
    // Phaser se carga solo al entrar a esta página
    import('../prototype').then(({ createLevel14Game }) => {
      if (!cancelled && ref.current) gameRef.current = createLevel14Game(ref.current)
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
        <span className="section-icon">🌑</span>
        <h1>Prototipo: La cuarta noche</h1>
      </header>
      <p>
        Solo La cuarta noche: Jorge vuelve a su casa después de la Sesión 4, anota la pelea en la pizarra y encuentra, en la billetera, el papelito con el número de su papá. Ver "Locaciones" → La cuarta noche.
      </p>
      <div className="game-frame" ref={ref} />
      <div className="game-actions">
        <button onClick={() => gameRef.current?.scale.toggleFullscreen()}>⛶ Pantalla completa</button>
        <span className="empty">También con la tecla F. Esc para salir (en Chrome y Edge, mantenelo apretado).</span>
      </div>
      <table>
        <tbody>
          <tr><td>Caminar</td><td>← → o A D</td></tr>
          <tr><td>Examinar / usar puertas</td><td>E</td></tr>
          <tr><td>Avanzar texto</td><td>Espacio, E o Enter</td></tr>
          <tr><td>Elegir una respuesta</td><td>↑ ↓ y Enter</td></tr>
          <tr><td>Diario de pistas</td><td>TAB</td></tr>
          <tr><td>Cerrar un panel (candado, diario, documentos)</td><td>Q</td></tr>
          <tr><td>Pantalla completa</td><td>F</td></tr>
        </tbody>
      </table>
      <p className="empty">Gráficos, sonidos y diálogos provisorios. Solo teclado.</p>
    </article>
  )
}

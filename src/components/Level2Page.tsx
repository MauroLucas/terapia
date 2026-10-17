import { useEffect, useRef } from 'react'
import type * as Phaser from 'phaser'

export function Level2Page() {
  const ref = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    let cancelled = false
    // Phaser se carga solo al entrar a esta página
    import('../prototype').then(({ createLevel2Game }) => {
      if (!cancelled && ref.current) gameRef.current = createLevel2Game(ref.current)
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
        <span className="section-icon">🏥</span>
        <h1>Prototipo: Hall del edificio</h1>
      </header>
      <p>
        Solo el Hall del edificio: arranca directo en el hall de Neural, sin pasar por la Casa de Jorge. Jorge llegó sin el carnet y tiene que buscar
        otra forma de entrar. Ver "Locaciones" → Hall del edificio.
      </p>
      <div className="game-frame" ref={ref} />
      <div className="game-actions">
        <button onClick={() => gameRef.current?.scale.toggleFullscreen()}>⛶ Pantalla completa</button>
        <span className="empty">También con la tecla F. Esc para salir (en Chrome y Edge, mantenelo apretado).</span>
      </div>
      <table>
        <tbody>
          <tr><td>Caminar</td><td>← → o A D</td></tr>
          <tr><td>Hablar / examinar / usar puertas</td><td>E</td></tr>
          <tr><td>Avanzar texto</td><td>Espacio, E o Enter</td></tr>
          <tr><td>Elegir una respuesta</td><td>↑ ↓ y Enter</td></tr>
          <tr><td>Diario de pistas</td><td>TAB</td></tr>
          <tr><td>Cerrar un panel (candado, diario, documentos)</td><td>Q</td></tr>
          <tr><td>Pantalla completa</td><td>F</td></tr>
        </tbody>
      </table>
      <details>
        <summary>Ver la solución (spoiler)</summary>
        <p>
          Hablar con la recepción → hablar con el de seguridad → en el baño, tocar el cubículo trabado → agarrar un
          rollo de la estantería de maestranza (la puerta al lado de los baños) → dárselo al del cubículo trabado →
          preguntarle al de seguridad por la gaseosa → mirar el tacho que tiene al lado → sacar una Cola light de la máquina → dársela → saltar los molinetes. Después viene la secuencia del ascensor.
        </p>
      </details>
      <p className="empty">Gráficos, sonidos y diálogos provisorios. Solo teclado.</p>
    </article>
  )
}

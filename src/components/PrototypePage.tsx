import { useEffect, useRef } from 'react'
import type * as Phaser from 'phaser'

export function PrototypePage() {
  const ref = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    let cancelled = false
    // Phaser se carga solo al entrar a esta página
    import('../prototype').then(({ createGame }) => {
      if (!cancelled && ref.current) gameRef.current = createGame(ref.current)
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
        <span className="section-icon">🕹️</span>
        <h1>Prototipo: juego completo</h1>
      </header>
      <p>
        El juego entero, de corrido: Casa de Jorge (departamento, escaleras y auto), Hall del edificio (Neural y ascensor), Consultorio (pasillo, consultorio del doctor Vela y cuarto de inducción), Sesión 1 (el sueño de la feria), La primera noche (la vuelta a casa), Pre-sesión 2 (la mañana y la consulta), Sesión 2 (el boletín), La segunda noche, Pre-sesión 3, Sesión 3 (la fiesta), La tercera noche, Pre-sesión 4, Sesión 4 (la pelea), La cuarta noche, Pre-sesión 5, Sesión 5 (el reencuentro) y La quinta noche. Cada locación
        nueva se suma acá. Para probar una locación suelta, entrá a <strong>Casa de Jorge</strong>, <strong>Hall del edificio</strong>, <strong>Consultorio</strong>, <strong>Sesión 1</strong>, <strong>La primera noche</strong>, <strong>Pre-sesión 2</strong>, <strong>Sesión 2</strong>, <strong>La segunda noche</strong>, <strong>Pre-sesión 3</strong>, <strong>Sesión 3</strong>, <strong>La tercera noche</strong>, <strong>Pre-sesión 4</strong>, <strong>Sesión 4</strong>, <strong>La cuarta noche</strong>, <strong>Pre-sesión 5</strong>, <strong>Sesión 5</strong> o <strong>La quinta noche</strong> en el
        menú.
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
          <tr><td>Escaleras</td><td>→ / ↓ bajar · ← / ↑ volver</td></tr>
          <tr><td>Cerrar un panel (candado, diario, documentos)</td><td>Q</td></tr>
          <tr><td>Pantalla completa</td><td>F</td></tr>
        </tbody>
      </table>
      <p className="empty">Gráficos y sonidos provisorios, hechos por código. Solo teclado.</p>
    </article>
  )
}

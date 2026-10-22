import { useEffect, useRef } from 'react'
import type * as Phaser from 'phaser'

export function Level4Page() {
  const ref = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    let cancelled = false
    // Phaser se carga solo al entrar a esta página
    import('../prototype').then(({ createLevel4Game }) => {
      if (!cancelled && ref.current) gameRef.current = createLevel4Game(ref.current)
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
        <span className="section-icon">🎪</span>
        <h1>Prototipo: Sesión 1, el circo</h1>
      </header>
      <p>
        Solo la primera sesión: el sueño lúcido del circo, cuando Jorge se escapó de chico para soltar a un elefante, y el despertar en la camilla
        del doctor Vela (en el prototipo completo, después sigue La primera noche). Ver "Locaciones" → Sesión 1: El circo.
      </p>
      <div className="game-frame" ref={ref} />
      <div className="game-actions">
        <button onClick={() => gameRef.current?.scale.toggleFullscreen()}>⛶ Pantalla completa</button>
        <span className="empty">También con la tecla F. Esc para salir (en Chrome y Edge, mantenelo apretado).</span>
      </div>
      <table>
        <tbody>
          <tr><td>Caminar</td><td>← → o A D</td></tr>
          <tr><td>Examinar / mirarse las manos / subirse</td><td>E</td></tr>
          <tr><td>Avanzar texto</td><td>Espacio, E o Enter</td></tr>
          <tr><td>Agarrar la sortija</td><td>E en el momento justo</td></tr>
          <tr><td>Diario de pistas</td><td>TAB</td></tr>
          <tr><td>Cerrar un panel (candado, diario, documentos)</td><td>Q</td></tr>
          <tr><td>Pantalla completa</td><td>F</td></tr>
        </tbody>
      </table>
      <p className="empty">Gráficos, sonidos y diálogos provisorios. Solo teclado.</p>
    </article>
  )
}

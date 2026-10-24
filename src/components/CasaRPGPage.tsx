import { useEffect, useRef } from 'react'
import type * as Phaser from 'phaser'

export function CasaRPGPage() {
  const ref = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    let cancelled = false
    // Phaser se carga solo al entrar a esta página
    import('../prototype').then(({ createCasaRPGGame }) => {
      if (!cancelled && ref.current) gameRef.current = createCasaRPGGame(ref.current)
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
        <span className="section-icon">🗺️</span>
        <h1>Prototipo: Casa de Jorge, top-down</h1>
      </header>
      <p>
        <strong>En prueba</strong> (sección Prototipos). La primera locación completa, pero vista desde arriba, como un RPG de Game Boy Advance
        (estilo Pokémon): el departamento, las escaleras con los títulos, la calle con el chofer y el viaje por la 9 de Julio hasta Neural. Mismos
        objetos, puzzles y textos que la versión lateral. Ver "Mecánicas" → Ideas a implementar → Vista top-down estilo RPG.
      </p>
      <div className="game-frame" ref={ref} />
      <div className="game-actions">
        <button onClick={() => gameRef.current?.scale.toggleFullscreen()}>⛶ Pantalla completa</button>
        <span className="empty">También con la tecla F. Esc para salir (en Chrome y Edge, mantenelo apretado).</span>
      </div>
      <table>
        <tbody>
          <tr><td>Caminar (por casilleros)</td><td>← ↑ → ↓ o W A S D · un toque corto gira sin caminar</td></tr>
          <tr><td>Examinar lo que tenés enfrente</td><td>E, Espacio o Enter</td></tr>
          <tr><td>Avanzar texto / elegir opción</td><td>Espacio, E o Enter · ↑ ↓ para moverte entre opciones</td></tr>
          <tr><td>Candado</td><td>← → elegir número · ↑ ↓ cambiar · Enter probar · Q salir</td></tr>
          <tr><td>Diario de pistas</td><td>TAB</td></tr>
          <tr><td>Pantalla completa</td><td>F</td></tr>
        </tbody>
      </table>
      <p className="empty">Pixel art, sonidos y algunos textos provisorios, hechos por código.</p>
    </article>
  )
}

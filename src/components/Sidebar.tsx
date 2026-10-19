import { NavLink } from 'react-router-dom'
import { sections } from '../sections'
import { game } from '../game'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-title">{game.title}</span>
        <span className="brand-sub">Game Design Document · v{game.version}</span>
      </div>
      <nav>
        {sections.map((s) => (
          <NavLink
            key={s.id}
            to={`/${s.id}`}
            onClick={onNavigate}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <span className="nav-icon">{s.icon}</span>
            {s.title}
          </NavLink>
        ))}
        <div className="nav-sep" />
        {/* El juego solo, sin el GDD: otra página (juego/index.html), en otra pestaña */}
        <a className="nav-link" href="./juego/" target="_blank" rel="noopener" onClick={onNavigate}>
          <span className="nav-icon">🎮</span>
          Jugar (versión final) ↗
        </a>
        <NavLink
          to="/prototipo"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🕹️</span>
          Prototipo
        </NavLink>
        <NavLink
          to="/casa-de-jorge"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🛏️</span>
          Casa de Jorge
        </NavLink>
        <NavLink
          to="/hall"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🏥</span>
          Hall del edificio
        </NavLink>
        <NavLink
          to="/consultorio"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🩺</span>
          Consultorio
        </NavLink>
        <NavLink
          to="/sesion-1"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🎠</span>
          Sesión 1: La feria
        </NavLink>
        <NavLink
          to="/primera-noche"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌙</span>
          La primera noche
        </NavLink>
        <NavLink
          to="/pre-sesion-2"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">☀️</span>
          Pre-sesión 2
        </NavLink>
        <NavLink
          to="/sesion-2"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">📄</span>
          Sesión 2: El boletín
        </NavLink>
        <NavLink
          to="/segunda-noche"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌘</span>
          La segunda noche
        </NavLink>
        <NavLink
          to="/pre-sesion-3"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌤️</span>
          Pre-sesión 3
        </NavLink>
        <NavLink
          to="/sesion-3"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">💃</span>
          Sesión 3: La fiesta
        </NavLink>
        <NavLink
          to="/tercera-noche"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌌</span>
          La tercera noche
        </NavLink>
        <NavLink
          to="/pre-sesion-4"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌥️</span>
          Pre-sesión 4
        </NavLink>
        <NavLink
          to="/sesion-4"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">💔</span>
          Sesión 4: La pelea
        </NavLink>
        <NavLink
          to="/cuarta-noche"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌑</span>
          La cuarta noche
        </NavLink>
        <NavLink
          to="/pre-sesion-5"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">⛅</span>
          Pre-sesión 5
        </NavLink>
        <NavLink
          to="/sesion-5"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">☔</span>
          Sesión 5: El reencuentro
        </NavLink>
        <NavLink
          to="/quinta-noche"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌒</span>
          La quinta noche
        </NavLink>
        <NavLink
          to="/pre-sesion-6"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌤️</span>
          Pre-sesión 6
        </NavLink>
        <NavLink
          to="/sesion-6"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🏔️</span>
          Sesión 6: El viaje del 12/08
        </NavLink>
        <NavLink
          to="/sexta-noche"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌘</span>
          La sexta noche
        </NavLink>
        <NavLink
          to="/pre-sesion-7"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌄</span>
          Pre-sesión 7
        </NavLink>
        <NavLink
          to="/sesion-7"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🕯️</span>
          Sesión 7: La muerte de su mamá
        </NavLink>
        <NavLink
          to="/septima-noche"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌗</span>
          La séptima noche
        </NavLink>
        <NavLink
          to="/pre-sesion-8"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌁</span>
          Pre-sesión 8
        </NavLink>
        <NavLink
          to="/sesion-8"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🥀</span>
          Sesión 8: El velorio
        </NavLink>
        <NavLink
          to="/octava-noche"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌖</span>
          La octava noche
        </NavLink>
        <NavLink
          to="/pre-sesion-9"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🌅</span>
          Pre-sesión 9
        </NavLink>
        <NavLink
          to="/sesion-9"
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <span className="nav-icon">🚪</span>
          Sesión 9: El baño
        </NavLink>
      </nav>
    </aside>
  )
}

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
      </nav>
    </aside>
  )
}

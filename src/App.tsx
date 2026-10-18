import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { SectionPage } from './components/SectionPage'
import { PrototypePage } from './components/PrototypePage'
import { Level1Page } from './components/Level1Page'
import { Level2Page } from './components/Level2Page'
import { Level3Page } from './components/Level3Page'
import { Level4Page } from './components/Level4Page'
import { Level5Page } from './components/Level5Page'
import { sections } from './sections'

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className={menuOpen ? 'layout menu-open' : 'layout'}>
      <button className="menu-toggle" onClick={() => setMenuOpen((o) => !o)} aria-label="Menú">
        ☰
      </button>
      <Sidebar onNavigate={() => setMenuOpen(false)} />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to={`/${sections[0].id}`} replace />} />
          <Route path="/prototipo" element={<PrototypePage />} />
          <Route path="/casa-de-jorge" element={<Level1Page />} />
          <Route path="/hall" element={<Level2Page />} />
          <Route path="/consultorio" element={<Level3Page />} />
          <Route path="/sesion-1" element={<Level4Page />} />
          <Route path="/primera-noche" element={<Level5Page />} />
          <Route path="/:id" element={<SectionPage />} />
        </Routes>
      </main>
    </div>
  )
}

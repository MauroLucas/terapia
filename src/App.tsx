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
import { Level6Page } from './components/Level6Page'
import { Level7Page } from './components/Level7Page'
import { Level8Page } from './components/Level8Page'
import { Level9Page } from './components/Level9Page'
import { Level10Page } from './components/Level10Page'
import { Level11Page } from './components/Level11Page'
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
          <Route path="/pre-sesion-2" element={<Level7Page />} />
          <Route path="/sesion-2" element={<Level6Page />} />
          <Route path="/segunda-noche" element={<Level8Page />} />
          <Route path="/pre-sesion-3" element={<Level9Page />} />
          <Route path="/sesion-3" element={<Level10Page />} />
          <Route path="/tercera-noche" element={<Level11Page />} />
          <Route path="/:id" element={<SectionPage />} />
        </Routes>
      </main>
    </div>
  )
}

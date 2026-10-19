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
import { Level12Page } from './components/Level12Page'
import { Level13Page } from './components/Level13Page'
import { Level14Page } from './components/Level14Page'
import { Level15Page } from './components/Level15Page'
import { Level16Page } from './components/Level16Page'
import { Level17Page } from './components/Level17Page'
import { Level18Page } from './components/Level18Page'
import { Level19Page } from './components/Level19Page'
import { Level20Page } from './components/Level20Page'
import { Level21Page } from './components/Level21Page'
import { Level22Page } from './components/Level22Page'
import { Level23Page } from './components/Level23Page'
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
          <Route path="/pre-sesion-4" element={<Level12Page />} />
          <Route path="/sesion-4" element={<Level13Page />} />
          <Route path="/cuarta-noche" element={<Level14Page />} />
          <Route path="/pre-sesion-5" element={<Level15Page />} />
          <Route path="/sesion-5" element={<Level16Page />} />
          <Route path="/quinta-noche" element={<Level17Page />} />
          <Route path="/pre-sesion-6" element={<Level18Page />} />
          <Route path="/sesion-6" element={<Level19Page />} />
          <Route path="/sexta-noche" element={<Level20Page />} />
          <Route path="/pre-sesion-7" element={<Level21Page />} />
          <Route path="/sesion-7" element={<Level22Page />} />
          <Route path="/septima-noche" element={<Level23Page />} />
          <Route path="/:id" element={<SectionPage />} />
        </Routes>
      </main>
    </div>
  )
}

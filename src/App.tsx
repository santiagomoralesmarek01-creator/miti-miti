import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { Toasts } from './components/Toasts'
import { GroupPage } from './pages/GroupPage'
import { Groups } from './pages/Groups'
import { Join } from './pages/Join'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Privacy } from './pages/Privacy'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/privacidad" element={<Privacy />} />
        <Route path="/app" element={<RequireAuth><Groups /></RequireAuth>} />
        <Route path="/app/g/:id" element={<RequireAuth><GroupPage /></RequireAuth>} />
        <Route path="/unirse/:code" element={<RequireAuth><Join /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </BrowserRouter>
  )
}

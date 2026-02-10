import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from "./components/login";
import Dashboard from './components/Dashboard'
import ConsultaPublica from './pages/ConsultaPublica' // Importación de la nueva página

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('token', userData.token)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <Router>
      <Routes>
        {/* RUTA PÚBLICA: Se puede ver sin estar logueado */}
        <Route path="/consulta" element={<ConsultaPublica />} />

        {/* RUTA PRINCIPAL: Maneja el Login y el Dashboard */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />

        {/* Redirección por si escriben cualquier otra cosa */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
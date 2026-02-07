import { useState } from 'react'
import { Mail, Lock } from 'lucide-react'
import api from '../services/api'

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [nombre, setNombre] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Por favor completa todos los campos')
      setLoading(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido')
      setLoading(false)
      return
    }

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const payload = isRegister 
        ? { nombre, email, password }
        : { email, password }

      const response = await api.post(endpoint, payload)

      if (response.data.success) {
        if (!isRegister) {
          localStorage.setItem('token', response.data.token)
          onLoginSuccess({
            id: response.data.user.id,
            name: response.data.user.name,
            email: response.data.user.email,
            token: response.data.token,
          })
        } else {
          setError('')
          setEmail('')
          setPassword('')
          setNombre('')
          setIsRegister(false)
          setError('✓ Usuario registrado. Inicia sesión ahora')
          setTimeout(() => setError(''), 3000)
        }
      } else {
        setError(response.data.message || 'Error en autenticación')
      }
    } catch (err) {
      setError('Error al conectar con el servidor')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const containerStyle = {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#24303c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  const cardStyle = {
    backgroundColor: '#f9f9f9',
    borderRadius: '50px',
    maxWidth: '380px',
    width: '100%',
    padding: '60px 40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    boxSizing: 'border-box',
  }

  const logoContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '40px',
  }

  const logoStyle = {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#000',
    border: '3px solid #b8944d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontFamily: 'Georgia, serif',
    color: '#b8944d',
    fontWeight: 'bold',
  }

  const titleStyle = {
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#000',
  }

  const subtitleStyle = {
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
    marginBottom: '30px',
  }

  const formGroupStyle = {
    marginBottom: '20px',
  }

  const inputContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: '25px',
    border: '1px solid #e0e0e0',
    padding: '0 16px',
    boxSizing: 'border-box',
  }

  const inputStyle = {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '14px 12px',
    fontSize: '14px',
    backgroundColor: 'transparent',
    boxSizing: 'border-box',
  }

  const buttonStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '25px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    background: 'linear-gradient(90deg, #b8944d 0%, #d4af85 100%)',
    color: '#000',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    marginTop: '20px',
    transition: 'all 0.3s ease',
  }

  const errorStyle = {
    backgroundColor: error.includes('✓') ? '#dcfce7' : '#fee',
    color: error.includes('✓') ? '#166534' : '#c33',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
    textAlign: 'center',
  }

  const toggleStyle = {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '13px',
    color: '#666',
  }

  const toggleLinkStyle = {
    color: '#b8944d',
    cursor: 'pointer',
    fontWeight: 'bold',
    textDecoration: 'none',
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoContainerStyle}>
          <div style={logoStyle}>F&S</div>
        </div>

        <div style={titleStyle}>F&S Inmobiliaria</div>
        <div style={subtitleStyle}>Gestión Inmobiliaria de Lujo</div>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={formGroupStyle}>
              <div style={inputContainerStyle}>
                <input
                  type="text"
                  placeholder="Nombre Completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          <div style={formGroupStyle}>
            <div style={inputContainerStyle}>
              <Mail size={20} color="#b8944d" style={{ marginRight: '8px' }} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={formGroupStyle}>
            <div style={inputContainerStyle}>
              <Lock size={20} color="#b8944d" style={{ marginRight: '8px' }} />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)'
            }}
            disabled={loading}
          >
            {loading ? (isRegister ? 'REGISTRANDO...' : 'AUTENTICANDO...') : (isRegister ? 'REGISTRARSE' : 'ACCEDER')}
          </button>
        </form>

        <div style={toggleStyle}>
          {isRegister ? (
            <>¿Ya tienes cuenta? <span style={toggleLinkStyle} onClick={() => setIsRegister(false)}>Inicia sesión</span></>
          ) : (
            <>¿No tienes cuenta? <span style={toggleLinkStyle} onClick={() => setIsRegister(true)}>Regístrate</span></>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#999' }}>
          © 2026 F&S Inmobiliaria
        </div>
      </div>
    </div>
  )
}

export default Login
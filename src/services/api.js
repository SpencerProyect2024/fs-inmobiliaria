import axios from 'axios'

const api = axios.create({
  // Asegúrate de que este link sea el de tu BACKEND (el que maneja la DB)
  baseURL: 'https://fs-inmobiliaria.onrender.com/api', 
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token (Indispensable para el Login)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export default api
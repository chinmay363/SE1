import { useState, useEffect } from 'react'
import axios from 'axios'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUserProfile()
    }
  }, [token])

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get('/auth/profile')
      setUser(res.data.data)
    } catch (err) {
      handleLogout()
    }
  }

  const handleLogin = (newToken, userData) => {
    setToken(newToken)
    setUser(userData)
    localStorage.setItem('token', newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <Dashboard user={user} onLogout={handleLogout} />
    </div>
  )
}

export default App

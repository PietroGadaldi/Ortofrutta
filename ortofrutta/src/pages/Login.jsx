import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as authService from '../services/authService'
import { validateEmail, validatePassword } from '../utils/validators'
import { RUOLI } from '../utils/constants'

export function Login() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already logged in - use useEffect to avoid render issues
  useEffect(() => {
    if (!loading && user) {
      navigate('/')
    }
  }, [user, loading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim()) {
      setError('Inserisci email o nome utente')
      return
    }
    if (!validatePassword(password)) {
      setError('Password deve avere almeno 6 caratteri')
      return
    }

    setIsLoading(true)
    try {
      let loggedInUser = null
      let loginError = null

      // Determina se l'input è una mail
      if (validateEmail(identifier)) {
        // Login standard tramite email
        const result = await authService.signInWithPassword(identifier, password)
        loggedInUser = result.user
        loginError = result.error
      } else {
        // Login tramite nome utente via Netlify Function
        const response = await fetch(`/.netlify/functions/login-by-username`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: identifier, password })
        })
        const result = await response.json()
        if (!response.ok) {
          loginError = { message: result.error || 'Errore durante il login' }
        } else {
          // Importante: dobbiamo settare la sessione manualmente nel client Supabase
          const { supabase } = await import('../services/supabaseClient')
          const { error: setSessionError } = await supabase.auth.setSession(result.session)
          if (setSessionError) {
            loginError = setSessionError
          } else {
            loggedInUser = result.user
          }
        }
      }

      if (loginError) {
        setError(loginError.message || 'Errore durante il login')
        return
      }

      if (loggedInUser) {
        // Get user profile to determine redirect
        const { role } = await authService.getCurrentUserProfile(loggedInUser)
        
        // Log role
        if (role === RUOLI.TITOLARE) {
          console.log('✅ Login effettuato come Titolare')
          navigate('/admin')
        } else {
          console.log('✅ Login effettuato come Cliente')
          navigate('/dashboard')
        }
      }
    } catch (err) {
      setError(err.message || 'Errore sconosciuto')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white min-[900px]:bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] min-[900px]:from-green-300 min-[900px]:via-white min-[900px]:via-60% min-[900px]:to-white px-4">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin">
              <div className="h-16 w-16 border-4 border-green-300 border-t-green-600 rounded-full"></div>
            </div>
          </div>
          <p className="text-green-700 font-bold text-lg">Verifica sessione...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-white min-[900px]:bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] min-[900px]:from-green-300 min-[900px]:via-white min-[900px]:via-60% min-[900px]:to-white px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img src="/Ortofrutta.png" alt="Ortofrutta Logo" className="h-24 w-24 mx-auto mb-3 drop-shadow-lg" />
            <h1 className="text-4xl font-black text-black">Ortofrutta Brescia</h1>
            <p className="text-green-900 mt-2 font-semibold">Accedi al tuo account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-lg text-red-900 text-sm font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-black mb-2 text-left">
                Email o Nome Utente
              </label>
              <input
                id="email"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition text-black font-semibold"
                placeholder="Email o Nome"
                disabled={isLoading}
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-black mb-2 text-left">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition text-black font-semibold pr-12"
                  placeholder={showPassword ? 'Password' : '••••••'}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition shadow-sm border border-green-200"
                  title={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? '🔓' : '🔒'}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100 text-lg"
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-green-300 text-center text-sm text-black font-semibold">
            <p className="mb-1">Non hai un account?</p>
            <a 
              href="https://wa.me/393888005812" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-700 hover:text-green-900 hover:underline inline-flex items-center gap-1"
            >
              💬 Contatta il titolare per registrarti.
            </a>
          </div>

          {/* Link back */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-green-700 hover:text-green-900 font-bold hover:underline">
              Torna alla home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as authService from '../services/authService'
import { validateEmail, validatePassword } from '../utils/validators'
import { RUOLI } from '../utils/constants'
import { IconEye, IconEyeOff, IconWhatsApp } from '../components/icons'

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
      <div className="w-full min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Verifica sessione...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex items-center justify-center px-1 py-8 sm:py-14">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-7">
            <img src="/Ortofrutta.png" alt="Ortofrutta Logo" className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Ortofrutta Brescia</h1>
            <p className="text-sm text-slate-500 mt-1.5">Accedi al tuo account per gestire gli ordini</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="alert-error mb-5">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="label">
                Email o nome utente
              </label>
              <input
                id="email"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="input"
                placeholder="Email o nome utente"
                disabled={isLoading}
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                  title={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-base"
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-7 pt-5 border-t border-slate-200 text-center text-sm text-slate-500">
            <p className="mb-1.5">Non hai un account?</p>
            <a
              href="https://wa.me/393888005812"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-verde-orto-700 hover:text-verde-orto-800 hover:underline"
            >
              <IconWhatsApp className="w-4 h-4" />
              Contatta il titolare per registrarti
            </a>
          </div>

          {/* Link back */}
          <div className="mt-5 text-center">
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-700 hover:underline">
              ← Torna alla home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as authService from '../services/authService'
import { validateEmail, validatePassword } from '../utils/validators'
import { RUOLI } from '../utils/constants'

export function Login() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already logged in - use useEffect to avoid render issues
  useEffect(() => {
    if (!loading && user) {
      navigate('/')
    }
  }, [user, loading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate
    if (!validateEmail(email)) {
      setError('Email non valida')
      return
    }

    if (!validatePassword(password)) {
      setError('Password deve avere almeno 6 caratteri')
      return
    }

    setIsLoading(true)

    try {
      const { user: loggedInUser, error: loginError } =
        await authService.signInWithPassword(email, password)

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-verde-orto-50 to-white px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🥬</div>
            <h1 className="text-3xl font-bold text-gray-900">Ortofrutta Brescia</h1>
            <p className="text-gray-600 mt-2">Accedi al tuo account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-orto-500 focus:border-transparent outline-none transition"
                placeholder="tuo@email.com"
                disabled={isLoading}
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-orto-500 focus:border-transparent outline-none transition"
                placeholder="••••••"
                disabled={isLoading}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-verde-orto-600 text-white rounded-lg font-semibold hover:bg-verde-orto-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>
              Non hai un account?{' '}
              <span className="text-gray-500">
                Contatta il titolare per registrarti.
              </span>
            </p>
          </div>

          {/* Link back */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-verde-orto-600 hover:text-verde-orto-700 font-semibold">
              ← Torna alla home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

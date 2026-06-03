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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 via-green-50 to-white px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img src="/Ortofrutta.png" alt="Ortofrutta Logo" className="h-24 w-24 mx-auto mb-3 rounded-lg shadow-lg" />
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
                📧 Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition text-black font-semibold"
                placeholder="tuo@email.com"
                disabled={isLoading}
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-black mb-2 text-left">
                🔐 Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition text-black font-semibold"
                placeholder="••••••"
                disabled={isLoading}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100 text-lg"
            >
              {isLoading ? '⏳ Accesso in corso...' : '✅ Accedi'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-green-300 text-center text-sm text-black font-semibold">
            <p>
              Non hai un account?{' '}
              <span className="text-green-700">
                Contatta il titolare per registrarti.
              </span>
            </p>
          </div>

          {/* Link back */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-green-700 hover:text-green-900 font-bold hover:underline">
              ← Torna alla home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

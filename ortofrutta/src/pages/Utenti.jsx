import { useState } from 'react'
import { validateEmail } from '../utils/validators'

export function Utenti() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ruolo, setRuolo] = useState('cliente')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!nome.trim()) {
      setError('Il nome è obbligatorio')
      return
    }

    if (!validateEmail(email)) {
      setError('Email non valida')
      return
    }

    if (!password || password.length < 6) {
      setError('Password deve avere almeno 6 caratteri')
      return
    }

    setIsSubmitting(true)

    try {
      // Call Netlify Function to create user
      const response = await fetch(
        import.meta.env.VITE_NETLIFY_FUNCTIONS_URL + '/create-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({
            email,
            password,
            nome,
            ruolo,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore nella creazione account')
      }

      setSuccess(`Account creato con successo per ${email}`)
      setNome('')
      setEmail('')
      setPassword('')
      setRuolo('cliente')
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to get auth token
  const getAuthToken = async () => {
    const { supabase } = await import('../services/supabaseClient')
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || ''
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">👤 Utenti</h1>
        <p className="text-gray-600 mt-2">Crea nuovi account per clienti e titolari.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">➕ Crea Nuovo Account</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-orto-500 outline-none"
              placeholder="Nome completo"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-orto-500 outline-none"
              placeholder="email@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-orto-500 outline-none"
              placeholder="Min. 6 caratteri"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ruolo</label>
            <select
              value={ruolo}
              onChange={(e) => setRuolo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-orto-500 outline-none"
              disabled={isSubmitting}
            >
              <option value="cliente">Cliente</option>
              <option value="titolare">Titolare</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-verde-orto-600 text-white rounded-lg font-semibold hover:bg-verde-orto-700 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Creazione in corso...' : 'Crea Account'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Utenti

import { useState, useEffect } from 'react'
import { validateEmail } from '../utils/validators'
import { getClientList } from '../services/profiliService'

export function Utenti() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ruolo, setRuolo] = useState('cliente')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Clients list state
  const [clienti, setClienti] = useState([])
  const [loadingClienti, setLoadingClienti] = useState(true)
  const [errorClienti, setErrorClienti] = useState('')

  // Load clients on mount
  useEffect(() => {
    fetchClienti()
  }, [])

  // Helper to fetch clients
  const fetchClienti = async () => {
    setLoadingClienti(true)
    setErrorClienti('')
    try {
      const { data, error } = await getClientList()
      if (error) {
        setErrorClienti(error.message)
        setClienti([])
      } else {
        setClienti(data || [])
      }
    } catch (err) {
      setErrorClienti('Errore nel caricamento dei clienti')
      console.error(err)
    } finally {
      setLoadingClienti(false)
    }
  }

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
      
      // Refresh clients list
      await fetchClienti()
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-8 shadow-xl">
        <h1 className="text-4xl font-black mb-2">👤 Gestione Utenti</h1>
        <p className="text-blue-100 text-lg font-semibold">Crea nuovi account per clienti e titolari</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-2">
            <span className="text-3xl">➕</span> Crea Nuovo Account
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-lg text-red-900 text-sm font-semibold">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 rounded-lg text-green-900 text-sm font-semibold">
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-black mb-2 text-left">👤 Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-black font-semibold"
                placeholder="Nome completo"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 text-left">📧 Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-black font-semibold"
                placeholder="email@example.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 text-left">🔐 Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-black font-semibold"
                placeholder="Min. 6 caratteri"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 text-left">👑 Ruolo</label>
              <select
                value={ruolo}
                onChange={(e) => setRuolo(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-black font-semibold"
                disabled={isSubmitting}
              >
                <option value="cliente">👤 Cliente</option>
                <option value="titolare">🏪 Titolare</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100 text-lg"
            >
              {isSubmitting ? '⏳ Creazione in corso...' : '✅ Crea Account'}
            </button>
          </form>
        </div>

        {/* Clients List */}
        <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black flex items-center gap-2">
              <span className="text-3xl">📋</span> Clienti ({clienti.length})
            </h2>
            <button
              onClick={fetchClienti}
              disabled={loadingClienti}
              className="px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition disabled:from-gray-400 disabled:to-gray-500 shadow-md hover:scale-105 disabled:hover:scale-100"
            >
              🔄 Aggiorna
            </button>
          </div>

          {errorClienti && (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 rounded-lg text-red-900 text-sm mb-4 font-semibold">
              ⚠️ {errorClienti}
            </div>
          )}

          {loadingClienti ? (
            <div className="text-black font-semibold">⏳ Caricamento...</div>
          ) : clienti.length === 0 ? (
            <div className="text-black font-semibold italic">❌ Nessun cliente creato ancora</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {clienti.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-4 bg-white border-2 border-green-300 rounded-lg shadow-sm hover:shadow-md hover:border-green-400 transition"
                >
                  <div className="flex-1">
                    <p className="font-bold text-black text-left">{cliente.nome}</p>
                    <p className="text-xs text-green-700 mt-1 font-semibold text-left">{cliente.id}</p>
                  </div>
                  <span className="ml-4 px-3 py-1 text-xs bg-gradient-to-r from-green-200 to-green-100 text-green-900 rounded-full font-bold">
                    {cliente.ruolo === 'cliente' ? '👤 Cliente' : '🏪 Titolare'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Utenti

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
  const [isModifying, setIsModifying] = useState(false)
  const [modifyingUserId, setModifyingUserId] = useState(null)
  
  const [showPassword, setShowPassword] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState(new Set())

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  // Clients list state
  const [clienti, setClienti] = useState([])
  const [loadingClienti, setLoadingClienti] = useState(true)
  const [errorClienti, setErrorClienti] = useState('')
  const [viewingRole, setViewingRole] = useState('cliente')
  const [mobileTab, setMobileTab] = useState('lista')
  const [filterNome, setFilterNome] = useState('')

  // Blocca scroll del body quando il modal di eliminazione è aperto (iOS fix)
  useEffect(() => {
    if (showDeleteModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showDeleteModal])

  // Load clients on mount
  useEffect(() => {
    fetchClienti(viewingRole)
  }, [])

  // Helper to fetch clients
  const fetchClienti = async (role = viewingRole) => {
    setLoadingClienti(true)
    setErrorClienti('')
    try {
      const token = await getAuthToken()
      const url = `/.netlify/functions/list-clients?role=${role}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Errore nel caricamento della lista')
      }
      setClienti(result.clients || [])
    } catch (err) {
      setErrorClienti('Errore nel caricamento dei clienti')
      console.error(err)
    } finally {
      setLoadingClienti(false)
    }
  }

  const toggleRole = () => {
    const newRole = viewingRole === 'cliente' ? 'titolare' : 'cliente'
    setViewingRole(newRole)
    setFilterNome('')
    fetchClienti(newRole)
  }

  const clientiFiltrati = filterNome.trim()
    ? clienti
        .filter(c => c.nome.toLowerCase().includes(filterNome.toLowerCase()))
        .sort((a, b) => {
          const term = filterNome.toLowerCase()
          const aStarts = a.nome.toLowerCase().startsWith(term)
          const bStarts = b.nome.toLowerCase().startsWith(term)
          if (aStarts && !bStarts) return -1
          if (!aStarts && bStarts) return 1
          return a.nome.localeCompare(b.nome)
        })
    : clienti

  const handleConfirmDelete = async () => {
    if (!userToDelete) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const response = await fetch(
        '/.netlify/functions/delete-user',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({ userId: userToDelete.id }),
        }
      )

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Errore del server (${response.status})`);
      }

      if (!response.ok) throw new Error(data?.error || 'Errore durante l\'eliminazione')

      setSuccess(`Utente ${userToDelete.nome} eliminato correttamente`)
      setShowDeleteModal(false)
      setUserToDelete(null)
      fetchClienti(viewingRole)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditUser = (cliente) => {
    setNome(cliente.nome)
    // Non pre-compilare email placeholder interne
    const realEmail = cliente.email && !cliente.email.endsWith('@noreply.internal') ? cliente.email : ''
    setEmail(realEmail)
    setPassword('') // La password rimane vuota in modifica
    setRuolo(cliente.ruolo)
    setIsModifying(true)
    setModifyingUserId(cliente.id)
    setError('')
    setSuccess('')
    setMobileTab('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const togglePasswordVisibility = (clienteId) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev)
      if (next.has(clienteId)) {
        next.delete(clienteId)
      } else {
        next.add(clienteId)
      }
      return next
    })
  }

  const resetForm = () => {
    setNome('')
    setEmail('')
    setPassword('')
    setRuolo('cliente')
    setIsModifying(false)
    setModifyingUserId(null)
    setShowPassword(false)
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

    // Email facoltativa, ma se inserita deve essere valida
    if (email.trim() && !validateEmail(email)) {
      setError('Formato email non valido')
      return
    }

    // Password obbligatoria solo in creazione
    if (!isModifying && (!password || password.length < 6)) {
      setError('La password è obbligatoria (minimo 6 caratteri)')
      return
    } else if (isModifying && password && password.length < 6) {
      setError('La nuova password deve avere almeno 6 caratteri')
      return
    }

    setIsSubmitting(true)

    try {
      const functionPath = isModifying ? '/.netlify/functions/update-user' : '/.netlify/functions/create-user'
      const method = isModifying ? 'PATCH' : 'POST'
      
      const response = await fetch(
        functionPath,
        {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({
            userId: modifyingUserId,
            email,
            password: password || undefined, // Invia la password solo se scritta
            nome,
            ruolo,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore nel salvataggio account')
      }

      setSuccess(isModifying ? `Account di ${nome} aggiornato con successo` : `Account creato per ${nome}`)
      resetForm()
      setMobileTab('lista')

      // Refresh clients list
      await fetchClienti(viewingRole)
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

  if (loadingClienti && clienti.length === 0) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin">
              <div className="h-16 w-16 border-4 border-blue-300 border-t-blue-600 rounded-full"></div>
            </div>
          </div>
          <p className="text-blue-700 font-bold text-lg">Caricamento utenti...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-8 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 shadow-xl">
        <h1 className="text-2xl sm:text-4xl font-black mb-2">👤 Gestione Utenti</h1>
        <p className="text-blue-100 text-sm sm:text-lg font-semibold">Crea nuovi account per clienti e titolari</p>
      </div>

      {/* Tab mobile */}
      <div className="flex md:hidden rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
        <button
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-3 font-bold text-sm transition-all ${
            mobileTab === 'form'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {isModifying ? '📝 Modifica' : '➕ Crea Account'}
        </button>
        <button
          onClick={() => setMobileTab('lista')}
          className={`flex-1 py-3 font-bold text-sm transition-all ${
            mobileTab === 'lista'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          📋 {viewingRole === 'cliente' ? 'Clienti' : 'Titolari'} ({clienti.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        {/* Form */}
        <div className={`${mobileTab === 'form' ? 'block' : 'hidden'} md:block min-w-0 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl shadow-lg p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-black flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">{isModifying ? '📝' : '➕'}</span>
              {isModifying ? 'Modifica Account' : 'Crea Nuovo Account'}
            </h2>
            {isModifying && (
              <button
                onClick={() => { resetForm(); setMobileTab('lista') }}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 transition shadow-md hover:scale-105 active:scale-95"
              >
                ✖ Annulla
              </button>
            )}
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-100 border-l-4 border-red-500 rounded-lg text-red-900 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="mb-3 p-3 bg-green-100 border-l-4 border-green-500 rounded-lg text-green-900 text-xs font-semibold">
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-black mb-2 text-left">👤 Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-black font-semibold text-base"
                placeholder="Nome completo"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 text-left">
                📧 Email
                <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">facoltativa</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-black font-semibold text-base"
                placeholder="Può essere aggiunta in seguito"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 text-left">🔐 Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-black font-semibold text-base"
                  placeholder={isModifying ? "Lascia vuoto per non cambiare" : "Min. 6 caratteri"}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition shadow-sm border border-blue-200"
                  title={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? '🔓' : '🔒'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2 text-left">👑 Ruolo</label>
              <select
                value={ruolo}
                onChange={(e) => setRuolo(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-black font-semibold text-base"
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
              {isSubmitting ? '⏳ Salvataggio...' : isModifying ? '💾 Aggiorna Account' : '✅ Crea Account'}
            </button>
          </form>
        </div>

        {/* Clients List */}
        <div className={`${mobileTab === 'lista' ? 'block' : 'hidden'} md:block min-w-0 bg-gradient-to-br from-white to-green-50 border-2 border-green-300 rounded-xl shadow-lg p-6`}>
          <div className="flex justify-between items-center mb-4 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-black flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">📋</span> {viewingRole === 'cliente' ? 'Clienti' : 'Titolari'} ({clientiFiltrati.length}{filterNome ? `/${clienti.length}` : ''})
            </h2>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={toggleRole}
                disabled={loadingClienti}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition disabled:from-gray-400 disabled:to-gray-500 shadow-md hover:scale-105 disabled:hover:scale-100"
              >
                {viewingRole === 'cliente' ? '👑 Titolari' : '👤 Clienti'}
              </button>
              <button
                onClick={() => fetchClienti(viewingRole)}
                disabled={loadingClienti}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition disabled:from-gray-400 disabled:to-gray-500 shadow-md hover:scale-105 disabled:hover:scale-100"
              >
                🔄
              </button>
            </div>
          </div>

          {errorClienti && (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 rounded-lg text-red-900 text-sm mb-4 font-semibold">
              ⚠️ {errorClienti}
            </div>
          )}

          {!loadingClienti && clienti.length > 0 && (
            <div className="mb-3">
              <input
                type="text"
                placeholder="🔍 Cerca per nome..."
                value={filterNome}
                onChange={(e) => setFilterNome(e.target.value)}
                className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:border-green-600 text-gray-800 placeholder-gray-500 text-base font-semibold"
              />
            </div>
          )}

          {loadingClienti ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin">
                    <div className="h-12 w-12 border-4 border-blue-300 border-t-blue-600 rounded-full"></div>
                  </div>
                </div>
                <p className="text-blue-700 font-bold">Caricamento...</p>
              </div>
            </div>
          ) : clienti.length === 0 ? (
            <div className="text-black font-semibold italic">❌ Nessun {viewingRole === 'cliente' ? 'cliente' : 'titolare'} creato ancora</div>
          ) : clientiFiltrati.length === 0 ? (
            <div className="text-black font-semibold italic">❌ Nessun risultato per "{filterNome}"</div>
          ) : (
            <div className="space-y-2 max-h-[62vh] overflow-y-auto md:max-h-[500px] overscroll-contain pr-2" style={{ WebkitOverflowScrolling: 'touch' }}>
              {clientiFiltrati.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-4 bg-white border-2 border-green-300 rounded-lg shadow-sm hover:shadow-md hover:border-green-400 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-black text-left truncate">{cliente.nome}</p>
                    {cliente.email && !cliente.email.endsWith('@noreply.internal') ? (
                      <p className="text-xs text-green-700 mt-0.5 font-semibold text-left truncate">{cliente.email}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5 italic text-left">Nessuna email</p>
                    )}
                    {cliente.password_plain && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs font-mono text-gray-700">
                          {visiblePasswords.has(cliente.id) ? cliente.password_plain : '••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(cliente.id)}
                          className="text-xs text-gray-400 hover:text-gray-700 transition leading-none"
                          title={visiblePasswords.has(cliente.id) ? 'Nascondi password' : 'Mostra password'}
                        >
                          {visiblePasswords.has(cliente.id) ? '🔓' : '🔒'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="hidden sm:inline px-3 py-1 text-xs bg-gradient-to-r from-green-200 to-green-100 text-green-900 rounded-full font-bold">
                      {cliente.ruolo === 'cliente' ? '👤 Cliente' : '🏪 Titolare'}
                    </span>
                    <button
                      onClick={() => handleEditUser(cliente)}
                      className="bg-blue-100 text-blue-600 rounded text-sm font-semibold hover:bg-blue-200 transition flex items-center justify-center"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(cliente)
                        setShowDeleteModal(true)
                      }}
                      className="bg-red-100 text-red-600 rounded text-sm font-semibold hover:bg-red-200 transition flex items-center justify-center"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal di Conferma Eliminazione */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-red-300">
            <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2 text-left">
              ⚠️ Conferma Eliminazione
            </h3>
            <p className="text-gray-700 mb-4 text-left">
              Sei sicuro di voler eliminare l'utente <strong>{userToDelete?.nome}</strong>
              {userToDelete?.email && !userToDelete.email.endsWith('@noreply.internal') && (
                <> ({userToDelete.email})</>
              )}?
            </p>
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-6">
              <p className="text-xs text-red-800 font-bold text-left">
                ATTENZIONE: Questa operazione è irreversibile e rimuoverà permanentemente il profilo e TUTTI gli ordini associati a questo utente dal database.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setUserToDelete(null)
                }}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
              >
                {isSubmitting ? 'Eliminazione...' : 'Sì, Elimina Tutto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Utenti

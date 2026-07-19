import { useState, useEffect } from 'react'
import { validateEmail } from '../utils/validators'
import { getClientList } from '../services/profiliService'
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock'
import { NoticeModal } from '../components/NoticeModal'
import { IconPlus, IconPencil, IconTrash, IconRefresh, IconSearch, IconUsers, IconEye, IconEyeOff, IconAlertTriangle } from '../components/icons'

export function Utenti() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ruolo, setRuolo] = useState('cliente')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  // Popup di conferma operazioni riuscite: { title, message }
  const [notice, setNotice] = useState(null)
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

  // Blocca scroll del body quando il modal di eliminazione è aperto (iOS fix:
  // position:fixed sul body, altrimenti su iPhone la pagina dietro scorre)
  useEffect(() => {
    if (showDeleteModal) {
      lockBodyScroll()
      return () => unlockBodyScroll()
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

      setNotice({
        title: 'Utente eliminato!',
        message: `L'account di ${userToDelete.nome} e tutti i suoi ordini sono stati eliminati.`,
      })
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

      setNotice(
        isModifying
          ? { title: 'Account aggiornato!', message: `Le modifiche all'account di ${nome} sono state salvate con successo.` }
          : { title: 'Account creato!', message: `L'account per ${nome} è stato creato con successo.` }
      )
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
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Caricamento utenti...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="page-title">Gestione utenti</h1>
        <p className="page-subtitle">Crea nuovi account per clienti e titolari</p>
      </div>

      {/* Tab mobile */}
      <div className="flex md:hidden rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm p-1 gap-1">
        <button
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-colors ${
            mobileTab === 'form'
              ? 'bg-verde-orto-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          {isModifying ? 'Modifica' : 'Crea account'}
        </button>
        <button
          onClick={() => setMobileTab('lista')}
          className={`flex-1 py-2.5 rounded-md font-semibold text-sm transition-colors ${
            mobileTab === 'lista'
              ? 'bg-verde-orto-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          {viewingRole === 'cliente' ? 'Clienti' : 'Titolari'} ({clienti.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Form */}
        <div className={`${mobileTab === 'form' ? 'block' : 'hidden'} md:block min-w-0 card p-4 sm:p-6`}>
          <div className="flex justify-between items-center mb-5 gap-2">
            <h2 className="section-title flex items-center gap-2">
              {isModifying ? <IconPencil className="w-5 h-5 text-verde-orto-600" /> : <IconPlus className="w-5 h-5 text-verde-orto-600" />}
              {isModifying ? 'Modifica account' : 'Nuovo account'}
            </h2>
            {isModifying && (
              <button
                onClick={() => { resetForm(); setMobileTab('lista') }}
                className="btn-secondary px-3 py-2 text-sm"
              >
                Annulla
              </button>
            )}
          </div>

          {error && (
            <div className="alert-error mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input"
                placeholder="Nome completo"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="label">
                Email
                <span className="ml-2 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">facoltativa</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="Può essere aggiunta in seguito"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                  placeholder={isModifying ? "Lascia vuoto per non cambiare" : "Min. 6 caratteri"}
                  disabled={isSubmitting}
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

            <div>
              <label className="label">Ruolo</label>
              <select
                value={ruolo}
                onChange={(e) => setRuolo(e.target.value)}
                className="input"
                disabled={isSubmitting}
              >
                <option value="cliente">Cliente</option>
                <option value="titolare">Titolare</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3"
            >
              {isSubmitting ? 'Salvataggio...' : isModifying ? 'Aggiorna account' : 'Crea account'}
            </button>
          </form>
        </div>

        {/* Clients List */}
        <div className={`${mobileTab === 'lista' ? 'block' : 'hidden'} md:block min-w-0 card p-4 sm:p-6`}>
          <div className="flex justify-between items-center mb-5 gap-2">
            <h2 className="section-title flex items-center gap-2 min-w-0">
              <IconUsers className="w-5 h-5 text-verde-orto-600 flex-shrink-0" />
              <span className="truncate">{viewingRole === 'cliente' ? 'Clienti' : 'Titolari'} ({clientiFiltrati.length}{filterNome ? `/${clienti.length}` : ''})</span>
            </h2>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={toggleRole}
                disabled={loadingClienti}
                className="btn-secondary px-2.5 sm:px-3 py-2 text-xs sm:text-sm"
              >
                {viewingRole === 'cliente' ? 'Vedi titolari' : 'Vedi clienti'}
              </button>
              <button
                onClick={() => fetchClienti(viewingRole)}
                disabled={loadingClienti}
                className="btn-icon border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 shadow-sm disabled:opacity-50"
                title="Aggiorna lista"
              >
                <IconRefresh className={`w-4 h-4 ${loadingClienti ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {errorClienti && (
            <div className="alert-error mb-4">
              {errorClienti}
            </div>
          )}

          {!loadingClienti && clienti.length > 0 && (
            <div className="mb-3 relative">
              <IconSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cerca per nome..."
                value={filterNome}
                onChange={(e) => setFilterNome(e.target.value)}
                className="input pl-9 py-2"
              />
            </div>
          )}

          {loadingClienti ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="spinner mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium">Caricamento...</p>
              </div>
            </div>
          ) : clienti.length === 0 ? (
            <div className="text-slate-500 font-medium italic">Nessun {viewingRole === 'cliente' ? 'cliente' : 'titolare'} creato ancora</div>
          ) : clientiFiltrati.length === 0 ? (
            <div className="text-slate-500 font-medium italic">Nessun risultato per "{filterNome}"</div>
          ) : (
            <div className="space-y-2 max-h-[62vh] overflow-y-auto md:max-h-[500px] overscroll-contain pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              {clientiFiltrati.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm text-left truncate uppercase">{cliente.nome}</p>
                    {cliente.email && !cliente.email.endsWith('@noreply.internal') ? (
                      <p className="text-xs text-slate-500 mt-0.5 font-medium text-left truncate">{cliente.email}</p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5 italic text-left">Nessuna email</p>
                    )}
                    {cliente.password_plain && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-mono text-slate-600">
                          {visiblePasswords.has(cliente.id) ? cliente.password_plain : '••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(cliente.id)}
                          className="text-slate-400 hover:text-slate-600 transition-colors leading-none"
                          title={visiblePasswords.has(cliente.id) ? 'Nascondi password' : 'Mostra password'}
                        >
                          {visiblePasswords.has(cliente.id) ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`hidden sm:inline-flex ${cliente.ruolo === 'cliente' ? 'badge-slate' : 'badge-green'}`}>
                      {cliente.ruolo === 'cliente' ? 'Cliente' : 'Titolare'}
                    </span>
                    <button
                      onClick={() => handleEditUser(cliente)}
                      className="btn-icon text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                      title="Modifica utente"
                    >
                      <IconPencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(cliente)
                        setShowDeleteModal(true)
                      }}
                      className="btn-icon text-slate-400 hover:text-red-600 hover:bg-red-50"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                      title="Elimina utente"
                    >
                      <IconTrash className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2 text-left">
              <IconAlertTriangle className="w-5 h-5 text-red-600" />
              Conferma eliminazione
            </h3>
            <p className="text-sm text-slate-600 mb-4 text-left">
              Sei sicuro di voler eliminare l'utente <strong className="text-slate-900">{userToDelete?.nome}</strong>
              {userToDelete?.email && !userToDelete.email.endsWith('@noreply.internal') && (
                <> ({userToDelete.email})</>
              )}?
            </p>
            <div className="alert-error mb-6">
              <p className="text-xs font-semibold">
                ATTENZIONE: questa operazione è irreversibile e rimuoverà permanentemente il profilo e TUTTI gli ordini associati a questo utente dal database.
              </p>
            </div>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setUserToDelete(null)
                }}
                className="btn-ghost px-4 py-2 text-sm"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="btn-danger px-4 py-2 text-sm"
              >
                {isSubmitting ? 'Eliminazione...' : 'Sì, elimina tutto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup di conferma operazioni riuscite */}
      <NoticeModal
        isOpen={!!notice}
        onClose={() => setNotice(null)}
        variant="success"
        title={notice?.title}
        message={notice?.message}
        closeLabel="Chiudi"
      />
    </div>
  )
}

export default Utenti

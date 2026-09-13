import { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * FooterReadyContext
 * Il footer deve comparire solo quando la pagina corrente ha finito di
 * caricare (niente footer sotto gli spinner, soprattutto da mobile).
 * Ogni pagina segnala di essere pronta con useFooterReady(isReady);
 * memorizziamo la chiave della navigazione (location.key, unica per ogni
 * spostamento, anche verso una pagina già visitata): così tornando su una
 * pagina il footer resta nascosto finché quella non ha ricaricato i dati.
 */
const FooterReadyContext = createContext({ readyKey: null, setReadyKey: () => {} })

export function FooterReadyProvider({ children }) {
  const [readyKey, setReadyKey] = useState(null)

  return (
    <FooterReadyContext.Provider value={{ readyKey, setReadyKey }}>
      {children}
    </FooterReadyContext.Provider>
  )
}

/**
 * Da chiamare in cima a ogni pagina che mostra il footer.
 * @param {boolean} isReady - true quando la pagina ha finito di caricare
 *   (per le pagine statiche passare direttamente true)
 */
export function useFooterReady(isReady) {
  const { key } = useLocation()
  const { setReadyKey } = useContext(FooterReadyContext)

  useEffect(() => {
    if (isReady) setReadyKey(key)
  }, [isReady, key, setReadyKey])
}

/** True se la pagina della navigazione corrente ha segnalato di essere pronta */
export function useIsFooterReady() {
  const { key } = useLocation()
  const { readyKey } = useContext(FooterReadyContext)
  return readyKey === key
}

import { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * FooterReadyContext
 * Il footer deve comparire solo quando la pagina corrente ha finito di
 * caricare (niente footer sotto gli spinner, soprattutto da mobile).
 * Ogni pagina segnala di essere pronta con useFooterReady(isReady);
 * memorizziamo il pathname pronto, così a ogni cambio pagina il footer
 * torna automaticamente nascosto senza bisogno di reset espliciti.
 */
const FooterReadyContext = createContext({ readyPath: null, setReadyPath: () => {} })

export function FooterReadyProvider({ children }) {
  const [readyPath, setReadyPath] = useState(null)

  return (
    <FooterReadyContext.Provider value={{ readyPath, setReadyPath }}>
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
  const { pathname } = useLocation()
  const { setReadyPath } = useContext(FooterReadyContext)

  useEffect(() => {
    if (isReady) setReadyPath(pathname)
  }, [isReady, pathname, setReadyPath])
}

/** True se la pagina corrente ha segnalato di essere pronta */
export function useIsFooterReady() {
  const { pathname } = useLocation()
  const { readyPath } = useContext(FooterReadyContext)
  return readyPath === pathname
}

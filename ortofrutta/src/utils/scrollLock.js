/**
 * Blocco scroll del body compatibile con iOS Safari.
 *
 * Su iOS `overflow: hidden` sul body NON impedisce lo scroll della pagina
 * sottostante quando un modale è aperto: serve `position: fixed` sul body,
 * salvando e ripristinando la posizione di scroll.
 *
 * Il contatore permette a più modali sovrapposti di condividere il lock
 * senza ripristinare lo scroll troppo presto.
 */

let lockCount = 0
let savedScrollY = 0

export function lockBodyScroll() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY || window.pageYOffset || 0
    const body = document.body
    body.style.position = 'fixed'
    body.style.top = `-${savedScrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
  }
  lockCount++
}

export function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    const body = document.body
    body.style.position = ''
    body.style.top = ''
    body.style.left = ''
    body.style.right = ''
    body.style.width = ''
    body.style.overflow = ''
    window.scrollTo(0, savedScrollY)
  }
}

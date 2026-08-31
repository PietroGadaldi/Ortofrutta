/**
 * Rileva un dispositivo con mouse/trackpad (desktop).
 * Usato per attivare le ottimizzazioni da tastiera (autofocus, ritorno del
 * focus sul campo prodotto) senza far comparire la tastiera virtuale su mobile.
 */
export const hasPointerFine = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches

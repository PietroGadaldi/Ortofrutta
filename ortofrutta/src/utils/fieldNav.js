/**
 * Navigazione da tastiera tra i campi di inserimento (Invio = campo successivo,
 * frecce su/giù = campo precedente/successivo).
 * I campi partecipanti sono marcati con l'attributo data-kbfield e vengono
 * percorsi in ordine di documento, saltando quelli disabilitati o nascosti.
 */
export function focusAdjacentField(currentEl, direction) {
  const fields = Array.from(document.querySelectorAll('[data-kbfield]')).filter(
    (el) => !el.disabled && el.offsetParent !== null
  )
  const index = fields.indexOf(currentEl)
  if (index === -1) return false
  const target = fields[index + direction]
  if (!target) return false
  target.focus()
  return true
}

/**
 * Variante differita: lascia che React aggiorni prima il DOM (es. il campo
 * quantità viene abilitato solo dopo la scelta del prodotto) e poi sposta il focus.
 */
export function focusAdjacentFieldDeferred(currentEl, direction) {
  setTimeout(() => focusAdjacentField(currentEl, direction), 0)
}

import { Link, useLocation } from 'react-router-dom'
import { useIsFooterReady } from '../context/FooterReadyContext'
import { IconMail, IconPhone, IconWhatsApp, IconInstagram } from './icons'

// Il footer compare solo sulle pagine principali (landing e dashboard)
const FOOTER_ROUTES = ['/', '/dashboard', '/admin', '/privacy']

const socialLinks = [
  {
    href: 'https://www.instagram.com/ortofrutta.brescia',
    label: 'Instagram @ortofrutta.brescia',
    Icon: IconInstagram,
    external: true,
  },
  {
    href: 'mailto:domenico72portesi@gmail.com',
    label: 'Invia email',
    Icon: IconMail,
    external: false,
  },
  {
    href: 'tel:+393888005812',
    label: 'Chiama +39 388 800 5812',
    Icon: IconPhone,
    external: false,
  },
  {
    href: 'https://wa.me/393888005812',
    label: 'WhatsApp',
    Icon: IconWhatsApp,
    external: true,
  },
]

export function Footer() {
  const { pathname } = useLocation()
  const pageReady = useIsFooterReady()

  if (!FOOTER_ROUTES.includes(pathname)) return null

  // Il footer compare solo quando la pagina corrente ha segnalato di aver
  // finito di caricare (useFooterReady), mai sotto gli spinner di caricamento
  if (!pageReady) return null

  return (
    <footer className="bg-white border-t border-slate-200">
      {/* Sezione principale: dati aziendali centrati e spaziati */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col items-center gap-8 text-center">
          <p className="text-xl font-semibold text-verde-orto-700">
            Ortofrutta Brescia
          </p>

          <div className="flex flex-col gap-2 text-sm text-slate-600 leading-relaxed">
            <p>Magazzino: Via Ticino, 16 — int. 7</p>
            <p>25081 Bedizzole (BS)</p>
            <p>
              Tel.{' '}
              <a
                href="tel:+390304192674"
                className="hover:text-verde-orto-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verde-orto-700 rounded-sm"
              >
                030 4192674
              </a>
              {' · '}
              Cell.{' '}
              <a
                href="tel:+393888005812"
                className="hover:text-verde-orto-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verde-orto-700 rounded-sm"
              >
                388 8005812
              </a>
            </p>
            <p>P.IVA e C.F. 03977830987</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-semibold tracking-wide uppercase text-slate-600">
              Seguici
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ href, label, Icon, external }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  title={label}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="w-11 h-11 rounded-md flex items-center justify-center bg-verde-orto-700 text-white transition-colors hover:bg-verde-orto-600 active:bg-verde-orto-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verde-orto-700 focus-visible:ring-offset-2"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Banda inferiore: copyright, privacy e credit */}
      <div
        className="bg-verde-orto-800 text-verde-orto-100"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center gap-2 text-center text-xs leading-relaxed">
          <p>
            © {new Date().getFullYear()} Ortofrutta Brescia — Tutti i diritti riservati
          </p>
          <Link
            to="/privacy"
            className="text-white underline underline-offset-2 hover:text-verde-orto-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
          >
            Privacy Policy
          </Link>
          <p>by Enrico Gatta</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

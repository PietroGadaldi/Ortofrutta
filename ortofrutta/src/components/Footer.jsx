import { Link, useLocation } from 'react-router-dom'
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

  if (!FOOTER_ROUTES.includes(pathname)) return null

  return (
    <footer
      className="bg-verde-orto-800 text-verde-orto-100"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center gap-4">
        <div className="flex gap-3">
          {socialLinks.map(({ href, label, Icon, external }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              title={label}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="w-11 h-11 rounded-md flex items-center justify-center bg-verde-orto-700 text-white transition-colors hover:bg-verde-orto-600 active:bg-verde-orto-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-verde-orto-800"
            >
              <Icon className="w-5 h-5" />
            </a>
          ))}
        </div>

        <p className="text-xs sm:text-sm text-center leading-relaxed">
          Ortofrutta Brescia © {new Date().getFullYear()} — Magazzino: Via Ticino, 16 int. 7,
          25081 Bedizzole (BS) — Tel. 030 4192674 — Cell. 388 8005812 — P.IVA e C.F. 03977830987
          {' — '}
          <Link
            to="/privacy"
            className="text-white underline underline-offset-2 hover:text-verde-orto-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
          >
            Privacy
          </Link>
        </p>
      </div>
    </footer>
  )
}

export default Footer

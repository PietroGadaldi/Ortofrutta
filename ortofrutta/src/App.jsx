import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navigation from './components/Navigation'
import ProtectedRoute from './components/ProtectedRoute'
import Footer from './components/Footer'
import CookieBanner from './components/CookieBanner'
import { RUOLI } from './utils/constants'

// Pages - will be created in Fase 4, 5, 6
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminOrdersPage from './pages/AdminOrdersPage'
import Privacy from './pages/Privacy'
import Prodotti from './pages/Prodotti'
import Utenti from './pages/Utenti'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-100">
          <Navigation />
          <main
            className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1"
            style={{
              paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
              paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
              paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
            }}
          >
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Protected routes - Cliente */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole={RUOLI.CLIENTE}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes - Titolare */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole={RUOLI.TITOLARE}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ordini"
                element={
                  <ProtectedRoute requiredRole={RUOLI.TITOLARE}>
                    <AdminOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prodotti"
                element={
                  <ProtectedRoute requiredRole={RUOLI.TITOLARE}>
                    <Prodotti />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/utenti"
                element={
                  <ProtectedRoute requiredRole={RUOLI.TITOLARE}>
                    <Utenti />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <CookieBanner />
        </div>
      </AuthProvider>
    </Router>
  )
}

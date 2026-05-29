import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navigation from './components/Navigation'
import ProtectedRoute from './components/ProtectedRoute'
import { RUOLI } from './utils/constants'

// Pages - will be created in Fase 4, 5, 6
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminOrdersPage from './pages/AdminOrdersPage'
import Prodotti from './pages/Prodotti'
import Utenti from './pages/Utenti'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />

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
        </div>
      </AuthProvider>
    </Router>
  )
}

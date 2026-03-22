import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthInit } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import PortfolioPage from '@/pages/PortfolioPage'
import DividendsPage from '@/pages/DividendsPage'
import BenefitsPage from '@/pages/BenefitsPage'
import SettingsPage from '@/pages/SettingsPage'

function AppRoutes() {
  useAuthInit()
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <PortfolioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dividends"
        element={
          <ProtectedRoute>
            <DividendsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/benefits"
        element={
          <ProtectedRoute>
            <BenefitsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/dividend-app">
      <AppRoutes />
    </BrowserRouter>
  )
}

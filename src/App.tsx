import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { SchedulePage } from './pages/SchedulePage'
import { CustomersPage } from './pages/CustomersPage'
import { CustomerFormPage } from './pages/CustomerFormPage'
import { InvoicesPage } from './pages/InvoicesPage'
import { InvoiceFormPage } from './pages/InvoiceFormPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { MorePage } from './pages/MorePage'
import { JobFormPage } from './pages/JobFormPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { EquipmentPage } from './pages/EquipmentPage'
import { SettingsPage } from './pages/SettingsPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { EstimatesPage } from './pages/EstimatesPage'
import { MaintenancePage } from './pages/MaintenancePage'
import { TeamPage } from './pages/TeamPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
})

function SetupScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">🌿</div>
      <h1 className="text-2xl font-bold text-white mb-2">Morgan Lawn Services</h1>
      <p className="text-gray-400 text-sm mb-6 max-w-sm">
        Almost ready! The app needs your Supabase credentials to connect to the database.
      </p>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-left max-w-sm w-full space-y-2">
        <p className="text-green-400 text-sm font-semibold">Setup Steps:</p>
        <ol className="text-gray-300 text-sm space-y-1.5 list-decimal list-inside">
          <li>Go to your GitHub repo Settings</li>
          <li>Click <span className="text-white font-medium">Secrets and variables → Actions</span></li>
          <li>Add <code className="bg-gray-800 px-1 rounded text-green-300">VITE_SUPABASE_URL</code></li>
          <li>Add <code className="bg-gray-800 px-1 rounded text-green-300">VITE_SUPABASE_ANON_KEY</code></li>
          <li>Re-run the GitHub Actions workflow</li>
        </ol>
      </div>
    </div>
  )
}

function ProtectedRoutes() {
  const { session, loading, configured } = useAuth()

  if (!configured) return <SetupScreen />

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  )

  if (!session) return <Navigate to="/login" replace />
  return <AppLayout />
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter basename="/lawncaremanager">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<ProtectedRoutes />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/new" element={<CustomerFormPage />} />
                <Route path="/customers/:id" element={<CustomerFormPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/new" element={<InvoiceFormPage />} />
                <Route path="/invoices/:id" element={<InvoiceFormPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/more" element={<MorePage />} />
                <Route path="/jobs/new" element={<JobFormPage />} />
                <Route path="/jobs/:id" element={<JobFormPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/expenses/new" element={<ExpensesPage />} />
                <Route path="/estimates" element={<EstimatesPage />} />
                <Route path="/equipment" element={<EquipmentPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              <Route path="/team" element={<TeamPage />} />
                <Route path="/recurring" element={<SchedulePage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

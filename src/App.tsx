import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
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

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
})

function ProtectedRoutes() {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return <AppLayout />
}

export default function App() {
  return (
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
              <Route path="/recurring" element={<SchedulePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

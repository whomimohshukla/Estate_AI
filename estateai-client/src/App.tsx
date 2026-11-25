import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthLayout } from './components/layout/AuthLayout'
import { AuthSessionLoader } from './components/layout/AuthSessionLoader'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { SiteLayout } from './components/layout/SiteLayout'
import { useAuthStore } from './store/auth-store'

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const PropertyListingsPage = lazy(() => import('./pages/PropertyListingsPage').then((module) => ({ default: module.PropertyListingsPage })))
const PropertyDetailsPage = lazy(() => import('./pages/PropertyDetailsPage').then((module) => ({ default: module.PropertyDetailsPage })))
const AiSearchPage = lazy(() => import('./pages/AiSearchPage').then((module) => ({ default: module.AiSearchPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
const LoginPage = lazy(() => import('./pages/auth/AuthPages').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/auth/AuthPages').then((module) => ({ default: module.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('./pages/auth/AuthPages').then((module) => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/auth/AuthPages').then((module) => ({ default: module.ResetPasswordPage })))
const ChatPage = lazy(() => import('./pages/ai/AiPages').then((module) => ({ default: module.ChatPage })))
const ComparePage = lazy(() => import('./pages/ai/AiPages').then((module) => ({ default: module.ComparePage })))
const BuyerDashboardPage = lazy(() => import('./pages/dashboard/DashboardPages').then((module) => ({ default: module.BuyerDashboardPage })))
const AgentDashboardPage = lazy(() => import('./pages/dashboard/DashboardPages').then((module) => ({ default: module.AgentDashboardPage })))
const AdminDashboardPage = lazy(() => import('./pages/dashboard/DashboardPages').then((module) => ({ default: module.AdminDashboardPage })))
const AdminAnalyticsPage = lazy(() => import('./pages/dashboard/DashboardPages').then((module) => ({ default: module.AdminAnalyticsPage })))
const NotificationsPage = lazy(() => import('./pages/dashboard/DashboardPages').then((module) => ({ default: module.NotificationsPage })))
const FavoritesPage = lazy(() => import('./pages/crm/CrmPages').then((module) => ({ default: module.FavoritesPage })))
const SavedSearchesPage = lazy(() => import('./pages/crm/CrmPages').then((module) => ({ default: module.SavedSearchesPage })))
const InquiriesPage = lazy(() => import('./pages/crm/CrmPages').then((module) => ({ default: module.InquiriesPage })))
const LeadsPage = lazy(() => import('./pages/crm/CrmPages').then((module) => ({ default: module.LeadsPage })))
const MyPropertiesPage = lazy(() => import('./pages/agent/MyPropertiesPage').then((module) => ({ default: module.MyPropertiesPage })))
const ApprovalsPage = lazy(() => import('./pages/admin/AdminPages').then((module) => ({ default: module.ApprovalsPage })))
const ReportsPage = lazy(() => import('./pages/admin/AdminPages').then((module) => ({ default: module.ReportsPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

function DashboardRedirect() {
  const user = useAuthStore((state) => state.user)
  const initialized = useAuthStore((state) => state.initialized)

  if (!initialized) return <div className="route-loading" role="status">Loading EstateAI…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user.role === 'AGENT') return <Navigate to="/agent" replace />
  return <Navigate to="/buyer" replace />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthSessionLoader />
        <Suspense fallback={<div className="route-loading" role="status">Loading EstateAI…</div>}>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
            </Route>
            <Route element={<SiteLayout />}>
              <Route index element={<HomePage />} />
              <Route path="search" element={<AiSearchPage />} />
              <Route path="properties" element={<PropertyListingsPage />} />
              <Route path="properties/:id" element={<PropertyDetailsPage />} />
              <Route path="dashboard" element={<DashboardRedirect />} />
              <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
              <Route path="buyer" element={<ProtectedRoute roles={['BUYER']}><BuyerDashboardPage /></ProtectedRoute>} />
              <Route path="buyer/dashboard" element={<ProtectedRoute roles={['BUYER']}><BuyerDashboardPage /></ProtectedRoute>} />
              <Route path="buyer/ai-search" element={<ProtectedRoute roles={['BUYER']}><AiSearchPage /></ProtectedRoute>} />
              <Route path="buyer/chat" element={<ProtectedRoute roles={['BUYER']}><ChatPage /></ProtectedRoute>} />
              <Route path="buyer/compare" element={<ProtectedRoute roles={['BUYER']}><ComparePage /></ProtectedRoute>} />
              <Route path="buyer/favorites" element={<ProtectedRoute roles={['BUYER']}><FavoritesPage /></ProtectedRoute>} />
              <Route path="buyer/saved-searches" element={<ProtectedRoute roles={['BUYER']}><SavedSearchesPage /></ProtectedRoute>} />
              <Route path="buyer/inquiries" element={<ProtectedRoute roles={['BUYER']}><InquiriesPage /></ProtectedRoute>} />
              <Route path="agent" element={<ProtectedRoute roles={['AGENT']}><AgentDashboardPage /></ProtectedRoute>} />
              <Route path="agent/dashboard" element={<ProtectedRoute roles={['AGENT']}><AgentDashboardPage /></ProtectedRoute>} />
              <Route path="agent/properties" element={<ProtectedRoute roles={['AGENT']}><MyPropertiesPage /></ProtectedRoute>} />
              <Route path="agent/leads" element={<ProtectedRoute roles={['AGENT']}><LeadsPage /></ProtectedRoute>} />
              <Route path="admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="admin/approvals" element={<ProtectedRoute roles={['ADMIN']}><ApprovalsPage /></ProtectedRoute>} />
              <Route path="admin/reports" element={<ProtectedRoute roles={['ADMIN']}><ReportsPage /></ProtectedRoute>} />
              <Route path="admin/analytics" element={<ProtectedRoute roles={['ADMIN']}><AdminAnalyticsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-right" richColors theme="light" closeButton />
    </QueryClientProvider>
  )
}

export default App

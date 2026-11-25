import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthLayout } from './components/layout/AuthLayout'
import { AuthSessionLoader } from './components/layout/AuthSessionLoader'
import { SiteLayout } from './components/layout/SiteLayout'

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const PropertyListingsPage = lazy(() => import('./pages/PropertyListingsPage').then((module) => ({ default: module.PropertyListingsPage })))
const PropertyDetailsPage = lazy(() => import('./pages/PropertyDetailsPage').then((module) => ({ default: module.PropertyDetailsPage })))
const AiSearchPage = lazy(() => import('./pages/AiSearchPage').then((module) => ({ default: module.AiSearchPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
const LoginPage = lazy(() => import('./pages/auth/AuthPages').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/auth/AuthPages').then((module) => ({ default: module.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('./pages/auth/AuthPages').then((module) => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/auth/AuthPages').then((module) => ({ default: module.ResetPasswordPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

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

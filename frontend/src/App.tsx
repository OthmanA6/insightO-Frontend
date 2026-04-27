import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import LoginPage from '@/features/Auth/pages/LoginPage'
import RegisterPage from '@/features/Auth/pages/RegisterPage'
import ForgotPasswordPage from '@/features/Auth/pages/ForgotPasswordPage'
import { MainLayout } from './layout/MainLayout'
import DashboardPlaceholder from '@/features/Auth/pages/DashboardPlaceholder'
import FormsSurveysPage from '@/features/Forms/pages/FormsSurveysPage'
import FormBuilderPage from '@/features/FormBuilder/pages/FormBuilderPage'


// import { Button } from '@/shared/components/ui/button'
// import { ThemeToggle } from '@/shared/components/ui/ThemeToggle'
// import { Modal } from '@/shared/components/ui/Modal'
// import { MainLayout } from './layout/MainLayout'



// ─── App ─────────────

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/builder" element={<FormBuilderPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<DashboardPlaceholder />} />
          <Route path="forms-surveys" element={<FormsSurveysPage />} />
          <Route path="builder" element={<Navigate to="/builder" replace />} />
          <Route path="analytics" element={<div className="p-6">Analytics coming soon.</div>} />
          <Route path="settings" element={<div className="p-6">Settings coming soon.</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>




      {/* ── Sonner Toaster ─────────────────────────────────────── */}
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          },
        }}
      />
      {/* // <MainLayout /> */}
    </>
  )
}

export default App

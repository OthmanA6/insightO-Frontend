import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage'
import { MainLayout } from '@/shared/components/layout/MainLayout'
import DashboardPlaceholder from '@/features/auth/pages/DashboardPlaceholder'
import FormsSurveysPage from '@/features/Forms/pages/FormsSurveysPage'
import FormBuilderPage from '@/features/FormBuilder/pages/FormBuilderPage'
import UserManagementPage from '@/features/UserManagement/pages/UserManagementPage'
import ProfilePage from '@/features/Settings/pages/ProfilePage'
import SettingsPage from '@/features/Settings/pages/SettingsPage'
import FormsResultsPage from '@/features/Forms/pages/FormsResultsPage'
import DepartmentManagementPage from '@/features/DepartmentManagement/pages/DepartmentManagementPage'
import EvaluationCyclesPage from '@/features/EvaluationCycles/pages/EvaluationCyclesPage'
import GlobalAnalyticsPage from '@/features/Analytics/pages/GlobalAnalyticsPage'
import TaskManagementPage from '@/features/TaskManagement/pages/TaskManagementPage'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/builder" element={<FormBuilderPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<DashboardPlaceholder />} />
          <Route path="forms-surveys" element={<FormsSurveysPage />} />
          <Route path="builder" element={<Navigate to="/builder" replace />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="departments" element={<DepartmentManagementPage />} />
          <Route path="evaluation-cycles" element={<EvaluationCyclesPage />} />
          <Route path="tasks" element={<TaskManagementPage />} />
          <Route path="analytics" element={<GlobalAnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="forms-results" element={<FormsResultsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
    </>
  )
}

export default App

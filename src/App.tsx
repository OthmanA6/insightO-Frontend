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
import FormResponsePage from '@/features/Forms/pages/FormResponsePage'
import PublicFormViewPage from '@/features/Forms/pages/PublicFormViewPage'
import DepartmentManagementPage from '@/features/DepartmentManagement/pages/DepartmentManagementPage'
import DepartmentDetailPage from '@/features/DepartmentManagement/pages/DepartmentDetailPage'
import EvaluationCyclesPage from '@/features/EvaluationCycles/pages/EvaluationCyclesPage'
import GlobalAnalyticsPage from '@/features/Analytics/pages/GlobalAnalyticsPage'
import CourseTasksView from '@/features/TaskManagement/pages/CourseTasksView'
import TaskSubmissionsPage from '@/features/TaskManagement/pages/TaskSubmissionsPage'
import QuizBuilderPage from '@/features/TaskManagement/pages/QuizBuilderPage'
import SubmitQuizPage from '@/features/TaskManagement/pages/SubmitQuizPage'
import InstructorGradingPage from '@/features/TaskManagement/pages/InstructorGradingPage'
import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute'
import StudentDashboardPage from '@/features/StudentPortal/pages/StudentDashboardPage'
import StudentCoursesAndTasksPage from '@/features/StudentPortal/pages/StudentCoursesAndTasksPage'
import MySubmissionsPage from '@/features/TaskManagement/pages/MySubmissionsPage'
import StudentSurveysPage from '@/features/StudentPortal/pages/StudentSurveysPage'
import CourseDetailView from '@/features/TaskManagement/pages/CourseDetailView'
import { useAuth } from '@/features/auth/hooks/useAuth'

import InstructorDashboardPage from '@/features/InstructorPortal/pages/InstructorDashboardPage'
import InstructorCourseManagement from '@/features/InstructorPortal/pages/InstructorCourseManagement'
import InstructorCourseDetailView from '@/features/InstructorPortal/pages/InstructorCourseDetailView'

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'STUDENT') {
    return <StudentDashboardPage />;
  }
  if (user?.role === 'INSTRUCTOR') {
    return <InstructorDashboardPage />;
  }
  return <DashboardPlaceholder />;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Form Builder routes (Protected) */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HOD', 'INSTRUCTOR']} />}>
          <Route path="/builder" element={<FormBuilderPage />} />
          <Route path="/builder/:formId" element={<FormBuilderPage />} />
        </Route>

        <Route path="/form/:formId" element={<FormResponsePage />} />
        <Route path="/public/form/:formId" element={<PublicFormViewPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Dashboard layout (Protected) */}
        <Route path="/dashboard" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<DashboardRouter />} />
          <Route path="profile" element={<ProfilePage />} />
          
          {/* Student routes */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="courses-tasks" element={<StudentCoursesAndTasksPage />} />
            <Route path="student-evaluations" element={<MySubmissionsPage />} />
            <Route path="student-surveys" element={<StudentSurveysPage />} />
            <Route path="student-courses/:courseId" element={<CourseDetailView />} />
            <Route path="submit-quiz/:taskId" element={<SubmitQuizPage />} />
          </Route>

          {/* Instructor routes */}
          <Route element={<ProtectedRoute allowedRoles={['INSTRUCTOR']} />}>
            <Route path="courses" element={<InstructorCourseManagement />} />
            <Route path="courses/:courseId" element={<InstructorCourseDetailView />} />
            <Route path="courses/:courseId/tasks/:taskId" element={<TaskSubmissionsPage />} />
            <Route path="courses/:courseId/tasks/:taskId/submissions/:submissionId/grade" element={<InstructorGradingPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HOD', 'INSTRUCTOR']} />}>
            <Route path="forms-surveys" element={<FormsSurveysPage />} />
            <Route path="builder" element={<Navigate to="/builder" replace />} />
            <Route path="quiz-builder" element={<QuizBuilderPage />} />
            <Route path="users" element={<UserManagementPage />} />

            {/* ── Hierarchical Department ➔ Course ➔ Task ➔ Submissions ── */}
            <Route path="departments" element={<DepartmentManagementPage />} />
            <Route path="departments/:departmentId" element={<DepartmentDetailPage />} />
            <Route path="departments/:departmentId/courses/:courseId" element={<CourseTasksView />} />
            <Route path="departments/:departmentId/courses/:courseId/tasks/:taskId" element={<TaskSubmissionsPage />} />
            <Route path="departments/:departmentId/courses/:courseId/tasks/:taskId/submissions/:submissionId/grade" element={<InstructorGradingPage />} />

            <Route path="evaluation-cycles" element={<EvaluationCyclesPage />} />
            <Route path="analytics" element={<GlobalAnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="forms-results/:formId" element={<FormsResultsPage />} />
          </Route>
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

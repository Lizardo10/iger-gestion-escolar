import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleProtectedRoute } from './components/auth/RoleProtectedRoute';
import { AuthProvider } from './components/auth/AuthProvider';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Teachers } from './pages/Teachers';
import { TeacherClasses } from './pages/TeacherClasses';
import { Tasks } from './pages/Tasks';
import { Events } from './pages/Events';
import { Payments } from './pages/Payments';
import { Attendance } from './pages/Attendance';
import { Profile } from './pages/Profile';
import { Enrollment } from './pages/Enrollment';
import { Chat } from './pages/Chat';
import { PaymentsSuccess } from './pages/PaymentsSuccess';
import { PaymentsCancel } from './pages/PaymentsCancel';

function App() {
  return (
    <AuthProvider>
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/payments/success" element={<PaymentsSuccess />} />
      <Route path="/payments/cancel" element={<PaymentsCancel />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route
          path="my-classes"
          element={
            <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'teacher']}>
              <TeacherClasses />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="teachers"
          element={
            <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <Teachers />
            </RoleProtectedRoute>
          }
        />
        <Route path="tasks" element={<Tasks />} />
        <Route path="events" element={<Events />} />
        <Route
          path="payments"
          element={
            <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <Payments />
            </RoleProtectedRoute>
          }
        />
              <Route
                path="attendance"
                element={
                  <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'teacher']}>
                    <Attendance />
                  </RoleProtectedRoute>
                }
              />
              <Route path="profile" element={<Profile />} />
              <Route
                path="enrollment"
                element={
                  <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'teacher']}>
                    <Enrollment />
                  </RoleProtectedRoute>
                }
              />
              <Route path="chat" element={<Chat />} />
            </Route>
      {/* Catch all - redirigir a login cualquier ruta no definida */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;


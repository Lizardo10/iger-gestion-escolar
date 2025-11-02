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
import { Tasks } from './pages/Tasks';
import { Events } from './pages/Events';
import { Payments } from './pages/Payments';
import { Attendance } from './pages/Attendance';

function App() {
  return (
    <AuthProvider>
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
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
      </Route>
      {/* Catch all - redirigir a login cualquier ruta no definida */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;


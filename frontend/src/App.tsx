import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleProtectedRoute } from './components/auth/RoleProtectedRoute';
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
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="students"
          element={
            <ProtectedRoute>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
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
    </Routes>
  );
}

export default App;


import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
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
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="events" element={<Events />} />
        <Route path="payments" element={<Payments />} />
        <Route path="attendance" element={<Attendance />} />
      </Route>
    </Routes>
  );
}

export default App;


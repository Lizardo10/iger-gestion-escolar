import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
}

export function Sidebar() {
  const { hasAnyRole } = useAuth();

  const navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['superadmin', 'admin', 'teacher', 'student'] },
    { path: '/students', label: 'Estudiantes', icon: '👥', roles: ['superadmin', 'admin', 'teacher', 'student'] },
    { path: '/tasks', label: 'Tareas', icon: '📝', roles: ['superadmin', 'admin', 'teacher', 'student'] },
    { path: '/events', label: 'Eventos', icon: '📅', roles: ['superadmin', 'admin', 'teacher', 'student'] },
    { path: '/payments', label: 'Pagos', icon: '💳', roles: ['superadmin', 'admin'] },
    { path: '/attendance', label: 'Asistencia', icon: '✅', roles: ['superadmin', 'admin', 'teacher'] },
  ];

  // Filtrar items según el rol del usuario
  const visibleItems = navItems.filter((item) => hasAnyRole(...item.roles));

  return (
    <aside className="bg-gray-50 w-64 min-h-screen p-4 border-r">
      <nav className="space-y-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}




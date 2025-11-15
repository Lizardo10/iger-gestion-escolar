import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
}

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { hasAnyRole } = useAuth();

  const navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['superadmin', 'admin', 'teacher', 'student'] },
    { path: '/students', label: 'Estudiantes', icon: '👥', roles: ['superadmin', 'admin', 'teacher', 'student'] },
    { path: '/my-classes', label: 'Mis Clases', icon: '🎓', roles: ['superadmin', 'admin', 'teacher'] },
    { path: '/teachers', label: 'Profesores', icon: '🧑‍🏫', roles: ['superadmin', 'admin'] },
    { path: '/enrollment', label: 'Inscripción', icon: '📋', roles: ['superadmin', 'admin', 'teacher'] },
    { path: '/tasks', label: 'Tareas', icon: '📝', roles: ['superadmin', 'admin', 'teacher', 'student'] },
    { path: '/events', label: 'Eventos', icon: '📅', roles: ['superadmin', 'admin', 'teacher', 'student'] },
    { path: '/payments', label: 'Pagos', icon: '💳', roles: ['superadmin', 'admin'] },
    { path: '/attendance', label: 'Asistencia', icon: '✅', roles: ['superadmin', 'admin', 'teacher'] },
    { path: '/chat', label: 'Chat AI', icon: '💬', roles: ['superadmin', 'admin', 'teacher', 'student'] },
    { path: '/profile', label: 'Mi Perfil', icon: '👤', roles: ['superadmin', 'admin', 'teacher', 'student'] },
  ];

  // Filtrar items según el rol del usuario
  const visibleItems = navItems.filter((item) => hasAnyRole(...item.roles));

  const handleNavClick = () => {
    // Cerrar sidebar en móvil cuando se hace click en un link
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <aside className="bg-gray-50 w-64 h-full p-4 border-r shadow-lg lg:shadow-none">
      <nav className="space-y-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm md:text-base">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}




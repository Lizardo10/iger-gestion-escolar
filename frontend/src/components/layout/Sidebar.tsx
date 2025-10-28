import { NavLink } from 'react-router-dom';

export function Sidebar() {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/students', label: 'Estudiantes', icon: '👥' },
    { path: '/tasks', label: 'Tareas', icon: '📝' },
    { path: '/events', label: 'Eventos', icon: '📅' },
    { path: '/payments', label: 'Pagos', icon: '💳' },
  ];

  return (
    <aside className="bg-gray-50 w-64 min-h-screen p-4 border-r">
      <nav className="space-y-2">
        {navItems.map((item) => (
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




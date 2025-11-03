import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Botón hamburger para móvil */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Iger Logo - Oso y Pingüino" className="h-10 md:h-14 w-auto" />
            <h1 className="text-xl md:text-2xl font-bold text-primary-600 hidden sm:inline">Iger</h1>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <span className="hidden md:inline text-sm text-gray-600">Sistema de Gestión Escolar</span>
          {user && (
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={`${user.firstName} ${user.lastName}`}
            >
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                {user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                {user.lastName?.[0]?.toUpperCase() || ''}
              </div>
              <span className="hidden lg:inline text-sm text-gray-700">
                {user.firstName} {user.lastName}
              </span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}




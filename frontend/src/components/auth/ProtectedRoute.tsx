import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // CRÍTICO: Esperar a que termine de cargar
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  // CRÍTICO: Si NO está autenticado, redirigir a login INMEDIATAMENTE
  // NO permitir acceso bajo ninguna circunstancia
  if (!isAuthenticated) {
    console.log('🚫 Usuario no autenticado, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }

  // Solo mostrar children si está autenticado
  return <>{children}</>;
}



